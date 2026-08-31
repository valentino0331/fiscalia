import { Router } from 'express';
import { db } from '../db';
import { savedMessages } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

export const savedRouter = Router();

savedRouter.get('/', requireAuth, requireSubscription, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(savedMessages)
      .where(eq(savedMessages.userId, req.userId))
      .orderBy(desc(savedMessages.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

savedRouter.post('/', requireAuth, requireSubscription, async (req: any, res) => {
  try {
    const { agentId, agentName, content } = req.body;
    if (!agentId || !agentName || !content) {
      return res.status(400).json({ error: 'agentId, agentName y content son requeridos' });
    }
    const [row] = await db
      .insert(savedMessages)
      .values({ userId: req.userId, agentId, agentName, content })
      .returning();
    res.json(row);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

savedRouter.delete('/:id', requireAuth, requireSubscription, async (req: any, res) => {
  try {
    await db
      .delete(savedMessages)
      .where(and(eq(savedMessages.id, req.params.id), eq(savedMessages.userId, req.userId)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
