import { Router, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import { ProviderAdapter } from '../ai/providerAdapter';
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

import { extractLegalMetadata, extractDatesFromText, detectContradictionsAcrossFiles } from '../lib/legalMetadata';
import { sanitizeDocumentPromptInjection } from '../lib/fileSanitizer';
export { extractLegalMetadata, sanitizeDocumentPromptInjection };


import { DocumentPipeline } from '../lib/documentPipeline';

// Extractor multimodal delegando al pipeline documental canónico
export async function extractMultimodalContent(
  buffer: Buffer,
  mimeType: string,
  promptText: string
): Promise<string> {
  const result = await DocumentPipeline.processFile(buffer, 'documento_ocr', mimeType);
  return result.extractedText;
}

export async function extractFileRaw(file: Express.Multer.File): Promise<{
  extractedText: string;
  pageCount: number | null;
  mime: string;
  safeOriginalName: string;
  documentType?: string;
  qualityMetrics?: any;
  processingMethod?: string;
  status?: string;
  sha256Hash?: string;
}> {
  const safeOriginalName = (typeof file.originalname === 'string' && file.originalname.trim())
    ? file.originalname.replace(/[\\/]/g, '_').trim().slice(0, 255)
    : 'archivo_subido';

  const mime = resolveMime(file.mimetype, safeOriginalName);

  const result = await DocumentPipeline.processFile(file.buffer, safeOriginalName, mime);

  if (result.status === 'FAILED' && !result.extractedText) {
    throw new Error(result.errorMessage || 'No se pudo extraer texto del documento.');
  }

  return {
    extractedText: result.extractedText,
    pageCount: result.pageCount,
    mime: result.mimeType,
    safeOriginalName: result.originalFileName,
    documentType: result.documentType,
    qualityMetrics: result.qualityMetrics,
    processingMethod: result.processingMethod,
    status: result.status,
    sha256Hash: result.sha256Hash,
  };
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

      const { extractedText, pageCount, mime, safeOriginalName, documentType, status, qualityMetrics, processingMethod, sha256Hash } = await extractFileRaw(file);
      const sanitization = sanitizeDocumentPromptInjection(extractedText);
      const safeText = sanitization.sanitizedText;
      const meta = extractLegalMetadata(safeText);

      res.json({
        text: safeText,
        fileName: safeOriginalName,
        fileType: mime,
        fileSize: file.size,
        pageCount,
        documentType,
        status,
        qualityMetrics,
        processingMethod,
        sha256Hash,
        detectedExpediente: meta.detectedExpediente,
        detectedAuthority: meta.detectedAuthority,
        materia: meta.materia,
        suggestedAgentId: meta.recommendedAgentId,
        injectionNeutralized: sanitization.injectionNeutralized,
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
        const extraction = await extractFileRaw(file);
        rawText = extraction.extractedText;
        fileName = extraction.safeOriginalName;
        pageCount = extraction.pageCount;
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

      // Enriquecer con Claude Sonnet 5.5 a través del adaptador central de OpenRouter
      const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);

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

      if (hasOpenRouter) {
        try {
          const aiResult = await ProviderAdapter.executeCandidate(
            {
              provider: 'openrouter',
              model: 'anthropic/claude-sonnet-5.5',
              maxTokens: 4096,
              temperature: 0.0,
              timeoutMs: 60000,
            },
            [{ role: 'user', content: aiPrompt }],
            false
          );

          let jsonContent = aiResult.text.trim();
          if (jsonContent.includes('```json')) {
            jsonContent = jsonContent.split('```json')[1].split('```')[0].trim();
          } else if (jsonContent.includes('```')) {
            jsonContent = jsonContent.split('```')[1].split('```')[0].trim();
          }

          const parsed = JSON.parse(jsonContent);
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
        } catch (claudeErr: any) {
          console.warn('[Scanner AI] Error analizando con Claude Sonnet 5.5:', claudeErr?.message || claudeErr);
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

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINT 3: /files/extract-batch (Extracción Consolidada de Múltiples Archivos y Expedientes)
// ─────────────────────────────────────────────────────────────────────────────
filesRouter.post(
  '/extract-batch',
  requireAuth,
  requireSubscription,
  (req: any, res: Response, next: NextFunction) => {
    upload.array('files', 15)(req, res, (err: any) => {
      if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `Uno de los archivos excede el límite de ${MAX_SIZE_MB}MB.` });
      }
      if (err) return res.status(400).json({ error: 'Error al subir los archivos: ' + err.message });
      next();
    });
  },
  async (req: any, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'Debes proporcionar al menos un archivo en el campo "files".' });
      }

      const processedFiles: any[] = [];
      const consolidatedSections: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const { extractedText, pageCount, mime, safeOriginalName, documentType, status, qualityMetrics, processingMethod, sha256Hash } = await extractFileRaw(file);
          const sanitization = sanitizeDocumentPromptInjection(extractedText);
          const safeText = sanitization.sanitizedText;
          const meta = extractLegalMetadata(safeText);
          const dates = extractDatesFromText(safeText);

          processedFiles.push({
            index: i + 1,
            fileName: safeOriginalName,
            fileType: mime,
            fileSize: file.size,
            pageCount,
            documentType,
            status,
            qualityMetrics,
            processingMethod,
            sha256Hash,
            detectedExpediente: meta.detectedExpediente,
            detectedAuthority: meta.detectedAuthority,
            materia: meta.materia,
            suggestedAgentId: meta.recommendedAgentId,
            injectionNeutralized: sanitization.injectionNeutralized,
            dates,
          });

          consolidatedSections.push(
            `\n\n════════════════════════════════════════════════════════════════════════════════\n` +
            `=== [DOCUMENTO ${i + 1}/${files.length}: ${safeOriginalName} | ${meta.materia || 'Materia Legal'} | ${meta.detectedAuthority || 'Autoridad'} | EXP. ${meta.detectedExpediente || 'S/N'}] ===\n` +
            `════════════════════════════════════════════════════════════════════════════════\n\n` +
            safeText
          );
        } catch (itemErr: any) {
          console.warn(`[Batch] Error procesando archivo ${i + 1}:`, itemErr.message);
          processedFiles.push({
            index: i + 1,
            fileName: file.originalname || `archivo_${i + 1}`,
            error: itemErr.message || 'Error de extracción',
          });
        } finally {
          file.buffer = Buffer.alloc(0);
        }
      }

      const successfulFiles = processedFiles.filter((f) => !f.error);
      if (successfulFiles.length === 0) {
        return res.status(422).json({
          error: 'No se pudo extraer texto de ninguno de los archivos subidos.',
          files: processedFiles,
        });
      }

      const contradictions = detectContradictionsAcrossFiles(
        successfulFiles.map((f) => ({
          fileName: f.fileName,
          meta: {
            detectedExpediente: f.detectedExpediente,
            detectedAuthority: f.detectedAuthority,
            materia: f.materia,
          },
          dates: f.dates || [],
        }))
      );

      const primaryExpediente = successfulFiles.find((f) => f.detectedExpediente)?.detectedExpediente || null;
      const primaryAuthority = successfulFiles.find((f) => f.detectedAuthority)?.detectedAuthority || null;
      const primaryAgent = successfulFiles.find((f) => f.suggestedAgentId)?.suggestedAgentId || 'marco';

      const dossierHeader =
        `════════════════════════════════════════════════════════════════════════════════\n` +
        `📂 DOSSIER CONSOLIDADO DE EXPEDIENTE JUDICIAL / CARPETA FISCAL (LOTE DE ${successfulFiles.length} DOCUMENTOS)\n` +
        `• Expediente Principal: ${primaryExpediente || 'No especificado en carátula'}\n` +
        `• Autoridad Competente: ${primaryAuthority || 'No especificada'}\n` +
        `• Especialista Recomendado: ${primaryAgent}\n` +
        (contradictions.length > 0
          ? `\n⚠️ ALERTAS DE CONTRADICCIÓN DETECTADAS:\n` + contradictions.map((c: string) => `  - ${c}`).join('\n') + '\n'
          : '') +
        `════════════════════════════════════════════════════════════════════════════════\n`;

      const fullConsolidatedText = dossierHeader + consolidatedSections.join('\n');

      res.json({
        totalFilesUploaded: files.length,
        successfulFiles: successfulFiles.length,
        files: processedFiles,
        primaryExpediente,
        primaryAuthority,
        suggestedAgentId: primaryAgent,
        contradictions,
        consolidatedText: fullConsolidatedText,
      });
    } catch (err: any) {
      console.error('[Files Batch] Error general:', err?.message || err);
      res.status(500).json({
        error: 'Ocurrió un error al procesar el lote de expedientes. Intente nuevamente.',
      });
    }
  }
);
