import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE CAMILA ===\n');
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
    'camila_modelo_familia.docx',
    'camila_modelo2_divorcio.docx',
    'camila_modelo3_separacion.docx',
    'camila_modelo4_tenencia.docx',
    'camila_modelo5_violencia.docx',
    'camila_modelo6_unionhecho.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Camila
  const camilaPrompt = SYSTEM_PROMPTS.camila;
  assert(!!camilaPrompt, 'SYSTEM_PROMPTS.camila existe y no está vacío');

  // Identidad
  assert(camilaPrompt.includes('Camila, especialista en Derecho de Familia peruano'), 'Identidad Camila presente');
  assert(camilaPrompt.includes('Hardman'), 'Sistema Hardman presente');
  assert(camilaPrompt.includes('interés superior del niño'), 'Principio del interés superior del niño presente');

  // Derivaciones
  assert(camilaPrompt.includes('Sebastián') && camilaPrompt.includes('/chat/sebastian'), 'Derivación penal a Sebastián configurada');
  assert(camilaPrompt.includes('Valentina') && camilaPrompt.includes('/chat/valentina'), 'Derivación laboral a Valentina configurada');
  assert(camilaPrompt.includes('Diego') && camilaPrompt.includes('/chat/diego'), 'Derivación civil a Diego configurada');
  assert(camilaPrompt.includes('Adriana') && camilaPrompt.includes('/chat/adriana'), 'Derivación corporativa a Adriana configurada');
  assert(camilaPrompt.includes('Marco') && camilaPrompt.includes('/chat/marco'), 'Derivación administrativa a Marco configurada');
  assert(camilaPrompt.includes('Fernanda') && camilaPrompt.includes('/chat/fernanda'), 'Derivación tributaria a Fernanda configurada');
  assert(camilaPrompt.includes('Rodrigo') && camilaPrompt.includes('/chat/rodrigo'), 'Derivación minera a Rodrigo configurada');

  // Normativa y Estructuras
  assert(camilaPrompt.includes('SECCIÓN 6 — LAS 6 ESTRUCTURAS BASE'), 'Sección 6 formalizada con las 6 estructuras');
  assert(camilaPrompt.includes('ESTRUCTURA 1 — DEMANDA DE ALIMENTOS'), 'Estructura 1 formalizada');
  assert(camilaPrompt.includes('ESTRUCTURA 2 — DIVORCIO POR CAUSAL'), 'Estructura 2 formalizada');
  assert(camilaPrompt.includes('ESTRUCTURA 3 — SEPARACIÓN CONVENCIONAL'), 'Estructura 3 formalizada');
  assert(camilaPrompt.includes('ESTRUCTURA 4 — TENENCIA Y RÉGIMEN DE VISITAS'), 'Estructura 4 formalizada');
  assert(camilaPrompt.includes('ESTRUCTURA 5 — VIOLENCIA FAMILIAR / MEDIDAS DE PROTECCIÓN'), 'Estructura 5 formalizada');
  assert(camilaPrompt.includes('ESTRUCTURA 6 — RECONOCIMIENTO DE UNIÓN DE HECHO'), 'Estructura 6 formalizada');

  // Reglas Críticas
  assert(camilaPrompt.includes('SECRETARIO va PRIMERO en el encabezado de familia'), 'Regla SECRETARIO va primero presente');
  assert(camilaPrompt.includes('URGENTE — LEY 30364'), 'Alerta de urgencia en violencia presente');
  assert(camilaPrompt.includes('CONVENIO REGULADOR'), 'Convenio regulador presente');
  assert(camilaPrompt.includes('asignación anticipada de alimentos'), 'Asignación anticipada de alimentos presente');
  assert(camilaPrompt.includes('tenencia provisional'), 'Tenencia provisional presente');
  assert(camilaPrompt.includes('MINISTERIO PÚBLICO'), 'Notificación al Ministerio Público presente');
  assert(camilaPrompt.includes('Ley N° 31590'), 'Ley 31590 de tenencia compartida presente');
  assert(camilaPrompt.includes('Ley N° 30364'), 'Ley 30364 presente');

  // Modelos Canónicos Oficiales (Few-Shots)
  assert(camilaPrompt.includes('MODELO OFICIAL 1 (ESTRUCTURA 1: DEMANDA DE ALIMENTOS PARA MENOR DE EDAD — camila_modelo_familia.docx)'), 'Few-shot Modelo 1 integrado');
  assert(camilaPrompt.includes('MODELO OFICIAL 2 (ESTRUCTURA 2: DEMANDA DE DIVORCIO POR CAUSAL DE SEPARACIÓN DE HECHO — camila_modelo2_divorcio.docx)'), 'Few-shot Modelo 2 integrado');
  assert(camilaPrompt.includes('MODELO OFICIAL 3 (ESTRUCTURA 3: DEMANDA DE SEPARACIÓN CONVENCIONAL Y DIVORCIO ULTERIOR — camila_modelo3_separacion.docx)'), 'Few-shot Modelo 3 integrado');
  assert(camilaPrompt.includes('MODELO OFICIAL 4 (ESTRUCTURA 4: DEMANDA DE TENENCIA Y CUSTODIA DE MENOR — camila_modelo4_tenencia.docx)'), 'Few-shot Modelo 4 integrado');
  assert(camilaPrompt.includes('MODELO OFICIAL 5 (ESTRUCTURA 5: SOLICITUD DE MEDIDAS DE PROTECCIÓN POR VIOLENCIA FAMILIAR — LEY 30364 — camila_modelo5_violencia.docx)'), 'Few-shot Modelo 5 integrado');
  assert(camilaPrompt.includes('MODELO OFICIAL 6 (ESTRUCTURA 6: SOLICITUD DE RECONOCIMIENTO DE UNIÓN DE HECHO — camila_modelo6_unionhecho.docx)'), 'Few-shot Modelo 6 integrado');

  // Fidelidad de contenido de los modelos
  assert(camilaPrompt.includes('Ana María Torres Díaz'), 'Modelos contienen demandante Ana María Torres Díaz');
  assert(camilaPrompt.includes('Carlos Andrés Soto Torres'), 'Modelos contienen menor Carlos Andrés Soto Torres');
  assert(camilaPrompt.includes('Marco Antonio Soto Vargas'), 'Modelos contienen cónyuge Marco Antonio Soto Vargas');
  assert(camilaPrompt.includes('Estudio Jurídico García & Asociados'), 'Modelos contienen Estudio Jurídico García & Asociados');
  assert(camilaPrompt.includes('SINOE N° 27654'), 'Modelos contienen Casilla SINOE N° 27654');

  // 3. Router de Agentes
  const camilaKeywords = AGENT_ROUTING_RULES.camila.keywords;
  assert(camilaKeywords.includes('alimentos') || camilaKeywords.includes('demanda de alimentos'), 'Keywords router contiene alimentos');
  assert(camilaKeywords.includes('tenencia compartida'), 'Keywords router contiene tenencia compartida');
  assert(camilaKeywords.includes('divorcio'), 'Keywords router contiene divorcio');
  assert(camilaKeywords.includes('violencia familiar'), 'Keywords router contiene violencia familiar');

  // Probar que el router no transfiere fuera de Camila en sus materias
  const alimentosCheck = suggestAgentTransfer(
    'camila',
    'necesito interponer una demanda de alimentos con asignacion anticipada para mi menor hijo'
  );
  assert(alimentosCheck === null, 'No transfiere fuera de camila cuando consulta por demanda de alimentos');

  const tenenciaCheck = suggestAgentTransfer(
    'camila',
    'deseo solicitar la tenencia compartida de mis hijos bajo la ley 31590'
  );
  assert(tenenciaCheck === null, 'No transfiere fuera de camila cuando consulta por tenencia compartida');

  const violenciaCheck = suggestAgentTransfer(
    'camila',
    'urgente necesito solicitar medidas de proteccion por violencia familiar bajo la ley 30364'
  );
  assert(violenciaCheck === null, 'No transfiere fuera de camila cuando consulta por violencia familiar');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (${Math.round((passed / total) * 100)}%).`);
}

runTests();
