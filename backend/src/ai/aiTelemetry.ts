/**
 * HARDMAN AI OBSERVABILITY & TELEMETRY MODULE
 * 
 * Captura métricas detalladas de inferencia por proveedor y modelo:
 * - finish_reason distribution (stop, length, error, content_filter)
 * - Conteo y clasificación de respuestas vacías (EMPTY_RESPONSE)
 * - Rate limits (429 upstream) y conmutaciones de circuit breaker
 * - Tiempos de latencia promedio y consumo estimado de tokens
 * - Exposición en tiempo real para el panel de administración (/admin/ai-health)
 */

export interface ModelTelemetry {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  emptyResponses: number;
  rateLimits: number;
  contextOverflows: number;
  totalDurationMs: number;
  avgDurationMs: number;
  finishReasons: Record<string, number>;
  lastStatus: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  lastError?: string;
  lastErrorAt?: string;
}

export interface AiTelemetrySnapshot {
  timestamp: string;
  uptimeSeconds: number;
  overall: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    emptyResponses: number;
    rateLimits: number;
    contextOverflows: number;
    successRate: number;
  };
  models: Record<string, ModelTelemetry>;
  upstreamErrors: Array<{
    timestamp: string;
    model: string;
    category: string;
    message: string;
    statusCode?: number;
  }>;
}

export class AiTelemetry {
  private static startTime = Date.now();
  private static readonly MAX_RECENT_ERRORS = 50;
  
  private static models: Map<string, ModelTelemetry> = new Map();
  private static upstreamErrors: Array<{
    timestamp: string;
    model: string;
    category: string;
    message: string;
    statusCode?: number;
  }> = [];

  private static getOrCreateModel(modelId: string): ModelTelemetry {
    if (!this.models.has(modelId)) {
      this.models.set(modelId, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        emptyResponses: 0,
        rateLimits: 0,
        contextOverflows: 0,
        totalDurationMs: 0,
        avgDurationMs: 0,
        finishReasons: {},
        lastStatus: 'HEALTHY',
      });
    }
    return this.models.get(modelId)!;
  }

  public static recordRequest(modelId: string): void {
    const stats = this.getOrCreateModel(modelId);
    stats.totalRequests++;
  }

  public static recordSuccess(modelId: string, durationMs: number, finishReason?: string): void {
    const stats = this.getOrCreateModel(modelId);
    stats.successfulRequests++;
    stats.totalDurationMs += durationMs;
    stats.avgDurationMs = Math.round(stats.totalDurationMs / stats.successfulRequests);
    stats.lastStatus = 'HEALTHY';

    const reason = finishReason || 'stop';
    stats.finishReasons[reason] = (stats.finishReasons[reason] || 0) + 1;
  }

  public static recordEmptyResponse(modelId: string, durationMs: number): void {
    const stats = this.getOrCreateModel(modelId);
    stats.failedRequests++;
    stats.emptyResponses++;
    stats.lastStatus = 'DEGRADED';
    stats.lastError = 'EMPTY_RESPONSE: Sin tokens de respuesta generados';
    stats.lastErrorAt = new Date().toISOString();

    this.recordUpstreamError(modelId, 'EMPTY_RESPONSE', 'El proveedor retornó respuesta vacía tras reintento', 204);
  }

  public static recordRateLimit(modelId: string, message: string): void {
    const stats = this.getOrCreateModel(modelId);
    stats.failedRequests++;
    stats.rateLimits++;
    stats.lastStatus = 'DEGRADED';
    stats.lastError = `RATE_LIMIT_429: ${message}`;
    stats.lastErrorAt = new Date().toISOString();

    this.recordUpstreamError(modelId, 'RATE_LIMIT_429', message, 429);
  }

  public static recordContextOverflow(modelId: string, message: string): void {
    const stats = this.getOrCreateModel(modelId);
    stats.failedRequests++;
    stats.contextOverflows++;
    stats.lastError = `CONTEXT_OVERFLOW: ${message}`;
    stats.lastErrorAt = new Date().toISOString();

    this.recordUpstreamError(modelId, 'CONTEXT_OVERFLOW', message, 400);
  }

  public static recordFailure(modelId: string, category: string, message: string, statusCode?: number): void {
    const stats = this.getOrCreateModel(modelId);
    stats.failedRequests++;
    stats.lastStatus = 'DEGRADED';
    stats.lastError = `[${category}]: ${message}`;
    stats.lastErrorAt = new Date().toISOString();

    this.recordUpstreamError(modelId, category, message, statusCode);
  }

  private static recordUpstreamError(modelId: string, category: string, message: string, statusCode?: number): void {
    this.upstreamErrors.unshift({
      timestamp: new Date().toISOString(),
      model: modelId,
      category,
      message: message.slice(0, 300),
      statusCode,
    });
    if (this.upstreamErrors.length > this.MAX_RECENT_ERRORS) {
      this.upstreamErrors.pop();
    }
  }

  public static getSnapshot(): AiTelemetrySnapshot {
    let totalReq = 0;
    let totalSucc = 0;
    let totalFail = 0;
    let totalEmpty = 0;
    let totalRate = 0;
    let totalContext = 0;

    const modelsObj: Record<string, ModelTelemetry> = {};
    for (const [modelId, stats] of this.models.entries()) {
      totalReq += stats.totalRequests;
      totalSucc += stats.successfulRequests;
      totalFail += stats.failedRequests;
      totalEmpty += stats.emptyResponses;
      totalRate += stats.rateLimits;
      totalContext += stats.contextOverflows;
      modelsObj[modelId] = { ...stats };
    }

    const successRate = totalReq > 0 ? Number(((totalSucc / totalReq) * 100).toFixed(2)) : 100;

    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      overall: {
        totalRequests: totalReq,
        successfulRequests: totalSucc,
        failedRequests: totalFail,
        emptyResponses: totalEmpty,
        rateLimits: totalRate,
        contextOverflows: totalContext,
        successRate,
      },
      models: modelsObj,
      upstreamErrors: [...this.upstreamErrors],
    };
  }

  public static reset(): void {
    this.models.clear();
    this.upstreamErrors = [];
    this.startTime = Date.now();
  }
}

