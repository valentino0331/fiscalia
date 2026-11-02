import { describe, it, expect } from 'vitest';
import { ContextManager } from '../ai/contextManager';

describe('ContextManager & Dynamic Token Budgeting', () => {
  it('1. estimateTokens returns realistic token estimates based on character count', () => {
    const shortText = 'Demanda de alimentos en proceso único';
    const tokens = ContextManager.estimateTokens(shortText);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(20);
  });

  it('2. calculateTokenBudget clamps maxTokens dynamically within model context limit', () => {
    // Generar un mensaje moderadamente largo (~50,000 tokens)
    const longContent = 'A'.repeat(50000 * 3.6);
    const messages = [
      { role: 'system', content: 'Eres un especialista legal.' },
      { role: 'user', content: longContent },
    ];

    const budget = ContextManager.calculateTokenBudget('openai/gpt-4o-mini', messages, 16384);

    // gpt-4o-mini tiene 128,000 de ventana
    expect(budget.contextWindow).toBe(128000);
    expect(budget.estimatedInputTokens + budget.maxTokens).toBeLessThanOrEqual(128000);
    expect(budget.maxTokens).toBeLessThanOrEqual(16384);
    expect(budget.maxTokens).toBeGreaterThanOrEqual(1024);
  });

  it('3. calculateTokenBudget prevents HTTP 400 when input is near model capacity (120k tokens in 128k context)', () => {
    // El caso exacto que falló en producción: 120,094 tokens de entrada + 16,384 pedido = 136,478 > 128,000
    const nearLimitContent = 'Texto procesal de resolución '.repeat(15000); // ~120,000 caracteres o ~35,000 palabras
    const messages = [
      { role: 'system', content: 'Eres un juez peruano.' },
      { role: 'user', content: nearLimitContent },
    ];

    const budget = ContextManager.calculateTokenBudget('openai/gpt-4o-mini', messages, 16384);

    // La suma NUNCA debe exceder contextWindow
    expect(budget.estimatedInputTokens + budget.maxTokens).toBeLessThanOrEqual(budget.contextWindow);
    // Debe haber clampado maxTokens dinámicamente o compactado
    expect(budget.maxTokens).toBeGreaterThanOrEqual(1024);
  });

  it('4. calculateTokenBudget compacts massive documents that exceed context window', () => {
    // Generar un documento gigantesco de 500,000 caracteres (~140,000 tokens) en un modelo de 128k
    const massiveContent = 'SENTENCIA N° 100-2026. CONSIDERANDO: ' + 'Fundamento jurídico procesal. '.repeat(16000) + ' FALLO: FUNDADA LA DEMANDA.';
    const messages = [
      { role: 'system', content: 'Directivas legales.' },
      { role: 'user', content: massiveContent },
    ];

    const budget = ContextManager.calculateTokenBudget('openai/gpt-4o-mini', messages, 8192);

    expect(budget.wasCompacted).toBe(true);
    expect(budget.estimatedInputTokens + budget.maxTokens).toBeLessThanOrEqual(budget.contextWindow);
    const userMsg = budget.sanitizedMessages.find((m) => m.role === 'user');
    expect(userMsg?.content).toContain('CONDENSACIÓN PROCESAL INTELIGENTE');
    expect(userMsg?.content).toContain('SENTENCIA N° 100-2026');
    expect(userMsg?.content).toContain('FALLO: FUNDADA LA DEMANDA');
  });

  it('5. calculateTokenBudget accommodates large prompts in 400k context model (GPT-5 Mini) without unnecessary compaction', () => {
    // En GPT-5 Mini (400k ventana), un documento de 80,000 tokens cabe perfectamente sin compactar
    const largeDoc = 'Texto extenso de expediente '.repeat(10000); // ~75,000 tokens
    const messages = [
      { role: 'system', content: 'Sistema legal.' },
      { role: 'user', content: largeDoc },
    ];

    const budget = ContextManager.calculateTokenBudget('openai/gpt-5-mini', messages, 16384);

    expect(budget.contextWindow).toBe(400000);
    expect(budget.wasCompacted).toBe(false);
    expect(budget.estimatedInputTokens + budget.maxTokens).toBeLessThanOrEqual(400000);
  });
});

