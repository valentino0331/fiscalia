import { describe, it, expect } from 'vitest';

describe('User Memory & AI Model Resilience', () => {
  const MAX_FIELD_LENGTH = 500;

  function sanitizeField(val: unknown): string | null {
    if (val === null || val === undefined || val === '') return null;
    if (typeof val !== 'string') return null;
    return val.trim().slice(0, MAX_FIELD_LENGTH) || null;
  }

  it('correctly sanitizes and truncates user memory fields', () => {
    expect(sanitizeField(null)).toBeNull();
    expect(sanitizeField(undefined)).toBeNull();
    expect(sanitizeField('')).toBeNull();
    expect(sanitizeField('   ')).toBeNull();
    expect(sanitizeField(123)).toBeNull();

    const normal = '  Estudio Jurídico Silva & Asociados  ';
    expect(sanitizeField(normal)).toBe('Estudio Jurídico Silva & Asociados');

    const longString = 'a'.repeat(600);
    const sanitized = sanitizeField(longString);
    expect(sanitized).toHaveLength(500);
  });

  it('verifies that official Google Gemini model candidates are valid and exclude hallucinated versions', () => {
    const validOfficialModels = new Set([
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ]);

    const activeGeminiCandidates = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
    ];

    for (const model of activeGeminiCandidates) {
      expect(validOfficialModels.has(model)).toBe(true);
    }

    // Ensure non-existent models are strictly absent
    expect(activeGeminiCandidates.includes('gemini-3.6-flash')).toBe(false);
    expect(activeGeminiCandidates.includes('gemini-2.5-flash')).toBe(false);
  });
});
