import { Router } from 'express';
import { db } from '../db';
import { userMemory } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

export const memoryRouter = Router();

memoryRouter.get('/', requireAuth, async (req: any, res) => {
  try {
    const row = await db.query.userMemory.findFirst({
      where: eq(userMemory.userId, req.userId),
    });
    res.json(row || null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

memoryRouter.patch('/', requireAuth, async (req: any, res) => {
  try {
    const { name, company, role, specialties, notes } = req.body;
    const existing = await db.query.userMemory.findFirst({
      where: eq(userMemory.userId, req.userId),
    });
    if (existing) {
      const [row] = await db
        .update(userMemory)
        .set({ name, company, role, specialties, notes, updatedAt: new Date() })
        .where(eq(userMemory.userId, req.userId))
        .returning();
      res.json(row);
    } else {
      const [row] = await db
        .insert(userMemory)
        .values({ userId: req.userId, name, company, role, specialties, notes })
        .returning();
      res.json(row);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
