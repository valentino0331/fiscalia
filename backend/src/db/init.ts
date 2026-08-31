import { neon } from '@neondatabase/serverless';

export async function initNewTables() {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`
    CREATE TABLE IF NOT EXISTS saved_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_saved_messages_user_id ON saved_messages(user_id)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS user_memory (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name TEXT,
      company TEXT,
      role TEXT,
      specialties TEXT,
      notes TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
}
