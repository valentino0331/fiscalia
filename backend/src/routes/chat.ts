import { AiOrchestrator } from '../ai/aiOrchestrator';
import { Router } from 'express';
import multer, { MulterError } from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { conversations, userMemory } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { requireSubscription, incrementUserUsageCache, recordQuestionUsage } from '../middleware/subscription';
import { SYSTEM_PROMPTS } from '../prompts/agents';
import { suggestAgentTransfer } from './agentRouter';
import { metrics } from '../lib/metrics';
import { generateSpeech } from '../lib/tts';
import { getSpijLegalGrounding, JURISPRUDENCE_COMPENDIUM, NORMATIVE_REFORMS_COMPENDIUM } from '../lib/spijLegalEngine';
import { getRagContext } from '../lib/ragEngine';

import { chatRateLimiter, audioRateLimiter } from '../middleware/rateLimit';
import { encryptConversationMessages, encryptTitle } from '../lib/encryption';
import { detectPromptExtractionThreat, recordSecurityIncident } from '../middleware/securityShield';

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12 MB max audio (optimizado para memoria RAM)
});


export const chatRouter = Router();

// Endpoint público para consultar el compendio de normas SPIJ y Acuerdos Plenarios vigentes (filtrable por especialista)
chatRouter.get('/spij/compendium', (req, res) => {
  const agentId = (req.query.agentId as string) || '';
  const plenaries = agentId
    ? JURISPRUDENCE_COMPENDIUM.filter((p) => p.specialistId === agentId)
    : JURISPRUDENCE_COMPENDIUM;
  const reforms = agentId
    ? NORMATIVE_REFORMS_COMPENDIUM.filter((r) => r.specialistId === agentId)
    : NORMATIVE_REFORMS_COMPENDIUM;

  res.json({
    status: 'active',
    source: 'Sistema Peruano de Información Jurídica (SPIJ - MINJUSDH) & Corte Suprema de Justicia del Perú',
    updatedTo: '2026',
    specialistFilter: agentId || 'all',
    plenariesCount: plenaries.length,
    plenaries,
    reformsCount: reforms.length,
    reforms,
  });
});

function getAudioFormat(mime: string, originalName?: string): { mimeType: string; filename: string } {
  const m = (mime || '').toLowerCase();
  const name = (originalName || '').toLowerCase();
  if (m.includes('mp4') || m.includes('m4a') || m.includes('aac') || m.includes('caf') || name.endsWith('.m4a') || name.endsWith('.mp4')) {
    return { mimeType: 'audio/mp4', filename: 'audio.m4a' };
  }
  if (m.includes('wav') || name.endsWith('.wav')) {
    return { mimeType: 'audio/wav', filename: 'audio.wav' };
  }
  if (m.includes('ogg') || name.endsWith('.ogg')) {
    return { mimeType: 'audio/ogg', filename: 'audio.ogg' };
  }
  if (m.includes('mp3') || m.includes('mpeg') || name.endsWith('.mp3')) {
    return { mimeType: 'audio/mp3', filename: 'audio.mp3' };
  }
  return { mimeType: 'audio/webm', filename: 'audio.webm' };
}

