import { Router, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const MAX_SIZE_MB = 15;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});

export const filesRouter = Router();

function resolveMime(fileMime: string, fileName: string): string {
  if (fileMime !== 'application/octet-stream') return fileMime;
  const name = fileName.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (name.endsWith('.doc')) return 'application/msword';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.gif')) return 'image/gif';
  if (name.endsWith('.webp')) return 'image/webp';
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
      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const withTimeout = <T>(promise: Promise<T>, ms: number, errorLabel: string): Promise<T> => {
        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`[Timeout] ${errorLabel} excedió el límite de ${ms}ms`));
          }, ms);
        });
        return Promise.race([promise, timeoutPromise]).finally(() => {
          clearTimeout(timeoutId);
        });
      };

      const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
      const rawCandidates = [
        process.env.GEMINI_MODEL,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
      ].filter(Boolean) as string[];
      const geminiModelCandidates = [...new Set(rawCandidates)];
      let extractedText = '';
      let pageCount: number | null = null;

      // Helper para visión y OCR vía OpenRouter (Prioridad 1)
      const extractWithOpenRouterVision = async (base64Data: string, mimeType: string, promptText: string): Promise<string> => {
        if (!openrouterKey) return '';
        const visionModels = [
          process.env.OPENROUTER_VISION_MODEL,
          'google/gemini-2.0-flash-001',
          'meta-llama/llama-3.2-11b-vision-instruct',
        ].filter(Boolean) as string[];

        for (const vModel of visionModels) {
          try {
            console.log(`[Files OpenRouter] Analizando con modelo de visión ${vModel}...`);
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 25000);
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

      if (mime === 'application/pdf') {
        // 1. PRIORIDAD: Extracción digital instantánea y local con pdf-parse (sin latencia de red ni errores 503)
        try {
          const pdfParseModule = await import('pdf-parse');
          const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
          const data = await pdfParse(file.buffer, { max: 0 });
          const text = (data.text || '').trim();
          pageCount = data.numpages || null;
          if (text.length >= 50) {
            extractedText = text;
            console.log(`[Files] Extracción digital instantánea con pdf-parse (${extractedText.length} caracteres, ${pageCount} págs)`);
          }
        } catch (pdfErr) {
          console.warn('[Files] Error en pdf-parse digital:', pdfErr);
        }

        // 2. Si es un PDF escaneado (fotocopia sin texto digital) y pesa <= 20MB, recurrir a visión/OCR
        if (!extractedText) {
          const fileSizeMB = file.size / (1024 * 1024);
          if (fileSizeMB <= 20) {
            const base64 = file.buffer.toString('base64');
            const legalPrompt = 'Eres un asistente jurídico peruano. Extrae y transcribe con fidelidad todo el contenido relevante de este documento legal: resoluciones, artículos, considerandos, partes procesales, fechas, montos, plazos, pretensiones y decisiones. Si hay tablas, mantenlas. Responde en español y conserva la estructura del documento.';

            // Intento 1: OpenRouter Vision (Prioridad)
            if (openrouterKey) {
              extractedText = await extractWithOpenRouterVision(base64, 'application/pdf', legalPrompt);
            }

            // Intento 2: Gemini Nativo (Respaldo)
            if (!extractedText && geminiKey) {
              const genAI = new GoogleGenerativeAI(geminiKey);
              for (const modelName of geminiModelCandidates) {
                if (extractedText) break;
                try {
                  const model = genAI.getGenerativeModel({ model: modelName });
                  const result = await withTimeout(
                    model.generateContent([
                      {
                        inlineData: {
                          mimeType: 'application/pdf',
                          data: base64,
                        },
                      },
                      legalPrompt,
                    ]),
                    30000,
                    `Files PDF ${modelName}`
                  );
                  extractedText = result.response.text() || '';
                } catch (gemErr) {
                  console.warn(`[Files] Gemini (${modelName}) error:`, gemErr);
                }
              }
            }
          }
        }

        if (extractedText && extractedText.length > 80000) {
          extractedText = extractedText.slice(0, 80000) + `\n\n[Documento muy extenso — se muestran los primeros 80,000 caracteres de ${extractedText.length.toLocaleString()} totales]`;
        }
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        safeOriginalName.toLowerCase().endsWith('.docx')
      ) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value || '';
        if (extractedText.length > 80000) {
          extractedText = extractedText.slice(0, 80000) + '\n\n[Documento muy extenso — texto truncado]';
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

        // Intento 1: OpenRouter Vision (Prioridad)
        if (openrouterKey) {
          extractedText = await extractWithOpenRouterVision(base64, mime, imgPrompt);
        }

        // Intento 2: Gemini Nativo (Respaldo)
        if (!extractedText && geminiKey) {
          const genAI = new GoogleGenerativeAI(geminiKey);
          for (const modelName of geminiModelCandidates) {
            if (extractedText) break;
            try {
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await withTimeout(
                model.generateContent([
                  {
                    inlineData: {
                      mimeType: mime,
                      data: base64,
                    },
                  },
                  imgPrompt,
                ]),
                15000,
                `Files Image ${modelName}`
              );
              extractedText = result.response.text() || '';
            } catch (imgErr) {
              console.warn(`[Files Image] Gemini (${modelName}) error:`, imgErr);
            }
          }
        }

        if (!extractedText) {
          extractedText = 'No se pudo analizar la imagen.';
        }
      } else {
        return res.status(400).json({
          error: 'Formato no soportado. Usa: PDF, DOCX, DOC, PNG, JPG, JPEG, GIF o WEBP.',
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
