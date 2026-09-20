export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  route: string;
  method: string;
  statusCode: number;
  message: string;
  agentId?: string;
  details?: string;
}

export interface AiRequestMetric {
  id: string;
  timestamp: string;
  agentId: string;
  provider: 'deepseek' | 'gemini' | 'anthropic' | 'openrouter' | 'groq' | 'openai';
  model: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

const MAX_ERROR_LOGS = 50;
const MAX_METRICS_LOGS = 100;

/**
 * Sanitiza cualquier texto para eliminar secretos, claves de API,
 * tokens JWT y credenciales de bases de datos antes de registrar en memoria.
 */
function redactSensitiveInfo(text?: string): string | undefined {
  if (!text) return text;
  return String(text)
    .replace(/postgresql:\/\/[^:]+:[^@]+@[^/]+\/[^\s?"]+/gi, 'postgresql://[REDACTED_USER]:[REDACTED_PASS]@[REDACTED_HOST]/[DB]')
    .replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/(?:sk-|gsk_|key=)[a-zA-Z0-9_-]{16,}/gi, '[REDACTED_API_KEY]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_GOOGLE_KEY]')
    .replace(/password(?:Hash)?[":\s=]+[^,\s}]+/gi, 'password=[REDACTED]');
}

class MetricsManager {
  private errorLogs: ErrorLogEntry[] = [];
  private aiMetrics: AiRequestMetric[] = [];
  private startTime: number = Date.now();
  private totalRequests: number = 0;
  private totalErrors: number = 0;

  recordError(entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>) {
    this.totalErrors++;
    const fullEntry: ErrorLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...entry,
      message: redactSensitiveInfo(entry.message) || 'Error no especificado',
      details: redactSensitiveInfo(entry.details),
    };
    this.errorLogs.unshift(fullEntry);
    if (this.errorLogs.length > MAX_ERROR_LOGS) {
      this.errorLogs.pop();
    }
  }

  recordAiCall(metric: Omit<AiRequestMetric, 'id' | 'timestamp'>) {
    this.totalRequests++;
    const fullMetric: AiRequestMetric = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      ...metric,
      error: redactSensitiveInfo(metric.error),
    };
    this.aiMetrics.unshift(fullMetric);
    if (this.aiMetrics.length > MAX_METRICS_LOGS) {
      this.aiMetrics.pop();
    }
  }


  getStats() {
    const totalAi = this.aiMetrics.length;
    const successfulAi = this.aiMetrics.filter((m) => m.success).length;
    const failedAi = totalAi - successfulAi;
    const avgDurationMs = totalAi > 0 
      ? Math.round(this.aiMetrics.reduce((acc, m) => acc + m.durationMs, 0) / totalAi)
      : 0;

    const deepseekCount = this.aiMetrics.filter((m) => m.provider === 'deepseek').length;
    const geminiCount = this.aiMetrics.filter((m) => m.provider === 'gemini').length;
    const anthropicCount = this.aiMetrics.filter((m) => m.provider === 'anthropic').length;
    const openrouterCount = this.aiMetrics.filter((m) => m.provider === 'openrouter').length;
    const groqCount = this.aiMetrics.filter((m) => m.provider === 'groq').length;
    const openaiCount = this.aiMetrics.filter((m) => m.provider === 'openai').length;

    const durations = this.aiMetrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const p95DurationMs = durations.length > 0
      ? durations[Math.min(durations.length - 1, Math.floor(durations.length * 0.95))]
      : avgDurationMs || 0;

    const uptimeSec = Math.max(1, Math.floor((Date.now() - this.startTime) / 1000));
    const currentRps = Number((this.totalRequests / uptimeSec).toFixed(2));
    const availabilityPercent = this.totalRequests > 0
      ? Math.round(((this.totalRequests - this.totalErrors) / this.totalRequests) * 10000) / 100
      : 100.0;

    return {
      uptimeSeconds: uptimeSec,
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      currentRps,
      availabilityPercent,
      p95DurationMs,
      ai: {
        totalCalls: totalAi,
        successfulCalls: successfulAi,
        failedCalls: failedAi,
        successRate: totalAi > 0 ? Math.round((successfulAi / totalAi) * 100) : 100,
        avgDurationMs,
        p95DurationMs,
        deepseekCount,
        geminiCount,
        anthropicCount,
        openrouterCount,
        groqCount,
        openaiCount,
      },
      recentErrors: this.errorLogs.slice(0, 20),
      recentAiCalls: this.aiMetrics.slice(0, 15),
    };
  }
}

export const metrics = new MetricsManager();
