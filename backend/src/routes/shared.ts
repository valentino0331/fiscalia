import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { conversations } from '../db/schema';
import { eq } from 'drizzle-orm';

export const sharedRouter = Router();

// Public endpoint — open CORS so shared links work from anywhere (email, WhatsApp, etc.)
sharedRouter.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  next();
});

sharedRouter.get('/:token', async (req, res) => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Shared] JWT_SECRET no configurado en entorno');
      return res.status(500).json({ error: 'Servicio de enlaces compartidos no disponible temporalmente' });
    }

    const token = req.params.token;
    if (!token || typeof token !== 'string' || token.length < 20 || token.length > 1000) {
      return res.status(400).json({ error: 'Token de enlace compartido inválido' });
    }

    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as {
      conversationId?: string;
      type?: string;
    };

    if (!decoded || !decoded.conversationId || decoded.type !== 'share') {
      return res.status(401).json({ error: 'Enlace inválido o no autorizado' });
    }

    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, decoded.conversationId),
    });

    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada o eliminada' });

    res.json({
      id: conv.id,
      agentId: conv.agentId,
      title: conv.title,
      messages: conv.messages,
      updatedAt: conv.updatedAt,
    });
  } catch {
    res.status(401).json({ error: 'Enlace inválido o expirado' });
  }
});