// Endpoint para transcripción de audio a texto (Speech-to-Text con IA)
chatRouter.post('/stt', audioRateLimiter, requireAuth, requireSubscription, (req: any, res: any, next: any) => {
  audioUpload.single('audio')(req, res, async (err: any) => {
    if (err) {
      return res.status(400).json({ error: 'Error al procesar archivo de audio: ' + (err.message || err) });
    }
    try {
      const file = req.file;
      let audioBuffer: Buffer | null = null;
      let rawMime = 'audio/webm';

      if (file && file.buffer) {
        audioBuffer = file.buffer;
        rawMime = file.mimetype || 'audio/webm';
      } else if (req.body?.audioBase64) {
        const base64Data = req.body.audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
        audioBuffer = Buffer.from(base64Data, 'base64');
        if (req.body.mimeType) rawMime = req.body.mimeType;
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        return res.json({ text: '' });
      }

      const { mimeType: resolvedMime, filename: resolvedFilename } = getAudioFormat(rawMime, file?.originalname);

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const openrouterKey = process.env.OPENROUTER_API_KEY;

      // 1. Intentar con OpenRouter Whisper (OpenAI-compatible) si está configurado
      if (openrouterKey) {
        try {
          const formData = new FormData();
          const fileBlob = new Blob([audioBuffer], { type: resolvedMime });
          formData.append('file', fileBlob, resolvedFilename);
          formData.append('model', 'openai/whisper-large-v3');
          formData.append('language', 'es');

          const orRes = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
            },
            body: formData,
          });

          if (orRes.ok) {
            const data = (await orRes.json()) as any;
            if (data?.text && typeof data.text === 'string' && data.text.trim()) {
              console.log('[STT] Éxito con OpenRouter Whisper');
              return res.json({ text: data.text.trim() });
            }
          } else {
            console.warn('[STT] OpenRouter response not OK:', await orRes.text().catch(() => ''));
          }
        } catch (orErr) {
          console.warn('[STT] OpenRouter STT fallback:', orErr);
        }
      }

      // 2. Intentar con Groq Whisper (ultra rápido, latencia < 300ms)
      if (groqKey) {
        try {
          const formData = new FormData();
          const fileBlob = new Blob([audioBuffer], { type: resolvedMime });
          formData.append('file', fileBlob, resolvedFilename);
          formData.append('model', 'whisper-large-v3-turbo');
          formData.append('language', 'es');
          formData.append('response_format', 'json');

          const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
            },
            body: formData,
          });

          if (groqRes.ok) {
            const data = (await groqRes.json()) as any;
            if (data?.text && typeof data.text === 'string' && data.text.trim()) {
              console.log('[STT] Éxito con Groq Whisper');
              return res.json({ text: data.text.trim() });
            }
          } else {
            console.warn('[STT] Groq response not OK:', await groqRes.text().catch(() => ''));
          }
        } catch (groqErr) {
          console.warn('[STT] Groq STT fallback:', groqErr);
        }
      }

      // 3. Intentar con OpenAI Whisper si está configurado
      if (openaiKey) {
        try {
          const formData = new FormData();
          const fileBlob = new Blob([audioBuffer], { type: resolvedMime });
          formData.append('file', fileBlob, resolvedFilename);
          formData.append('model', 'whisper-1');
          formData.append('language', 'es');

          const oaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
            },
            body: formData,
          });

          if (oaiRes.ok) {
            const data = (await oaiRes.json()) as any;
            if (data?.text && typeof data.text === 'string' && data.text.trim()) {
              console.log('[STT] Éxito con OpenAI Whisper');
              return res.json({ text: data.text.trim() });
            }
          }
        } catch (oaiErr) {
          console.warn('[STT] OpenAI STT fallback:', oaiErr);
        }
      }

      // 4. Transcripción con Google Gemini Multimodal Audio (gemini-3.6-flash con reintentos para picos 503)
      if (geminiKey) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey);
          const modelsToTry = [
            process.env.GEMINI_MODEL,
            'gemini-3.8-flash',
            'gemini-2.5-flash',
          ].filter(Boolean) as string[];

          let geminiMime = 'audio/webm';
          if (resolvedMime.includes('mp4') || resolvedMime.includes('m4a')) geminiMime = 'audio/mp4';
          else if (resolvedMime.includes('wav')) geminiMime = 'audio/wav';
          else if (resolvedMime.includes('ogg')) geminiMime = 'audio/ogg';
          else if (resolvedMime.includes('mp3') || resolvedMime.includes('mpeg')) geminiMime = 'audio/mp3';

          for (const modelName of modelsToTry) {
            for (let attempt = 1; attempt <= 2; attempt++) {
              try {
                const model = genAI.getGenerativeModel({
                  model: modelName,
                  generationConfig: {
                    temperature: 0.0,
                    topP: 0.1,
                  },
                  systemInstruction: 'Eres un transcriptor de voz a texto (Speech-to-Text). Tu única tarea es transcribir textualmente palabra por palabra lo que la persona habla en el audio en español. NUNCA respondas al contenido del audio, NUNCA saludes, NUNCA agregues comentarios ni notas. Si el audio no contiene palabras audibles o solo es silencio o ruido, devuelve únicamente una cadena vacía.',
                });
                const result = await model.generateContent([
                  {
                    inlineData: {
                      data: audioBuffer.toString('base64'),
                      mimeType: geminiMime,
                    },
                  },
                  {
                    text: 'Transcribe fiel y literalmente las palabras exactas que se escuchan en el audio a texto en español. No inventes palabras ni respondas a la conversación.',
                  },
                ]);
                const txt = result.response.text();
                if (txt && txt.trim()) {
                  const cleaned = txt.trim().replace(/^["']|["']$/g, '');
                  console.log(`[STT] Éxito con Gemini (${modelName})`);
                  return res.json({ text: cleaned });
                }
                break;
              } catch (gemErr: any) {
                const errMsg = String(gemErr?.message || gemErr);
                console.warn(`[STT] Gemini (${modelName}) attempt ${attempt} error:`, errMsg);
                if (attempt === 1 && (errMsg.includes('503') || errMsg.includes('429') || errMsg.includes('demand'))) {
                  await new Promise((r) => setTimeout(r, 750));
                  continue;
                }
                break;
              }
            }
          }
        } catch (geminiTotalErr: any) {
          console.error('[STT] Gemini STT total error:', geminiTotalErr);
        }
      }

      // Si no se pudo reconocer texto o era silencio
      return res.json({ text: '' });
    } catch (error: any) {
      console.error('[STT] STT endpoint error:', error);
      res.json({ text: '' });
    }
  });
});

