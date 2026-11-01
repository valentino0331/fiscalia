import { pgTable, text, timestamp, uuid, jsonb, index, boolean, integer, real, date } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

// pgvector custom type for Drizzle ORM
const vector = (name: string, dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]): string {
      return `[${value.join(',')}]`;
    },
    fromDriver(value: string): number[] {
      return value
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(Number);
    },
  })(name);


type ConversationMessage = {
  role: string;
  content: string;
  timestamp: string;
};

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    status: text('status').notNull().default('inactive'),
    plan: text('plan').notNull().default('pro'),
    hotmartTransaction: text('hotmart_transaction'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_subscriptions_user_id').on(table.userId),
    statusEndIdx: index('idx_subscriptions_status_end').on(table.status, table.currentPeriodEnd),
  })
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    agentId: text('agent_id').notNull(),
    title: text('title'),
    messages: jsonb('messages').$type<ConversationMessage[]>().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_conversations_user_id').on(table.userId),
    agentIdIdx: index('idx_conversations_agent_id').on(table.agentId),
    userUpdatedIdx: index('idx_conversations_user_updated').on(table.userId, table.updatedAt),
    createdAtIdx: index('idx_conversations_created_at').on(table.createdAt),
  })
);

export const savedMessages = pgTable(
  'saved_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    agentId: text('agent_id').notNull(),
    agentName: text('agent_name').notNull(),
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_saved_messages_user_id').on(table.userId),
  })
);

export const userMemory = pgTable('user_memory', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  name: text('name'),
  company: text('company'),
  role: text('role'),
  specialties: text('specialties'),
  notes: text('notes'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const questionUsageLogs = pgTable(
  'question_usage_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    monthKey: text('month_key').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userMonthIdx: index('idx_question_usage_user_month').on(table.userId, table.monthKey),
    userCreatedIdx: index('idx_question_usage_user_created').on(table.userId, table.createdAt),
  })
);

// ── RAG: Legal Chunks Vector Store ──
// Stores chunked text of Peruvian legal codes with 768-dim embeddings (Gemini text-embedding-004)
export const legalChunks = pgTable(
  'legal_chunks',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    // Which specialist this chunk is most relevant to (or 'all' for universal)
    specialistId: text('specialist_id').notNull().default('all'),
    // Source legal code (e.g. 'CC', 'CPC', 'CP', 'NCPP', 'LPAG', 'LPCL')
    sourceCode: text('source_code').notNull(),
    // Book/Title/Chapter reference
    section: text('section'),
    // Article numbers referenced in this chunk (e.g. 'Art. 667-669')
    articles: text('articles'),
    // The actual text content of the legal article(s)
    content: text('content').notNull(),
    // 768-dimensional embedding vector (Gemini text-embedding-004)
    embedding: vector('embedding', 768).notNull(),
    // Legal Source Registry & Document Integrity Metadata (Legal Truth Engine)
    sourceUrl: text('source_url'),
    sha256Hash: text('sha256_hash'),
    validityStatus: text('validity_status').default('in_force'),
    issuingEntity: text('issuing_entity'),
    publicationDate: date('publication_date'),
    bindingStatus: text('binding_status').default('binding'),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }).defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    specialistIdx: index('idx_legal_chunks_specialist').on(table.specialistId),
    sourceCodeIdx: index('idx_legal_chunks_source').on(table.sourceCode),
  })
);
