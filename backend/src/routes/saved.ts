import { Router } from 'express';
import { db } from '../db';
import { savedMessages } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';

export const savedRouter = Router();

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_AGENTS = new Set(['valentina', 'sebastian', 'diego', 'adriana', 'rodrigo', 'camila', 'fernanda', 'marco']);

savedRouter.get('/', requireAuth, requireSubscription, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(savedMessages)
      .where(eq(savedMessages.userId, req.userId))
      .orderBy(desc(savedMessages.createdAt));
    res.json(rows);
  } catch (err) {
    console.error('[Saved] Error al obtener mensajes guardados:', err);
    res.status(500).json({ error: 'Error interno al obtener los mensajes guardados' });
  }
});

savedRouter.post('/', requireAuth, requireSubscription, async (req: any, res) => {
  try {
    const { agentId, agentName, content } = req.body;

    if (!agentId || typeof agentId !== 'string' || !VALID_AGENTS.has(agentId.toLowerCase())) {
      return res.status(400).json({ error: 'agentId inválido' });
    }
    if (!agentName || typeof agentName !== 'string' || agentName.trim().length === 0) {
      return res.status(400).json({ error: 'agentName requerido' });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'content requerido' });
    }
    if (content.length > 50000) {
      return res.status(400).json({ error: 'El contenido supera el límite de 50,000 caracteres' });
    }

    const [row] = await db
      .insert(savedMessages)
      .values({
        userId: req.userId,
        agentId: agentId.toLowerCase().trim(),
        agentName: agentName.trim().slice(0, 100),
        content: content.trim(),
      })
      .returning();
    res.json(row);
  } catch (err) {
    console.error('[Saved] Error al guardar mensaje:', err);
    res.status(500).json({ error: 'Error interno al guardar el mensaje' });
  }
});

savedRouter.delete('/:id', requireAuth, requireSubscription, async (req: any, res) => {
  if (!UUID_REGEX.test(req.params.id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    await db
      .delete(savedMessages)
      .where(and(eq(savedMessages.id, req.params.id), eq(savedMessages.userId, req.userId)));
    res.json({ success: true });
  } catch (err) {
    console.error('[Saved] Error al eliminar mensaje guardado:', err);
    res.status(500).json({ error: 'Error interno al eliminar el mensaje' });
  }
});
