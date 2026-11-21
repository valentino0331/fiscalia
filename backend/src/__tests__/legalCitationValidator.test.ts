import { describe, it, expect } from 'vitest';
import { validateLegalCitations } from '../ai/legalCitationValidator';

describe('Legal Citation Validator — Auditoría de Integridad', () => {
  it('identifica y valida exitosamente el Tercer Pleno Casatorio Civil (Casación 4664-2010)', () => {
    const text = 'Conforme al Tercer Pleno Casatorio Civil y la Casación N° 4664-2010/Puno, el cónyuge perjudicado tiene derecho a una indemnización.';
    const report = validateLegalCitations(text);

    expect(report.summary.verifiedCitations).toBeGreaterThanOrEqual(1);
    const verifiedCas = report.summary.citations.find((c) => c.raw.includes('4664-2010'));
    expect(verifiedCas).toBeDefined();
    expect(verifiedCas?.status).toBe('VERIFIED');
    expect(verifiedCas?.detail).toContain('III Pleno Casatorio');
  });

  it('detecta una casación inexistente y la desclasifica como UNVERIFIED_CLAIM con nota de advertencia', () => {
    const fakeText = 'Se debe aplicar la Casación N° 99999-2025/Lima que anula el régimen de visitas.';
    const report = validateLegalCitations(fakeText);

    expect(report.summary.unverifiedCitations).toBe(1);
    const unverified = report.summary.citations.find((c) => c.raw.includes('99999-2025'));
    expect(unverified).toBeDefined();
    expect(unverified?.status).toBe('UNVERIFIED_CLAIM');
    expect(report.processedText).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL');
    expect(report.processedText).toContain('No he podido verificar esta referencia en las fuentes jurídicas disponibles');
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

  it('valida cita textual auténtica verificada contra el fundamento vinculante de la resolución (Round-Trip Grounding)', () => {
    const text = 'Conforme a la Casación N° 4664-2010/Puno en su doctrina vinculante: "En los procesos de divorcio por la causal de separación de hecho, el Juez tiene el deber de fijar de oficio una indemnización o adjudicar preferentemente bienes al cónyuge más perjudicado."';
    const report = validateLegalCitations(text);

    const verifiedCas = report.summary.citations.find((c) => c.raw.includes('4664-2010'));
    expect(verifiedCas).toBeDefined();
    expect(verifiedCas?.status).toBe('VERIFIED');
    expect(verifiedCas?.citationType).toBe('VERBATIM_QUOTE');
    expect(verifiedCas?.verbatimVerified).toBe(true);
  });

  it('una cita textual que no coincide con el registro NO se borra: se conserva y se advierte que no pudo cotejarse', () => {
    const quote = 'El cónyuge que no trabaje perderá todo derecho a alimentos y será sancionado con prisión efectiva inmediata por abandono familiar.';
    const text = `Según la Casación N° 4664-2010/Puno: "${quote}"`;
    const report = validateLegalCitations(text);

    const flagged = report.summary.citations.find((c) => c.raw.includes('4664-2010'));
    expect(flagged).toBeDefined();
    expect(flagged?.status).toBe('EXISTENCE_VERIFIED_CONTENT_UNVERIFIED');
    expect(flagged?.citationType).toBe('VERBATIM_QUOTE');
    expect(flagged?.verbatimVerified).toBe(false);
    // El texto original se conserva (el registro interno son resúmenes, no el tenor literal)
    expect(report.processedText).toContain(quote);
    expect(report.processedText).toContain('CITAS TEXTUALES SIN COTEJO LITERAL');
  });

  it('la numeración falsa 4618-2007 ya no figura como verificada y el III Pleno es la Casación 4664-2010/Puno', () => {
    const fake = validateLegalCitations('Conforme a la Casación N° 4618-2007/Lima.');
    expect(fake.summary.unverifiedCitations).toBe(1);
    const real = validateLegalCitations('Conforme a la Casación N° 4664-2010/Puno (III Pleno Casatorio).');
    expect(real.summary.verifiedCitations).toBeGreaterThanOrEqual(1);
  });

  it('las casaciones no confirmadas en fuentes oficiales (2184-2017, 3784-2014, 8453-2014, 2402-2012/Lima daño moral) no figuran como verificadas', () => {
    for (const k of ['2184-2017/Ica', '3784-2014/Tacna', '8453-2014/Lima']) {
      const r = validateLegalCitations(`Véase la Casación N° ${k}.`);
      expect(r.summary.unverifiedCitations).toBe(1);
    }
  });

  it('valida paráfrasis legítima de ratio decidendi sin exigir coincidencia literal', () => {
    const text = 'La Casación N° 4664-2010/Puno tutela al cónyuge perjudicado exigiendo que el juzgador evalúe la indemnización económica o adjudicación preferente de bienes.';
    const report = validateLegalCitations(text);

    const verifiedCas = report.summary.citations.find((c) => c.raw.includes('4664-2010'));
    expect(verifiedCas).toBeDefined();
    expect(verifiedCas?.status).toBe('VERIFIED');
    expect(verifiedCas?.citationType).toBe('RATIO_PARAPHRASE');
  });

  it('detecta y rectifica artículos inexistentes que exceden los límites de los códigos peruanos', () => {
    const text = 'Se solicita la prescripción conforme al Artículo 2500 del Código Civil y se deduce excepción bajo el Artículo 1500 del Código Procesal Civil.';
    const report = validateLegalCitations(text);

    expect(report.hasBlockingErrors).toBe(true);
    const fakeArticles = report.summary.citations.filter((c) => c.status === 'CONTRADICTED' && c.type === 'articulo');
    expect(fakeArticles.length).toBeGreaterThanOrEqual(2);
    expect(report.processedText).toContain('el ordenamiento peruano solo cuenta con 2122 artículos en esta norma');
    expect(report.processedText).toContain('el ordenamiento peruano solo cuenta con 840 artículos en esta norma');
    expect(report.processedText).toContain('RECTIFICACIÓN NORMATIVA (LEGAL TRUTH ENGINE)');
  });
});

