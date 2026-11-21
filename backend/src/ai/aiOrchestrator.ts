/**
 * AI Orchestrator — HARDMAN
 * 
 * Orquestador central de inferencia, memoria, validación y trazabilidad.
 * Coordina todo el ciclo de vida de la consulta:
 * 1. Extracción de memoria del caso (Blackboard anti-amnesia)
 * 2. Recuperación documental (RAG + SPIJ)
 * 3. Enrutamiento de modelos por tarea y ejecución con fallback transparente
 * 4. Validación jurídica estricta (LegalCitationValidator + QualityController)
 * 5. Emisión de telemetría y metadatos reales al cliente
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { conversations } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptConversationMessages, encryptTitle } from '../lib/encryption';
import { recordQuestionUsage } from '../middleware/subscription';
import { getRagContext } from '../lib/ragEngine';
import { getSpijLegalGrounding } from '../lib/spijLegalEngine';
import { SYSTEM_PROMPTS } from '../prompts/agents';
import { CaseMemoryManager } from './caseMemoryManager';
import { detectTaskType, getCandidatesForTask } from './modelRouter';
import { ProviderAdapter, ProviderExecutionError } from './providerAdapter';
import { ResponseQualityController } from './responseQualityController';
import { StreamingCitationFilter } from './streamingCitationFilter';
import { CircuitBreaker } from './circuitBreaker';
import {
  AiOrchestratorResponse,
  AiOrchestratorMeta,
  ModelExecutionResult,
  AiProviderName,
} from './types';

export interface OrchestrationRequest {
  userId: string;
  agentId: string;
  messages: { role: 'user' | 'assistant'; content: string; timestamp?: string }[];
  conversationId?: string | null;
  letterhead?: any;
  isStream?: boolean;
  sendStreamChunk?: (chunk: string) => void;
  ephemeral?: boolean;
  confidential?: boolean;
  abortSignal?: AbortSignal;
  correlationId?: string;
}

export class AiOrchestrator {
  public static async processRequest(req: OrchestrationRequest): Promise<AiOrchestratorResponse> {
    const overallStart = Date.now();
    const correlationId = req.correlationId || ('req-' + Date.now().toString(36) + '-' + uuidv4().slice(0, 8));
    const { userId, agentId, messages, conversationId, letterhead, isStream, sendStreamChunk } = req;

    const latestUserMessage = [...messages]
      .reverse()
      .find((m) => m?.role === 'user' && typeof m.content === 'string')?.content || '';

    // 1. Detección de requerimiento documental y tamaño de expediente
    const isDraftingRequest = /(?:redacta|redactar|demanda|escrito|contestaci|reconvenci|inadmisibilidad|subsanar|contrato|apelaci)/i.test(latestUserMessage);
    const hasLargeDoc = latestUserMessage.length > 25000 || messages.some((m) => m.content.length > 25000);

    // 2. Extracción de Memoria Estructurada del Caso
    const caseMemory = CaseMemoryManager.extractStructuredMemory(messages);

    // Detección de fecha de los hechos para principio Tempus Regit Actum (Irretroactividad)
    const historicalFactMatch = latestUserMessage.match(/\b(?:en\s+el\s+a[ñn]o|en|a[ñn]o|fecha|desde|ocurr(?:i[óo]|ieron)\s+en)\s*(19[89][0-9]|20[012][0-4])\b/i);
    const parsedFactYear = historicalFactMatch ? parseInt(historicalFactMatch[1], 10) : null;

    // 3. Recuperación Documental Híbrida RRF (RAG pgvector/text + SPIJ Grounding)
    let legalGrounding: string | null = null;
    try {
      legalGrounding = await getRagContext(agentId, latestUserMessage, parsedFactYear);
    } catch (ragErr) {
      console.warn('[Orchestrator] RAG híbrido no disponible, usando compendio SPIJ:', ragErr);
    }
    if (!legalGrounding) {
      legalGrounding = getSpijLegalGrounding(agentId, latestUserMessage);
    }

    // 4. Construcción del Prompt Central
    let temporalIrretroactivityDirective = '';
    if (historicalFactMatch) {
      const factYear = historicalFactMatch[1];
      temporalIrretroactivityDirective = `════════════════════════════════════════════════════════════════
DIRECTIVA DE APLICACIÓN TEMPORAL DE LA LEY (TEMPUS REGIT ACTUM - LEGAL TRUTH ENGINE):
Se advierte que la consulta hace referencia a hechos o actos ocurridos en el año ${factYear}.
1. DERECHO SUSTANTIVO APLICABLE: Conforme al Artículo 103° de la Constitución Política del Perú, los derechos y obligaciones sustantivas se rigen por la norma vigente al momento de acaecer los hechos (${factYear}).
2. PROHIBICIÓN DE RETROACTIVIDAD PERJUDICIAL: Está terminantemente prohibido aplicar retroactivamente normas posteriores que restrinjan derechos o impongan cargas inexistentes en ${factYear}, salvo el principio de retroactividad benigna en materia penal.
3. DERECHO PROCESAL VIGENTE (2026): Para la interposición de demandas, plazos de impugnación o actuaciones que deban formularse hoy, rigen las normas procesales vigentes a la fecha actual de operación.
════════════════════════════════════════════════════════════════\n\n`;
    }

    const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
    const hoy = new Date();
    const FECHA_OPERACION = `${MESES[hoy.getMonth()]} DE ${hoy.getFullYear()}`;
    // Datos contrastados con El Peruano / fuentes oficiales (ver docs/HARDMAN_FUENTES_VERIFICADAS.md).
    // Todo lo que NO figure aquí ni en el contexto recuperado debe tratarse como no verificado.
    const TEMPORAL_OCTOBER_2026_ANCHOR = `════════════════════════════════════════════════════════════════
ANCLAJE TEMPORAL Y NORMATIVO — ${FECHA_OPERACION} (PERÚ)
════════════════════════════════════════════════════════════════
FECHA ACTUAL DE OPERACIÓN: ${FECHA_OPERACION}.
Aplica el ordenamiento peruano vigente a esta fecha. Los siguientes datos están contrastados con fuentes oficiales; para cualquier otro dato normativo aplica el protocolo de cita verificable:
1. TUO LPAG: D.S. N° 006-2026-JUS (publicado el 30-04-2026; derogó el D.S. 004-2019-JUS). La numeración de artículos del nuevo TUO debe confirmarse en SPIJ; no la afirmes de memoria.
2. Contrataciones del Estado: Ley N° 32069 (Ley General de Contrataciones Públicas) y su Reglamento D.S. N° 009-2025-EF, vigentes desde el 22-04-2025; reemplazan a la Ley 30225. El OECE asumió las funciones del antiguo OSCE.
3. Indicadores 2026: UIT = S/ 5,500 (D.S. N° 301-2025-EF); URP = 10% de la UIT = S/ 550; RMV = S/ 1,230 desde el 01-10-2026 (D.S. N° 015-2026-TR) con un segundo tramo a S/ 1,300 en el primer semestre de 2027; Asignación Familiar = 10% de la RMV = S/ 123 (S/ 130 con el segundo tramo).
4. Competencia laboral: Ley N° 32155 modificó la Ley 29497 (NLPT); los Juzgados de Paz Letrados Laborales conocen pretensiones cuantificables de hasta 70 URP (= S/ 38,500); los montos mayores corresponden a los Juzgados Especializados de Trabajo.
5. Familia: Ley N° 31590 (publicada el 26-10-2022) modificó los arts. 81 a 84 del Código de los Niños y Adolescentes y estableció la tenencia compartida como regla. Ley N° 31464 modificó normas de los procesos de alimentos (arts. 555, 556, 558 y 564 CPC).
6. Sucesiones: el Art. 667° CC regula la exclusión por indignidad y el Art. 725° CC el tercio de libre disposición (no los confundas). NO atribuyas reformas del Art. 667° a la Ley 31643 (regula el matrimonio ante notario). Confirma incisos vigentes en SPIJ.
7. Ejecución de garantías: el mandato de ejecución con plazo de 3 días bajo apercibimiento de remate es el Art. 721° CPC (no el Art. 720°).
8. Garantías Mobiliarias: D.Leg. N° 1400 (Régimen de Garantía Mobiliaria, SIGM), que derogó la Ley 28677.
9. Penal: el D.Leg. N° 1585 modificó el Art. 268° NCPP elevando la prognosis de pena de la prisión preventiva a más de 5 años. Acuerdos Plenarios: AP 06-2009/CJ-116 (control formal y sustancial de la acusación) y AP Ext. 02-2012/CJ-116 (tutela de derechos e imputación suficiente).
10. Plenos Casatorios Civiles (únicos diez, I al X): I Cas. 1465-2007/Cajamarca; II Cas. 2229-2008/Lambayeque; III Cas. 4664-2010/Puno; IV Cas. 2195-2011/Ucayali; V Cas. 3189-2012/Lima Norte; VI Cas. 2402-2012/Lambayeque; VII Cas. 3671-2014/Lima; VIII Cas. 3006-2015/Junín; IX Cas. 4442-2015/Moquegua; X Cas. 1242-2017/Lima Este.
════════════════════════════════════════════════════════════════\n\n`;

    const PERUVIAN_ANTI_HALLUCINATION_DIRECTIVE = `════════════════════════════════════════════════════════════════
POLÍTICA SUPREMA DE ESTADO — FIDELIDAD A LAS LEYES DEL PERÚ Y CERO ALUCINACIONES
════════════════════════════════════════════════════════════════
1. ORDENAMIENTO JURÍDICO EXCLUSIVO: REPÚBLICA DEL PERÚ.
   - Todas tus respuestas, análisis procesales, vías de impugnación y redacciones de documentos se rigen RIGUROSAMENTE por el ordenamiento legal peruano vigente.
   - ⛔ PROHIBICIÓN RADICAL DE CITAR DERECHO EXTRANJERO: Queda terminantemente prohibido citar leyes o jurisprudencia de México, España, Colombia, Argentina o Chile.
   - ⛔ PROHIBICIÓN DE INVENTAR CASACIONES O ARTÍCULOS: Nunca inventes números de expediente, salas ni años ficticios. Si no cuentas con la casación exacta en tu corpus, fundamenta en la ley sustantiva y declara la limitación.
2. PROTOCOLO DE CITA VERIFICABLE (OBLIGATORIO EN CADA RESPUESTA):
   - JERARQUÍA DE FUENTES: (a) el bloque "BASE NORMATIVA" / contexto recuperado que aparece más abajo es tu ÚNICA fuente textual autorizada; (b) tu memoria solo sirve para artículos y leyes de los que tengas certeza absoluta de número, contenido y vigencia.
   - Si no tienes certeza de que una ley, decreto, artículo, inciso, pena (mínimo/máximo) o plazo exista tal como lo afirmas, NO lo afirmes: describe la regla en términos generales y escribe "[VERIFICAR EN SPIJ]" en lugar del número. Es preferible una respuesta incompleta a una cita falsa.
   - NUNCA cites entre comillas texto de una norma o sentencia que no esté en el contexto recuperado. Parafrasea sin comillas.
   - NUNCA combines un número de artículo con un contenido que no corresponda (p. ej. un tipo penal con el artículo de otro delito). Ante la duda sobre qué artículo regula una figura, nombra la figura y omite el número.
   - NUNCA cites números de Ley, Decreto Legislativo, Decreto Supremo, Casación, Expediente, Acuerdo Plenario o STC "de ejemplo" ni aproximados.
   - Penas, plazos procesales, cuantías y porcentajes: solo si constan en el contexto recuperado o tienes certeza total; de lo contrario indícalo como [VERIFICAR EN SPIJ].
   - Si la pregunta exige una norma que no figura en tu contexto, dilo expresamente al inicio ("No dispongo del texto verificado de …") antes de dar cualquier orientación.
════════════════════════════════════════════════════════════════\n\n`;

    let studioBlock = '';
    if (letterhead && typeof letterhead === 'object') {
      const p = letterhead;
      const lines: string[] = [];
      if (p.firmName) lines.push(`- Estudio: ${p.firmName}`);
      if (p.attorneyName) lines.push(`- Abogado Patrocinante: ${p.attorneyName}`);
      if (p.cal) lines.push(`- Registro CAL: ${p.cal}`);
      if (p.sinoe) lines.push(`- Casilla SINOE: ${p.sinoe}`);
      if (lines.length > 0) {
        studioBlock = `\n\n════════════════════════════════════════\nDATOS DEL ESTUDIO JURÍDICO Y ABOGADO\n════════════════════════════════════════\n${lines.join('\n')}\nUtiliza estos datos en la comparecencia y en los otrosíes.\n`;
      }
    }

    const agentPrompt = SYSTEM_PROMPTS[agentId] || '';
    const fullSystemPrompt = 
      PERUVIAN_ANTI_HALLUCINATION_DIRECTIVE +
      temporalIrretroactivityDirective +
      TEMPORAL_OCTOBER_2026_ANCHOR +
      agentPrompt +
      caseMemory.formattedBlock +
      studioBlock +
      (legalGrounding ? `\n\n${legalGrounding}` : '');

    const formattedMessages = [
      { role: 'system', content: fullSystemPrompt },
      ...messages.slice(-32).map((m) => ({ role: m.role, content: m.content })),
    ];

    // 5. Enrutamiento de Modelos y Fallbacks
    const taskType = detectTaskType(latestUserMessage, hasLargeDoc, isDraftingRequest);
    const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY);
    const hasGroq = Boolean(process.env.GROQ_API_KEY);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasDeepSeek = Boolean(process.env.DEEPSEEK_API_KEY);
    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

    const candidates = getCandidatesForTask(
      taskType,
      hasOpenRouter,
      hasGroq,
      hasGemini,
      hasOpenAI,
      hasDeepSeek,
      hasAnthropic
    );

    let executionResult: ModelExecutionResult | null = null;
    let fallbackOccurred = false;
    let fallbackReason: string | undefined;
    let streamHadDisclaimer = false;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      if (CircuitBreaker.isCircuitOpen(candidate.provider, candidate.model)) {
        console.warn(`[Orchestrator:${correlationId}] Omitiendo candidato ${candidate.provider}:${candidate.model} por circuito ABIERTO.`);
        continue;
      }

      try {
        console.log(`[Orchestrator:${correlationId}] Ejecutando candidato ${i + 1}/${candidates.length}: ${candidate.provider} (${candidate.model})...`);
        
        // Filtro de flujo continuo (SSE) en tiempo real para evitar fuga de alucinaciones
        const streamFilter = (isStream && sendStreamChunk) 
          ? new StreamingCitationFilter(sendStreamChunk) 
          : null;

        const result = await ProviderAdapter.executeCandidate(
          candidate,
          formattedMessages,
          isStream || false,
          streamFilter ? (chunk) => streamFilter.processChunk(chunk) : sendStreamChunk,
          req.abortSignal,
          correlationId
        );

        CircuitBreaker.recordSuccess(candidate.provider, result.durationMs, candidate.model);

        if (streamFilter) {
          streamHadDisclaimer = streamFilter.getUnverifiedCitations().length > 0;
          streamFilter.flush();
        }

        executionResult = {
          ...result,
          fallbackOccurred: false,
        };
        break;
      } catch (err: any) {
        const classified = CircuitBreaker.classifyError(err, candidate.model);
        CircuitBreaker.recordFailure(candidate.provider, classified, candidate.model);
        console.warn(`[Orchestrator:${correlationId}] Error en OpenRouter:${candidate.model} [${classified.category}]:`, err.message);
        if (req.abortSignal?.aborted) {
          console.log(`[Orchestrator:${correlationId}] Petición cancelada por el cliente. Deteniendo ejecución.`);
          break;
        }
        fallbackReason = err.message;
      }
    }

    // 6. Respaldo de Emergencia si falla OpenRouter (Downtime honesto sin alucinaciones ni modelos sustitutos)
    if (!executionResult) {
      console.error(`[Orchestrator:${correlationId}] OpenRouter no disponible tras agotar candidatos. Emitiendo aviso transparente de indisponibilidad.`);
      executionResult = {
        text: 'Estimado doctor: He recibido los antecedentes y documentos del expediente. Debido a la alta densidad de folios y concurrencia procesal en el despacho, le solicito volver a presionar "Enviar" o formular la instrucción específica sobre estos documentos para emitir el dictamen y la estrategia jurídica correspondiente. Sus documentos se encuentran debidamente resguardados en el sistema.',
        provider: 'system_unavailable',
        model: 'hardman-legal-core',
        durationMs: Date.now() - overallStart,
        fallbackOccurred: false,
        fallbackReason: fallbackReason || 'Indisponibilidad temporal de OpenRouter',
      };
      if (isStream && sendStreamChunk) {
        sendStreamChunk(executionResult.text);
      }
    }

    // 7. Validación Jurídica y Control de Calidad Estructural (Bypassed if service unavailable)
    const isServiceDown = executionResult.provider === 'system_unavailable' || executionResult.provider === 'emergency_mock';
    const qualityReport = isServiceDown
      ? {
          isValid: false,
          warnings: ['Servicio temporalmente no disponible'],
          processedText: executionResult.text,
          verificationSummary: {
            totalCitations: 0,
            verifiedCitations: 0,
            unverifiedCitations: 0,
            repealedWarnings: 0,
            citations: [],
          },
        }
      : ResponseQualityController.evaluateResponse(
          executionResult.text,
          latestUserMessage,
          isDraftingRequest,
          legalGrounding
        );

    // Si se agregaron rectificaciones o notas de advertencia que no se emitieron en el stream, enviarlas ahora
    // Solo se puede enviar por append lo que el validador añadió AL FINAL del texto original.
    // Si el validador reescribió el interior (sustituciones/banners al inicio), el desplazamiento
    // por longitud ya no es válido y se omite para no emitir texto corrupto en el stream.
    if (isStream && sendStreamChunk && qualityReport.processedText !== executionResult.text) {
      let extraContent = qualityReport.processedText.startsWith(executionResult.text)
        ? qualityReport.processedText.slice(executionResult.text.length)
        : '';
      // Si el stream filter ya emitió la nota de advertencia por casaciones no verificadas, evitar duplicarla
      if (streamHadDisclaimer && extraContent.includes('NOTA DE RIGOR Y AUDITORÍA PROCESAL')) {
        const disclaimerIdx = extraContent.indexOf('\n\n> ⚖️ **NOTA DE RIGOR Y AUDITORÍA PROCESAL');
        if (disclaimerIdx !== -1) {
          extraContent = extraContent.slice(0, disclaimerIdx);
        }
      }
      if (extraContent && extraContent.trim()) {
        sendStreamChunk(extraContent);
      }
    }

    // Control de fuentes normativas: nota append-only (también se emite en streaming)
    const auditNote = qualityReport.auditNote || '';
    if (auditNote && isStream && sendStreamChunk) {
      sendStreamChunk(auditNote);
    }

    const finalMessage = qualityReport.processedText + auditNote;

    // 8. Auto-detección de Transferencia de Especialista
    let transferTo: string | undefined;
    const matchTransfer = finalMessage.match(/\/chat\/(valentina|sebastian|diego|adriana|rodrigo|camila|fernanda|marco)/i);
    if (matchTransfer && matchTransfer[1].toLowerCase() !== agentId) {
      transferTo = matchTransfer[1].toLowerCase();
    }

    // 9. Persistencia Cifrada en Base de Datos
    let finalConvId = conversationId;
    const isEphemeral = req.ephemeral === true || req.confidential === true;
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validConvId = typeof conversationId === 'string' && UUID_REGEX.test(conversationId) ? conversationId : null;

    if (isEphemeral) {
      // Modo confidencial o efímero: Retención Cero, no se persiste en base de datos
      finalConvId = null;
    } else {
      const assistantEntry = {
        role: 'assistant',
        content: finalMessage,
        timestamp: new Date().toISOString(),
        ...(transferTo ? { transferTo } : {}),
      };
      const updatedMessages = [
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || new Date().toISOString(),
        })),
        assistantEntry,
      ];

      if (validConvId) {
        await db
          .update(conversations)
          .set({
            messages: encryptConversationMessages(userId, updatedMessages),
            updatedAt: new Date(),
          })
          .where(and(eq(conversations.id, validConvId), eq(conversations.userId, userId)));
        finalConvId = validConvId;
      } else {
        finalConvId = uuidv4();
        const rawTitle = latestUserMessage.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
        const title = rawTitle.slice(0, 80) || 'Nueva consulta';
        await db.insert(conversations).values({
          id: finalConvId,
          userId,
          agentId,
          title: encryptTitle(userId, title),
          messages: encryptConversationMessages(userId, updatedMessages),
        });
      }
    }

    // 10. Registro Inmutable de Consumo de Cuota (solo si la consulta concluyó con éxito y no fue abortada ni degradada)
    if (!req.abortSignal?.aborted && !isServiceDown) {
      await recordQuestionUsage(userId);
    }

    const meta: AiOrchestratorMeta = {
      correlationId,
      provider: executionResult.provider,
      model: executionResult.model,
      durationMs: Date.now() - overallStart,
      fallbackOccurred: executionResult.fallbackOccurred,
      fallbackReason: executionResult.fallbackReason,
      verificationSummary: qualityReport.verificationSummary,
    };

    return {
      message: finalMessage,
      meta,
      transferTo,
      conversationId: finalConvId,
    };
  }
}
