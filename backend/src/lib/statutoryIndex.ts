import { neon } from '@neondatabase/serverless';
import {
  STATUTORY_CODE_BOUNDARIES,
  StatutoryCodeBoundary,
  normalizeLegalText,
} from '../ai/legalSourceRegistry';

export interface StatutoryValidationResult {
  isValid: boolean;
  codeBoundary?: StatutoryCodeBoundary;
  reason?: string;
  source: 'database' | 'memory_fallback';
}

interface CachedDocBoundary {
  code: string;
  name: string;
  officialEnactment: string;
  maxArticle: number;
  validLabels: Set<string>;
  aliases: string[];
}

export class StatutoryIndex {
  private static cache: Map<string, CachedDocBoundary> = new Map();
  private static isInitialized = false;
  private static isInitializing = false;

  /**
   * Inicializa la caché en memoria consultando las tablas `legal_documents` y `legal_articles`
   */
  public static async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (!process.env.DATABASE_URL) {
        this.isInitialized = true;
        this.isInitializing = false;
        return;
      }

      const sql = neon(process.env.DATABASE_URL);
      const rows = await sql`
        SELECT 
          d.code,
          d.title,
          d.official_number,
          COUNT(a.id)::int as total_articles,
          MAX(a.sort_key)::int as max_sort_key,
          array_agg(a.label) as labels
        FROM legal_documents d
        JOIN legal_articles a ON a.document_id = d.id
        GROUP BY d.code, d.title, d.official_number;
      `;

      for (const row of rows) {
        const matchingBoundary = STATUTORY_CODE_BOUNDARIES.find(
          b => b.id.toUpperCase() === row.code.toUpperCase()
        );

        const labelsSet = new Set<string>();
        if (Array.isArray(row.labels)) {
          for (const l of row.labels) labelsSet.add(String(l).trim());
        }

        const aliases = matchingBoundary ? matchingBoundary.aliases : [row.code.toLowerCase(), row.title.toLowerCase()];

        this.cache.set(row.code.toUpperCase(), {
          code: row.code,
          name: row.title,
          officialEnactment: row.official_number || matchingBoundary?.officialEnactment || row.code,
          maxArticle: row.max_sort_key || row.total_articles,
          validLabels: labelsSet,
          aliases,
        });
      }
      this.isInitialized = true;
    } catch (err: any) {
      console.warn('[StatutoryIndex] No se pudo inicializar desde base de datos, usando respaldo offline:', err.message);
      this.isInitialized = true;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Valida la existencia jurídica de un artículo y su sufijo en el ordenamiento legal
   */
  public static validateArticle(
    articleNum: number,
    codeMention: string,
    articleSuffix?: string
  ): StatutoryValidationResult {
    const normMention = normalizeLegalText(codeMention).replace(/\s+/g, ' ').trim();
    const rawClean = normMention.replace(/[^a-z0-9]/g, '');

    // 1. Buscar en caché dinámica de base de datos
    for (const [code, cached] of this.cache.entries()) {
      const match = cached.aliases.some(alias => {
        const normAlias = normalizeLegalText(alias);
        const aliasClean = normAlias.replace(/[^a-z0-9]/g, '');
        return normMention === normAlias || rawClean === aliasClean || (normAlias.length > 4 && (normMention.includes(normAlias) || normAlias.includes(normMention)));
      });

      if (match) {
        const labelToCheck = articleSuffix ? `Art. ${articleNum}-${articleSuffix.toUpperCase().trim()}` : `Art. ${articleNum}`;

        // Si tenemos artículos indexados en base de datos para esta norma
        if (cached.validLabels.size > 0) {
          const boundary: StatutoryCodeBoundary = {
            id: cached.code,
            name: cached.name,
            maxArticle: cached.maxArticle,
            officialEnactment: cached.officialEnactment,
            aliases: cached.aliases,
          };

          if (articleNum > cached.maxArticle) {
            return {
              isValid: false,
              codeBoundary: boundary,
              source: 'database',
              reason: `El ${cached.name} (${cached.officialEnactment}) cuenta con un límite normativo de ${cached.maxArticle} artículos. El artículo ${articleNum} es jurídicamente inexistente en el ordenamiento nacional.`,
            };
          }

          if (articleSuffix && !cached.validLabels.has(labelToCheck)) {
            return {
              isValid: false,
              codeBoundary: boundary,
              source: 'database',
              reason: `El ${cached.name} (${cached.officialEnactment}) no contempla el ${labelToCheck}. Dicha subdivisión es jurídicamente inexistente en la base normativa oficial.`,
            };
          }

          return { isValid: true, codeBoundary: boundary, source: 'database' };
        }
      }
    }

    // 2. Respaldo determinista en memoria (para modo offline o tests)
    let matchedBoundary = STATUTORY_CODE_BOUNDARIES.find(b =>
      b.aliases.some(alias => {
        const normAlias = normalizeLegalText(alias);
        const aliasClean = normAlias.replace(/[^a-z0-9]/g, '');
        return normMention === normAlias || rawClean === aliasClean;
      })
    );

    if (!matchedBoundary) {
      matchedBoundary = STATUTORY_CODE_BOUNDARIES.find(b =>
        b.aliases.some(alias => {
          const normAlias = normalizeLegalText(alias);
          return normAlias.length > 4 && (normMention.includes(normAlias) || normAlias.includes(normMention));
        })
      );
    }

    if (!matchedBoundary) {
      return { isValid: true, source: 'memory_fallback' };
    }

    if (articleNum > matchedBoundary.maxArticle) {
      return {
        isValid: false,
        codeBoundary: matchedBoundary,
        source: 'memory_fallback',
        reason: `El ${matchedBoundary.name} (${matchedBoundary.officialEnactment}) cuenta únicamente con ${matchedBoundary.maxArticle} artículos. El artículo ${articleNum} es jurídicamente inexistente en el ordenamiento nacional.`,
      };
    }

    if (articleSuffix) {
      const cleanSuffix = articleSuffix.toUpperCase().trim();
      if (matchedBoundary.id === 'NCPP') {
        const allowedNcppSuffixes = new Set(['476-A', '481-A']);
        const combined = `${articleNum}-${cleanSuffix}`;
        if (!allowedNcppSuffixes.has(combined)) {
          return {
            isValid: false,
            codeBoundary: matchedBoundary,
            source: 'memory_fallback',
            reason: `El ${matchedBoundary.name} (${matchedBoundary.officialEnactment}) no contempla el Artículo ${articleNum}-${cleanSuffix}. Los Artículos 326 al 328 regulan la denuncia penal sin subdivisiones literales. Dicha disposición es jurídicamente inexistente en el ordenamiento procesal penal peruano.`,
          };
        }
      }

      if (matchedBoundary.id === 'CC') {
        const allowedCcSuffixes = new Set(['345-A', '667-A', '921-A', '2014-A']);
        const combined = `${articleNum}-${cleanSuffix}`;
        if (!allowedCcSuffixes.has(combined) && articleNum < 1000) {
          return {
            isValid: false,
            codeBoundary: matchedBoundary,
            source: 'memory_fallback',
            reason: `El Código Civil (D. Leg. 295) no contempla el Artículo ${articleNum}-${cleanSuffix}. Dicha disposición es jurídicamente inexistente en el ordenamiento civil peruano.`,
          };
        }
      }
    }

    return { isValid: true, codeBoundary: matchedBoundary, source: 'memory_fallback' };
  }
}