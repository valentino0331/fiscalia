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
import { PromptLoader } from '../prompts/promptLoader';
import { buildTemporalAnchorBlock, getLimaDateFormatted } from '../lib/parametricValues';
import { AiTelemetry } from './aiTelemetry';
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
3. DERECHO PROCESAL VIGENTE: Para la interposición de demandas, plazos de impugnación o actuaciones que deban formularse hoy, rigen las normas procesales vigentes a ${getLimaDateFormatted()}.
════════════════════════════════════════════════════════════════\n\n`;
    }

    const isV2 = PromptLoader.getPromptVersion() === 'v2';
    const agentPrompt = PromptLoader.getAgentPrompt(agentId);

    const PERUVIAN_ANTI_HALLUCINATION_DIRECTIVE = `════════════════════════════════════════════════════════════════
POLÍTICA SUPREMA DE ESTADO — FIDELIDAD A LAS LEYES DEL PERÚ Y CERO ALUCINACIONES
════════════════════════════════════════════════════════════════
1. ORDENAMIENTO JURÍDICO EXCLUSIVO: REPÚBLICA DEL PERÚ.
   - Todas tus respuestas, análisis procesales, vías de impugnación y redacciones de documentos se rigen RIGUROSAMENTE por el ordenamiento legal peruano vigente.
   - ⛔ PROHIBICIÓN RADICAL DE CITAR DERECHO EXTRANJERO: Queda terminantemente prohibido citar leyes o jurisprudencia de México, España, Colombia, Argentina o Chile.
   - ⛔ PROHIBICIÓN DE INVENTAR CASACIONES O ARTÍCULOS: Nunca inventes números de expediente, salas ni años ficticios. Si no cuentas con la casación exacta en tu corpus, fundamenta en la ley sustantiva y declara la limitación.
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

    const fullSystemPrompt = isV2
      ? (agentPrompt + (temporalIrretroactivityDirective ? `\n\n${temporalIrretroactivityDirective}` : '') + caseMemory.formattedBlock + studioBlock + (legalGrounding ? `\n\n${legalGrounding}` : ''))
      : (PERUVIAN_ANTI_HALLUCINATION_DIRECTIVE +
         temporalIrretroactivityDirective +
         buildTemporalAnchorBlock() +
         agentPrompt +
         caseMemory.formattedBlock +
         studioBlock +
         (legalGrounding ? `\n\n${legalGrounding}` : ''));

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

        AiTelemetry.recordRequest(candidate.model);
        const result = await ProviderAdapter.executeCandidate(
          candidate,
          formattedMessages,
          isStream || false,
          streamFilter ? (chunk) => streamFilter.processChunk(chunk) : sendStreamChunk,
          req.abortSignal,
          correlationId
        );

        CircuitBreaker.recordSuccess(candidate.provider, result.durationMs, candidate.model);
        AiTelemetry.recordSuccess(candidate.model, result.durationMs);

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
        AiTelemetry.recordFailure(candidate.model, classified.category, err.message, (err as any).statusCode);
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
          isDraftingRequest
        );

    // Si se agregaron rectificaciones o notas de advertencia que no se emitieron en el stream, enviarlas ahora
    if (isStream && sendStreamChunk && qualityReport.processedText !== executionResult.text) {
      let extraContent = qualityReport.processedText.slice(executionResult.text.length);
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

    const finalMessage = qualityReport.processedText;

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
