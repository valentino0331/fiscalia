import 'dotenv/config';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { users, subscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Iniciando configuración de las 4 cuentas en Neon PostgreSQL...');

  const oneMonthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  // 1. Asegurar suscripción para los 2 admins existentes
  const adminEmails = ['marca0331@outlook.es', 'rafaelortega2016@outlook.es'];
  for (const email of adminEmails) {
    const adminUser = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (adminUser) {
      // Set name if null
      const adminName = email === 'marca0331@outlook.es' ? 'Administrador Principal' : 'Administrador Asociado';
      await db.update(users).set({ name: adminName, isAdmin: true }).where(eq(users.id, adminUser.id));

      const existingSub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, adminUser.id) });
      if (existingSub) {
        await db.update(subscriptions).set({
          status: 'active',
          plan: 'pro',
          currentPeriodEnd: oneYearFromNow,
          updatedAt: new Date(),
        }).where(eq(subscriptions.id, existingSub.id));
      } else {
        await db.insert(subscriptions).values({
          id: uuidv4(),
          userId: adminUser.id,
          status: 'active',
          plan: 'pro',
          currentPeriodEnd: oneYearFromNow,
        });
      }
      console.log(`✓ Admin actualizado con suscripción: ${email}`);
    }
  }

  // 2. Crear Cuenta NORMAL (Con límite)
  const normalEmail = 'usuario.normal@fiscalia.pe';
  const normalPass = 'Password123!';
  const normalHash = await bcrypt.hash(normalPass, 12);
  let normalUser = await db.query.users.findFirst({ where: eq(users.email, normalEmail) });

  if (!normalUser) {
    const normalId = uuidv4();
    await db.insert(users).values({
      id: normalId,
      email: normalEmail,
      name: 'Usuario Plan Normal (Con Límite)',
      passwordHash: normalHash,
      isAdmin: false,
    });
    await db.insert(subscriptions).values({
      id: uuidv4(),
      userId: normalId,
      status: 'active',
      plan: 'normal',
      currentPeriodEnd: oneMonthFromNow,
    });
    console.log(`✓ Cuenta NORMAL creada: ${normalEmail} (Password: ${normalPass})`);
  } else {
    await db.update(users).set({ passwordHash: normalHash, isAdmin: false }).where(eq(users.id, normalUser.id));
    const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, normalUser.id) });
    if (sub) {
      await db.update(subscriptions).set({
        status: 'active',
        plan: 'normal',
        currentPeriodEnd: oneMonthFromNow,
        updatedAt: new Date(),
      }).where(eq(subscriptions.id, sub.id));
    } else {
      await db.insert(subscriptions).values({
        id: uuidv4(),
        userId: normalUser.id,
        status: 'active',
        plan: 'normal',
        currentPeriodEnd: oneMonthFromNow,
      });
    }
    console.log(`✓ Cuenta NORMAL actualizada: ${normalEmail}`);
  }

  // 3. Crear Cuenta PRO (Ilimitada)
  const proEmail = 'usuario.pro@fiscalia.pe';
  const proPass = 'Password123!';
  const proHash = await bcrypt.hash(proPass, 12);
  let proUser = await db.query.users.findFirst({ where: eq(users.email, proEmail) });

  if (!proUser) {
    const proId = uuidv4();
    await db.insert(users).values({
      id: proId,
      email: proEmail,
      name: 'Usuario Plan PRO (Ilimitado)',
      passwordHash: proHash,
      isAdmin: false,
    });
    await db.insert(subscriptions).values({
      id: uuidv4(),
      userId: proId,
      status: 'active',
      plan: 'pro',
      currentPeriodEnd: oneMonthFromNow,
    });
    console.log(`✓ Cuenta PRO creada: ${proEmail} (Password: ${proPass})`);
  } else {
    await db.update(users).set({ passwordHash: proHash, isAdmin: false }).where(eq(users.id, proUser.id));
    const sub = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, proUser.id) });
    if (sub) {
      await db.update(subscriptions).set({
        status: 'active',
        plan: 'pro',
        currentPeriodEnd: oneMonthFromNow,
        updatedAt: new Date(),
      }).where(eq(subscriptions.id, sub.id));
    } else {
      await db.insert(subscriptions).values({
        id: uuidv4(),
        userId: proUser.id,
        status: 'active',
        plan: 'pro',
        currentPeriodEnd: oneMonthFromNow,
      });
    }
    console.log(`✓ Cuenta PRO actualizada: ${proEmail}`);
  }

  console.log('\n--- RESUMEN DE LAS 4 CUENTAS ---');
  const all = await db.query.users.findMany();
  for (const u of all) {
    const s = await db.query.subscriptions.findFirst({ where: eq(subscriptions.userId, u.id) });
    console.log({
      id: u.id,
      email: u.email,
      name: u.name,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      plan: s?.plan,
      status: s?.status,
      currentPeriodEnd: s?.currentPeriodEnd,
    });
  }
}

seed().catch(console.error);
