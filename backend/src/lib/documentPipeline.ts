/**
 * Document Pipeline & Advanced Legal OCR Engine — HARDMAN
 * 
 * Pipeline documental de grado forense y producción para expedientes peruanos:
 * 1. Clasificación estricta del tipo de documento (DIGITAL, SCANNED, MIXED, PROTECTED, DAMAGED, EMPTY).
 * 2. Extracción digital con preservación de folios: `--- [FOLIO / PÁGINA X de N] ---`.
 * 3. Supresión de logs TrueType de pdf.js (`Warning: TT: undefined function: 32`).
 * 4. Control de calidad multi-dimensional (densidad de caracteres por página, palabras útiles, ratio de cobertura).
 * 5. Conmutación inteligente a OCR Multimodal con Google Gemini Direct y OpenRouter.
 * 6. Estados de procesamiento formal: UPLOADED, EXTRACTING, OCR_REQUIRED, PROCESSING, PARTIALLY_PROCESSED, PROCESSED, NEEDS_REVIEW, FAILED.
 * 7. Deduplicación por hash SHA-256 para evitar reprocesamiento y gasto innecesario de tokens.
 */

import crypto from 'crypto';
import { ModelCatalog } from '../ai/modelCatalog';
import { AiProviderName } from '../ai/types';

export type DocumentType = 
  | 'PDF_DIGITAL' 
  | 'PDF_SCANNED' 
  | 'PDF_MIXED' 
  | 'PDF_PROTECTED' 
  | 'PDF_DAMAGED' 
  | 'PDF_EMPTY' 
  | 'DOCX' 
  | 'IMAGE';

export type DocumentProcessingStatus = 
  | 'UPLOADED' 
  | 'EXTRACTING' 
  | 'OCR_REQUIRED' 
  | 'PROCESSING' 
  | 'PARTIALLY_PROCESSED' 
  | 'PROCESSED' 
  | 'NEEDS_REVIEW' 
  | 'FAILED';

export interface DocumentQualityMetrics {
  totalPages: number;
  processedPages: number;
  emptyPages: number;
  scannedPagesCount: number;
  totalCharacters: number;
  averageCharsPerPage: number;
  usefulContentRatio: number; // 0.0 a 1.0 (proporción de páginas con texto denso)
  wordsDetected: number;
  hasTruncation: boolean;
  qualityGrade: 'EXCELLENT' | 'ACCEPTABLE' | 'DEFICIENT' | 'UNUSABLE';
  reasons: string[];
}

export interface DocumentExtractionResult {
  documentId: string;
  sha256Hash: string;
  originalFileName: string;
  mimeType: string;
  documentType: DocumentType;
  status: DocumentProcessingStatus;
  pageCount: number;
  extractedText: string;
  qualityMetrics: DocumentQualityMetrics;
  processingMethod: 'NATIVE_DIGITAL' | 'MULTIMODAL_OCR' | 'HYBRID_DIGITAL_OCR' | 'OFFICE_MAMMOTH' | 'FALLBACK';
  executionDurationMs: number;
  errorMessage?: string;
}

// Caché en memoria para evitar reprocesar documentos idénticos tras reintentos (persistente durante el ciclo de vida del proceso)
const documentCache = new Map<string, DocumentExtractionResult>();
const MAX_CACHE_ENTRIES = 100;

export class DocumentPipeline {
  private static readonly MIN_CHARS_PER_DIGITAL_PAGE = 70; // Menos de 70 caracteres promedio en legal indica página escaneada
  private static readonly MIN_TOTAL_CHARS_FOR_SUCCESS = 150;
  private static readonly MAX_PAGE_LIMIT = 500;
  private static readonly MAX_CHARS_BUDGET = 500000;

  /**
   * Calcula el hash SHA-256 de un buffer
   */
  public static computeBufferHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Clasifica la naturaleza del documento antes de la extracción
   */
  public static inspectBufferHeader(buffer: Buffer, originalName: string, mime: string): {
    documentType: DocumentType;
    isEncrypted: boolean;
  } {
    if (buffer.length === 0) {
      return { documentType: 'PDF_EMPTY', isEncrypted: false };
    }

    const header = buffer.slice(0, 1024).toString('binary');
    const isPdf = header.startsWith('%PDF-') || mime === 'application/pdf' || originalName.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const isEncrypted = header.includes('/Encrypt') || buffer.includes(Buffer.from('/Encrypt'));
      return {
        documentType: isEncrypted ? 'PDF_PROTECTED' : 'PDF_DIGITAL',
        isEncrypted,
      };
    }