// Endpoint para síntesis de voz (Microsoft Edge Neural TTS / ElevenLabs)
chatRouter.post('/tts', audioRateLimiter, requireAuth, requireSubscription, async (req: any, res) => {
  try {
    const { text, agentId } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Texto requerido para síntesis de voz' });
    }

    // Limitar longitud del texto a 2,500 caracteres para evitar sobrecarga del motor TTS
    const cleanText = text.trim().slice(0, 2500);
    const rawId = String(agentId || '').trim().toLowerCase();

    const audioBuffer = await generateSpeech(cleanText, rawId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('[TTS generation error]:', error?.message || error);
    res.status(500).json({
      error: 'No se pudo generar el audio en este momento. Por favor, reintenta en unos momentos.',
    });
  }
});

function sanitizeAiErrorMessage(err: any): string {
  const msg = (err?.message || String(err || '')).toLowerCase();
  if (
    msg.includes('quota') ||
    msg.includes('429') ||
    msg.includes('resourceexhausted') ||
    msg.includes('rate limit') ||
    msg.includes('too many requests')
  ) {
    return 'Este especialista legal está experimentando una alta demanda temporalmente. Por favor, reintenta tu consulta en unos momentos o consulta con otro especialista de Hardman.';
  }
  if (msg.includes('api key') || msg.includes('unauthorized') || msg.includes('401') || msg.includes('403')) {
    return 'El servicio de IA se encuentra en mantenimiento temporal. Por favor, reintenta en unos instantes.';
  }
  return 'Ocurrió una interrupción temporal al procesar tu consulta legal. Por favor, reintenta en unos instantes.';
}

