import { neon } from '@neondatabase/serverless';

export async function initNewTables() {
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL no configurada, omitiendo init.');
    return;
  }
  const sql = neon(process.env.DATABASE_URL);

  // 1. Users table
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  // 2. Subscriptions table
  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'inactive',
      plan TEXT NOT NULL DEFAULT 'pro',
      hotmart_transaction TEXT,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status_end ON subscriptions(status, current_period_end)
  `;

  // 3. Conversations table
  await sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL,
      title TEXT,
      messages JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC)
  `;

  // 4. Saved messages
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

  // 5. User Memory
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

  // 6. Question Usage Logs (Immutable usage tracking)
  await sql`
    CREATE TABLE IF NOT EXISTS question_usage_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      month_key TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_question_usage_user_month ON question_usage_logs(user_id, month_key)
  `;

  console.log('[DB] Todas las tablas e índices de Neon PostgreSQL verificados correctamente.');
}
