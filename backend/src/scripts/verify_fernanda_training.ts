import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE FERNANDA ===\n');
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
    'fernanda_modelo1_reclamacion.docx',
    'fernanda_modelo2_apelacion_tf.docx',
    'fernanda_modelo3_contencioso_pj.docx',
    'fernanda_modelo4_queja_tf.docx',
    'fernanda_modelo5_descargo_fiscalizacion.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Fernanda
  const ferPrompt = SYSTEM_PROMPTS.fernanda;
  assert(!!ferPrompt, 'SYSTEM_PROMPTS.fernanda existe y no está vacío');
  assert(ferPrompt.includes('Fernanda'), 'Identidad Fernanda presente');
  assert(ferPrompt.includes('SUNAT'), 'SUNAT presente');
  assert(ferPrompt.includes('Tribunal Fiscal'), 'Tribunal Fiscal presente');

  // Modelos Canónicos
  assert(ferPrompt.includes('MODELO OFICIAL 1'), 'Modelo 1 integrado');
  assert(ferPrompt.includes('MODELO OFICIAL 2'), 'Modelo 2 integrado');
  assert(ferPrompt.includes('MODELO OFICIAL 3'), 'Modelo 3 integrado');
  assert(ferPrompt.includes('MODELO OFICIAL 4'), 'Modelo 4 integrado');
  assert(ferPrompt.includes('MODELO OFICIAL 5'), 'Modelo 5 integrado');

  // Router
  const ferKeywords = AGENT_ROUTING_RULES.fernanda.keywords;
  assert(ferKeywords.includes('tributario') || ferKeywords.includes('sunat'), 'Keywords router contiene tributario');
  const transferCheck = suggestAgentTransfer('fernanda', 'recurso de reclamacion tributaria contra resolucion de determinacion sunat');
  assert(transferCheck === null, 'No transfiere fuera de fernanda en materia tributaria');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (${Math.round((passed / total) * 100)}%).`);
}

runTests();
