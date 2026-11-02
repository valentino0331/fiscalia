/**
 * Circuit Breaker, Error Classification & Provider Health Registry — HARDMAN
 * 
 * Implementa resiliencia de nivel empresarial para producción en Render:
 * 1. Clasificación estricta de errores HTTP (400, 401/403, 404, 408, 429, 5xx, Red, Vacío).
 * 2. Circuit Breaker independiente por proveedor con estados CLOSED, OPEN y HALF_OPEN.
 * 3. Backoff exponencial con Jitter para reintentos seguros.
 * 4. Métricas de disponibilidad, latencia y tasa de fallos en tiempo real.
 * 5. Prevención de llamadas concurrentes duplicadas (In-Flight Deduplication).
 */

import { AiProviderName } from './types';
import { ModelCatalog } from './modelCatalog';

export type ErrorCategory = 
  | 'BAD_REQUEST_400' 
  | 'AUTH_ERROR_401_403' 
  | 'NOT_FOUND_404' 
  | 'TIMEOUT_408' 
  | 'RATE_LIMIT_429' 
  | 'SERVER_ERROR_5XX' 
  | 'EMPTY_RESPONSE' 
  | 'NETWORK_ERROR' 
  | 'UNKNOWN';

export interface ClassifiedError {
  category: ErrorCategory;
  statusCode?: number;
  message: string;
  isRetryable: boolean;
  retryAfterSeconds?: number;
  action: 'FAIL_IMMEDIATE' | 'TRIP_CIRCUIT' | 'DISABLE_MODEL' | 'RETRY_WITH_BACKOFF' | 'FALLBACK_NEXT';
}

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ProviderHealthStats {
  provider: AiProviderName;
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE' | 'UNCONFIGURED';
  circuitState: CircuitState;
  consecutiveFailures: number;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  averageLatencyMs: number;
  lastError?: string;
  lastErrorTimestamp?: string;
  circuitOpenedAt?: number;
  cooldownUntil?: number;
}

export class CircuitBreaker {
  private static readonly FAILURE_THRESHOLD = 3;
  private static readonly DEFAULT_COOLDOWN_MS = 60000; // 1 minuto de enfriamiento tras 3 fallos consecutivos
  private static readonly SUCCESS_THRESHOLD_TO_CLOSE = 2;

  private static stats: Map<AiProviderName, {
    state: CircuitState;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalLatencyMs: number;
    lastError?: string;
    lastErrorTimestamp?: string;
    cooldownUntil?: number;
  }> = new Map();

  // Deduplicador de solicitudes idénticas en vuelo (evita dobles clics o llamadas duplicadas concurrentes)
  private static inFlightRequests: Map<string, { promise: Promise<any>; timestamp: number }> = new Map();

  private static getOrCreateStats(provider: AiProviderName) {
    let p = this.stats.get(provider);
    if (!p) {
      p = {
        state: 'CLOSED',
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalLatencyMs: 0,
      };
      this.stats.set(provider, p);
    }
    return p;
  }

