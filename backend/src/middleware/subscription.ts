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

  // If user has no subscription record yet, grant trial
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
          plan: 'pro-trial',
          currentPeriodEnd: periodEnd,
        });
        sub = {
          id: uuidv4(),
          userId: req.userId!,
          status: 'active',
          plan: 'pro-trial',
          hotmartTransaction: null,
          currentPeriodEnd: periodEnd,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (err) {
        console.error('Error creating auto-trial subscription:', err);
      }
    } else {
      return res.status(403).json({ error: 'Suscripción inactiva o expirada', code: 'NO_SUBSCRIPTION' });
    }
  }

  req.userPlan = sub?.plan || 'normal';

  // If on normal, trial or free tier, enforce respective question limit
  const isNormal = sub?.plan === 'normal';
  const isTrialOrFree = sub?.plan === 'pro-trial' || sub?.plan === 'free';

  if (isNormal || isTrialOrFree) {
    const LIMIT = isNormal
      ? parseInt(process.env.NORMAL_QUESTION_LIMIT || '25', 10)
      : parseInt(process.env.FREE_QUESTION_LIMIT || '3', 10);

    const userConversations = await db.query.conversations.findMany({
      where: eq(conversations.userId, req.userId!),
    });

    let totalUserQuestions = 0;
    for (const conv of userConversations) {
      if (Array.isArray(conv.messages)) {
        totalUserQuestions += conv.messages.filter((m: any) => m.role === 'user').length;
      }
    }

    if (totalUserQuestions >= LIMIT) {
      const msg = isNormal
        ? `Has alcanzado el límite de ${LIMIT} consultas mensuales de tu Plan Normal. Actualiza a Plan Pro para consultas ilimitadas y acceso a los 8 especialistas.`
        : `Has alcanzado el límite de ${LIMIT} consultas gratuitas de prueba. Suscríbete a Plan Normal o Plan Pro para continuar consultando a los especialistas.`;

      return res.status(403).json({
        error: msg,
        code: 'LIMIT_REACHED',
        questionsUsed: totalUserQuestions,
        limit: LIMIT,
        plan: sub?.plan,
      });
    }
  }

  next();
};

