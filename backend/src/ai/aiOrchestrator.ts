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
}

export class AiOrchestrator {
  public static async processRequest(req: OrchestrationRequest): Promise<AiOrchestratorResponse> {
    const overallStart = Date.now();
    const { userId, agentId, messages, conversationId, letterhead, isStream, sendStreamChunk } = req;

    const latestUserMessage = [...messages]
      .reverse()
      .find((m) => m?.role === 'user' && typeof m.content === 'string')?.content || '';

    // 1. Detección de requerimiento documental y tamaño de expediente
    const isDraftingRequest = /(?:redacta|redactar|demanda|escrito|contestaci|reconvenci|inadmisibilidad|subsanar|contrato|apelaci)/i.test(latestUserMessage);
    const hasLargeDoc = latestUserMessage.length > 25000 || messages.some((m) => m.content.length > 25000);

    // 2. Extracción de Memoria Estructurada del Caso
    const caseMemory = CaseMemoryManager.extractStructuredMemory(messages);

    // 3. Recuperación Documental (RAG + SPIJ Grounding)
    let legalGrounding: string | null = null;
    try {
      legalGrounding = await getRagContext(agentId, latestUserMessage);
    } catch (ragErr) {
      console.warn('[Orchestrator] RAG pgvector no disponible, usando compendio SPIJ:', ragErr);
    }
    if (!legalGrounding) {
      legalGrounding = getSpijLegalGrounding(agentId, latestUserMessage);
    }

    // 4. Construcción del Prompt Central
    const TEMPORAL_OCTOBER_2026_ANCHOR = `════════════════════════════════════════════════════════════════
ANCLAJE TEMPORAL Y DOGMÁTICO OFICIAL — OCTUBRE DE 2026 (PERÚ)
════════════════════════════════════════════════════════════════
FECHA ACTUAL DE OPERACIÓN: OCTUBRE DE 2026.
Todas tus respuestas, plazos, cálculos, vías procesales y redacciones de documentos se rigen rigurosamente por el ordenamiento legal peruano vigente a OCTUBRE DE 2026.
Queda terminantemente prohibido usar normas derogadas o desactualizadas:
1. TUO LPAG: D.S. N° 006-2026-JUS (derogó formalmente al D.S. 004-2019-JUS).
2. Contrataciones del Estado: Ley N° 32069 y D.S. N° 001-2026-EF (extinción definitiva del OSCE y Ley 30225; rige OECE, TCP, PLADICOP y JPRD obligatoria).
3. Indicadores económicos 2026: UIT = S/ 5,500; URP = S/ 550; RMV = S/ 1,230.00 y Asignación Familiar = S/ 123.00 (D.S. N° 015-2026-TR).
4. Competencia laboral: Ley N° 32155 (Paz Letrado Laboral hasta 70 URP = S/ 38,500 y daños hasta 60 URP = S/ 33,000; Especializados > 70 URP).
5. Familia: Ley N° 31590 (Tenencia Compartida como regla general preferente sin favoritismo maternal automático) y Ley N° 31464 / Art. 562° CPC (Alimentos sin tasas ni firma obligatoria).
6. Sucesiones: Art. 667° CC (Causales de indignidad - Ley 31643) vs Art. 725° CC (Tercio de libre disposición).
7. Ejecución de garantías: Art. 721° CPC (Mandato ejecutivo de 3 días bajo apercibimiento de remate, no Art. 720°).
8. Garantías Mobiliarias: D.L. N° 1400 y SIGM (derogada la Ley 28677).
9. Penal: D. Leg. 1585 (Prisión preventiva prognosis de pena > 5 años); Arts. IX T.P., 71.2.c y 80°-85° NCPP para defensa técnica (Art. 62° es exclusión del Fiscal); AP 06-2009/CJ-116 (control formal y sustancial acusación); AP Ext. 02-2012/CJ-116 (tutela e imputación suficiente).
════════════════════════════════════════════════════════════════\n\n`;

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

    const agentPrompt = SYSTEM_PROMPTS[agentId] || '';
    const fullSystemPrompt = 
      PERUVIAN_ANTI_HALLUCINATION_DIRECTIVE +
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

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      try {
        console.log(`[Orchestrator] Ejecutando candidato ${i + 1}/${candidates.length}: ${candidate.provider} (${candidate.model})...`);
        
        // Filtro de flujo continuo (SSE) en tiempo real para evitar fuga de alucinaciones
        const streamFilter = (isStream && sendStreamChunk) 
          ? new StreamingCitationFilter(sendStreamChunk) 
          : null;

        const result = await ProviderAdapter.executeCandidate(
          candidate,
          formattedMessages,
          isStream || false,
          streamFilter ? (chunk) => streamFilter.processChunk(chunk) : sendStreamChunk
        );

        if (streamFilter) {
          streamFilter.flush();
        }

        if (i > 0) {
          fallbackOccurred = true;
          fallbackReason = `El proveedor principal falló. Conmutado con éxito a ${candidate.provider} (${candidate.model}).`;
        }

        executionResult = {
          ...result,
          fallbackOccurred,
          fallbackReason,
        };
        break;
      } catch (err: any) {
        console.warn(`[Orchestrator] Error en candidato ${candidate.provider}:${candidate.model}:`, err.message);
        if (i === 0) {
          fallbackReason = err.message;
        }
      }
    }

    // 6. Respaldo de Emergencia si todos fallan
    if (!executionResult) {
      console.error('[Orchestrator] Todos los proveedores fallaron. Conmutando a respuesta de contingencia.');
      executionResult = {
        text: 'Estimado doctor: El sistema se encuentra temporalmente experimentando alta demanda en los servidores de inferencia. Por favor reintente su consulta en unos instantes.',
        provider: 'emergency_mock',
        model: 'static-mock',
        durationMs: Date.now() - overallStart,
        fallbackOccurred: true,
        fallbackReason: 'Agotamiento de todos los proveedores configurados',
      };
      if (isStream && sendStreamChunk) {
        sendStreamChunk(executionResult.text);
      }
    }

    // 7. Validación Jurídica y Control de Calidad Estructural
    const qualityReport = ResponseQualityController.evaluateResponse(
      executionResult.text,
      latestUserMessage,
      isDraftingRequest
    );

    // Si se agregaron rectificaciones o notas de advertencia que no se emitieron en el stream, enviarlas ahora
    if (isStream && sendStreamChunk && qualityReport.processedText !== executionResult.text) {
      const extraContent = qualityReport.processedText.slice(executionResult.text.length);
      if (extraContent) {
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

    // 10. Registro Inmutable de Consumo de Cuota
    await recordQuestionUsage(userId);

    const meta: AiOrchestratorMeta = {
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
