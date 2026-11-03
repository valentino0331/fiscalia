-- ══════════════════════════════════════════════════════════════════════
-- HARDMAN LEGAL CORE — FASE 1: BASE NORMATIVA OFICIAL Y JURISPRUDENCIA
-- Migración DDL para Neon PostgreSQL + pgvector
-- ══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Documentos Legales Oficiales (Códigos, Leyes, Decretos Supremos)
CREATE TABLE IF NOT EXISTS legal_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,                       -- Ej: 'CC', 'CPC', 'CP', 'NCPP', 'LPAG', 'LPCL', 'LGCP'
    title TEXT NOT NULL,                             -- Ej: 'Código Civil del Perú'
    kind TEXT NOT NULL,                              -- 'codigo', 'ley', 'decreto_legislativo', 'decreto_supremo', 'constitucion'
    issuer TEXT NOT NULL,                            -- 'Congreso de la República', 'Poder Ejecutivo'
    official_number TEXT,                            -- 'Decreto Legislativo N° 295'
    source_url TEXT NOT NULL,                        -- URL oficial de descarga (El Peruano / Congreso)
    source_format TEXT NOT NULL DEFAULT 'pdf',       -- 'pdf', 'html', 'spij'
    fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_sha256 TEXT NOT NULL,                       -- Hash SHA-256 del documento oficial descargado
    consolidated_as_of DATE NOT NULL,                -- Fecha de actualización / consolidación
    parser_version TEXT NOT NULL DEFAULT '1.0.0',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Artículos Normativos Literales (Prohibido parafrasear)
CREATE TABLE IF NOT EXISTS legal_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    label TEXT NOT NULL,                             -- Ej: 'Art. 130', 'Art. 345-A', 'Primera Disposición Complementaria'
    sort_key INTEGER NOT NULL,                       -- Orden secuencial monótono dentro del documento
    heading TEXT,                                    -- Sumilla / epígrafe oficial (ej: 'Forma del escrito')
    breadcrumb TEXT,                                 -- Jerarquía (ej: 'Libro I > Título II > Capítulo I')
    text TEXT NOT NULL,                              -- TEXTO LITERAL EXACTO oficial
    text_sha256 TEXT NOT NULL,                       -- Hash del texto literal
    status TEXT NOT NULL DEFAULT 'in_force',         -- 'in_force', 'modified', 'repealed', 'partial'
    modified_by TEXT[] DEFAULT '{}',                 -- Normas modificatorias oficiales (ej: ARRAY['Ley 31591', 'D. Leg. 1585'])
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_document_label_valid_from UNIQUE (document_id, label, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_legal_articles_doc_sort ON legal_articles(document_id, sort_key);
CREATE INDEX IF NOT EXISTS idx_legal_articles_label ON legal_articles(label);
CREATE INDEX IF NOT EXISTS idx_legal_articles_status ON legal_articles(status);

-- 3. Jurisprudencia Oficial y Precedentes Vinculantes
CREATE TABLE IF NOT EXISTS case_law (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kind TEXT NOT NULL,                              -- 'pleno_casatorio', 'acuerdo_plenario', 'casacion', 'sentencia_tc'
    official_number TEXT NOT NULL,                   -- Ej: 'Casación N° 4664-2010/Puno'
    chamber TEXT,                                    -- Ej: 'Salas Civiles Reunidas de la Corte Suprema'
    region TEXT,                                     -- Ej: 'Puno'
    decision_date DATE,
    subject TEXT NOT NULL,                           -- Tema central / materia
    source_url TEXT NOT NULL,                        -- URL de descarga del PDF oficial del PJ / TC
    file_sha256 TEXT NOT NULL,                       -- Hash SHA-256 del PDF oficial
    verified_by TEXT,                                -- Auditor humano o sistema que contrastó
    verified_at TIMESTAMPTZ,                         -- NULL = NO CITABLE BAJO NINGUNA CIRCUNSTANCIA
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_caselaw_kind_number UNIQUE (kind, official_number)
);

CREATE INDEX IF NOT EXISTS idx_case_law_verified ON case_law(verified_at);
CREATE INDEX IF NOT EXISTS idx_case_law_kind ON case_law(kind);

-- 4. Pasajes Literales y Fundamentos Vinculantes
CREATE TABLE IF NOT EXISTS case_law_passages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_law_id UUID NOT NULL REFERENCES case_law(id) ON DELETE CASCADE,
    locator TEXT NOT NULL,                           -- 'Precedente Vinculante 1', 'FJ 12'
    literal_text TEXT NOT NULL,                      -- Texto literal transcrito sin parafraseo
    text_sha256 TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_law_passages_case ON case_law_passages(case_law_id);

-- 5. Adaptación de legal_chunks con Full-Text Search (TSVECTOR) y vínculo a artículos
ALTER TABLE legal_chunks ADD COLUMN IF NOT EXISTS article_id UUID REFERENCES legal_articles(id) ON DELETE SET NULL;
ALTER TABLE legal_chunks ADD COLUMN IF NOT EXISTS tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('spanish', coalesce(articles, '') || ' ' || coalesce(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS idx_legal_chunks_tsv ON legal_chunks USING GIN(tsv);
CREATE INDEX IF NOT EXISTS idx_legal_chunks_article ON legal_chunks(article_id);

-- Índice HNSW sobre embedding de 768 dimensiones para pgvector
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'idx_legal_chunks_embedding_hnsw'
    ) THEN
        CREATE INDEX idx_legal_chunks_embedding_hnsw ON legal_chunks USING hnsw (embedding vector_cosine_ops);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgvector HNSW index creation skipped or deferred: %', SQLERRM;
END $$;

