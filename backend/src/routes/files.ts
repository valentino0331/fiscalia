import { Router, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

import { extractLegalMetadata } from '../lib/legalMetadata';
export { extractLegalMetadata };


// Extractor multimodal con Gemini, OpenRouter y OpenAI
async function extractMultimodalContent(
  buffer: Buffer,
  mimeType: string,
  promptText: string
): Promise<string> {
  const geminiKeys = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const openrouterKey = (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '').trim();
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();

  // 1. Google Gemini Nativo (Soporta PDFs directos con OCR y todas las imágenes)
  for (const gKey of geminiKeys) {
    try {
      console.log(`[Files OCR] Intentando OCR nativo con Gemini (${mimeType})...`);
      const genAI = new GoogleGenerativeAI(gKey);
      const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'];

      for (const mName of geminiModels) {
        try {
          const model = genAI.getGenerativeModel({ model: mName });
          const base64Data = buffer.toString('base64');
          const result = await model.generateContent([
            promptText,
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
          ]);
          const text = result?.response?.text()?.trim() || '';
          if (text && text.length > 20) {
            console.log(`[Files OCR] Éxito con Gemini (${mName}): ${text.length} caracteres extraídos`);
            return text;
          }
        } catch (mErr: any) {
          console.warn(`[Files OCR] Error en modelo Gemini ${mName}:`, mErr?.message || mErr);
        }
      }
    } catch (gErr: any) {
      console.warn('[Files OCR] Error con clave Gemini:', gErr?.message || gErr);
    }
  }

  // 2. OpenRouter Multimodal (para imágenes o modelos compatibles)
  if (openrouterKey && mimeType.startsWith('image/')) {
    const orModels = [
      process.env.OPENROUTER_VISION_MODEL,
      'google/gemini-2.0-flash-001',
      'openai/gpt-4o-mini',
      'google/gemini-flash-1.5',
    ].filter(Boolean) as string[];

    const base64Data = buffer.toString('base64');

    for (const vModel of orModels) {
      try {
        console.log(`[Files OCR] Intentando OpenRouter Vision (${vModel})...`);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 45000);
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openrouterKey}`,
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
          if (text && text.length > 20) {
            console.log(`[Files OCR] Éxito con OpenRouter (${vModel}): ${text.length} caracteres`);
            return text;
          }
        } else {
          console.warn(`[Files OCR] OpenRouter ${vModel} respondió status ${res.status}`);
        }
      } catch (orErr: any) {
        console.warn(`[Files OCR] Error en OpenRouter ${vModel}:`, orErr?.message || orErr);
      }
    }
  }

  // 3. OpenAI Vision Directo
  if (openaiKey && mimeType.startsWith('image/')) {
    try {
      console.log('[Files OCR] Intentando OpenAI Vision (gpt-4o-mini)...');
      const base64Data = buffer.toString('base64');
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
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
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim() || '';
        if (text && text.length > 20) {
          console.log(`[Files OCR] Éxito con OpenAI: ${text.length} caracteres`);
          return text;
        }
      }
    } catch (oaiErr: any) {
      console.warn('[Files OCR] Error en OpenAI Vision:', oaiErr?.message || oaiErr);
    }
  }

  return '';
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT 1: /files/extract (Subida y extracción técnica de archivos y expedientes)
// ─────────────────────────────────────────────────────────────────────────────
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

      const safeOriginalName = (typeof file.originalname === 'string' && file.originalname.trim())
        ? file.originalname.replace(/[\\/]/g, '_').trim().slice(0, 255)
        : 'archivo_subido';

      const mime = resolveMime(file.mimetype, safeOriginalName);
      let extractedText = '';
      let pageCount: number | null = null;

      if (mime === 'application/pdf' || safeOriginalName.toLowerCase().endsWith('.pdf')) {
        // 1. Extracción digital rápida con pdf-parse
        try {
          const pdfParseModule = await import('pdf-parse');
          const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;

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
                  const str = item.str;
                  if (!str) continue;
                  if (lastY === item.transform[5] || !lastY) {
                    if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n') && !str.startsWith(' ')) {
                      pageText += ' ';
                    }
                    pageText += str;
                  } else {
                    pageText += '\n' + str;
                  }
                  lastY = item.transform[5];
                }
              }
              const pageNum = (pageData.pageIndex ?? 0) + 1;
              const formattedPage = `\n--- [FOLIO / PÁGINA ${pageNum}] ---\n` + pageText.trim() + '\n';
              totalChars += formattedPage.length;
              if (typeof pageData.cleanup === 'function') {
                pageData.cleanup();
              }
              return formattedPage;
            } catch {
              return '';
            }
          };

          const data = await pdfParse(file.buffer, {
            max: MAX_EXPEDIENTE_PAGES,
            pagerender: customPagerender,
          });

          const text = (data.text || '').trim();
          pageCount = data.numpages || null;
          if (text.length > 30) {
            extractedText = text;
            if (pageCount && pageCount > MAX_EXPEDIENTE_PAGES) {
              extractedText += `\n\n[Nota del Expediente: Se procesaron las primeras ${MAX_EXPEDIENTE_PAGES} páginas de un total de ${pageCount} para garantizar la máxima profundidad de análisis].`;
            }
            console.log(`[Files] Extracción digital de expediente con pdf-parse (${extractedText.length} caracteres, ${pageCount} págs)`);
          }
        } catch (pdfErr) {
          console.warn('[Files] Error en pdf-parse digital:', pdfErr);
        }

        // 2. Si pdf-parse extrajo poco o ningún texto (PDF escaneado / fotocopia), OCR con Vision
        if (!extractedText || extractedText.trim().length < 40) {
          console.log('[Files] PDF escaneado sin texto seleccionable. Iniciando OCR multimodal...');
          const ocrPrompt = 'Transcribe con total fidelidad todo el texto visible, números de expediente o carpeta fiscal, fechas, sellos, firmas, sumillas, juzgado, demandante, demandado, petitorio y considerandos de este documento legal o expediente escaneado. Responde con la transcripción íntegra en español.';
          const ocrResult = await extractMultimodalContent(file.buffer, 'application/pdf', ocrPrompt);
          if (ocrResult && ocrResult.trim().length > 20) {
            extractedText = ocrResult.trim();
            console.log(`[Files] Éxito OCR en PDF escaneado (${extractedText.length} caracteres)`);
          }
        }

        if (!extractedText || !extractedText.trim()) {
          return res.status(422).json({
            error: 'No se pudo extraer texto del PDF (el archivo parece estar protegido, vacío o es un escaneo sin resolución suficiente). Por favor intenta subirlo como imagen nítida (.png, .jpg), en formato Word (.docx) o copia el texto directamente.',
          });
        }

        if (extractedText.length > 500000) {
          extractedText = extractedText.slice(0, 500000) + `\n\n[Documento extenso — se muestran los primeros 500,000 caracteres de ${extractedText.length.toLocaleString()} totales]`;
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

        // Si el archivo DOCX contiene poco texto (ej. imágenes escaneadas dentro de Word)
        if (!extractedText || extractedText.trim().length < 40) {
          try {
            const JSZip = (await import('jszip')).default || (await import('jszip'));
            const zip = await JSZip.loadAsync(file.buffer);
            const imagePaths = Object.keys(zip.files).filter((k) =>
              /^word\/media\/.+\.(png|jpe?g|webp|gif)$/i.test(k)
            );
            if (imagePaths.length > 0) {
              console.log(`[Files] DOCX contiene ${imagePaths.length} imágenes. Ejecutando OCR...`);
              const ocrParts: string[] = [];
              for (const imgPath of imagePaths.slice(0, 6)) {
                const imgBuffer = await zip.files[imgPath].async('nodebuffer');
                const ext = imgPath.split('.').pop()?.toLowerCase() || 'png';
                const imgMime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
                const ocrPart = await extractMultimodalContent(
                  imgBuffer,
                  imgMime,
                  'Transcribe íntegro todo el texto visible, resoluciones y considerandos de esta página o documento legal escaneado.'
                );
                if (ocrPart && ocrPart.trim().length > 15) {
                  ocrParts.push(ocrPart.trim());
                }
              }
              if (ocrParts.length > 0) {
                extractedText = (extractedText ? extractedText + '\n\n' : '') + ocrParts.join('\n\n--- SIGUIENTE PÁGINA ---\n\n');
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
      } else if (
        mime === 'application/msword' ||
        safeOriginalName.toLowerCase().endsWith('.doc')
      ) {
        return res.status(400).json({
          error: 'El formato de archivo Word antiguo (.doc) no es compatible. Por favor guárdalo como .docx o PDF.',
        });
      } else if (mime.startsWith('image/')) {
        const imgPrompt = 'Analiza esta imagen con detalle. Si contiene texto, documentos, resoluciones, cédulas o expedientes legales, transcríbelos íntegros con total fidelidad en español.';
        extractedText = await extractMultimodalContent(file.buffer, mime, imgPrompt);

        if (!extractedText || !extractedText.trim()) {
          return res.status(422).json({
            error: 'No se pudo extraer texto de la imagen. Verifica que la imagen esté bien iluminada y enfocada o intenta en PDF.',
          });
        }
      } else {
        return res.status(400).json({
          error: 'Formato no soportado. Usa: PDF, DOCX, PNG, JPG, JPEG o WEBP.',
        });
      }

      const meta = extractLegalMetadata(extractedText);

      res.json({
        text: extractedText,
        fileName: safeOriginalName,
        fileType: mime,
        fileSize: file.size,
        pageCount,
        detectedExpediente: meta.detectedExpediente,
        detectedAuthority: meta.detectedAuthority,
        materia: meta.materia,
        suggestedAgentId: meta.recommendedAgentId,
      });
    } catch (error: any) {
      console.error('File extraction error:', error?.message || error);
      res.status(500).json({
        error: 'Error al procesar el archivo. Intenta con un archivo más liviano o copia el texto directamente.',
      });
    } finally {
      if (req.file) {
        req.file.buffer = Buffer.alloc(0);
      }
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT 2: /files/analyze-scanner (Escaneador Inteligente de Expedientes y Cédulas)
// ─────────────────────────────────────────────────────────────────────────────
filesRouter.post(
  '/analyze-scanner',
  requireAuth,
  requireSubscription,
  (req: any, res: Response, next: NextFunction) => {
    // Si viene como multipart/form-data con archivo
    if (req.is('multipart/form-data')) {
      upload.single('file')(req, res, (err: any) => {
        if (err) return res.status(400).json({ error: 'Error al subir el archivo: ' + err.message });
        next();
      });
    } else {
      next();
    }
  },
  async (req: any, res: Response) => {
    try {
      let rawText = '';
      let fileName = 'Documento';
      let pageCount: number | null = null;

      // Caso A: Viene como archivo
      if (req.file) {
        const file = req.file;
        fileName = file.originalname || 'Expediente';
        const mime = resolveMime(file.mimetype, fileName);

        if (mime === 'application/pdf') {
          try {
            const pdfParseModule = await import('pdf-parse');
            const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
            const data = await pdfParse(file.buffer, { max: 100 });
            rawText = (data.text || '').trim();
            pageCount = data.numpages || null;
          } catch (e) {
            console.warn('[Scanner] pdf-parse fallback a OCR:', e);
          }

          if (!rawText || rawText.length < 40) {
            rawText = await extractMultimodalContent(
              file.buffer,
              'application/pdf',
              'Transcribe con total fidelidad todo el texto visible, números de expediente o carpeta fiscal, sellos, firmas, sumillas y considerandos de este documento legal escaneado en PDF.'
            );
          }
        } else if (mime.startsWith('image/')) {
          rawText = await extractMultimodalContent(
            file.buffer,
            mime,
            'Transcribe con total fidelidad todo el texto visible, resoluciones y sellos de este documento o cédula legal escaneada.'
          );
        } else if (mime.endsWith('document') || fileName.endsWith('.docx')) {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          rawText = (result.value || '').trim();
        }
      } else if (req.body?.text) {
        rawText = String(req.body.text).trim();
        fileName = req.body.fileName || 'Texto ingresado';
      }

      if (!rawText || rawText.length < 15) {
        return res.status(422).json({
          error: 'No se pudo leer texto en el documento. Verifica que la imagen o PDF contenga texto legible o pega el contenido directamente.',
        });
      }

      // Analizar metadatos procesales con heurística base
      const meta = extractLegalMetadata(rawText);

      // Intentar enriquecer con LLM para un análisis ultra detallado si hay claves
      const geminiKeys = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
      const openrouterKey = (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '').trim();

      let aiSummary = '';
      let aiActionSteps: string[] = [];
      let aiAlertTitle = meta.alertTitle;
      let aiDeadlineText = meta.deadlineText;

      const aiPrompt = `Eres un asistente legal experto en derecho peruano. Analiza el siguiente fragmento de documento legal, resolución judicial, disposición fiscal o cédula de notificación:

"""
${rawText.slice(0, 4500)}
"""

Genera una respuesta en formato JSON estrictamente válido con los siguientes campos:
{
  "alertTitle": "Título claro y formal del documento (ej. 'Cédula N° 045-2026: Citación a Declaración Indagatoria' o 'Preaviso de Despido por Falta Grave')",
  "alertLevel": "red" (urgente/sanción/plazo fatal) | "yellow" (atención/trámite regular) | "green" (informativo),
  "expedienteNumber": "Número de expediente o carpeta fiscal exacto si aparece, o null",
  "authority": "Juzgado, Fiscalía, Sala o Entidad emisora exacta, o null",
  "deadlineText": "Plazo legal exacto y perentorio identificado para responder o actuar (ej. '6 días naturales para formular descargos' o '3 días hábiles')",
  "summary": "Explicación clara en lenguaje simple para el ciudadano/abogado (2 a 3 párrafos comprensibles sin jerga ininteligible explicando de qué trata, qué se le imputa o exige y qué consecuencias tiene)",
  "actionSteps": ["Paso concreto 1 que debe hacer hoy mismo", "Paso concreto 2", "Paso concreto 3", "Paso concreto 4"]
}`;

      // 1. Probar con Gemini
      if (geminiKeys.length > 0) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKeys[0]);
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: 'application/json' },
          });
          const result = await model.generateContent(aiPrompt);
          const jsonText = result?.response?.text()?.trim() || '';
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            if (parsed.alertTitle) aiAlertTitle = parsed.alertTitle;
            if (parsed.deadlineText) aiDeadlineText = parsed.deadlineText;
            if (parsed.summary) aiSummary = parsed.summary;
            if (Array.isArray(parsed.actionSteps) && parsed.actionSteps.length > 0) {
              aiActionSteps = parsed.actionSteps;
            }
            if (parsed.expedienteNumber && !meta.detectedExpediente) {
              meta.detectedExpediente = parsed.expedienteNumber;
            }
            if (parsed.authority && !meta.detectedAuthority) {
              meta.detectedAuthority = parsed.authority;
            }
            if (parsed.alertLevel) meta.alertLevel = parsed.alertLevel;
          }
        } catch (geminiErr: any) {
          console.warn('[Scanner AI] Error analizando con Gemini:', geminiErr?.message || geminiErr);
        }
      } else if (openrouterKey) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://hardman.lat',
              'X-Title': 'Hardman Legal AI',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash-001',
              messages: [{ role: 'user', content: aiPrompt }],
              response_format: { type: 'json_object' },
            }),
          });
          if (res.ok) {
            const data: any = await res.json();
            const content = data?.choices?.[0]?.message?.content?.trim();
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.alertTitle) aiAlertTitle = parsed.alertTitle;
              if (parsed.deadlineText) aiDeadlineText = parsed.deadlineText;
              if (parsed.summary) aiSummary = parsed.summary;
              if (Array.isArray(parsed.actionSteps) && parsed.actionSteps.length > 0) {
                aiActionSteps = parsed.actionSteps;
              }
              if (parsed.expedienteNumber && !meta.detectedExpediente) {
                meta.detectedExpediente = parsed.expedienteNumber;
              }
              if (parsed.authority && !meta.detectedAuthority) {
                meta.detectedAuthority = parsed.authority;
              }
              if (parsed.alertLevel) meta.alertLevel = parsed.alertLevel;
            }
          }
        } catch (orErr: any) {
          console.warn('[Scanner AI] Error analizando con OpenRouter:', orErr?.message || orErr);
        }
      }

      // Fallback si la IA no respondió o falló
      if (!aiSummary) {
        aiSummary = rawText.length > 100
          ? `Este documento corresponde a un acto formal emitido en el marco de un trámite legal o procesal${meta.detectedAuthority ? ` ante ${meta.detectedAuthority}` : ''}. Contiene requerimientos, disposiciones y términos que deben ser atendidos oportunamente para cautelar tus derechos y evitar apercibimientos judiciales o sanciones.`
          : 'Documento procesado correctamente. Revisa los plazos y pasos recomendados a continuación.';
      }

      if (aiActionSteps.length === 0) {
        aiActionSteps = meta.actionSteps;
      }

      res.json({
        summary: aiSummary,
        alertLevel: meta.alertLevel,
        alertTitle: aiAlertTitle,
        expedienteNumber: meta.detectedExpediente,
        authority: meta.detectedAuthority,
        materia: meta.materia,
        deadlineText: aiDeadlineText,
        actionSteps: aiActionSteps,
        recommendedAgentId: meta.recommendedAgentId,
        recommendedAgentName: meta.recommendedAgentName,
        extractedText: rawText,
        fileName,
        pageCount,
      });
    } catch (err: any) {
      console.error('[Scanner AI] Error general:', err?.message || err);
      res.status(500).json({
        error: 'Ocurrió un error al procesar el escaneo del expediente. Intenta nuevamente.',
      });
    }
  }
);
