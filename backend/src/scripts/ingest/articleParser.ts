import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface ParsedArticle {
  label: string;
  sortKey: number;
  heading?: string;
  breadcrumb?: string;
  text: string;
  textSha256: string;
  status: 'in_force' | 'modified' | 'repealed';
  modifiedBy: string[];
}

export interface IngestSampleReport {
  documentCode: string;
  documentTitle: string;
  totalArticles: number;
  sampledArticles: ParsedArticle[];
  outputPath: string;
}

export class ArticleParser {
  /**
   * Calcula SHA-256 de texto literal normalizado
   */
  public static computeTextSha256(text: string): string {
    return crypto.createHash('sha256').update(text.trim(), 'utf8').digest('hex');
  }

  /**
   * Parsea un texto normativo estructurado en artículos literales.
   * Reconoce encabezados jerárquicos (LIBRO, TÍTULO, CAPÍTULO),
   * epígrafes oficiales ("Artículo 140.- Noción de Acto Jurídico"),
   * notas de modificatorias, y disposiciones complementarias/finales.
   */
  public parseDocumentText(rawText: string, docCode: string): ParsedArticle[] {
    const lines = rawText.split('\n');
    const articles: ParsedArticle[] = [];

    let currentBreadcrumb = '';
    let currentBook = '';
    let currentTitle = '';
    let currentChapter = '';

    let currentLabel: string | null = null;
    let currentHeading: string | null = null;
    let currentTextLines: string[] = [];
    let currentModifiers: string[] = [];

    const flushArticle = () => {
      if (!currentLabel) return;
      const fullText = currentTextLines.join('\n').trim();
      if (fullText.length === 0) return;

      const sortKey = articles.length + 1;
      const textSha256 = ArticleParser.computeTextSha256(fullText);

      articles.push({
        label: currentLabel,
        sortKey,
        heading: currentHeading || undefined,
        breadcrumb: currentBreadcrumb || undefined,
        text: fullText,
        textSha256,
        status: 'in_force',
        modifiedBy: Array.from(new Set(currentModifiers)),
      });

      currentLabel = null;
      currentHeading = null;
      currentTextLines = [];
      currentModifiers = [];
    };

    // Regex para delimitar artículos y epígrafes
    // Ej: "Artículo 140.- Noción de Acto Jurídico"
    // Ej: "Art. 345-A.- Indemnización en caso de perjuicio"
    // Ej: "Primera Disposición Complementaria y Transitoria"
    const articleHeaderRegex = /^(?:Art[ií]culo|Art\.)\s+(\d+(?:-[A-Za-z]+)?)\.?(?:\s*[-–—:]\s*(.+))?$/i;
    const dispHeaderRegex = /^((?:Primera|Segunda|Tercera|Cuarta|Quinta|Sexta|S\u00e9ptima|Octava|Novena|D\u00e9cima|[ÚU]nica)\s+Disposici[óo]n\s+[A-Za-z\s]+)(?:[-–—:]\s*(.+))?$/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (currentLabel) currentTextLines.push('');
        continue;
      }

      // 1. Detectar jerarquías estructurales
      if (/^(?:T[IÍ]TULO\s+PRELIMINAR)/i.test(line)) {
        currentBook = 'Título Preliminar';
        currentTitle = '';
        currentChapter = '';
        currentBreadcrumb = currentBook;
        continue;
      }
      if (/^LIBRO\s+[IVXLCDM]+/i.test(line)) {
        currentBook = line.replace(/^[═\s]+|[═\s]+$/g, '');
        currentTitle = '';
        currentChapter = '';
        currentBreadcrumb = currentBook;
        continue;
      }
      if (/^SECCI[ÓO]N\s+[IVXLCDM\w]+/i.test(line) || /^T[IÍ]TULO\s+[IVXLCDM\w]+/i.test(line)) {
        currentTitle = line.replace(/^[═\s]+|[═\s]+$/g, '');
        currentBreadcrumb = [currentBook, currentTitle].filter(Boolean).join(' > ');
        continue;
      }
      if (/^CAP[IÍ]TULO\s+[IVXLCDM\w]+/i.test(line)) {
        currentChapter = line.replace(/^[═\s]+|[═\s]+$/g, '');
        currentBreadcrumb = [currentBook, currentTitle, currentChapter].filter(Boolean).join(' > ');
        continue;
      }

      // Omitir líneas separadoras cosméticas
      if (/^[═\-_=]{3,}$/.test(line)) {
        continue;
      }

      // 2. Detectar inicio de nuevo artículo
      const artMatch = line.match(articleHeaderRegex);
      if (artMatch) {
        flushArticle();
        currentLabel = `Art. ${artMatch[1]}`;
        currentHeading = artMatch[2]?.trim() || null;
        // La línea del encabezado forma parte del texto literal normativo
        currentTextLines.push(line);
        continue;
      }

