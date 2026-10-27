import { Response, NextFunction } from 'express';
import { db } from '../db';
import { subscriptions, conversations, questionUsageLogs } from '../db/schema';
import { eq, and, gt, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from './auth';

interface CachedSubscription {
  plan: string;
  status: string;
  periodStartIso: string;
  expiresAt: number;
}

interface CachedUsage {
  count: number;
  periodStartIso: string;
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
  let periodStartIso = cachedSub && cachedSub.expiresAt > nowMs ? cachedSub.periodStartIso : '';

  if (!plan || !periodStartIso) {
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
          const now = new Date();
          const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          await db.insert(subscriptions).values({
            id: uuidv4(),
            userId,
            status: 'active',
            plan: 'junior',
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          });
          sub = {
            id: uuidv4(),
            userId,
            status: 'active',
            plan: 'junior',
            hotmartTransaction: null,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            createdAt: now,
            updatedAt: now,
          };
        } catch (err) {
          console.error('Error creating founder-trial subscription:', err);
        }
      } else {
        return res.status(403).json({ error: 'Suscripción inactiva o expirada', code: 'NO_SUBSCRIPTION' });
      }
    }

    plan = sub?.plan || 'junior';
    const periodStartDate = sub?.currentPeriodStart
      ? new Date(sub.currentPeriodStart)
      : sub?.currentPeriodEnd
      ? new Date(new Date(sub.currentPeriodEnd).getTime() - 30 * 24 * 60 * 60 * 1000)
      : sub?.createdAt
      ? new Date(sub.createdAt)
      : new Date(nowMs - 30 * 24 * 60 * 60 * 1000);

    periodStartIso = periodStartDate.toISOString();

    pruneCache(subCache);
    subCache.set(userId, {
      plan,
      status: sub?.status || 'active',
      periodStartIso,
      expiresAt: nowMs + 60 * 1000, // 60s TTL
    });
  }

  req.userPlan = plan;

  // Plan Demo: 1 consulta de prueba | Plan Junior: 50 consultas / mes | Plan Senior: 250 consultas / mes
  const isDemo = plan === 'demo';
  const isJunior = plan === 'junior' || plan === 'normal';
  const LIMIT = isDemo
    ? 1
    : isJunior
    ? parseInt(process.env.JUNIOR_QUESTION_LIMIT || '50', 10)
    : parseInt(process.env.SENIOR_QUESTION_LIMIT || '250', 10);

  // 2. Revisar caché de conteo del periodo de suscripción (TTL 60s)
  let cycleQuestions: number;
  const cachedUsage = usageCache.get(userId);

  if (cachedUsage && cachedUsage.periodStartIso === periodStartIso && cachedUsage.expiresAt > nowMs) {
    cycleQuestions = cachedUsage.count;
  } else {
    const periodStartDate = new Date(periodStartIso);
    // 1. Consultar conteo desde la tabla de logs inmutables filtrado por el inicio del periodo de facturación
    const logCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(questionUsageLogs)
      .where(
        and(
          eq(questionUsageLogs.userId, userId),
          sql`${questionUsageLogs.createdAt} >= ${periodStartDate.toISOString()}`
        )
      );

    let loggedCount = Number(logCountResult[0]?.count || 0);

    if (loggedCount > 0) {
      cycleQuestions = loggedCount;
    } else {
      // Fallback: conteo histórico de conversaciones si aún no hay logs registrados para este periodo
      // Limitado a las últimas 200 conversaciones para evitar cargar JSONB ilimitado
      const userConversations = await db.query.conversations.findMany({
        where: eq(conversations.userId, userId),
        columns: { messages: true, createdAt: true },
        limit: 200,
      });

      cycleQuestions = 0;
      for (const conv of userConversations) {
        if (Array.isArray(conv.messages)) {
          for (const m of conv.messages as any[]) {
            if (m.role === 'user') {
              const msgDate = m.timestamp ? new Date(m.timestamp) : null;
              if (msgDate) {
                if (msgDate >= periodStartDate) cycleQuestions++;
              } else if (conv.createdAt && conv.createdAt >= periodStartDate) {
                cycleQuestions++;
              }
            }
          }
        }
      }
    }

    pruneCache(usageCache);
    usageCache.set(userId, {
      count: cycleQuestions,
      periodStartIso,
      expiresAt: nowMs + 60 * 1000, // 60s TTL
    });
  }

  if (cycleQuestions >= LIMIT) {
    if (isDemo) {
      return res.status(403).json({
        error: 'Has utilizado tu consulta de prueba en el Modo Demo. Para continuar utilizando los 8 especialistas con IA de Hardman, elige cualquiera de nuestros planes.',
        code: 'DEMO_LIMIT_REACHED',
        questionsUsed: cycleQuestions,
        limit: 1,
        plan: 'demo',
        upgradeRequired: true,
      });
    }

    const errorMsg = isJunior
      ? `Has alcanzado el límite de ${LIMIT} consultas de tu periodo en el Plan Junior. Actualiza a Plan Senior (S/ 69/mes) para obtener 250 consultas y soporte por WhatsApp prioritario.`
      : `Has alcanzado el límite de ${LIMIT} consultas de tu periodo en el Plan Senior. Tu cuota se reiniciará al renovar tu ciclo de facturación.`;

    return res.status(403).json({
      error: errorMsg,
      code: 'LIMIT_REACHED',
      questionsUsed: cycleQuestions,
      limit: LIMIT,
      plan: isJunior ? 'junior' : 'senior',
    });
  }

  next();
};

