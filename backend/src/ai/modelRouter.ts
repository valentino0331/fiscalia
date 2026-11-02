/**
 * Model Router — HARDMAN
 * 
 * Enrutador inteligente de modelos y tareas.
 * Selecciona el modelo óptimo según la carga de contexto, materia jurídica y tipo de requerimiento,
 * y gestiona la cascada de fallbacks de forma transparente y auditable.
 */

import { TaskType, ModelCandidate, AiProviderName } from './types';

export function detectTaskType(
  userQuery: string,
  hasLargeDoc: boolean,
  isDraftingRequest: boolean
): TaskType {
  if (hasLargeDoc) {
    return 'EXPEDIENTE_ANALYSIS';
  }
  if (isDraftingRequest) {
    return 'DOCUMENT_DRAFTING';
  }
  if (userQuery.length < 80 && !userQuery.toLowerCase().includes('demanda') && !userQuery.toLowerCase().includes('escrito')) {
    return 'QUICK_ANSWER';
  }
  return 'LEGAL_CONSULTATION';
}

export function getCandidatesForTask(
  taskType: TaskType,
  hasOpenRouter: boolean,
  hasGroq: boolean,
  hasGemini: boolean,
  hasOpenAI: boolean,
  hasDeepSeek: boolean,
  hasAnthropic: boolean
): ModelCandidate[] {
  const candidates: ModelCandidate[] = [];

  switch (taskType) {
    case 'EXPEDIENTE_ANALYSIS': {
      // Prioridad: Modelos con ventana de contexto de 1M tokens (Gemini 2.5 Flash / 2.0 Flash) con temperatura determinista
      if (hasOpenRouter) {
        candidates.push({
          provider: 'openrouter',
          model: 'google/gemini-2.5-flash',
          maxTokens: 16384,
          temperature: 0.0,
          timeoutMs: 90000,
        });
        candidates.push({
          provider: 'openrouter',
          model: 'google/gemini-2.0-flash-001',
          maxTokens: 16384,
          temperature: 0.0,
          timeoutMs: 75000,
        });
      }
      if (hasGemini) {
        candidates.push({
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          maxTokens: 16384,
          temperature: 0.0,
          timeoutMs: 60000,
        });
      }
      if (hasOpenRouter) {
        candidates.push({
          provider: 'openrouter',
          model: 'deepseek/deepseek-chat',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 60000,
        });
      }
      if (hasGroq) {
        candidates.push({
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          maxTokens: 8000,
          temperature: 0.0,
          timeoutMs: 45000,
        });
      }
      break;
    }

    case 'DOCUMENT_DRAFTING': {
      // Prioridad: Modelos con alta pulcritud sintáctica y redacción procesal formal determinista
      if (hasOpenRouter) {
        candidates.push({
          provider: 'openrouter',
          model: 'google/gemini-2.5-flash',
          maxTokens: 16384,
          temperature: 0.0,
          timeoutMs: 90000,
        });
        candidates.push({
          provider: 'openrouter',
          model: 'deepseek/deepseek-chat',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 75000,
        });
      }
      if (hasGroq) {
        candidates.push({
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          maxTokens: 8000,
          temperature: 0.0,
          timeoutMs: 35000,
        });
      }
      if (hasGemini) {
        candidates.push({
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          maxTokens: 12000,
          temperature: 0.0,
          timeoutMs: 45000,
        });
      }
      if (hasAnthropic) {
        candidates.push({
          provider: 'anthropic',
          model: 'claude-3-5-haiku-20241022',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 35000,
        });
      }
      break;
    }

    case 'QUICK_ANSWER': {
      // Prioridad: Latencia ultrabaja (< 400ms)
      if (hasGroq) {
        candidates.push({
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          maxTokens: 4096,
          temperature: 0.05,
          timeoutMs: 15000,
        });
      }
      if (hasOpenRouter) {
        candidates.push({
          provider: 'openrouter',
          model: 'deepseek/deepseek-chat',
          maxTokens: 4096,
          temperature: 0.05,
          timeoutMs: 25000,
        });
      }
      if (hasGemini) {
        candidates.push({
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          maxTokens: 4096,
          temperature: 0.05,
          timeoutMs: 25000,
        });
      }
      break;
    }

    case 'LEGAL_CONSULTATION':
    default: {
      // Prioridad estándar: Determinismo legal absoluto (temperatura 0.0)
      if (hasOpenRouter) {
        candidates.push({
          provider: 'openrouter',
          model: 'deepseek/deepseek-chat',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 45000,
        });
        candidates.push({
          provider: 'openrouter',
          model: 'google/gemini-2.5-flash',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 45000,
        });
      }
      if (hasGroq) {
        candidates.push({
          provider: 'groq',
          model: 'llama-3.3-70b-versatile',
          maxTokens: 8000,
          temperature: 0.0,
          timeoutMs: 30000,
        });
      }
      if (hasGemini) {
        candidates.push({
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 35000,
        });
      }
      if (hasOpenAI) {
        candidates.push({
          provider: 'openai',
          model: 'gpt-4o-mini',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 20000,
        });
      }
      if (hasDeepSeek) {
        candidates.push({
          provider: 'deepseek',
          model: 'deepseek-chat',
          maxTokens: 8192,
          temperature: 0.0,
          timeoutMs: 25000,
        });
      }
      break;
    }
  }

  return candidates;
}

