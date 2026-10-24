import { Router, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { requireAuth } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const MAX_SIZE_MB = 100;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

export const filesRouter = Router();

function resolveMime(fileMime: string, fileName: string): string {
  const name = (fileName || '').toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.doc')) return 'application/msword';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.webp')) return 'image/webp';
  if (fileMime === 'application/x-pdf' || fileMime === 'application/acrobat') return 'application/pdf';
  return fileMime;
}

filesRouter.post(
  '/extract',
  requireAuth,
  requireSubscription,
  (req: any, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: any) => {
      if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `El archivo supera el límite de ${MAX_SIZE_MB}MB. Comprime el PDF o divídelo en partes.`,
        });
      }
      if (err) return res.status(400).json({ error: 'Error al subir el archivo: ' + err.message });
      next();
    });
  },
  async (req: any, res: Response) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'Archivo requerido' });

      // Sanitizar el nombre del archivo: solo conservar el nombre base, sin rutas
      const safeOriginalName = (typeof file.originalname === 'string' && file.originalname.trim())
        ? file.originalname.replace(/[\\/]/g, '_').trim().slice(0, 255)
        : 'archivo_subido';

      const mime = resolveMime(file.mimetype, safeOriginalName);
      const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
      let extractedText = '';
      let pageCount: number | null = null;

      // Helper para visión y OCR de imágenes y documentos vía OpenRouter (100% OpenRouter)
      const extractWithOpenRouterVision = async (base64Data: string, mimeType: string, promptText: string): Promise<string> => {
        if (!openrouterKey) {
          console.warn('[Files OpenRouter] OPENROUTER_API_KEY no configurado');
          return '';
        }
        const visionModels = [
          process.env.OPENROUTER_VISION_MODEL,
          'google/gemini-2.5-flash',
          'google/gemini-3.6-flash',
        ].filter(Boolean) as string[];

        for (const vModel of visionModels) {
          try {
            console.log(`[Files OpenRouter] Analizando documento/imagen con modelo ${vModel}...`);
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 45000);
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${openrouterKey.trim()}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://hardman.lat',
                'X-Title': 'Hardman Legal AI',
              },
              body: JSON.stringify({
                model: vModel,
                messages: [
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: promptText },
                      {
                        type: 'image_url',
                        image_url: {
                          url: `data:${mimeType};base64,${base64Data}`,
                        },
                      },
                    ],
                  },
                ],
              }),
              signal: controller.signal,
            });
            clearTimeout(timer);

            if (res.ok) {
              const data: any = await res.json();
              const text = data?.choices?.[0]?.message?.content?.trim() || '';
              if (text) {
                console.log(`[Files OpenRouter] Éxito extrayendo con ${vModel} (${text.length} caracteres)`);
                return text;
              }
            } else {
              console.warn(`[Files OpenRouter] ${vModel} respondió con status ${res.status}`);
            }
          } catch (err: any) {
            console.warn(`[Files OpenRouter] Error en ${vModel}:`, err?.message || err);
          }
        }
        return '';
      };

      if (mime === 'application/pdf' || safeOriginalName.toLowerCase().endsWith('.pdf')) {
        // 1. Extracción digital instantánea y local con pdf-parse (hasta 500 páginas con streaming per-page)
        try {
          const pdfParseModule = await import('pdf-parse');
          const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;

          // Silenciar warnings de fuentes tipográficas y TrueType de pdf.js (TT: undefined function, private use area, etc.)
          const originalLog = console.log;
          const originalWarn = console.warn;
          const originalError = console.error;
          const isPdfJSSpam = (arg: any): boolean => {
            if (typeof arg !== 'string') return false;
            return (
              arg.startsWith('Warning:') ||
              arg.includes('private use area') ||
              arg.includes('undefined function') ||
              arg.includes('TT:') ||
              arg.includes('font')
            );
          };

          console.log = (...args: any[]) => {
            if (isPdfJSSpam(args[0])) return;
            originalLog(...args);
          };
          console.warn = (...args: any[]) => {
            if (isPdfJSSpam(args[0])) return;
            originalWarn(...args);
          };
          console.error = (...args: any[]) => {
            if (isPdfJSSpam(args[0])) return;
            originalError(...args);
          };

          let totalChars = 0;
          const MAX_EXPEDIENTE_PAGES = 500;
          const MAX_CHARS_LIMIT = 500000;

          const customPagerender = async (pageData: any): Promise<string> => {
            if (totalChars >= MAX_CHARS_LIMIT) {
              if (typeof pageData.cleanup === 'function') pageData.cleanup();
              return '';
            }
            try {
              const textContent = await pageData.getTextContent({
                normalizeWhitespace: true,
                disableCombineTextItems: false,
              });
              let lastY: any;
              let pageText = '';
              for (const item of textContent.items) {
                if (item && typeof item.str === 'string') {
                  if (lastY === item.transform[5] || !lastY) {
                    pageText += item.str;
                  } else {
                    pageText += '\n' + item.str;
                  }
                  lastY = item.transform[5];
                }
              }
              totalChars += pageText.length;
              if (typeof pageData.cleanup === 'function') {
                pageData.cleanup();
              }
              return pageText;
            } catch {
              return '';
            }
          };

          let data: any;
          try {
            data = await pdfParse(file.buffer, {
              max: MAX_EXPEDIENTE_PAGES,
              pagerender: customPagerender,
            });
          } finally {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
          }

          const text = (data.text || '').trim();
          pageCount = data.numpages || null;
          if (text.length > 0) {
            extractedText = text;
            if (pageCount && pageCount > MAX_EXPEDIENTE_PAGES) {
              extractedText += `\n\n[Nota del Expediente: Se procesaron las primeras ${MAX_EXPEDIENTE_PAGES} páginas de un total de ${pageCount} para garantizar la máxima profundidad de análisis sin comprometer la respuesta].`;
            }
            console.log(`[Files] Extracción digital de expediente con pdf-parse (${extractedText.length} caracteres, ${pageCount} págs)`);
          }
        } catch (pdfErr) {
          console.warn('[Files] Error en pdf-parse digital:', pdfErr);
        }

        // 2. Si pdf-parse extrajo poco o ningún texto (PDF escaneado / fotocopia), intentar OCR con Vision
        if ((!extractedText || extractedText.trim().length < 40) && openrouterKey) {
          console.log('[Files] PDF sin capa de texto digital seleccionable. Iniciando OCR con Gemini Vision vía OpenRouter...');
          try {
            const base64Pdf = file.buffer.toString('base64');
            const ocrPrompt = 'Transcribe con total fidelidad todo el texto visible, números de expediente o carpeta fiscal, sellos, firmas, sumillas, petitorios y considerandos de este documento legal escaneado en PDF. Responde únicamente con la transcripción íntegra y ordenada en español.';
            const ocrResult = await extractWithOpenRouterVision(base64Pdf, 'application/pdf', ocrPrompt);
            if (ocrResult && ocrResult.trim().length > 30) {
              extractedText = ocrResult.trim();
              console.log(`[Files] Éxito OCR en PDF escaneado (${extractedText.length} caracteres extraídos)`);
            }
          } catch (ocrErr: any) {
            console.warn('[Files] Error en OCR de PDF:', ocrErr?.message || ocrErr);
          }
        }

        if (!extractedText || !extractedText.trim()) {
          return res.status(422).json({
            error: 'No se pudo extraer texto del PDF (el archivo parece estar vacío, dañado o es un escaneo sin resolución suficiente). Por favor intenta subirlo en formato Word (.docx), como imagen nítida (.png, .jpg) o copia el texto directamente.',
          });
        }

        if (extractedText && extractedText.length > 500000) {
          extractedText = extractedText.slice(0, 500000) + `\n\n[Documento muy extenso — se muestran los primeros 500,000 caracteres de ${extractedText.length.toLocaleString()} totales]`;
        }
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        safeOriginalName.toLowerCase().endsWith('.docx')
      ) {
        try {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          extractedText = (result.value || '').trim();
        } catch (mammothErr: any) {
          console.warn('[Files] Error en mammoth extractRawText:', mammothErr?.message || mammothErr);
        }

        // Si el archivo DOCX contiene poco o ningún texto (ej. imágenes escaneadas incrustadas dentro de Word)
        if ((!extractedText || extractedText.trim().length < 40) && openrouterKey) {
          try {
            const JSZip = (await import('jszip')).default || (await import('jszip'));
            const zip = await JSZip.loadAsync(file.buffer);
            const imagePaths = Object.keys(zip.files).filter((k) =>
              /^word\/media\/.+\.(png|jpe?g|webp|gif)$/i.test(k)
            );
            if (imagePaths.length > 0) {
              console.log(`[Files] DOCX contiene ${imagePaths.length} imágenes incrustadas. Ejecutando OCR con Vision...`);
              const ocrParts: string[] = [];
              for (const imgPath of imagePaths.slice(0, 8)) {
                const imgBuffer = await zip.files[imgPath].async('nodebuffer');
                const ext = imgPath.split('.').pop()?.toLowerCase() || 'png';
                const imgMime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
                const imgBase64 = imgBuffer.toString('base64');
                const ocrPart = await extractWithOpenRouterVision(
                  imgBase64,
                  imgMime,
                  'Transcribe íntegro todo el texto visible, resoluciones y considerandos de esta página o documento legal escaneado en Word.'
                );
                if (ocrPart && ocrPart.trim().length > 20) {
                  ocrParts.push(ocrPart.trim());
                }
              }
              if (ocrParts.length > 0) {
                extractedText = (extractedText ? extractedText + '\n\n' : '') + ocrParts.join('\n\n--- SIGUIENTE PÁGINA ---\n\n');
                console.log(`[Files] Éxito OCR de imágenes en DOCX (${extractedText.length} caracteres totales)`);
              }
            }
          } catch (docxImgErr: any) {
            console.warn('[Files] Error inspeccionando imágenes en DOCX:', docxImgErr?.message || docxImgErr);
          }
        }

        if (!extractedText || !extractedText.trim()) {
          return res.status(422).json({
            error: 'El archivo Word (.docx) no contiene texto ni imágenes legibles. Por favor verifica que contenga contenido o copia y pega el texto directamente.',
          });
        }

        if (extractedText.length > 500000) {
          extractedText = extractedText.slice(0, 500000) + '\n\n[Documento muy extenso — texto truncado a 500,000 caracteres]';
        }
      } else if (
        mime === 'application/msword' ||
        safeOriginalName.toLowerCase().endsWith('.doc')
      ) {
        return res.status(400).json({
          error: 'El formato de archivo Word 97-2003 (.doc) no es compatible directamente. Por favor guárdalo o conviértelo a formato moderno (.docx) o PDF para que nuestros especialistas legales puedan procesarlo.',
        });
      } else if (mime.startsWith('image/')) {
        const base64 = file.buffer.toString('base64');
        const imgPrompt = 'Analiza esta imagen con detalle. Si contiene texto, documentos, resoluciones o expedientes legales, transcríbelos completos con precisión. Si es una foto de un documento, extrae todo el texto visible. Responde en español.';

        if (openrouterKey) {
          extractedText = await extractWithOpenRouterVision(base64, mime, imgPrompt);
        }

        if (!extractedText || !extractedText.trim()) {
          return res.status(422).json({
            error: 'No se pudo extraer texto de la imagen. Por favor verifica que la imagen esté enfocada y sea legible o intenta en formato PDF/Word.',
          });
        }
      } else {
        return res.status(400).json({
          error: 'Formato no soportado. Usa: PDF, DOCX, PNG, JPG, JPEG, GIF o WEBP.',
        });
      }

      res.json({
        text: extractedText,
        fileName: safeOriginalName,
        fileType: mime,
        fileSize: file.size,
        pageCount,
      });
    } catch (error: any) {
      console.error('File extraction error:', error?.message || error);
      res.status(500).json({
        error: 'Error al procesar el archivo. Intenta con un archivo más pequeño o en otro formato.',
      });
    } finally {
      if (req.file) {
        req.file.buffer = Buffer.alloc(0);
      }
    }
  }
);
