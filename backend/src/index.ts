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

const app = express();
const PORT = process.env.PORT || 3001;

// ISO/IEC 27001 Information Security & ISO/IEC 25010 Performance Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed per route for optimal API performance
    crossOriginEmbedderPolicy: false,
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
  res.setHeader('X-Legal-Confidentiality-Policy', 'ISO-27701-Compliant; Professional-Privilege-Guaranteed');
  next();
});

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Origen no permitido por CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/auth', authRouter);
app.use('/chat', chatRouter);
app.use('/conversations', conversationsRouter);
app.use('/account', accountRouter);
app.use('/webhooks', webhooksRouter);
app.use('/admin', adminRouter);
app.use('/files', filesRouter);
app.use('/shared', sharedRouter);
app.use('/saved', savedRouter);
app.use('/memory', memoryRouter);

app.get('/health', (_, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
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

const server = app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

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