  /**
   * Clasifica un error para determinar la política de reintento o descarte
   */
  public static classifyError(error: any, modelId?: string): ClassifiedError {
    const status = typeof error?.statusCode === 'number' ? error.statusCode : undefined;
    const msg = error?.message || String(error);
    const lowerMsg = msg.toLowerCase();

    // 1. HTTP 404: Modelo o endpoint no disponible
    if (status === 404 || lowerMsg.includes('404') || lowerMsg.includes('not found') || lowerMsg.includes('no longer available')) {
      if (modelId) {
        ModelCatalog.markModelStatus(modelId, 'DISABLED', 'HTTP 404: Endpoint o modelo no disponible en la API');
      }
      return {
        category: 'NOT_FOUND_404',
        statusCode: 404,
        message: msg,
        isRetryable: false,
        action: 'DISABLE_MODEL',
      };
    }

    // 2. HTTP 401 / 403: Credenciales inválidas o permisos insuficientes
    if (status === 401 || status === 403 || lowerMsg.includes('401') || lowerMsg.includes('403') || lowerMsg.includes('api key') || lowerMsg.includes('unauthorized')) {
      return {
        category: 'AUTH_ERROR_401_403',
        statusCode: status || 401,
        message: msg,
        isRetryable: false,
        action: 'TRIP_CIRCUIT',
      };
    }

    // 3. HTTP 429: Rate Limit
    if (status === 429 || lowerMsg.includes('429') || lowerMsg.includes('rate limit') || lowerMsg.includes('quota') || lowerMsg.includes('resourceexhausted')) {
      let retryAfter: number | undefined;
      const retryMatch = msg.match(/retry(?:-after)?[:\s]+([0-9]+)/i);
      if (retryMatch) {
        retryAfter = parseInt(retryMatch[1], 10);
      }
      return {
        category: 'RATE_LIMIT_429',
        statusCode: 429,
        message: msg,
        isRetryable: false, // No reintentar el mismo proveedor inmediatamente para no demorar la respuesta al usuario
        retryAfterSeconds: retryAfter || 60,
        action: 'FALLBACK_NEXT',
      };
    }

    // 4. HTTP 408 / Timeout
    if (status === 408 || lowerMsg.includes('408') || lowerMsg.includes('timeout') || lowerMsg.includes('aborted') || lowerMsg.includes('aborterror')) {
      return {
        category: 'TIMEOUT_408',
        statusCode: 408,
        message: msg,
        isRetryable: true,
        action: 'RETRY_WITH_BACKOFF',
      };
    }

    // 5. Respuesta vacía
    if (lowerMsg.includes('respuesta vacía') || lowerMsg.includes('empty response')) {
      return {
        category: 'EMPTY_RESPONSE',
        message: 'El modelo no generó tokens de respuesta válidos.',
        isRetryable: false,
        action: 'FALLBACK_NEXT',
      };
    }

    // 6. HTTP 5xx: Errores de infraestructura del proveedor
    if ((status && status >= 500 && status < 600) || /\b5\d{2}\b/.test(msg) || lowerMsg.includes('bad gateway') || lowerMsg.includes('service unavailable')) {
      return {
        category: 'SERVER_ERROR_5XX',
        statusCode: status || 500,
        message: msg,
        isRetryable: true,
        action: 'FALLBACK_NEXT',
      };
    }

    // 7. Errores de red
    if (lowerMsg.includes('fetch failed') || lowerMsg.includes('econnrefused') || lowerMsg.includes('enotfound') || lowerMsg.includes('etimedout')) {
      return {
        category: 'NETWORK_ERROR',
        message: msg,
        isRetryable: true,
        action: 'FALLBACK_NEXT',
      };
    }

    // 8. HTTP 400: Parámetros inválidos
    if (status === 400 || lowerMsg.includes('400')) {
      return {
        category: 'BAD_REQUEST_400',
        statusCode: 400,
        message: msg,
        isRetryable: false,
        action: 'FAIL_IMMEDIATE',
      };
    }

    return {
      category: 'UNKNOWN',
      statusCode: status,
      message: msg,
      isRetryable: false,
      action: 'FALLBACK_NEXT',
    };
  }

  /**
   * Comprueba si el circuito está abierto (bloqueado para evitar llamadas fallidas recurrentes)
   */
  public static isCircuitOpen(provider: AiProviderName): boolean {
    const p = this.getOrCreateStats(provider);
    const now = Date.now();

    if (p.state === 'OPEN') {
      if (p.cooldownUntil && now >= p.cooldownUntil) {
        // Fin del período de enfriamiento: pasar a HALF_OPEN para probar una llamada de verificación
        p.state = 'HALF_OPEN';
        p.consecutiveSuccesses = 0;
        console.log(`[CircuitBreaker:${provider}] Enfriamiento cumplido. Circuito entra en estado HALF_OPEN.`);
        return false;
      }
      return true; // Sigue abierto: bloquear llamada de inmediato
    }

    return false;
  }

  /**
   * Registra una ejecución exitosa de un proveedor
   */
  public static recordSuccess(provider: AiProviderName, latencyMs: number): void {
    const p = this.getOrCreateStats(provider);
    p.totalCalls++;
    p.successfulCalls++;
    p.totalLatencyMs += latencyMs;
    p.consecutiveFailures = 0;

    if (p.state === 'HALF_OPEN') {
      p.consecutiveSuccesses++;
      if (p.consecutiveSuccesses >= this.SUCCESS_THRESHOLD_TO_CLOSE) {
        p.state = 'CLOSED';
        p.cooldownUntil = undefined;
        console.log(`[CircuitBreaker:${provider}] Recuperación confirmada. Circuito CERRADO (operacional).`);
      }
    }
  }