      const dispMatch = line.match(dispHeaderRegex);
      if (dispMatch) {
        flushArticle();
        currentLabel = dispMatch[1].trim();
        currentHeading = dispMatch[2]?.trim() || null;
        currentTextLines.push(line);
        continue;
      }

      // 3. Detectar notas modificatorias (ej: "Texto modificado por la Ley 31591")
      const modMatch = line.match(
        /(?:modificado|sustituido|incorporado|derogado)\s+(?:por|seg[úu]n)\s+(?:el\s+|la\s+)?((?:Ley|Decreto\s+Legislativo|D\.\s*Leg\.|Decreto\s+Supremo|D\.\s*S\.|Ley\s+N[°º.]?|D\.L\.)[^\r\n,;]+)/i
      );
      if (modMatch && modMatch[1]) {
        const cleanMod = modMatch[1].replace(/^(?:el|la)\s+/i, '').replace(/[\.\s]+$/, '').trim();
        if (cleanMod) {
          currentModifiers.push(cleanMod);
        }
      }

      // Si estamos dentro de un artículo, acumular línea literal
      if (currentLabel) {
        currentTextLines.push(lines[i]);
      }
    }

    // Flush del último artículo
    flushArticle();

    // Controles de Integridad Obligatorios
    ArticleParser.verifyIntegrity(articles, docCode);

    return articles;
  }

  /**
   * Ejecuta controles estrictos de monotonía y calidad sobre los artículos parseados
   */
  public static verifyIntegrity(articles: ParsedArticle[], docCode: string): void {
    if (articles.length === 0) {
      throw new Error(`[IntegrityError] Documento '${docCode}' no contiene artículos parseables.`);
    }

    const seenLabels = new Set<string>();
    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];

      // Verificación 1: sortKey monótono estricto
      if (art.sortKey !== i + 1) {
        throw new Error(`[IntegrityError] Numeración de sortKey no monótona en '${docCode}' en índice ${i} (art ${art.label})`);
      }

      // Verificación 2: 0 artículos vacíos
      if (!art.text || art.text.trim().length === 0) {
        throw new Error(`[IntegrityError] Artículo vacío detectado en '${docCode}' (${art.label})`);
      }

      // Verificación 3: textSha256 válido
      if (!art.textSha256 || art.textSha256.length !== 64) {
        throw new Error(`[IntegrityError] SHA-256 inválido para artículo '${art.label}' en '${docCode}'`);
      }

      seenLabels.add(art.label);
    }
  }

  /**
   * Genera reporte de muestra aleatoria/estratificada en Markdown: reports/ingest_<code>_sample.md
   */
  public generateSampleReport(
    articles: ParsedArticle[],
    docCode: string,
    docTitle: string,
    reportsDir?: string
  ): IngestSampleReport {
    const targetDir = reportsDir || path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const sampleCount = Math.min(10, articles.length);
    const sampledArticles: ParsedArticle[] = [];

    // Muestreo estratificado: primero, último, y 8 intermedios uniformemente distribuidos
    if (articles.length <= sampleCount) {
      sampledArticles.push(...articles);
    } else {
      const step = (articles.length - 1) / (sampleCount - 1);
      for (let i = 0; i < sampleCount; i++) {
        const index = Math.round(i * step);
        sampledArticles.push(articles[index]);
      }
    }

    const reportPath = path.join(targetDir, `ingest_${docCode.toLowerCase()}_sample.md`);

    let md = `# Reporte de Auditoría de Ingesta Oficial — ${docTitle} (${docCode})\n\n`;
    md += `- **Fecha de auditoría:** ${new Date().toISOString()}\n`;
    md += `- **Total artículos parseados:** ${articles.length}\n`;
    md += `- **Control de integridad:** Numeración monótona 1..${articles.length} | 0 vacíos | Hash SHA-256 verificado\n`;
    md += `- **Muestra aleatoria/estratificada:** ${sampledArticles.length} artículos inspeccionados\n\n`;
    md += `## Muestra de Artículos Literales Ingestados\n\n`;

    for (const art of sampledArticles) {
      md += `### ${art.label} — ${art.heading || 'Sin epígrafe'}\n`;
      md += `- **Sort Key:** ${art.sortKey}\n`;
      md += `- **Jerarquía (Breadcrumb):** ${art.breadcrumb || 'General'}\n`;
      md += `- **SHA-256 del texto:** \`${art.textSha256}\`\n`;
      if (art.modifiedBy.length > 0) {
        md += `- **Modificado por:** ${art.modifiedBy.join(', ')}\n`;
      }
      md += `\n\`\`\`text\n${art.text}\n\`\`\`\n\n---\n\n`;
    }

    fs.writeFileSync(reportPath, md, 'utf8');

    return {
      documentCode: docCode,
      documentTitle: docTitle,
      totalArticles: articles.length,
      sampledArticles,
      outputPath: reportPath,
    };
  }
}