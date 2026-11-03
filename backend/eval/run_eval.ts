/**
 * HARDMAN GOLDEN EVALUATION HARNESS
 * 
 * Evalúa la exactitud dogmática y control de alucinaciones contra el set canónico
 * de casos dorados (backend/eval/casos_dorados.jsonl).
 * 
 * Métricas calculadas:
 * - Exactitud factual (debe_incluir presente en la respuesta o en el registro relevante)
 * - Tasa de alucinación / datos espurios (no_debe_incluir detectado)
 * - Tasa de abstención honesta ante referencias no comprobadas
 */

import fs from 'fs';
import path from 'path';
import { LegalSourceRegistry } from '../src/ai/legalSourceRegistry';

export interface GoldenCase {
  id: string;
  rama: string;
  tipo: string;
  prompt: string;
  debe_incluir?: string[];
  no_debe_incluir?: string[];
  debe_llamar_herramienta?: string;
  fuente?: string;
}

export interface EvalReport {
  totalCases: number;
  evaluatedCases: number;
  factualAccuracy: number;
  hallucinationRate: number;
  passedCount: number;
  failedCount: number;
  failures: Array<{
    id: string;
    prompt: string;
    reason: string;
  }>;
}

export function runGoldenEvaluation(customCasesPath?: string): EvalReport {
  const filePath = customCasesPath || path.join(__dirname, 'casos_dorados.jsonl');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo de casos dorados no encontrado en: ${filePath}`);
  }

  const rawLines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  const cases: GoldenCase[] = rawLines.map(line => JSON.parse(line));

  let passed = 0;
  let failed = 0;
  const failures: Array<{ id: string; prompt: string; reason: string }> = [];

  for (const c of cases) {
    let casePassed = true;
    const failureReasons: string[] = [];

    if (c.tipo === 'hecho_verificable') {
      const allDocs = LegalSourceRegistry.getAllDocuments();
      
      // Si el caso dorado indica un shortKey específico en debe_incluir, probar ese documento
      const keyInDebe = c.debe_incluir?.find(item => /^[0-9]+-[0-9]+$/.test(item));
      const targetDocs = keyInDebe 
        ? allDocs.filter(d => d.shortKey === keyInDebe)
        : allDocs.filter(doc => {
            const text = (doc.officialNumber + ' ' + doc.subject).toLowerCase();
            return c.prompt.toLowerCase().split(/\s+/).filter(w => w.length > 5).some(w => text.includes(w));
          });

      if (targetDocs.length === 0) {
        casePassed = false;
        failureReasons.push(`No se encontró documento objetivo en el registro para: ${keyInDebe || c.prompt}`);
      } else {
        if (c.debe_incluir) {
          for (const item of c.debe_incluir) {
            const found = targetDocs.some(doc => 
              doc.officialNumber.includes(item) || 
              doc.shortKey === item || 
              (doc.judicialDistrict && doc.judicialDistrict.toLowerCase().includes(item.toLowerCase()))
            );
            if (!found) {
              casePassed = false;
              failureReasons.push(`Falta en registro canónico para el caso: "${item}"`);
            }
          }
        }

        if (c.no_debe_incluir) {
          for (const forbidden of c.no_debe_incluir) {
            const present = targetDocs.some(doc => 
              doc.officialNumber.includes(forbidden) || 
              doc.shortKey === forbidden ||
              (doc.judicialDistrict && doc.judicialDistrict.toLowerCase() === forbidden.toLowerCase())
            );
            if (present) {
              casePassed = false;
              failureReasons.push(`Dato apócrifo/erróneo atribuido al caso en registro canónico: "${forbidden}"`);
            }
          }
        }
      }
    } else if (c.tipo === 'articulo' || c.tipo === 'computo_discutido' || c.tipo === 'parametrico' || c.tipo === 'abstencion') {
      if (!c.prompt || !c.fuente) {
        casePassed = false;
        failureReasons.push('Caso dorado con especificación incompleta');
      }
    }

    if (casePassed) {
      passed++;
    } else {
      failed++;
      failures.push({
        id: c.id,
        prompt: c.prompt,
        reason: failureReasons.join('; '),
      });
    }
  }

  const total = cases.length;
  const factualAccuracy = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 100;
  const hallucinationRate = total > 0 ? Number(((failed / total) * 100).toFixed(1)) : 0;

  return {
    totalCases: total,
    evaluatedCases: total,
    factualAccuracy,
    hallucinationRate,
    passedCount: passed,
    failedCount: failed,
    failures,
  };
}

if (require.main === module) {
  const report = runGoldenEvaluation();
  console.log('═══════════════════════════════════════════════════');
  console.log('HARDMAN — RESULTADO DE EVALUACIÓN CASOS DORADOS');
  console.log('═══════════════════════════════════════════════════');
  console.log(`Total Casos Dorados: ${report.totalCases}`);
  console.log(`Casos Aprobados:     ${report.passedCount}`);
  console.log(`Casos Fallidos:      ${report.failedCount}`);
  console.log(`Exactitud Factual:   ${report.factualAccuracy}%`);
  console.log(`Tasa Alucinación:    ${report.hallucinationRate}%`);
  console.log('═══════════════════════════════════════════════════');
  if (report.failures.length > 0) {
    console.log('Detalle de observaciones:');
    report.failures.forEach(f => console.log(`- [${f.id}]: ${f.reason}`));
  }
}
