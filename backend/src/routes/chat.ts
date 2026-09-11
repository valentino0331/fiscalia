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

      // 1. Intentar con Groq Whisper (ultra rápido, latencia < 300ms)
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
              return res.json({ text: data.text.trim() });
            }
          } else {
            console.warn('[STT] Groq response not OK:', await groqRes.text().catch(() => ''));
          }
        } catch (groqErr) {
          console.warn('[STT] Groq STT fallback:', groqErr);
        }
      }

      // 2. Intentar con OpenAI Whisper si está configurado
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
              return res.json({ text: data.text.trim() });
            }
          }
        } catch (oaiErr) {
          console.warn('[STT] OpenAI STT fallback:', oaiErr);
        }
      }

      // 3. Transcripción con Google Gemini Multimodal Audio (literal, sin alucinaciones)
      if (geminiKey) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey);
          const modelsToTry = [
            process.env.GEMINI_MODEL,
            'gemini-2.5-flash',
            'gemini-2.0-flash-exp',
            'gemini-1.5-flash-latest',
          ].filter(Boolean) as string[];

          let geminiMime = 'audio/webm';
          if (resolvedMime.includes('mp4') || resolvedMime.includes('m4a')) geminiMime = 'audio/mp4';
          else if (resolvedMime.includes('wav')) geminiMime = 'audio/wav';
          else if (resolvedMime.includes('ogg')) geminiMime = 'audio/ogg';
          else if (resolvedMime.includes('mp3') || resolvedMime.includes('mpeg')) geminiMime = 'audio/mp3';

          for (const modelName of modelsToTry) {
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
                return res.json({ text: cleaned });
              }
            } catch (gemErr: any) {
              console.warn(`[STT] Gemini (${modelName}) error:`, gemErr?.message || gemErr);
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
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto requerido para síntesis de voz' });
    }

    const rawId = String(agentId || '').trim().toLowerCase();
    const audioBuffer = await generateSpeech(text, rawId);
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
    });
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('TTS generation error:', error?.message || error);
    res.status(500).json({
      error: error?.message || 'Error en síntesis de voz.',
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
    return 'Este especialista legal está experimentando una alta demanda temporalmente. Por favor, reintenta tu consulta en unos momentos o consulta con otro especialista del bufete.';
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

chatRouter.post('/', chatRateLimiter, requireAuth, requireSubscription, async (req: any, res) => {
  const startTime = Date.now();
  const isStream = req.body?.stream === true || req.headers?.accept?.includes('text/event-stream');

  // Si se solicita streaming, establecer encabezados SSE de inmediato
  if (isStream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
  }

  let hasStartedStreaming = false;
  let assistantMessage = '';
  let transferTo: string | undefined;

  const sendStreamChunk = (chunk: string) => {
    if (isStream && chunk) {
      hasStartedStreaming = true;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
  };

  const abortIfStreamCorrupted = (): boolean => {
    if (isStream && hasStartedStreaming && !assistantMessage) {
      console.warn('[AI Engine] Streaming SSE interrumpido a mitad de camino. Finalizando stream para evitar respuestas mezcladas.');
      res.write(`data: ${JSON.stringify({ error: 'La respuesta fue interrumpida temporalmente. Por favor reintente su consulta.' })}\n\n`);
      res.end();
      return true;
    }
    return false;
  };

  try {
    const { agentId, messages, conversationId } = req.body;

    if (!SYSTEM_PROMPTS[agentId]) {
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

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    const latestUserMessage = [...messages]
      .reverse()
      .find((m: any) => m?.role === 'user' && typeof m.content === 'string')?.content || '';

    // Ventana deslizante para el prompt: últimos 10 mensajes para evitar latencia de tokens masivos
    const recentMessages = messages.length > 10 ? messages.slice(-10) : messages;

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
      } catch { /* memory is optional */ }
    }

    // Check if message should be transferred to another agent
    const transferSuggestion = suggestAgentTransfer(agentId, latestUserMessage);
    if (transferSuggestion) {
      transferTo = transferSuggestion.agentId;
      const destName = transferSuggestion.agentName;
      assistantMessage = [
        `Estimado usuario: Analizada su consulta fáctica, la materia planteada corresponde formalmente a la especialidad de **Derecho ${transferSuggestion.agentLabel}**.`,
        `Por estricto rigor procesal y competencia jurídica, le transfiero de inmediato con ${destName}, especialista en ${transferSuggestion.agentLabel} de nuestro bufete.`,
        `Haga clic en el botón inferior para continuar; su consulta se cargará de manera automática en el despacho de ${destName}.`,
      ].join(' ');

      sendStreamChunk(assistantMessage);
    }

    // Inyección inteligente de doctrina y normas actualizadas del SPIJ y Corte Suprema
    const legalGrounding = getSpijLegalGrounding(agentId, latestUserMessage);
    const fullSystemPrompt = SYSTEM_PROMPTS[agentId] + memoryBlock + (legalGrounding ? `\n\n${legalGrounding}` : '');

    const formattedMessages = [
      { role: 'system', content: fullSystemPrompt },
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

    // ─────────────────────────────────────────────────────────────
    // 1. PRIORIDAD 1: Groq LPUs (Inferencia ultra-rápida 300+ tok/s, latencia < 300ms)
    // ─────────────────────────────────────────────────────────────
    if (!assistantMessage && groqKey) {
      const groqCandidates = [
        'llama-3.3-70b-versatile',
        'deepseek-r1-distill-llama-70b',
        'llama-3.1-8b-instant',
      ];

      for (const groqModel of groqCandidates) {
        if (assistantMessage) break;
        try {
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
              max_tokens: 4096,
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
    // 2. PRIORIDAD 2: OpenAI (Alta disponibilidad y concurrencia masiva)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && openaiKey) {
      const oaiModels = ['gpt-4o-mini', 'gpt-4o'];

      for (const oaiModel of oaiModels) {
        if (assistantMessage) break;
        try {
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
              max_tokens: 4096,
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
          }
        } catch (oaiErr: any) {
          console.warn(`[AI Engine] OpenAI error on ${oaiModel}:`, oaiErr?.message || oaiErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. PRIORIDAD 3: DeepSeek Direct (Modo rápido deepseek-chat con timeout corto de 10s)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && deepseekKey) {
      try {
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
            max_tokens: 4096,
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
        }
      } catch (dsErr: any) {
        console.warn('[AI Engine] DeepSeek error/timeout:', dsErr?.message || dsErr);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. PRIORIDAD 4: Anthropic Claude (claude-3-5-haiku)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && anthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const modelToUse = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';

        if (isStream) {
          const stream = anthropic.messages.stream({
            model: modelToUse,
            max_tokens: 4096,
            system: fullSystemPrompt,
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
          }
        } else {
          const response = await withTimeout(
            anthropic.messages.create({
              model: modelToUse,
              max_tokens: 4096,
              system: fullSystemPrompt,
              messages: recentMessages.map((m: any) => ({ role: m.role, content: m.content })),
            }),
            18000,
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
          }
        }
      } catch (anthropicErr: any) {
        console.error('[AI Engine] Anthropic Error:', anthropicErr?.message || anthropicErr);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. PRIORIDAD 5: OpenRouter Fallback
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && openrouterKey) {
      const candidateModels = [
        'meta-llama/llama-3.3-70b-instruct',
        'qwen/qwen-2.5-72b-instruct',
        'deepseek/deepseek-chat',
      ];

      for (const openrouterModel of candidateModels) {
        if (assistantMessage) break;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);

          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://fiscalia-t0bl.onrender.com',
              'X-Title': 'Bufete Fiscalia IA',
            },
            body: JSON.stringify({
              model: openrouterModel,
              messages: formattedMessages,
              temperature: 0.2,
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
                break;
              }
            }
          }
        } catch (orErr: any) {
          console.warn(`[AI Engine] OpenRouter error on ${openrouterModel}:`, orErr?.message || orErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PRIORIDAD 6 (ÚLTIMO RECURSO): Google Gemini (Enviado al final por inestabilidad)
    // ─────────────────────────────────────────────────────────────
    if (abortIfStreamCorrupted()) return;
    if (!assistantMessage && geminiKey) {
      const rawGeminiCandidates = [
        process.env.GEMINI_MODEL,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
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

      const genAI = new GoogleGenerativeAI(geminiKey);

      for (const geminiModelName of geminiModelCandidates) {
        if (assistantMessage) break;
        try {
          const modelPlain = genAI.getGenerativeModel({
            model: geminiModelName,
            systemInstruction: fullSystemPrompt,
          });
          const chat = modelPlain.startChat({ history: validHistory, generationConfig: { temperature: 0.2 } });

          if (isStream) {
            const streamResult = await withTimeout(
              chat.sendMessageStream(latestUserMessage),
              18000,
              `Gemini Stream ${geminiModelName}`
            );
            for await (const chunk of streamResult.stream) {
              const chunkText = chunk.text();
              if (chunkText) {
                assistantMessage += chunkText;
                sendStreamChunk(chunkText);
              }
            }
          } else {
            const result = await withTimeout(
              chat.sendMessage(latestUserMessage),
              18000,
              `Gemini ${geminiModelName}`
            );
            assistantMessage = result.response.text();
          }

          if (assistantMessage) {
            metrics.recordAiCall({
              agentId,
              provider: 'gemini',
              model: geminiModelName,
              success: true,
              durationMs: Date.now() - startTime,
            });
            console.log(`[AI Engine] Éxito con Gemini (${geminiModelName}) en ${Date.now() - startTime}ms`);
            break;
          }
        } catch (geminiErr: any) {
          console.warn(`[AI Engine] Gemini ${geminiModelName} error:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 7. RESPALDO DE EMERGENCIA GARANTIZADO
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
      assistantMessage = [
        `Estimado cliente: He recepcionado su consulta respecto a su caso en el área de **${info.role}**.`,
        `\n\nHe registrado los antecedentes fácticos. Para brindarle el patrocinio inmediato y la redacción del escrito correspondiente, por favor especifique si requiere:\n\n1. **Redacción de escrito / Carta Notarial**\n2. **Cálculo de montos o liquidación**\n3. **Plan de acción procesal paso a paso**\n\nQuedo a su disposición para resolver su situación jurídica de inmediato.`,
      ].join(' ');

      sendStreamChunk(assistantMessage);
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

    const updatedMessages = [...messages, assistantEntry];
    let finalConvId = conversationId;

    if (conversationId) {
      await db
        .update(conversations)
        .set({ messages: updatedMessages, updatedAt: new Date() })
        .where(
          and(
            eq(conversations.id, conversationId),
            eq(conversations.userId, req.userId)
          )
        );
    } else {
      finalConvId = uuidv4();
      const title = latestUserMessage.slice(0, 60) || 'Nueva consulta';
      await db.insert(conversations).values({
        id: finalConvId,
        userId: req.userId,
        agentId,
        title,
        messages: updatedMessages,
      });
    }

    // Incrementar uso en caché de memoria y registrar en tabla inmutable de consumo
    await recordQuestionUsage(req.userId);

    if (isStream) {
      res.write(`data: ${JSON.stringify({ done: true, conversationId: finalConvId, transferTo })}\n\n`);
      return res.end();
    } else {
      return res.json({ message: assistantMessage, conversationId: finalConvId, ...(transferTo ? { transferTo } : {}) });
    }
  } catch (error: any) {
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
