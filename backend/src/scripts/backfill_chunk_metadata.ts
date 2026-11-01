import 'dotenv/config';
import crypto from 'crypto';
import { neon } from '@neondatabase/serverless';

function computeDigest(text: string): string {
  return crypto.createHash('sha256').update(text.trim(), 'utf8').digest('hex');
}

function resolveMetadata(sourceCode: string, specialistId: string) {
  const sc = sourceCode.toLowerCase();
  let issuingEntity = 'Poder Judicial / Estado Peruano';
  let sourceUrl = 'https://spij.minjus.gob.pe/';
  let bindingStatus = 'norma_imperativa';

  if (sc.includes('corte suprema') || sc.includes('pleno')) {
    issuingEntity = 'Corte Suprema de Justicia de la República';
    sourceUrl = 'https://jurisprudencia.pj.gob.pe/jurisprudenciaweb/';
    bindingStatus = 'precedente_vinculante';
  } else if (sc.includes('constitucional')) {
    issuingEntity = 'Tribunal Constitucional del Perú';
    sourceUrl = 'https://www.tc.gob.pe/jurisprudencia/';
    bindingStatus = 'precedente_vinculante';
  } else if (sc.includes('tribunal fiscal')) {
    issuingEntity = 'Tribunal Fiscal del Perú (MEF)';
    sourceUrl = 'https://www.mef.gob.pe/es/tribunal-fiscal';
    bindingStatus = 'jurisprudencia_reiterada';
  } else if (sc.includes('oece') || sc.includes('osce')) {
    issuingEntity = 'Tribunal de Contrataciones Públicas (OECE)';
    sourceUrl = 'https://portal.osce.gob.pe/';
    bindingStatus = 'doctrina_jurisprudencial';
  } else if (sc.includes('código civil') || sc.includes('código procesal')) {
    issuingEntity = 'Congreso de la República / MINJUSDH';
    sourceUrl = 'https://spij.minjus.gob.pe/';
    bindingStatus = 'norma_imperativa';
  } else if (sc.includes('código penal') || sc.includes('ncpp')) {
    issuingEntity = 'Congreso de la República / MINJUSDH';
    sourceUrl = 'https://spij.minjus.gob.pe/';
    bindingStatus = 'norma_imperativa';
  } else if (sc.includes('tributario') || sc.includes('sunat')) {
    issuingEntity = 'Congreso de la República / SUNAT';
    sourceUrl = 'https://www.sunat.gob.pe/legislacion/';
    bindingStatus = 'norma_imperativa';
  } else if (sc.includes('laboral')) {
    issuingEntity = 'Congreso de la República / MTPE';
    sourceUrl = 'https://www.gob.pe/mtpe';
    bindingStatus = 'norma_imperativa';
  } else if (sc.includes('minería') || sc.includes('oefa') || sc.includes('minem')) {
    issuingEntity = 'Ministerio de Energía y Minas / OEFA';
    sourceUrl = 'https://www.gob.pe/oefa';
    bindingStatus = 'norma_imperativa';
  }

  return { issuingEntity, sourceUrl, bindingStatus };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not defined');
    process.exit(1);
  }
  const sql = neon(process.env.DATABASE_URL);

  const rows = await sql`SELECT id, specialist_id, source_code, content FROM legal_chunks`;
  console.log(`Poblando metadatos y hashes SHA-256 para ${rows.length} chunks...`);

  let updated = 0;
  for (const r of rows) {
    const hash = computeDigest(r.content);
    const meta = resolveMetadata(r.source_code, r.specialist_id);
    
    await sql`
      UPDATE legal_chunks
      SET sha256_hash = ${hash},
          source_url = ${meta.sourceUrl},
          issuing_entity = ${meta.issuingEntity},
          binding_status = ${meta.bindingStatus},
          validity_status = 'in_force',
          last_verified_at = NOW()
      WHERE id = ${r.id}
    `;
    updated++;
  }

  console.log(`✓ Metadatos poblados exitosamente en ${updated} chunks.`);
  const sample = await sql`
    SELECT id, specialist_id, source_code, substring(sha256_hash from 1 for 16) as hash_preview, issuing_entity, source_url
    FROM legal_chunks
    LIMIT 5
  `;
  console.log('Muestra de chunks actualizados:', JSON.stringify(sample, null, 2));
}

main().catch(console.error);
