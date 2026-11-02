/**
 * Model Router — HARDMAN
 * 
 * Enrutador inteligente de modelos y tareas.
 * Selecciona el modelo óptimo según la carga de contexto, materia jurídica y tipo de requerimiento,
 * delegando la resolución de candidatos al ModelCatalog como única fuente canónica de verdad.
 */

import { TaskType, ModelCandidate, AiProviderName } from './types';
import { ModelCatalog } from './modelCatalog';

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
  const configuredProviders: Record<AiProviderName, boolean> = {
    openrouter: hasOpenRouter,
    groq: hasGroq,
    gemini: hasGemini,
    openai: hasOpenAI,
    deepseek: hasDeepSeek,
    anthropic: hasAnthropic,
    system_unavailable: false,
    emergency_mock: false,
  };

  return ModelCatalog.getCandidatesForTask(taskType, configuredProviders);
}
