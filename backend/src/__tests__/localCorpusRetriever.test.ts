import { describe, it, expect } from 'vitest';
import { getLocalCorpusContext } from '../lib/localCorpusRetriever';
import { stripEmojis } from '../ai/textStyle';

describe('getLocalCorpusContext', () => {
  it('recupera el artículo mencionado por número (colusión, art. 384 CP)', () => {
    const ctx = getLocalCorpusContext('Explícame el artículo 384 del Código Penal sobre colusión agravada');
    expect(ctx).toContain('Artículo 384');
    expect(ctx).toContain('TEXTO NORMATIVO VERIFICADO');
  });
  it('recupera por contenido temático sin citar número (peculado)', () => {
    const ctx = getLocalCorpusContext('funcionario que se apropia de caudales o efectos cuya administración le están confiados peculado');
    expect(ctx).toContain('Peculado');
  });
  it('devuelve cadena vacía para consultas no jurídicas o sin coincidencias', () => {
    expect(getLocalCorpusContext('hola')).toBe('');
    expect(getLocalCorpusContext('receta de ceviche con limón')).toBe('');
  });
});

describe('stripEmojis', () => {
  it('elimina emojis y pictogramas conservando el texto y el formato', () => {
    const out = stripEmojis('⚠️ ADVERTENCIA: revisar ⚖️ el Art. 71 NCPP ✅\n  • punto 1 🔍');
    expect(out).not.toMatch(/[⚠⚖✅🔍]/u);
    expect(out).toContain('ADVERTENCIA: revisar');
    expect(out).toContain('\n  • punto 1');
  });
  it('no altera caracteres jurídicos como °, §, —, ©', () => {
    expect(stripEmojis('Art. 667° — § 2 ©')).toBe('Art. 667° — § 2 ©');
  });
});
