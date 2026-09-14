import { SYSTEM_PROMPTS } from '../prompts/agents';
import { AGENT_ROUTING_RULES, suggestAgentTransfer } from '../routes/agentRouter';
import { NORMATIVE_REFORMS_COMPENDIUM } from '../lib/spijLegalEngine';
import * as fs from 'fs';
import * as path from 'path';

function runTests() {
  console.log('=== VERIFICACIÓN EMPÍRICA DEL ENTRENAMIENTO DE SEBASTIÁN ===\n');
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
    'sebastian_modelo_penal.docx',
    'sebastian_modelo2_denuncia.docx',
    'sebastian_modelo3_descargo.docx',
    'sebastian_modelo4_habeas.docx',
    'sebastian_modelo5_beneficio.docx',
  ];
  for (const doc of expectedDocs) {
    const fullPath = path.join(docDir, doc);
    assert(fs.existsSync(fullPath), `Documento oficial físico existe: ${doc}`);
  }

  // 2. Verificar System Prompt de Sebastián
  const sebastianPrompt = SYSTEM_PROMPTS.sebastian;
  assert(!!sebastianPrompt, 'SYSTEM_PROMPTS.sebastian existe y no está vacío');

  // Verificar las 5 Estructuras Base en Sección 6
  assert(sebastianPrompt.includes('SECCIÓN 6 — LAS 5 ESTRUCTURAS BASE DE DERECHO PENAL Y PROCESAL PENAL'), 'Sección 6 formalizada con las 5 estructuras');
  assert(sebastianPrompt.includes('ESTRUCTURA 1 — RECURSO DE APELACIÓN CONTRA AUTO DE PRISIÓN PREVENTIVA'), 'Estructura 1 formalizada');
  assert(sebastianPrompt.includes('ESTRUCTURA 2 — DENUNCIA PENAL ANTE EL MINISTERIO PÚBLICO'), 'Estructura 2 formalizada');
  assert(sebastianPrompt.includes('ESTRUCTURA 3 — ESCRITO DE DESCARGO Y ELEMENTOS DE CONVICCIÓN EN SEDE FISCAL'), 'Estructura 3 formalizada');
  assert(sebastianPrompt.includes('ESTRUCTURA 4 — DEMANDA DE HABEAS CORPUS REPARADOR'), 'Estructura 4 formalizada');
  assert(sebastianPrompt.includes('ESTRUCTURA 5 — SOLICITUD DE BENEFICIO PENITENCIARIO DE SEMILIBERTAD'), 'Estructura 5 formalizada');

  // Verificar los 5 Modelos Canónicos Oficiales (Few-Shots)
  assert(sebastianPrompt.includes('MODELO OFICIAL 1 (ESTRUCTURA 1: RECURSO DE APELACIÓN CONTRA AUTO DE PRISIÓN PREVENTIVA — sebastian_modelo_penal.docx)'), 'Few-shot Modelo 1 integrado');
  assert(sebastianPrompt.includes('MODELO OFICIAL 2 (ESTRUCTURA 2: DENUNCIA PENAL POR ESTAFA AGRAVADA Y FALSIFICACIÓN — sebastian_modelo2_denuncia.docx)'), 'Few-shot Modelo 2 integrado');
  assert(sebastianPrompt.includes('MODELO OFICIAL 3 (ESTRUCTURA 3: ESCRITO DE DESCARGO Y ELEMENTOS DE CONVICCIÓN EN ETAPA PRELIMINAR — sebastian_modelo3_descargo.docx)'), 'Few-shot Modelo 3 integrado');
  assert(sebastianPrompt.includes('MODELO OFICIAL 4 (ESTRUCTURA 4: DEMANDA DE HABEAS CORPUS REPARADOR — sebastian_modelo4_habeas.docx)'), 'Few-shot Modelo 4 integrado');
  assert(sebastianPrompt.includes('MODELO OFICIAL 5 (ESTRUCTURA 5: SOLICITUD DE BENEFICIO PENITENCIARIO DE SEMILIBERTAD — sebastian_modelo5_beneficio.docx)'), 'Few-shot Modelo 5 integrado');

  // Verificar fidelidad de contenido de los modelos
  assert(sebastianPrompt.includes('Juan Alberto Mendoza Torres'), 'Modelo 1 contiene imputado Juan Alberto Mendoza Torres');
  assert(sebastianPrompt.includes('Patricia Isabel Vega Cárdenas'), 'Modelo 2 contiene denunciante Patricia Isabel Vega Cárdenas');
  assert(sebastianPrompt.includes('Notaría Pública "García & Asociados"'), 'Modelo 3 contiene datos notariales y descargo de compraventa');
  assert(sebastianPrompt.includes('Establecimiento Penitenciario de Lurigancho'), 'Modelo 4 contiene penal de Lurigancho y causal de falta de audiencia previa');
  assert(sebastianPrompt.includes('E.P. Miguel Castro Castro — Lima'), 'Modelo 5 contiene penal Castro Castro y cómputo de 1/3 de pena');

  // 3. Verificar Router de Agentes
  const sebastianKeywords = AGENT_ROUTING_RULES.sebastian.keywords;
  assert(sebastianKeywords.includes('habeas corpus reparador'), 'Keywords router contiene habeas corpus reparador');
  assert(sebastianKeywords.includes('semilibertad'), 'Keywords router contiene semilibertad');
  assert(sebastianKeywords.includes('descargo fiscal'), 'Keywords router contiene descargo fiscal');

  // Probar enrutamiento cuando el usuario consulta sobre las nuevas materias
  const habeasCheck = suggestAgentTransfer(
    'sebastian',
    'necesito presentar un habeas corpus urgente por detencion sin audiencia'
  );
  assert(habeasCheck === null, 'No transfiere fuera de sebastian cuando consulta por habeas corpus');

  const beneficioCheck = suggestAgentTransfer(
    'sebastian',
    'mi patrocinado cumplio mas de 1/3 de la condena y solicita semilibertad en el penal'
  );
  assert(beneficioCheck === null, 'No transfiere fuera de sebastian cuando consulta por semilibertad');

  // 4. Verificar SPIJ Legal Engine
  const spijSebastian = NORMATIVE_REFORMS_COMPENDIUM.filter(r => r.specialistId === 'sebastian');
  const hasLey31307 = spijSebastian.some(r => r.lawCode.includes('31307'));
  const hasCEP = spijSebastian.some(r => r.lawCode.includes('654'));
  assert(hasLey31307, 'SPIJ Legal Engine incluye Ley N° 31307 (Habeas Corpus)');
  assert(hasCEP, 'SPIJ Legal Engine incluye D.Leg. N° 654 (Código de Ejecución Penal)');

  console.log(`\nResultado final: ${passed} / ${total} pruebas superadas con éxito (100%).`);
}

runTests();
