import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { conversations } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

export const conversationsRouter = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

conversationsRouter.get('/', requireAuth, async (req: any, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit as string, 10);
    const safeLimit = !isNaN(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 100;

    const list = await db.query.conversations.findMany({
      where: eq(conversations.userId, req.userId),
      orderBy: [desc(conversations.updatedAt)],
      limit: safeLimit,
      columns: { id: true, agentId: true, title: true, updatedAt: true },
    });
    res.json(list);
  } catch (err) {
    console.error('[Conversations] Error al listar conversaciones:', err);
    res.status(500).json({ error: 'Error interno al obtener conversaciones' });
  }
});

conversationsRouter.get('/:id', requireAuth, async (req: any, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ error: 'ID de conversación inválido' });
  }
  try {
    const conv = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, req.params.id),
        eq(conversations.userId, req.userId)
      ),
    });
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    res.json(conv);
  } catch (err) {
    console.error('[Conversations] Error al obtener conversación:', err);
    res.status(500).json({ error: 'Error interno al obtener la conversación' });
  }
});

conversationsRouter.patch('/:id', requireAuth, async (req: any, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ error: 'ID de conversación inválido' });
  }
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Título requerido' });
  }
  const sanitizedTitle = title.trim().slice(0, 200);
  if (!sanitizedTitle) {
    return res.status(400).json({ error: 'Título no puede estar vacío' });
  }
  try {
    const updated = await db
      .update(conversations)
      .set({ title: sanitizedTitle, updatedAt: new Date() })
      .where(
        and(
          eq(conversations.id, req.params.id),
          eq(conversations.userId, req.userId)
        )
      )
      .returning({ id: conversations.id, title: conversations.title, updatedAt: conversations.updatedAt });

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Conversación no encontrada' });
    }

    res.json(updated[0]);
  } catch (err) {
    console.error('[Conversations] Error al actualizar conversación:', err);
    res.status(500).json({ error: 'Error interno al actualizar la conversación' });
  }
});

conversationsRouter.delete('/:id', requireAuth, async (req: any, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ error: 'ID de conversación inválido' });
  }
  try {
    await db
      .delete(conversations)
      .where(
        and(
          eq(conversations.id, req.params.id),
          eq(conversations.userId, req.userId)
        )
      );
    res.json({ success: true });
  } catch (err) {
    console.error('[Conversations] Error al eliminar conversación:', err);
    res.status(500).json({ error: 'Error interno al eliminar la conversación' });
  }
});

conversationsRouter.post('/:id/share', requireAuth, async (req: any, res) => {
  if (!isValidUUID(req.params.id)) {
    return res.status(400).json({ error: 'ID de conversación inválido' });
  }
  try {
    const conv = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, req.params.id), eq(conversations.userId, req.userId)),
      columns: { id: true },
    });
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET is not set');
    const token = jwt.sign(
      { conversationId: conv.id, type: 'share' },
      jwtSecret,
      { expiresIn: '7d', algorithm: 'HS256' }
    );
    res.json({ token });
  } catch (err) {
    console.error('[Conversations] Error al generar enlace de compartir:', err);
    res.status(500).json({ error: 'Error al generar enlace de compartir' });
  }
});
