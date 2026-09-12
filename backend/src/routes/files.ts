import { Router, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

const MAX_SIZE_MB = 25;

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


      const mime = resolveMime(file.mimetype, file.originalname);
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

      const rawCandidates = [
        process.env.GEMINI_MODEL,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
      ].filter(Boolean) as string[];
      const geminiModelCandidates = [...new Set(rawCandidates)];
      let extractedText = '';
      let pageCount: number | null = null;

      if (mime === 'application/pdf') {
        const fileSizeMB = file.size / (1024 * 1024);

        if (geminiKey && fileSizeMB <= 20) {
          const genAI = new GoogleGenerativeAI(geminiKey);
          const base64 = file.buffer.toString('base64');

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
                  'Eres un asistente jurídico peruano. Extrae y transcribe con fidelidad todo el contenido relevante de este documento legal: resoluciones, artículos, considerandos, partes procesales, fechas, montos, plazos, pretensiones y decisiones. Si hay tablas, mantenlas. Responde en español y conserva la estructura del documento.',
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

        if (!extractedText) {
          // pdf-parse fallback for large files or if Gemini fails/quota exceeded
          const pdfParseModule = await import('pdf-parse');
          const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
          const data = await pdfParse(file.buffer, { max: 0 });
          extractedText = data.text || '';
          pageCount = data.numpages || null;

          if (extractedText.length > 80000) {
            extractedText = extractedText.slice(0, 80000) + `\n\n[Documento muy extenso — se muestran los primeros 80,000 caracteres de ${extractedText.length.toLocaleString()} totales]`;
          }
        }
      } else if (
        mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.toLowerCase().endsWith('.docx')
      ) {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        extractedText = result.value || '';
        if (extractedText.length > 80000) {
          extractedText = extractedText.slice(0, 80000) + '\n\n[Documento muy extenso — texto truncado]';
        }
      } else if (
        mime === 'application/msword' ||
        file.originalname.toLowerCase().endsWith('.doc')
      ) {
        return res.status(400).json({
          error: 'El formato de archivo Word 97-2003 (.doc) no es compatible directamente. Por favor guárdalo o conviértelo a formato moderno (.docx) o PDF para que nuestros especialistas legales puedan procesarlo.',
        });
      } else if (mime.startsWith('image/')) {
        if (!geminiKey) {
          return res.status(500).json({ error: 'Se requiere GEMINI_API_KEY para analizar imágenes.' });
        }

        const genAI = new GoogleGenerativeAI(geminiKey);
        const base64 = file.buffer.toString('base64');

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
                'Analiza esta imagen con detalle. Si contiene texto, documentos, resoluciones o expedientes legales, transcríbelos completos con precisión. Si es una foto de un documento, extrae todo el texto visible. Responde en español.',
              ]),
              10000,
              `Files Image ${modelName}`
            );
            extractedText = result.response.text() || '';
          } catch (imgErr) {
            console.warn(`[Files Image] Gemini (${modelName}) error:`, imgErr);
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
        fileName: file.originalname,
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