  /**
   * Registra una falla de ejecución y actualiza el circuito si corresponde
   */
  public static recordFailure(
    provider: AiProviderName,
    classified: ClassifiedError,
    modelId?: string
  ): void {
    const p = this.getOrCreateStats(provider);
    p.totalCalls++;
    p.failedCalls++;
    p.consecutiveFailures++;
    p.lastError = `[${classified.category}] ${classified.message.slice(0, 160)}`;
    p.lastErrorTimestamp = new Date().toISOString();

    const now = Date.now();
    const cooldownMs = (classified.retryAfterSeconds ? classified.retryAfterSeconds * 1000 : this.DEFAULT_COOLDOWN_MS);

    if (classified.action === 'TRIP_CIRCUIT' || p.consecutiveFailures >= this.FAILURE_THRESHOLD) {
      p.state = 'OPEN';
      p.cooldownUntil = now + cooldownMs;
      console.warn(
        `[CircuitBreaker:${provider}] ⚠️ Circuito ABIERTO por ${Math.round(cooldownMs / 1000)}s tras ${p.consecutiveFailures} fallos consecutivos. Motivo: ${p.lastError}`
      );
    }
  }

  /**
   * Ejecuta una función con deduplicación en vuelo (si ya se está ejecutando la misma clave, retorna la promesa activa)
   */
  public static async executeWithDeduplication<T>(
    key: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const existing = this.inFlightRequests.get(key);
    if (existing && Date.now() - existing.timestamp < 15000) {
      console.log(`[Deduplicator] Reutilizando solicitud en vuelo para clave: ${key.slice(0, 40)}...`);
      return existing.promise as Promise<T>;
    }

    const promise = operation();
    this.inFlightRequests.set(key, { promise, timestamp: Date.now() });

    try {
      return await promise;
    } finally {
      this.inFlightRequests.delete(key);
    }
  }

  /**
   * Calcula un retardo con backoff exponencial y jitter aleatorio
   */
  public static getExponentialBackoffWithJitter(attempt: number, baseMs: number = 500, maxMs: number = 4000): number {
    const exponential = Math.min(maxMs, baseMs * Math.pow(2, attempt));
    const jitter = Math.random() * 0.3 * exponential; // 0-30% de jitter para evitar sincronización de reintentos
    return Math.floor(exponential + jitter);
  }

  /**
   * Retorna el estado completo de salud de todos los proveedores para `/health` y observabilidad
   */
  public static getProviderHealthSummary(configuredProviders: Record<AiProviderName, boolean>): Record<AiProviderName, ProviderHealthStats> {
    const allProviders: AiProviderName[] = ['gemini', 'openrouter', 'groq', 'openai', 'deepseek', 'anthropic'];
    const summary: any = {};

    for (const prov of allProviders) {
      const isConfigured = Boolean(configuredProviders[prov]);
      const p = this.getOrCreateStats(prov);

      let status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE' | 'UNCONFIGURED' = 'HEALTHY';
      if (!isConfigured) {
        status = 'UNCONFIGURED';
      } else if (p.state === 'OPEN') {
        status = 'OUTAGE';
      } else if (p.state === 'HALF_OPEN' || p.consecutiveFailures > 0) {
        status = 'DEGRADED';
      }

      const avgLatency = p.successfulCalls > 0 ? Math.round(p.totalLatencyMs / p.successfulCalls) : 0;
      const successRate = p.totalCalls > 0 ? Math.round((p.successfulCalls / p.totalCalls) * 100) : 100;

      summary[prov] = {
        provider: prov,
        status,
        circuitState: p.state,
        consecutiveFailures: p.consecutiveFailures,
        totalCalls: p.totalCalls,
        successfulCalls: p.successfulCalls,
        failedCalls: p.failedCalls,
        successRate,
        averageLatencyMs: avgLatency,
        lastError: p.lastError,
        lastErrorTimestamp: p.lastErrorTimestamp,
        cooldownUntil: p.cooldownUntil,
      };
    }

    return summary;
  }

  /**
   * Resetea el circuito (para pruebas unitarias)
   */
  public static resetCircuit(provider?: AiProviderName): void {
    if (provider) {
      this.stats.delete(provider);
    } else {
      this.stats.clear();
      this.inFlightRequests.clear();
    }
  }
}
