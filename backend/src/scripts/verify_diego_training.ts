import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE DIEGO ===\n');
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
    'diego_modelo_civil.docx',
    'diego_modelo2_ejecutivo.docx',
    'diego_modelo3_nocontencioso.docx',
    'diego_modelo4_contestacion.docx',
    'diego_modelo5_cautelar.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Diego
  const diegoPrompt = SYSTEM_PROMPTS.diego;
  assert(!!diegoPrompt, 'SYSTEM_PROMPTS.diego existe y no está vacío');
  assert(diegoPrompt.includes('Diego, especialista en Derecho Civil'), 'Identidad Diego presente');
  assert(diegoPrompt.includes('Hardman'), 'Sistema Hardman presente');
  assert(diegoPrompt.includes('Código Civil') || diegoPrompt.includes('CC'), 'Código Civil presente');

  // Modelos Canónicos
  assert(diegoPrompt.includes('MODELO OFICIAL 1'), 'Modelo 1 integrado');
  assert(diegoPrompt.includes('MODELO OFICIAL 2'), 'Modelo 2 integrado');
  assert(diegoPrompt.includes('MODELO OFICIAL 3'), 'Modelo 3 integrado');
  assert(diegoPrompt.includes('MODELO OFICIAL 4'), 'Modelo 4 integrado');
  assert(diegoPrompt.includes('MODELO OFICIAL 5'), 'Modelo 5 integrado');

  // Router
  const diegoKeywords = AGENT_ROUTING_RULES.diego.keywords;
  assert(diegoKeywords.includes('civil') || diegoKeywords.includes('desalojo'), 'Keywords router contiene civil');
  const transferCheck = suggestAgentTransfer('diego', 'demanda de desalojo por ocupacion precaria con el cuarto pleno casatorio');
  assert(transferCheck === null, 'No transfiere fuera de diego en materia civil');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (${Math.round((passed / total) * 100)}%).`);
}

runTests();
