import { pgTable, text, timestamp, uuid, jsonb, index, boolean } from 'drizzle-orm/pg-core';

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
  })
);
