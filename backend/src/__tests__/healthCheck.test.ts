import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreaker } from '../ai/circuitBreaker';
import { ModelCatalog } from '../ai/modelCatalog';
import { AiProviderName } from '../ai/types';

describe('Health Check & Observability Payload', () => {
  beforeEach(() => {
    CircuitBreaker.resetCircuit();
    ModelCatalog.resetOverrides();
  });

  it('generates complete multi-provider health metrics for configured providers', () => {
    const configuredProviders: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: true,
      groq: false,
      openai: false,
      deepseek: false,
      anthropic: false,
      system_unavailable: false,
      emergency_mock: false,
    };

    const summary = CircuitBreaker.getProviderHealthSummary(configuredProviders);

    expect(summary.gemini).toBeDefined();
    expect(summary.gemini.status).toBe('HEALTHY');
    expect(summary.gemini.circuitState).toBe('CLOSED');
    expect(summary.gemini.consecutiveFailures).toBe(0);

    expect(summary.openrouter).toBeDefined();
    expect(summary.openrouter.status).toBe('HEALTHY');

    expect(summary.groq.status).toBe('UNCONFIGURED');
  });

  it('reflects OUTAGE when a provider circuit trips to OPEN', () => {
    const configuredProviders: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: true,
      groq: false,
      openai: false,
      deepseek: false,
      anthropic: false,
      system_unavailable: false,
      emergency_mock: false,
    };

    const classified = CircuitBreaker.classifyError({ statusCode: 503, message: 'Service Unavailable' });
    CircuitBreaker.recordFailure('openrouter', classified);
    CircuitBreaker.recordFailure('openrouter', classified);
    CircuitBreaker.recordFailure('openrouter', classified);

    const summary = CircuitBreaker.getProviderHealthSummary(configuredProviders);
    expect(summary.openrouter.circuitState).toBe('OPEN');
    expect(summary.openrouter.status).toBe('OUTAGE');
    expect(summary.openrouter.consecutiveFailures).toBe(3);
    expect(summary.openrouter.lastError).toContain('SERVER_ERROR_5XX');
  });

  it('modelCatalog statistics correctly count operational and deprecated models', () => {
    const allModels = ModelCatalog.getAllModels();
    const operational = allModels.filter((m) => m.status === 'OPERATIONAL');
    const deprecated = allModels.filter((m) => m.status === 'DEPRECATED');

    expect(allModels.length).toBeGreaterThanOrEqual(10);
    expect(operational.length).toBeGreaterThan(0);
    expect(deprecated.length).toBeGreaterThanOrEqual(4);

    const deprecatedIds = deprecated.map((m) => m.id);
    expect(deprecatedIds).toContain('gemini-2.0-flash');
    expect(deprecatedIds).toContain('gemini-1.5-flash');
  });
});

