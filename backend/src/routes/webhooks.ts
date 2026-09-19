import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { subscriptions, users, questionUsageLogs } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { sendWelcomeCredentialsEmail, sendSubscriptionUpdatedEmail } from '../lib/email';
import { invalidateUserSubscriptionCache } from '../middleware/subscription';

export const webhooksRouter = Router();

// Whitelist de eventos Hotmart válidos que procesamos
const VALID_HOTMART_EVENTS = new Set([
  'PURCHASE_APPROVED',
  'SUBSCRIPTION_REACTIVATED',
  'PURCHASE_CANCELLED',
  'SUBSCRIPTION_CANCELLATION',
  'PURCHASE_REFUNDED',
]);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

webhooksRouter.post('/hotmart', async (req, res) => {
  try {
    const { event, data } = req.body;
    const hottok = req.headers['x-hotmart-hottok'];
    const secret = process.env.HOTMART_SECRET;

    if (!secret || typeof hottok !== 'string') {
      return res.status(401).json({ error: 'Webhook no autorizado o no configurado' });
    }

    // Comparación en tiempo constante para prevenir timing attacks
    const trusted = Buffer.from(secret);
    const untrusted = Buffer.from(hottok);

    if (trusted.length !== untrusted.length || !crypto.timingSafeEqual(trusted, untrusted)) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Validar que el evento sea un tipo conocido
    if (typeof event !== 'string' || !VALID_HOTMART_EVENTS.has(event)) {
      // Responder 200 para no exponerle a Hotmart qué eventos ignoramos
      return res.json({ received: true, status: 'event_ignored' });
    }

    const rawEmail = data?.buyer?.email;
    if (typeof rawEmail !== 'string') {
      return res.status(400).json({ error: 'Email requerido' });
    }
    const email = rawEmail.toLowerCase().trim();
    if (!EMAIL_REGEX.test(email) || email.length > 255) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    const rawTransaction = data?.purchase?.transaction;
    const transaction: string | null = typeof rawTransaction === 'string' && rawTransaction.trim()
      ? rawTransaction.trim().slice(0, 100)
      : null;

    if (transaction) {
      const existingSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.hotmartTransaction, transaction),
      });
      if (existingSub) {
        return res.json({ received: true, status: 'already_processed' });
      }
    }

    let user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (event === 'PURCHASE_APPROVED' || event === 'SUBSCRIPTION_REACTIVATED') {
      const periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 30);

      // Detectar plan dinámicamente según código exacto de oferta Hotmart, nombre de plan o precio (Junior: S/39, Senior: S/69)
      const rawPlanName = String(data?.subscription?.plan?.name || '').toLowerCase().trim();
      const rawOffer = String(data?.purchase?.offer?.code || data?.purchase?.offer?.name || '').toLowerCase().trim();
      const priceVal = Number(data?.purchase?.price?.value ?? data?.purchase?.original_offer_price?.value ?? 0);

      // ayixxvun = Senior (S/ 69), hm1anfcw = Junior (S/ 39)
      const isSenior = rawOffer === 'ayixxvun' || rawPlanName.includes('senior') || rawOffer.includes('senior') || priceVal >= 60;
      const assignedPlan: 'junior' | 'senior' = isSenior ? 'senior' : 'junior';

      const rawBuyerName = data?.buyer?.name;
      const buyerName: string | null = typeof rawBuyerName === 'string'
        ? rawBuyerName.trim().slice(0, 100) || null
        : null;

      let generatedPassword = '';
      const isNewUser = !user;

      if (!user) {
        const userId = uuidv4();
        // Generación criptográficamente segura y 100% única por cada abogado (ej: Hardman-482915!)
        const uniquePin = crypto.randomInt(100000, 999999);
        generatedPassword = `Hardman-${uniquePin}!`;
        const passwordHash = await bcrypt.hash(generatedPassword, 12);

        await db.insert(users).values({
          id: userId,
          email,
          passwordHash,
          name: buyerName,
          isAdmin: false,
        });

        user = { id: userId, email, passwordHash, name: buyerName, isAdmin: false, createdAt: new Date() };
        console.log(`[Hotmart] Usuario creado automáticamente: ${email} (Plan: ${assignedPlan})`);
      }

      await db
        .insert(subscriptions)
        .values({
          id: uuidv4(),
          userId: user.id,
          status: 'active',
          plan: assignedPlan,
          hotmartTransaction: transaction,
          currentPeriodEnd: periodEnd,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            status: 'active',
            plan: assignedPlan,
            hotmartTransaction: transaction,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          },
        });

      console.log(`[Hotmart] Suscripción ${assignedPlan.toUpperCase()} activada: ${email} (tx: ${transaction})`);

      // Resetear uso del mes actual e invalidar caché para que tenga sus consultas frescas de inmediato
      try {
        const nowDate = new Date();
        const monthKey = `${nowDate.getFullYear()}-${nowDate.getMonth()}`;
        await db
          .delete(questionUsageLogs)
          .where(
            and(
              eq(questionUsageLogs.userId, user.id),
              eq(questionUsageLogs.monthKey, monthKey)
            )
          );
      } catch (err) {
        console.error('[Hotmart Webhook] Error al reiniciar contador de consultas:', err);
      }
      invalidateUserSubscriptionCache(user.id);

      // Despachar correo electrónico con credenciales o confirmación
      const baseUrl = (process.env.FRONTEND_URL || 'https://hardman.lat').replace(/\/$/, '');
      const loginUrl = `${baseUrl}/login?email=${encodeURIComponent(email)}`;
      try {
        if (isNewUser) {
          await sendWelcomeCredentialsEmail({
            to: email,
            name: buyerName,
            plan: assignedPlan,
            password: generatedPassword,
            loginUrl,
          });
        } else {
          await sendSubscriptionUpdatedEmail({
            to: email,
            name: user.name,
            plan: assignedPlan,
            loginUrl,
          });
        }
      } catch (emailErr) {
        console.error('[Hotmart Webhook] Error al enviar email de bienvenida:', emailErr);
      }
    }

    if (
      event === 'PURCHASE_CANCELLED' ||
      event === 'SUBSCRIPTION_CANCELLATION' ||
      event === 'PURCHASE_REFUNDED'
    ) {
      if (user) {
        await db
          .update(subscriptions)
          .set({ status: event === 'PURCHASE_REFUNDED' ? 'refunded' : 'cancelled', updatedAt: new Date() })
          .where(eq(subscriptions.userId, user.id));
        console.log(`[Hotmart] Suscripción ${event === 'PURCHASE_REFUNDED' ? 'reembolsada' : 'cancelada'}: ${email}`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Hotmart Webhook] Error procesando webhook:', error);
    // No exponer detalles del error a Hotmart
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});
