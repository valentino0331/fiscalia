/**
 * Model Catalog & Provider Registry — HARDMAN
 * 
 * ÚNICA FUENTE DE VERDAD para todos los modelos y proveedores de IA en HARDMAN.
 * 
 * DIRECTIVA ARQUITECTÓNICA DE ALTA RENTABILIDAD Y CALIDAD JURÍDICA:
 * Proveedor Central: OpenRouter (https://openrouter.ai/api/v1/chat/completions)
 * 1. Candidato Primario: deepseek/deepseek-chat (DeepSeek V3: Razonamiento superior, ~$0.01/consulta)
 * 2. Candidato de Respaldo: openai/gpt-4o-mini (Resiliencia y disponibilidad 99.99%, ~$0.007/consulta)
 */

import { AiProviderName, ModelCandidate, TaskType } from './types';

export type ExtendedTaskType = 
  | TaskType 
  | 'OCR_DOCUMENT' 
  | 'AUDIO_TRANSCRIPTION' 
  | 'EMBEDDING';

export type ModelOperationalStatus = 
  | 'OPERATIONAL' 
  | 'DEGRADED' 
  | 'DISABLED' 
  | 'DEPRECATED';

export type ModelApiType = 
  | 'openai-compatible' 
  | 'gemini-rest' 
  | 'anthropic' 
  | 'gemini-embedding';

export interface ModelDefinition {
  id: string;
  provider: AiProviderName;
  apiType: ModelApiType;
  displayName: string;
  supportedTasks: ExtendedTaskType[];
  capabilities: {
    text: boolean;
    image: boolean;
    pdfDocument: boolean;
    audio: boolean;
    streaming: boolean;
  };
  contextWindow: number;
  maxOutputTokens: number;
  status: ModelOperationalStatus;
  priority: number; // 1 = primario único
  defaultTemperature: number;
  timeoutMs: number;
  maxRetries: number;
  deprecatedReason?: string;
}

