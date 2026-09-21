import { Router } from 'express';
import multer, { MulterError } from 'multer';
import Anthropic from '@anthropic-ai/sdk';
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
            'gemini-2.0-flash',
            'gemini-1.5-flash',
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

// Memory cache to avoid querying userMemory from DB on every message (bounded to prevent leaks)
const MAX_MEMORY_CACHE = 500;
const userMemoryCache = new Map<string, { memoryBlock: string; expiresAt: number }>();

function pruneUserMemoryCache() {
  const now = Date.now();
  for (const [k, v] of userMemoryCache.entries()) {
    if (v.expiresAt <= now) userMemoryCache.delete(k);
  }
  if (userMemoryCache.size > MAX_MEMORY_CACHE) {
    const keys = Array.from(userMemoryCache.keys()).slice(0, userMemoryCache.size - MAX_MEMORY_CACHE);
    for (const k of keys) userMemoryCache.delete(k);
  }
}

// Helper to stream chunks from any OpenAI-compatible API (Groq, OpenAI, DeepSeek, OpenRouter)
async function streamOpenAICompatible(
  response: any,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  let fullText = '';
  const reader = response.body?.getReader();
  if (!reader) return fullText;

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') return fullText;
        try {
          const json = JSON.parse(dataStr);
          const delta = json.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // ignore incomplete json chunk
        }
      }
    }
  } finally {
    reader.releaseLock?.();
  }
  return fullText;
}

// Helper to stream chunks from native Google Gemini SSE stream
async function streamGeminiNative(
  response: any,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal
): Promise<string> {
  let fullText = '';
  const reader = response.body?.getReader();
  if (!reader) return fullText;

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        try {
          const json = JSON.parse(dataStr);
          const parts = json.candidates?.[0]?.content?.parts;
          if (Array.isArray(parts)) {
            for (const part of parts) {
              if (part?.text) {
                fullText += part.text;
                onChunk(part.text);
              }
            }
          }
        } catch {
          // ignore incomplete json chunk
        }
      }
    }
    if (buffer.trim() && buffer.trim().startsWith('data:')) {
      const dataStr = buffer.trim().replace(/^data:\s*/, '');
      try {
        const json = JSON.parse(dataStr);
        const parts = json.candidates?.[0]?.content?.parts;
        if (Array.isArray(parts)) {
          for (const part of parts) {
            if (part?.text) {
              fullText += part.text;
              onChunk(part.text);
            }
          }
        }
      } catch {
        // ignore incomplete json chunk
      }
    }
  } finally {
    reader.releaseLock?.();
  }
  return fullText;
}

