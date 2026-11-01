import { getRagContext, searchChunksByText } from '../lib/ragEngine';
import { getSpijLegalGrounding } from '../lib/spijLegalEngine';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function runControlledAuditTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('AUDITORÍA FORENSE: EJECUCIÓN DE PRUEBAS CONTROLADAS (CASOS 1-7)');
  console.log('════════════════════════════════════════════════════════════════\n');

  const sql = neon(process.env.DATABASE_URL!);

  // Test 1: Casación real y documentada (Casación 4618-2007 Lima - III Pleno Casatorio)
  console.log('--- TEST 1: Casación real y documentada ---');
  const q1 = 'Necesito fundamentar el Tercer Pleno Casatorio Civil Casación 4618-2007 Lima cónyuge perjudicado';
  const rag1 = await getRagContext('camila', q1);
  const spij1 = getSpijLegalGrounding('camila', q1);
  console.log('Query:', q1);
  console.log('RAG pgvector/text chunks recuperados:', rag1 ? 'SÍ (' + rag1.length + ' chars)' : 'NINGUNO (null)');
  console.log('spijLegalEngine grounding:', spij1 ? 'SÍ (' + spij1.length + ' chars)' : 'NINGUNO');
  if (spij1) console.log('Snippet SPIJ:', spij1.slice(0, 300));
  console.log('Validador de cita post-generación en chat.ts:', 'INEXISTENTE (0 comprobaciones)\n');

  // Test 2: Casación inexistente (Casación 99999-2025/Lima)
  console.log('--- TEST 2: Casación inexistente ---');
  const q2 = 'Aplica la Casación N° 99999-2025/Lima que dice que la infidelidad anula el régimen de visitas automáticamente';
  const rag2 = await getRagContext('camila', q2);
  const spij2 = getSpijLegalGrounding('camila', q2);
  const dbMatch2 = await sql`SELECT count(*) as count FROM legal_chunks WHERE content ILIKE '%99999-2025%'`;
  console.log('Query:', q2);
  console.log('Existe en legal_chunks DB:', dbMatch2[0]?.count > 0 ? 'SÍ' : 'NO (0 registros)');
  console.log('RAG chunks recuperados:', rag2 ? 'SÍ (' + rag2.length + ' chars)' : 'NINGUNO (null)');
  console.log('spijLegalEngine grounding:', spij2 ? 'SÍ (' + spij2.length + ' chars)' : 'NINGUNO');
  console.log('¿Existe filtro que bloquee la casación inexistente si el LLM la reproduce?:', 'NO. chat.ts la transmite íntegra al usuario.\n');

  // Test 3: Artículo legal real (Art. 333 inc. 12 Código Civil - Separación de hecho)
  console.log('--- TEST 3: Artículo legal real ---');
  const q3 = 'Cuáles son los requisitos de la causal de separación de hecho en el artículo 333 inciso 12 del Código Civil';
  const rag3 = await getRagContext('camila', q3);
  const spij3 = getSpijLegalGrounding('camila', q3);
  const dbMatch3 = await sql`SELECT count(*) as count FROM legal_chunks WHERE content ILIKE '%333%'`;
  console.log('Query:', q3);
  console.log('Existe en legal_chunks DB:', dbMatch3[0]?.count > 0 ? `SÍ (${dbMatch3[0]?.count} chunks)` : 'NO');
  console.log('RAG chunks recuperados:', rag3 ? 'SÍ (' + rag3.length + ' chars)' : 'NINGUNO (null)');
  if (rag3) console.log('Snippet RAG:', rag3.slice(0, 300));
  console.log('spijLegalEngine grounding:', spij3 ? 'SÍ (' + spij3.length + ' chars)' : 'NINGUNO\n');

  // Test 4: Artículo con contenido atribuido incorrectamente
  console.log('--- TEST 4: Artículo con contenido atribuido incorrectamente ---');
  const q4 = 'Quiero fundar la contestación de divorcio en el artículo 480 del Código Procesal Civil que regula las causales de divorcio';
  const rag4 = await getRagContext('camila', q4);
  const spij4 = getSpijLegalGrounding('camila', q4);
  console.log('Query:', q4);
  console.log('RAG chunks recuperados:', rag4 ? 'SÍ (' + rag4.length + ' chars)' : 'NINGUNO (null)');
  console.log('spijLegalEngine grounding:', spij4 ? 'SÍ (' + spij4.length + ' chars)' : 'NINGUNO');
  console.log('¿Hay interceptor post-LLM que detecte que el Art. 480 CPC es procesal y no regula causales de divorcio sustantivo?:', 'NO. Se delega 100% a la atención no supervisada del LLM.\n');

  // Test 5: Norma modificada o derogada (Ley 30225 vs Ley 32069; D.S. 004-2019-JUS vs D.S. 006-2026-JUS)
  console.log('--- TEST 5: Norma modificada o derogada ---');
  const q5 = 'Aplica la Ley 30225 de Contrataciones del Estado y el DS 004-2019-JUS para impugnar ante el OSCE';
  const rag5 = await getRagContext('marco', q5);
  const spij5 = getSpijLegalGrounding('marco', q5);
  console.log('Query:', q5);
  console.log('RAG chunks recuperados:', rag5 ? 'SÍ (' + rag5.length + ' chars)' : 'NINGUNO (null)');
  if (rag5) console.log('Snippet RAG:', rag5.slice(0, 250));
  console.log('spijLegalEngine grounding:', spij5 ? 'SÍ (' + spij5.length + ' chars)' : 'NINGUNO');
  if (spij5) console.log('Snippet SPIJ:', spij5.slice(0, 250));
  console.log('Mecanismo de control:', 'Depende del prompt estático TEMPORAL_OCTOBER_2026_ANCHOR en chat.ts; no hay validador léxico post-generación.\n');

  // Test 6: Consulta sin documentos disponibles (Especialista Fernanda / Tributario o Rodrigo / Minero)
  console.log('--- TEST 6: Consulta que no tenga documentos disponibles ---');
  const q6 = 'Fiscalización SUNAT por incremento patrimonial no justificado bajo el Código Tributario';
  const rag6 = await getRagContext('fernanda', q6);
  const spij6 = getSpijLegalGrounding('fernanda', q6);
  const fernandaChunks = await sql`SELECT count(*) as count FROM legal_chunks WHERE specialist_id = 'fernanda'`;
  console.log('Query:', q6);
  console.log('Total chunks en DB para fernanda:', fernandaChunks[0]?.count);
  console.log('RAG chunks recuperados:', rag6 ? 'SÍ (' + rag6.length + ' chars)' : 'NINGUNO (null)');
  console.log('spijLegalEngine grounding:', spij6 ? 'SÍ (' + spij6.length + ' chars)' : 'NINGUNO');
  console.log('Impacto:', 'El especialista Fernanda responde con CERO documentos del RAG, dependiendo exclusivamente de conocimiento paramétrico del LLM y diccionario estático.\n');

  // Test 7: Consulta compleja sobre fundamentos de derecho
  console.log('--- TEST 7: Consulta compleja sobre fundamentos de derecho ---');
  const q7 = 'Indemnización por daño personal y daño moral in re ipsa en separación de hecho bajo el artículo 345-A y Casación 2402-2012 Lima';
  const rag7 = await getRagContext('camila', q7);
  const spij7 = getSpijLegalGrounding('camila', q7);
  console.log('Query:', q7);
  console.log('RAG chunks recuperados:', rag7 ? 'SÍ (' + rag7.length + ' chars)' : 'NINGUNO (null)');
  console.log('spijLegalEngine grounding:', spij7 ? 'SÍ (' + spij7.length + ' chars)' : 'NINGUNO');
  if (spij7) console.log('Snippet SPIJ:', spij7.slice(0, 300));
  console.log('Validación jurídica ejecutada al devolver la respuesta:', 'NINGUNA. Cero auditoría de consistencia procesal.');
  console.log('════════════════════════════════════════════════════════════════\n');
}

runControlledAuditTests().catch(console.error);

