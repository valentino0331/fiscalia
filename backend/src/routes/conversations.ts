import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { conversations } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

export const conversationsRouter = Router();

conversationsRouter.get('/', requireAuth, async (req: any, res) => {
  const list = await db.query.conversations.findMany({
    where: eq(conversations.userId, req.userId),
    orderBy: [desc(conversations.updatedAt)],
    columns: { id: true, agentId: true, title: true, updatedAt: true },
  });
  res.json(list);
});

conversationsRouter.get('/:id', requireAuth, async (req: any, res) => {
  const conv = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.id, req.params.id),
      eq(conversations.userId, req.userId)
    ),
  });
  if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
  res.json(conv);
});

conversationsRouter.delete('/:id', requireAuth, async (req: any, res) => {
  await db
    .delete(conversations)
    .where(
      and(
        eq(conversations.id, req.params.id),
        eq(conversations.userId, req.userId)
      )
    );
  res.json({ success: true });
});

conversationsRouter.post('/:id/share', requireAuth, async (req: any, res) => {
  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, req.params.id), eq(conversations.userId, req.userId)),
    columns: { id: true },
  });
  if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is not set');
  const token = jwt.sign({ conversationId: conv.id }, jwtSecret, { expiresIn: '30d' });
  res.json({ token });
});
