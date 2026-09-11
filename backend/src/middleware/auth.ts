import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  userPlan?: string;
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.slice(7);
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Auth] JWT_SECRET no configurado en entorno');
      return res.status(500).json({ error: 'Error de configuración del servidor' });
    }

    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as {
      userId?: string;
      isAdmin?: boolean;
      type?: string;
    };

    // Rechazar tokens que no correspondan a sesión de usuario (ej. token de enlace compartido)
    if (!decoded || typeof decoded.userId !== 'string' || decoded.type === 'share') {
      return res.status(401).json({ error: 'Token no autorizado o inválido' });
    }

    req.userId = decoded.userId;
    req.isAdmin = !!decoded.isAdmin;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.userId || !req.isAdmin) {
    return res.status(403).json({ error: 'Acceso denegado: solo administradores' });
  }

  try {
    // Verificación en base de datos Neon en tiempo real para evitar revocaciones eludidas por tokens activos
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.userId),
      columns: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      req.isAdmin = false;
      return res.status(403).json({ error: 'Acceso denegado: privilegios administrativos no válidos o revocados' });
    }

    next();
  } catch (err) {
    console.error('[Auth] Error verificando rol de administrador en base de datos:', err);
    res.status(500).json({ error: 'Error al verificar autorización administrativa' });
  }
};

