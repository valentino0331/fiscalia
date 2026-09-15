import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE VALENTINA ===\n');
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

  // 1. Verificar existencia física de documentos oficiales en documentos/
  const docDir = path.resolve(__dirname, '../../../documentos');
  const expectedDocs = [
    'valentina_modelo2_contestacion.docx',
    'valentina_modelo3_apelacion.docx',
    'valentina_modelo4_ejecucion.docx',
    'valentina_modelo5_incidental.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Valentina
  const valPrompt = SYSTEM_PROMPTS.valentina;
  assert(!!valPrompt, 'SYSTEM_PROMPTS.valentina existe y no está vacío');
  assert(valPrompt.includes('Valentina, especialista en Derecho Laboral'), 'Identidad Valentina presente');
  assert(valPrompt.includes('Hardman'), 'Sistema Hardman presente');
  assert(valPrompt.includes('NLPT') || valPrompt.includes('29497'), 'NLPT Ley 29497 presente');
  assert(valPrompt.includes('D.S. 003-97-TR') || valPrompt.includes('728'), 'LPCL D.S. 003-97-TR presente');

  // Modelos Canónicos
  assert(valPrompt.includes('MODELO OFICIAL 1'), 'Modelo 1 integrado');
  assert(valPrompt.includes('MODELO OFICIAL 2'), 'Modelo 2 integrado');
  assert(valPrompt.includes('MODELO OFICIAL 3'), 'Modelo 3 integrado');
  assert(valPrompt.includes('MODELO OFICIAL 4'), 'Modelo 4 integrado');
  assert(valPrompt.includes('MODELO OFICIAL 5'), 'Modelo 5 integrado');

  // Router
  const valKeywords = AGENT_ROUTING_RULES.valentina.keywords;
  assert(valKeywords.includes('laboral') || valKeywords.includes('despido'), 'Keywords router contiene laboral');
  const transferCheck = suggestAgentTransfer('valentina', 'demanda por despido arbitrario y pago de beneficios sociales');
  assert(transferCheck === null, 'No transfiere fuera de valentina en materia laboral');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (${Math.round((passed / total) * 100)}%).`);
}

runTests();
