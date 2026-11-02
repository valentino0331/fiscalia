/**
 * Document Pipeline & Advanced Legal Extraction Engine — HARDMAN
 * 
 * Pipeline documental de grado forense y producción para expedientes peruanos:
 * 1. Clasificación estricta del tipo de documento (DIGITAL, SCANNED, MIXED, PROTECTED, DAMAGED, EMPTY, DOCX, IMAGE).
 * 2. Extracción digital nativa con preservación de folios judiciales: `--- [FOLIO / PÁGINA X de N] ---`.
 * 3. Supresión determinista de ruidos TrueType de pdf.js (`Warning: TT: undefined function: 32`).
 * 4. Control de calidad multi-dimensional (densidad de caracteres por página, palabras útiles, ratio de cobertura).
 * 5. Control de calidad estricto: Una extracción con baja densidad (< 70 chars/pág en expedientes) se clasifica como DEFICIENT/SCANNED y se marca como NEEDS_REVIEW, nunca como falsamente exitosa.
 * 6. Estados de procesamiento formal: UPLOADED, EXTRACTING, OCR_REQUIRED, PROCESSING, PARTIALLY_PROCESSED, PROCESSED, NEEDS_REVIEW, FAILED.
 * 7. Deduplicación por hash SHA-256 para evitar reprocesamiento y saturación de memoria.
 * 8. Independiente de modelos generativos de IA (no utiliza Gemini ni OpenRouter para OCR).
 */

import crypto from 'crypto';

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
  processingMethod: 'NATIVE_DIGITAL' | 'OFFICE_MAMMOTH' | 'SPECIALIZED_OCR' | 'FALLBACK';
  executionDurationMs: number;
  errorMessage?: string;
}

// Caché en memoria para evitar reprocesar documentos idénticos tras reintentos
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

    // Filtrar mensajes de bajo nivel generados por fuentes TrueType en pdfjs
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
      return {
        documentId: `doc-${Date.now()}`,
        sha256Hash,
        originalFileName: originalName,
        mimeType,
        documentType: 'IMAGE',
        status: 'NEEDS_REVIEW',
        pageCount: 1,
        extractedText: `[Imagen adjunta: ${originalName}] Se adjuntó una imagen fotográfica. Para mayor fidelidad procesal, adjunte el PDF o pegue el texto.`,
        qualityMetrics: this.evaluateQuality(1, [`[Imagen adjunta: ${originalName}]`]),
        processingMethod: 'SPECIALIZED_OCR',
        executionDurationMs: Date.now() - startTime,
      };
    }

    // ── PROCESAMIENTO DE EXPEDIENTES PDF NATIVOS ──
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

    const quality = this.evaluateQuality(detectedTotalPages, pageTexts);
    let extractedText = pageTexts.map((pt, i) => `\n--- [FOLIO / PÁGINA ${i + 1} de ${detectedTotalPages}] ---\n${pt}\n`).join('\n').trim();

    // Determinación de estado según la compuerta de calidad
    let finalStatus: DocumentProcessingStatus = 'PROCESSED';
    let docType: DocumentType = 'PDF_DIGITAL';

    if (extractedText.length < 50) {
      finalStatus = 'FAILED';
      docType = 'PDF_DAMAGED';
    } else if (quality.qualityGrade === 'DEFICIENT' || quality.scannedPagesCount > quality.processedPages) {
      // Caso 98 páginas con 3,122 caracteres: Densidad deficiente (< 70 chars/página)
      finalStatus = 'NEEDS_REVIEW';
      docType = quality.scannedPagesCount === detectedTotalPages ? 'PDF_SCANNED' : 'PDF_MIXED';
    } else if (quality.usefulContentRatio < 0.6) {
      finalStatus = 'PARTIALLY_PROCESSED';
      docType = 'PDF_MIXED';
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
      documentType: docType,
      status: finalStatus,
      pageCount: detectedTotalPages,
      extractedText,
      qualityMetrics: quality,
      processingMethod: 'NATIVE_DIGITAL',
      executionDurationMs: Date.now() - startTime,
    };

    if (finalStatus === 'PROCESSED' || finalStatus === 'PARTIALLY_PROCESSED' || finalStatus === 'NEEDS_REVIEW') {
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
