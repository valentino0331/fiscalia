import { describe, it, expect, beforeEach } from 'vitest';
import { ModelCatalog, MODEL_REGISTRY } from '../ai/modelCatalog';
import { AiProviderName } from '../ai/types';

describe('ModelCatalog — Claude Sonnet 5.5 Single Generative Model Directive', () => {
  beforeEach(() => {
    ModelCatalog.resetOverrides();
  });

  it('contains valid definition for anthropic/claude-sonnet-5.5 as the sole OPERATIONAL generative model', () => {
    const sonnet = ModelCatalog.getModel('anthropic/claude-sonnet-5.5');
    expect(sonnet).toBeDefined();
    expect(sonnet?.provider).toBe('openrouter');
    expect(sonnet?.apiType).toBe('openai-compatible');
    expect(sonnet?.status).toBe('OPERATIONAL');
    expect(sonnet?.priority).toBe(1);
    expect(sonnet?.contextWindow).toBe(1000000); // 1M tokens context
    expect(sonnet?.maxOutputTokens).toBe(16384);
    expect(sonnet?.defaultTemperature).toBe(0.0);
  });

  it('strictly disables or deprecates all alternative generative models', () => {
    const prohibitedModels = [
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'deepseek/deepseek-chat',
      'meta-llama/llama-3.3-70b-instruct',
      'google/gemini-2.5-flash',
      'llama-3.3-70b-versatile',
      'gpt-4o-mini',
    ];

    for (const mId of prohibitedModels) {
      const def = ModelCatalog.getModel(mId);
      expect(def).toBeDefined();
      expect(def?.status === 'DEPRECATED' || def?.status === 'DISABLED').toBe(true);
    }
  });

  it('getCandidatesForTask returns exclusively anthropic/claude-sonnet-5.5 via OpenRouter', () => {
    const allProviders: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: true,
      groq: true,
      openai: true,
      deepseek: true,
      anthropic: true,
      system_unavailable: false,
      emergency_mock: false,
    };

    const tasks: any[] = ['EXPEDIENTE_ANALYSIS', 'DOCUMENT_DRAFTING', 'LEGAL_CONSULTATION', 'QUICK_ANSWER'];

    for (const task of tasks) {
      const candidates = ModelCatalog.getCandidatesForTask(task, allProviders);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].provider).toBe('openrouter');
      expect(candidates[0].model).toBe('anthropic/claude-sonnet-5.5');
      expect(candidates[0].temperature).toBe(0.0); // Determinismo estricto
      expect(candidates[0].maxTokens).toBe(16384);
    }
  });

  it('returns empty candidates array if OpenRouter is unconfigured, preventing fallback to alternative models', () => {
    const providersWithoutOpenRouter: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: false, // OpenRouter no configurado
      groq: true,
      openai: true,
      deepseek: true,
      anthropic: true,
      system_unavailable: false,
      emergency_mock: false,
    };

    const candidates = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providersWithoutOpenRouter);
    expect(candidates).toHaveLength(0); // Prohibido fallback a Gemini, DeepSeek u otros
  });

  it('markModelStatus dynamically disables Claude Sonnet 5.5 and returns zero candidates (no fallback)', () => {
    const providers: Record<AiProviderName, boolean> = {
      gemini: false,
      openrouter: true,
      groq: false,
      openai: false,
      deepseek: false,
      anthropic: false,
      system_unavailable: false,
      emergency_mock: false,
    };

    let candidates = ModelCatalog.getCandidatesForTask('DOCUMENT_DRAFTING', providers);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].model).toBe('anthropic/claude-sonnet-5.5');

    ModelCatalog.markModelStatus('anthropic/claude-sonnet-5.5', 'DISABLED', 'Simulated 503 Outage');

    candidates = ModelCatalog.getCandidatesForTask('DOCUMENT_DRAFTING', providers);
    expect(candidates).toHaveLength(0); // Sin fallback
  });
});
