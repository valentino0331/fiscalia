import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import { OfficialDownloader } from './downloader';
import { ArticleParser, ParsedArticle } from './articleParser';

export interface DocumentIngestConfig {
  code: string;
  title: string;
  kind: 'constitucion' | 'codigo' | 'ley' | 'decreto_supremo' | 'decreto_legislativo';
  issuer: string;
  officialNumber: string;
  sourceUrl: string;
  sourceFormat: 'pdf' | 'html' | 'text';
  consolidatedAsOf: string;
  localSourcePath?: string;
  specialistId: string;
}

export const P0_DOCUMENTS: DocumentIngestConfig[] = [
  {
    code: 'CONST',
    title: 'Constitución Política del Perú',
    kind: 'constitucion',
    issuer: 'Congreso Constituyente Democrático',
    officialNumber: 'Constitución Política de 1993',
    sourceUrl: 'https://leyes.congreso.gob.pe/Documentos/constituciones_ordenado/CONSTIT_1993/Texto_actualizado_CONS_1993.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-03-01',
    localSourcePath: 'src/data/legal/codigo-civil.txt', // o .cache/raw
    specialistId: 'all',
  },
  {
    code: 'CC',
    title: 'Código Civil del Perú',
    kind: 'codigo',
    issuer: 'Poder Ejecutivo',
    officialNumber: 'Decreto Legislativo N° 295',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2018/08/Codigo-Civil.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-02-01',
    localSourcePath: 'src/data/legal/codigo-civil.txt',
    specialistId: 'diego',
  },
  {
    code: 'CPC',
    title: 'Código Procesal Civil del Perú',
    kind: 'codigo',
    issuer: 'Ministerio de Justicia y Derechos Humanos',
    officialNumber: 'Resolución Ministerial N° 010-93-JUS (TUO D. Leg. 768)',
    sourceUrl: 'https://www.pj.gob.pe/wps/wcm/connect/.../CODIGO+PROCESAL+CIVIL.pdf',
    sourceFormat: 'text',
    consolidatedAsOf: '2026-03-01',
    localSourcePath: 'src/data/legal/codigo-procesal-civil.txt',
    specialistId: 'diego',
  },
  {
    code: 'CP',
    title: 'Código Penal del Perú',
    kind: 'codigo',
    issuer: 'Poder Ejecutivo',
    officialNumber: 'Decreto Legislativo N° 635',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2018/08/CODIGOPENAL.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/codigo-penal-ncpp.txt',
    specialistId: 'sebastian',
  },
  {
    code: 'NCPP',
    title: 'Nuevo Código Procesal Penal',
    kind: 'codigo',
    issuer: 'Poder Ejecutivo',
    officialNumber: 'Decreto Legislativo N° 957',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2025/01/CODIGO_PROCESAL_PENAL-DECRETO-LEGISLATIVO.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/codigo-penal-ncpp.txt',
    specialistId: 'sebastian',
  },
  {
    code: 'LPCL',
    title: 'Texto Único Ordenado de la Ley de Productividad y Competitividad Laboral',
    kind: 'decreto_supremo',
    issuer: 'Ministerio de Trabajo y Promoción del Empleo',
    officialNumber: 'Decreto Supremo N° 003-97-TR (TUO D. Leg. 728)',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2021/04/DECRETO_SUPREMO_003-97-TR.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/legislacion-laboral.txt',
    specialistId: 'fernanda',
  },
  {
    code: 'NLPT',
    title: 'Nueva Ley Procesal del Trabajo',
    kind: 'ley',
    issuer: 'Congreso de la República',
    officialNumber: 'Ley N° 29497',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2024/03/LEY_29497.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-01-24',
    localSourcePath: 'src/data/legal/legislacion-laboral.txt',
    specialistId: 'fernanda',
  },
  {
    code: 'CT',
    title: 'Texto Único Ordenado del Código Tributario',
    kind: 'decreto_supremo',
    issuer: 'Ministerio de Economía y Finanzas',
    officialNumber: 'Decreto Supremo N° 133-2013-EF',
    sourceUrl: 'https://www.sunat.gob.pe/legislacion/tributaria/codigo/index.html',
    sourceFormat: 'html',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/codigo-tributario.txt',
    specialistId: 'rodrigo',
  },
  {
    code: 'LGS',
    title: 'Ley General de Sociedades',
    kind: 'ley',
    issuer: 'Congreso de la República',
    officialNumber: 'Ley N° 26887',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2021/05/LEY_26887.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/ley-general-sociedades.txt',
    specialistId: 'rodrigo',
  },
  {
    code: 'LPAG',
    title: 'Texto Único Ordenado de la Ley del Procedimiento Administrativo General',
    kind: 'decreto_supremo',
    issuer: 'Ministerio de Justicia y Derechos Humanos',
    officialNumber: 'Decreto Supremo N° 006-2026-JUS (TUO Ley 27444)',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2026/07/TUO-LEY-27444-Ley-Procedimiento-Administrativo-General-JULIO-2026-ok.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-04-30',
    localSourcePath: 'src/data/legal/lpag-contrataciones.txt',
    specialistId: 'marco',
  },
  {
    code: 'LGCP',
    title: 'Ley General de Contrataciones Públicas y su Reglamento',
    kind: 'ley',
    issuer: 'Congreso de la República / MEF',
    officialNumber: 'Ley N° 32069 y D.S. N° 009-2025-EF',
    sourceUrl: 'https://busquedas.elperuano.pe/dispositivo/NL/ley-32069',
    sourceFormat: 'html',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/lpag-contrataciones.txt',
    specialistId: 'marco',
  },
  {
    code: 'CNA',
    title: 'Código de los Niños y Adolescentes',
    kind: 'ley',
    issuer: 'Congreso de la República',
    officialNumber: 'Ley N° 27337',
    sourceUrl: 'https://spijweb.minjus.gob.pe/normas-basicas/cna',
    sourceFormat: 'text',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/codigo-civil.txt',
    specialistId: 'camila',
  },
  {
    code: 'L30364',
    title: 'Ley para prevenir, sancionar y erradicar la violencia contra las mujeres y los integrantes del grupo familiar',
    kind: 'ley',
    issuer: 'Congreso de la República',
    officialNumber: 'Ley N° 30364',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2021/04/Primera_Edicion_Oficial_Mujeres.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/codigo-civil.txt',
    specialistId: 'camila',
  },
  {
    code: 'LGM',
    title: 'Texto Único Ordenado de la Ley General de Minería',
    kind: 'decreto_supremo',
    issuer: 'Ministerio de Energía y Minas',
    officialNumber: 'Decreto Supremo N° 014-92-EM',
    sourceUrl: 'https://spijweb.minjus.gob.pe/normas-basicas/lgm',
    sourceFormat: 'text',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/legislacion-minera-ambiental.txt',
    specialistId: 'rodrigo',
  },
  {
    code: 'LPCA',
    title: 'Texto Único Ordenado de la Ley que Regula el Proceso Contencioso Administrativo',
    kind: 'decreto_supremo',
    issuer: 'Ministerio de Justicia y Derechos Humanos',
    officialNumber: 'Decreto Supremo N° 011-2019-JUS (TUO Ley 27584)',
    sourceUrl: 'https://spijweb.minjus.gob.pe/wp-content/uploads/2020/08/DECRETO_SUPREMO_011-2019-JUS.pdf',
    sourceFormat: 'pdf',
    consolidatedAsOf: '2026-01-01',
    localSourcePath: 'src/data/legal/lpag-contrataciones.txt',
    specialistId: 'marco',
  },
];

