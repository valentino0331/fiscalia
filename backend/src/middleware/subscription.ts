import { Response, NextFunction } from 'express';
import { db } from '../db';
import { subscriptions, conversations } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from './auth';

export const requireSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Admins always have unlimited access
  if (req.isAdmin) {
    return next();
  }

  let sub = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, req.userId!),
      eq(subscriptions.status, 'active'),
      gt(subscriptions.currentPeriodEnd, new Date())
    ),
  });

  // If user has no subscription record yet, grant first month trial for founders
  if (!sub) {
    const existingSub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, req.userId!),
    });

    if (!existingSub) {
      try {
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await db.insert(subscriptions).values({
          id: uuidv4(),
          userId: req.userId!,
          status: 'active',
          plan: 'junior',
          currentPeriodEnd: periodEnd,
        });
        sub = {
          id: uuidv4(),
          userId: req.userId!,
          status: 'active',
          plan: 'junior',
          hotmartTransaction: null,
          currentPeriodEnd: periodEnd,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (err) {
        console.error('Error creating founder-trial subscription:', err);
      }
    } else {
      return res.status(403).json({ error: 'Suscripción inactiva o expirada', code: 'NO_SUBSCRIPTION' });
    }
  }

  const plan = sub?.plan || 'junior';
  req.userPlan = plan;

  // Plan Junior (or legacy normal): 50 queries / user / month
  // Plan Senior (or legacy pro): unlimited queries
  const isJunior = plan === 'junior' || plan === 'normal';

  if (isJunior) {
    const LIMIT = parseInt(process.env.JUNIOR_QUESTION_LIMIT || '50', 10);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const userConversations = await db.query.conversations.findMany({
      where: eq(conversations.userId, req.userId!),
    });

    let monthlyQuestions = 0;
    for (const conv of userConversations) {
      if (Array.isArray(conv.messages)) {
        for (const m of conv.messages as any[]) {
          if (m.role === 'user') {
            const msgDate = m.timestamp ? new Date(m.timestamp) : null;
            if (msgDate) {
              if (msgDate >= startOfMonth) monthlyQuestions++;
            } else if (conv.createdAt && conv.createdAt >= startOfMonth) {
              monthlyQuestions++;
            }
          }
        }
      }
    }

    if (monthlyQuestions >= LIMIT) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${LIMIT} consultas mensuales de tu Plan Junior. Actualiza a Plan Senior (S/ 69/mes) para consultas ilimitadas y soporte por WhatsApp prioritario.`,
        code: 'LIMIT_REACHED',
        questionsUsed: monthlyQuestions,
        limit: LIMIT,
        plan: 'junior',
      });
    }
  }

  next();
};

