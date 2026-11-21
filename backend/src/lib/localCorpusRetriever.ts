/**
 * Recuperador local del corpus normativo — HARDMAN
 *
 * Recupera artículos verificados de src/data/legal/*.txt por coincidencia léxica y por número de artículo
 * mencionado en la consulta. No depende de embeddings ni de base de datos: sirve de red de seguridad cuando
 * el RAG vectorial no está disponible y complementa su contexto cuando sí lo está.
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface CorpusArticle {
  source: string;
  number: string; // '384', '38-A'
  title: string;
  text: string;
  tokens: Set<string>;
}

const STOP = new Set(['de','la','el','los','las','y','o','en','a','que','por','para','con','del','al','un','una','se','su','es','no','lo','como','mas','sus','ley','articulo','codigo','art']);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

let cache: CorpusArticle[] | null = null;

function resolveDir(): string | null {
  const candidates = [join(__dirname, '../data/legal'), join(__dirname, '../../src/data/legal'), join(process.cwd(), 'src/data/legal')];
  return candidates.find((d) => existsSync(d)) || null;
}

function load(): CorpusArticle[] {
  if (cache) return cache;
  const out: CorpusArticle[] = [];
  const dir = resolveDir();
  if (dir) {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.txt')) continue;
      let raw = '';
      try {
        raw = readFileSync(join(dir, file), 'utf8');
      } catch {
        continue;
      }
      const source = (raw.split('\n')[0] || file).trim();
      const parts = raw.split(/\n(?=\s*Art[íi]culo\s+\d{1,4}(?:[-–][A-Z])?\s*[º°]?\s*[.\-–])/);
      for (const part of parts) {
        const m = part.match(/^\s*Art[íi]culo\s+(\d{1,4})(?:[-–]([A-Z]))?\s*[º°]?\s*[.\-–]+\s*([^\n]*)\n?([\s\S]*)$/);
        if (!m) continue;
        const text = part.replace(/\n═{5,}[\s\S]*$/, '').trim();
        out.push({
          source,
          number: `${m[1]}${m[2] ? '-' + m[2] : ''}`,
          title: m[3].trim(),
          text,
          tokens: new Set(tokenize(`${m[3]} ${m[4]}`)),
        });
      }
    }
  }
  cache = out;
  return out;
}

export function resetLocalCorpusCache(): void {
  cache = null;
}

export function getLocalCorpusContext(query: string, opts: { maxArticles?: number; maxChars?: number; skipText?: string } = {}): string {
  const maxArticles = opts.maxArticles ?? 6;
  const maxChars = opts.maxChars ?? 7000;
  const q = (query || '').slice(0, 6000);
  const qTokens = new Set(tokenize(q));
  const mentioned = new Set<string>();
  for (const m of q.matchAll(/Art(?:[íi]culos?|s?\.)\s*(\d{1,4})(?:[-–]([A-Z]))?/gi)) {
    mentioned.add(`${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`);
  }
  if (qTokens.size === 0 && mentioned.size === 0) return '';

  const scored = load()
    .map((a) => {
      let overlap = 0;
      qTokens.forEach((t) => {
        if (a.tokens.has(t)) overlap++;
      });
      const score = overlap + (mentioned.has(a.number) ? 6 : 0);
      return { a, score, overlap };
    })
    .filter((x) => x.score >= 3 && (x.overlap >= 3 || mentioned.has(x.a.number)))
    .sort((x, y) => y.score - x.score);

  const skip = opts.skipText || '';
  const lines: string[] = [];
  let total = 0;
  let count = 0;
  for (const { a } of scored) {
    if (count >= maxArticles) break;
    // Evita duplicar un artículo que el RAG ya aportó
    if (skip && new RegExp(`Art[íi]culo\\s+${a.number}\\b`, 'i').test(skip) && skip.includes(a.title.slice(0, 20))) continue;
    const block = `${a.source}\nArtículo ${a.number}.- ${a.title}\n${a.text.replace(/^[^\n]*\n?/, '').trim()}`;
    if (total + block.length > maxChars) break;
    lines.push(block);
    total += block.length;
    count++;
  }
  if (lines.length === 0) return '';
  return (
    '\n\n════════════════════════════════════════\n' +
    'TEXTO NORMATIVO VERIFICADO (CORPUS HARDMAN) — FUENTE TEXTUAL AUTORIZADA\n' +
    'Fundamenta con estos artículos con exactitud; si necesitas otra norma que no figure aquí, indícalo con [VERIFICAR EN SPIJ].\n' +
    '════════════════════════════════════════\n\n' +
    lines.join('\n\n')
  );
}
