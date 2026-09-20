-- ====================================================================
-- SCRIPT MAESTRO DE INICIALIZACIÓN Y ACTUALIZACIÓN PARA NEON POSTGRESQL
-- HARDMAN & ASOCIADOS / FISCALÍA IA
-- ====================================================================
-- Ejecuta este script en la consola SQL (SQL Editor) de tu proyecto en Neon.
-- Es 100% seguro e idempotente: no borra datos existentes y crea/actualiza
-- todas las tablas, columnas, extensiones e índices requeridos.
-- ====================================================================

-- 1. EXTENSIONES REQUERIDAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABLA DE USUARIOS (users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columna is_admin si la tabla ya existía sin ella
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. TABLA DE SUSCRIPCIONES (subscriptions)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan TEXT NOT NULL DEFAULT 'pro',
  hotmart_transaction TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'inactive';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'pro';
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS hotmart_transaction TEXT;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status_end ON subscriptions(status, current_period_end);

-- 4. TABLA DE CONVERSACIONES (conversations)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS agent_id TEXT NOT NULL DEFAULT 'sebastian';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS messages JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);

-- 5. TABLA DE MENSAJES GUARDADOS / FAVORITOS (saved_messages)
CREATE TABLE IF NOT EXISTS saved_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_messages_user_id ON saved_messages(user_id);

-- 6. TABLA DE MEMORIA CONTEXTUAL (user_memory)
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  company TEXT,
  role TEXT,
  specialties TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA CRÍTICA: LOGS INMUTABLES DE CONSUMO DE PREGUNTAS (question_usage_logs)
-- ESTA TABLA PERMITE DESCONTAR Y CONTABILIZAR LAS CONSULTAS MENSUALES CON EXACTITUD
CREATE TABLE IF NOT EXISTS question_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_usage_user_month ON question_usage_logs(user_id, month_key);

-- ====================================================================
-- 8. CONFIGURACIÓN Y ACTIVACIÓN DE CUENTA ADMINISTRADORA (marca0331@outlook.es)
-- ====================================================================

-- A. Marcar marca0331@outlook.es como Administrador con acceso ilimitado
UPDATE users
SET is_admin = TRUE
WHERE LOWER(email) = LOWER('marca0331@outlook.es');

-- B. Si el usuario ya existe, asegurar que tenga suscripción Activa Plan PRO vigente por 1 año
INSERT INTO subscriptions (id, user_id, status, plan, current_period_end, updated_at)
SELECT 
  uuid_generate_v4(),
  u.id,
  'active',
  'pro',
  NOW() + INTERVAL '365 days',
  NOW()
FROM users u
WHERE LOWER(u.email) = LOWER('marca0331@outlook.es')
ON CONFLICT (user_id) 
DO UPDATE SET
  status = 'active',
  plan = 'pro',
  current_period_end = NOW() + INTERVAL '365 days',
  updated_at = NOW();

-- ====================================================================
-- 9. REPORTE DE VERIFICACIÓN
-- ====================================================================
SELECT 
  u.id,
  u.email,
  u.name,
  u.is_admin,
  s.status AS subscription_status,
  s.plan AS subscription_plan,
  s.current_period_end
FROM users u
LEFT JOIN subscriptions s ON s.user_id = u.id
WHERE LOWER(u.email) = LOWER('marca0331@outlook.es');
