import { describe, it, expect, beforeEach } from 'vitest';
import { ModelCatalog, MODEL_REGISTRY } from '../ai/modelCatalog';
import { AiProviderName } from '../ai/types';

describe('ModelCatalog & Single Source of Truth', () => {
  beforeEach(() => {
    ModelCatalog.resetOverrides();
  });

  it('contains valid definitions for primary operational models', () => {
    const gemini38 = ModelCatalog.getModel('gemini-3.8-flash');
    expect(gemini38).toBeDefined();
    expect(gemini38?.provider).toBe('gemini');
    expect(gemini38?.status).toBe('OPERATIONAL');
    expect(gemini38?.priority).toBe(1);
    expect(gemini38?.capabilities.pdfDocument).toBe(true);

    const gemini25 = ModelCatalog.getModel('gemini-2.5-flash');
    expect(gemini25).toBeDefined();
    expect(gemini25?.provider).toBe('gemini');
    expect(gemini25?.status).toBe('OPERATIONAL');
    expect(gemini25?.priority).toBe(2);

    const orLlama = ModelCatalog.getModel('meta-llama/llama-3.3-70b-instruct');
    expect(orLlama).toBeDefined();
    expect(orLlama?.provider).toBe('openrouter');
    expect(orLlama?.status).toBe('OPERATIONAL');
  });

  it('strictly deprecates obsolete models with 404 or availability issues', () => {
    const deprecatedModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'google/gemini-2.0-flash-001',
      'google/gemini-flash-1.5',
    ];

    for (const mId of deprecatedModels) {
      const def = ModelCatalog.getModel(mId);
      expect(def).toBeDefined();
      expect(def?.status).toBe('DEPRECATED');
      expect(def?.deprecatedReason).toBeDefined();
    }
  });

  it('getCandidatesForTask never includes deprecated models', () => {
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

    const candidates = ModelCatalog.getCandidatesForTask('EXPEDIENTE_ANALYSIS', allProviders);
    const candidateModelIds = candidates.map((c) => c.model);

    expect(candidateModelIds).not.toContain('gemini-2.0-flash');
    expect(candidateModelIds).not.toContain('gemini-1.5-flash');
    expect(candidateModelIds).not.toContain('google/gemini-2.0-flash-001');
    expect(candidateModelIds).not.toContain('google/gemini-flash-1.5');

    // Primary candidates are present
    expect(candidateModelIds).toContain('gemini-3.8-flash');
    expect(candidateModelIds).toContain('gemini-2.5-flash');
  });

  it('orders candidates by ascending priority (primary first)', () => {
    const providers: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: false,
      groq: false,
      openai: false,
      deepseek: false,
      anthropic: false,
      system_unavailable: false,
      emergency_mock: false,
    };

    const candidates = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providers);
    expect(candidates.length).toBeGreaterThanOrEqual(2);
    expect(candidates[0].model).toBe('gemini-3.8-flash'); // Priority 1
    expect(candidates[1].model).toBe('gemini-2.5-flash'); // Priority 2
  });

  it('markModelStatus dynamically disables a model when 404 occurs', () => {
    const providers: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: false,
      groq: false,
      openai: false,
      deepseek: false,
      anthropic: false,
      system_unavailable: false,
      emergency_mock: false,
    };

    let candidates = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providers);
    expect(candidates.some((c) => c.model === 'gemini-3.8-flash')).toBe(true);

    ModelCatalog.markModelStatus('gemini-3.8-flash', 'DISABLED', 'Simulated 404');

    candidates = ModelCatalog.getCandidatesForTask('LEGAL_CONSULTATION', providers);
    expect(candidates.some((c) => c.model === 'gemini-3.8-flash')).toBe(false);
    expect(candidates[0].model).toBe('gemini-2.5-flash');
  });

  it('getOcrModels returns models with native PDF capabilities for PDFs', () => {
    const providers: Record<AiProviderName, boolean> = {
      gemini: true,
      openrouter: true,
      groq: false,
      openai: false,
      deepseek: false,
      anthropic: false,
      system_unavailable: false,
      emergency_mock: false,
    };

    const ocrModels = ModelCatalog.getOcrModels('application/pdf', providers);
    for (const model of ocrModels) {
      expect(model.capabilities.pdfDocument).toBe(true);
      expect(model.supportedTasks).toContain('OCR_DOCUMENT');
      expect(model.status).not.toBe('DEPRECATED');
      expect(model.status).not.toBe('DISABLED');
    }
  });
});

