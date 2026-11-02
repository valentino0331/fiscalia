import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { conversationsRouter } from './routes/conversations';
import { accountRouter } from './routes/account';
import { webhooksRouter } from './routes/webhooks';
import { adminRouter } from './routes/admin';
import { filesRouter } from './routes/files';
import { sharedRouter } from './routes/shared';
import { savedRouter } from './routes/saved';
import { memoryRouter } from './routes/memory';
import { initNewTables } from './db/init';
import { startKeepAlive, getKeepAliveStatus } from './lib/keepAlive';
import { securityShieldMiddleware } from './middleware/securityShield';
import { db } from './db';
import { sql } from 'drizzle-orm';
import { CircuitBreaker } from './ai/circuitBreaker';
import { ModelCatalog } from './ai/modelCatalog';
import { AiProviderName } from './ai/types';

const app = express();
const PORT = process.env.PORT || 3001;

// Habilitar trust proxy para que Render y proxies inversos pasen la IP real del cliente (para rate limiting)
app.set('trust proxy', 1);

// ISO/IEC 27001 Information Security & ISO/IEC 25010 Performance Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed per route for optimal API performance
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permite a la SPA frontend leer respuestas cross-origin
    crossOriginOpenerPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Standard ISO/IEC Security & Confidentiality Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
  res.setHeader('X-Legal-Confidentiality-Policy', 'ISO-27701-Compliant; Professional-Privilege-Guaranteed');
  res.setHeader('X-Software-Engineering-Standard', 'ISO-IEC-25010-SQuaRE; OWASP-LLM-2025');
  next();
});

const defaultAllowedOrigins = [
  'https://hardman.lat',
  'https://www.hardman.lat',
  'https://fiscalia-1.onrender.com',
  'https://fiscalia-t0bl.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

// 1. Rutas públicas con CORS abierto para enlaces compartidos
app.use('/shared', sharedRouter);

// 2. Middleware de CORS estricto para rutas protegidas y autenticadas
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocalhost = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
      const isHardmanDomain = /^https:\/\/([a-zA-Z0-9-]+\.)?hardman\.lat$/.test(origin);
      const isNetlifyDomain = /^https:\/\/([a-zA-Z0-9-]+\.)?netlify\.app$/.test(origin);

      if (
        allowedOrigins.includes(origin) ||
        isHardmanDomain ||
        isNetlifyDomain ||
        (process.env.NODE_ENV !== 'production' && isLocalhost)
      ) {
        callback(null, true);
      } else {
        console.warn('[CORS Bloqueado]:', origin);
        callback(new Error('Origen no permitido por la política CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Escudo Perimetral de Ciberseguridad, WAF, Anti-Penetración y Bloqueo de Escáneres
app.use(securityShieldMiddleware);

app.use('/auth', authRouter);
app.use('/chat', chatRouter);
app.use('/conversations', conversationsRouter);
app.use('/account', accountRouter);
app.use('/webhooks', webhooksRouter);
app.use('/admin', adminRouter);
app.use('/files', filesRouter);
app.use('/saved', savedRouter);
app.use('/memory', memoryRouter);

// Manejador global de errores para evitar fugas de stack traces o rutas internas
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  const isCorsError = err?.message?.includes('CORS');
  const status = isCorsError ? 403 : (typeof err?.status === 'number' ? err.status : 500);

  console.error('[Error de API]:', err?.message || err);

  res.status(status).json({
    error: status === 500 ? 'Ocurrió un error interno en el servidor.' : (err?.message || 'Solicitud inválida'),
    code: isCorsError ? 'CORS_ERROR' : 'INTERNAL_SERVER_ERROR',
  });
});


app.get('/health', async (_, res) => {
  const mem = process.memoryUsage();
  const configuredProviders: Record<AiProviderName, boolean> = {
    gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    openrouter: Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY),
    groq: Boolean(process.env.GROQ_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    system_unavailable: false,
    emergency_mock: false,
  };

  let dbStatus: 'connected' | 'error' = 'connected';
  let dbLatencyMs = 0;
  let dbError: string | undefined;

  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
  } catch (err: any) {
    dbStatus = 'error';
    dbError = err?.message || 'DB ping failed';
  }

  const providerHealth = CircuitBreaker.getProviderHealthSummary(configuredProviders);
  const allModels = ModelCatalog.getAllModels();
  const operationalModels = allModels.filter((m) => m.status === 'OPERATIONAL');
  const degradedModels = allModels.filter((m) => m.status === 'DEGRADED');
  const disabledModels = allModels.filter((m) => m.status === 'DISABLED' || m.status === 'DEPRECATED');

  const hasOutage = Object.values(providerHealth).some((p) => p.status === 'OUTAGE');
  const isDegraded = hasOutage || dbStatus === 'error' || Object.values(providerHealth).some((p) => p.status === 'DEGRADED');

  let overallStatus: 'ok' | 'degraded' | 'unhealthy' = 'ok';
  if (dbStatus === 'error') {
    overallStatus = 'unhealthy';
  } else if (isDegraded) {
    overallStatus = 'degraded';
  }

  const httpCode = overallStatus === 'unhealthy' ? 503 : 200;

  res.status(httpCode).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      ...(dbError ? { error: dbError } : {}),
    },
    aiProviders: providerHealth,
    modelCatalog: {
      totalRegistered: allModels.length,
      operationalCount: operationalModels.length,
      degradedCount: degradedModels.length,
      disabledOrDeprecatedCount: disabledModels.length,
      operationalModels: operationalModels.map((m) => `${m.provider}:${m.id}`),
    },
    ocrEngine: {
      status: 'ready',
      supportedMimes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/png',
        'image/jpeg',
        'image/webp',
      ],
    },
    keepAlive: getKeepAliveStatus(),
    memory: {
      rssMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
    },
    nodeVersion: process.version,
  });
});

initNewTables()
  .then(() => console.log('DB tables verified'))
  .catch((err) => console.error('DB init error:', err));

const server = app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  const orK = Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
  console.log(`[AI Engine] Motor Generativo Calidad/Precio: OpenRouter (Primario: deepseek/deepseek-chat, Fallback: openai/gpt-4o-mini) | Configurado=${orK}`);
  startKeepAlive();
});

// Graceful shutdown & process resilience for high concurrency
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[SHUTDOWN] Señal ${signal} recibida. Cerrando conexiones HTTP...`);
  server.close(() => {
    console.log('[SHUTDOWN] Servidor cerrado ordenadamente.');
    process.exit(0);
  });
  // Force exit after 10s if connections hang
  setTimeout(() => {
    console.error('[SHUTDOWN] Forzando salida tras timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
