/**
 * LEGAL VERIFICATION ENGINE — 12 ADVERSARIAL BENCHMARK TESTS & ACCEPTANCE METRICS
 * 
 * Batería de verificación forense contra alucinaciones jurídicas:
 * 1. CPP Art. 326 (Facultad y obligación de denunciar)
 * 2. CPP Art. 327 (Contenido y forma de la denuncia)
 * 3. CPP Art. 328 (Trámite de la denuncia y archivo de plano)
 * 4. Denuncia vs. Querella (Acción pública vs. privada Art. 459 NCPP)
 * 5. Plazos de diligencias preliminares (Casación Vinculante N° 02-2008/La Libertad)
 * 6. Acuerdo Plenario N° 02-2005/CJ-116 (Garantías de certeza del testimonio)
 * 7. Casación N° 02-2008/La Libertad (Verificación canónica en registro oficial)
 * 8. Jurisprudencia inventada ("Casación N° 99999-2026/Lima" -> Abstención exacta)
 * 9. Número de artículo deliberadamente incorrecto ("Art. 326-B del CPP" -> Inexistente)
 * 10. Norma parcialmente modificada / derogada (Ley 30225 vs. Ley 32069)
 * 11. Norma aplicable en el tiempo (Tempus Regit Actum: hechos 2023 vs. 2026)
 * 12. Información insuficiente para determinar norma aplicable (Protocolo de intake)
 */

import { describe, it, expect } from 'vitest';
import { validateLegalCitations } from '../ai/legalCitationValidator';
import { LegalSourceRegistry } from '../ai/legalSourceRegistry';
import { StreamingCitationFilter } from '../ai/streamingCitationFilter';
import { ResponseQualityController } from '../ai/responseQualityController';
import { JURISPRUDENCE_COMPENDIUM, NORMATIVE_REFORMS_COMPENDIUM } from '../lib/spijLegalEngine';

