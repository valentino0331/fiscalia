/**
 * Provider Adapter — HARDMAN
 * 
 * Capa de abstracción y ejecución unificada multi-proveedor.
 * Soporta OpenRouter, Groq, Google Gemini Direct, OpenAI, DeepSeek y Anthropic.
 * Registra latencia, errores y modelo real ejecutado con transparencia total.
 */

import Anthropic from '@anthropic-ai/sdk';
import { ModelCandidate, ModelExecutionResult, AiProviderName } from './types';
import { ModelCatalog } from './modelCatalog';

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
  /**
   * Ejecuta un candidato de modelo específico con timeout y control de errores estricto
   */
  public static async executeCandidate(
    candidate: ModelCandidate,
    messages: { role: string; content: string }[],
    isStream: boolean,
    onChunk?: (chunk: string) => void,
    externalSignal?: AbortSignal
  ): Promise<ModelExecutionResult> {
    const startTime = Date.now();
    const { provider, model, maxTokens, temperature, timeoutMs } = candidate;

    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort();
      } else {
        externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    try {
      let outputText = '';

      switch (provider) {
        case 'openrouter': {
          const key = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
          if (!key) throw new ProviderExecutionError(provider, model, 'Clave API no configurada');

          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://fiscalia-t0bl.onrender.com',
              'X-Title': 'Hardman',
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              stream: isStream,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errData = await res.text().catch(() => '');
            if (res.status === 404) {
              ModelCatalog.markModelStatus(model, 'DISABLED', `OpenRouter HTTP 404: ${errData.slice(0, 100)}`);
            }
            throw new ProviderExecutionError(provider, model, `HTTP ${res.status}: ${errData.slice(0, 200)}`, res.status);
          }

          if (isStream && res.body) {
            outputText = await this.readStreamSSE(res.body, onChunk);
          } else {
            const data: any = await res.json();
            outputText = data.choices?.[0]?.message?.content || '';
          }
          break;
        }

        case 'groq': {
          const key = process.env.GROQ_API_KEY;
          if (!key) throw new ProviderExecutionError(provider, model, 'Clave API no configurada');

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: Math.min(8000, maxTokens),
              stream: isStream,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errData = await res.text().catch(() => '');
            if (res.status === 404) {
              ModelCatalog.markModelStatus(model, 'DISABLED', `OpenRouter HTTP 404: ${errData.slice(0, 100)}`);
            }
            throw new ProviderExecutionError(provider, model, `HTTP ${res.status}: ${errData.slice(0, 200)}`, res.status);
          }

          if (isStream && res.body) {
            outputText = await this.readStreamSSE(res.body, onChunk);
          } else {
            const data: any = await res.json();
            outputText = data.choices?.[0]?.message?.content || '';
          }
          break;
        }

        case 'gemini': {
          const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
          if (!key) throw new ProviderExecutionError(provider, model, 'Clave API no configurada');

          const endpoint = isStream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${endpoint}key=${key}`;

          const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
          const userMsgs = messages.filter((m) => m.role !== 'system');

          const body: any = {
            systemInstruction: systemMsg ? { parts: [{ text: systemMsg }] } : undefined,
            contents: userMsgs.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
            },
          };

          let activeModel = model;
          let res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          // Si el modelo específico retorna 404 (ej. modelo deprecado por Google), conmutar dinámicamente a modelos canónicos activos
          if (!res.ok && res.status === 404) {
            console.warn(`[ProviderAdapter:gemini] Modelo ${activeModel} devolvió 404. Desactivando en ModelCatalog e intentando conmutación dinámica...`);
            ModelCatalog.markModelStatus(activeModel, 'DISABLED', 'Google REST API HTTP 404: Model no longer available');
            const fallbackModels = ['gemini-3.8-flash', 'gemini-2.5-flash'].filter(
              (m) => m !== activeModel
            );
            for (const fbModel of fallbackModels) {
              const fbUrl = `https://generativelanguage.googleapis.com/v1beta/models/${fbModel}:${endpoint}key=${key}`;
              try {
                const fbRes = await fetch(fbUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                  signal: controller.signal,
                });
                if (fbRes.ok) {
                  res = fbRes;
                  activeModel = fbModel;
                  console.log(`[ProviderAdapter:gemini] Conmutación exitosa a modelo activo: ${fbModel}`);
                  break;
                }
              } catch {
                // Continuar intentando con el siguiente modelo activo
              }
            }
          }

          if (!res.ok) {
            const errData = await res.text().catch(() => '');
            throw new ProviderExecutionError(provider, activeModel, `HTTP ${res.status}: ${errData.slice(0, 200)}`, res.status);
          }

          if (isStream && res.body) {
            outputText = await this.readStreamGemini(res.body, onChunk);
          } else {
            const data: any = await res.json();
            outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          }
          break;
        }

        case 'deepseek': {
          const key = process.env.DEEPSEEK_API_KEY;
          if (!key) throw new ProviderExecutionError(provider, model, 'Clave API no configurada');

          const res = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: Math.min(8192, maxTokens),
              stream: isStream,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errData = await res.text().catch(() => '');
            if (res.status === 404) {
              ModelCatalog.markModelStatus(model, 'DISABLED', `OpenRouter HTTP 404: ${errData.slice(0, 100)}`);
            }
            throw new ProviderExecutionError(provider, model, `HTTP ${res.status}: ${errData.slice(0, 200)}`, res.status);
          }

          if (isStream && res.body) {
            outputText = await this.readStreamSSE(res.body, onChunk);
          } else {
            const data: any = await res.json();
            outputText = data.choices?.[0]?.message?.content || '';
          }
          break;
        }

        case 'openai': {
          const key = process.env.OPENAI_API_KEY;
          if (!key) throw new ProviderExecutionError(provider, model, 'Clave API no configurada');

          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${key}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages,
              temperature,
              max_tokens: maxTokens,
              stream: isStream,
            }),
            signal: controller.signal,
          });

          if (!res.ok) {
            const errData = await res.text().catch(() => '');
            if (res.status === 404) {
              ModelCatalog.markModelStatus(model, 'DISABLED', `OpenRouter HTTP 404: ${errData.slice(0, 100)}`);
            }
            throw new ProviderExecutionError(provider, model, `HTTP ${res.status}: ${errData.slice(0, 200)}`, res.status);
          }

          if (isStream && res.body) {
            outputText = await this.readStreamSSE(res.body, onChunk);
          } else {
            const data: any = await res.json();
            outputText = data.choices?.[0]?.message?.content || '';
          }
          break;
        }

        case 'anthropic': {
          const key = process.env.ANTHROPIC_API_KEY;
          if (!key) throw new ProviderExecutionError(provider, model, 'Clave API no configurada');

          const anthropic = new Anthropic({ apiKey: key });
          const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
          const userMsgs = messages.filter((m) => m.role !== 'system') as any[];

          const res = await anthropic.messages.create({
            model,
            max_tokens: maxTokens,
            system: systemMsg,
            messages: userMsgs.map((m) => ({ role: m.role, content: m.content })),
          });

          outputText = res.content[0].type === 'text' ? res.content[0].text : '';
          if (isStream && onChunk && outputText) {
            onChunk(outputText);
          }
          break;
        }

        case 'emergency_mock':
        default: {
          outputText = 'Estimado letrado: El sistema ha recepcionado su consulta. Los motores de inferencia no se encuentran temporalmente disponibles. Por favor, reintente en unos instantes.';
          if (isStream && onChunk) onChunk(outputText);
          break;
        }
      }

      clearTimeout(timeoutTimer);

      if (!outputText || outputText.trim().length === 0) {
        throw new ProviderExecutionError(provider, model, 'Respuesta vacía recibida del proveedor');
      }

      return {
        text: outputText,
        provider,
        model,
        durationMs: Date.now() - startTime,
        fallbackOccurred: false,
      };
    } catch (err: any) {
      clearTimeout(timeoutTimer);
      if (err instanceof ProviderExecutionError) throw err;
      throw new ProviderExecutionError(
        provider,
        model,
        err.name === 'AbortError' ? `Timeout tras ${timeoutMs}ms` : err.message || 'Error desconocido'
      );
    }
  }

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

  private static async readStreamGemini(body: any, onChunk?: (chunk: string) => void): Promise<string> {
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

        try {
          const parsed = JSON.parse(dataStr);
          const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

