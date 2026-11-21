/**
 * Statutory Grounding Audit — HARDMAN
 *
 * Auditor determinista de citas normativas (leyes, decretos y artículos de códigos).
 *
 * Problema que resuelve: el validador de citas solo contrasta casaciones, acuerdos
 * plenarios y límites de numeración de artículos. Una "Ley N° 31999" inventada, un
 * "D.Leg. 1950" inexistente o un artículo penal citado de memoria pasaban en silencio.
 *
 * Principio: NO se reescribe el texto del modelo (evita falsos positivos que corrompan
 * escritos reales). Se clasifica cada cita en:
 *   - IMPOSSIBLE  : numeración que no puede existir (fuera del rango histórico) → se avisa como inexistente.
 *   - GROUNDED    : consta en el corpus verificado, en el bloque de grounding de esta consulta
 *                   o en los compendios internos → no se avisa.
 *   - UNCONTRASTED: plausible pero no consta en ninguna fuente verificada → se avisa para
 *                   que el abogado la confirme en SPIJ antes de presentarla.
 * El resultado es una nota anexable al final (compatible con streaming, que solo admite append).
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { SYSTEM_PROMPTS } from '../prompts/agents';
import { JURISPRUDENCE_COMPENDIUM, NORMATIVE_REFORMS_COMPENDIUM } from '../lib/spijLegalEngine';
import { STATUTORY_CODE_BOUNDARIES } from './legalSourceRegistry';

// Techos holgados de numeración (año 2026). Por encima de ellos la norma no puede existir.
export const MAX_PLAUSIBLE_LEY = 33000;
export const MAX_PLAUSIBLE_DLEG = 1800;
const MIN_PLAUSIBLE_YEAR = 1900;
const MAX_PLAUSIBLE_YEAR = 2026;

export type NormKind = 'ley' | 'dleg' | 'ds' | 'articulo';
export type AuditStatus = 'GROUNDED' | 'UNCONTRASTED' | 'IMPOSSIBLE';

export interface AuditedReference {
  kind: NormKind;
  raw: string;
  key: string;
  status: AuditStatus;
  reason?: string;
}

export interface StatutoryAuditReport {
  references: AuditedReference[];
  impossible: AuditedReference[];
  uncontrasted: AuditedReference[];
  /** Nota en Markdown para anexar al final de la respuesta ('' si no hay nada que advertir). */
  note: string;
}

// ─── Regex de extracción ──────────────────────────────────────────────────────

const LEY_RE = /\bLey\s*(?:N[°º.]?\s*|Nro\.?\s*)?(\d{1,2}[.,]?\d{3})(?![\d-])/gi;
const DLEG_RE = /\b(?:D\.?\s*Leg\.?|Decreto\s+Legislativo)\s*(?:N[°º.]?\s*|Nro\.?\s*)?(\d{2,4})(?![\d-])/gi;
const DS_RE = /\b(?:D\.?\s*S\.?|Decreto\s+Supremo)\s*(?:N[°º.]?\s*|Nro\.?\s*)?(\d{1,4})[-–](\d{4})[-–]([A-Z]{2,8})\b/gi;
const ART_CODE_RE = /\bArt(?:[íi]culos?|s?\.)\s*(\d{1,4})(?:[-–]([A-Z]))?\s*[º°]?(?:\s*,?\s*(?:inciso|inc\.|numeral|literal|apartado|p[áa]rrafo)\s*[\w.)(]+)*\s*(?:del|de\s+la|del\s+TUO\s+del?)\s*(?:Nuevo\s+)?(C[óo]digo\s+Penal|C[óo]digo\s+Procesal\s+Penal|C[óo]digo\s+Procesal\s+Civil|C[óo]digo\s+Civil|C[óo]digo\s+Tributario|C[óo]digo\s+Procesal\s+Constitucional|NCPP|CPP|CPC|C\.P\.C\.|C\.P\.|C\.C\.|CP|CC|Constituci[óo]n(?:\s+Pol[íi]tica)?|Ley\s+General\s+de\s+Sociedades|LGS|LPAG|NLPT)\b/gi;

type CodeFamily = 'penal' | 'procesal_penal' | 'civil' | 'procesal_civil' | 'tributario' | 'constitucion' | 'lgs' | 'lpag' | 'nlpt' | 'procesal_constitucional';

function codeFamily(mention: string): CodeFamily | null {
  const m = mention.toLowerCase().replace(/\s+/g, ' ');
  if (/^(c[óo]digo penal|cp|c\.p\.)$/.test(m)) return 'penal';
  if (/procesal penal|^ncpp$|^cpp$/.test(m)) return 'procesal_penal';
  if (/procesal civil|^cpc$|c\.p\.c\./.test(m)) return 'procesal_civil';
  if (/procesal constitucional/.test(m)) return 'procesal_constitucional';
  if (/^(c[óo]digo civil|cc|c\.c\.)$/.test(m)) return 'civil';
  if (/tributario/.test(m)) return 'tributario';
  if (/constituci/.test(m)) return 'constitucion';
  if (/sociedades|^lgs$/.test(m)) return 'lgs';
  if (/^lpag$/.test(m)) return 'lpag';
  if (/^nlpt$/.test(m)) return 'nlpt';
  return null;
}

