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
  provider: 'gemini' | 'anthropic' | 'openrouter' | 'groq';
  model: string;
  success: boolean;
  durationMs: number;
  error?: string;
}

const MAX_ERROR_LOGS = 50;
const MAX_METRICS_LOGS = 100;

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

    const geminiCount = this.aiMetrics.filter((m) => m.provider === 'gemini').length;
    const anthropicCount = this.aiMetrics.filter((m) => m.provider === 'anthropic').length;
    const openrouterCount = this.aiMetrics.filter((m) => m.provider === 'openrouter').length;
    const groqCount = this.aiMetrics.filter((m) => m.provider === 'groq').length;

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      ai: {
        totalCalls: totalAi,
        successfulCalls: successfulAi,
        failedCalls: failedAi,
        successRate: totalAi > 0 ? Math.round((successfulAi / totalAi) * 100) : 100,
        avgDurationMs,
        geminiCount,
        anthropicCount,
        openrouterCount,
        groqCount,
      },
      recentErrors: this.errorLogs.slice(0, 20),
      recentAiCalls: this.aiMetrics.slice(0, 15),
    };
  }
}

export const metrics = new MetricsManager();
