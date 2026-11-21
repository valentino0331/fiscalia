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
  validityStatus?: string | null;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

// Gemini text-embedding-004 produces 768-dimensional vectors
const EMBEDDING_DIMENSIONS = 768;

// Number of most-similar chunks to retrieve per query
const TOP_K = 8;

// Minimum cosine similarity threshold (0 = no filter, 1 = exact match)
// 0.55 captures relevant articles while filtering unrelated ones
const MIN_SIMILARITY = 0.55;

// Max characters of context to inject into the prompt (to stay within token budget)
const MAX_CONTEXT_CHARS = 12000;

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

interface EmbeddingModelCandidate {
  endpoint: string;
  model: string;
  hasOutputDims: boolean;
}

const CANDIDATE_MODELS: EmbeddingModelCandidate[] = [
  // 1. Current state-of-the-art embedding model
  {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent',
    model: 'models/gemini-embedding-001',
    hasOutputDims: true,
  },
  // 2. v1 endpoint for text-embedding-004
  {
    endpoint: 'https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent',
    model: 'models/text-embedding-004',
    hasOutputDims: false,
  },
  // 3. v1beta endpoint for text-embedding-004
  {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
    model: 'models/text-embedding-004',
    hasOutputDims: false,
  },
  // 4. Legacy embedding-001
  {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent',
    model: 'models/embedding-001',
    hasOutputDims: false,
  },
];

// Cache the index of the first working candidate model to avoid repeated fail-and-fallback roundtrips
let cachedWorkingModelIndex = 0;

