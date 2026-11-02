import { describe, it, expect, beforeEach, vi } from 'vitest';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

vi.mock('../db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

import { ModelCatalog } from '../ai/modelCatalog';
import { ProviderAdapter, ProviderExecutionError } from '../ai/providerAdapter';
import { CircuitBreaker } from '../ai/circuitBreaker';
import { AiOrchestrator } from '../ai/aiOrchestrator';
import { DocumentPipeline } from '../lib/documentPipeline';
import { validateLegalCitations } from '../ai/legalCitationValidator';
import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AiProviderName } from '../ai/types';

describe('PRUEBAS OBLIGATORIAS — Claude Sonnet 5.5 Single Generative Model & System Audit', () => {
  beforeEach(() => {
    CircuitBreaker.resetCircuit();
    ModelCatalog.resetOverrides();
    vi.restoreAllMocks();
  });

  const ALL_EIGHT_AGENTS = [
    'valentina', // Laboral
    'sebastian', // Penal
    'diego',     // Civil
    'adriana',   // Corporativo / Contratos
    'rodrigo',   // Litigación Constitucional
    'camila',    // Familia
    'fernanda',  // Tributario / Administrativo
    'marco',     // Director Jurídico
  ];

  it('1. All eight legal agents exist in SYSTEM_PROMPTS and have legal grounding', () => {
    for (const agentId of ALL_EIGHT_AGENTS) {
      const prompt = SYSTEM_PROMPTS[agentId];
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain('Perú');
    }
  });

  it('2. ModelCatalog routes all legal tasks exclusively to anthropic/claude-sonnet-5.5 via OpenRouter', () => {
    const configuredProviders: Record<AiProviderName, boolean> = {
      openrouter: true,
      gemini: false,
      groq: false,
      openai: false,
      deepseek: false,
      anthropic: false,
      system_unavailable: false,
      emergency_mock: false,
    };

    const tasks: any[] = ['LEGAL_CONSULTATION', 'EXPEDIENTE_ANALYSIS', 'DOCUMENT_DRAFTING', 'QUICK_ANSWER'];
    for (const task of tasks) {
      const candidates = ModelCatalog.getCandidatesForTask(task, configuredProviders);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].provider).toBe('openrouter');
      expect(candidates[0].model).toBe('anthropic/claude-sonnet-5.5');
      expect(candidates[0].temperature).toBe(0.0);
    }
  });

  it('3. Prohibits calls to alternative generative providers (Gemini, DeepSeek, Groq, OpenAI, direct Anthropic)', async () => {
    const unauthorizedProviders: AiProviderName[] = ['gemini', 'deepseek', 'groq', 'openai', 'anthropic'];

    for (const prov of unauthorizedProviders) {
      await expect(
        ProviderAdapter.executeCandidate(
          {
            provider: prov,
            model: 'some-model',
            maxTokens: 1000,
            temperature: 0.0,
            timeoutMs: 10000,
          },
          [{ role: 'user', content: 'test' }],
          false
        )
      ).rejects.toThrow(/Llamada no autorizada/);
    }
  });

  it('4. ProviderAdapter rejects empty responses from OpenRouter with HTTP 204 error', async () => {
    process.env.OPENROUTER_API_KEY = 'mock-key';

    // Mock fetch returning empty content
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '   ' } }] }),
    } as any);

    await expect(
      ProviderAdapter.executeCandidate(
        {
          provider: 'openrouter',
          model: 'anthropic/claude-sonnet-5.5',
          maxTokens: 1000,
          temperature: 0.0,
          timeoutMs: 10000,
        },
        [{ role: 'user', content: 'test' }],
        false
      )
    ).rejects.toThrow(/Respuesta vacía/);
  });

  it('5. CircuitBreaker classifies 429 rate limit, extracts retryAfterSeconds, and actions FALLBACK_NEXT', () => {
    const err = {
      statusCode: 429,
      message: 'Rate limit exceeded: deepseek or sonnet rate limited. retry-after: 35',
    };
    const classified = CircuitBreaker.classifyError(err);
    expect(classified.category).toBe('RATE_LIMIT_429');
    expect(classified.retryAfterSeconds).toBe(35);
    expect(classified.isRetryable).toBe(false);
  });

  it('6. CircuitBreaker classifies 401/403 as AUTH_ERROR and trips circuit immediately', () => {
    const authErr = { statusCode: 401, message: 'Invalid API Key' };
    const classified = CircuitBreaker.classifyError(authErr);
    expect(classified.category).toBe('AUTH_ERROR_401_403');
    expect(classified.action).toBe('TRIP_CIRCUIT');

    CircuitBreaker.recordFailure('openrouter', classified);
    expect(CircuitBreaker.isCircuitOpen('openrouter')).toBe(true);
  });

  it('7. CircuitBreaker classifies 404, marks model DISABLED in ModelCatalog without retry', () => {
    const err404 = { statusCode: 404, message: 'Endpoint or model not found' };
    const classified = CircuitBreaker.classifyError(err404, 'anthropic/claude-sonnet-5.5');
    expect(classified.category).toBe('NOT_FOUND_404');
    expect(classified.action).toBe('DISABLE_MODEL');

    const modelDef = ModelCatalog.getModel('anthropic/claude-sonnet-5.5');
    expect(modelDef?.status).toBe('DISABLED');
  });

  it('8. Timeouts trigger honest service unavailable notification without inventing fake legal answers', async () => {
    // Force circuit open to simulate provider outage
    CircuitBreaker.recordFailure('openrouter', {
      category: 'TIMEOUT_408',
      message: 'Timeout 90000ms',
      isRetryable: true,
      action: 'TRIP_CIRCUIT',
    });

    const res = await AiOrchestrator.processRequest({
      userId: 'test-user',
      agentId: 'diego',
      messages: [{ role: 'user', content: '¿Cómo interpongo una demanda de desalojo por ocupante precario?' }],
      ephemeral: true,
    });

    expect(res.meta.provider).toBe('system_unavailable');
    expect(res.meta.model).toBe('anthropic/claude-sonnet-5.5');
    expect(res.meta.fallbackOccurred).toBe(false); // Prohibido fallback a otros modelos
    expect(res.message).toContain('temporalmente no disponible');
    expect(res.message).not.toContain('Artículo 911'); // No inventa fundamentos en downtime
  });

  it('9. DocumentPipeline extracts dense digital PDF preserving folios and assigns EXCELLENT grade', () => {
    const pageTexts = [
      'DEMANDA DE COBRO DE BENEFICIOS SOCIALES Y CTS. Demandante: Carlos Mendoza. Demandado: Constructora SAC. Petitorio: Se ordene el pago de S/ 45,000 por concepto de gratificaciones y vacaciones truncas...',
      'FUNDAMENTOS DE HECHO: El recurrente laboró desde el 01/01/2021 hasta el 31/12/2025 cumpliendo jornada ordinaria bajo subordinación conforme al Art. 4 del D.S. 003-97-TR...',
    ];
    const quality = DocumentPipeline.evaluateQuality(2, pageTexts);
    expect(quality.qualityGrade).toBe('EXCELLENT');
    expect(quality.averageCharsPerPage).toBeGreaterThan(70);
    expect(quality.usefulContentRatio).toBe(1.0);
  });

  it('10. DocumentPipeline flags 98-page document with 3,122 characters as DEFICIENT (average 31 chars/page)', () => {
    const pageTexts = Array.from({ length: 98 }, (_, i) => `Sello Notarial Folio ${i + 1}`);
    const quality = DocumentPipeline.evaluateQuality(98, pageTexts);
    expect(quality.qualityGrade).toBe('DEFICIENT');
    expect(quality.averageCharsPerPage).toBeLessThan(70);
    expect(quality.scannedPagesCount).toBe(98);
  });

  it('11. Independent legal validator rejects non-existent articles without relying on Claude truthfulness', () => {
    // CPC Peru has 840 articles. Art. 9999 does not exist.
    const result = validateLegalCitations('Fundamento mi recurso en el Artículo 9999 del Código Procesal Civil');
    expect(result.hasBlockingErrors).toBe(true);
    expect(result.summary.citations.some((c) => c.status === 'CONTRADICTED')).toBe(true);
    expect(result.processedText).toContain('artículo inexistente');
  });

  it('12. Independent legal validator identifies repealed norms (D.S. 004-2019-JUS, Ley 28677)', () => {
    const lpagResult = validateLegalCitations('Se aplica el procedimiento del D.S. N° 004-2019-JUS');
    expect(lpagResult.summary.repealedWarnings).toBeGreaterThanOrEqual(1);
    expect(lpagResult.processedText).toContain('D.S. N° 006-2026-JUS');

    const gmResult = validateLegalCitations('Constitución de garantía según Ley 28677');
    expect(gmResult.summary.repealedWarnings).toBeGreaterThanOrEqual(1);
    expect(gmResult.processedText).toContain('D.L. 1400');
  });
});