export class IngestPipeline {
  private parser: ArticleParser;
  private reportsDir: string;

  constructor(reportsDir?: string) {
    this.parser = new ArticleParser();
    this.reportsDir = reportsDir || path.resolve(process.cwd(), 'reports');
  }

  public async run(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está definida. La ingesta oficial requiere conexión a Neon Postgres.');
    }

    const sql = neon(process.env.DATABASE_URL);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('HARDMAN — PIPELINE DE INGESTA OFICIAL P0 (FASE 1)');
    console.log('═══════════════════════════════════════════════════════════════');

    let totalDocsIngested = 0;
    let totalArticlesIngested = 0;

    for (const docConfig of P0_DOCUMENTS) {
      console.log(`\n--- Procesando: ${docConfig.code} (${docConfig.title}) ---`);

      // 1. Resolver archivo fuente local
      const resolvedPath = path.resolve(process.cwd(), docConfig.localSourcePath || '');
      if (!fs.existsSync(resolvedPath)) {
        console.warn(`[IngestPipeline] Archivo fuente no encontrado para '${docConfig.code}' en: ${resolvedPath}. Omitiendo.`);
        continue;
      }

      const fileBuffer = fs.readFileSync(resolvedPath);
      const fileSha256 = OfficialDownloader.computeSha256(fileBuffer);
      const rawText = fileBuffer.toString('utf8');

      // 2. Parsear a artículos literales y ejecutar verificaciones de monotonía
      const parsedArticles = this.parser.parseDocumentText(rawText, docConfig.code);
      console.log(`✓ Parseados ${parsedArticles.length} artículos literales con numeración monótona estricta.`);

      // 3. Upsert en legal_documents
      const [docRow] = await sql`
        INSERT INTO legal_documents (
          code, title, kind, issuer, official_number, source_url, source_format, file_sha256, consolidated_as_of
        )
        VALUES (
          ${docConfig.code},
          ${docConfig.title},
          ${docConfig.kind},
          ${docConfig.issuer},
          ${docConfig.officialNumber},
          ${docConfig.sourceUrl},
          ${docConfig.sourceFormat},
          ${fileSha256},
          ${docConfig.consolidatedAsOf}
        )
        ON CONFLICT (code) DO UPDATE SET
          title = EXCLUDED.title,
          file_sha256 = EXCLUDED.file_sha256,
          consolidated_as_of = EXCLUDED.consolidated_as_of,
          source_url = EXCLUDED.source_url
        RETURNING id;
      `;

      const documentId = docRow.id;

      // 4. Limpiar artículos previos para este documento para garantizar consistencia monótona
      await sql`DELETE FROM legal_articles WHERE document_id = ${documentId};`;

      // 5. Inserción de artículos literales en batch
      for (const art of parsedArticles) {
        await sql`
          INSERT INTO legal_articles (
            document_id, label, sort_key, heading, breadcrumb, text, text_sha256, status, modified_by
          )
          VALUES (
            ${documentId},
            ${art.label},
            ${art.sortKey},
            ${art.heading || null},
            ${art.breadcrumb || null},
            ${art.text},
            ${art.textSha256},
            ${art.status},
            ${JSON.stringify(art.modifiedBy)}::jsonb
          );
        `;
      }

      // 6. Generar reporte de muestra aleatoria/estratificada
      const sampleReport = this.parser.generateSampleReport(
        parsedArticles,
        docConfig.code,
        docConfig.title,
        this.reportsDir
      );
      console.log(`✓ Generado reporte de muestra en: ${sampleReport.outputPath}`);

      totalDocsIngested++;
      totalArticlesIngested += parsedArticles.length;
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`INGESTA COMPLETADA: ${totalDocsIngested} documentos | ${totalArticlesIngested} artículos en Neon Postgres`);
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
}

// Ejecución directa si se invoca por CLI
if (require.main === module) {
  const pipeline = new IngestPipeline();
  pipeline.run().catch((err) => {
    console.error('Error fatal en IngestPipeline:', err);
    process.exit(1);
  });
}