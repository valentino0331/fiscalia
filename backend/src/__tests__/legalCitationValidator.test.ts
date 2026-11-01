import { describe, it, expect } from 'vitest';
import { validateLegalCitations } from '../ai/legalCitationValidator';

describe('Legal Citation Validator — Auditoría de Integridad', () => {
  it('identifica y valida exitosamente el Tercer Pleno Casatorio Civil (Casación 4618-2007)', () => {
    const text = 'Conforme al Tercer Pleno Casatorio Civil y la Casación N° 4618-2007/Lima, el cónyuge perjudicado tiene derecho a una indemnización.';
    const report = validateLegalCitations(text);

    expect(report.summary.verifiedCitations).toBeGreaterThanOrEqual(1);
    const verifiedCas = report.summary.citations.find((c) => c.raw.includes('4618-2007'));
    expect(verifiedCas).toBeDefined();
    expect(verifiedCas?.status).toBe('VERIFIED');
    expect(verifiedCas?.detail).toContain('Tercer Pleno Casatorio');
  });

  it('detecta una casación inexistente y la desclasifica como UNVERIFIED_CLAIM con nota de advertencia', () => {
    const fakeText = 'Se debe aplicar la Casación N° 99999-2025/Lima que anula el régimen de visitas.';
    const report = validateLegalCitations(fakeText);

    expect(report.summary.unverifiedCitations).toBe(1);
    const unverified = report.summary.citations.find((c) => c.raw.includes('99999-2025'));
    expect(unverified).toBeDefined();
    expect(unverified?.status).toBe('UNVERIFIED_CLAIM');
    expect(report.processedText).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL');
    expect(report.processedText).toContain('Esta referencia no cuenta con verificación documental en el registro oficial');
    expect(report.processedText).toContain('[criterio jurisprudencial pendiente de verificación documental]');
    expect(report.processedText).not.toContain('la doctrina jurisprudencial uniforme');
  });

  it('detecta normas derogadas (Ley 30225) y anexa alerta de vigencia normativa (Ley 32069)', () => {
    const text = 'Interpongo recurso conforme a la Ley N° 30225 de Contrataciones del Estado ante el OSCE.';
    const report = validateLegalCitations(text);

    expect(report.summary.repealedWarnings).toBeGreaterThanOrEqual(1);
    const repealed = report.summary.citations.find((c) => c.status === 'REPEALED_NORM');
    expect(repealed).toBeDefined();
    expect(report.processedText).toContain('ALERTA DE VIGENCIA NORMATIVA (SPIJ 2026)');
    expect(report.processedText).toContain('Ley N° 32069');
  });

  it('detecta y rectifica atribución errónea (Art. 62 NCPP atribuido a defensa técnica)', () => {
    const text = 'El imputado ejerce su derecho a defensa técnica bajo el Artículo 62° del NCPP.';
    const report = validateLegalCitations(text);

    expect(report.hasBlockingErrors).toBe(true);
    const misattr = report.summary.citations.find((c) => c.status === 'CONTRADICTED');
    expect(misattr).toBeDefined();
    expect(report.processedText).toContain('RECTIFICACIÓN DOGMÁTICA DE PRECISIÓN');
    expect(report.processedText).toContain('Artículos IX del Título Preliminar, 71.2 literal c y 80° al 85° del NCPP');
  });

  it('detecta y rectifica atribución errónea (Art. 480 CPC atribuido a causales de divorcio)', () => {
    const text = 'Se demanda la causal de separación de hecho invocando el Artículo 480 del Código Procesal Civil.';
    const report = validateLegalCitations(text);

    expect(report.hasBlockingErrors).toBe(true);
    const misattr = report.summary.citations.find((c) => c.status === 'CONTRADICTED');
    expect(misattr).toBeDefined();
    expect(report.processedText).toContain('Artículo 333° del Código Civil');
  });

  it('identifica y valida Acuerdos Plenarios canónicos (AP 01-2019/CIJ-116)', () => {
    const text = 'La prisión preventiva exige sospecha grave bajo el Acuerdo Plenario N° 01-2019/CIJ-116.';
    const report = validateLegalCitations(text);

    const verifiedAp = report.summary.citations.find((c) => c.raw.includes('01-2019'));
    expect(verifiedAp).toBeDefined();
    expect(verifiedAp?.status).toBe('VERIFIED');
  });
});

