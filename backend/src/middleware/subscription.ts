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

  // If on trial or free tier, enforce the free question limit (default 3)
  if (sub?.plan === 'pro-trial' || sub?.plan === 'free') {
    const FREE_LIMIT = parseInt(process.env.FREE_QUESTION_LIMIT || '3', 10);

    const userConversations = await db.query.conversations.findMany({
      where: eq(conversations.userId, req.userId!),
    });

    let totalUserQuestions = 0;
    for (const conv of userConversations) {
      if (Array.isArray(conv.messages)) {
        totalUserQuestions += conv.messages.filter((m: any) => m.role === 'user').length;
      }
    }

    if (totalUserQuestions >= FREE_LIMIT) {
      return res.status(403).json({
        error: `Has alcanzado el límite de ${FREE_LIMIT} consultas gratuitas de prueba. Suscríbete para continuar consultando a los especialistas de Hardman de forma ilimitada.`,
        code: 'LIMIT_REACHED',
        questionsUsed: totalUserQuestions,
        limit: FREE_LIMIT,
      });
    }
  }

  next();
};

