import { Router } from 'express';
import { db } from '../db';
import { users, subscriptions, conversations } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

export const accountRouter = Router();

accountRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.userId!),
      columns: { id: true, email: true, name: true, isAdmin: true },
    });

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, req.userId!),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    res.json({
      user,
      subscription: subscription
        ? {
            status: subscription.status,
            plan: subscription.plan,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : null,
    });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

accountRouter.get('/usage', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, req.userId!),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.currentPeriodEnd, new Date())
      ),
    });

    const userConvs = await db.query.conversations.findMany({
      where: eq(conversations.userId, req.userId!),
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let questionsUsed = 0;
    for (const conv of userConvs) {
      if (Array.isArray(conv.messages)) {
        for (const m of conv.messages as any[]) {
          if (m.role === 'user') {
            const msgDate = m.timestamp ? new Date(m.timestamp) : null;
            if (msgDate) {
              if (msgDate >= startOfMonth) questionsUsed++;
            } else if (conv.createdAt && conv.createdAt >= startOfMonth) {
              questionsUsed++;
            }
          }
        }
      }
    }

    const plan = sub?.plan || 'junior';
    const isJunior = plan === 'junior' || plan === 'normal';
    const limit = isJunior
      ? parseInt(process.env.JUNIOR_QUESTION_LIMIT || '50', 10)
      : null;

    res.json({
      plan,
      questionsUsed,
      limit,
      isAdmin: req.isAdmin || false,
    });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
