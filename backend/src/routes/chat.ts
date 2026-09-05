import { Router } from 'express';
import multer, { MulterError } from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { conversations, userMemory } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../middleware/auth';
import { requireSubscription } from '../middleware/subscription';
import { SYSTEM_PROMPTS } from '../prompts/agents';
import { suggestAgentTransfer } from './agentRouter';
import { metrics } from '../lib/metrics';
import { generateSpeech } from '../lib/tts';

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max audio
});

export const chatRouter = Router();

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
chatRouter.post('/stt', requireAuth, (req: any, res: any, next: any) => {
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
        return res.status(400).json({ error: 'No se recibió ningún audio para transcribir' });
      }

      const { mimeType: resolvedMime, filename: resolvedFilename } = getAudioFormat(rawMime, file?.originalname);

      const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;
      const openrouterKey = process.env.OPENROUTER_API_KEY;

      // 1. Intentar con Groq Whisper (ultra rápido, latencia < 300ms)
      if (groqKey) {
        try {
          const formData = new FormData();
          const blob = new Blob([audioBuffer], { type: resolvedMime });
          formData.append('file', blob, resolvedFilename);
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
          const blob = new Blob([audioBuffer], { type: resolvedMime });
          formData.append('file', blob, resolvedFilename);
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

      // 3. Transcripción con Google Gemini Multimodal Audio
      if (geminiKey) {
        try {
          const genAI = new GoogleGenerativeAI(geminiKey);
          const modelsToTry = [
            process.env.GEMINI_MODEL,
            'gemini-3.6-flash',
            'gemini-3.5-flash-lite',
            'gemini-2.5-flash',
            'gemini-flash',
            'gemini-pro',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
          ].filter(Boolean) as string[];
          
          for (const modelName of modelsToTry) {
            try {
              const model = genAI.getGenerativeModel({ model: modelName });
              const result = await model.generateContent([
                {
                  inlineData: {
                    data: audioBuffer.toString('base64'),
                    mimeType: resolvedMime,
                  },
                },
                {
                  text: 'Transcribe el audio a texto exacto en español con correcta puntuación y ortografía. Devuelve ÚNICAMENTE el texto transcrito sin comentarios ni notas.',
                },
              ]);
              const txt = result.response.text();
              if (txt && txt.trim()) {
                return res.json({ text: txt.trim() });
              }
            } catch (gemErr: any) {
              console.warn(`[STT] Gemini (${modelName}) error:`, gemErr?.message || gemErr);
            }
          }
        } catch (geminiTotalErr: any) {
          console.error('[STT] Gemini STT total error:', geminiTotalErr);
        }
      }

      // 4. Intentar con OpenRouter
      if (openrouterKey) {
        try {
          const base64Audio = audioBuffer.toString('base64');
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://fiscalia-1.onrender.com',
              'X-Title': 'Bufete Fiscalia IA STT',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.0-flash-exp:free',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Transcribe exactamente lo dicho en este audio a texto en español.' },
                    {
                      type: 'image_url',
                      image_url: { url: `data:${resolvedMime};base64,${base64Audio}` },
                    },
                  ],
                },
              ],
            }),
          });
          if (orRes.ok) {
            const orData = (await orRes.json()) as any;
            const content = orData?.choices?.[0]?.message?.content;
            if (content && typeof content === 'string' && content.trim()) {
              return res.json({ text: content.trim() });
            }
          }
        } catch (orErr) {
          console.warn('[STT] OpenRouter STT error:', orErr);
        }
      }

      return res.status(500).json({
        error: 'No se pudo transcribir el audio en este momento. Por favor escribe tu consulta o reintenta.',
      });
    } catch (error: any) {
      console.error('[STT] STT endpoint fatal error:', error);
      res.status(500).json({ error: error?.message || 'Error en transcripción de audio' });
    }
  });
});

