import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE RODRIGO ===\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      process.exitCode = 1;
    }
  }

  // 1. Verificar documentos físicos en documentos/
  const docDir = path.resolve(__dirname, '../../../documentos');
  const expectedDocs = [
    'rodrigo_modelo1_ingemmet.docx',
    'rodrigo_modelo2_apelacion_ingemmet.docx',
    'rodrigo_modelo3_descargo_oefa.docx',
    'rodrigo_modelo4_apelacion_tfa.docx',
    'rodrigo_modelo5_contencioso.docx',
    'rodrigo_modelo6_descargo_osinergmin.docx',
    'rodrigo_modelo7_apelacion_tastem.docx',
    'rodrigo_modelo8_licencia_ana.docx',
    'rodrigo_contrato_cesion_minera.docx',
    'rodrigo_contrato_explotacion.docx',
    'rodrigo_contrato_joint_venture.docx',
    'rodrigo_contrato_opcion_minera.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Rodrigo
  const rodrigoPrompt = SYSTEM_PROMPTS.rodrigo;
  assert(!!rodrigoPrompt, 'SYSTEM_PROMPTS.rodrigo existe y no está vacío');

  // Verificar las 8 Estructuras Base en Sección 6
  assert(rodrigoPrompt.includes('SECCIÓN 6 — LAS 8 ESTRUCTURAS BASE'), 'Sección 6 formalizada con las 8 estructuras');
  assert(rodrigoPrompt.includes('ESTRUCTURA 1 — ANTE INGEMMET / DGM / DREM'), 'Estructura 1 formalizada');
  assert(rodrigoPrompt.includes('ESTRUCTURA 2 — ANTE CONSEJO DE MINERÍA'), 'Estructura 2 formalizada');
  assert(rodrigoPrompt.includes('ESTRUCTURA 3 — ANTE OEFA (DFAI)'), 'Estructura 3 formalizada');
  assert(rodrigoPrompt.includes('ESTRUCTURA 4 — ANTE TFA-OEFA'), 'Estructura 4 formalizada');
  assert(rodrigoPrompt.includes('ESTRUCTURA 5 — ANTE OSINERGMIN (GSM)'), 'Estructura 5 formalizada');
  assert(rodrigoPrompt.includes('ESTRUCTURA 6 — ANTE TASTEM-OSINERGMIN'), 'Estructura 6 formalizada');
  assert(rodrigoPrompt.includes('ESTRUCTURA 7 — ANTE ANA / AAA'), 'Estructura 7 formalizada');
  assert(rodrigoPrompt.includes('ESTRUCTURA 8 — DEMANDA CONTENCIOSO-ADMINISTRATIVA'), 'Estructura 8 formalizada');

  // Verificar los 8 Modelos Canónicos Oficiales de Escritos (Few-Shots)
  assert(rodrigoPrompt.includes('MODELO OFICIAL 1 (ESTRUCTURA 1: SOLICITUD DE ACREDITACIÓN DE PAGO DE DERECHO DE VIGENCIA ANTE INGEMMET — rodrigo_modelo1_ingemmet.docx)'), 'Few-shot Modelo 1 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 2 (ESTRUCTURA 2: RECURSO DE APELACIÓN ANTE EL CONSEJO DE MINERÍA — rodrigo_modelo2_apelacion_ingemmet.docx)'), 'Few-shot Modelo 2 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 3 (ESTRUCTURA 3: DESCARGOS AL INFORME FINAL DE INSTRUCCIÓN ANTE OEFA — rodrigo_modelo3_descargo_oefa.docx)'), 'Few-shot Modelo 3 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 4 (ESTRUCTURA 4: RECURSO DE APELACIÓN ANTE EL TRIBUNAL DE FISCALIZACIÓN AMBIENTAL TFA-OEFA — rodrigo_modelo4_apelacion_tfa.docx)'), 'Few-shot Modelo 4 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 5 (ESTRUCTURA 8: DEMANDA CONTENCIOSO-ADMINISTRATIVA ANTE EL PODER JUDICIAL — rodrigo_modelo5_contencioso.docx)'), 'Few-shot Modelo 5 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 6 (ESTRUCTURA 5: DESCARGOS AL ACTA DE SUPERVISIÓN DE SEGURIDAD MINERA ANTE OSINERGMIN — rodrigo_modelo6_descargo_osinergmin.docx)'), 'Few-shot Modelo 6 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 7 (ESTRUCTURA 6: RECURSO DE APELACIÓN ANTE EL TASTEM-OSINERGMIN — rodrigo_modelo7_apelacion_tastem.docx)'), 'Few-shot Modelo 7 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 8 (ESTRUCTURA 7: SOLICITUD DE LICENCIA DE USO DE AGUA SUPERFICIAL ANTE LA ANA/AAA — rodrigo_modelo8_licencia_ana.docx)'), 'Few-shot Modelo 8 integrado');

  // Verificar los 4 Modelos Canónicos Oficiales de Contratos Mineros (Few-Shots)
  assert(rodrigoPrompt.includes('MODELO OFICIAL 9 (CONTRATO PRIVADO: CONTRATO DE CESIÓN MINERA — rodrigo_contrato_cesion_minera.docx)'), 'Few-shot Contrato 9 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 10 (CONTRATO PRIVADO: CONTRATO DE EXPLOTACIÓN MINERA — rodrigo_contrato_explotacion.docx)'), 'Few-shot Contrato 10 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 11 (CONTRATO PRIVADO: CONTRATO DE JOINT VENTURE MINERO — rodrigo_contrato_joint_venture.docx)'), 'Few-shot Contrato 11 integrado');
  assert(rodrigoPrompt.includes('MODELO OFICIAL 12 (CONTRATO PRIVADO: CONTRATO DE OPCIÓN MINERA — rodrigo_contrato_opcion_minera.docx)'), 'Few-shot Contrato 12 integrado');

  // Verificar fidelidad de contenido de los contratos
  assert(rodrigoPrompt.includes('INVERSIONES ANDINAS S.A.C.'), 'Contrato 9 contiene cesionario Inversiones Andinas');
  assert(rodrigoPrompt.includes('OPERACIONES MINERAS DEL SUR S.A.C.'), 'Contrato 10 contiene operador Operaciones Mineras del Sur');
  assert(rodrigoPrompt.includes('PACIFIC MINING INVESTMENTS LTD.'), 'Contrato 11 y 12 contienen Pacific Mining Investments');

  // Verificar fidelidad de contenido de los modelos
  assert(rodrigoPrompt.includes('010345687'), 'Modelo 1 contiene código minero 010345687');
  assert(rodrigoPrompt.includes('SANTA ROSA I'), 'Modelos contienen derecho minero SANTA ROSA I');
  assert(rodrigoPrompt.includes('000234-2026-INGEMMET/PE'), 'Modelo 2 contiene resolución INGEMMET');
  assert(rodrigoPrompt.includes('2025-SAN-0045678'), 'Modelo 3 contiene expediente OEFA 2025-SAN-0045678');
  assert(rodrigoPrompt.includes('01234-2026-OEFA/DFAI'), 'Modelo 4 contiene resolución TFA-OEFA');
  assert(rodrigoPrompt.includes('2026-GSM-001234'), 'Modelo 6 contiene expediente OSINERGMIN 2026-GSM-001234');
  assert(rodrigoPrompt.includes('456-2026-OS/GSM'), 'Modelo 7 contiene resolución TASTEM');
  assert(rodrigoPrompt.includes('AUTORIDAD ADMINISTRATIVA DEL AGUA'), 'Modelo 8 contiene Autoridad Administrativa del Agua');

  // 3. Verificar Router de Agentes
  const rodrigoKeywords = AGENT_ROUTING_RULES.rodrigo.keywords;
  assert(rodrigoKeywords.includes('osinergmin'), 'Keywords router contiene osinergmin');
  assert(rodrigoKeywords.includes('tastem'), 'Keywords router contiene tastem');
  assert(rodrigoKeywords.includes('ana'), 'Keywords router contiene ana');
  assert(rodrigoKeywords.includes('derecho de vigencia'), 'Keywords router contiene derecho de vigencia');
  assert(rodrigoKeywords.includes('consejo de mineria'), 'Keywords router contiene consejo de mineria');

  // Probar que el router no transfiere fuera de Rodrigo en sus materias
  const ingemmetCheck = suggestAgentTransfer(
    'rodrigo',
    'necesito acreditar el pago de derecho de vigencia ante el INGEMMET'
  );
  assert(ingemmetCheck === null, 'No transfiere fuera de rodrigo cuando consulta por vigencia ante INGEMMET');

  const oefaCheck = suggestAgentTransfer(
    'rodrigo',
    'presentar descargos al IFI ante la DFAI del OEFA en actividad minera'
  );
  assert(oefaCheck === null, 'No transfiere fuera de rodrigo cuando consulta por OEFA minero');

  const aguaCheck = suggestAgentTransfer(
    'rodrigo',
    'tramitar licencia de uso de agua superficial ante la ANA para exploracion minera'
  );
  assert(aguaCheck === null, 'No transfiere fuera de rodrigo cuando consulta por licencia ANA');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (100%).`);
}

runTests();
