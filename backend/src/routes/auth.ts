import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { users, subscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';

export const authRouter = Router();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está configurado. Define un secreto seguro en las variables de entorno.');
}

const jwtSecret: jwt.Secret = process.env.JWT_SECRET;
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const exists = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });

    if (exists) {
      const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, exists.id),
      });
      if (sub?.hotmartTransaction) {
        const passwordHash = await bcrypt.hash(password, 12);
        await db
          .update(users)
          .set({ passwordHash, name: name || exists.name })
          .where(eq(users.id, exists.id));
        const token = jwt.sign(
          { userId: exists.id, isAdmin: exists.isAdmin },
          jwtSecret,
          { expiresIn: jwtExpiresIn }
        );
        return res.json({
          token,
          user: {
            id: exists.id,
            email: exists.email,
            name: name || exists.name,
            isAdmin: exists.isAdmin,
          },
        });
      }
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    await db.insert(users).values({ id: userId, email: normalizedEmail, passwordHash, name, isAdmin: false });

    try {
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(subscriptions).values({
        id: uuidv4(),
        userId,
        status: 'active',
        plan: 'pro-trial',
        currentPeriodEnd: periodEnd,
      });
    } catch (subErr) {
      console.error('Error creating subscription for user:', subErr);
    }

    const token = jwt.sign({ userId, isAdmin: false }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.status(201).json({ token, user: { id: userId, email: normalizedEmail, name, isAdmin: false } });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
