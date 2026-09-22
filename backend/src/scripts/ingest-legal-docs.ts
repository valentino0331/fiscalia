/**
 * Script de Ingestión RAG — Hardman Legal AI
 *
 * Lee los textos de los códigos legales peruanos, los divide en chunks,
 * genera embeddings con Gemini text-embedding-004 y los almacena en
 * la tabla legal_chunks de Neon PostgreSQL con pgvector.
 *
 * Uso:
 *   npx tsx src/scripts/ingest-legal-docs.ts
 *
 * Opciones:
 *   --force     Elimina todos los chunks existentes antes de insertar
 *   --dry-run   Solo parsea y muestra chunks sin insertar en DB
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import 'dotenv/config';
import { generateDocumentEmbedding } from '../lib/ragEngine';

// ─── Configuration ────────────────────────────────────────────────────────────

const LEGAL_DATA_DIR = join(__dirname, '../data/legal');

// Chunk size in characters (approx 600-800 tokens for Spanish legal text)
const CHUNK_SIZE = 1800;

// Overlap between consecutive chunks to preserve context across boundaries
const CHUNK_OVERLAP = 200;

// Delay between embedding API calls to respect rate limits (ms)
const EMBEDDING_DELAY_MS = 300;

// Maximum retries for a failed embedding call
const MAX_RETRIES = 3;

// ─── File → Specialist mapping ────────────────────────────────────────────────

const FILE_METADATA: Record<string, { sourceCode: string; specialistIds: string[] }> = {
  'codigo-civil.txt': {
    sourceCode: 'Código Civil (D.Leg. 295)',
    specialistIds: ['diego', 'camila'],
  },
  'codigo-procesal-civil.txt': {
    sourceCode: 'Código Procesal Civil (TUO RM 010-93-JUS)',
    specialistIds: ['diego'],
  },
  'codigo-penal-ncpp.txt': {
    sourceCode: 'Código Penal (D.Leg. 635) y NCPP (D.Leg. 957)',
    specialistIds: ['sebastian'],
  },
  'legislacion-laboral.txt': {
    sourceCode: 'Legislación Laboral (D.S. 003-97-TR, D.Leg. 650, D.Leg. 713)',
    specialistIds: ['valentina'],
  },
  'lpag-contrataciones.txt': {
    sourceCode: 'TUO LPAG (D.S. 006-2026-JUS) y Ley 32069',
    specialistIds: ['marco'],
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedChunk {
  specialistId: string;
  sourceCode: string;
  section: string | null;
  articles: string | null;
  content: string;
}

// ─── Text Processing ──────────────────────────────────────────────────────────

/**
 * Extracts the article reference from a text line (e.g. "Artículo 667.-")
 */
function extractArticleRef(line: string): string | null {
  const match = line.match(/^(Art[íi]culo[s]?\s+[\d°\-,\s]+\.?|Ley\s+N°?\s+[\d\-]+|Decreto\s+\w+[^—\n]{0,40})/i);
  return match ? match[0].trim() : null;
}

/**
 * Splits text into overlapping chunks of approximately CHUNK_SIZE characters.
 * Attempts to split on paragraph/article boundaries for better coherence.
 */
function chunkText(text: string, sourceCode: string, specialistId: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];

  // Split on double newlines (paragraph boundaries)
  const paragraphs = text.split(/\n{2,}/);

  let currentChunk = '';
  let currentSection: string | null = null;
  let currentArticles: string | null = null;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // Detect section headers (lines with ═══ or all caps)
    if (trimmed.startsWith('═══') || /^[A-ZÁÉÍÓÚÑ\s]{10,}$/.test(trimmed)) {
      // If we have accumulated content, save it before new section
      if (currentChunk.trim().length > 100) {
        chunks.push({
          specialistId,
          sourceCode,
          section: currentSection,
          articles: currentArticles,
          content: currentChunk.trim(),
        });
        currentChunk = '';
        currentArticles = null;
      }
      currentSection = trimmed.replace(/═/g, '').trim();
      continue;
    }

    // Try to detect article references in this paragraph
    const lines = trimmed.split('\n');
    const firstLine = lines[0];
    const articleRef = extractArticleRef(firstLine);
    if (articleRef) {
      // If we have a substantial chunk and found a new article, save current chunk
      if (currentChunk.trim().length > CHUNK_SIZE - CHUNK_OVERLAP) {
        chunks.push({
          specialistId,
          sourceCode,
          section: currentSection,
          articles: currentArticles,
          content: currentChunk.trim(),
        });
        // Keep overlap (last 200 chars) as beginning of next chunk
        currentChunk = currentChunk.slice(-CHUNK_OVERLAP);
      }
      currentArticles = articleRef;
    }

    currentChunk += '\n\n' + trimmed;

    // If chunk is large enough, force a split
    if (currentChunk.length > CHUNK_SIZE) {
      chunks.push({
        specialistId,
        sourceCode,
        section: currentSection,
        articles: currentArticles,
        content: currentChunk.trim(),
      });
      currentChunk = currentChunk.slice(-CHUNK_OVERLAP);
    }
  }

  // Push any remaining content
  if (currentChunk.trim().length > 100) {
    chunks.push({
      specialistId,
      sourceCode,
      section: currentSection,
      articles: currentArticles,
      content: currentChunk.trim(),
    });
  }

  return chunks;
}

