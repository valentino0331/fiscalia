import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { auditStatutoryReferences } from '../ai/statutoryGroundingAudit';
import { ResponseQualityController } from '../ai/responseQualityController';
import { ModelCatalog } from '../ai/modelCatalog';
import { AiProviderName } from '../ai/types';

describe('auditStatutoryReferences', () => {
  it('marca como inexistente una Ley con numeración imposible', () => {
    const r = auditStatutoryReferences('Conforme a la Ley N° 45678 se establece la pena.');
    expect(r.impossible.map((x) => x.kind)).toContain('ley');
    expect(r.note).toContain('numeración inexistente');
  });

  it('marca como inexistente un D.Leg. fuera de rango', () => {
    const r = auditStatutoryReferences('Según el Decreto Legislativo N° 9999 …');
    expect(r.impossible).toHaveLength(1);
  });

  it('no avisa normas que constan en el corpus/compendios (D.Leg. 957, Ley 32069)', () => {
    const r = auditStatutoryReferences('El D.Leg. 957 y la Ley N° 32069 regulan estas materias.');
    expect(r.uncontrasted).toHaveLength(0);
    expect(r.impossible).toHaveLength(0);
    expect(r.note).toBe('');
  });

  it('avisa una ley plausible pero no contrastada, sin reescribir el texto', () => {
    const text = 'Aplica la Ley N° 31999 al caso.';
    const r = auditStatutoryReferences(text);
    expect(r.uncontrasted.map((x) => x.raw).join(' ')).toContain('31999');
    expect(r.note).toContain('SPIJ');
  });

  it('un artículo del corpus verificado (CP art. 384) no se avisa; uno ausente sí', () => {
    const ok = auditStatutoryReferences('El artículo 384 del Código Penal tipifica la colusión.');
    expect(ok.uncontrasted).toHaveLength(0);
    const unknown = auditStatutoryReferences('El artículo 189 del Código Penal agrava el robo.');
    expect(unknown.uncontrasted).toHaveLength(1);
  });

  it('un artículo respaldado por el grounding de la consulta se considera verificado', () => {
    const grounding = 'Artículo 189.- Robo agravado\nLa pena será no menor de doce ni mayor de veinte años…';
    const r = auditStatutoryReferences('Art. 189 del Código Penal.', grounding);
    expect(r.uncontrasted).toHaveLength(0);
  });

  it('un artículo por encima del último del código es imposible', () => {
    const r = auditStatutoryReferences('El artículo 999 del Código Penal dispone…');
    expect(r.impossible).toHaveLength(1);
  });

  it('ignora citas dentro de bloques de código', () => {
    const r = auditStatutoryReferences('```\nLey N° 99999\n```');
    expect(r.references).toHaveLength(0);
  });

  it('deduplica referencias repetidas', () => {
    const r = auditStatutoryReferences('Ley N° 31999. Ley 31999. Ley N° 31999.');
    expect(r.uncontrasted).toHaveLength(1);
  });
});

describe('ResponseQualityController + auditoría de fuentes', () => {
  it('expone auditNote y marca la respuesta como inválida si hay referencias inexistentes', () => {
    const res = ResponseQualityController.evaluateResponse('Rige la Ley N° 77777.', 'consulta', false, null);
    expect(res.auditNote).toContain('77777');
    expect(res.isValid).toBe(false);
  });
});

describe('ModelCatalog: modelo configurado por entorno', () => {
  const providers: Record<AiProviderName, boolean> = {
    openrouter: true, gemini: false, groq: false, openai: false, deepseek: false, anthropic: false,
    system_unavailable: false, emergency_mock: false,
  };
  const saved = { ...process.env };
  beforeEach(() => ModelCatalog.resetOverrides());
  afterEach(() => {
    process.env = { ...saved };
    ModelCatalog.resetOverrides();
  });

  it('respeta un modelo no registrado como primario', () => {
    process.env.OPENROUTER_PRIMARY_MODEL = 'vendor/modelo-nuevo';
    const c = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providers);
    expect(c[0].model).toBe('vendor/modelo-nuevo');
  });

  it('respeta un modelo desactivado por coste si el operador lo elige explícitamente', () => {
    process.env.OPENROUTER_PRIMARY_MODEL = 'anthropic/claude-sonnet-5.5';
    const c = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providers);
    expect(c[0].model).toBe('anthropic/claude-sonnet-5.5');
  });

  it('un 404 en vivo veta el modelo aunque esté configurado', () => {
    process.env.OPENROUTER_PRIMARY_MODEL = 'vendor/modelo-nuevo';
    ModelCatalog.markModelStatus('vendor/modelo-nuevo', 'DISABLED', 'HTTP 404');
    const c = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providers);
    expect(c.map((x) => x.model)).not.toContain('vendor/modelo-nuevo');
  });

  it('sin variables de entorno se mantiene la cadena por defecto', () => {
    delete process.env.OPENROUTER_PRIMARY_MODEL;
    delete process.env.OPENROUTER_FALLBACK_MODEL;
    delete process.env.OPENROUTER_TERTIARY_MODEL;
    const c = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providers);
    expect(c.map((x) => x.model)).toEqual(['deepseek/deepseek-chat', 'openai/gpt-4o-mini', 'z-ai/glm-5.3-flash']);
  });
});