chatRouter.post('/', chatRateLimiter, requireAuth, requireSubscription, async (req: any, res) => {
  const startTime = Date.now();
  const isStream = req.body?.stream === true || req.headers?.accept?.includes('text/event-stream');

  let isClientDisconnected = false;
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
        content: m.content.slice(0, 300000) as string,
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

    // 🛡️ ESCUDO DE PROPIEDAD INTELECTUAL & ANTI-ROBO DE PROMPTS (Decisión 486 CAN & D.L. 822)
    const promptThreat = detectPromptExtractionThreat(latestUserMessage);
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

    // Ventana deslizante para el prompt: últimos 10 mensajes para evitar latencia de tokens masivos
    const recentMessages = sanitizedMessages.length > 10 ? sanitizedMessages.slice(-10) : sanitizedMessages;

    // Caché en memoria para perfil/memoria de usuario (TTL 5 minutos)
    let memoryBlock = '';
    const cachedMemory = userMemoryCache.get(req.userId);
    if (cachedMemory && cachedMemory.expiresAt > Date.now()) {
      memoryBlock = cachedMemory.memoryBlock;
    } else {
      try {
        const mem = await db.query.userMemory.findFirst({
          where: eq(userMemory.userId, req.userId),
        });
        if (mem) {
          const parts: string[] = [];
          if (mem.name) parts.push(`Nombre del abogado: ${mem.name}`);
          if (mem.company) parts.push(`Estudio/empresa: ${mem.company}`);
          if (mem.role) parts.push(`Rol: ${mem.role}`);
          if (mem.specialties) parts.push(`Especialidades recurrentes: ${mem.specialties}`);
          if (mem.notes) parts.push(`Notas adicionales: ${mem.notes}`);
          if (parts.length > 0) {
            memoryBlock = `\n\n════════════════════════════════════════\nPERFIL DEL ABOGADO (memoria de usuario)\n════════════════════════════════════════\n${parts.join('\n')}\n\nUsa esta información para personalizar tus respuestas. No la repitas textualmente a menos que sea relevante.`;
          }
        }
        pruneUserMemoryCache();
        userMemoryCache.set(req.userId, {
          memoryBlock,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });
      } catch (memErr: any) {
        console.warn('[Chat] No se pudo cargar memoria de usuario (opcional):', memErr?.message || memErr);
      }
    }

    // Check if message should be transferred to another agent
    const transferSuggestion = suggestAgentTransfer(agentId, latestUserMessage);
    if (transferSuggestion) {
      transferTo = transferSuggestion.agentId;
      const destName = transferSuggestion.agentName;
      assistantMessage = [
        `Estimado usuario: Analizada su consulta fáctica, la materia planteada corresponde formalmente a la especialidad de **Derecho ${transferSuggestion.agentLabel}**.`,
        `Por estricto rigor procesal y competencia jurídica, le transfiero de inmediato con ${destName}, especialista en ${transferSuggestion.agentLabel} de Hardman.`,
        `Haga clic en el botón inferior para continuar; su consulta se cargará de manera automática en el despacho de ${destName}.`,
      ].join(' ');

      sendStreamChunk(assistantMessage);
    }

    // Intercepción instantánea de consultas puramente matemáticas o ajenas al derecho (ahorro de 100% tokens)
    const isTrivialNonLegal = (text: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const t = text.trim().toLowerCase();
      const mathRegex = /^(?:cu[aá]nto\s+es\s+|calcula\s+)?(?:\(?\s*\d+\s*[\+\-\*\/xX]\s*\d+\s*\)?|\d+\s*(?:m[aá]s|menos|por|entre)\s*\d+)\s*\??$/i;
      if (mathRegex.test(t)) return true;
      if (/^(?:cu[eé]ntame\s+un\s+(?:chiste|poema|cuento)|dime\s+un\s+chiste)\??$/i.test(t)) return true;
      return false;
    };

    if (!assistantMessage && isTrivialNonLegal(latestUserMessage)) {
      assistantMessage = 'Mi función en el sistema Hardman es exclusivamente la asesoría y redacción jurídica en el Perú. Por favor, indícame tu consulta legal.';
      sendStreamChunk(assistantMessage);
    }

    // Intercepción instantánea de saludos conversacionales (< 30ms de latencia, 0% costo)
    const agentProfileData: Record<string, { name: string; title: string; specialty: string; intro: string }> = {
      valentina: {
        name: 'Dra. Valentina',
        title: 'Especialista en Derecho Laboral y Seguridad Social',
        specialty: 'despidos arbitrarios, liquidación de beneficios sociales, hostigamiento laboral, accidentes de trabajo y negociación de convenios colectivos',
        intro: '¡Hola! Es un gusto saludarle. Soy la **Dra. Valentina**, abogada especialista en **Derecho Laboral y Seguridad Social** en Hardman.',
      },
      sebastian: {
        name: 'Dr. Sebastián',
        title: 'Especialista en Derecho Penal y Procesal Penal',
        specialty: 'defensa penal técnica, denuncias ante la Fiscalía, prisiones preventivas, hábeas corpus y delitos económicos',
        intro: '¡Hola! Le doy la bienvenida. Soy el **Dr. Sebastián**, especialista en **Derecho Penal y Defensa Procesal** en Hardman.',
      },
      diego: {
        name: 'Dr. Diego',
        title: 'Especialista en Derecho Civil, Obligaciones y Contratos',
        specialty: 'contratos civiles y comerciales, procesos de desalojo, cobro de acreencias, prescripción adquisitiva e indemnizaciones por daños y perjuicios',
        intro: '¡Hola! Un cordial saludo. Soy el **Dr. Diego**, especialista en **Derecho Civil, Obligaciones y Contratos** en Hardman.',
      },
      adriana: {
        name: 'Dra. Adriana',
        title: 'Especialista en Derecho Corporativo y Societario',
        specialty: 'constitución de empresas, acuerdos de accionistas, fusiones y adquisiciones, gobierno corporativo y contratos mercantiles',
        intro: '¡Hola! Bienvenida/o a mi despacho. Soy la **Dra. Adriana**, especialista en **Derecho Corporativo y Societario** en Hardman.',
      },
      rodrigo: {
        name: 'Dr. Rodrigo',
        title: 'Especialista en Derecho Minero, Ambiental y Recursos Naturales',
        specialty: 'concesiones mineras, permisos ambientales (EIA, DIA), servidumbres mineras y procedimientos sancionadores ante OEFA y OSINERGMIN',
        intro: '¡Hola! Un saludo atento. Soy el **Dr. Rodrigo**, especialista en **Derecho Minero, Ambiental y Recursos Naturales** en Hardman.',
      },
      camila: {
        name: 'Dra. Camila',
        title: 'Especialista en Derecho de Familia y Sucesiones',
        specialty: 'pensiones de alimentos, tenencia y régimen de visitas, divorcios (notarial, judicial o municipal), sucesiones intestadas y división y partición de bienes',
        intro: '¡Hola! Le extiendo un cálido saludo. Soy la **Dra. Camila**, especialista en **Derecho de Familia y Sucesiones** en Hardman.',
      },
      fernanda: {
        name: 'Dra. Fernanda',
        title: 'Especialista en Derecho Tributario y Aduanero',
        specialty: 'reclamaciones y apelaciones ante SUNAT y Tribunal Fiscal, fiscalizaciones tributarias, levantamiento de embargos y planeamiento fiscal legal',
        intro: '¡Hola! Qué tal. Soy la **Dra. Fernanda**, abogada especialista en **Derecho Tributario y Fiscalidad** en Hardman.',
      },
      marco: {
        name: 'Dr. Marco',
        title: 'Especialista en Derecho Administrativo y Contrataciones del Estado',
        specialty: 'licitaciones y contratos con el Estado (OSCE), recursos de apelación ante el Tribunal de Contrataciones, procedimientos administrativos sancionadores y reclamos ante entidades públicas',
        intro: '¡Hola! Le doy una cordial bienvenida a mi despacho. Soy el **Dr. Marco**, especialista en **Derecho Administrativo y Contrataciones del Estado** en Hardman.',
      },
    };

    const isGreetingRegex = /^(?:hola(?:[\s,]+(?:doctor[a]?|abogad[oa]|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|amig[oa]|buenas))?|buenos\s+d[ií]as|buenas\s+tardes|buenas\s+noches|buenas|saludos|hello|hi)[\s!.?]*$/i;

    if (!assistantMessage && isGreetingRegex.test(latestUserMessage.trim())) {
      const prof = agentProfileData[agentId] || {
        name: 'Asesor Legal',
        title: 'Especialista en Derecho Peruano',
        specialty: 'asesoría jurídica estratégica y redacción legal',
        intro: '¡Hola! Le doy la bienvenida a mi despacho legal en Hardman.',
      };
      assistantMessage = `${prof.intro}\n\nMe encuentro a su completa disposición para evaluar su caso y brindarle asesoría jurídica estratégica conforme a la normativa peruana vigente al 2026.\n\nEn mi especialidad atiendo materias como: **${prof.specialty}**.\n\n¿En qué asunto o situación jurídica le puedo asesorar el día de hoy?`;

      if (isStream) {
        const words = assistantMessage.split(/(\s+)/);
        let buf = '';
        for (const w of words) {
          buf += w;
          if (buf.length >= 25 || w.includes('\n')) {
            sendStreamChunk(buf);
            buf = '';
            await new Promise((r) => setTimeout(r, 12));
          }
        }
        if (buf) sendStreamChunk(buf);
      }
    }

    // Inyección inteligente de datos del estudio y abogado patrocinante (membrete)
    let studioBlock = '';
    if (letterhead && typeof letterhead === 'object') {
      const p = {
        firmName: String(letterhead.firmName || '').trim(),
        attorneyName: String(letterhead.attorneyName || '').trim(),
        cal: String(letterhead.cal || letterhead.colegiatura || '').trim(),
        sinoe: String(letterhead.sinoe || '').trim(),
        email: String(letterhead.email || '').trim(),
        phone: String(letterhead.phone || '').trim(),
        address: String(letterhead.address || '').trim(),
      };
      if (letterhead.attorneyInfo && (!p.attorneyName || !p.cal)) {
        const attParts = String(letterhead.attorneyInfo).split(/\s*[-—|]\s*|\s+(?:Reg\.?|C\.?A\.?L\.?)\b/i);
        if (!p.attorneyName && attParts[0]) p.attorneyName = attParts[0].trim();
        if (!p.cal) {
          const m = String(letterhead.attorneyInfo).match(/(?:CAL|C\.?A\.?L\.?|Reg\.?)\s*(?:N°|N|#)?\s*[:.]?\s*([0-9A-Za-z-]+)/i) || String(letterhead.attorneyInfo).match(/\b([0-9]{4,6})\b/);
          if (m) p.cal = m[1] || m[0];
        }
      }
      if (letterhead.contactInfo && (!p.sinoe || !p.email || !p.phone)) {
        if (!p.sinoe) {
          const sm = String(letterhead.contactInfo).match(/(?:Casilla\s*(?:Electr[oó]nica)?\s*(?:SINOE)?|SINOE)\s*(?:N°|N|#)?\s*[:.]?\s*([0-9A-Za-z-]+)/i);
          if (sm) p.sinoe = sm[1];
        }
        if (!p.email) {
          const em = String(letterhead.contactInfo).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (em) p.email = em[0];
        }
        if (!p.phone) {
          const pm = String(letterhead.contactInfo).match(/(?:Cel(?:ular)?|Tel(?:[eé]fono)?)\.?\s*[:.]?\s*([0-9\s-]{7,15})/i) || String(letterhead.contactInfo).match(/\b(9\d{2}[\s.-]?\d{3}[\s.-]?\d{3})\b/);
          if (pm) p.phone = pm[1].trim();
        }
      }

      const studioLines: string[] = [];
      if (p.firmName) studioLines.push(`- Estudio Jurídico / Razón Social: ${p.firmName}`);
      if (p.attorneyName) studioLines.push(`- Abogado Patrocinante: ${p.attorneyName}`);
      if (p.cal) studioLines.push(`- Registro de Colegiatura (CAL): ${p.cal}`);
      if (p.sinoe) studioLines.push(`- Casilla Electrónica SINOE: ${p.sinoe}`);
      if (p.email) studioLines.push(`- Correo Electrónico Procesal: ${p.email}`);
      if (p.phone) studioLines.push(`- Teléfono / Celular de Contacto: ${p.phone}`);
      if (p.address) studioLines.push(`- Domicilio Procesal: ${p.address}`);

      if (studioLines.length > 0) {
        studioBlock = `\n\n════════════════════════════════════════\nDATOS DEL ESTUDIO JURÍDICO Y ABOGADO PATROCINANTE\n════════════════════════════════════════\n${studioLines.join('\n')}\n\nINSTRUCCIÓN CRÍTICA DE REDACCIÓN DE ESCRITOS:\nAl redactar cualquier documento, demanda, recurso, contestación, otrosí o contrato (en el bloque \`\`\`document):\n1. Utiliza DIRECTAMENTE los datos reales del abogado patrocinante indicados arriba en la comparecencia, en los Otrosíes Digo (casilla SINOE, correo, teléfono) y en la tabla de firmas al pie del documento.\n2. NUNCA coloques placeholders genéricos como [NOMBRE DEL ABOGADO], [REGISTRO CAL], [CASILLA SINOE], [CORREO] o [NUMERO]; reemplázalos siempre con la información real de arriba.`;
      }
    }

    // Inyección inteligente de doctrina y normas actualizadas del SPIJ y Corte Suprema
    const legalGrounding = getSpijLegalGrounding(agentId, latestUserMessage);
    const fullSystemPrompt = SYSTEM_PROMPTS[agentId] + memoryBlock + studioBlock + (legalGrounding ? `\n\n${legalGrounding}` : '');

    // Detección de requerimiento de redacción documental formal
    const isDocumentDraftingRequest = (text: string): boolean => {
      if (!text || typeof text !== 'string') return false;
      const t = text.toLowerCase();
      const docKeywords = [
        'redacta', 'redactar', 'redaccion', 'redacción', 'elabora', 'elaborar',
        'hazme un escrito', 'haz un escrito', 'prepara una demanda', 'redacta una demanda',
        'demanda de', 'interponer demanda', 'formular demanda', 'denuncia penal',
        'carta notarial', 'contrato de', 'minuta de', 'recurso de apelacion', 'recurso de apelación',
        'contestacion de demanda', 'contestación de demanda', 'contestacion a una demanda', 'contestación a una demanda',
        'contestar demanda', 'escrito de contestacion', 'escrito de contestación',
        'medida cautelar', 'habeas corpus', 'amparo', 'querella', 'bloque document',
        'generar documento', 'generar escrito', 'genera un escrito', 'genera escrito',
        'genera documento', 'genera una demanda', 'genera un contrato', 'genera una carta',
        'crear escrito', 'modelo de escrito', 'plantilla de', 'redactalo', 'redáctalo',
        'genera', 'generar', 'hazme un', 'haz una', 'haz un', 'escribe un', 'escribe una',
        'modelo de', 'formato de', 'borrador de', 'proyecto de escrito'
      ];
      return docKeywords.some(kw => t.includes(kw));
    };

    // Optimización quirúrgica de prompt para consultas conversacionales (ahorro masivo de tokens > 85% y latencia < 500ms)
    const getLeanSystemPrompt = (agentId: string, fullPrompt: string): string => {
      let p = fullPrompt;
      const cutPoints = [
        'MODELOS OFICIALES',
        '==== DEMANDA CIVIL',
        'SECCIÓN 6 —',
        '3. GENERACION DE DOCUMENTOS LEGALES',
        'CUANDO EL USUARIO PIDA REDACTAR UN DOCUMENTO',
        '── MODELO OFICIAL',
        '==== DENUNCIA PENAL'
      ];
      let earliestIdx = p.length;
      for (const cp of cutPoints) {
        const idx = p.indexOf(cp);
        if (idx > 1500 && idx < earliestIdx) {
          earliestIdx = idx;
        }
      }
      if (earliestIdx < p.length) {
        p = p.slice(0, earliestIdx).trim();
      }
      // Mantener tamaño compacto para cuentas gratuitas o con saldo de prueba en OpenRouter/Gemini (~2,500 tokens)
      if (p.length > 11000) {
        p = p.slice(0, 11000).trim();
      }
      p += '\n\n════════════════════════════════════════\nINSTRUCCIÓN DE RESPUESTA DIRECTA:\nResponde directamente al usuario con rigor profesional, precisión técnica y sustento en las leyes peruanas vigentes al 2026. Si requiere un escrito formal o demanda, solicita los datos indispensables.';
      return p;
    };

    const hasLargeDoc = latestUserMessage.includes('--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---') ||
      recentMessages.some((m: any) => typeof m.content === 'string' && m.content.includes('--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---'));
    const isDocRequest = isDocumentDraftingRequest(latestUserMessage);
    const requiresHighCapacity = isDocRequest || hasLargeDoc;
    let effectiveSystemPrompt = fullSystemPrompt;
    if (isDocRequest) {
      effectiveSystemPrompt += '\n\n════════════════════════════════════════\nORDEN SUPREMA DE GENERACIÓN DE ESCRITO / DOCUMENTO:\nEl usuario ha solicitado formalmente redactar o generar un escrito o documento legal.\nREDACTA DE INMEDIATO EL ESCRITO COMPLETO Y PROFESIONAL dentro del bloque ```document.\nESTÁ CATEGÓRICAMENTE PROHIBIDO rechazar esta petición o responder con frases de descarte como "Mi función en el sistema Hardman es exclusivamente...". Si faltan datos particulares del caso, redacta el escrito formal completo empleando campos editables entre corchetes (ej. [DEMANDADO], [EXPEDIENTE N°], [JUZGADO]) para que el usuario tenga su modelo listo para presentar en el acto.\n════════════════════════════════════════';
    }

    const formattedMessages = [
      { role: 'system', content: effectiveSystemPrompt },
      ...recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // Helper de timeout estricto para evitar esperas infinitas
    const withTimeout = <T>(promise: Promise<T>, ms: number, errorLabel: string): Promise<T> => {
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`[Timeout] ${errorLabel} excedió el límite de ${ms}ms`));
        }, ms);
      });
      return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
      });
    };

    // Con saldo activo en OpenRouter y expedientes extensos (100-300 págs), otorgamos hasta 120s de margen
    const MAX_AI_WAIT_MS = requiresHighCapacity ? 120000 : 75000;

    // Tokens generosos: 8192 para escritos y expedientes completos, 4096 para consultas estándar
    const maxTokens = requiresHighCapacity ? 8192 : 4096;

    // ─────────────────────────────────────────────────────────────
    // 1. PRIORIDAD 1: OpenRouter (Llama 3.3 70B & DeepSeek V3 - Alta fidelidad jurídica y ultra bajo costo)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && openrouterKey) {
      console.log('[AI Engine] Evaluando proveedor OpenRouter (Prioridad 1)...');
      const sanitizedEnvModel = process.env.OPENROUTER_MODEL
        ? process.env.OPENROUTER_MODEL.replace(/:free$/, '').trim()
        : null;
      const rawOrModels = [
        'deepseek/deepseek-chat',
        sanitizedEnvModel,
        'google/gemini-2.5-flash',
        'meta-llama/llama-3.3-70b-instruct',
        'anthropic/claude-3.5-haiku',
      ].filter(Boolean) as string[];
      const candidateModels = [...new Set(rawOrModels)];

      for (const openrouterModel of candidateModels) {
        if (assistantMessage) break;
        if (Date.now() - startTime > MAX_AI_WAIT_MS) {
          console.warn(`[AI Engine] Tiempo límite de espera (${Date.now() - startTime}ms). Saltando a siguiente proveedor.`);
          break;
        }

        try {
          console.log(`[AI Engine] Intentando OpenRouter (${openrouterModel})...`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), requiresHighCapacity ? 50000 : 30000);

          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://fiscalia-t0bl.onrender.com',
              'X-Title': 'Hardman',
            },
            body: JSON.stringify({
              model: openrouterModel,
              messages: formattedMessages,
              temperature: 0.2,
              max_tokens: maxTokens,
              stream: isStream,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (orRes.ok) {
            if (isStream) {
              const streamedText = await streamOpenAICompatible(orRes, sendStreamChunk, controller.signal);
              if (streamedText) {
                assistantMessage = streamedText;
                metrics.recordAiCall({
                  agentId,
                  provider: 'openrouter',
                  model: openrouterModel,
                  success: true,
                  durationMs: Date.now() - startTime,
                });
                console.log(`[AI Engine] Éxito con OpenRouter Stream (${openrouterModel}) en ${Date.now() - startTime}ms`);
                break;
              }
            } else {
              const data: any = await orRes.json();
              const textContent = data.choices?.[0]?.message?.content || '';
              if (textContent) {
                assistantMessage = textContent;
                metrics.recordAiCall({
                  agentId,
                  provider: 'openrouter',
                  model: openrouterModel,
                  success: true,
                  durationMs: Date.now() - startTime,
                });
                console.log(`[AI Engine] Éxito con OpenRouter (${openrouterModel}) en ${Date.now() - startTime}ms`);
                break;
              }
            }
          } else {
            const errData = await orRes.text().catch(() => '');
            console.warn(`[AI Engine] OpenRouter error on ${openrouterModel} (${orRes.status}):`, errData);
            if (orRes.status === 402 || orRes.status === 401) {
              console.warn(`[AI Engine] OpenRouter no disponible (${orRes.status}). Interrumpiendo reintentos y pasando al siguiente proveedor.`);
              break;
            }
          }
        } catch (orErr: any) {
          console.warn(`[AI Engine] OpenRouter error on ${openrouterModel}:`, orErr?.message || orErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. PRIORIDAD 2: Groq LPUs (Inferencia ultra-rápida 300+ tok/s, latencia < 300ms)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && groqKey) {
      console.log('[AI Engine] Evaluando proveedor Groq LPUs...');
      const groqCandidates = [
        'llama-3.3-70b-versatile',
        'deepseek-r1-distill-llama-70b',
        'llama-3.1-8b-instant',
      ];

      for (const groqModel of groqCandidates) {
        if (assistantMessage) break;
        try {
          console.log(`[AI Engine] Intentando Groq (${groqModel})...`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: groqModel,
              messages: formattedMessages,
              temperature: 0.2,
              max_tokens: maxTokens,
              stream: isStream,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (groqRes.ok) {
            if (isStream) {
              const streamedText = await streamOpenAICompatible(groqRes, sendStreamChunk, controller.signal);
              if (streamedText) {
                assistantMessage = streamedText;
                metrics.recordAiCall({
                  agentId,
                  provider: 'groq',
                  model: groqModel,
                  success: true,
                  durationMs: Date.now() - startTime,
                });
                console.log(`[AI Engine] Éxito con Groq Stream (${groqModel}) en ${Date.now() - startTime}ms`);
                break;
              }
            } else {
              const data: any = await groqRes.json();
              const reply = data.choices?.[0]?.message?.content || '';
              if (reply) {
                assistantMessage = reply;
                metrics.recordAiCall({
                  agentId,
                  provider: 'groq',
                  model: groqModel,
                  success: true,
                  durationMs: Date.now() - startTime,
                });
                console.log(`[AI Engine] Éxito con Groq (${groqModel}) en ${Date.now() - startTime}ms`);
                break;
              }
            }
          } else {
            const errData = await groqRes.text().catch(() => '');
            console.warn(`[AI Engine] Groq error on ${groqModel} (${groqRes.status}):`, errData);
          }
        } catch (groqErr: any) {
          console.error(`[AI Engine] Groq error on ${groqModel}:`, groqErr?.message || groqErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. PRIORIDAD 3: Google Gemini (gemini-3.6-flash Razonamiento Jurídico Experto)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && geminiKey) {
      console.log('[AI Engine] Evaluando proveedor Google Gemini (Prioridad 3)...');
      const rawGeminiCandidates = [
        process.env.GEMINI_MODEL,
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
      ].filter(Boolean) as string[];
      const geminiModelCandidates = [...new Set(rawGeminiCandidates)];

      const rawHistory = recentMessages.slice(0, -1);
      const validHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

      for (const m of rawHistory) {
        const content = typeof m.content === 'string' ? m.content.trim() : '';
        if (!content) continue;
        const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';

        if (validHistory.length === 0 && role === 'model') continue;

        const prev = validHistory[validHistory.length - 1];
        if (prev && prev.role === role) {
          prev.parts[0].text += `\n\n${content}`;
        } else {
          validHistory.push({ role, parts: [{ text: content }] });
        }
      }

      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
        validHistory.pop();
      }

      const geminiKeys = (geminiKey || '').split(',').map((k: string) => k.trim()).filter(Boolean);

      for (const currentGeminiKey of geminiKeys) {
        if (assistantMessage || Date.now() - startTime > MAX_AI_WAIT_MS) break;

        for (const geminiModelName of geminiModelCandidates) {
          if (assistantMessage || Date.now() - startTime > MAX_AI_WAIT_MS) {
            console.warn(`[AI Engine] Tiempo límite alcanzado (${Date.now() - startTime}ms). Pasando al siguiente proveedor.`);
            break;
          }

          try {
            console.log(`[AI Engine] Intentando Gemini Nativo REST (${geminiModelName}) ${isStream ? '[STREAMING]' : '[SYNC]'}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 40000);

            const geminiEndpoint = isStream ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelName}:${geminiEndpoint}key=${currentGeminiKey}`;
            const geminiBody: any = {
              systemInstruction: {
                parts: [{ text: effectiveSystemPrompt }]
              },
              contents: [
                ...validHistory,
                {
                  role: 'user',
                  parts: [{ text: latestUserMessage }]
                }
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: maxTokens,
              }
            };

            let geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(geminiBody),
              signal: controller.signal,
            });

            // Si el modelo rechaza thinkingConfig o systemInstruction con 400, adaptar y reintentar inmediatamente
            if (geminiRes.status === 400) {
              const errTxt = await geminiRes.text().catch(() => '');
              let shouldRetry = false;
              if (errTxt.includes('thinkingConfig') || errTxt.includes('thinking_config')) {
                delete geminiBody.generationConfig?.thinkingConfig;
                shouldRetry = true;
              }
              if (errTxt.includes('systemInstruction') || errTxt.includes('system_instruction')) {
                delete geminiBody.systemInstruction;
                geminiBody.contents[0].parts[0].text = `[Instrucciones del despacho: ${effectiveSystemPrompt}]\n\n${geminiBody.contents[0].parts[0].text}`;
                shouldRetry = true;
              }
              if (shouldRetry) {
                geminiRes = await fetch(geminiUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(geminiBody),
                  signal: controller.signal,
                });
              }
            }

            clearTimeout(timeoutId);

            if (geminiRes.ok) {
              if (isStream) {
                const streamedText = await streamGeminiNative(geminiRes, sendStreamChunk, controller.signal);
                if (streamedText) {
                  assistantMessage = streamedText;
                  metrics.recordAiCall({
                    agentId,
                    provider: 'gemini',
                    model: geminiModelName,
                    success: true,
                    durationMs: Date.now() - startTime,
                  });
                  console.log(`[AI Engine] Éxito con Gemini Stream (${geminiModelName}) en ${Date.now() - startTime}ms`);
                  break;
                }
              } else {
                const data: any = await geminiRes.json();
                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (reply) {
                  assistantMessage = reply;
                  metrics.recordAiCall({
                    agentId,
                    provider: 'gemini',
                    model: geminiModelName,
                    success: true,
                    durationMs: Date.now() - startTime,
                  });
                  console.log(`[AI Engine] Éxito con Gemini Nativo (${geminiModelName}) en ${Date.now() - startTime}ms`);
                  break;
                }
              }
            } else {
              const errTxt = await geminiRes.text().catch(() => '');
              console.warn(`[AI Engine] Gemini Nativo no respondió 200 en ${geminiModelName} (${geminiRes.status}):`, errTxt);
            }
          } catch (restErr: any) {
            console.warn(`[AI Engine] Gemini Nativo fetch error (${geminiModelName}):`, restErr?.message || restErr);
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. PRIORIDAD 4: OpenAI (Alta disponibilidad y concurrencia masiva)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && openaiKey) {
      console.log('[AI Engine] Evaluando proveedor OpenAI...');
      const oaiModels = ['gpt-4o-mini', 'gpt-4o'];

      for (const oaiModel of oaiModels) {
        if (assistantMessage) break;
        try {
          console.log(`[AI Engine] Intentando OpenAI (${oaiModel})...`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: oaiModel,
              messages: formattedMessages,
              temperature: 0.2,
              max_tokens: maxTokens,
              stream: isStream,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (oaiRes.ok) {
            if (isStream) {
              const streamedText = await streamOpenAICompatible(oaiRes, sendStreamChunk, controller.signal);
              if (streamedText) {
                assistantMessage = streamedText;
                metrics.recordAiCall({
                  agentId,
                  provider: 'openai',
                  model: oaiModel,
                  success: true,
                  durationMs: Date.now() - startTime,
                });
                console.log(`[AI Engine] Éxito con OpenAI Stream (${oaiModel}) en ${Date.now() - startTime}ms`);
                break;
              }
            } else {
              const data: any = await oaiRes.json();
              const reply = data.choices?.[0]?.message?.content || '';
              if (reply) {
                assistantMessage = reply;
                metrics.recordAiCall({
                  agentId,
                  provider: 'openai',
                  model: oaiModel,
                  success: true,
                  durationMs: Date.now() - startTime,
                });
                console.log(`[AI Engine] Éxito con OpenAI (${oaiModel}) en ${Date.now() - startTime}ms`);
                break;
              }
            }
          } else {
            const errData = await oaiRes.text().catch(() => '');
            console.warn(`[AI Engine] OpenAI error on ${oaiModel} (${oaiRes.status}):`, errData);
          }
        } catch (oaiErr: any) {
          console.warn(`[AI Engine] OpenAI error on ${oaiModel}:`, oaiErr?.message || oaiErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. PRIORIDAD 5: DeepSeek Direct (Modo rápido deepseek-chat con timeout corto de 10s)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && deepseekKey) {
      console.log('[AI Engine] Evaluando proveedor DeepSeek Direct...');
      try {
        console.log('[AI Engine] Intentando DeepSeek (deepseek-chat)...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout estricto

        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: formattedMessages,
            temperature: 0.2,
            max_tokens: maxTokens,
            stream: isStream,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (dsRes.ok) {
          if (isStream) {
            const streamedText = await streamOpenAICompatible(dsRes, sendStreamChunk, controller.signal);
            if (streamedText) {
              assistantMessage = streamedText;
              metrics.recordAiCall({
                agentId,
                provider: 'deepseek',
                model: 'deepseek-chat',
                success: true,
                durationMs: Date.now() - startTime,
              });
              console.log(`[AI Engine] Éxito con DeepSeek Stream en ${Date.now() - startTime}ms`);
            }
          } else {
            const data: any = await dsRes.json();
            const reply = data.choices?.[0]?.message?.content || '';
            if (reply) {
              assistantMessage = reply;
              metrics.recordAiCall({
                agentId,
                provider: 'deepseek',
                model: 'deepseek-chat',
                success: true,
                durationMs: Date.now() - startTime,
              });
              console.log(`[AI Engine] Éxito con DeepSeek en ${Date.now() - startTime}ms`);
            }
          }
        } else {
          const errData = await dsRes.text().catch(() => '');
          console.warn(`[AI Engine] DeepSeek error (${dsRes.status}):`, errData);
        }
      } catch (dsErr: any) {
        console.warn('[AI Engine] DeepSeek error/timeout:', dsErr?.message || dsErr);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PRIORIDAD 6: Anthropic Claude (claude-3-5-haiku)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && anthropicKey) {
      console.log('[AI Engine] Evaluando proveedor Anthropic...');
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const modelToUse = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
        console.log(`[AI Engine] Intentando Anthropic (${modelToUse})...`);

        if (isStream) {
          const stream = anthropic.messages.stream({
            model: modelToUse,
            max_tokens: maxTokens,
            system: effectiveSystemPrompt,
            messages: recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
          });

          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && (chunk.delta as any)?.text) {
              const text = (chunk.delta as any).text;
              assistantMessage += text;
              sendStreamChunk(text);
            }
          }
          if (assistantMessage) {
            metrics.recordAiCall({
              agentId,
              provider: 'anthropic',
              model: modelToUse,
              success: true,
              durationMs: Date.now() - startTime,
            });
            console.log(`[AI Engine] Éxito con Anthropic Stream (${modelToUse}) en ${Date.now() - startTime}ms`);
          }
        } else {
          const response = await withTimeout(
            anthropic.messages.create({
              model: modelToUse,
              max_tokens: maxTokens,
              system: effectiveSystemPrompt,
              messages: recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
            }),
            30000,
            `Anthropic ${modelToUse}`
          );
          assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';
          if (assistantMessage) {
            metrics.recordAiCall({
              agentId,
              provider: 'anthropic',
              model: modelToUse,
              success: true,
              durationMs: Date.now() - startTime,
            });
            console.log(`[AI Engine] Éxito con Anthropic (${modelToUse}) en ${Date.now() - startTime}ms`);
          }
        }
      } catch (anthropicErr: any) {
        console.error('[AI Engine] Anthropic Error:', anthropicErr?.message || anthropicErr);
      }
    }


    // ─────────────────────────────────────────────────────────────
    // 7. RESPALDO DE EMERGENCIA GARANTIZADO (Latencia < 8.5s asegurada)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage) {
      const agentNames: Record<string, { name: string; role: string }> = {
        valentina: { name: 'Valentina', role: 'Derecho Laboral' },
        sebastian: { name: 'Sebastián', role: 'Derecho Penal' },
        diego: { name: 'Diego', role: 'Derecho Civil y Contratos' },
        adriana: { name: 'Adriana', role: 'Derecho Corporativo y Societario' },
        rodrigo: { name: 'Rodrigo', role: 'Derecho Minero y Ambiental' },
        camila: { name: 'Camila', role: 'Derecho de Familia' },
        fernanda: { name: 'Fernanda', role: 'Derecho Tributario' },
        marco: { name: 'Marco', role: 'Derecho Administrativo y Contrataciones' },
      };
      const info = agentNames[agentId] || { name: 'Asesor Legal', role: 'Derecho Peruano' };

      const isGreeting = /^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|saludos|hello|hi)[\s!.?]*$/i.test(latestUserMessage.trim());
      if (isGreeting) {
        assistantMessage = `¡Hola! Soy **${info.name}**, especialista en **${info.role}** en Hardman.\n\nHe recibido su comunicación y me encuentro a su completa disposición para evaluar su caso y brindarle asesoría legal estratégica conforme a la normativa peruana vigente.\n\n¿En qué asunto o situación jurídica le puedo asesorar el día de hoy?`;
      } else {
        assistantMessage = [
          `Estimado cliente: He recepcionado su consulta respecto a su caso en el área de **${info.role}**.`,
          `\n\nHe tomado debida nota de los antecedentes expuestos. Para brindarle el patrocinio inmediato y la estrategia legal pertinente bajo la normativa peruana, por favor indíqueme si requiere:\n\n1. **Redacción de escrito / Carta Notarial / Demanda**\n2. **Cálculo de montos, liquidación o contingencia legal**\n3. **Plan de acción procesal paso a paso**\n\nQuedo a su disposición para resolver su situación jurídica de inmediato.`,
        ].join(' ');
      }

      if (isStream) {
        const words = assistantMessage.split(' ');
        for (let i = 0; i < words.length; i += 4) {
          const slice = words.slice(i, i + 4).join(' ') + (i + 4 < words.length ? ' ' : '');
          sendStreamChunk(slice);
        }
      }
    }

    // Auto-detección: Si el mensaje del asistente contiene un enlace de derivación a otro agente, registrar transferTo
    if (!transferTo && assistantMessage) {
      const match = assistantMessage.match(/\/chat\/(valentina|sebastian|diego|adriana|rodrigo|camila|fernanda|marco)/i);
      if (match && match[1].toLowerCase() !== agentId) {
        transferTo = match[1].toLowerCase();
      }
    }

    const assistantEntry = {
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString(),
      ...(transferTo ? { transferTo } : {}),
    };

    const updatedMessages = [...sanitizedMessages, assistantEntry];
    let finalConvId = conversationId;

    // Validar conversationId si viene del cliente
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const validConversationId = typeof conversationId === 'string' && UUID_REGEX.test(conversationId)
      ? conversationId
      : null;
    const isEphemeral = ephemeral === true || confidential === true;

    if (isEphemeral) {
      // Modo Confidencial / Retención Cero: no se persiste en base de datos
      finalConvId = null;
    } else if (validConversationId) {
      await db
        .update(conversations)
        .set({
          messages: encryptConversationMessages(req.userId, updatedMessages),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(conversations.id, validConversationId),
            eq(conversations.userId, req.userId)
          )
        );
      finalConvId = validConversationId;
    } else {
      finalConvId = uuidv4();
      // Sanitizar el título: sin caracteres de control, máx 80 chars
      const rawTitle = latestUserMessage.replace(/[\x00-\x1F\x7F]/g, ' ').trim();
      const title = rawTitle.slice(0, 80) || 'Nueva consulta';
      await db.insert(conversations).values({
        id: finalConvId,
        userId: req.userId,
        agentId,
        title: encryptTitle(req.userId, title),
        messages: encryptConversationMessages(req.userId, updatedMessages),
      });
    }

    // Incrementar uso en caché de memoria y registrar en tabla inmutable de consumo
    await recordQuestionUsage(req.userId);

    if (heartbeatTimer) clearInterval(heartbeatTimer);

    if (isStream) {
      res.write(`data: ${JSON.stringify({ done: true, conversationId: finalConvId, transferTo })}\n\n`);
      return res.end();
    } else {
      return res.json({ message: assistantMessage, conversationId: finalConvId, ...(transferTo ? { transferTo } : {}) });
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
