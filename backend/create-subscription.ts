import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import * as schema from './src/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está configurada.');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });
const email = process.argv[2];

if (!email) {
  console.log('Uso: npx tsx create-subscription.ts correo@dominio.com');
  process.exit(1);
}

async function activateSubscription() {
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
  if (!user) {
    console.log('✗ Usuario no encontrado:', email);
    process.exit(1);
  }

  const periodEnd = new Date();
  periodEnd.setDate(periodEnd.getDate() + 30);

  await db
    .insert(schema.subscriptions)
    .values({
      userId: user.id,
      status: 'active',
      plan: 'pro',
      hotmartTransaction: `manual-${Date.now()}`,
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: schema.subscriptions.userId,
      set: {
        status: 'active',
        plan: 'pro',
        currentPeriodEnd: periodEnd,
        updatedAt: new Date(),
      },
    });

  console.log('✓ Suscripción activa para:', email);
  console.log('✓ Vence:', periodEnd.toISOString());
}

activateSubscription().catch((error) => {
  console.error('✗ Error activando suscripción:', error);
  process.exit(1);
});