async function requestGeminiEmbedding(
  cleanText: string,
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT',
  geminiKey: string
): Promise<number[]> {
  const errors: string[] = [];

  const order = [
    cachedWorkingModelIndex,
    ...CANDIDATE_MODELS.map((_, i) => i).filter((i) => i !== cachedWorkingModelIndex),
  ];

  for (const idx of order) {
    const candidate = CANDIDATE_MODELS[idx];
    const url = `${candidate.endpoint}?key=${geminiKey}`;

    const body: Record<string, any> = {
      model: candidate.model,
      content: { parts: [{ text: cleanText }] },
      taskType,
    };

    if (candidate.hasOutputDims) {
      body.outputDimensionality = EMBEDDING_DIMENSIONS;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        errors.push(`[${candidate.model} @ ${response.status}]: ${errText.slice(0, 150)}`);
        continue;
      }

      const data = (await response.json()) as { embedding?: { values?: number[] } };
      let vector: number[] = data?.embedding?.values ?? [];

      if (!Array.isArray(vector) || vector.length === 0) {
        errors.push(`[${candidate.model}]: vector vacío`);
        continue;
      }

      // If dimensions exceed target (e.g. model returned 3072 or 1536), apply Matryoshka truncation + L2 normalization
      if (vector.length > EMBEDDING_DIMENSIONS) {
        const sliced = vector.slice(0, EMBEDDING_DIMENSIONS);
        const norm = Math.sqrt(sliced.reduce((sum, v) => sum + v * v, 0));
        vector = norm > 0 ? sliced.map((v) => v / norm) : sliced;
      }

      if (vector.length === EMBEDDING_DIMENSIONS) {
        cachedWorkingModelIndex = idx;
        return vector;
      }

      errors.push(`[${candidate.model}]: dimensión inesperada ${vector.length}`);
    } catch (err: any) {
      errors.push(`[${candidate.model}]: ${err.message}`);
    }
  }

  throw new Error(`[RAG] Fallaron todos los modelos de embedding de Gemini: ${errors.join(' | ')}`);
}

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Generates a 768-dimensional embedding vector for the given text
 * using Gemini embeddings via REST API with multi-model fallback.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cached = getCachedEmbedding(text);
  if (cached) return cached;

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!geminiKey) {
    throw new Error('[RAG] GEMINI_API_KEY no configurada — no se puede generar embedding.');
  }

  const cleanText = text.slice(0, 8000).trim();
  const vector = await requestGeminiEmbedding(cleanText, 'RETRIEVAL_QUERY', geminiKey);

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
  return requestGeminiEmbedding(cleanText, 'RETRIEVAL_DOCUMENT', geminiKey);
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
  let rows: any[] = [];
  try {
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
          coalesce(validity_status, 'in_force') as "validityStatus",
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
          coalesce(validity_status, 'in_force') as "validityStatus",
          1 - (embedding <=> ${vectorStr}::vector) as similarity
        FROM legal_chunks
        ORDER BY embedding <=> ${vectorStr}::vector
        LIMIT ${topK}
      `;
    }
  } catch (dbErr: any) {
    // Si la tabla aún no contiene datos o pgvector está inicializando, retornar vacío para fallback inmediato a spijLegalEngine
    return [];
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
      validityStatus: r.validityStatus || 'in_force',
      similarity: parseFloat(r.similarity),
    }));
}

// ─── Native PostgreSQL Text Search (Zero external API dependencies) ─────────

const STOPWORDS = new Set([
  'para', 'como', 'cuando', 'donde', 'segun', 'sobre', 'este', 'esta',
  'estos', 'estas', 'cual', 'cuales', 'tiene', 'tienen', 'puede', 'pueden',
  'debe', 'deben', 'hacer', 'saber', 'decir', 'pero', 'porque', 'entre',
  'desde', 'hasta', 'hacia', 'contra', 'ante', 'bajo', 'mediante', 'ellos',
  'ellas', 'usted', 'ustedes', 'nosotros', 'hola', 'buenas', 'buenos', 'dias',
  'tardes', 'noches', 'favor', 'ayuda', 'asesoria', 'abogado', 'consulta',
  'quiero', 'informacion', 'explica', 'explicar', 'detalle', 'necesito'
]);

export function extractSearchKeywords(query: string): string[] {
  // 1. Extraer menciones específicas de artículos y números de casación
  const exactNumbers: string[] = [];
  const articleMatches = query.match(/(?:art[íi]culo|art\.?)\s*([0-9A-Za-z\-]+)/gi);
  if (articleMatches) {
    articleMatches.forEach(m => {
      const num = m.replace(/art[íi]culo|art\.?/gi, '').trim();
      if (num) exactNumbers.push(num);
    });
  }
  const docketMatches = query.match(/([0-9]{1,5}[-–/][0-9]{4})/gi);
  if (docketMatches) {
    docketMatches.forEach(d => exactNumbers.push(d.trim()));
  }

  const words = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => (w.length >= 4 || /^\d{2,4}$/.test(w)) && !STOPWORDS.has(w));

  return [...new Set([...exactNumbers, ...words])];
}

export function extractLegalSearchParameters(query: string): {
  exactArticles: string[];
  exactDockets: string[];
  detectedCode: string | null;
  keywords: string[];
} {
  const exactArticles: string[] = [];
  const articleMatches = query.match(/(?:art[íi]culo|art\.?)\s*([0-9]{1,4}(?:-[A-Za-z])?)/gi);
  if (articleMatches) {
    articleMatches.forEach((m) => {
      const num = m.replace(/(?:art[íi]culo|art\.?)\s*/gi, '').trim();
      if (num) exactArticles.push(num);
    });
  }

  const exactDockets: string[] = [];
  const docketMatches = query.match(/\b([0-9]{1,5}[-–/][0-9]{4})\b/g);
  if (docketMatches) {
    docketMatches.forEach((d) => exactDockets.push(d.trim()));
  }

  let detectedCode: string | null = null;
  if (/c[óo]digo\s+civil\b|\bcc\b/i.test(query)) detectedCode = 'CC';
  else if (/c[óo]digo\s+procesal\s+civil\b|\bcpc\b/i.test(query)) detectedCode = 'CPC';
  else if (/ncpp\b|procesal\s+penal/i.test(query)) detectedCode = 'NCPP';
  else if (/c[óo]digo\s+penal\b|\bcp\b/i.test(query)) detectedCode = 'CP';
  else if (/lpag\b|ley\s+27444/i.test(query)) detectedCode = 'LPAG';
  else if (/32069|oece/i.test(query)) detectedCode = 'LGCP';
  else if (/lpcl\b|003[-–]97[-–]tr/i.test(query)) detectedCode = 'LPCL';
  else if (/nlpt\b|29497/i.test(query)) detectedCode = 'NLPT';

  const keywords = extractSearchKeywords(query);

  return {
    exactArticles: [...new Set(exactArticles)],
    exactDockets: [...new Set(exactDockets)],
    detectedCode,
    keywords,
  };
}

/**
 * Búsqueda textual directa en Neon PostgreSQL con discriminador exacto de artículos.
 * No requiere Gemini ni APIs externas. Funciona 100% con OpenRouter.
 */
export async function searchChunksByText(
  queryText: string,
  specialistId: string | null,
  topK: number = TOP_K
): Promise<LegalChunk[]> {
  if (!process.env.DATABASE_URL) return [];

  const params = extractLegalSearchParameters(queryText);
  if (params.keywords.length === 0) return [];

  const sql = neon(process.env.DATABASE_URL);
  const primaryArticle = params.exactArticles[0] || null;
  const primaryDocket = params.exactDockets[0] || null;
  const primaryCode = params.detectedCode || null;

  const mainTerm = params.keywords[0];
  const secondTerm = params.keywords[1] || mainTerm;
  const thirdTerm = params.keywords[2] || secondTerm;

  const filterSpecialist = specialistId && specialistId !== 'all' ? specialistId : null;

  try {
    const rows = await sql`
      SELECT
        id,
        specialist_id as "specialistId",
        source_code as "sourceCode",
        section,
        articles,
        content,
        coalesce(validity_status, 'in_force') as "validityStatus"
      FROM legal_chunks
      WHERE (
        ${filterSpecialist}::text IS NULL
        OR specialist_id = ${filterSpecialist}
        OR specialist_id = 'all'
      )
      AND (
        (${primaryArticle}::text IS NOT NULL AND articles ILIKE ${'%' + (primaryArticle || '') + '%'})
        OR (${primaryDocket}::text IS NOT NULL AND content ILIKE ${'%' + (primaryDocket || '') + '%'})
        OR content ILIKE ${'%' + mainTerm + '%'}
        OR content ILIKE ${'%' + secondTerm + '%'}
        OR content ILIKE ${'%' + thirdTerm + '%'}
        OR articles ILIKE ${'%' + mainTerm + '%'}
      )
      ORDER BY (
        (CASE WHEN ${primaryArticle}::text IS NOT NULL AND articles ILIKE ${'%' + (primaryArticle || '') + '%'} THEN 150 ELSE 0 END) +
        (CASE WHEN ${primaryCode}::text IS NOT NULL AND source_code ILIKE ${'%' + (primaryCode || '') + '%'} THEN 80 ELSE 0 END) +
        (CASE WHEN specialist_id = ${specialistId || ''} THEN 30 ELSE 0 END) +
        (CASE WHEN articles ILIKE ${'%' + mainTerm + '%'} THEN 40 ELSE 0 END) +
        (CASE WHEN articles ILIKE ${'%' + secondTerm + '%'} THEN 25 ELSE 0 END) +
        (CASE WHEN content ILIKE ${'%' + mainTerm + '%'} THEN 10 ELSE 0 END) +
        (CASE WHEN content ILIKE ${'%' + secondTerm + '%'} THEN 5 ELSE 0 END) +
        (CASE WHEN content ILIKE ${'%' + thirdTerm + '%'} THEN 3 ELSE 0 END)
      ) DESC
      LIMIT ${topK}
    `;

    return rows.map((r: any) => ({
      id: r.id,
      specialistId: r.specialistId,
      sourceCode: r.sourceCode,
      section: r.section,
      articles: r.articles,
      content: r.content,
      validityStatus: r.validityStatus || 'in_force',
      similarity: primaryArticle && r.articles?.includes(primaryArticle) ? 1.0 : 0.9,
    }));
  } catch (err: any) {
    return [];
  }
}

/**
 * Realiza Búsqueda Híbrida combinando Dense Vector Search y Sparse Text Search
 * aplicando Fusión de Rango Recíproco (RRF - Reciprocal Rank Fusion).
 *
 * Fórmula estándar (Cormack et al.):
 * RRF_Score(doc) = (1 / (k + r_dense(doc))) + (1 / (k + r_sparse(doc))) + exactArticleBonus + codeBonus
 *
 * @param queryText    - Texto de la consulta del usuario
 * @param specialistId - Identificador del agente o null para todos
 * @param queryVector  - Vector de 768 dims (o null si no hay Gemini)
 * @param topK         - Cantidad final de fragmentos a inyectar (default 5)
 * @param factsYear    - Año de los hechos para análisis temporal (tempus regit actum)
 */
export async function hybridSearchRRF(
  queryText: string,
  specialistId: string | null,
  queryVector: number[] | null,
  topK: number = TOP_K,
  factsYear?: number | null
): Promise<LegalChunk[]> {
  const K_RRF = 60; // Constante de suavizado estándar en RRF

  // Ejecutar búsquedas densa y dispersa en paralelo
  const [denseResults, sparseResults] = await Promise.all([
    queryVector ? searchSimilarChunks(queryVector, specialistId, topK * 2).catch(() => []) : Promise.resolve([]),
    searchChunksByText(queryText, specialistId, topK * 2).catch(() => []),
  ]);

  if (denseResults.length === 0 && sparseResults.length === 0) {
    return [];
  }

  const params = extractLegalSearchParameters(queryText);
  const candidateMap = new Map<string, {
    chunk: LegalChunk;
    denseRank: number | null;
    sparseRank: number | null;
  }>();

  // 1. Mapear resultados densos (Vector)
  denseResults.forEach((chunk, index) => {
    candidateMap.set(chunk.id, {
      chunk,
      denseRank: index + 1,
      sparseRank: null,
    });
  });

  // 2. Mapear resultados dispersos (Texto / Exact match)
  sparseResults.forEach((chunk, index) => {
    const existing = candidateMap.get(chunk.id);
    if (existing) {
      existing.sparseRank = index + 1;
    } else {
      candidateMap.set(chunk.id, {
        chunk,
        denseRank: null,
        sparseRank: index + 1,
      });
    }
  });

  // 3. Calcular RRF Score ponderado y filtrar por vigencia temporal
  const isHistorical = typeof factsYear === 'number' && factsYear < 2026;
  const scoredCandidates: { chunk: LegalChunk; score: number }[] = [];

  for (const entry of candidateMap.values()) {
    const { chunk, denseRank, sparseRank } = entry;

    // Filtro de vigencia temporal (Principio Tempus Regit Actum):
    // Si la consulta es para el presente (2026) y el fragmento está explícitamente derogado,
    // se descarta salvo que el usuario consulte expresamente sobre dicha norma derogada.
    const isChunkRepealed = chunk.validityStatus === 'repealed' ||
      /\b(?:derogad[ao]|reemplazad[ao])\b/i.test(chunk.sourceCode);

    if (!isHistorical && isChunkRepealed) {
      const userAskedAboutRepealed = params.exactArticles.some(a => chunk.articles?.includes(a)) ||
        params.keywords.some(k => chunk.sourceCode.toLowerCase().includes(k));
      if (!userAskedAboutRepealed) {
        continue; // Omitir norma derogada no solicitada
      }
    }

    let densePart = 0;
    if (denseRank !== null) {
      densePart = 1 / (K_RRF + denseRank);
    }

    let sparsePart = 0;
    if (sparseRank !== null) {
      sparsePart = 1 / (K_RRF + sparseRank);
    }

    let exactArticleBonus = 0;
    // Si el fragmento coincide exactamente con el número de artículo solicitado por el letrado
    if (params.exactArticles.length > 0) {
      const matchesArticle = params.exactArticles.some((art) => {
        return (
          (chunk.articles && chunk.articles.toLowerCase().includes(art.toLowerCase())) ||
          new RegExp(`\\bArt(?:[íi]culo|\\.)\\s*${art}\\b`, 'i').test(chunk.content)
        );
      });
      if (matchesArticle) {
        exactArticleBonus = 0.05; // Bono determinante para no sumergir el artículo exacto frente al vector
      }
    }

    // Bono si coincide con el código legal específico solicitado (ej. CPC vs CC)
    let codeBonus = 0;
    if (params.detectedCode && chunk.sourceCode.toLowerCase().includes(params.detectedCode.toLowerCase())) {
      codeBonus = 0.02;
    }

    const totalRrfScore = densePart + sparsePart + exactArticleBonus + codeBonus;

    scoredCandidates.push({
      chunk: {
        ...chunk,
        similarity: Math.min(1.0, totalRrfScore * 30), // Escala normalizada para legibilidad
      },
      score: totalRrfScore,
    });
  }

  // 4. Ordenar descendentemente por score RRF
  scoredCandidates.sort((a, b) => b.score - a.score);

  return scoredCandidates.slice(0, topK).map(sc => sc.chunk);
}

/**
 * Main RAG function — called from chat.ts before each AI response.
 *
 * Returns a formatted string block of verified legal articles to inject
 * into the system prompt, or null if no relevant chunks were found.
 *
 * @param agentId      - the specialist's ID (e.g. 'diego', 'camila')
 * @param userQuery    - the user's latest message
 * @param factsYear    - optional historical year of facts for tempus regit actum
 */
export async function getRagContext(
  agentId: string,
  userQuery: string,
  factsYear?: number | null
): Promise<string | null> {
  // Skip RAG if disabled via env flag
  if (process.env.RAG_ENABLED === 'false') return null;

  // Skip RAG if no DB configured
  if (!process.env.DATABASE_URL) {
    return null;
  }

  // Handle messages with large attached files/expedientes:
  // Isolate the user's actual question if attached to an extracted document
  let queryToEmbed = userQuery.trim();
  if (queryToEmbed.includes('--- FIN DEL DOCUMENTO ---')) {
    const parts = queryToEmbed.split('--- FIN DEL DOCUMENTO ---');
    const userInstruction = parts[parts.length - 1].trim();
    if (userInstruction.length >= 10) {
      queryToEmbed = userInstruction;
    }
  }
  queryToEmbed = queryToEmbed
    .replace(/--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---[\s\S]*?--- FIN DEL DOCUMENTO ---\n\n?/gi, '')
    .trim();

  // If user only uploaded the document without prompt, use the first 1000 chars of document content
  if (queryToEmbed.length < 15) {
    queryToEmbed = userQuery.replace(/\[Documento adjunto:[^\]]*\]/gi, '').slice(0, 1000).trim();
  }

  // Skip short queries that don't need RAG (greetings, simple questions)
  if (queryToEmbed.length < 15) return null;

  try {
    let chunks: LegalChunk[] = [];

    // 1. Si hay clave de Gemini/Google, intentar generar vector semántico
    let queryVector: number[] | null = null;
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    if (hasGeminiKey) {
      try {
        queryVector = await generateEmbedding(queryToEmbed);
      } catch (embErr: any) {
        console.warn('[RAG] Búsqueda vectorial Gemini omitida, usando búsqueda nativa en DB:', embErr?.message);
      }
    }

    // 2. Búsqueda Híbrida RRF (Fusión de Rango Recíproco: Dense Vector + Sparse Text)
    chunks = await hybridSearchRRF(queryToEmbed, agentId, queryVector, TOP_K, factsYear);

    if (chunks.length === 0) return null;

    // 3. Format the chunks as a verified context block
    let contextBlock = `\n\n════════════════════════════════════════\n`;
    contextBlock += ` ARTÍCULOS VERIFICADOS DEL SPIJ — TEXTO OFICIAL DE LA LEY\n`;
    contextBlock += `(Fragmentos recuperados del corpus normativo peruano. Cítalos con exactitud.)\n`;
    contextBlock += `════════════════════════════════════════\n\n`;

    let totalChars = contextBlock.length;

    for (const chunk of chunks) {
      const isHistoricalWarning = chunk.validityStatus === 'repealed' ? '  [NORMA DEROGADA / VIGENCIA HISTÓRICA]' : '';
      const header = ` ${chunk.sourceCode}${chunk.articles ? ` — ${chunk.articles}` : ''}${chunk.section ? ` [${chunk.section}]` : ''}${isHistoricalWarning}\n`;
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
