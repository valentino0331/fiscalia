/**
 * Model Catalog & Provider Registry — HARDMAN
 * 
 * ÚNICA FUENTE DE VERDAD para todos los modelos y proveedores de IA en HARDMAN.
 * Centraliza:
 * 1. Identificadores exactos validados contra las APIs oficiales al 2026.
 * 2. Capacidades reales (texto, imagen, documentos PDF nativos, audio, streaming).
 * 3. Ventanas de contexto y límites de tokens de salida.
 * 4. Estados operativos (OPERATIONAL, DEGRADED, DISABLED, DEPRECATED).
 * 5. Prioridades de enrutamiento por tipo de tarea.
 * 6. Timeouts calibrados y políticas de reintento.
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
  | 'gemini-rest' 
  | 'openai-compatible' 
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
  priority: number; // 1 = primario, 2 = secundario, 3 = terciario
  defaultTemperature: number;
  timeoutMs: number;
  maxRetries: number;
  deprecatedReason?: string;
}

/**
 * Catálogo Canónico y Centralizado de Modelos de Inteligencia Artificial
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  // ── GOOGLE GEMINI DIRECT (v1beta REST API) ──
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 3.8 Flash (Direct)',
    supportedTasks: ['EXPEDIENTE_ANALYSIS', 'DOCUMENT_DRAFTING', 'LEGAL_CONSULTATION', 'QUICK_ANSWER', 'OCR_DOCUMENT', 'AUDIO_TRANSCRIPTION'],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: true,
      audio: true,
      streaming: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 16384,
    status: 'OPERATIONAL',
    priority: 1,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 1,
  },

  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 2.5 Flash (Direct)',
    supportedTasks: ['EXPEDIENTE_ANALYSIS', 'DOCUMENT_DRAFTING', 'LEGAL_CONSULTATION', 'QUICK_ANSWER', 'OCR_DOCUMENT', 'AUDIO_TRANSCRIPTION'],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: true,
      audio: true,
      streaming: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    status: 'OPERATIONAL',
    priority: 2,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 1,
  },

  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 2.5 Pro (Direct)',
    supportedTasks: ['EXPEDIENTE_ANALYSIS', 'DOCUMENT_DRAFTING'],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: true,
      audio: false,
      streaming: true,
    },
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    status: 'OPERATIONAL',
    priority: 3,
    defaultTemperature: 0.0,
    timeoutMs: 75000,
    maxRetries: 1,
  },

  // ── MODELOS OBSOLETOS DE GOOGLE (BLOQUEADOS Y DESACTIVADOS) ──
  'gemini-2.0-flash': {
    id: 'gemini-2.0-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 2.0 Flash (Deprecated)',
    supportedTasks: [],
    capabilities: { text: false, image: false, pdfDocument: false, audio: false, streaming: false },
    contextWindow: 0,
    maxOutputTokens: 0,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 0,
    maxRetries: 0,
    deprecatedReason: 'Descontinuado permanentemente por Google API (HTTP 404). Sustituido por gemini-3.8-flash.',
  },

  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    provider: 'gemini',
    apiType: 'gemini-rest',
    displayName: 'Google Gemini 1.5 Flash (Deprecated)',
    supportedTasks: [],
    capabilities: { text: false, image: false, pdfDocument: false, audio: false, streaming: false },
    contextWindow: 0,
    maxOutputTokens: 0,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 0,
    maxRetries: 0,
    deprecatedReason: 'Descontinuado en endpoints v1beta (HTTP 404). Sustituido por gemini-3.8-flash y gemini-2.5-flash.',
  },

  // ── OPENROUTER ──
  'google/gemini-2.5-flash': {
    id: 'google/gemini-2.5-flash',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'Gemini 2.5 Flash (via OpenRouter)',
    supportedTasks: ['EXPEDIENTE_ANALYSIS', 'DOCUMENT_DRAFTING', 'LEGAL_CONSULTATION', 'QUICK_ANSWER', 'OCR_DOCUMENT'],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    status: 'OPERATIONAL',
    priority: 1,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 1,
  },

  'meta-llama/llama-3.3-70b-instruct': {
    id: 'meta-llama/llama-3.3-70b-instruct',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'Llama 3.3 70B Instruct (via OpenRouter)',
    supportedTasks: ['EXPEDIENTE_ANALYSIS', 'DOCUMENT_DRAFTING', 'LEGAL_CONSULTATION'],
    capabilities: {
      text: true,
      image: false,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 131072,
    maxOutputTokens: 16384,
    status: 'OPERATIONAL',
    priority: 2,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 1,
  },

  'deepseek/deepseek-chat': {
    id: 'deepseek/deepseek-chat',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'DeepSeek-V3 Chat (via OpenRouter)',
    supportedTasks: ['DOCUMENT_DRAFTING', 'LEGAL_CONSULTATION'],
    capabilities: {
      text: true,
      image: false,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 64000,
    maxOutputTokens: 8192,
    status: 'DEGRADED', // Frecuente rate limit 429 upstream: asignado como fallback terciario, nunca primario
    priority: 3,
    defaultTemperature: 0.0,
    timeoutMs: 60000,
    maxRetries: 0,
  },

  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'GPT-4o Mini (via OpenRouter)',
    supportedTasks: ['OCR_DOCUMENT', 'QUICK_ANSWER'],
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
    timeoutMs: 30000,
    maxRetries: 1,
  },

  // ── MODELOS OBSOLETOS DE OPENROUTER ──
  'google/gemini-2.0-flash-001': {
    id: 'google/gemini-2.0-flash-001',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'Gemini 2.0 Flash 001 (Deprecated)',
    supportedTasks: [],
    capabilities: { text: false, image: false, pdfDocument: false, audio: false, streaming: false },
    contextWindow: 0,
    maxOutputTokens: 0,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 0,
    maxRetries: 0,
    deprecatedReason: 'Modelo descontinuado en OpenRouter (HTTP 404).',
  },

  'google/gemini-flash-1.5': {
    id: 'google/gemini-flash-1.5',
    provider: 'openrouter',
    apiType: 'openai-compatible',
    displayName: 'Gemini Flash 1.5 (Deprecated)',
    supportedTasks: [],
    capabilities: { text: false, image: false, pdfDocument: false, audio: false, streaming: false },
    contextWindow: 0,
    maxOutputTokens: 0,
    status: 'DEPRECATED',
    priority: 99,
    defaultTemperature: 0.0,
    timeoutMs: 0,
    maxRetries: 0,
    deprecatedReason: 'Slug obsoleto en OpenRouter.',
  },

  // ── GROQ (Latencia Ultrabaja) ──
  'llama-3.3-70b-versatile': {
    id: 'llama-3.3-70b-versatile',
    provider: 'groq',
    apiType: 'openai-compatible',
    displayName: 'Llama 3.3 70B Versatile (Groq)',
    supportedTasks: ['QUICK_ANSWER', 'LEGAL_CONSULTATION', 'DOCUMENT_DRAFTING'],
    capabilities: {
      text: true,
      image: false,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 8000,
    status: 'OPERATIONAL',
    priority: 1,
    defaultTemperature: 0.05,
    timeoutMs: 25000,
    maxRetries: 1,
  },

  // ── ANTHROPIC ──
  'claude-3-5-haiku-20241022': {
    id: 'claude-3-5-haiku-20241022',
    provider: 'anthropic',
    apiType: 'anthropic',
    displayName: 'Claude 3.5 Haiku',
    supportedTasks: ['DOCUMENT_DRAFTING', 'LEGAL_CONSULTATION'],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 200000,
    maxOutputTokens: 8192,
    status: 'OPERATIONAL',
    priority: 2,
    defaultTemperature: 0.0,
    timeoutMs: 35000,
    maxRetries: 1,
  },

  // ── OPENAI DIRECT ──
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    provider: 'openai',
    apiType: 'openai-compatible',
    displayName: 'GPT-4o Mini (Direct)',
    supportedTasks: ['OCR_DOCUMENT', 'QUICK_ANSWER'],
    capabilities: {
      text: true,
      image: true,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 128000,
    maxOutputTokens: 8192,
    status: 'OPERATIONAL',
    priority: 3,
    defaultTemperature: 0.0,
    timeoutMs: 25000,
    maxRetries: 1,
  },

  // ── DEEPSEEK DIRECT ──
  'deepseek-chat': {
    id: 'deepseek-chat',
    provider: 'deepseek',
    apiType: 'openai-compatible',
    displayName: 'DeepSeek Chat (Direct)',
    supportedTasks: ['LEGAL_CONSULTATION', 'DOCUMENT_DRAFTING'],
    capabilities: {
      text: true,
      image: false,
      pdfDocument: false,
      audio: false,
      streaming: true,
    },
    contextWindow: 64000,
    maxOutputTokens: 8192,
    status: 'OPERATIONAL',
    priority: 3,
    defaultTemperature: 0.0,
    timeoutMs: 30000,
    maxRetries: 1,
  },
};

/**
 * Gestor Central de Modelos y Proveedores
 */