describe('FASE 6 — 12 Pruebas Adversariales Forenses (Legal Truth Engine)', () => {

  // Caso 1: CPP Art. 326
  it('1. CPP Art. 326 — Reconoce la facultad y deber legal de denunciar y bloquea atribuciones civiles o de coerción', () => {
    // 1.1. Verificar presencia canónica en compendio SPIJ
    const ncppNorm = NORMATIVE_REFORMS_COMPENDIUM.find(n => n.articles.includes('Art. 326 NCPP'));
    expect(ncppNorm).toBeDefined();
    expect(ncppNorm?.summary).toContain('Régimen de la Denuncia Penal');
    expect(ncppNorm?.practicalImpact).toContain('Art. 326° NCPP (Facultad y Deber de Denunciar)');

    // 1.2. Bloqueo de atribución errónea si se pretende usar Art. 326 para prisión preventiva o divorcio
    const falseAttribution = 'El investigado solicita la cesación de prisión preventiva amparándose en el Artículo 326 del Código Procesal Penal.';
    const report = validateLegalCitations(falseAttribution);
    expect(report.hasBlockingErrors).toBe(true);
    expect(report.processedText).toContain('RECTIFICACIÓN DOGMÁTICA DE PRECISIÓN');
    expect(report.processedText).toContain('regula exclusivamente la facultad y deber de denunciar penalmente');
  });

  // Caso 2: CPP Art. 327
  it('2. CPP Art. 327 — Contenido y forma de la denuncia (escrita o verbal con acta circunstanciada)', () => {
    const ncppNorm = NORMATIVE_REFORMS_COMPENDIUM.find(n => n.articles.includes('Art. 327 NCPP'));
    expect(ncppNorm).toBeDefined();
    expect(ncppNorm?.practicalImpact).toContain('Art. 327° NCPP (Contenido y Forma)');
    expect(ncppNorm?.practicalImpact).toContain('narración circunstanciada y detallada de hechos');
  });

  // Caso 3: CPP Art. 328
  it('3. CPP Art. 328 — Trámite de la denuncia penal y archivo de plano por atipicidad', () => {
    const ncppNorm = NORMATIVE_REFORMS_COMPENDIUM.find(n => n.articles.includes('Art. 328 NCPP'));
    expect(ncppNorm).toBeDefined();
    expect(ncppNorm?.practicalImpact).toContain('Art. 328° NCPP (Trámite Fiscal)');
    expect(ncppNorm?.practicalImpact).toContain('archivo de plano');
    expect(ncppNorm?.practicalImpact).toContain('queja de derecho en 5 días');
  });

  // Caso 4: Denuncia vs. Querella
  it('4. Denuncia vs. Querella — Distingue acción penal pública (Fiscalía) de acción penal privada (Juez Unipersonal / Honor)', () => {
    const ncppNorm = NORMATIVE_REFORMS_COMPENDIUM.find(n => n.articles.includes('Art. 459 NCPP'));
    expect(ncppNorm).toBeDefined();
    expect(ncppNorm?.practicalImpact).toContain('Distinción frente a la Querella (Art. 459° NCPP)');
    expect(ncppNorm?.practicalImpact).toContain('delitos privados contra el honor (injuria, calumnia, difamación Arts. 130-132 CP)');
    expect(ncppNorm?.practicalImpact).toContain('sin intervención del Ministerio Público');
  });

  // Caso 5: Plazos de diligencias preliminares
  it('5. Plazos de diligencias preliminares — Cita Casación Vinculante N° 02-2008/La Libertad y límites temporales', () => {
    const casCompendium = JURISPRUDENCE_COMPENDIUM.find(c => c.code.includes('02-2008'));
    expect(casCompendium).toBeDefined();
    expect(casCompendium?.title).toContain('plazo de las diligencias preliminares');
    expect(casCompendium?.bindingGrounds).toContain('Fundamentos Jurídicos 7 al 12');

    // Verificar en registro canónico inmutable
    const casDoc = LegalSourceRegistry.getByShortKey('02-2008');
    expect(casDoc).toBeDefined();
    expect(casDoc?.officialNumber).toBe('Casación Vinculante N° 02-2008/La Libertad');
    expect(casDoc?.bindingCharacter).toBe('precedente_vinculante');
  });

  // Caso 6: AP 02-2005/CJ-116
  it('6. AP 02-2005/CJ-116 — Verifica las 3 garantías de certeza en la declaración de la víctima', () => {
    const apDoc = LegalSourceRegistry.getByShortKey('02-2005');
    expect(apDoc).toBeDefined();
    expect(apDoc?.officialNumber).toBe('Acuerdo Plenario N° 02-2005/CJ-116');
    expect(apDoc?.relevantFJ[0].fjNumber).toBe('Fundamento Jurídico 10');

    // Verificar los 3 presupuestos materiales de certeza:
    const excerpt = apDoc?.relevantFJ[0].textExcerpt || '';
    expect(excerpt).toContain('ausencia de incredibilidad subjetiva');
    expect(excerpt).toContain('verosimilitud con corroboraciones periféricas');
    expect(excerpt).toContain('persistencia en la incriminación');
  });

  // Caso 7: Casación N° 02-2008/La Libertad
  it('7. Casación N° 02-2008/La Libertad — Verifica integridad documental, distrito judicial y hash SHA-256', () => {
    const casDoc = LegalSourceRegistry.getByShortKey('02-2008');
    expect(casDoc).toBeDefined();
    expect(casDoc?.judicialDistrict).toBe('La Libertad');
    expect(casDoc?.issuingChamber).toBe('Sala Penal Permanente de la Corte Suprema');
    expect(casDoc?.sha256Hash).toMatch(/^[a-f0-9]{64}$/);
    expect(casDoc?.verificationLevel).toBe('VERIFIED');
  });

  // Caso 8: Jurisprudencia inventada
  it('8. Jurisprudencia inventada — Clasifica "Casación N° 99999-2026/Lima" como UNVERIFIED_CLAIM y emite la frase exacta de abstención', () => {
    const hallucinatedResponse = 'Conforme a la Casación N° 99999-2026/Lima, la prescripción extraordinaria opera de pleno derecho sin pronunciamiento judicial.';
    const report = validateLegalCitations(hallucinatedResponse);

    expect(report.summary.unverifiedCitations).toBe(1);
    const fakeCas = report.summary.citations.find(c => c.raw.includes('99999-2026'));
    expect(fakeCas?.status).toBe('UNVERIFIED_CLAIM');

    // El número judicial inventado DEBE ser retirado del cuerpo
    const [body, disclaimer] = report.processedText.split('> ⚖️');
    expect(body).not.toContain('99999-2026');
    expect(body).toContain('[criterio jurisprudencial pendiente de verificación documental]');

    // Debe incluir taxativamente la frase de abstención obligatoria
    expect(disclaimer).toContain(
      'No he podido verificar esta referencia en las fuentes jurídicas disponibles. No puedo presentarla como una cita auténtica ni utilizarla como fundamento confirmado.'
    );
  });

  // Caso 9: Número de artículo deliberadamente incorrecto (Art. 326-B del CPP)
  it('9. Número de artículo deliberadamente incorrecto — Detecta que Art. 326-B del CPP no existe y lo rectifica', () => {
    const fakeArticleText = 'La víctima formuló su denuncia penal al amparo del Artículo 326-B del Código Procesal Penal.';
    const report = validateLegalCitations(fakeArticleText);

    expect(report.hasBlockingErrors).toBe(true);
    const badArticleCitation = report.summary.citations.find(c => c.status === 'CONTRADICTED' && c.raw.includes('326-B'));
    expect(badArticleCitation).toBeDefined();
    expect(badArticleCitation?.detail).toContain('no contempla el Artículo 326-B');
    expect(report.processedText).toContain('RECTIFICACIÓN NORMATIVA (LEGAL TRUTH ENGINE)');
    expect(report.processedText).toContain('no contempla el Artículo 326-B');
  });

  // Caso 10: Norma parcialmente modificada / derogada
  it('10. Norma modificada/derogada — Detecta Ley 30225 y rectifica con Ley 32069 (OECE/TCP) y D.S. 009-2025-EF', () => {
    const repealedQuery = 'Presentamos recurso de apelación bajo la Ley N° 30225 ante el Tribunal del OSCE.';
    const report = validateLegalCitations(repealedQuery);

    expect(report.summary.repealedWarnings).toBeGreaterThanOrEqual(1);
    const repealed = report.summary.citations.find(c => c.status === 'REPEALED_NORM');
    expect(repealed).toBeDefined();
    expect(report.processedText).toContain('ALERTA DE VIGENCIA NORMATIVA (SPIJ 2026)');
    expect(report.processedText).toContain('Ley N° 32069');
    expect(report.processedText).toContain('OECE');
  });

  // Caso 11: Norma aplicable en el tiempo (Tempus Regit Actum)
  it('11. Norma aplicable en el tiempo — Aplica Ley 30225 para hechos de 2023 y Ley 32069 para 2026', () => {
    // Para hechos ocurridos en 2023:
    const validity2023 = LegalSourceRegistry.resolveTemporalValidity('Ley de Contrataciones 30225', '2023-05-10');
    expect(validity2023.isCurrentActive).toBe(false);
    expect(validity2023.governingNorm).toContain('Ley N° 30225');
    expect(validity2023.note).toContain('tempus regit actum');

    // Para hechos ocurridos en 2026:
    const validity2026 = LegalSourceRegistry.resolveTemporalValidity('Ley de Contrataciones 30225', '2026-02-15');
    expect(validity2026.isCurrentActive).toBe(true);
    expect(validity2026.governingNorm).toContain('Ley N° 32069');
  });

  // Caso 12: Información insuficiente para determinar norma aplicable
  it('12. Información insuficiente — Activa advertencia de rigor procesal y no emite aseveraciones temerarias', () => {
    // Si se consulta un escrito judicial solicitando reconvención pero la contestación omite formularla
    const dualDraftingQuery = 'Contéstame la demanda y formula la reconvención.';
    const incompleteDraftResponse = 'SEÑOR JUEZ: Por el presente escrito absolvemos la demanda contestando la misma en todos sus extremos.';
    const qualityResult = ResponseQualityController.evaluateResponse(incompleteDraftResponse, dualDraftingQuery, true);

    // Debe advertir la falta de formulación de reconvención formal bajo Art. 445 CPC
    expect(qualityResult.isValid).toBe(true);
    expect(qualityResult.warnings.some(w => w.toUpperCase().includes('RECONVENCIÓN'))).toBe(true);
    expect(qualityResult.processedText).toContain('OBSERVACIÓN DE RIGOR PROCESAL');
    expect(qualityResult.processedText).toContain('Art. 445° del Código Procesal Civil');
  });
});

