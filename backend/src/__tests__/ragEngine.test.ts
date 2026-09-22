import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getRagContext } from '../lib/ragEngine';
import { getSpijLegalGrounding } from '../lib/spijLegalEngine';

describe('RAG Engine & SPIJ Grounding Module', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getRagContext', () => {
    it('returns null if RAG_ENABLED is set to "false"', async () => {
      process.env.RAG_ENABLED = 'false';
      process.env.DATABASE_URL = 'postgresql://dummy';
      process.env.GEMINI_API_KEY = 'dummy-key';

      const result = await getRagContext('diego', '¿Cuáles son las causales de nulidad del acto jurídico en el Código Civil?');
      expect(result).toBeNull();
    });

    it('returns null if GEMINI_API_KEY and GOOGLE_API_KEY are missing', async () => {
      process.env.RAG_ENABLED = 'true';
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;
      process.env.DATABASE_URL = 'postgresql://dummy';

      const result = await getRagContext('diego', '¿Cuáles son las causales de nulidad del acto jurídico en el Código Civil?');
      expect(result).toBeNull();
    });

    it('returns null for very short queries under 20 chars', async () => {
      process.env.RAG_ENABLED = 'true';
      process.env.GEMINI_API_KEY = 'test-key';
      process.env.DATABASE_URL = 'postgresql://dummy';

      const result = await getRagContext('diego', 'Hola');
      expect(result).toBeNull();
    });
  });

  describe('getSpijLegalGrounding Fallback', () => {
    it('returns grounding context for Diego on nulidad query', () => {
      const grounding = getSpijLegalGrounding('diego', 'quiero saber sobre la nulidad de acto juridico y anulabilidad');
      expect(grounding).toContain('Art. 219 CC');
      expect(grounding).toContain('Art. 221 CC');
    });

    it('returns grounding context for Valentina on CTS and triple vacacional query', () => {
      const grounding = getSpijLegalGrounding('valentina', 'cómo se calcula la triple vacacional y el retiro de cts');
      expect(grounding).toContain('D. Leg. 713');
      expect(grounding).toContain('CTS');
    });

    it('returns grounding context for Marco on LPAG plazo de apelación', () => {
      const grounding = getSpijLegalGrounding('marco', 'cuál es el plazo para interponer recurso de apelacion o reconsideracion');
      expect(grounding).toContain('15 DÍAS HÁBILES');
      expect(grounding).toContain('D.S. 006-2026-JUS');
    });
  });
});
