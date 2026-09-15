import { Router } from 'express';
import { db } from '../db';
import { users, subscriptions, questionUsageLogs } from '../db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
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
  } catch (err) {
    console.error('[Account] Error al obtener perfil de usuario:', err);
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

    const plan = sub?.plan || 'junior';
    const isJunior = plan === 'junior' || plan === 'normal';
    const limit = isJunior
      ? parseInt(process.env.JUNIOR_QUESTION_LIMIT || '50', 10)
      : null;

    let questionsUsed = 0;

    if (isJunior) {
      // Usar la tabla de logs inmutables — O(1) para usuarios con muchas conversaciones
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth()}`;

      const logCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(questionUsageLogs)
        .where(
          and(
            eq(questionUsageLogs.userId, req.userId!),
            eq(questionUsageLogs.monthKey, monthKey)
          )
        );
      questionsUsed = Number(logCountResult[0]?.count || 0);
    }

    res.json({
      plan,
      questionsUsed,
      limit,
      isAdmin: req.isAdmin || false,
    });
  } catch (err) {
    console.error('[Account] Error al obtener uso del usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
