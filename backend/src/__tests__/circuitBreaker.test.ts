import { describe, it, expect, beforeEach } from 'vitest';
import { CircuitBreaker } from '../ai/circuitBreaker';
import { ModelCatalog } from '../ai/modelCatalog';

describe('CircuitBreaker & Error Classification', () => {
  beforeEach(() => {
    CircuitBreaker.resetCircuit();
    ModelCatalog.resetOverrides();
  });

  describe('Error Classification', () => {
    it('classifies 404 as NOT_FOUND_404 and disables the model in ModelCatalog', () => {
      const err = { statusCode: 404, message: 'This model models/gemini-2.0-flash is no longer available.' };
      const classified = CircuitBreaker.classifyError(err, 'gemini-2.0-flash');

      expect(classified.category).toBe('NOT_FOUND_404');
      expect(classified.action).toBe('DISABLE_MODEL');
      expect(classified.isRetryable).toBe(false);

      const modelDef = ModelCatalog.getAllModels().find((m) => m.id === 'gemini-2.0-flash');
      expect(modelDef?.status).toBe('DISABLED');
    });

    it('classifies 401/403 as AUTH_ERROR_401_403 and commands TRIP_CIRCUIT', () => {
      const err = { statusCode: 401, message: 'Invalid API key provided' };
      const classified = CircuitBreaker.classifyError(err);

      expect(classified.category).toBe('AUTH_ERROR_401_403');
      expect(classified.action).toBe('TRIP_CIRCUIT');
      expect(classified.isRetryable).toBe(false);
    });

    it('classifies 429 as RATE_LIMIT_429 and parses Retry-After seconds', () => {
      const err = { statusCode: 429, message: 'Rate limit exceeded. retry-after: 45' };
      const classified = CircuitBreaker.classifyError(err);

      expect(classified.category).toBe('RATE_LIMIT_429');
      expect(classified.action).toBe('FALLBACK_NEXT');
      expect(classified.retryAfterSeconds).toBe(45);
      expect(classified.isRetryable).toBe(false);
    });

    it('classifies 408 as TIMEOUT_408 and marks as retryable', () => {
      const err = { message: 'Timeout tras 45000ms' };
      const classified = CircuitBreaker.classifyError(err);

      expect(classified.category).toBe('TIMEOUT_408');
      expect(classified.action).toBe('RETRY_WITH_BACKOFF');
      expect(classified.isRetryable).toBe(true);
    });

    it('classifies empty responses as EMPTY_RESPONSE', () => {
      const err = { message: 'Respuesta vacía recibida del proveedor' };
      const classified = CircuitBreaker.classifyError(err);

      expect(classified.category).toBe('EMPTY_RESPONSE');
      expect(classified.action).toBe('FALLBACK_NEXT');
    });

    it('classifies network errors as NETWORK_ERROR', () => {
      const err = { message: 'fetch failed: ECONNREFUSED' };
      const classified = CircuitBreaker.classifyError(err);

      expect(classified.category).toBe('NETWORK_ERROR');
      expect(classified.action).toBe('FALLBACK_NEXT');
    });
  });

  describe('Circuit Transitions & Tripping', () => {
    it('starts with circuit closed and transitions to OPEN after 3 consecutive failures', () => {
      expect(CircuitBreaker.isCircuitOpen('openrouter')).toBe(false);

      const err = CircuitBreaker.classifyError({ statusCode: 500, message: 'Internal Server Error' });

      // Failure 1
      CircuitBreaker.recordFailure('openrouter', err);
      expect(CircuitBreaker.isCircuitOpen('openrouter')).toBe(false);

      // Failure 2
      CircuitBreaker.recordFailure('openrouter', err);
      expect(CircuitBreaker.isCircuitOpen('openrouter')).toBe(false);

      // Failure 3 -> Trips circuit!
      CircuitBreaker.recordFailure('openrouter', err);
      expect(CircuitBreaker.isCircuitOpen('openrouter')).toBe(true);
    });

    it('TRIP_CIRCUIT action immediately opens the circuit on first occurrence', () => {
      const authErr = CircuitBreaker.classifyError({ statusCode: 401, message: 'Unauthorized' });
      CircuitBreaker.recordFailure('gemini', authErr);

      expect(CircuitBreaker.isCircuitOpen('gemini')).toBe(true);
    });

    it('recordSuccess resets consecutive failures and maintains CLOSED state', () => {
      const err = CircuitBreaker.classifyError({ statusCode: 500, message: 'Server error' });
      CircuitBreaker.recordFailure('groq', err);
      CircuitBreaker.recordFailure('groq', err);

      CircuitBreaker.recordSuccess('groq', 250);
      expect(CircuitBreaker.isCircuitOpen('groq')).toBe(false);

      // Next failure should be attempt 1, not attempt 3
      CircuitBreaker.recordFailure('groq', err);
      expect(CircuitBreaker.isCircuitOpen('groq')).toBe(false);
    });

    it('isolates failures at the model level so that a DeepSeek outage does not block GPT-5 Mini', () => {
      const err = CircuitBreaker.classifyError({ statusCode: 503, message: 'DeepSeek server overloaded' });

      // 3 fallos consecutivos en DeepSeek
      CircuitBreaker.recordFailure('openrouter', err, 'deepseek/deepseek-chat');
      CircuitBreaker.recordFailure('openrouter', err, 'deepseek/deepseek-chat');
      CircuitBreaker.recordFailure('openrouter', err, 'deepseek/deepseek-chat');

      // El circuito de DeepSeek debe estar ABIERTO
      expect(CircuitBreaker.isCircuitOpen('openrouter', 'deepseek/deepseek-chat')).toBe(true);

      // El circuito del modelo de respaldo (GPT-5 Mini o GPT-4o Mini) debe permanecer CERRADO y operativo
      expect(CircuitBreaker.isCircuitOpen('openrouter', 'openai/gpt-5-mini')).toBe(false);
      expect(CircuitBreaker.isCircuitOpen('openrouter', 'openai/gpt-4o-mini')).toBe(false);
    });

    it('HTTP 400 (Bad Request / Context Overflow) never increments failures nor trips the circuit breaker', () => {
      const badReqErr = CircuitBreaker.classifyError({ statusCode: 400, message: 'This endpoint maximum context length is 128000 tokens' });
      expect(badReqErr.category).toBe('BAD_REQUEST_400');

      // Simular múltiples llamadas con payload inválido o contexto excedido
      CircuitBreaker.recordFailure('openrouter', badReqErr, 'openai/gpt-4o-mini');
      CircuitBreaker.recordFailure('openrouter', badReqErr, 'openai/gpt-4o-mini');
      CircuitBreaker.recordFailure('openrouter', badReqErr, 'openai/gpt-4o-mini');
      CircuitBreaker.recordFailure('openrouter', badReqErr, 'openai/gpt-4o-mini');

      // El circuito NO debe haberse abierto
      expect(CircuitBreaker.isCircuitOpen('openrouter', 'openai/gpt-4o-mini')).toBe(false);
      expect(CircuitBreaker.isCircuitOpen('openrouter')).toBe(false);
    });
  });

  describe('In-Flight Request Deduplication', () => {
    it('deduplicates concurrent calls with identical keys', async () => {
      let callCount = 0;
      const delayedOperation = async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 50));
        return `result-${callCount}`;
      };

      const [res1, res2, res3] = await Promise.all([
        CircuitBreaker.executeWithDeduplication('test-key-1', delayedOperation),
        CircuitBreaker.executeWithDeduplication('test-key-1', delayedOperation),
        CircuitBreaker.executeWithDeduplication('test-key-1', delayedOperation),
      ]);

      expect(callCount).toBe(1);
      expect(res1).toBe('result-1');
      expect(res2).toBe('result-1');
      expect(res3).toBe('result-1');
    });
  });

  describe('Backoff & Jitter', () => {
    it('calculates exponential delay with random jitter', () => {
      const delay0 = CircuitBreaker.getExponentialBackoffWithJitter(0, 500, 4000);
      const delay1 = CircuitBreaker.getExponentialBackoffWithJitter(1, 500, 4000);
      const delay2 = CircuitBreaker.getExponentialBackoffWithJitter(2, 500, 4000);

      expect(delay0).toBeGreaterThanOrEqual(500);
      expect(delay0).toBeLessThanOrEqual(650);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThanOrEqual(1300);

      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThanOrEqual(2600);
    });
  });
});

