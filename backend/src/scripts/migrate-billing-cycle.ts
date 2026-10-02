import 'dotenv/config';
import { db } from '../db';
import { sql } from 'drizzle-orm';

async function runMigration() {
  console.log('--- Iniciando migración de ciclo de 30 días para suscripciones y cuotas ---');

  // 1. Agregar columna current_period_start a subscriptions
  await db.execute(sql`
    ALTER TABLE subscriptions 
    ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
  `);
  console.log('✓ Columna subscriptions.current_period_start asegurada');

  // 2. Poblar current_period_start para suscripciones existentes que no lo tengan
  await db.execute(sql`
    UPDATE subscriptions 
    SET current_period_start = COALESCE(current_period_end - INTERVAL '30 days', created_at, NOW() - INTERVAL '30 days')
    WHERE current_period_start IS NULL;
  `);
  console.log('✓ Suscripciones existentes actualizadas con su fecha de inicio de periodo');

  // 3. Crear índice optimizado en question_usage_logs (user_id, created_at DESC)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_question_usage_user_created 
    ON question_usage_logs (user_id, created_at DESC);
  `);
  console.log('✓ Índice idx_question_usage_user_created asegurado');

  console.log('--- Migración completada con éxito ---');
}

runMigration().catch((err) => {
  console.error('Error en migración:', err);
  process.exit(1);
});
