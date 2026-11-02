import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentPipeline } from '../lib/documentPipeline';

describe('DocumentPipeline & OCR Quality Validation Gate', () => {
  beforeEach(() => {
    DocumentPipeline.clearCache();
  });

  describe('Buffer Header & Encryption Inspection', () => {
    it('detects encrypted PDF headers and marks as PDF_PROTECTED', () => {
      const encryptedPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Encrypt 2 0 R /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF');
      const inspection = DocumentPipeline.inspectBufferHeader(encryptedPdfBuffer, 'expediente_cifrado.pdf', 'application/pdf');

      expect(inspection.documentType).toBe('PDF_PROTECTED');
      expect(inspection.isEncrypted).toBe(true);
    });

    it('detects normal PDF buffer as PDF_DIGITAL', () => {
      const normalPdfBuffer = Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
      const inspection = DocumentPipeline.inspectBufferHeader(normalPdfBuffer, 'resolucion.pdf', 'application/pdf');

      expect(inspection.documentType).toBe('PDF_DIGITAL');
      expect(inspection.isEncrypted).toBe(false);
    });

    it('detects DOCX and image MIME types', () => {
      const docxInspection = DocumentPipeline.inspectBufferHeader(Buffer.from('PK\x03\x04'), 'demanda.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(docxInspection.documentType).toBe('DOCX');

      const imgInspection = DocumentPipeline.inspectBufferHeader(Buffer.from('\xFF\xD8\xFF'), 'cedula.jpg', 'image/jpeg');
      expect(imgInspection.documentType).toBe('IMAGE');
    });
  });

  describe('Multi-dimensional Quality Grading', () => {
    it('correctly grades a dense digital legal document as EXCELLENT', () => {
      // 10 pages with ~1,200 chars per page
      const pageTexts = Array.from({ length: 10 }, (_, i) =>
        `VISTOS: El expediente N° 0123-2026. CONSIDERANDO: Que el demandante interpone recurso de apelación contra la Resolución N° 05 que declaró inadmisible la demanda de desalojo por falta de legitimidad para obrar activa... PÁGINA ${i + 1} `.repeat(5)
      );

      const quality = DocumentPipeline.evaluateQuality(10, pageTexts);
      expect(quality.totalPages).toBe(10);
      expect(quality.averageCharsPerPage).toBeGreaterThan(500);
      expect(quality.usefulContentRatio).toBe(1.0);
      expect(quality.qualityGrade).toBe('EXCELLENT');
      expect(quality.emptyPages).toBe(0);
    });

    it('CRITICAL ROOT CAUSE AUDIT: flags 98-page document with 3,122 characters as DEFICIENT (average 31 chars/page)', () => {
      // Reproduce exactly what Render logged: 98 pages yielding 3,122 chars
      // (~31 chars per page of headers/stamps)
      const pageTexts = Array.from({ length: 98 }, (_, i) => `Sello Juzgado Folio ${i + 1} - Firmado`);
      const totalChars = pageTexts.reduce((acc, t) => acc + t.length, 0);

      expect(totalChars).toBeGreaterThanOrEqual(3000);
      expect(totalChars).toBeLessThan(4000);

      const quality = DocumentPipeline.evaluateQuality(98, pageTexts);

      expect(quality.totalPages).toBe(98);
      expect(quality.averageCharsPerPage).toBeLessThan(70); // 31 chars/page < 70 threshold!
      expect(quality.usefulContentRatio).toBe(0.0); // 0 pages with dense digital text
      expect(quality.qualityGrade).toBe('DEFICIENT');
      expect(quality.scannedPagesCount).toBe(98); // All 98 pages identified as scanned/stamped
      expect(quality.reasons.length).toBeGreaterThan(0);
      expect(quality.reasons[0]).toContain('Densidad textual muy baja');
    });

    it('grades insufficient text as UNUSABLE', () => {
      const pageTexts = [''];
      const quality = DocumentPipeline.evaluateQuality(1, pageTexts);

      expect(quality.qualityGrade).toBe('UNUSABLE');
      expect(quality.totalCharacters).toBe(0);
    });
  });

  describe('Deduplication by SHA-256 Hash', () => {
    it('computes deterministic SHA-256 for document buffer', () => {
      const buf1 = Buffer.from('Expediente Penal 2026');
      const buf2 = Buffer.from('Expediente Penal 2026');
      const buf3 = Buffer.from('Expediente Civil 2026');

      const hash1 = DocumentPipeline.computeBufferHash(buf1);
      const hash2 = DocumentPipeline.computeBufferHash(buf2);
      const hash3 = DocumentPipeline.computeBufferHash(buf3);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});

