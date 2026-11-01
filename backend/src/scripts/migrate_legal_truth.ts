import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not defined');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log('--- APLICANDO MIGRACIÓN NO DESTRUCTIVA: LEGAL SOURCE METADATA ---');
  await sql`
    ALTER TABLE legal_chunks 
    ADD COLUMN IF NOT EXISTS source_url TEXT,
    ADD COLUMN IF NOT EXISTS sha256_hash TEXT,
    ADD COLUMN IF NOT EXISTS validity_status TEXT DEFAULT 'in_force',
    ADD COLUMN IF NOT EXISTS issuing_entity TEXT,
    ADD COLUMN IF NOT EXISTS publication_date DATE,
    ADD COLUMN IF NOT EXISTS binding_status TEXT DEFAULT 'binding',
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ DEFAULT NOW();
  `;
  console.log('✓ Columnas de trazabilidad documental agregadas a legal_chunks con éxito.');

  // Comprobar estructura de tabla en postgres
  const cols = await sql`
    SELECT column_name, data_type, column_default 
    FROM information_schema.columns 
    WHERE table_name = 'legal_chunks'
    ORDER BY ordinal_position;
  `;
  console.log('Estructura actual de legal_chunks:');
  for (const c of cols) {
    console.log(` - ${c.column_name} (${c.data_type}) [Default: ${c.column_default || 'none'}]`);
  }
}

main().catch(err => {
  console.error('Migration Error:', err.message);
  process.exit(1);
});