// Cada código con límite oficial conocido (reutiliza STATUTORY_CODE_BOUNDARIES para no duplicar datos).
function familyMaxArticle(family: CodeFamily): number | null {
  const wanted: Record<CodeFamily, RegExp> = {
    penal: /^código penal$/i,
    procesal_penal: /procesal penal/i,
    civil: /^código civil$/i,
    procesal_civil: /procesal civil/i,
    tributario: /tributario/i,
    constitucion: /constituci/i,
    lgs: /sociedades/i,
    lpag: /procedimiento administrativo/i,
    nlpt: /procesal del trabajo/i,
    procesal_constitucional: /procesal constitucional/i,
  };
  const b = STATUTORY_CODE_BOUNDARIES.find((x) => wanted[family].test(x.name));
  return b ? b.maxArticle : null;
}

// ─── Índice del corpus verificado ─────────────────────────────────────────────

interface CorpusIndex {
  /** Números de norma (ley/dleg/ds) que constan en fuentes internas verificadas. */
  knownNorms: Set<string>;
  /** Artículos que constan en el corpus, por código. */
  articlesByFamily: Map<CodeFamily, Set<string>>;
}

let cachedIndex: CorpusIndex | null = null;

const CORPUS_FILE_FAMILIES: Record<string, CodeFamily[]> = {
  'codigo-penal-ncpp.txt': ['penal', 'procesal_penal'],
  'codigo-civil.txt': ['civil'],
  'codigo-procesal-civil.txt': ['procesal_civil'],
  'codigo-tributario.txt': ['tributario'],
  'ley-general-sociedades.txt': ['lgs'],
  'lpag-contrataciones.txt': ['lpag'],
  'legislacion-laboral.txt': ['nlpt'],
};

function normKey(kind: NormKind, ...parts: string[]): string {
  return `${kind}:${parts.join('-').toLowerCase().replace(/[.,\s]/g, '')}`;
}

function collectNorms(text: string, into: Set<string>): void {
  for (const m of text.matchAll(LEY_RE)) into.add(normKey('ley', m[1]));
  for (const m of text.matchAll(DLEG_RE)) into.add(normKey('dleg', m[1]));
  for (const m of text.matchAll(DS_RE)) into.add(normKey('ds', m[1], m[2], m[3]));
}

function resolveCorpusDir(): string | null {
  const candidates = [
    join(__dirname, '../data/legal'),
    join(__dirname, '../../src/data/legal'),
    join(process.cwd(), 'src/data/legal'),
  ];
  return candidates.find((d) => existsSync(d)) || null;
}

function buildIndex(): CorpusIndex {
  const knownNorms = new Set<string>();
  const articlesByFamily = new Map<CodeFamily, Set<string>>();

  const dir = resolveCorpusDir();
  if (dir) {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.txt')) continue;
      let text = '';
      try {
        text = readFileSync(join(dir, file), 'utf8');
      } catch {
        continue;
      }
      collectNorms(text, knownNorms);
      const families = CORPUS_FILE_FAMILIES[file] || [];
      const arts = new Set<string>();
      for (const m of text.matchAll(/^\s*Art[íi]culo\s+(\d{1,4})(?:[-–]([A-Z]))?\s*[º°]?\s*[.\-–]/gim)) {
        arts.add(`${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`);
      }
      for (const fam of families) {
        const set = articlesByFamily.get(fam) || new Set<string>();
        arts.forEach((a) => set.add(a));
        articlesByFamily.set(fam, set);
      }
    }
  }

  // Compendios internos de normas y jurisprudencia (curados por el equipo).
  try {
    collectNorms(JSON.stringify(NORMATIVE_REFORMS_COMPENDIUM), knownNorms);
    collectNorms(JSON.stringify(JURISPRUDENCE_COMPENDIUM), knownNorms);
  } catch {
    /* compendios no disponibles: se degrada a corpus + grounding */
  }
  // Prompts de los especialistas (curados por el equipo; no se usan para artículos).
  try {
    for (const p of Object.values(SYSTEM_PROMPTS)) collectNorms(String(p), knownNorms);
  } catch {
    /* ignore */
  }

  return { knownNorms, articlesByFamily };
}

function getIndex(): CorpusIndex {
  if (!cachedIndex) cachedIndex = buildIndex();
  return cachedIndex;
}

/** Solo para pruebas. */
export function resetStatutoryAuditCache(): void {
  cachedIndex = null;
}

// ─── Auditoría ────────────────────────────────────────────────────────────────

function dedupe(refs: AuditedReference[]): AuditedReference[] {
  const seen = new Set<string>();
  return refs.filter((r) => {
    if (seen.has(r.key)) return false;
    seen.add(r.key);
    return true;
  });
}

function stripCodeBlocks(text: string): string {
  // No se audita lo que está dentro de bloques de código ni el propio aviso de rigor ya anexado.
  return text.replace(/```[\s\S]*?```/g, ' ');
}

