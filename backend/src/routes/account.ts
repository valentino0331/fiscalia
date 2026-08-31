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

    let questionsUsed = 0;
    for (const conv of userConvs) {
      if (Array.isArray(conv.messages)) {
        questionsUsed += conv.messages.filter((m: any) => m.role === 'user').length;
      }
    }

    const plan = sub?.plan || 'free';
    const isLimited = plan === 'pro-trial' || plan === 'free';
    const limit = isLimited
      ? parseInt(process.env.FREE_QUESTION_LIMIT || '3', 10)
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
