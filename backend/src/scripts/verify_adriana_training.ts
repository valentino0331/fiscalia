import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE ADRIANA ===\n');
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

  // 1. Verificar existencia física de los 9 documentos oficiales en documentos/
  const docDir = path.resolve(__dirname, '../../../documentos');
  const expectedDocs = [
    'adriana_modelo1_minuta_constitucion_sac.docx',
    'adriana_modelo2_nda_confidencialidad.docx',
    'adriana_modelo3_spa_compraventa_acciones.docx',
    'adriana_modelo4_acta_jga.docx',
    'adriana_modelo5_pacto_accionistas_sha.docx',
    'adriana_modelo6_loi_term_sheet.docx',
    'adriana_modelo7_contrato_distribucion_exclusiva.docx',
    'adriana_modelo8_modelo_prevencion_ley30424.docx',
    'adriana_modelo9_proyecto_fusion_absorcion.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Adriana
  const adrianaPrompt = SYSTEM_PROMPTS.adriana;
  assert(!!adrianaPrompt, 'SYSTEM_PROMPTS.adriana existe y no está vacío');

  // Identidad y Experiencia
  assert(adrianaPrompt.includes('12 años de experiencia'), 'Prompt incluye 12 años de experiencia');
  assert(adrianaPrompt.includes('M&A'), 'Prompt incluye M&A');
  assert(adrianaPrompt.includes('Hardman'), 'Prompt incluye Hardman');
  assert(adrianaPrompt.includes('compliance empresarial'), 'Prompt incluye compliance empresarial');

  // Delimitación de límites y derivaciones
  assert(adrianaPrompt.includes('Fernanda') && adrianaPrompt.includes('/chat/fernanda'), 'Derivación tributaria a Fernanda configurada');
  assert(adrianaPrompt.includes('Valentina') && adrianaPrompt.includes('/chat/valentina'), 'Derivación laboral a Valentina configurada');
  assert(adrianaPrompt.includes('Sebastián') && adrianaPrompt.includes('/chat/sebastian'), 'Derivación penal a Sebastián configurada');
  assert(adrianaPrompt.includes('Rodrigo') && adrianaPrompt.includes('/chat/rodrigo'), 'Derivación minera a Rodrigo configurada');
  assert(adrianaPrompt.includes('Marco') && adrianaPrompt.includes('/chat/marco'), 'Derivación administrativa a Marco configurada');
  assert(adrianaPrompt.includes('Diego') && adrianaPrompt.includes('/chat/diego'), 'Derivación civil a Diego configurada');
  assert(adrianaPrompt.includes('Camila') && adrianaPrompt.includes('/chat/camila'), 'Derivación familiar a Camila configurada');

  // Datos 2026 y Normativa
  assert(adrianaPrompt.includes('UIT 2026: S/ 5,500'), 'UIT 2026 S/ 5,500 presente');
  assert(adrianaPrompt.includes('D.L. N° 1400'), 'Decreto Legislativo 1400 presente');
  assert(adrianaPrompt.includes('SIGM'), 'Sistema SIGM de garantías mobiliarias presente');
  assert(adrianaPrompt.includes('Ley 31112'), 'Ley 31112 de control de concentraciones presente');
  assert(adrianaPrompt.includes('118,000 × S/ 5,150'), 'Cálculo de umbral conjunto Ley 31112 presente');
  assert(adrianaPrompt.includes('18,000 × S/ 5,150'), 'Cálculo de umbral individual Ley 31112 presente');
  assert(adrianaPrompt.includes('Ley 30424'), 'Ley 30424 de responsabilidad de personas jurídicas presente');
  assert(adrianaPrompt.includes('Ley 31740'), 'Modificatoria Ley 31740 presente');
  assert(adrianaPrompt.includes('SPLAFT'), 'SPLAFT presente');
  assert(adrianaPrompt.includes('Ley 27693'), 'Ley 27693 de UIF-Perú presente');
  assert(adrianaPrompt.includes('D.S. N° 008-2025-JUS'), 'D.S. 008-2025-JUS nuevos sujetos obligados presente');
  assert(adrianaPrompt.includes('Travel Rule'), 'Travel Rule de activos virtuales presente');
  assert(adrianaPrompt.includes('Art. 177') && adrianaPrompt.includes('Art. 190'), 'Responsabilidad de directores y gerentes arts. 177 y 190 LGS presente');
  assert(adrianaPrompt.includes('Ley 27809'), 'Ley General del Sistema Concursal 27809 presente');
  assert(adrianaPrompt.includes('Procedimiento Concursal Preventivo'), 'PCP presente');
  assert(adrianaPrompt.includes('Procedimiento Concursal Ordinario'), 'PCO presente');
  assert(adrianaPrompt.includes('Resolución SMV N° 011-2026-SMV/01'), 'Resolución SMV 011-2026-SMV/01 presente');

  // Las 9 Reglas de Operación
  assert(adrianaPrompt.includes('REGLA 1 — INTAKE ANTES DEL DOCUMENTO'), 'Regla 1 Intake presente');
  assert(adrianaPrompt.includes('REGLA 2 — DOCUMENTOS COMPLETOS'), 'Regla 2 Documentos completos presente');
  assert(adrianaPrompt.includes('REGLA 3 — SHARE DEAL vs. ASSET DEAL'), 'Regla 3 Share Deal vs Asset Deal presente');
  assert(adrianaPrompt.includes('REGLA 4 — CONTROL DE CONCENTRACIONES'), 'Regla 4 Control de concentraciones presente');
  assert(adrianaPrompt.includes('REGLA 5 — COMPLIANCE PROACTIVO'), 'Regla 5 Compliance proactivo presente');
  assert(adrianaPrompt.includes('REGLA 6 — GARANTÍAS MOBILIARIAS ACTUALIZADAS'), 'Regla 6 Garantías mobiliarias SIGM presente');
  assert(adrianaPrompt.includes('REGLA 7 — RESPONSABILIDAD DE ADMINISTRADORES'), 'Regla 7 Responsabilidad de administradores presente');
  assert(adrianaPrompt.includes('REGLA 8 — INSOLVENCIA: PREVENCIÓN ANTES QUE LIQUIDACIÓN'), 'Regla 8 Insolvencia preventiva presente');
  assert(adrianaPrompt.includes('REGLA 9 — HONESTIDAD SOBRE PRECEDENTES'), 'Regla 9 Honestidad sobre precedentes presente');

  // Mensaje de Bienvenida
  assert(
    adrianaPrompt.includes('Hola, soy Adriana. Especialista en derecho corporativo peruano. Dime qué necesitas: una constitución de empresa, un SPA, un pacto de accionistas, la estructura de una fusión, un modelo de compliance para la Ley 30424, o una consulta sobre una situación de insolvencia. Cuéntame el caso y empezamos.'),
    'Mensaje de bienvenida exacto integrado en el prompt'
  );

  // Modelos Canónicos Oficiales (Few-Shots)
  assert(adrianaPrompt.includes('MODELO OFICIAL 1 (ESTRUCTURA 1: MINUTA DE CONSTITUCIÓN DE SOCIEDAD ANÓNIMA CERRADA — adriana_modelo1_minuta_constitucion_sac.docx)'), 'Few-shot Modelo 1 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 2 (ESTRUCTURA 2: ACUERDO DE CONFIDENCIALIDAD / NDA BILATERAL CORPORATIVO — adriana_modelo2_nda_confidencialidad.docx)'), 'Few-shot Modelo 2 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 3 (ESTRUCTURA 3: CONTRATO DE COMPRAVENTA DE ACCIONES / SPA — adriana_modelo3_spa_compraventa_acciones.docx)'), 'Few-shot Modelo 3 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 4 (ESTRUCTURA 4: ACTA DE JUNTA GENERAL DE ACCIONISTAS UNIVERSAL — adriana_modelo4_acta_jga.docx)'), 'Few-shot Modelo 4 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 5 (ESTRUCTURA 5: CONVENIO DE ACCIONISTAS / SHA — adriana_modelo5_pacto_accionistas_sha.docx)'), 'Few-shot Modelo 5 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 6 (ESTRUCTURA 6: CARTA DE INTENCIÓN / LOI Y TERM SHEET DE M&A — adriana_modelo6_loi_term_sheet.docx)'), 'Few-shot Modelo 6 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 7 (ESTRUCTURA 7: CONTRATO DE DISTRIBUCIÓN COMERCIAL EXCLUSIVA — adriana_modelo7_contrato_distribucion_exclusiva.docx)'), 'Few-shot Modelo 7 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 8 (ESTRUCTURA 8: MODELO DE PREVENCIÓN DE DELITOS Y COMPLIANCE CORPORATIVO — LEY 30424 — adriana_modelo8_modelo_prevencion_ley30424.docx)'), 'Few-shot Modelo 8 integrado');
  assert(adrianaPrompt.includes('MODELO OFICIAL 9 (ESTRUCTURA 9: PROYECTO DE FUSIÓN POR ABSORCIÓN — adriana_modelo9_proyecto_fusion_absorcion.docx)'), 'Few-shot Modelo 9 integrado');

  // Fidelidad de contenido de los modelos
  assert(adrianaPrompt.includes('MINUTA DE CONSTITUCIÓN'), 'Modelo 1 contiene Minuta de Constitución');
  assert(adrianaPrompt.includes('NON-DISCLOSURE AGREEMENT'), 'Modelo 2 contiene NDA');
  assert(adrianaPrompt.includes('SHARE PURCHASE AGREEMENT'), 'Modelo 3 contiene SPA');
  assert(adrianaPrompt.includes('ACTA DE JUNTA GENERAL DE ACCIONISTAS'), 'Modelo 4 contiene Acta JGA');
  assert(adrianaPrompt.includes('SHAREHOLDERS AGREEMENT'), 'Modelo 5 contiene SHA');
  assert(adrianaPrompt.includes('LETTER OF INTENT'), 'Modelo 6 contiene LOI');
  assert(adrianaPrompt.includes('CONTRATO DE DISTRIBUCIÓN EXCLUSIVA'), 'Modelo 7 contiene Contrato de Distribución');
  assert(adrianaPrompt.includes('MODELO DE PREVENCIÓN DE DELITOS'), 'Modelo 8 contiene Modelo de Prevención');
  assert(adrianaPrompt.includes('PROYECTO DE FUSIÓN POR ABSORCIÓN'), 'Modelo 9 contiene Proyecto de Fusión');

  // 3. Router de Agentes
  const adrianaKeywords = AGENT_ROUTING_RULES.adriana.keywords;
  assert(adrianaKeywords.includes('m&a'), 'Keywords router contiene m&a');
  assert(adrianaKeywords.includes('sha'), 'Keywords router contiene sha');
  assert(adrianaKeywords.includes('spa'), 'Keywords router contiene spa');
  assert(adrianaKeywords.includes('sigm'), 'Keywords router contiene sigm');
  assert(adrianaKeywords.includes('ley 31112'), 'Keywords router contiene ley 31112');
  assert(adrianaKeywords.includes('splaft'), 'Keywords router contiene splaft');
  assert(adrianaKeywords.includes('pacto de accionistas'), 'Keywords router contiene pacto de accionistas');
  assert(adrianaKeywords.includes('reestructuracion patrimonial'), 'Keywords router contiene reestructuracion patrimonial');

  // Probar que el router no transfiere fuera de Adriana en sus materias
  const constitucionCheck = suggestAgentTransfer(
    'adriana',
    'necesito redactar una minuta de constitucion de sociedad anonima cerrada SAC'
  );
  assert(constitucionCheck === null, 'No transfiere fuera de adriana cuando consulta por minuta constitucion SAC');

  const shaCheck = suggestAgentTransfer(
    'adriana',
    'quiero redactar un pacto de accionistas con clausulas drag along y tag along'
  );
  assert(shaCheck === null, 'No transfiere fuera de adriana cuando consulta por pacto de accionistas SHA');

  const complianceCheck = suggestAgentTransfer(
    'adriana',
    'necesitamos implementar el modelo de prevencion de delitos bajo la ley 30424 y ley 31740'
  );
  assert(complianceCheck === null, 'No transfiere fuera de adriana cuando consulta por compliance ley 30424');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (${Math.round((passed / total) * 100)}%).`);
}

runTests();
