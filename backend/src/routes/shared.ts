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
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not set');
  try {
    const decoded = jwt.verify(req.params.token, jwtSecret) as { conversationId: string };
    const conv = await db.query.conversations.findFirst({
      where: eq(conversations.id, decoded.conversationId),
    });
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
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
