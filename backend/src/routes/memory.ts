import { Router } from 'express';
import { db } from '../db';
import { userMemory } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

export const memoryRouter = Router();

const MAX_FIELD_LENGTH = 500;

function sanitizeField(val: unknown): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val !== 'string') return null;
  return val.trim().slice(0, MAX_FIELD_LENGTH) || null;
}

memoryRouter.get('/', requireAuth, async (req: any, res) => {
  try {
    const row = await db.query.userMemory.findFirst({
      where: eq(userMemory.userId, req.userId),
    });
    res.json(row || null);
  } catch (err) {
    console.error('[Memory] Error al obtener memoria de usuario:', err);
    res.status(500).json({ error: 'Error interno al obtener el perfil' });
  }
});

memoryRouter.patch('/', requireAuth, async (req: any, res) => {
  try {
    const name = sanitizeField(req.body.name);
    const company = sanitizeField(req.body.company);
    const role = sanitizeField(req.body.role);
    const specialties = sanitizeField(req.body.specialties);
    const notes = sanitizeField(req.body.notes);

    const [row] = await db
      .insert(userMemory)
      .values({
        userId: req.userId,
        name,
        company,
        role,
        specialties,
        notes,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userMemory.userId,
        set: {
          name,
          company,
          role,
          specialties,
          notes,
          updatedAt: new Date(),
        },
      })
      .returning();

    res.json(row);
  } catch (err) {
    console.error('[Memory] Error al guardar memoria de usuario:', err);
    res.status(500).json({ error: 'Error interno al guardar el perfil' });
  }
});