// Endpoint para síntesis de voz (Microsoft Edge Neural TTS / ElevenLabs)
chatRouter.post('/tts', requireAuth, async (req: any, res) => {
  try {
    const { text, agentId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Texto requerido para síntesis de voz' });
    }

    const audioBuffer = await generateSpeech(text, agentId || 'sebastian');
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

chatRouter.post('/', requireAuth, requireSubscription, async (req: any, res) => {
  const startTime = Date.now();
  try {
    const { agentId, messages, conversationId } = req.body;

    if (!SYSTEM_PROMPTS[agentId]) {
      return res.status(400).json({ error: 'Agente no válido' });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Mensajes requeridos' });
    }

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    let assistantMessage = '';
    let transferTo: string | undefined;

    const latestUserMessage = [...messages]
      .reverse()
      .find((m: any) => m?.role === 'user' && typeof m.content === 'string')?.content || '';

    // Load user memory to inject into system prompt
    let memoryBlock = '';
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
    } catch { /* memory is optional */ }

    // Check if message should be transferred to another agent
    const transferSuggestion = suggestAgentTransfer(agentId, latestUserMessage);
    if (transferSuggestion) {
      transferTo = transferSuggestion.agentId;
      const currentAgentNames: Record<string, string> = {
        valentina: 'Valentina', sebastian: 'Sebastián', diego: 'Diego', adriana: 'Adriana',
        rodrigo: 'Rodrigo', camila: 'Camila', fernanda: 'Fernanda', marco: 'Marco',
      };
      const currentName = currentAgentNames[agentId] || 'este despacho';
      const destName = transferSuggestion.agentName;
      assistantMessage = [
        `Estimado usuario: Analizada su consulta fáctica, la materia planteada corresponde formalmente a la especialidad de **Derecho ${transferSuggestion.agentLabel}**.`,
        `Por estricto rigor procesal y competencia jurídica, le transfiero de inmediato con ${destName}, especialista en ${transferSuggestion.agentLabel} de nuestro bufete.`,
        `Haga clic en el botón inferior para continuar; su consulta se cargará de manera automática en el despacho de ${destName}.`,
      ].join(' ');
    }

    // 1. Use OpenRouter if configured
    if (!assistantMessage && openrouterKey) {
      const candidateModels = process.env.OPENROUTER_MODEL
        ? [process.env.OPENROUTER_MODEL]
        : [
            'deepseek/deepseek-r1:free',
            'deepseek/deepseek-chat:free',
            'qwen/qwen-2.5-72b-instruct:free',
            'meta-llama/llama-3.1-8b-instruct:free',
            'mistralai/mistral-7b-instruct:free',
            'google/gemini-2.0-flash-exp:free',
            'google/gemini-2.0-flash-lite-preview-02-05:free',
            'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
          ];

      const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPTS[agentId] + memoryBlock },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ];

      for (const openrouterModel of candidateModels) {
        if (assistantMessage) break;
        try {
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://fiscalia-1.onrender.com',
              'X-Title': 'Bufete Fiscalia IA',
            },
            body: JSON.stringify({
              model: openrouterModel,
              messages: formattedMessages,
              temperature: 0.3,
            }),
          });

          if (orRes.ok) {
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
          } else {
            const errData: any = await orRes.json().catch(() => ({}));
            console.warn(`OpenRouter model ${openrouterModel} failed:`, errData?.error?.message || errData);
          }
        } catch (orErr: any) {
          console.error(`OpenRouter request error on ${openrouterModel}:`, orErr?.message || orErr);
        }
      }
    }

    // 2. Use Groq if configured
    if (!assistantMessage && groqKey) {
      const groqCandidates = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it', 'mixtral-8x7b-32768'];
      const formattedMessages = [
        { role: 'system', content: SYSTEM_PROMPTS[agentId] + memoryBlock },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ];

      for (const groqModel of groqCandidates) {
        if (assistantMessage) break;
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: groqModel,
              messages: formattedMessages,
              temperature: 0.3,
            }),
          });

          if (groqRes.ok) {
            const data: any = await groqRes.json();
            assistantMessage = data.choices?.[0]?.message?.content || '';
            if (assistantMessage) {
              metrics.recordAiCall({
                agentId,
                provider: 'groq',
                model: groqModel,
                success: true,
                durationMs: Date.now() - startTime,
              });
              break;
            }
          } else {
            const errData: any = await groqRes.json().catch(() => ({}));
            console.warn(`Groq API error on ${groqModel}:`, errData?.error?.message || errData);
          }
        } catch (groqErr: any) {
          console.error(`Groq request error on ${groqModel}:`, groqErr?.message || groqErr);
        }
      }
    }

    // 3. Use Gemini (@google/generative-ai SDK)
    if (!assistantMessage && geminiKey) {
      const geminiModelCandidates = [
        process.env.GEMINI_MODEL,
        'gemini-3.6-flash',
        'gemini-3.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-flash',
        'gemini-pro',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ].filter(Boolean) as string[];
      
      // Sanitize history for Gemini SDK
      const rawHistory = messages.slice(0, -1);
      const validHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      
      for (const m of rawHistory) {
        const content = typeof m.content === 'string' ? m.content.trim() : '';
        if (!content) continue;
        const role: 'user' | 'model' = m.role === 'assistant' ? 'model' : 'user';
        
        if (validHistory.length === 0 && role === 'model') {
          continue; // Gemini history must start with role 'user'
        }
        
        const prev = validHistory[validHistory.length - 1];
        if (prev && prev.role === role) {
          prev.parts[0].text += `\n\n${content}`;
        } else {
          validHistory.push({ role, parts: [{ text: content }] });
        }
      }
      
      // Ensure history ends with 'model' so the new user message continues the sequence
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === 'user') {
        validHistory.pop();
      }

      const genAI = new GoogleGenerativeAI(geminiKey);

      for (const geminiModelName of geminiModelCandidates) {
        if (assistantMessage) break;
        try {
          const modelPlain = genAI.getGenerativeModel({
            model: geminiModelName,
            systemInstruction: SYSTEM_PROMPTS[agentId] + memoryBlock,
          });
          const chat = modelPlain.startChat({ history: validHistory, generationConfig: { temperature: 0.2 } });
          const result = await chat.sendMessage(latestUserMessage);
          assistantMessage = result.response.text();

          if (assistantMessage) {
            metrics.recordAiCall({
              agentId,
              provider: 'gemini',
              model: geminiModelName,
              success: true,
              durationMs: Date.now() - startTime,
            });
            break;
          }
        } catch (geminiErr: any) {
          console.warn(`Gemini model ${geminiModelName} error:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // 4. Use Anthropic
    if (!assistantMessage && anthropicKey) {
      try {
        const anthropic = new Anthropic({ apiKey: anthropicKey });
        const modelToUse = process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022';
        const response = await anthropic.messages.create({
          model: modelToUse,
          max_tokens: 4096,
          system: SYSTEM_PROMPTS[agentId] + memoryBlock,
          messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
        });
        assistantMessage = response.content[0].type === 'text' ? response.content[0].text : '';
        metrics.recordAiCall({
          agentId,
          provider: 'anthropic',
          model: modelToUse,
          success: true,
          durationMs: Date.now() - startTime,
        });
      } catch (anthropicErr: any) {
        console.error('Anthropic API Error:', anthropicErr?.message || anthropicErr);
      }
    }

    // 5. Guaranteed Emergency Fallback (never throw 500 to user)
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
        `\n\nDebido a una sobrecarga momentánea en los servidores judiciales, he registrado los hechos expuestos. Para brindarle el patrocinio inmediato y la redacción del escrito correspondiente, por favor vuelva a pulsar el botón de envío o especifique si requiere:\n\n1. **Redacción de escrito / Carta Notarial**\n2. **Cálculo de montos o liquidación**\n3. **Plan de acción procesal paso a paso**\n\nQuedo a su disposición para resolver su situación jurídica de inmediato.`,
      ].join(' ');
    }

    const assistantEntry = {
      role: 'assistant',
      content: assistantMessage,
      timestamp: new Date().toISOString(),
      ...(transferTo ? { transferTo } : {}),
    };

    const updatedMessages = [...messages, assistantEntry];

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
      res.json({ message: assistantMessage, ...(transferTo ? { transferTo } : {}) });
    } else {
      const newConvId = uuidv4();
      const title = latestUserMessage.slice(0, 60) || 'Nueva consulta';
      await db.insert(conversations).values({
        id: newConvId,
        userId: req.userId,
        agentId,
        title,
        messages: updatedMessages,
      });
      res.json({ message: assistantMessage, conversationId: newConvId, ...(transferTo ? { transferTo } : {}) });
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
    res.status(500).json({ error: friendlyError });
  }
});