/**
 * Catálogo Canónico y Centralizado de Modelos de Inteligencia Artificial
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  // ── ANTHROPIC CLAUDE SONNET 5.5 VIA OPENROUTER (ÚNICO MODELO GENERATIVO CANÓNICO) ──
  'anthropic/claude-sonnet-5.5': {
    id: 'anthropic/claude-sonnet-5.5',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'Anthropic Claude Sonnet 5.5 (Desactivado por Coste)',
    supportedTasks: [],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: true,
      audio: false,
      streaming: true,
    },
    contextWindow: 1000000,
    maxOutputTokens: 16384,
    status: 'DISABLED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 90000,
    maxRetries: 2,
  },

  // ── MODELOS DEPRECADOS / DESACTIVADOS (PROHIBICIÓN DE FALLBACK SEGÚN DIRECTIVA) ──
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 3.8 Flash (Direct)',
    supportedTasks: [],
    capabilities: { text: true, image: true, pdfDocument: true, audio: false, streaming: true },
    contextWindow: 1048576,
    maxOutputTokens: 16384,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 0,
    deprecatedReason: 'Generative AI restricted exclusively to anthropic/claude-sonnet-5.5 via OpenRouter',
  },

  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 2.5 Flash (Direct)',
    supportedTasks: [],
    capabilities: { text: true, image: true, pdfDocument: true, audio: false, streaming: true },
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 0,
    deprecatedReason: 'Generative AI restricted exclusively to anthropic/claude-sonnet-5.5 via OpenRouter',
  },

  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 2.0 Flash (Direct - Obsoleto)',
    supportedTasks: [],
    capabilities: { text: false, image: false, pdfDocument: false, audio: false, streaming: false },
    contextWindow: 0,
    maxOutputTokens: 0,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 0,
    maxRetries: 0,
    deprecatedReason: 'HTTP 404 permanente. Retirado por Google.',
  },

  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 1.5 Flash (Direct - Obsoleto)',
    supportedTasks: [],
    capabilities: { text: false, image: false, pdfDocument: false, audio: false, streaming: false },
    contextWindow: 0,
    maxOutputTokens: 0,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 0,
    maxRetries: 0,
    deprecatedReason: 'HTTP 404 permanente. Retirado por Google.',
  },

  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'DeepSeek V3 (OpenRouter - Primario)',
    supportedTasks: [
      'EXPEDIENTE_ANALYSIS',
      'DOCUMENT_DRAFTING',
      'LEGAL_CONSULTATION',
      'QUICK_ANSWER',
    ],
    capabilities: {
      text: true,
      image: false,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 8192,
    status: 'OPERATIONAL',
    priority: 1,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 1,
  },

  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'GPT-4o Mini (OpenRouter - Respaldo Resiliente)',
    supportedTasks: [
      'EXPEDIENTE_ANALYSIS',
      'DOCUMENT_DRAFTING',
      'LEGAL_CONSULTATION',
      'QUICK_ANSWER',
    ],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 16384,
    status: 'OPERATIONAL',
    priority: 2,
    defaultTemperature: 0.0,
    timeoutMs: 45000,
    maxRetries: 2,
  },

  'meta-llama/llama-3.3-70b-instruct': {
    id: 'meta-llama/llama-3.3-70b-instruct',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'Llama 3.3 70B Instruct (OpenRouter - Desactivado)',
    supportedTasks: [],
    capabilities: { text: true, image: false, pdfDocument: false, audio: false, streaming: true },
    contextWindow: 131072,
    maxOutputTokens: 8192,
    status: 'DISABLED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 0,
    deprecatedReason: 'Desactivado por directiva: fallback a modelos alternativos prohibido.',
  },

  'google/gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'Google Gemini 2.5 Flash (OpenRouter - Desactivado)',
    supportedTasks: [],
    capabilities: { text: true, image: true, pdfDocument: true, audio: false, streaming: true },
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    status: 'DISABLED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 0,
    deprecatedReason: 'Desactivado por directiva: fallback a modelos alternativos prohibido.',
  },

  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    apiType: 'openai-compatible',
    displayName: 'Llama 3.3 70B Versatile (Groq - Desactivado)',
    supportedTasks: [],
    capabilities: { text: true, image: false, pdfDocument: false, audio: false, streaming: true },
    contextWindow: 128000,
    maxOutputTokens: 8000,
    status: 'DISABLED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 25000,
    maxRetries: 0,
    deprecatedReason: 'Groq no autorizado para IA generativa.',
  },

  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    apiType: 'openai-compatible',
    displayName: 'GPT-4o Mini (OpenAI - Desactivado)',
    supportedTasks: [],
    capabilities: { text: true, image: false, pdfDocument: false, audio: false, streaming: true },
    contextWindow: 128000,
    maxOutputTokens: 8192,
    status: 'DISABLED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 20000,
    maxRetries: 0,
    deprecatedReason: 'OpenAI no autorizado para IA generativa.',
  },
};

export class ModelCatalog {
  private static dynamicStatusOverrides: Map<string, ModelOperationalStatus> = new Map();

  /**
   * Obtiene la definición completa de un modelo por su ID
   */
  public static getModel(modelId: string): ModelDefinition | undefined {
    const base = MODEL_REGISTRY[modelId];
    if (!base) return undefined;
    const override = this.dynamicStatusOverrides.get(modelId);
    return override ? { ...base, status: override } : base;
  }

  /**
   * Actualiza el estado dinámico de un modelo (ej. desactiva si devuelve HTTP 404)
   */
  public static markModelStatus(modelId: string, status: ModelOperationalStatus, reason?: string): void {
    console.warn(`[ModelCatalog] Estado de modelo ${modelId} actualizado a ${status}${reason ? `: ${reason}` : ''}`);
    this.dynamicStatusOverrides.set(modelId, status);
  }

  /**
   * Obtiene los candidatos operacionales y clasificados por prioridad para una tarea dada.
   * Por directiva de arquitectura, retorna EXCLUSIVAMENTE anthropic/claude-sonnet-5.5 vía OpenRouter.
   */
  public static getCandidatesForTask(
    taskType: ExtendedTaskType,
    configuredProviders: Record<AiProviderName, boolean>
  ): ModelCandidate[] {
    if (!configuredProviders.openrouter) {
      return [];
    }

    const candidates: ModelCandidate[] = [];

    // Candidato 1 (Opción 2 - Primario): DeepSeek V3 en OpenRouter (~$0.01/consulta)
    const deepseekDef = MODEL_REGISTRY['deepseek/deepseek-chat'];
    if (deepseekDef) {
      const override = this.dynamicStatusOverrides.get(deepseekDef.id);
      const effectiveStatus = override || deepseekDef.status;
      if (effectiveStatus === 'OPERATIONAL' || effectiveStatus === 'DEGRADED') {
        candidates.push({
          provider: 'openrouter',
          model: deepseekDef.id,
          maxTokens: deepseekDef.maxOutputTokens,
          temperature: 0.0,
          timeoutMs: deepseekDef.timeoutMs,
        });
      }
    }

    // Candidato 2 (Opción 1 - Respaldo Inmediato): GPT-4o Mini en OpenRouter (~$0.007/consulta)
    const gptDef = MODEL_REGISTRY['openai/gpt-4o-mini'];
    if (gptDef) {
      const override = this.dynamicStatusOverrides.get(gptDef.id);
      const effectiveStatus = override || gptDef.status;
      if (effectiveStatus === 'OPERATIONAL' || effectiveStatus === 'DEGRADED') {
        candidates.push({
          provider: 'openrouter',
          model: gptDef.id,
          maxTokens: gptDef.maxOutputTokens,
          temperature: 0.0,
          timeoutMs: gptDef.timeoutMs,
        });
      }
    }

    return candidates;
  }

  /**
   * Retorna todos los modelos registrados y su estado actual
   */
  public static getAllModels(): ModelDefinition[] {
    return Object.values(MODEL_REGISTRY).map((def) => {
      const override = this.dynamicStatusOverrides.get(def.id);
      return override ? { ...def, status: override } : def;
    });
  }

  /**
   * Resetea los overrides de estado dinámico (para pruebas)
   */
  public static resetOverrides(): void {
    this.dynamicStatusOverrides.clear();
  }
}
