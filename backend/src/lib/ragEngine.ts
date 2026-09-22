/**
 * RAG Engine — Hardman Legal AI
 *
 * Retrieval-Augmented Generation para el sistema jurídico peruano.
 * Usa Gemini text-embedding-004 (768 dims) + pgvector en Neon PostgreSQL.
 *
 * Flujo:
 * 1. generateEmbedding(query)          → vector[768] via Gemini API
 * 2. searchSimilarChunks(vector, ...)  → top-K chunks del pgvector store
 * 3. getRagContext(agentId, query)     → bloque de texto verificado para el prompt
 */

import { neon } from '@neondatabase/serverless';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LegalChunk {
  id: string;
  specialistId: string;
  sourceCode: string;
  section: string | null;
  articles: string | null;
  content: string;
  similarity: number;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

// Gemini text-embedding-004 produces 768-dimensional vectors
const EMBEDDING_DIMENSIONS = 768;

// Number of most-similar chunks to retrieve per query
const TOP_K = 5;

// Minimum cosine similarity threshold (0 = no filter, 1 = exact match)
// 0.55 captures relevant articles while filtering unrelated ones
const MIN_SIMILARITY = 0.55;

// Max characters of context to inject into the prompt (to stay within token budget)
const MAX_CONTEXT_CHARS = 6000;

// ─── Embedding Cache (prevents duplicate API calls for same query in session) ─

const embeddingCache = new Map<string, { vector: number[]; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCachedEmbedding(text: string): number[] | null {
  const key = text.slice(0, 200); // key by first 200 chars
  const cached = embeddingCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.vector;
  return null;
}

function setCachedEmbedding(text: string, vector: number[]): void {
  const key = text.slice(0, 200);
  // Limit cache size to 200 entries
  if (embeddingCache.size >= 200) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey) embeddingCache.delete(firstKey);
  }
  embeddingCache.set(key, { vector, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Generates a 768-dimensional embedding vector for the given text
 * using Gemini text-embedding-004 via the REST API.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cached = getCachedEmbedding(text);
  if (cached) return cached;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) {
    throw new Error('[RAG] GEMINI_API_KEY no configurada — no se puede generar embedding.');
  }

  const cleanText = text.slice(0, 8000).trim(); // Gemini has 8k char limit for embeddings

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: cleanText }] },
        taskType: 'RETRIEVAL_QUERY',
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`[RAG] Gemini embedding API error ${response.status}: ${errBody}`);
  }

  const data = await response.json() as { embedding?: { values?: number[] } };
  const vector: number[] = data?.embedding?.values ?? [];

  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `[RAG] Embedding inválido: esperaba ${EMBEDDING_DIMENSIONS} dims, recibió ${vector?.length}`
    );
  }

  setCachedEmbedding(text, vector);
  return vector;
}

/**
 * Generates an embedding for a legal document chunk (for ingest-time).
 * Uses RETRIEVAL_DOCUMENT task type instead of RETRIEVAL_QUERY.
 */
export async function generateDocumentEmbedding(text: string): Promise<number[]> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) throw new Error('[RAG] GEMINI_API_KEY no configurada.');

  const cleanText = text.slice(0, 8000).trim();

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/text-embedding-004',
        content: { parts: [{ text: cleanText }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`[RAG] Gemini embedding error ${response.status}: ${errBody}`);
  }

  const data = await response.json() as { embedding?: { values?: number[] } };
  const vector: number[] = data?.embedding?.values ?? [];

  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`[RAG] Embedding de documento inválido: ${vector?.length} dims`);
  }

  return vector;
}

/**
 * Performs a vector similarity search in Neon pgvector.
 * Returns up to TOP_K chunks ordered by cosine similarity (highest first).
 *
 * @param queryVector  - 768-dim embedding of the user's query
 * @param specialistId - filter by specialist (e.g. 'diego', 'sebastian') or null for all
 * @param topK         - number of results to return
 */