chatRouter.post('/', chatRateLimiter, requireAuth, requireSubscription, async (req: any, res) => {
  const startTime = Date.now();
  const isStream = req.body?.stream === true || req.headers?.accept?.includes('text/event-stream');

  let isClientDisconnected = false;
  const clientAbortController = new AbortController();
  let heartbeatTimer: NodeJS.Timeout | null = null;

  // Si se solicita streaming, establecer encabezados SSE de inmediato
  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write(': stream-ready\n\n');
    (res as any).flush?.();

    // Heartbeat cada 3 segundos para mantener vivo el socket a través de Cloudflare/Render
    heartbeatTimer = setInterval(() => {
      if (!isClientDisconnected && !res.writableEnded) {
        try {
          res.write(': ping\n\n');
          (res as any).flush?.();
        } catch {
          if (heartbeatTimer) clearInterval(heartbeatTimer);
        }
      }
    }, 3000);
  }

  res.on('close', () => {
    if (!res.writableEnded) {
      isClientDisconnected = true;
    }
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  });

  let hasStartedStreaming = false;
  let assistantMessage = '';
  let transferTo: string | undefined;

  const sendStreamChunk = (chunk: string) => {
    if (isStream && chunk && !res.writableEnded) {
      hasStartedStreaming = true;
      try {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        (res as any).flush?.();
      } catch {
        isClientDisconnected = true;
      }
    }
  };

  const abortIfStreamCorrupted = (): boolean => {
    if (res.writableEnded || isClientDisconnected) return true;
    return false;
  };

  // Detección de solicitudes de continuación de respuestas previas cortadas o incompletas
  const isContinuationRequest = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    const t = text.toLowerCase().trim();
    const contRegex = /^(?:contin[uú]a|sigue|prosigue|completa|termina|continua\b|continúa\b|seguir\b|completar\b|terminar\b|te quedaste|quedaste a mitad|incomplet[oa]|no has terminado|falta\b|contin[uú]e|favor de continuar)/i;
    return contRegex.test(t) ||
      t.includes('te detuviste') ||
      t.includes('quedó cortad') ||
      t.includes('quedo cortad') ||
      t.includes('se cortó') ||
      t.includes('se corto') ||
      t.includes('clasificación niza') ||
      t.includes('clasificacion niza') ||
      t.includes('lo que sigue');
  };

  // Detección exhaustiva de requerimiento de redacción o revisión documental formal
  const isDocumentDraftingRequest = (text: string): boolean => {
    if (!text || typeof text !== 'string') return false;
    const t = text.toLowerCase();
    const docKeywords = [
      'redacta', 'redactar', 'redaccion', 'redacción', 'elabora', 'elaborar',
      'hazme un escrito', 'haz un escrito', 'hazme el escrito', 'haz el escrito',
      'dame el escrito', 'dame un escrito', 'solicito un escrito', 'solicitando un escrito',
      'necesito un escrito', 'quiero un escrito', 'hacer escrito', 'hacer escritos', 'hacer un escrito',
      'prepara una demanda', 'redacta una demanda', 'demanda de', 'interponer demanda', 'formular demanda',
      'denuncia penal', 'carta notarial', 'contrato de', 'minuta de', 'recurso de apelacion', 'recurso de apelación',
      'contestacion de demanda', 'contestación de demanda', 'contestacion a una demanda', 'contestación a una demanda',
      'contestar demanda', 'escrito de contestacion', 'escrito de contestación',
      'medida cautelar', 'habeas corpus', 'amparo', 'querella', 'bloque document',
      'solicitud de adopcion', 'solicitud de adopción', 'adopcion', 'adopción', 'adopcion de mayor', 'adopción de mayor',
      'generar documento', 'generar escrito', 'genera un escrito', 'genera escrito',
      'genera documento', 'genera una demanda', 'genera un contrato', 'genera una carta',
      'crear escrito', 'modelo de escrito', 'plantilla de', 'redactalo', 'redáctalo',
      'genera', 'generar', 'hazme un', 'haz una', 'haz un', 'escribe un', 'escribe una',
      'modelo de', 'formato de', 'borrador de', 'proyecto de escrito',
      // Subsanación de observaciones, inadmisibilidad e incidentes
      'subsanar', 'subsanacion', 'subsanación', 'subsanar inadmisibilidad', 'auto de inadmisibilidad',
      'inadmisibilidad', 'escrito de subsanacion', 'escrito de subsanación', 'observaciones de la resolución',
      'resolución n°', 'resolucion n°', 'subsanando', 'subsanamos',
      // Informes legales, dictámenes y marcas
      'informe', 'informes', 'informe legal', 'informe juridico', 'informe jurídico', 'dictamen', 'dictamen legal', 'opinion legal', 'opinión legal',
      'registro de marca', 'indecopi', 'signos distintivos', 'clasificacion de niza', 'clasificación de niza', 'niza',
      'el que yo realice', 'el que yo realize', 'el que realice', 'el que realize', 'el que hice',
      'el que redacte', 'mi escrito', 'este escrito', 'revisa mi escrito', 'revisa este escrito',
      'corrige mi escrito', 'corregir mi escrito', 'pasa a limpio', 'dale formato', 'formato de escrito',
      'sumilla:', 'expediente n°', 'expediente judicial', 'señor juez', 'señor fiscal',
      'i. petitorio', 'por tanto:', 'primer otrosi',
      // Palabras clave de revisión y auditoría de archivos adjuntos y documentos
      'revisa', 'revisalo', 'revisar', 'revisalo por favor', 'revises', 'analiza', 'analizalo', 'analízalo',
      'analizar', 'audita', 'auditalo', 'audítalo', 'auditar', 'documento', 'archivo', 'adjunto',
      'expediente', 'carpeta fiscal', 'disposicion', 'disposición', 'providencia', 'requerimiento',
      'cedula', 'cédula', 'resolucion', 'resolución', 'auto', 'sentencia', 'borrador', 'que opinas',
      'qué opinas', 'que opinas de', 'qué opinas de', 'revisa el documento', 'revises el documento',
      'necesito que revises', 'documento que te envie', 'documento que te envié',
      // Continuaciones y completación
      'continua', 'continúa', 'continuar', 'sigue', 'seguir', 'completa', 'completar', 'termina', 'terminar',
      'te quedaste', 'quedaste a mitad', 'incompleto', 'incompleta', 'no has terminado', 'falta'
    ];
    return docKeywords.some(kw => t.includes(kw));
  };

  try {
    const { agentId, messages, conversationId, letterhead, ephemeral, confidential } = req.body;

    // Validar que agentId sea un string válido y esté en el registro de prompts
    if (typeof agentId !== 'string' || !SYSTEM_PROMPTS[agentId]) {
      if (isStream) {
        res.write(`data: ${JSON.stringify({ error: 'Agente no válido' })}\n\n`);
        return res.end();
      }
      return res.status(400).json({ error: 'Agente no válido' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      if (isStream) {
        res.write(`data: ${JSON.stringify({ error: 'Mensajes requeridos' })}\n\n`);
        return res.end();
      }
      return res.status(400).json({ error: 'Mensajes requeridos' });
    }

    // Sanear mensajes: filtrar sólo role user/assistant con contenido string
    // Límite generoso de 300k chars para expedientes completos de 100-300 págs (modelos OpenRouter/Gemini soportan 128k-1M tokens)
    const sanitizedMessages = messages
      .filter((m: any) => (
        m &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
      ))
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.slice(0, 600000) as string,
        // ConversationMessage schema requires timestamp — usar el existente o generar uno
        timestamp: typeof m.timestamp === 'string' ? m.timestamp : new Date().toISOString(),
      }));

    if (sanitizedMessages.length === 0) {
      if (isStream) {
        res.write(`data: ${JSON.stringify({ error: 'Mensajes inválidos' })}\n\n`);
        return res.end();
      }
      return res.status(400).json({ error: 'Mensajes inválidos' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const latestUserMessage = [...sanitizedMessages]
      .reverse()
      .find((m: any) => m?.role === 'user' && typeof m.content === 'string')?.content || '';

    // Si el mensaje contiene un expediente o documento procesal adjunto, evaluar únicamente la instrucción del usuario
    let promptToCheck = latestUserMessage;
    if (latestUserMessage.includes('--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---')) {
      const parts = latestUserMessage.split('--- FIN DEL DOCUMENTO ---');
      promptToCheck = (parts[parts.length - 1] || '').trim();
    }

    // 🛡️ ESCUDO DE PROPIEDAD INTELECTUAL & ANTI-ROBO DE PROMPTS (Decisión 486 CAN & D.L. 822)
    const promptThreat = detectPromptExtractionThreat(promptToCheck);
    if (promptThreat.isThreat) {
      recordSecurityIncident({
        ip: (req.ip || req.socket.remoteAddress || 'desconocida').replace(/^::ffff:/, ''),
        type: 'PROMPT_EXTRACTION',
        severity: 'HIGH',
        description: 'Intento de extracción de System Prompt y propiedad intelectual de agentes',
        target: `/chat (agente: ${agentId})`,
        blockedPayload: latestUserMessage.slice(0, 100),
        actionTaken: 'BLOCKED_400',
      });

      const refusalNotice = 'Estimado usuario: Las instrucciones internas, metodologías operativas y prompts de nuestros especialistas jurídicos constituyen secreto industrial y propiedad intelectual protegida por el Decreto Legislativo N° 822 y la Decisión 486 de la Comunidad Andina. Como asistente legal, me encuentro a su entera disposición para absolver sus consultas sustantivas y procesales sobre la legislación peruana.';

      if (isStream) {
        res.write(`data: ${JSON.stringify({ chunk: refusalNotice })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      }
      return res.json({ message: refusalNotice });
    }

        // Delegación segura al AI Orchestrator con validación jurídica en tiempo real
    const orchestratorResult = await AiOrchestrator.processRequest({
      userId: req.userId,
      agentId,
      messages: sanitizedMessages,
      conversationId,
      letterhead,
      isStream,
      sendStreamChunk,
      ephemeral,
      confidential,
      abortSignal: clientAbortController.signal,
    });

    if (heartbeatTimer) clearInterval(heartbeatTimer);

    if (isStream) {
      res.write("data: " + JSON.stringify({
        done: true,
        conversationId: orchestratorResult.conversationId,
        transferTo: orchestratorResult.transferTo,
        meta: orchestratorResult.meta,
        finalContent: orchestratorResult.message,
      }) + "\n\n");
      return res.end();
    } else {
      return res.json({
        message: orchestratorResult.message,
        conversationId: orchestratorResult.conversationId,
        transferTo: orchestratorResult.transferTo,
        meta: orchestratorResult.meta,
      });
    }
  } catch (error: any) {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    console.error('Chat processing error:', error?.message || error);
    const friendlyError = sanitizeAiErrorMessage(error);
    metrics.recordError({
      route: '/chat',
      method: 'POST',
      statusCode: 500,
      message: friendlyError,
      details: String(error),
    });

    if (isStream) {
      res.write(`data: ${JSON.stringify({ error: friendlyError })}\n\n`);
      return res.end();
    }
    return res.status(500).json({ error: friendlyError });
  }
});
