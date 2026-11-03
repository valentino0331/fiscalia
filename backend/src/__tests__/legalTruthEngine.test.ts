/**
 * LEGAL TRUTH ENGINE — SUITE ADVERSARIAL INTEGRAL (FASE 11 Y 12)
 * 
 * Batería exhaustiva de pruebas de estrés y verificación documental:
 * 1. Detección y bloqueo de casaciones inventadas
 * 2. Bloqueo de leyes inexistentes o dockets ficticios
 * 3. Identificación y alerta de normas derogadas (Ley 30225, D.S. 004-2019-JUS)
 * 4. Atribución falsa de fundamento a sentencia auténtica (Casación 4664-2010 para prescripción)
 * 5. Correspondencia causal de ratio decidendi en Acuerdos Plenarios
 * 6. Versionado temporal (Principio Tempus Regit Actum: hechos 2021 vs vigencia 2026)
 * 7. Integridad de hashes SHA-256 en LegalSourceRegistry
 * 8. StreamingCitationFilter: Cero fuga de números judiciales inventados al socket SSE
 * 9. Desclasificación honesta sin eufemismos genéricos ("doctrina jurisprudencial uniforme")
 * 10. Aislamiento y delimitación de especialidades por catálogo de fuentes
 */

import { describe, it, expect } from 'vitest';
import { LegalSourceRegistry } from '../ai/legalSourceRegistry';
import { validateLegalCitations } from '../ai/legalCitationValidator';
import { StreamingCitationFilter } from '../ai/streamingCitationFilter';

