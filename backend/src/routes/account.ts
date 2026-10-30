import { Router } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db';
import { users, subscriptions, questionUsageLogs, conversations } from '../db/schema';
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

    const plan = sub?.plan || (req.isAdmin ? 'pro' : 'junior');
    const isDemo = plan === 'demo';
    const isJunior = plan === 'junior' || plan === 'normal';
    const limit = isDemo
      ? 1
      : isJunior
      ? parseInt(process.env.JUNIOR_QUESTION_LIMIT || '50', 10)
      : parseInt(process.env.SENIOR_QUESTION_LIMIT || '250', 10);

    let questionsUsed = 0;

    // Usar la tabla de logs inmutables filtrada por el ciclo de 30 días de suscripción
    const now = new Date();
    const periodStart = sub?.currentPeriodStart
      ? new Date(sub.currentPeriodStart)
      : sub?.currentPeriodEnd
      ? new Date(new Date(sub.currentPeriodEnd).getTime() - 30 * 24 * 60 * 60 * 1000)
      : sub?.createdAt
      ? new Date(sub.createdAt)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      const logCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(questionUsageLogs)
        .where(
          and(
            eq(questionUsageLogs.userId, req.userId!),
            sql`${questionUsageLogs.createdAt} >= ${periodStart.toISOString()}`
          )
        );
      questionsUsed = Number(logCountResult[0]?.count || 0);
    } catch (logErr) {
      console.warn('[Account] question_usage_logs no disponible o error al consultar, aplicando fallback:', logErr);
      // Fallback: conteo histórico de mensajes de usuario en conversaciones del ciclo actual
      try {
        const userConversations = await db.query.conversations.findMany({
          where: eq(conversations.userId, req.userId!),
          columns: { messages: true, createdAt: true },
          limit: 200,
        });

        for (const conv of userConversations) {
          if (Array.isArray(conv.messages)) {
            for (const m of conv.messages as any[]) {
              if (m.role === 'user') {
                const msgDate = m.timestamp ? new Date(m.timestamp) : null;
                if (msgDate) {
                  if (msgDate >= periodStart) questionsUsed++;
                } else if (conv.createdAt && conv.createdAt >= periodStart) {
                  questionsUsed++;
                }
              }
            }
          }
        }
      } catch (fallbackErr) {
        console.error('[Account] Error en fallback de conteo:', fallbackErr);
      }
    }

    res.json({
      plan,
      isDemo,
      questionsUsed,
      limit,
      remaining: Math.max(0, limit - questionsUsed),
      isAdmin: req.isAdmin || false,
    });
  } catch (err) {
    console.error('[Account] Error al obtener uso del usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Endpoint seguro para que el usuario actualice su propia contraseña
accountRouter.put('/password', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Debes ingresar tu contraseña actual y la nueva contraseña' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    if (newPassword.length > 128) {
      return res.status(400).json({ error: 'La nueva contraseña no puede exceder 128 caracteres' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.userId!),
      columns: { id: true, passwordHash: true, email: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'La contraseña actual ingresada es incorrecta' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser idéntica a la anterior' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    await db.update(users)
      .set({ passwordHash: newHash })
      .where(eq(users.id, req.userId!));

    return res.json({ success: true, message: 'Tu contraseña ha sido actualizada exitosamente' });
  } catch (err) {
    console.error('[Account] Error al cambiar contraseña de usuario:', err);
    return res.status(500).json({ error: 'Error interno al actualizar la contraseña' });
  }
});
