import { describe, it, expect, beforeEach } from 'vitest';
import { ModelCatalog, MODEL_REGISTRY } from '../ai/modelCatalog';
import { AiProviderName } from '../ai/types';

describe('ModelCatalog — Cost-Effective High Quality Strategy (DeepSeek V3 + GPT-4o Mini)', () => {
  beforeEach(() => {
    ModelCatalog.resetOverrides();
  });

  it('contains valid definition for deepseek/deepseek-chat as primary OPERATIONAL model', () => {
    const deepseek = ModelCatalog.getModel('deepseek/deepseek-chat');
    expect(deepseek).toBeDefined();
    expect(deepseek?.provider).toBe('openrouter');
    expect(deepseek?.apiType).toBe('openai-compatible');
    expect(deepseek?.status).toBe('OPERATIONAL');
    expect(deepseek?.priority).toBe(1);
    expect(deepseek?.contextWindow).toBe(128000);
    expect(deepseek?.defaultTemperature).toBe(0.0);
  });

  it('contains valid definition for openai/gpt-4o-mini as fallback OPERATIONAL model', () => {
    const gptMini = ModelCatalog.getModel('openai/gpt-4o-mini');
    expect(gptMini).toBeDefined();
    expect(gptMini?.provider).toBe('openrouter');
    expect(gptMini?.apiType).toBe('openai-compatible');
    expect(gptMini?.status).toBe('OPERATIONAL');
    expect(gptMini?.priority).toBe(2);
    expect(gptMini?.contextWindow).toBe(128000);
    expect(gptMini?.defaultTemperature).toBe(0.0);
  });

  it('strictly disables or deprecates expensive or unavailable models', () => {
    const disabledModels = [
      'gemini-3.8-flash',
      'gemini-2.0-flash',
      'anthropic/claude-sonnet-5.5',
      'llama-3.3-70b-versatile',
    ];

    for (const mId of disabledModels) {
      const def = ModelCatalog.getModel(mId);
      expect(def).toBeDefined();
      expect(def?.status === 'DEPRECATED' || def?.status === 'DISABLED').toBe(true);
    }
  });

  it('getCandidatesForTask returns primary deepseek/deepseek-chat, fallback openai/gpt-4o-mini, and tertiary z-ai/glm-5.3-flash via OpenRouter', () => {
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
      expect(candidates).toHaveLength(3);
      expect(candidates[0].provider).toBe('openrouter');
      expect(candidates[0].model).toBe('deepseek/deepseek-chat');
      expect(candidates[0].temperature).toBe(0.0);

      expect(candidates[1].provider).toBe('openrouter');
      expect(candidates[1].model).toBe('openai/gpt-4o-mini');
      expect(candidates[1].temperature).toBe(0.0);

      expect(candidates[2].provider).toBe('openrouter');
      expect(candidates[2].model).toBe('z-ai/glm-5.3-flash');
      expect(candidates[2].temperature).toBe(0.0);
    }
  });

  it('markModelStatus dynamically disables DeepSeek V3 and smoothly falls back to GPT-4o Mini and GLM-5.3 Flash', () => {
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
    expect(candidates).toHaveLength(3);
    expect(candidates[0].model).toBe('deepseek/deepseek-chat');

    // Simular error 429 o fallo en DeepSeek
    ModelCatalog.markModelStatus('deepseek/deepseek-chat', 'DISABLED', 'Rate Limit 429');

    candidates = ModelCatalog.getCandidatesForTask('DOCUMENT_DRAFTING', providers);
    expect(candidates).toHaveLength(2);
    expect(candidates[0].model).toBe('openai/gpt-4o-mini'); // Fallback automático e inmediato
    expect(candidates[1].model).toBe('z-ai/glm-5.3-flash');
  });

  it('returns empty candidates array if OpenRouter is unconfigured', () => {
    const providersWithoutOpenRouter: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: false,
      groq: true,
      openai: true,
      deepseek: true,
      anthropic: true,
      system_unavailable: false,
      emergency_mock: false,
    };

    const candidates = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providersWithoutOpenRouter);
    expect(candidates).toHaveLength(0);
  });
});
