/**
 * Response Quality Controller — HARDMAN
 * 
 * Controlador de calidad e integridad estructural de respuestas y escritos jurídicos.
 * Supervisa:
 * 1. Cumplimiento de pronunciamiento dual (Contestación Y Reconvención).
 * 2. Estricta fidelidad dogmática en autos de subsanación (Art. 131 CPC vs Art. 132 CPC).
 * 3. Integridad del bloque ```document en solicitudes de redacción formal.
 * 4. Integración directa con LegalCitationValidator.
 */

import { QualityCheckResult } from './types';
import { validateLegalCitations } from './legalCitationValidator';
import { auditStatutoryReferences } from './statutoryGroundingAudit';

export class ResponseQualityController {
  public static evaluateResponse(
    text: string,
    userQuery: string,
    isDraftingRequest: boolean,
    groundingText?: string | null
  ): QualityCheckResult {
    const warnings: string[] = [];
    const queryLower = (userQuery || '').toLowerCase();
    const textLower = (text || '').toLowerCase();

    // 1. Ejecutar validación profunda de citas jurídicas
    const citationReport = validateLegalCitations(text);
    warnings.push(...citationReport.warnings);

    let processedText = citationReport.processedText;

    // 2. Control de Contestación Y Reconvención (Regla de Dualidad Procesal)
    const requiresDualDrafting = 
      queryLower.includes('reconvenci') && 
      (queryLower.includes('contesto') || queryLower.includes('contestaci') || queryLower.includes('demanda'));

    if (requiresDualDrafting) {
      const hasContestacion = textLower.includes('contest') || textLower.includes('absolv');
      const hasReconvencion = textLower.includes('reconvenc') || textLower.includes('reconveng') || textLower.includes('pretensión reconvencional');

      if (hasContestacion && !hasReconvencion) {
        warnings.push(' DEFICIENCIA ESTRUCTURAL DETECTADA: Se solicitó Contestación Y Reconvención, pero el documento omitió la formulación de la Reconvención.');
        processedText += `\n\n> **OBSERVACIÓN DE RIGOR PROCESAL:** Se advierte que este escrito requiere completarse con la sección autónoma de RECONVENCIÓN formal (petitorio reconvencional, fundamentos de hecho y derecho, y medios probatorios) conforme al Art. 445° del Código Procesal Civil.`;
      }
    }

    // 3. Control de Subsanación Art. 131 CPC (Firma de la Parte vs Firma del Abogado)
    const isArt131Resolution = queryLower.includes('131') || queryLower.includes('firma de dicha recurrente') || queryLower.includes('firma de la recurrente');
    if (isArt131Resolution) {
      const wronglyBlamesLawyer = 
        textLower.includes('el abogado omitió firmar') || 
        textLower.includes('falta de firma del letrado') ||
        textLower.includes('subsanar la firma del abogado');

      if (wronglyBlamesLawyer) {
        warnings.push(' ERROR DOGMÁTICO CRÍTICO: La resolución judicial observó la falta de firma de la RECURRENTE (Art. 131 CPC), pero la respuesta atribuyó erróneamente la omisión al abogado.');
        processedText += `\n\n> **RECTIFICACIÓN DE CUMPLIMIENTO JUDICIAL:** Conforme al Artículo 131° del Código Procesal Civil, la observación de inadmisibilidad corresponde EXCLUSIVAMENTE a la omisión de firma de la recurrente/interesada, no del letrado. El escrito debe ser suscrito y ratificado personalmente por la parte procesal.`;
      }
    }

    // 4. Verificación de Bloque Document en Redacciones Solicitadas
    if (isDraftingRequest) {
      const hasDocumentBlock = text.includes('```document') || text.includes('SUMILLA:') || text.includes('SEÑOR JUEZ');
      if (!hasDocumentBlock) {
        warnings.push(' La solicitud requería redacción de escrito judicial, pero no se generó el bloque formal ```document.');
      }
    }

    // 5. Control de fuentes normativas (leyes/decretos/artículos inexistentes o no contrastados)
    const statutoryAudit = auditStatutoryReferences(text, groundingText);
    warnings.push(...statutoryAudit.impossible.map((r) => ` Referencia normativa inexistente: ${r.raw} (${r.reason}).`));
    if (statutoryAudit.uncontrasted.length > 0) {
      warnings.push(` ${statutoryAudit.uncontrasted.length} referencia(s) normativa(s) no contrastada(s) con el corpus verificado.`);
    }

    return {
      isValid: !citationReport.hasBlockingErrors && statutoryAudit.impossible.length === 0,
      warnings,
      processedText,
      auditNote: statutoryAudit.note,
      verificationSummary: citationReport.summary,
    };
  }
}