export class ModelCatalog {
  private static dynamicStatusOverrides: Map<string, ModelOperationalStatus> = new Map();

  /**
   * Obtiene la definición oficial de un modelo por su ID
   */
  public static getModel(modelId: string): ModelDefinition | undefined {
    const base = MODEL_REGISTRY[modelId];
    if (!base) return undefined;
    const override = this.dynamicStatusOverrides.get(modelId);
    if (override) {
      return { ...base, status: override };
    }
    return base;
  }

  /**
   * Actualiza el estado dinámico de un modelo (ej. desactiva si devuelve HTTP 404)
   */
  public static markModelStatus(modelId: string, status: ModelOperationalStatus, reason?: string): void {
    console.warn(`[ModelCatalog] Estado de modelo ${modelId} actualizado a ${status}${reason ? `: ${reason}` : ''}`);
    this.dynamicStatusOverrides.set(modelId, status);
  }

  /**
   * Obtiene los candidatos operacionales y clasificados por prioridad para una tarea dada
   */
  public static getCandidatesForTask(
    taskType: ExtendedTaskType,
    configuredProviders: Record<AiProviderName, boolean>
  ): ModelCandidate[] {
    const eligible = Object.values(MODEL_REGISTRY)
      .map((def) => {
        const override = this.dynamicStatusOverrides.get(def.id);
        return override ? { ...def, status: override } : def;
      })
      .filter((def) => {
        // 1. Debe estar configurado el proveedor en las variables de entorno
        if (!configuredProviders[def.provider]) return false;
        // 2. Debe estar OPERATIONAL o DEGRADED (nunca DISABLED o DEPRECATED)
        if (def.status === 'DISABLED' || def.status === 'DEPRECATED') return false;
        // 3. Debe soportar la tarea solicitada
        if (!def.supportedTasks.includes(taskType)) return false;
        return true;
      });

    // Ordenar por prioridad ascendente (1 = primario, 2 = secundario, etc.)
    eligible.sort((a, b) => a.priority - b.priority);

    const isStrictDeterministicTask =
      taskType === 'DOCUMENT_DRAFTING' ||
      taskType === 'LEGAL_CONSULTATION' ||
      taskType === 'EXPEDIENTE_ANALYSIS';

    return eligible.map((def) => ({
      provider: def.provider,
      model: def.id,
      maxTokens: def.maxOutputTokens,
      temperature: isStrictDeterministicTask ? 0.0 : def.defaultTemperature,
      timeoutMs: def.timeoutMs,
    }));
  }

  /**
   * Obtiene modelos compatibles con OCR para un tipo MIME documental dado
   */
  public static getOcrModels(
    mimeType: string,
    configuredProviders: Record<AiProviderName, boolean>
  ): ModelDefinition[] {
    const isPdf = mimeType === 'application/pdf' || mimeType.endsWith('.pdf');
    const isImage = mimeType.startsWith('image/');

    return Object.values(MODEL_REGISTRY)
      .map((def) => {
        const override = this.dynamicStatusOverrides.get(def.id);
        return override ? { ...def, status: override } : def;
      })
      .filter((def) => {
        if (!configuredProviders[def.provider]) return false;
        if (def.status === 'DISABLED' || def.status === 'DEPRECATED') return false;
        if (!def.supportedTasks.includes('OCR_DOCUMENT')) return false;

        if (isPdf && !def.capabilities.pdfDocument) return false;
        if (isImage && !def.capabilities.image) return false;

        return true;
      })
      .sort((a, b) => a.priority - b.priority);
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
