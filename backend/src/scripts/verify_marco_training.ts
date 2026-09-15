import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE MARCO ===\n');
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

  // 1. Verificar existencia física de los 6 documentos oficiales en documentos/
  const docDir = path.resolve(__dirname, '../../../documentos');
  const expectedDocs = [
    'marco_modelo1_reconsideracion_lpag.docx',
    'marco_modelo2_apelacion_lpag.docx',
    'marco_modelo3_descargo_pas_oece.docx',
    'marco_modelo4_apelacion_tcp_buena_pro.docx',
    'marco_modelo5_demanda_contencioso_administrativa.docx',
    'marco_modelo6_ampliacion_plazo_contractual.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Marco
  const marcoPrompt = SYSTEM_PROMPTS.marco;
  assert(!!marcoPrompt, 'SYSTEM_PROMPTS.marco existe y no está vacío');

  // Identidad y Experiencia
  assert(marcoPrompt.includes('11 años de experiencia exclusiva'), 'Prompt incluye 11 años de experiencia');
  assert(marcoPrompt.includes('Tribunal de Contrataciones Públicas'), 'Prompt incluye Tribunal de Contrataciones Públicas');
  assert(marcoPrompt.includes('OECE'), 'Prompt incluye OECE');
  assert(marcoPrompt.includes('Hardman'), 'Prompt incluye Hardman');

  // Delimitación de límites y derivaciones
  assert(marcoPrompt.includes('Fernanda') && marcoPrompt.includes('/chat/fernanda'), 'Derivación tributaria a Fernanda configurada');
  assert(marcoPrompt.includes('Valentina') && marcoPrompt.includes('/chat/valentina'), 'Derivación laboral a Valentina configurada');
  assert(marcoPrompt.includes('Sebastián') && marcoPrompt.includes('/chat/sebastian'), 'Derivación penal a Sebastián configurada');
  assert(marcoPrompt.includes('Diego') && marcoPrompt.includes('/chat/diego'), 'Derivación civil a Diego configurada');

  // Datos 2026 y Normativa
  assert(marcoPrompt.includes('UIT 2026: S/ 5,500'), 'UIT 2026 S/ 5,500 presente');
  assert(marcoPrompt.includes('D.S. N° 006-2026-JUS'), 'Nuevo TUO LPAG D.S. N° 006-2026-JUS presente');
  assert(marcoPrompt.includes('Ley General de Contrataciones Públicas N° 32069'), 'Ley 32069 presente');
  assert(marcoPrompt.includes('D.S. N° 009-2025-EF'), 'Reglamento D.S. 009-2025-EF presente');
  assert(marcoPrompt.includes('D.S. N° 001-2026-EF'), 'Modificatoria D.S. 001-2026-EF presente');
  assert(marcoPrompt.includes('PLADICOP'), 'Plataforma PLADICOP presente');
  assert(marcoPrompt.includes('Directiva 002-2025-OECE/CD'), 'Directiva JPRD 002-2025-OECE/CD presente');
  assert(marcoPrompt.includes('REGAJU'), 'Registro REGAJU presente');
  assert(marcoPrompt.includes('D.L. N° 1715'), 'Decreto Legislativo 1715 sobre obras hidráulicas presente');

  // Umbrales 2026
  assert(marcoPrompt.includes('8 UIT = S/ 44,000'), 'Umbral contratación menor 8 UIT S/ 44,000 presente');
  assert(marcoPrompt.includes('S/ 485,000'), 'Umbral Licitación/Concurso público S/ 485,000 presente');
  assert(marcoPrompt.includes('S/ 5,000,000'), 'Umbral Licitación pública de obras S/ 5,000,000 presente');
  assert(marcoPrompt.includes('50 UIT = S/ 275,000'), 'Umbral apelación TCP > 50 UIT S/ 275,000 presente');

  // Plazos y Garantías
  assert(marcoPrompt.includes('8 días hábiles'), 'Plazo de apelación 8 días hábiles presente');
  assert(marcoPrompt.includes('5 días hábiles'), 'Plazo de apelación abreviada 5 días hábiles presente');
  assert(marcoPrompt.includes('300 UIT = S/ 1,650,000'), 'Tope de garantía 300 UIT S/ 1,650,000 presente');
  assert(marcoPrompt.includes('Acuerdo de Sala Plena 03-2025/TCP'), 'Acuerdo de Sala Plena 03-2025/TCP presente');
  assert(marcoPrompt.includes('10 días hábiles improrrogables'), 'Plazo descargos PAS 10 días hábiles presente');
  assert(marcoPrompt.includes('3 meses'), 'Plazo caducidad contencioso 3 meses presente');

  // Reglas de Operación
  assert(marcoPrompt.includes('REGLA 1 — PRIMERO EL PLAZO, SIEMPRE'), 'Regla 1 Primero el plazo presente');
  assert(marcoPrompt.includes('REGLA 2 — INTAKE ANTES DEL DOCUMENTO'), 'Regla 2 Intake antes del documento presente');
  assert(marcoPrompt.includes('REGLA 3 — DOCUMENTOS COMPLETOS'), 'Regla 3 Documentos completos presente');
  assert(marcoPrompt.includes('REGLA 4 — INSTANCIA CORRECTA SIEMPRE'), 'Regla 4 Instancia correcta presente');
  assert(marcoPrompt.includes('REGLA 5 — HONESTIDAD SOBRE PRECEDENTES'), 'Regla 5 Honestidad sobre precedentes presente');
  assert(marcoPrompt.includes('REGLA 6 — JPRD PRIMERO EN OBRAS Y SUMINISTROS'), 'Regla 6 JPRD primero en obras presente');

  // Mensaje de Bienvenida
  assert(
    marcoPrompt.includes('Hola, soy Marco. Especialista en derecho administrativo y contrataciones públicas. Dime qué necesitas: un recurso de reconsideración o apelación, un escrito de descargo ante el OECE, una estrategia para impugnar la buena pro, o una demanda contencioso-administrativa. Si hay un acto notificado, empieza por decirme la fecha.'),
    'Mensaje de bienvenida exacto integrado en el prompt'
  );

  // Modelos Canónicos Oficiales (Few-Shots)
  assert(marcoPrompt.includes('MODELO OFICIAL 1 (ESTRUCTURA 1: RECURSO DE RECONSIDERACIÓN BAJO LPAG — marco_modelo1_reconsideracion_lpag.docx)'), 'Few-shot Modelo 1 integrado');
  assert(marcoPrompt.includes('MODELO OFICIAL 2 (ESTRUCTURA 2: RECURSO DE APELACIÓN BAJO LPAG — marco_modelo2_apelacion_lpag.docx)'), 'Few-shot Modelo 2 integrado');
  assert(marcoPrompt.includes('MODELO OFICIAL 3 (ESTRUCTURA 3: ESCRITO DE DESCARGO EN PROCEDIMIENTO ADMINISTRATIVO SANCIONADOR ANTE OECE — marco_modelo3_descargo_pas_oece.docx)'), 'Few-shot Modelo 3 integrado');
  assert(marcoPrompt.includes('MODELO OFICIAL 4 (ESTRUCTURA 4: RECURSO DE APELACIÓN CONTRA OTORGAMIENTO DE BUENA PRO ANTE EL TCP-OECE — marco_modelo4_apelacion_tcp_buena_pro.docx)'), 'Few-shot Modelo 4 integrado');
  assert(marcoPrompt.includes('MODELO OFICIAL 5 (ESTRUCTURA 5: DEMANDA CONTENCIOSO-ADMINISTRATIVA ANTE EL PODER JUDICIAL — marco_modelo5_demanda_contencioso_administrativa.docx)'), 'Few-shot Modelo 5 integrado');
  assert(marcoPrompt.includes('MODELO OFICIAL 6 (ESTRUCTURA 6: SOLICITUD DE AMPLIACIÓN DE PLAZO CONTRACTUAL EN EJECUCIÓN DE CONTRATOS PÚBLICOS — marco_modelo6_ampliacion_plazo_contractual.docx)'), 'Few-shot Modelo 6 integrado');

  // Fidelidad de contenido de los modelos
  assert(marcoPrompt.includes('EMPRESA SERVICIOS INTEGRALES DEL NORTE E.I.R.L.'), 'Modelo 2 contiene empresa Servicios Integrales del Norte');
  assert(marcoPrompt.includes('ANA MARÍA GUTIÉRREZ FLORES'), 'Modelo 2 contiene representante Ana María Gutiérrez Flores');
  assert(marcoPrompt.includes('CONSTRUCTORA ANDINA S.A.C.'), 'Modelo 3 contiene Constructora Andina S.A.C.');
  assert(marcoPrompt.includes('ROBERTO LUIS MENDOZA TORRES'), 'Modelo 3 contiene Roberto Luis Mendoza Torres');
  assert(marcoPrompt.includes('CONSORCIO PIURA CONSTRUCCIONES'), 'Modelo 4 contiene Consorcio Piura Construcciones');
  assert(marcoPrompt.includes('JORGE ANTONIO SILVA RAMÍREZ'), 'Modelo 4 contiene Jorge Antonio Silva Ramírez');
  assert(marcoPrompt.includes('INVERSIONES DEL NORTE S.A.C.'), 'Modelo 5 contiene Inversiones del Norte S.A.C.');
  assert(marcoPrompt.includes('EMPRESA CONSTRUCTORA VALQUI S.A.C.'), 'Modelo 6 contiene Constructora Valqui S.A.C.');
  assert(marcoPrompt.includes('CARLOS ENRIQUE VALQUI ROJAS'), 'Modelo 6 contiene Carlos Enrique Valqui Rojas');
  assert(marcoPrompt.includes('Dr. Rafael Ortega'), 'Modelos contienen Dr. Rafael Ortega como patrocinante');
  assert(marcoPrompt.includes('87432'), 'Modelos contienen C.A.L. N° 87432');
  assert(marcoPrompt.includes('24891'), 'Modelos contienen SINOE N° 24891');

  // 3. Router de Agentes
  const marcoKeywords = AGENT_ROUTING_RULES.marco.keywords;
  assert(marcoKeywords.includes('oece'), 'Keywords router contiene oece');
  assert(marcoKeywords.includes('tcp'), 'Keywords router contiene tcp');
  assert(marcoKeywords.includes('pladicop'), 'Keywords router contiene pladicop');
  assert(marcoKeywords.includes('buena pro'), 'Keywords router contiene buena pro');
  assert(marcoKeywords.includes('ley 32069'), 'Keywords router contiene ley 32069');
  assert(marcoKeywords.includes('ds 006-2026-jus'), 'Keywords router contiene ds 006-2026-jus');
  assert(marcoKeywords.includes('jprd'), 'Keywords router contiene jprd');

  // Probar que el router no transfiere fuera de Marco en sus materias
  const buenaProCheck = suggestAgentTransfer(
    'marco',
    'deseo apelar el otorgamiento de la buena pro ante el tribunal de contrataciones publicas del oece'
  );
  assert(buenaProCheck === null, 'No transfiere fuera de marco cuando consulta por buena pro ante TCP-OECE');

  const pasCheck = suggestAgentTransfer(
    'marco',
    'me llego una notificacion del decreto de inicio de procedimiento administrativo sancionador ante oece'
  );
  assert(pasCheck === null, 'No transfiere fuera de marco cuando consulta por PAS ante OECE');

  const lpagCheck = suggestAgentTransfer(
    'marco',
    'quiero interponer un recurso de reconsideracion bajo la ley 27444 y el nuevo tuo ds 006-2026-jus'
  );
  assert(lpagCheck === null, 'No transfiere fuera de marco cuando consulta por reconsideracion LPAG');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (${Math.round((passed / total) * 100)}%).`);
}

runTests();
