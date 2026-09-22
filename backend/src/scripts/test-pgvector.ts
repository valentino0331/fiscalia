import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const r = await sql`SELECT version()`;
  console.log('DB OK:', r[0].version);

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector`;
    console.log('pgvector: ENABLED ✅');
  } catch (e: any) {
    console.log('pgvector status:', e.message);
  }
}

main().catch(console.error);
