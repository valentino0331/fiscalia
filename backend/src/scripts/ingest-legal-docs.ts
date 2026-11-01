/**
 * Script de Ingestión RAG Reconstruido — HARDMAN
 * 
 * Implementa Chunking Jurídico Estructural:
 * - Segmenta por Artículos, Plenos Casatorios y Acuerdos Plenarios íntegros.
 * - Elimina el corte arbitrario por número de caracteres que mutilaba palabras.
 * - Preserva Título, Libro, Capítulo y Fuente Oficial.
 * - Ingesta los 8 especialistas (incluyendo Fernanda, Adriana y Rodrigo).
 * - Soporta generación con Gemini API o fallback determinista vectorial a 768 dimensiones.
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import 'dotenv/config';
import { generateDocumentEmbedding } from '../lib/ragEngine';
import { JURISPRUDENCE_COMPENDIUM } from '../lib/spijLegalEngine';

const LEGAL_DATA_DIR = join(__dirname, '../data/legal');
const EMBEDDING_DIMENSIONS = 768;

const FILE_METADATA: Record<string, { sourceCode: string; specialistIds: string[] }> = {
  'codigo-civil.txt': {
    sourceCode: 'Código Civil (D.Leg. 295)',
    specialistIds: ['diego', 'camila'],
  },
  'codigo-procesal-civil.txt': {
    sourceCode: 'Código Procesal Civil (TUO RM 010-93-JUS)',
    specialistIds: ['diego', 'camila'],
  },
  'codigo-penal-ncpp.txt': {
    sourceCode: 'Código Penal (D.Leg. 635) y NCPP (D.Leg. 957)',
    specialistIds: ['sebastian'],
  },
  'legislacion-laboral.txt': {
    sourceCode: 'Legislación Laboral (D.S. 003-97-TR, D.Leg. 650, Ley 32155)',
    specialistIds: ['valentina'],
  },
  'lpag-contrataciones.txt': {
    sourceCode: 'TUO LPAG (D.S. 006-2026-JUS) y Ley 32069 (OECE)',
    specialistIds: ['marco'],
  },
  'codigo-tributario.txt': {
    sourceCode: 'Código Tributario (D.S. 133-2013-EF) y SUNAT',
    specialistIds: ['fernanda'],
  },
  'ley-general-sociedades.txt': {
    sourceCode: 'Ley General de Sociedades (Ley 26887) y Ley 30424',
    specialistIds: ['adriana'],
  },
  'legislacion-minera-ambiental.txt': {
    sourceCode: 'TUO Ley General de Minería (D.S. 014-92-EM) y OEFA',
    specialistIds: ['rodrigo'],
  },
};

interface ParsedChunk {
  specialistId: string;
  sourceCode: string;
  section: string | null;
  articles: string | null;
  content: string;
}

/**
 * Genera un vector determinista L2-normalizado de 768 dimensiones cuando no hay clave Gemini
 */
function generateDeterministicVector(text: string): number[] {
  const vec = new Array(EMBEDDING_DIMENSIONS).fill(0);
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const idx = (code * 31 + i * 17) % EMBEDDING_DIMENSIONS;
    vec[idx] += 1.0;
  }
  const norm = Math.sqrt(vec.reduce((acc, v) => acc + v * v, 0)) || 1.0;
  return vec.map((v) => v / norm);
}

/**
 * Chunking Jurídico Estructural por Artículos y Delimitadores Normativos
 */
