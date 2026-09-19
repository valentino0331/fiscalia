import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Tiempo de la ventana en ms
  max: number;      // Número máximo de peticiones por ventana
  message?: string; // Mensaje de error personalizado
  keyGenerator?: (req: Request) => string;
}

interface ClientRecord {
  count: number;
  resetTime: number;
}

/**
 * Rate Limiter en memoria ligero, robusto y con auto-limpieza periódica.
 * No añade dependencias externas y previene abusos DoS y fuerza bruta.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    message = 'Demasiadas peticiones desde esta IP. Por favor intente más tarde.',
    keyGenerator = (req: Request) => {
      // Usar IP validada por Express (que respeta app.set('trust proxy', 1))
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      return `${ip}:${req.baseUrl || ''}${req.path || ''}`;
    },
  } = options;

  const hits = new Map<string, ClientRecord>();
  const MAX_MAP_SIZE = 10000; // Evita fugas de memoria limitando el tamaño del mapa

  // Limpieza periódica de registros vencidos cada 2 minutos
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (record.resetTime <= now) {
        hits.delete(key);
      }
    }
  }, 2 * 60 * 1000).unref(); // unref para no bloquear el cierre del proceso

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);

    if (!record || record.resetTime <= now) {
      // Si el mapa supera el tamaño máximo, podar los más antiguos
      if (hits.size >= MAX_MAP_SIZE) {
        const oldestKeys = Array.from(hits.keys()).slice(0, 1000);
        for (const k of oldestKeys) hits.delete(k);
      }

      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        error: message,
        code: 'TOO_MANY_REQUESTS',
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

// 1. Limiter para autenticación (login, register, demo-login): 30 intentos / 15 min
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Demasiados intentos de acceso o registro. Por seguridad, espere unos minutos antes de reintentar.',
});

// 2. Limiter para peticiones de chat IA: Anti-bot estricto (12 consultas / minuto por usuario o IP)
export const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 12,
  message: 'Protección Anti-Bot: Se ha detectado un ritmo de consultas inusualmente alto. Por favor mantenga una cadencia normal de trabajo.',
  keyGenerator: (req) => {
    const userId = (req as any).userId;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return userId ? `user_chat:${userId}` : `ip_chat:${ip}`;
  },
});

// 3. Limiter para consumo de audio (TTS síntesis y STT transcripción): 25 peticiones / minuto
export const audioRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 25,
  message: 'Ha realizado múltiples solicitudes de voz en poco tiempo. Por favor espere unos instantes.',
});
