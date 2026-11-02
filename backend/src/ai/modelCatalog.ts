/**
 * Model Catalog & Provider Registry — HARDMAN
 * 
 * ÚNICA FUENTE DE VERDAD para todos los modelos y proveedores de IA en HARDMAN.
 * 
 * DIRECTIVA ARQUITECTÓNICA V3.1:
 * Toda la inteligencia artificial generativa de HARDMAN utiliza EXCLUSIVAMENTE:
 * - Proveedor: OpenRouter
 * - Modelo: anthropic/claude-sonnet-5.5
 * - Endpoint: https://openrouter.ai/api/v1/chat/completions
 * - Autenticación: OPENROUTER_API_KEY
 * 
 * Prohibido el uso de proveedores o modelos generativos alternativos como fallback
 * (no Gemini Direct, no DeepSeek, no Groq, no OpenAI, no Anthropic Direct).
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
    displayName: 'Anthropic Claude Sonnet 5.5 (OpenRouter)',
    supportedTasks: [
      'EXPEDIENTE_ANALYSIS',
      'DOCUMENT_DRAFTING',
      'LEGAL_CONSULTATION',
      'QUICK_ANSWER',
    ],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: true,
      audio: false,
      streaming: true,
    },
    contextWindow: 1000000, // 1M tokens oficiales en OpenRouter
    maxOutputTokens: 16384,
    status: 'OPERATIONAL',
    priority: 1,
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
    displayName: 'DeepSeek Chat (OpenRouter - Desactivado)',
    supportedTasks: [],
    capabilities: { text: true, image: false, pdfDocument: false, audio: false, streaming: true },
    contextWindow: 64000,
    maxOutputTokens: 8192,
    status: 'DISABLED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 0,
    deprecatedReason: 'Desactivado por directiva: fallback a modelos alternativos prohibido.',
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
    // 1. Debe estar configurado el proveedor OpenRouter
    if (!configuredProviders.openrouter) {
      return [];
    }

    const sonnetDef = MODEL_REGISTRY['anthropic/claude-sonnet-5.5'];
    if (!sonnetDef) return [];

    const override = this.dynamicStatusOverrides.get(sonnetDef.id);
    const effectiveStatus = override || sonnetDef.status;

    // Si el modelo fue deshabilitado por el disyuntor o 404, no devolver candidato (prohibido fallback a otros modelos)
    if (effectiveStatus === 'DISABLED' || effectiveStatus === 'DEPRECATED') {
      return [];
    }

    return [{
      provider: 'openrouter',
      model: sonnetDef.id,
      maxTokens: sonnetDef.maxOutputTokens,
      temperature: 0.0, // Determinismo estricto para toda tarea jurídica
      timeoutMs: sonnetDef.timeoutMs,
    }];
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