describe('FASE 7 — Criterios de Aceptación Cuantitativos (Acceptance Metrics)', () => {
  it('evalúa métricas de exactitud articular, contenido, vigencia y tasa de abstención', () => {
    const testCases = [
      { text: 'Conforme al Artículo 2500 del Código Civil', expectedStatus: 'CONTRADICTED' },
      { text: 'Conforme al Artículo 326-B del Código Procesal Penal', expectedStatus: 'CONTRADICTED' },
      { text: 'Conforme a la Casación N° 99999-2026/Lima', expectedStatus: 'UNVERIFIED_CLAIM' },
      { text: 'Conforme a la Ley N° 30225 de Contrataciones', expectedStatus: 'REPEALED_NORM' },
      { text: 'Conforme a la Casación N° 4664-2010/Puno en indemnización por divorcio', expectedStatus: 'VERIFIED' },
      { text: 'Conforme a la Casación Vinculante N° 02-2008/La Libertad sobre diligencias preliminares', expectedStatus: 'VERIFIED' },
    ];

    let correctClassifications = 0;
    let falseAffirmationsPassed = 0;

    for (const tc of testCases) {
      const report = validateLegalCitations(tc.text);
      const match = report.summary.citations.find(c => c.status === tc.expectedStatus);
      if (match) {
        correctClassifications++;
      }
      // Verificar si alguna afirmación apócrifa pasó como VERIFIED
      if (tc.expectedStatus !== 'VERIFIED') {
        const falseVerified = report.summary.citations.find(c => c.status === 'VERIFIED');
        if (falseVerified) falseAffirmationsPassed++;
      }
    }

    const accuracyRate = (correctClassifications / testCases.length) * 100;
    const falseAffirmationRate = (falseAffirmationsPassed / testCases.length) * 100;

    expect(accuracyRate).toBe(100);
    expect(falseAffirmationRate).toBe(0);
  });
});