/**
 * Processes a single legal document file into chunks.
 * For files with multiple specialists, creates one chunk set per specialist.
 */
function processFile(filePath: string, filename: string): ParsedChunk[] {
  const meta = FILE_METADATA[filename];
  if (!meta) {
    console.warn(`[Ingest] Sin metadata para: ${filename} — saltando`);
    return [];
  }

  const text = readFileSync(filePath, 'utf-8');
  const allChunks: ParsedChunk[] = [];

  for (const specialistId of meta.specialistIds) {
    const chunks = chunkText(text, meta.sourceCode, specialistId);
    allChunks.push(...chunks);
    console.log(`  → ${chunks.length} chunks para especialista '${specialistId}'`);
  }

  // Also create 'all' chunks for the first few chunks (universal context)
  if (meta.specialistIds.length > 0) {
    const universalChunks = chunkText(text, meta.sourceCode, 'all').slice(0, 3);
    allChunks.push(...universalChunks);
  }

  return allChunks;
}

// ─── Database Operations ──────────────────────────────────────────────────────

async function createTable(sql: any): Promise<void> {
  // Enable pgvector extension
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  // Create the legal_chunks table
  await sql`
    CREATE TABLE IF NOT EXISTS legal_chunks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      specialist_id TEXT NOT NULL DEFAULT 'all',
      source_code TEXT NOT NULL,
      section TEXT,
      articles TEXT,
      content TEXT NOT NULL,
      embedding vector(768) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  // Create indexes for filtering and vector search
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_chunks_specialist ON legal_chunks(specialist_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_chunks_source ON legal_chunks(source_code)`;

  // Create HNSW index for fast approximate nearest neighbor search
  // This is the recommended index type for pgvector with cosine distance
  try {
    await sql`
      CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding
      ON legal_chunks
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `;
    console.log('[DB] Índice HNSW creado para búsqueda vectorial');
  } catch (e: any) {
    // HNSW might fail on older pgvector — fall back to ivfflat
    console.warn('[DB] HNSW no disponible, usando IVFFlat:', e.message);
    await sql`
      CREATE INDEX IF NOT EXISTS idx_legal_chunks_embedding
      ON legal_chunks
      USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100)
    `;
  }

  console.log('[DB] Tabla legal_chunks e índices verificados ✅');
}

async function clearExistingChunks(sql: any): Promise<void> {
  const result = await sql`DELETE FROM legal_chunks`;
  console.log(`[DB] Eliminados chunks existentes`);
}

async function insertChunk(
  sql: any,
  chunk: ParsedChunk,
  embedding: number[]
): Promise<void> {
  const vectorStr = `[${embedding.join(',')}]`;
  await sql`
    INSERT INTO legal_chunks (specialist_id, source_code, section, articles, content, embedding)
    VALUES (
      ${chunk.specialistId},
      ${chunk.sourceCode},
      ${chunk.section},
      ${chunk.articles},
      ${chunk.content},
      ${vectorStr}::vector
    )
  `;
}

// ─── Main Ingestion Flow ──────────────────────────────────────────────────────

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function embedWithRetry(text: string, attempt = 1): Promise<number[]> {
  try {
    return await generateDocumentEmbedding(text);
  } catch (err: any) {
    if (attempt >= MAX_RETRIES) throw err;
    console.warn(`  [Retry ${attempt}/${MAX_RETRIES}] Error embedding, reintentando en 2s...`);
    await sleep(2000 * attempt);
    return embedWithRetry(text, attempt + 1);
  }
}