export async function searchSimilarChunks(
  queryVector: number[],
  specialistId: string | null,
  topK: number = TOP_K
): Promise<LegalChunk[]> {
  if (!process.env.DATABASE_URL) {
    throw new Error('[RAG] DATABASE_URL no configurada.');
  }

  const sql = neon(process.env.DATABASE_URL);
  const vectorStr = `[${queryVector.join(',')}]`;

  // Use cosine distance (<=> operator) — lower value = more similar
  // We convert to similarity = 1 - distance for readability
  let rows: any[];

  if (specialistId && specialistId !== 'all') {
    // Filter by specialist AND 'all' (universal chunks apply to everyone)
    rows = await sql`
      SELECT
        id,
        specialist_id as "specialistId",
        source_code as "sourceCode",
        section,
        articles,
        content,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM legal_chunks
      WHERE specialist_id = ${specialistId} OR specialist_id = 'all'
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;
  } else {
    rows = await sql`
      SELECT
        id,
        specialist_id as "specialistId",
        source_code as "sourceCode",
        section,
        articles,
        content,
        1 - (embedding <=> ${vectorStr}::vector) as similarity
      FROM legal_chunks
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;
  }

  return rows
    .filter((r: any) => parseFloat(r.similarity) >= MIN_SIMILARITY)
    .map((r: any) => ({
      id: r.id,
      specialistId: r.specialistId,
      sourceCode: r.sourceCode,
      section: r.section,
      articles: r.articles,
      content: r.content,
      similarity: parseFloat(r.similarity),
    }));
}

/**
 * Main RAG function — called from chat.ts before each AI response.
 *
 * Returns a formatted string block of verified legal articles to inject
 * into the system prompt, or null if no relevant chunks were found.
 *
 * @param agentId      - the specialist's ID (e.g. 'diego', 'camila')
 * @param userQuery    - the user's latest message
 */
export async function getRagContext(
  agentId: string,
  userQuery: string
): Promise<string | null> {
  // Skip RAG if disabled via env flag
  if (process.env.RAG_ENABLED === 'false') return null;

  // Skip RAG if no DB or Gemini key
  if (!process.env.DATABASE_URL || !(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)) {
    return null;
  }

  // Skip short queries that don't need RAG (greetings, simple questions)
  const trimmedQuery = userQuery.trim();
  if (trimmedQuery.length < 20) return null;

  try {
    // 1. Generate embedding for the user's query
    const queryVector = await generateEmbedding(trimmedQuery);

    // 2. Search for similar legal chunks
    const chunks = await searchSimilarChunks(queryVector, agentId, TOP_K);

    if (chunks.length === 0) return null;

    // 3. Format the chunks as a verified context block
    let contextBlock = `\n\n════════════════════════════════════════\n`;
    contextBlock += `⚖️ ARTÍCULOS VERIFICADOS DEL SPIJ — TEXTO OFICIAL DE LA LEY\n`;
    contextBlock += `(Fragmentos recuperados del corpus normativo peruano. Cítalos con exactitud.)\n`;
    contextBlock += `════════════════════════════════════════\n\n`;

    let totalChars = contextBlock.length;

    for (const chunk of chunks) {
      const header = `📌 ${chunk.sourceCode}${chunk.articles ? ` — ${chunk.articles}` : ''}${chunk.section ? ` [${chunk.section}]` : ''}\n`;
      const body = chunk.content + '\n\n';
      const entry = header + body;

      if (totalChars + entry.length > MAX_CONTEXT_CHARS) break;

      contextBlock += entry;
      totalChars += entry.length;
    }

    contextBlock += `════════════════════════════════════════\n`;
    contextBlock += `INSTRUCCIÓN RAG: Usa los artículos anteriores como fuente primaria verificada. `;
    contextBlock += `Cita el número exacto de artículo y nombre del código. `;
    contextBlock += `Si la pregunta del usuario no está cubierta por los artículos anteriores, `;
    contextBlock += `indica claramente la limitación antes de complementar con tu conocimiento general.\n`;
    contextBlock += `════════════════════════════════════════\n`;

    return contextBlock;
  } catch (error: any) {
    // RAG is non-blocking: if it fails, the system falls back to spijLegalEngine
    console.warn('[RAG] Error en getRagContext (fallback a spijEngine):', error?.message || error);
    return null;
  }
}