function chunkLegalDocument(text: string, sourceCode: string, specialistId: string): ParsedChunk[] {
  const chunks: ParsedChunk[] = [];
  const lines = text.split('\n');

  let currentSection = 'Parte General';
  let currentArticleRef: string | null = null;
  let currentBuffer: string[] = [];

  const flushBuffer = () => {
    const rawContent = currentBuffer.join('\n').trim();
    if (rawContent.length > 40) {
      chunks.push({
        specialistId,
        sourceCode,
        section: currentSection,
        articles: currentArticleRef,
        content: rawContent,
      });
    }
    currentBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Detección de secciones mayores (Libro, Título, Capítulo, Pleno)
    if (trimmed.startsWith('════') || /^(?:LIBRO|T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N)\s+[A-Z0-9IVXLCDM\s—-]+$/i.test(trimmed)) {
      if (!trimmed.startsWith('════')) {
        currentSection = trimmed;
      }
      continue;
    }

    // Detección de inicio de Artículo o Sentencia / Precedente
    const articleMatch = trimmed.match(/^(?:Art[íi]culo|Art\.)\s*([\d°\-–A-Za-z]+)\.?\s*[-—–]?\s*([^\n]*)/i);
    const jurisprudenciaMatch = trimmed.match(/^(?:Sentencia|Casaci[óo]n|Acuerdo\s+Plenario|STC)\s*[^—\n]+/i);

    if (articleMatch || jurisprudenciaMatch) {
      flushBuffer();
      currentArticleRef = articleMatch
        ? `Artículo ${articleMatch[1]}`
        : jurisprudenciaMatch![0].trim();
      currentBuffer.push(line);
    } else {
      currentBuffer.push(line);
      // Si el buffer de un artículo es excesivamente extenso (> 2800 chars), partir por párrafo limpio
      if (currentBuffer.join('\n').length > 2800 && trimmed === '') {
        flushBuffer();
        if (currentArticleRef) {
          currentBuffer.push(`[${currentArticleRef} - Continuación]`);
        }
      }
    }
  }

  flushBuffer();
  return chunks;
}

async function main() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('HARDMAN RAG — RECONSTRUCCIÓN E INGESTIÓN JURÍDICA ESTRUCTURAL');
  console.log('════════════════════════════════════════════════════════════════\n');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no encontrada en el entorno.');
  }

  const sql = neon(process.env.DATABASE_URL);
  const isForce = process.argv.includes('--force');

  console.log('[1/4] Verificando tabla legal_chunks y extensión pgvector...');
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;
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
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_chunks_specialist ON legal_chunks(specialist_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_legal_chunks_source ON legal_chunks(source_code)`;

  if (isForce) {
    console.log('[1/4] Modo --force: Limpiando tabla legal_chunks...');
    await sql`DELETE FROM legal_chunks`;
  }

  const files = readdirSync(LEGAL_DATA_DIR).filter((f) => f.endsWith('.txt'));
  console.log(`[2/4] Archivos normativos detectados: ${files.length}`);

  const allChunks: ParsedChunk[] = [];

  for (const filename of files) {
    const meta = FILE_METADATA[filename];
    if (!meta) {
      console.warn(`  ⚠️ Saltando archivo sin metadatos: ${filename}`);
      continue;
    }
    const filePath = join(LEGAL_DATA_DIR, filename);
    const content = readFileSync(filePath, 'utf-8');

    for (const specialistId of meta.specialistIds) {
      const chunks = chunkLegalDocument(content, meta.sourceCode, specialistId);
      allChunks.push(...chunks);
      console.log(`  📄 ${filename} → ${chunks.length} chunks estructurados para '${specialistId}'`);
    }
  }

  // 3. Ingestión de Precedentes Jurisprudenciales Vinculantes de la Corte Suprema
  console.log(`\n[3/4] Indexando precedentes jurisprudenciales vinculantes (Corte Suprema)...`);
  for (const p of JURISPRUDENCE_COMPENDIUM) {
    const content = `${p.code} — ${p.title}\nÓrgano: ${p.court}\nCategoría: ${p.category}\nFundamento Vinculante: ${p.bindingGrounds}\nPrincipios: ${p.keyPrinciples.join('; ')}\nAplicación Procesal: ${p.legalApplication}`;
    allChunks.push({
      specialistId: p.specialistId,
      sourceCode: p.court,
      section: 'Jurisprudencia Vinculante',
      articles: p.code,
      content,
    });
  }

  console.log(`\n[4/4] Total de chunks jurídicos a almacenar: ${allChunks.length}`);

  let insertedCount = 0;
  const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    let vector: number[];

    if (hasGemini) {
      try {
        vector = await generateDocumentEmbedding(chunk.content);
      } catch {
        vector = generateDeterministicVector(chunk.content);
      }
    } else {
      vector = generateDeterministicVector(chunk.content);
    }

    const vectorStr = `[${vector.join(',')}]`;
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
    insertedCount++;
    if (insertedCount % 20 === 0 || insertedCount === allChunks.length) {
      process.stdout.write(`  → Progreso: ${insertedCount}/${allChunks.length} chunks almacenados\r`);
    }
  }

  console.log(`\n\n✅ Ingestión completada exitosamente: ${insertedCount} chunks jurídicos en Neon PostgreSQL.`);
}

main().catch(console.error);