describe('LEGAL TRUTH ENGINE — Verificación y Rigor Documental', () => {

  describe('1. Integridad Criptográfica de Fuentes Oficiales (LegalSourceRegistry)', () => {
    it('todos los precedentes canónicos cuentan con hash SHA-256 válido y trazabilidad URL', () => {
      const allDocs = LegalSourceRegistry.getAllDocuments();
      expect(allDocs.length).toBeGreaterThanOrEqual(10);

      for (const doc of allDocs) {
        expect(doc.sha256Hash).toBeDefined();
        expect(doc.sha256Hash.length).toBe(64); // Longitud estándar SHA-256 hex
        expect(doc.officialUrl).toMatch(/^https?:\/\//);
        expect(doc.issuingEntity).toBeDefined();
        expect(doc.verificationLevel).toBe('VERIFIED');
        expect(doc.relevantFJ.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('recupera correctamente el Tercer Pleno Casatorio Civil (4664-2010) con sus fundamentos vinculantes', () => {
      const doc = LegalSourceRegistry.getByShortKey('4664-2010');
      expect(doc).toBeDefined();
      expect(doc?.officialNumber).toContain('Casación N° 4664-2010/Puno');
      expect(doc?.subject).toContain('cónyuge más perjudicado');
      expect(doc?.relevantFJ.some(f => f.isBindingRule)).toBe(true);
    });
  });

  describe('2. Control de Atribución Falsa a Sentencias Reales (Anti-Misattribution)', () => {
    it('detecta y rechaza la cita de la Casación 4664-2010 cuando se le atribuye prescripción adquisitiva', () => {
      // Intento adversarial: Usar una casación real de divorcio para sustentar usucapión
      const adversarialText = 'Para sustentar la prescripción adquisitiva de dominio de este inmueble invocamos la Casación N° 4664-2010/Puno sobre posesión continua.';
      const report = validateLegalCitations(adversarialText);

      expect(report.hasBlockingErrors).toBe(true);
      const contradicted = report.summary.citations.find(c => c.status === 'CONTRADICTED');
      expect(contradicted).toBeDefined();
      expect(contradicted?.raw).toContain('4664-2010');
      expect(report.processedText).toContain('atribución temática errónea');
      expect(report.processedText.toLowerCase()).toContain('divorcio por separación de hecho');
    });

    it('aprueba la Casación 4664-2010 cuando su contexto versa sobre divorcio y cónyuge perjudicado', () => {
      const validText = 'En este proceso de divorcio por separación de hecho, invocamos la Casación N° 4664-2010/Puno para fijar la indemnización al cónyuge más perjudicado.';
      const report = validateLegalCitations(validText);

      const verified = report.summary.citations.find(c => c.raw.includes('4664-2010'));
      expect(verified).toBeDefined();
      expect(verified?.status).toBe('VERIFIED');
      expect(report.hasBlockingErrors).toBe(false);
    });

    it('detecta y rechaza el Acuerdo Plenario 01-2019/CIJ-116 cuando se atribuye a despido laboral', () => {
      const adversarialText = 'El despido fraudulento del trabajador se acredita bajo los alcances del Acuerdo Plenario N° 01-2019/CIJ-116.';
      const report = validateLegalCitations(adversarialText);

      expect(report.hasBlockingErrors).toBe(true);
      const contradicted = report.summary.citations.find(c => c.status === 'CONTRADICTED');
      expect(contradicted).toBeDefined();
      expect(report.processedText).toContain('atribución temática errónea');
      expect(report.processedText.toLowerCase()).toContain('prisión preventiva');
    });
  });

  describe('3. Detección y Erradicación de Casaciones Inventadas', () => {
    it('desclasifica "Casación N° 98765-2024/Lima" sin emitir el docket inventado en el cuerpo', () => {
      const fakeText = 'Solicitamos revocar la medida cautelar invocando la Casación N° 98765-2024/Lima.';
      const report = validateLegalCitations(fakeText);

      expect(report.summary.unverifiedCitations).toBe(1);
      const [body, disclaimer] = report.processedText.split('> ⚖️');
      expect(body).not.toContain('98765-2024');
      expect(body).not.toContain('doctrina jurisprudencial uniforme');
      expect(body).toContain('[criterio jurisprudencial pendiente de verificación documental]');
      expect(disclaimer).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL');
    });
  });

  describe('4. Versionado Temporal y Principio Tempus Regit Actum', () => {
    it('resuelve que un contrato firmado en 2021 se rige por la Ley 30225 y no por la Ley 32069', () => {
      const resolution = LegalSourceRegistry.resolveTemporalValidity('contrataciones con el estado', '2021-06-15');
      expect(resolution.isCurrentActive).toBe(false);
      expect(resolution.governingNorm).toContain('Ley N° 30225');
      expect(resolution.note).toContain('tempus regit actum');
      expect(resolution.note).toContain('derogada por la Ley N° 32069');
    });

    it('resuelve que un procedimiento licitario de 2026 se rige por la Ley 32069 (OECE)', () => {
      const resolution = LegalSourceRegistry.resolveTemporalValidity('contrataciones públicas', '2026-03-01');
      expect(resolution.isCurrentActive).toBe(true);
      expect(resolution.governingNorm).toContain('Ley N° 32069');
      expect(resolution.note).toContain('vigente al 2026');
    });

    it('resuelve que un acto administrativo de 2022 se rige por D.S. 004-2019-JUS', () => {
      const resolution = LegalSourceRegistry.resolveTemporalValidity('TUO LPAG', '2022-10-10');
      expect(resolution.isCurrentActive).toBe(false);
      expect(resolution.governingNorm).toContain('D.S. N° 004-2019-JUS');
    });
  });

  describe('5. Streaming SSE en Tiempo Real (StreamingCitationFilter)', () => {
    it('bloquea la emisión de número inventado durante el flujo SSE continuo', () => {
      let clientReceived = '';
      const filter = new StreamingCitationFilter((chunk) => {
        clientReceived += chunk;
      });

      // Emisión tokenizada adversarial simulando generación LLM
      filter.processChunk('Conforme se determinó en la Cas');
      filter.processChunk('ación N° 12999');
      filter.processChunk('-2025/Tacna, ');
      filter.processChunk('la nulidad es manifiesta.');
      filter.flush();

      const [body, footer] = clientReceived.split('> ⚖️');
      expect(body).not.toContain('12999-2025');
      expect(body).toContain('[criterio jurisprudencial pendiente de verificación documental]');
      expect(footer).toContain('NOTA DE RIGOR Y AUDITORÍA PROCESAL (ESTÁNDAR HARDMAN)');
      expect(filter.getUnverifiedCitations()).toContain('Casación N° 12999-2025/Tacna');
    });

    it('permite el paso ininterrumpido de una casación verificada en tiempo real', () => {
      let clientReceived = '';
      const filter = new StreamingCitationFilter((chunk) => {
        clientReceived += chunk;
      });

      filter.processChunk('Citamos la Casación N° 2195-2011/Ucayali para el desalojo por ocupación precaria.');
      filter.flush();

      expect(clientReceived).toContain('Casación N° 2195-2011/Ucayali');
      expect(filter.getUnverifiedCitations().length).toBe(0);
    });
  });

  describe('6. Delimitación de Especialidades y Segregación Documental', () => {
    it('Valentina (Laboral) únicamente tiene asociadas fuentes laborales y constitucionales', () => {
      const valentinaSources = LegalSourceRegistry.getSpecialistSources('valentina');
      expect(valentinaSources.length).toBeGreaterThanOrEqual(2);
      expect(valentinaSources.some(s => s.shortKey === '05057-2013')).toBe(true); // Precedente Huatuco
      expect(valentinaSources.some(s => s.shortKey === '12475-2014')).toBe(true); // Contratos modales
      expect(valentinaSources.some(s => s.shortKey === '01-2019')).toBe(false); // CERO prisión preventiva penal
    });

    it('Sebastián (Penal) cuenta con Acuerdos Plenarios y casaciones penales sin normas civiles', () => {
      const sebastianSources = LegalSourceRegistry.getSpecialistSources('sebastian');
      expect(sebastianSources.some(s => s.shortKey === '01-2019')).toBe(true); // Prisión preventiva
      expect(sebastianSources.some(s => s.shortKey === '02-2005')).toBe(true); // Declaración de víctima
      expect(sebastianSources.some(s => s.shortKey === '4664-2010')).toBe(false); // CERO divorcio civil
    });
  });
});
