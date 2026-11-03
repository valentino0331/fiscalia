import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not defined');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  console.log('--- APLICANDO MIGRACIÓN DDL: FASE 1 BASE NORMATIVA OFICIAL Y JURISPRUDENCIA ---');

  // 1. Extensions
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
  await sql`CREATE EXTENSION IF NOT EXISTS "vector";`;

  // 2. Table: legal_documents
  await sql`
    CREATE TABLE IF NOT EXISTS legal_documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      kind TEXT NOT NULL,
      issuer TEXT NOT NULL,
      official_number TEXT,
      source_url TEXT NOT NULL,
      source_format TEXT NOT NULL DEFAULT 'pdf',
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      file_sha256 TEXT NOT NULL,
      consolidated_as_of DATE NOT NULL,
      parser_version TEXT NOT NULL DEFAULT '1.0.0',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log('✓ Tabla legal_documents verificada/creada.');

  // 3. Table: legal_articles
  await sql`
    CREATE TABLE IF NOT EXISTS legal_articles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
      label TEXT NOT NULL,
      sort_key INTEGER NOT NULL,
      heading TEXT,
      breadcrumb TEXT,
      text TEXT NOT NULL,
      text_sha256 TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'in_force',
      modified_by JSONB DEFAULT '[]'::jsonb,
      valid_from DATE,
      valid_to DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_articles_doc_sort ON legal_articles(document_id, sort_key);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_articles_label ON legal_articles(label);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_articles_status ON legal_articles(status);`;
  console.log('✓ Tabla legal_articles e índices verificados/creados.');

  // 4. Table: case_law
  await sql`
    CREATE TABLE IF NOT EXISTS case_law (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      kind TEXT NOT NULL,
      official_number TEXT NOT NULL,
      chamber TEXT,
      region TEXT,
      decision_date DATE,
      subject TEXT NOT NULL,
      source_url TEXT NOT NULL,
      file_sha256 TEXT NOT NULL,
      verified_by TEXT,
      verified_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT uq_caselaw_kind_number UNIQUE (kind, official_number)
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_case_law_verified ON case_law(verified_at);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_case_law_kind ON case_law(kind);`;
  console.log('✓ Tabla case_law e índices verificados/creados.');

  // 5. Table: case_law_passages
  await sql`
    CREATE TABLE IF NOT EXISTS case_law_passages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      case_law_id UUID NOT NULL REFERENCES case_law(id) ON DELETE CASCADE,
      locator TEXT NOT NULL,
      literal_text TEXT NOT NULL,
      text_sha256 TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_case_law_passages_case ON case_law_passages(case_law_id);`;
  console.log('✓ Tabla case_law_passages e índices verificados/creados.');

  // 6. Alter legal_chunks: article_id and tsv
  await sql`ALTER TABLE legal_chunks ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES legal_articles(id) ON DELETE SET NULL;`;
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_chunks_article ON legal_chunks(article_id);`;

  try {
    await sql`ALTER TABLE legal_chunks ADD COLUMN IF NOT EXISTS tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('spanish', coalesce(articles, '') || ' ' || coalesce(content, ''))) STORED;`;
    await sql`CREATE INDEX IF NOT EXISTS idx_legal_chunks_tsv ON legal_chunks USING GIN(tsv);`;
    console.log('✓ Columna tsv e índice GIN en legal_chunks verificados/creados.');
  } catch (err: any) {
    console.warn('Notice on tsv / GIN:', err.message);
  }

  // 7. Check tables in schema
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('legal_documents', 'legal_articles', 'case_law', 'case_law_passages', 'legal_chunks')
    ORDER BY table_name;
  `;
  console.log('\nTablas verificadas en Neon Postgres:');
  for (const t of tables) {
    console.log(` - ${t.table_name}`);
  }
}

main().catch(err => {
  console.error('Migration Error:', err);
  process.exit(1);
});