async function main(): Promise<void> {
  const isDryRun = process.argv.includes('--dry-run');
  const isForce = process.argv.includes('--force');

  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║  Hardman RAG — Ingestión de Corpus Legal Peruano  ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');

  if (!process.env.DATABASE_URL && !isDryRun) {
    throw new Error('DATABASE_URL no configurada en .env');
  }
  if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY && !isDryRun) {
    throw new Error('GEMINI_API_KEY no configurada en .env — necesaria para generar embeddings.\nAgrégala al archivo .env: GEMINI_API_KEY=tu_clave_aqui');
  }

  const sql = !isDryRun ? neon(process.env.DATABASE_URL!) : null;

  // 1. Setup database
  if (!isDryRun && sql) {
    console.log('[1/4] Verificando tabla y extensión pgvector...');
    await createTable(sql);
    if (isForce) {
      console.log('[1/4] Modo --force: eliminando chunks existentes...');
      await clearExistingChunks(sql);
    }
  }

  // 2. Parse all legal files
  console.log('[2/4] Procesando archivos legales...');

  if (!existsSync(LEGAL_DATA_DIR)) {
    throw new Error(`Directorio de datos legales no encontrado: ${LEGAL_DATA_DIR}`);
  }

  const files = readdirSync(LEGAL_DATA_DIR).filter((f) => f.endsWith('.txt'));
  if (files.length === 0) {
    throw new Error(`No se encontraron archivos .txt en: ${LEGAL_DATA_DIR}`);
  }

  const allChunks: ParsedChunk[] = [];

  for (const filename of files) {
    const filePath = join(LEGAL_DATA_DIR, filename);
    console.log(`\n  📄 ${filename}`);
    const chunks = processFile(filePath, filename);
    allChunks.push(...chunks);
  }

  console.log(`\n[2/4] Total: ${allChunks.length} chunks generados de ${files.length} archivos`);

  if (isDryRun) {
    console.log('\n[DRY RUN] Primeros 3 chunks de ejemplo:');
    for (const chunk of allChunks.slice(0, 3)) {
      console.log('---');
      console.log(`Especialista: ${chunk.specialistId}`);
      console.log(`Código: ${chunk.sourceCode}`);
      console.log(`Artículos: ${chunk.articles}`);
      console.log(`Contenido (primeros 200 chars): ${chunk.content.slice(0, 200)}...`);
    }
    console.log('\n[DRY RUN] Completado sin modificar la base de datos.');
    return;
  }

  if (!sql) return;

  // 3. Generate embeddings and insert
  console.log('[3/4] Generando embeddings e insertando en pgvector...');
  console.log(`      (Esto puede tomar ${Math.ceil(allChunks.length * EMBEDDING_DELAY_MS / 60000)} minutos)\n`);

  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const progress = `[${i + 1}/${allChunks.length}]`;

    try {
      const embedding = await embedWithRetry(chunk.content);
      await insertChunk(sql, chunk, embedding);
      inserted++;

      if ((i + 1) % 10 === 0 || i + 1 === allChunks.length) {
        const pct = Math.round(((i + 1) / allChunks.length) * 100);
        process.stdout.write(`\r  ${progress} ${pct}% completado (${inserted} insertados, ${failed} fallidos)   `);
      }

      // Rate limiting: pause between API calls
      await sleep(EMBEDDING_DELAY_MS);
    } catch (err: any) {
      failed++;
      console.error(`\n  ❌ ${progress} Error insertando chunk: ${err.message}`);
    }
  }

  console.log('\n');
  console.log('[4/4] Verificando resultado final...');
  const countResult = await sql`SELECT COUNT(*) as total FROM legal_chunks`;
  const total = parseInt(countResult[0].total);
  console.log(`      Total en DB: ${total} chunks`);

  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log(`║  ✅ Ingestión completada: ${inserted}/${allChunks.length} chunks          ║`);
  if (failed > 0) {
    console.log(`║  ⚠️  ${failed} chunks fallaron (revisar logs)              ║`);
  }
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
  console.log('  El RAG está listo. Activa RAG_ENABLED=true en .env');
  console.log('  y reinicia el servidor backend para activarlo.');
  console.log('');
}

main().catch((err) => {
  console.error('\n❌ Error fatal en ingestión:', err);
  process.exit(1);
});
