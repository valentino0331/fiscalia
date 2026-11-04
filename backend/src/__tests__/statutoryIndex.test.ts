import { describe, it, expect, beforeAll } from 'vitest';
import { StatutoryIndex } from '../lib/statutoryIndex';
import { ArticleParser } from '../scripts/ingest/articleParser';
import { OfficialDownloader } from '../scripts/ingest/downloader';
import { FreshnessChecker } from '../scripts/ingest/freshnessChecker';

describe('FASE 1: Statutory Index, Official Ingestion & Grounding Pipeline', () => {
  beforeAll(async () => {
    await StatutoryIndex.initialize();
  });

  describe('StatutoryIndex Dynamic Validation', () => {
    it('rejects an impossible article number (e.g. Art. 9999 del Código Penal)', () => {
      const res = StatutoryIndex.validateArticle(9999, 'Código Penal');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('El Código Penal');
      expect(res.reason).toContain('inexistente');
    });

    it('rejects invalid article suffixes (e.g. Art. 326-B en NCPP)', () => {
      const res = StatutoryIndex.validateArticle(326, 'Nuevo Código Procesal Penal', 'B');
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('inexistente');
    });

    it('accepts legitimate existing articles within boundary (e.g. Art. 140 CC)', () => {
      const res = StatutoryIndex.validateArticle(140, 'Código Civil');
      expect(res.isValid).toBe(true);
    });

    it('accepts legitimate existing articles in NCPP within boundary (e.g. Art. 268 NCPP)', () => {
      const res = StatutoryIndex.validateArticle(268, 'NCPP');
      expect(res.isValid).toBe(true);
    });
  });

  describe('ArticleParser Integrity & Monotonicity', () => {
    it('correctly parses structured legal text into monotonic articles with SHA-256', () => {
      const sampleLaw = `
TITULO I — NORMAS GENERALES
Artículo 1.- Objeto de la ley
La presente ley tiene por objeto garantizar la tutela judicial.

Artículo 2.- Ámbito de aplicación
Se aplica a todo el territorio de la República.
Texto modificado por la Ley N° 31591.

Primera Disposición Complementaria Final
Entra en vigencia al día siguiente de su publicación.
      `;

      const parser = new ArticleParser();
      const parsed = parser.parseDocumentText(sampleLaw, 'TEST_LAW');

      expect(parsed.length).toBe(3);
      expect(parsed[0].label).toBe('Art. 1');
      expect(parsed[0].sortKey).toBe(1);
      expect(parsed[0].heading).toBe('Objeto de la ley');
      expect(parsed[0].textSha256.length).toBe(64);

      expect(parsed[1].label).toBe('Art. 2');
      expect(parsed[1].sortKey).toBe(2);
      expect(parsed[1].modifiedBy).toContain('Ley N° 31591');

      expect(parsed[2].label).toContain('Primera Disposición Complementaria Final');
      expect(parsed[2].sortKey).toBe(3);
    });

    it('throws IntegrityError if articles are empty or not monotonic', () => {
      expect(() => {
        ArticleParser.verifyIntegrity([], 'EMPTY_DOC');
      }).toThrow('no contiene artículos');

      expect(() => {
        ArticleParser.verifyIntegrity([
          { label: 'Art. 1', sortKey: 2, text: 'abc', textSha256: 'a'.repeat(64), status: 'in_force', modifiedBy: [] }
        ], 'BAD_DOC');
      }).toThrow('no monótona');
    });
  });

  describe('OfficialDownloader & SHA-256 Hashing', () => {
    it('computes exact SHA-256 hex string from Buffer', () => {
      const buf = Buffer.from('Texto oficial de prueba del SPIJ', 'utf8');
      const hash = OfficialDownloader.computeSha256(buf);
      expect(hash.length).toBe(64);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('FreshnessChecker Date & Patterns', () => {
    it('formats dates in YYYYMMDD for El Peruano', () => {
      const date = new Date(2026, 9, 31); // 31 Oct 2026
      const formatted = FreshnessChecker.formatDateElPeruano(date);
      expect(formatted).toBe('20261031');
    });
  });
});