export function auditStatutoryReferences(text: string, groundingText?: string | null): StatutoryAuditReport {
  const empty: StatutoryAuditReport = { references: [], impossible: [], uncontrasted: [], note: '' };
  if (!text || typeof text !== 'string') return empty;

  const index = getIndex();
  const grounding = groundingText || '';
  const groundingNorms = new Set<string>();
  collectNorms(grounding, groundingNorms);
  const body = stripCodeBlocks(text);
  const refs: AuditedReference[] = [];

  const isKnownNorm = (key: string) => index.knownNorms.has(key) || groundingNorms.has(key);

  for (const m of body.matchAll(LEY_RE)) {
    const num = parseInt(m[1].replace(/[.,]/g, ''), 10);
    const key = normKey('ley', m[1]);
    const raw = m[0].trim();
    if (num > MAX_PLAUSIBLE_LEY || num < 1) {
      refs.push({ kind: 'ley', raw, key, status: 'IMPOSSIBLE', reason: `la numeración de leyes peruanas no llega a ${num}` });
    } else {
      refs.push({ kind: 'ley', raw, key, status: isKnownNorm(key) ? 'GROUNDED' : 'UNCONTRASTED' });
    }
  }

  for (const m of body.matchAll(DLEG_RE)) {
    const num = parseInt(m[1], 10);
    const key = normKey('dleg', m[1]);
    const raw = m[0].trim();
    if (num > MAX_PLAUSIBLE_DLEG || num < 1) {
      refs.push({ kind: 'dleg', raw, key, status: 'IMPOSSIBLE', reason: `no existe un Decreto Legislativo con numeración ${num}` });
    } else {
      refs.push({ kind: 'dleg', raw, key, status: isKnownNorm(key) ? 'GROUNDED' : 'UNCONTRASTED' });
    }
  }

  for (const m of body.matchAll(DS_RE)) {
    const year = parseInt(m[2], 10);
    const key = normKey('ds', m[1], m[2], m[3]);
    const raw = m[0].trim();
    if (year < MIN_PLAUSIBLE_YEAR || year > MAX_PLAUSIBLE_YEAR) {
      refs.push({ kind: 'ds', raw, key, status: 'IMPOSSIBLE', reason: `año ${year} fuera de rango` });
    } else {
      refs.push({ kind: 'ds', raw, key, status: isKnownNorm(key) ? 'GROUNDED' : 'UNCONTRASTED' });
    }
  }

  for (const m of body.matchAll(ART_CODE_RE)) {
    const family = codeFamily(m[3]);
    if (!family) continue;
    const art = `${m[1]}${m[2] ? '-' + m[2].toUpperCase() : ''}`;
    const num = parseInt(m[1], 10);
    const raw = m[0].trim().replace(/\s+/g, ' ');
    const key = `articulo:${family}:${art}`;
    const max = familyMaxArticle(family);

    // Los límites duros ya los aplica legalCitationValidator; aquí solo se registran como imposibles
    // si no llevan sufijo (los -A/-B legítimos existen por encima del último artículo base).
    if (max !== null && !m[2] && num > max) {
      refs.push({ kind: 'articulo', raw, key, status: 'IMPOSSIBLE', reason: `el código solo tiene ${max} artículos` });
      continue;
    }
    const inCorpus = index.articlesByFamily.get(family)?.has(art) ?? false;
    const inGrounding = new RegExp(`Art[íi]culo\\s+${m[1]}${m[2] ? '[-–]' + m[2] : ''}\\b`, 'i').test(grounding);
    refs.push({ kind: 'articulo', raw, key, status: inCorpus || inGrounding ? 'GROUNDED' : 'UNCONTRASTED' });
  }

  const references = dedupe(refs);
  const impossible = references.filter((r) => r.status === 'IMPOSSIBLE');
  const uncontrasted = references.filter((r) => r.status === 'UNCONTRASTED');

  if (impossible.length === 0 && uncontrasted.length === 0) {
    return { references, impossible, uncontrasted, note: '' };
  }

  const MAX_LISTED = 15;
  const lines: string[] = ['', '', '> **CONTROL DE FUENTES NORMATIVAS (ESTÁNDAR HARDMAN):**'];
  if (impossible.length > 0) {
    lines.push('> **Referencias con numeración inexistente — NO las use:**');
    impossible.slice(0, MAX_LISTED).forEach((r) => lines.push(`> • ${r.raw} (${r.reason})`));
  }
  if (uncontrasted.length > 0) {
    lines.push('> **No constan en el corpus verificado de Hardman (provienen del conocimiento general del modelo). Confirme número, vigencia y texto en SPIJ antes de presentarlas:**');
    uncontrasted.slice(0, MAX_LISTED).forEach((r) => lines.push(`> • ${r.raw}`));
    if (uncontrasted.length > MAX_LISTED) {
      lines.push(`> • … y ${uncontrasted.length - MAX_LISTED} referencia(s) más.`);
    }
  }
  lines.push('');

  return { references, impossible, uncontrasted, note: lines.join('\n') };
}
