import { Response, NextFunction } from 'express';
import { db } from '../db';
import { subscriptions, conversations, questionUsageLogs } from '../db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from './auth';

interface CachedSubscription {
  plan: string;
  status: string;
  expiresAt: number;
}

interface CachedUsage {
  count: number;
  monthKey: string;
  expiresAt: number;
}

const MAX_CACHE_SIZE = 500;
const subCache = new Map<string, CachedSubscription>();
const usageCache = new Map<string, CachedUsage>();

function pruneCache<T extends { expiresAt: number }>(cache: Map<string, T>) {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (val.expiresAt <= now) {
      cache.delete(key);
    }
  }
  if (cache.size > MAX_CACHE_SIZE) {
    const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - MAX_CACHE_SIZE);
    for (const k of keysToDelete) {
      cache.delete(k);
    }
  }
}

export function invalidateUserSubscriptionCache(userId: string) {
  subCache.delete(userId);
  usageCache.delete(userId);
}

export function incrementUserUsageCache(userId: string) {
  const cached = usageCache.get(userId);
  if (cached) {
    cached.count += 1;
  }
}

export async function recordQuestionUsage(userId: string) {
  const nowDate = new Date();
  const monthKey = `${nowDate.getFullYear()}-${nowDate.getMonth()}`;
  try {
    await db.insert(questionUsageLogs).values({
      id: uuidv4(),
      userId,
      monthKey,
    });
  } catch (err) {
    console.error('[Usage] Error grabando log inmutable de pregunta:', err);
  }
  incrementUserUsageCache(userId);
}

export const requireSubscription = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Admins always have unlimited access
  if (req.isAdmin) {
    return next();
  }

  const userId = req.userId!;
  const nowMs = Date.now();

  // 1. Revisar caché de suscripción (TTL 60s)
  let cachedSub = subCache.get(userId);
  let plan = cachedSub && cachedSub.expiresAt > nowMs ? cachedSub.plan : null;

  if (!plan) {
    let sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.currentPeriodEnd, new Date())
      ),
    });

    // If user has no subscription record yet, grant first month trial for founders
    if (!sub) {
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, userId),
      });

      if (!existingSub) {
        try {
          const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          await db.insert(subscriptions).values({
            id: uuidv4(),
            userId,
            status: 'active',
            plan: 'junior',
            currentPeriodEnd: periodEnd,
          });
          sub = {
            id: uuidv4(),
            userId,
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

    plan = sub?.plan || 'junior';
    pruneCache(subCache);
    subCache.set(userId, {
      plan,
      status: sub?.status || 'active',
      expiresAt: nowMs + 60 * 1000, // 60s TTL
    });
  }

  req.userPlan = plan;

  // Plan Junior (or legacy normal): 50 queries / user / month
  // Plan Senior (or legacy pro): unlimited queries
  const isJunior = plan === 'junior' || plan === 'normal';

  if (isJunior) {
    const LIMIT = parseInt(process.env.JUNIOR_QUESTION_LIMIT || '50', 10);
    const nowDate = new Date();
    const monthKey = `${nowDate.getFullYear()}-${nowDate.getMonth()}`;

    // 2. Revisar caché de conteo mensual (TTL 60s)
    let monthlyQuestions: number;
    const cachedUsage = usageCache.get(userId);

    if (cachedUsage && cachedUsage.monthKey === monthKey && cachedUsage.expiresAt > nowMs) {
      monthlyQuestions = cachedUsage.count;
    } else {
      // 1. Consultar conteo desde la tabla de logs inmutables (O(1) en RAM)
      const logCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(questionUsageLogs)
        .where(
          and(
            eq(questionUsageLogs.userId, userId),
            eq(questionUsageLogs.monthKey, monthKey)
          )
        );

      let loggedCount = Number(logCountResult[0]?.count || 0);

      if (loggedCount > 0) {
        monthlyQuestions = loggedCount;
      } else {
        // Fallback: conteo histórico de conversaciones si aún no hay logs registrados para este mes
        const startOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
        const userConversations = await db.query.conversations.findMany({
          where: eq(conversations.userId, userId),
        });

        monthlyQuestions = 0;
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
      }

      pruneCache(usageCache);
      usageCache.set(userId, {
        count: monthlyQuestions,
        monthKey,
        expiresAt: nowMs + 60 * 1000, // 60s TTL
      });
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

