import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { users, subscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authRateLimiter } from '../middleware/rateLimit';
import { requireAuth } from '../middleware/auth';

export const authRouter = Router();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET no está configurado. Define un secreto seguro en las variables de entorno.');
}

const jwtSecret: jwt.Secret = process.env.JWT_SECRET;
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

authRouter.post('/register', authRateLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail) || normalizedEmail.length > 255) {
      return res.status(400).json({ error: 'Formato de correo electrónico inválido' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener un mínimo de 6 caracteres' });
    }

    if (password.length > 128) {
      return res.status(400).json({ error: 'La contraseña no puede exceder 128 caracteres' });
    }

    const exists = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });

    if (exists) {
      return res.status(409).json({ error: 'El email ya está registrado. Por favor inicie sesión o recupere su contraseña.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const sanitizedName = name ? String(name).trim().slice(0, 100) : null;

    await db.insert(users).values({ id: userId, email: normalizedEmail, passwordHash, name: sanitizedName, isAdmin: false });

    try {
      const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.insert(subscriptions).values({
        id: uuidv4(),
        userId,
        status: 'active',
        plan: 'junior',
        currentPeriodEnd: periodEnd,
      });
    } catch (subErr) {
      console.error('Error creating subscription for user:', subErr);
    }

    const token = jwt.sign({ userId, isAdmin: false }, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: 'HS256' });

    res.status(201).json({ token, user: { id: userId, email: normalizedEmail, name: sanitizedName, isAdmin: false } });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar el registro' });
  }
});

authRouter.post('/login', authRateLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const normalizedEmail = String(email).toLowerCase().trim();
    if (typeof password !== 'string' || password.length > 128) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = await db.query.users.findFirst({ where: eq(users.email, normalizedEmail) });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ userId: user.id, isAdmin: user.isAdmin }, jwtSecret, { expiresIn: jwtExpiresIn, algorithm: 'HS256' });

    res.json({ token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } });
  } catch (error) {
    console.error('[Auth Login Error]:', error);
    res.status(500).json({ error: 'Error interno del servidor al autenticar' });
  }
});

authRouter.post('/demo-login', authRateLimiter, async (_req, res) => {
  try {
    // Si explícitamente se deshabilita el modo demo en producción
    if (process.env.ALLOW_DEMO_LOGIN === 'false') {
      return res.status(403).json({ error: 'El acceso de demostración rápida no está disponible actualmente' });
    }

    // Para evitar fuga de información y conversaciones privadas compartidas entre evaluadores,
    // cada evaluador recibe una sesión aislada con workspace privado y limpio
    const sessionTokenId = uuidv4().slice(0, 8);
    const demoEmail = `evaluador.${sessionTokenId}@hardman.pe`;
    const demoId = uuidv4();
    const defaultHash = await bcrypt.hash(`DemoHardman_${uuidv4()}!`, 10);

    await db.insert(users).values({
      id: demoId,
      email: demoEmail,
      passwordHash: defaultHash,
      name: 'Abogado Evaluador (Demo)',
      isAdmin: false,
    });

    const periodEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días de acceso de evaluación
    await db.insert(subscriptions).values({
      id: uuidv4(),
      userId: demoId,
      status: 'active',
      plan: 'pro',
      currentPeriodEnd: periodEnd,
    });

    const token = jwt.sign(
      { userId: demoId, isAdmin: false },
      jwtSecret,
      { expiresIn: '24h', algorithm: 'HS256' }
    );

    return res.json({
      token,
      user: {
        id: demoId,
        email: demoEmail,
        name: 'Abogado Evaluador (Demo)',
        role: 'user',
        dni: '45678912',
        isAdmin: false,
      },
    });
  } catch (err) {
    console.error('[Auth] Error en /demo-login:', err);
    res.status(500).json({ error: 'Error interno al iniciar sesión de demostración' });
  }
});

// Endpoint canónico para verificar la sesión activa y obtener datos actualizados en tiempo real
authRouter.get('/me', requireAuth, async (req: any, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.userId),
      columns: { id: true, email: true, name: true, isAdmin: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado o dado de baja' });
    }

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, req.userId),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    const now = new Date();
    const isExpired = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) < now : false;

    res.json({
      user,
      subscription: sub
        ? {
            status: sub.status,
            plan: sub.plan,
            currentPeriodEnd: sub.currentPeriodEnd,
            isExpired,
          }
        : null,
    });
  } catch (err) {
    console.error('[Auth] Error en /auth/me:', err);
    res.status(500).json({ error: 'Error interno al recuperar el perfil' });
  }
});

