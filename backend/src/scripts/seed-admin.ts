import 'dotenv/config';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { users, subscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';

interface AdminUser {
  email: string;
  password: string;
}

const admins: AdminUser[] = [];

if (process.env.ADMIN1_EMAIL && process.env.ADMIN1_PASS) {
  admins.push({ email: process.env.ADMIN1_EMAIL.toLowerCase().trim(), password: process.env.ADMIN1_PASS });
}
if (process.env.ADMIN2_EMAIL && process.env.ADMIN2_PASS) {
  admins.push({ email: process.env.ADMIN2_EMAIL.toLowerCase().trim(), password: process.env.ADMIN2_PASS });
}

if (admins.length === 0) {
  console.log('Seed admin: no hay variables ADMIN_EMAIL/ADMIN_PASS, saltando...');
  process.exit(0);
}

async function seed() {
  for (const admin of admins) {
    const existing = await db.query.users.findFirst({ where: eq(users.email, admin.email) });
    const passwordHash = await bcrypt.hash(admin.password, 12);

    if (existing) {
      await db.update(users).set({ passwordHash, isAdmin: true }).where(eq(users.email, admin.email));
      console.log(`✓ Usuario actualizado: ${admin.email} (password hasheada, isAdmin=true)`);
    } else {
      const userId = uuidv4();
      await db.insert(users).values({ id: userId, email: admin.email, passwordHash, isAdmin: true });
      const periodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await db.insert(subscriptions).values({
        id: uuidv4(),
        userId,
        status: 'active',
        plan: 'pro',
        currentPeriodEnd: periodEnd,
      });
      console.log(`✓ Usuario creado: ${admin.email} (isAdmin=true, suscripción pro 1 año)`);
    }
  }

  console.log('\n✓ Seed completado.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
