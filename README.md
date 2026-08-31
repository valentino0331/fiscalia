# Bufete IA

Plataforma SaaS de asistentes jurídicos especializados en derecho peruano, potenciados por Claude (Anthropic).

## Requisitos previos

- **Node.js 18+** — descargar en https://nodejs.org
- **Cuenta Neon** — base de datos PostgreSQL serverless: https://neon.tech
- **API Key de Anthropic** — https://console.anthropic.com
- **Cuenta Hotmart** (para webhooks de pago)

---

## Setup rápido (desarrollo local)

### 1. Base de datos (Neon)

1. Crear proyecto en https://neon.tech
2. Copiar la `Connection String`
3. En el **SQL Editor** de Neon, ejecutar:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'inactive',
  plan TEXT NOT NULL DEFAULT 'pro',
  hotmart_transaction TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
```

Alternativa rápida: usa los scripts ya preparados en:
- `backend/sql/neon_schema.sql`
- `backend/sql/admin_setup.sql`

### 2. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
npm run dev
```

El servidor arranca en `http://localhost:3001`

**Variables de entorno del backend** (`.env`):
```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://...  # tu Connection String de Neon
JWT_SECRET=genera_un_string_aleatorio_de_64_chars
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=sk-ant-api03-...
HOTMART_SECRET=tu_hotmart_secret
FRONTEND_URL=http://localhost:5173
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# .env ya tiene VITE_API_URL=http://localhost:3001 para desarrollo
npm install
npm run dev
```

La app abre en `http://localhost:5173`

---

## Notas importantes

### Activar suscripción manualmente (para desarrollo)

Insertar directamente en la BD para testear el chat:

```sql
INSERT INTO subscriptions (user_id, status, plan, current_period_end)
VALUES ('UUID_DEL_USUARIO', 'active', 'pro', NOW() + INTERVAL '30 days');
```

### Acceso al panel de administrador

1. Registra un usuario normal desde la app.
2. En Neon ejecuta `backend/sql/admin_setup.sql` cambiando el email admin.
3. Inicia sesión con ese usuario y entrarás al panel interno `/portal-interno`.

El dashboard admin muestra:
- Usuarios totales
- Suscripciones activas
- Conversaciones totales
- Usuarios conectados (aprox. por actividad en últimos 5 minutos)
- Registros por día (7 días)
- Carga por agente (conversaciones/mensajes)

### Imágenes de agentes

Las fotos están en `frontend/public/agents/`:
- valentina.jpg, sebastian.jpg, diego.jpg, adriana.jpg
- rodrigo.jpg, camila.jpg, fernanda.jpg, marco.jpg

### System prompts

Los 8 system prompts completos están en `backend/src/prompts/agents.ts`.
Rafael actualiza el contenido; el ing solo hace deploy.

---

## Deploy a producción

### Backend → Render

1. New Web Service → conectar repo GitHub
2. Build Command: `cd backend && npm install && npm run build`
3. Start Command: `cd backend && npm start`
4. Agregar todas las variables de entorno del `.env.example`

### Frontend → Netlify

1. New site → conectar repo GitHub
2. El archivo `netlify.toml` ya deja la configuración lista para monorepo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Variable de entorno: `VITE_API_URL=https://tu-backend.onrender.com`

---

## Stack

```
Frontend:  React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion
Backend:   Node.js + Express + TypeScript
Database:  Neon (PostgreSQL serverless) + Drizzle ORM
Auth:      JWT (jsonwebtoken + bcrypt)
AI:        Anthropic SDK (claude-sonnet-4-6)
Pagos:     Hotmart Webhooks
Deploy:    Netlify (FE) + Render (BE)
```
