import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { subscriptions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export const webhooksRouter = Router();

webhooksRouter.post('/hotmart', async (req, res) => {
  try {
    const { event, data } = req.body;
    const hottok = req.headers['x-hotmart-hottok'];
    const secret = process.env.HOTMART_SECRET;

    if (!secret || typeof hottok !== 'string') {
      return res.status(401).json({ error: 'Webhook no autorizado o no configurado' });
    }

    const trusted = Buffer.from(secret);
    const untrusted = Buffer.from(hottok);

    if (trusted.length !== untrusted.length || !crypto.timingSafeEqual(trusted, untrusted)) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const email = data?.buyer?.email?.toLowerCase().trim();
    if (!email) return res.status(400).json({ error: 'Email requerido' });

    const transaction = data?.purchase?.transaction || null;

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

      if (!user) {
        const userId = uuidv4();
        const tempPassword = uuidv4();
        const passwordHash = await bcrypt.hash(tempPassword, 12);
        const buyerName = data?.buyer?.name || null;

        await db.insert(users).values({
          id: userId,
          email,
          passwordHash,
          name: buyerName,
          isAdmin: false,
        });

        user = { id: userId, email, passwordHash, name: buyerName, isAdmin: false, createdAt: new Date() };
        console.log(`[Hotmart] Usuario creado automáticamente: ${email}`);
      }

      await db
        .insert(subscriptions)
        .values({
          id: uuidv4(),
          userId: user.id,
          status: 'active',
          plan: 'pro',
          hotmartTransaction: transaction,
          currentPeriodEnd: periodEnd,
        })
        .onConflictDoUpdate({
          target: subscriptions.userId,
          set: {
            status: 'active',
            plan: 'pro',
            hotmartTransaction: transaction,
            currentPeriodEnd: periodEnd,
            updatedAt: new Date(),
          },
        });

      console.log(`[Hotmart] Suscripción activada: ${email} (tx: ${transaction})`);
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
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
});
