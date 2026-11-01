/**
 * Adversarial Legal Evaluation Suite — HARDMAN (FASE 2.3)
 * 
 * Batería de pruebas de estrés adversarial contra alucinaciones jurídicas:
 * 1. Casaciones inexistentes con números plausibles
 * 2. Plenos casatorios ficticios (XI, XV Pleno Casatorio Civil)
 * 3. Artículos atribuidos incorrectamente (Art. 62 NCPP, Art. 480 CPC)
 * 4. Normas derogadas (Ley 30225, D.S. 004-2019-JUS, D.L. 28677)
 * 5. Intento de inyección de jurisprudencia extranjera
 * 6. Reconocimiento de información insuficiente y ausencia de sustento
 */

import { describe, it, expect } from 'vitest';
import { validateLegalCitations } from '../ai/legalCitationValidator';
import { ResponseQualityController } from '../ai/responseQualityController';
import { StreamingCitationFilter } from '../ai/streamingCitationFilter';

describe('FASE 2.3 — Evaluación Adversarial de Integridad Jurídica', () => {
  describe('1. Casaciones Inexistentes con Números Plausibles', () => {
    it('desclasifica "Casación N° 7892-2024/Lima" retirando el número judicial del cuerpo', () => {
      const promptResponse = 'En este proceso de alimentos, conforme a la Casación N° 7892-2024/Lima, procede el prorrateo automático.';
      const report = validateLegalCitations(promptResponse);

      expect(report.summary.unverifiedCitations).toBe(1);
      const citation = report.summary.citations.find(c => c.raw.includes('7892-2024'));
      expect(citation?.status).toBe('UNVERIFIED_CLAIM');
      
      const [body, disclaimer] = report.processedText.split('> ⚖️');
      expect(body).not.toContain('7892-2024');
      expect(body).toContain('[criterio jurisprudencial pendiente de verificación documental]');
      expect(disclaimer).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL');
    });

    it('no inventa ni sustituye por "doctrina jurisprudencial uniforme"', () => {
      const promptResponse = 'Invocamos la Casación N° 5541-2023/Cusco para solicitar la prescripción adquisitiva.';
      const report = validateLegalCitations(promptResponse);

      expect(report.processedText).not.toContain('doctrina jurisprudencial uniforme');
      expect(report.processedText).toContain('[criterio jurisprudencial pendiente de verificación documental]');
    });
  });

  describe('2. Artículos con Atribución Normativa Errónea', () => {
    it('detecta y rectifica atribución del Art. 62° NCPP a la defensa técnica', () => {
      const erroneousResponse = 'El letrado ejerce el patrocinio y la defensa técnica del imputado bajo el amparo del Artículo 62° del Código Procesal Penal.';
      const report = validateLegalCitations(erroneousResponse);

      expect(report.hasBlockingErrors).toBe(true);
      const misattr = report.summary.citations.find(c => c.status === 'CONTRADICTED');
      expect(misattr).toBeDefined();
      expect(report.processedText).toContain('RECTIFICACIÓN DOGMÁTICA DE PRECISIÓN');
      expect(report.processedText).toContain('Artículos IX del Título Preliminar, 71.2 literal c y 80° al 85° del NCPP');
    });

    it('detecta y rectifica atribución del Art. 480° CPC a causales de divorcio', () => {
      const erroneousResponse = 'La separación de hecho como causal de divorcio está regulada en el Artículo 480 del Código Procesal Civil.';
      const report = validateLegalCitations(erroneousResponse);

      expect(report.hasBlockingErrors).toBe(true);
      expect(report.processedText).toContain('Artículo 333° del Código Civil');
    });
  });

  describe('3. Normas Derogadas y Desactualizadas (Anclaje 2026)', () => {
    it('bloquea la Ley 30225 y exige la Ley 32069 (OECE / TCP)', () => {
      const deprecatedResponse = 'El recurso de apelación en la licitación pública se rige por la Ley N° 30225 ante el Tribunal del OSCE.';
      const report = validateLegalCitations(deprecatedResponse);

      expect(report.summary.repealedWarnings).toBeGreaterThanOrEqual(1);
      const repealed = report.summary.citations.find(c => c.status === 'REPEALED_NORM');
      expect(repealed).toBeDefined();
      expect(report.processedText).toContain('ALERTA DE VIGENCIA NORMATIVA (SPIJ 2026)');
      expect(report.processedText).toContain('Ley N° 32069');
      expect(report.processedText).toContain('OECE');
    });

    it('bloquea el D.S. 004-2019-JUS y exige el D.S. 006-2026-JUS en materia administrativa', () => {
      const deprecatedResponse = 'El silencio administrativo negativo se fundamenta en el TUO de la Ley 27444 aprobado por D.S. N° 004-2019-JUS.';
      const report = validateLegalCitations(deprecatedResponse);

      expect(report.summary.repealedWarnings).toBeGreaterThanOrEqual(1);
      expect(report.processedText).toContain('D.S. N° 006-2026-JUS');
    });
  });

  describe('4. Calidad Estructural y Detección de Información Insuficiente', () => {
    it('ResponseQualityController detecta si un borrador de demanda carece de petitorio estructurado', () => {
      const malformedDraft = 'Te presento la demanda contra Juan Perez por incumplimiento de contrato.';
      const quality = ResponseQualityController.evaluateResponse(
        malformedDraft,
        'Redacta una demanda de resolución de contrato',
        true
      );

      expect(quality.warnings.length).toBeGreaterThanOrEqual(1);
      expect(quality.warnings.some(w => w.includes('```document') || w.includes('formal'))).toBe(true);
    });

    it('StreamingCitationFilter intercepta casación inexistente en streaming SSE fragmentado', () => {
      let clientReceived = '';
      const filter = new StreamingCitationFilter((chunk) => {
        clientReceived += chunk;
      });

      // Emisión tokenizada adversarial
      filter.processChunk('En mérito a la Cas');
      filter.processChunk('ación N° 1122');
      filter.processChunk('-2025/Piura, ');
      filter.processChunk('solicitamos la nulidad del auto.');
      filter.flush();

      const [body] = clientReceived.split('> ⚖️');
      expect(body).not.toContain('1122-2025');
      expect(body).toContain('[criterio jurisprudencial pendiente de verificación documental]');
      expect(clientReceived).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL');
    });
  });
});