    if (mime.includes('word') || originalName.toLowerCase().endsWith('.docx')) {
      return { documentType: 'DOCX', isEncrypted: false };
    }

    if (mime.startsWith('image/')) {
      return { documentType: 'IMAGE', isEncrypted: false };
    }

    return { documentType: 'PDF_DIGITAL', isEncrypted: false };
  }

  /**
   * Ejecuta pdf-parse con supresión de advertencias TrueType (evita 'Warning: TT: undefined function: 32')
   */
  private static async executePdfParseSilently(buffer: Buffer, pagerender?: any): Promise<any> {
    const originalWarn = console.warn;
    const originalError = console.error;

    // Filtrar mensajes de bajo nivel generados por fuentes TrueType defectuosas en pdfjs
    console.warn = (...args: any[]) => {
      const msg = args.map((a) => String(a)).join(' ');
      if (msg.includes('TT: undefined function') || msg.includes('Warning: TT:')) {
        return; // Silenciar opcode 32 y similares
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args: any[]) => {
      const msg = args.map((a) => String(a)).join(' ');
      if (msg.includes('TT: undefined function')) return;
      originalError.apply(console, args);
    };

    try {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
      return await pdfParse(buffer, {
        max: this.MAX_PAGE_LIMIT,
        pagerender,
      });
    } finally {
      console.warn = originalWarn;
      console.error = originalError;
    }
  }

  /**
   * Evalúa la calidad de la extracción documental
   */
  public static evaluateQuality(
    totalPages: number,
    pageTexts: string[]
  ): DocumentQualityMetrics {
    const pagesCount = Math.max(1, totalPages);
    let totalChars = 0;
    let emptyPages = 0;
    let scannedPagesCount = 0;
    let totalWords = 0;
    const reasons: string[] = [];

    pageTexts.forEach((pText) => {
      const clean = pText.trim();
      const len = clean.length;
      totalChars += len;

      if (len < 10) {
        emptyPages++;
      } else if (len < this.MIN_CHARS_PER_DIGITAL_PAGE) {
        scannedPagesCount++;
      }

      const words = clean.split(/\s+/).filter((w) => w.length >= 2);
      totalWords += words.length;
    });

    const averageCharsPerPage = Math.round(totalChars / pagesCount);
    const densePagesCount = pageTexts.filter((t) => t.trim().length >= this.MIN_CHARS_PER_DIGITAL_PAGE).length;
    const usefulContentRatio = parseFloat((densePagesCount / pagesCount).toFixed(2));

    let qualityGrade: 'EXCELLENT' | 'ACCEPTABLE' | 'DEFICIENT' | 'UNUSABLE' = 'ACCEPTABLE';

    if (totalChars < this.MIN_TOTAL_CHARS_FOR_SUCCESS) {
      qualityGrade = 'UNUSABLE';
      reasons.push(`Caracteres totales insuficientes (${totalChars} extraídos para ${pagesCount} páginas).`);
    } else if (usefulContentRatio < 0.25 && pagesCount >= 5) {
      qualityGrade = 'DEFICIENT';
      reasons.push(
        `Densidad textual muy baja: promedio de ${averageCharsPerPage} caracteres/página en expediente de ${pagesCount} páginas. Alta probabilidad de folios escaneados no digitalizados.`
      );
    } else if (usefulContentRatio >= 0.75) {
      qualityGrade = 'EXCELLENT';
    }

    if (emptyPages > pagesCount * 0.5 && pagesCount >= 4) {
      reasons.push(`Más del 50% de las páginas detectadas están en blanco o sin texto extraíble (${emptyPages}/${pagesCount}).`);
    }

    return {
      totalPages: pagesCount,
      processedPages: densePagesCount,
      emptyPages,
      scannedPagesCount,
      totalCharacters: totalChars,
      averageCharsPerPage,
      usefulContentRatio,
      wordsDetected: totalWords,
      hasTruncation: totalChars >= this.MAX_CHARS_BUDGET,
      qualityGrade,
      reasons,
    };
  }

  /**
   * Ejecuta OCR Multimodal sobre el documento completo utilizando el ModelCatalog
   */
  private static async performMultimodalOcr(
    buffer: Buffer,
    mimeType: string,
    prompt: string
  ): Promise<{ text: string; provider: string; model: string }> {
    const configuredProviders: Record<AiProviderName, boolean> = {
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      openrouter: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY),
      groq: Boolean(process.env.GROQ_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      system_unavailable: false,
      emergency_mock: false,
    };

    const eligibleModels = ModelCatalog.getOcrModels(mimeType, configuredProviders);

    for (const def of eligibleModels) {
      try {
        console.log(`[DocumentPipeline:OCR] Intentando OCR con ${def.provider} (${def.id})...`);

        if (def.provider === 'gemini') {
          const key = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').split(',')[0].trim();
          if (!key) continue;

          const base64Data = buffer.toString('base64');
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${def.id}:generateContent?key=${key}`;

          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), def.timeoutMs);

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: prompt },
                    {
                      inlineData: {
                        mimeType,
                        data: base64Data,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.0,
                maxOutputTokens: def.maxOutputTokens,
              },
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (res.ok) {
            const data: any = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (text.length >= 50) {
              console.log(`[DocumentPipeline:OCR] Éxito con ${def.id}: ${text.length} caracteres transcritos.`);
              return { text, provider: def.provider, model: def.id };
            }
          }
        } else if (def.provider === 'openrouter') {
          const key = (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '').trim();
          if (!key) continue;

          const base64Data = buffer.toString('base64');
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), def.timeoutMs);

          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${key}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://hardman.lat',
              'X-Title': 'Hardman Legal AI',
            },
            body: JSON.stringify({
              model: def.id,
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: prompt },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:${mimeType};base64,${base64Data}`,
                      },
                    },
                  ],
                },
              ],
              temperature: 0.0,
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (res.ok) {
            const data: any = await res.json();
            const text = data?.choices?.[0]?.message?.content?.trim() || '';
            if (text.length >= 50) {
              console.log(`[DocumentPipeline:OCR] Éxito con OpenRouter (${def.id}): ${text.length} caracteres.`);
              return { text, provider: def.provider, model: def.id };
            }
          }
        }
      } catch (err: any) {
        console.warn(`[DocumentPipeline:OCR] Falló candidato OCR ${def.id}:`, err?.message || err);
      }
    }

    throw new Error('Todos los proveedores multimodales de OCR configurados fallaron o no produjeron texto suficiente.');
  }

  /**
   * Procesa un archivo completo a través del pipeline documental forense
   */
  public static async processFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<DocumentExtractionResult> {
    const startTime = Date.now();
    const sha256Hash = this.computeBufferHash(fileBuffer);

    // 1. Verificar deduplicación en caché de sesión
    const cached = documentCache.get(sha256Hash);
    if (cached) {
      console.log(`[DocumentPipeline] Documento '${originalName}' recuperado de caché deduplicada (${cached.extractedText.length} caracteres).`);
      return {
        ...cached,
        executionDurationMs: Date.now() - startTime,
      };
    }

    const { documentType, isEncrypted } = this.inspectBufferHeader(fileBuffer, originalName, mimeType);

    if (isEncrypted) {
      return {
        documentId: `doc-${Date.now()}`,
        sha256Hash,
        originalFileName: originalName,
        mimeType,
        documentType: 'PDF_PROTECTED',
        status: 'FAILED',
        pageCount: 0,
        extractedText: '',
        qualityMetrics: {
          totalPages: 0,
          processedPages: 0,
          emptyPages: 0,
          scannedPagesCount: 0,
          totalCharacters: 0,
          averageCharsPerPage: 0,
          usefulContentRatio: 0,
          wordsDetected: 0,
          hasTruncation: false,
          qualityGrade: 'UNUSABLE',
          reasons: ['El archivo PDF está protegido o cifrado con contraseña y no permite lectura digital.'],
        },
        processingMethod: 'FALLBACK',
        executionDurationMs: Date.now() - startTime,
        errorMessage: 'El PDF se encuentra protegido por contraseña o restricciones de seguridad.',
      };
    }

    // ── PROCESAMIENTO DE ARCHIVOS WORD (DOCX) ──
    if (documentType === 'DOCX') {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const text = (result.value || '').trim();

        const quality = this.evaluateQuality(1, [text]);
        const extractionResult: DocumentExtractionResult = {
          documentId: `doc-${Date.now()}`,
          sha256Hash,
          originalFileName: originalName,
          mimeType,
          documentType: 'DOCX',
          status: text.length >= this.MIN_TOTAL_CHARS_FOR_SUCCESS ? 'PROCESSED' : 'NEEDS_REVIEW',
          pageCount: 1,
          extractedText: text,
          qualityMetrics: quality,
          processingMethod: 'OFFICE_MAMMOTH',
          executionDurationMs: Date.now() - startTime,
        };

        this.cacheResult(sha256Hash, extractionResult);
        return extractionResult;
      } catch (docxErr: any) {
        return {
          documentId: `doc-${Date.now()}`,
          sha256Hash,
          originalFileName: originalName,
          mimeType,
          documentType: 'DOCX',
          status: 'FAILED',
          pageCount: 0,
          extractedText: '',
          qualityMetrics: this.evaluateQuality(1, ['']),
          processingMethod: 'FALLBACK',
          executionDurationMs: Date.now() - startTime,
          errorMessage: docxErr.message,
        };
      }
    }

    // ── PROCESAMIENTO DE IMÁGENES PURAS ──
    if (documentType === 'IMAGE') {
      try {
        const ocrPrompt = 'Transcribe con total exactitud y fidelidad todo el texto visible, números de expediente o carpeta fiscal, fechas, sellos, firmas, juzgado, demandante, demandado y considerandos de esta imagen de documento legal. Devuelve exclusivamente el texto transcrito en español.';
        const ocr = await this.performMultimodalOcr(fileBuffer, mimeType, ocrPrompt);

        const quality = this.evaluateQuality(1, [ocr.text]);
        const extractionResult: DocumentExtractionResult = {
          documentId: `doc-${Date.now()}`,
          sha256Hash,
          originalFileName: originalName,
          mimeType,
          documentType: 'IMAGE',
          status: ocr.text.length >= 40 ? 'PROCESSED' : 'NEEDS_REVIEW',
          pageCount: 1,
          extractedText: ocr.text,
          qualityMetrics: quality,
          processingMethod: 'MULTIMODAL_OCR',
          executionDurationMs: Date.now() - startTime,
        };

        this.cacheResult(sha256Hash, extractionResult);
        return extractionResult;
      } catch (imgErr: any) {
        return {
          documentId: `doc-${Date.now()}`,
          sha256Hash,
          originalFileName: originalName,
          mimeType,
          documentType: 'IMAGE',
          status: 'FAILED',
          pageCount: 1,
          extractedText: '',
          qualityMetrics: this.evaluateQuality(1, ['']),
          processingMethod: 'FALLBACK',
          executionDurationMs: Date.now() - startTime,
          errorMessage: imgErr.message,
        };
      }
    }

    // ── PROCESAMIENTO DE EXPEDIENTES PDF ──
    const pageTexts: string[] = [];
    let detectedTotalPages = 1;
    let digitalExtractionSuccess = false;

    try {
      const customPagerender = async (pageData: any): Promise<string> => {
        try {
          const textContent = await pageData.getTextContent({
            normalizeWhitespace: true,
            disableCombineTextItems: false,
          });
          let lastY: any;
          let pText = '';
          for (const item of textContent.items) {
            if (item && typeof item.str === 'string') {
              const str = item.str;
              if (!str) continue;
              if (lastY === item.transform[5] || !lastY) {
                if (pText.length > 0 && !pText.endsWith(' ') && !pText.endsWith('\n') && !str.startsWith(' ')) {
                  pText += ' ';
                }
                pText += str;
              } else {
                pText += '\n' + str;
              }
              lastY = item.transform[5];
            }
          }

          const pageNum = (pageData.pageIndex ?? 0) + 1;
          const formatted = `\n--- [FOLIO / PÁGINA ${pageNum}] ---\n` + pText.trim() + '\n';
          pageTexts.push(pText.trim());

          if (typeof pageData.cleanup === 'function') {
            pageData.cleanup();
          }
          return formatted;
        } catch {
          return '';
        }
      };

      const parsedData = await this.executePdfParseSilently(fileBuffer, customPagerender);
      detectedTotalPages = parsedData?.numpages || pageTexts.length || 1;
      digitalExtractionSuccess = true;
    } catch (parseErr: any) {
      console.warn('[DocumentPipeline] Falló extracción digital directa de PDF:', parseErr?.message || parseErr);
    }

    let quality = this.evaluateQuality(detectedTotalPages, pageTexts);
    let extractedText = pageTexts.map((pt, i) => `\n--- [FOLIO / PÁGINA ${i + 1} de ${detectedTotalPages}] ---\n${pt}\n`).join('\n').trim();

    // Si la calidad es deficiente o unusable (ej. 3,122 caracteres en 98 páginas = promedio 31 chars/página),
    // CONMUTAR OBLIGATORIAMENTE A OCR MULTIMODAL
    let processingMethod: DocumentExtractionResult['processingMethod'] = 'NATIVE_DIGITAL';

    if (quality.qualityGrade === 'DEFICIENT' || quality.qualityGrade === 'UNUSABLE' || extractedText.length < this.MIN_TOTAL_CHARS_FOR_SUCCESS) {
      console.log(
        `[DocumentPipeline] Calidad digital deficiente (${quality.totalCharacters} chars en ${detectedTotalPages} págs, promedio ${quality.averageCharsPerPage} chars/pág). Conmutando a OCR Multimodal...`
      );

      try {
        const ocrPrompt = `Eres un transcriptor judicial de máxima precisión especializado en expedientes judiciales y resoluciones peruanas.
Transcribe con exactitud todo el texto de este expediente o documento escaneado.
Conserva el orden cronológico de los folios e incluye números de expediente, partes procesales, juzgado, resoluciones, considerandos y firmas.
Indica claramente la delimitación de cada folio visible: '--- [FOLIO / PÁGINA X] ---'.`;

        const ocr = await this.performMultimodalOcr(fileBuffer, 'application/pdf', ocrPrompt);

        if (ocr.text && ocr.text.length > extractedText.length) {
          extractedText = ocr.text;
          processingMethod = digitalExtractionSuccess ? 'HYBRID_DIGITAL_OCR' : 'MULTIMODAL_OCR';
          quality = this.evaluateQuality(detectedTotalPages, [ocr.text]);
        }
      } catch (ocrErr: any) {
        console.warn('[DocumentPipeline] Error en fallback OCR multimodal:', ocrErr?.message || ocrErr);
      }
    }

    // Asignación de estado final
    let finalStatus: DocumentProcessingStatus = 'PROCESSED';
    if (extractedText.length < 50) {
      finalStatus = 'FAILED';
    } else if (quality.qualityGrade === 'UNUSABLE' || quality.qualityGrade === 'DEFICIENT') {
      finalStatus = 'NEEDS_REVIEW';
    } else if (quality.usefulContentRatio < 0.6) {
      finalStatus = 'PARTIALLY_PROCESSED';
    }

    // Limitador de presupuesto de caracteres
    if (extractedText.length > this.MAX_CHARS_BUDGET) {
      extractedText = extractedText.slice(0, this.MAX_CHARS_BUDGET) + `\n\n[Expediente extenso: Se procesaron los primeros 500,000 caracteres de ${extractedText.length} totales]`;
    }

    const result: DocumentExtractionResult = {
      documentId: `doc-${Date.now()}`,
      sha256Hash,
      originalFileName: originalName,
      mimeType,
      documentType: quality.scannedPagesCount > quality.processedPages ? 'PDF_SCANNED' : (quality.scannedPagesCount > 0 ? 'PDF_MIXED' : 'PDF_DIGITAL'),
      status: finalStatus,
      pageCount: detectedTotalPages,
      extractedText,
      qualityMetrics: quality,
      processingMethod,
      executionDurationMs: Date.now() - startTime,
    };

    if (finalStatus === 'PROCESSED' || finalStatus === 'PARTIALLY_PROCESSED') {
      this.cacheResult(sha256Hash, result);
    }

    return result;
  }

  private static cacheResult(hash: string, result: DocumentExtractionResult): void {
    if (documentCache.size >= MAX_CACHE_ENTRIES) {
      const firstKey = documentCache.keys().next().value;
      if (firstKey) documentCache.delete(firstKey);
    }
    documentCache.set(hash, result);
  }

  public static clearCache(): void {
    documentCache.clear();
  }
}
