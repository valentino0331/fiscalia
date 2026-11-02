/**
 * Unified Central Generative Adapter — HARDMAN
 * 
 * ÚNICO adaptador centralizado para toda inferencia generativa en HARDMAN.
 * 
 * Restricciones no negociables:
 * 1. Proveedor exclusivo: OpenRouter (https://openrouter.ai/api/v1/chat/completions).
 * 2. Modelos canónicos autorizados: DeepSeek V3 (primario) y GPT-5 Mini / GPT-4o Mini (respaldo de gran contexto).
 * 3. Prohibido ejecutar llamadas directas a Anthropic SDK, Gemini Direct, Groq, DeepSeek u OpenAI.
 * 4. Control centralizado de timeouts, cancelación por AbortSignal, SSE streaming, detección de respuestas vacías y correlation IDs.
 * 5. Presupuesto dinámico de contexto (ContextManager) para garantizar que jamás ocurra HTTP 400 por desbordamiento de tokens.
 */

import { ModelCandidate, ModelExecutionResult, AiProviderName } from './types';
import { ModelCatalog } from './modelCatalog';
import { ContextManager } from './contextManager';

export class ProviderExecutionError extends Error {
  public provider: AiProviderName;
  public model: string;
  public statusCode?: number;
  public reason: string;

  constructor(provider: AiProviderName, model: string, reason: string, statusCode?: number) {
    super(`[${provider}:${model}] ${reason}`);
    this.name = 'ProviderExecutionError';
    this.provider = provider;
    this.model = model;
    this.statusCode = statusCode;
    this.reason = reason;
  }
}

export class ProviderAdapter {
  private static readonly AUTHORIZED_PROVIDER: AiProviderName = 'openrouter';
  private static readonly CANONICAL_MODEL = 'deepseek/deepseek-chat';

  /**
   * Ejecuta la llamada generativa unificada a través de OpenRouter (DeepSeek V3 / GPT-5 Mini / GPT-4o Mini)
   * con presupuesto dinámico de contexto que previene desbordamiento HTTP 400.
   */
  public static async executeCandidate(
    candidate: ModelCandidate,
    messages: { role: string; content: string }[],
    isStream: boolean,
    onChunk?: (chunk: string) => void,
    externalSignal?: AbortSignal,
    correlationId?: string
  ): Promise<ModelExecutionResult> {
    const startTime = Date.now();
    const { provider, model, maxTokens, temperature, timeoutMs } = candidate;

    // 1. Verificación estricta de modelo y proveedor autorizado
    if (provider !== this.AUTHORIZED_PROVIDER) {
      throw new ProviderExecutionError(
        provider,
        model,
        `Llamada no autorizada: Toda la IA generativa de Hardman está restringida exclusivamente a OpenRouter. Proveedor '${provider}' bloqueado.`
      );
    }

    const effectiveModel = model || (process.env.OPENROUTER_PRIMARY_MODEL || this.CANONICAL_MODEL);

    // 2. Cálculo determinista de presupuesto de tokens (ContextManager)
    const budget = ContextManager.calculateTokenBudget(effectiveModel, messages, maxTokens);
    if (budget.wasCompacted) {
      console.log(`[ProviderAdapter:${effectiveModel}] Contexto compactado por ContextManager: ~${budget.estimatedInputTokens} tokens de entrada, ${budget.maxTokens} tokens de salida máxima.`);
    }

    // 3. Control de Timeout y Señal de Aborto
    const controller = new AbortController();
    const timeoutDuration = Math.max(15000, timeoutMs || 90000);
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutDuration);

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      const key = (process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY || '').trim();
      if (!key) {
        throw new ProviderExecutionError(
          'openrouter',
          effectiveModel,
          'Clave OPENROUTER_API_KEY no configurada en las variables de entorno'
        );
      }

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hardman.lat',
        'X-Title': 'Hardman Legal AI',
      };

      if (correlationId) {
        headers['X-Correlation-ID'] = correlationId;
      }

      const payload = {
        model: effectiveModel,
        messages: budget.sanitizedMessages,
        temperature: typeof temperature === 'number' ? temperature : 0.0, // Determinismo estricto para análisis y redacción jurídica
        max_tokens: budget.maxTokens,
        stream: isStream,
      };

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutTimer);

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        if (res.status === 404) {
          ModelCatalog.markModelStatus(effectiveModel, 'DISABLED', `OpenRouter HTTP 404: ${errText.slice(0, 100)}`);
        }
        throw new ProviderExecutionError(
          'openrouter',
          effectiveModel,
          `HTTP ${res.status}: ${errText.slice(0, 200)}`,
          res.status
        );
      }

      let outputText = '';

      if (isStream && res.body) {
        outputText = await this.readStreamSSE(res.body, onChunk);
      } else {
        const data: any = await res.json();
        outputText = data.choices?.[0]?.message?.content || '';
      }

      // 4. Detección y manejo resiliente de respuestas vacías
      if (!outputText || !outputText.trim()) {
        // Si no fue abortado, intentar 1 reintento inmediato en modo no-streaming
        if (!controller.signal.aborted && !externalSignal?.aborted) {
          console.warn(`[ProviderAdapter:${effectiveModel}] Respuesta vacía recibida en intento 1. Ejecutando reintento inmediato no-streaming...`);
          const retryRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify({ ...payload, stream: false }),
            signal: controller.signal,
          });

          if (retryRes.ok) {
            const retryData: any = await retryRes.json();
            const retryText = retryData.choices?.[0]?.message?.content || '';
            if (retryText && retryText.trim()) {
              console.log(`[ProviderAdapter:${effectiveModel}] Reintento inmediato exitoso (${retryText.length} caracteres).`);
              if (isStream && onChunk) {
                onChunk(retryText);
              }
              return {
                text: retryText,
                provider: 'openrouter',
                model: effectiveModel,
                durationMs: Date.now() - startTime,
                fallbackOccurred: false,
              };
            }
          }
        }

        throw new ProviderExecutionError(
          'openrouter',
          effectiveModel,
          'Respuesta vacía recibida del proveedor OpenRouter tras reintento',
          204
        );
      }

      return {
        text: outputText,
        provider: 'openrouter',
        model: effectiveModel,
        durationMs: Date.now() - startTime,
        fallbackOccurred: false,
      };
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      if (err instanceof ProviderExecutionError) throw err;
      throw new ProviderExecutionError(
        'openrouter',
        effectiveModel,
        err.name === 'AbortError' ? `Timeout tras ${timeoutDuration}ms` : err.message || 'Error desconocido'
      );
    }
  }

  /**
   * Procesa el flujo Server-Sent Events (SSE) de OpenRouter
   */
  private static async readStreamSSE(body: any, onChunk?: (chunk: string) => void): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const chunk = parsed.choices?.[0]?.delta?.content || '';
          if (chunk) {
            fullText += chunk;
            if (onChunk) onChunk(chunk);
          }
        } catch {
          // Ignorar chunks mal formateados
        }
      }
    }
    return fullText;
  }
}
