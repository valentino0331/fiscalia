import { Router } from 'express';
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

export const chatRouter = Router();

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
      const currentName = currentAgentNames[agentId] || 'yo';
      const destName = transferSuggestion.agentName;
      assistantMessage = [
        `Gracias por tu consulta. Siendo sincero contigo, lo que describes corresponde al área de **${transferSuggestion.agentLabel}**, y no es mi especialidad principal.`,
        `Mi colega **${destName}**, especialista en ${transferSuggestion.agentLabel}, podrá ayudarte mucho mejor que ${currentName} en este caso.`,
        `Te recomiendo continuar con ${destName}. Haz clic en el botón de abajo para ir directamente a su chat.`,
      ].join(' ');
    }

    // Use Gemini (@google/generative-ai SDK)
    if (!assistantMessage && geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const geminiModelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
        
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

        try {
          const model = genAI.getGenerativeModel({
            model: geminiModelName,
            systemInstruction: SYSTEM_PROMPTS[agentId] + memoryBlock,
            tools: [{ googleSearch: {} } as any],
          });
          const chat = model.startChat({ history: validHistory, generationConfig: { temperature: 0.2 } });
          const result = await chat.sendMessage(latestUserMessage);
          assistantMessage = result.response.text();
        } catch (searchToolErr: any) {
          console.warn('Gemini with googleSearch failed, retrying without tools:', searchToolErr?.message || searchToolErr);
          const modelPlain = genAI.getGenerativeModel({
            model: geminiModelName,
            systemInstruction: SYSTEM_PROMPTS[agentId] + memoryBlock,
          });
          const chat = modelPlain.startChat({ history: validHistory, generationConfig: { temperature: 0.2 } });
          const result = await chat.sendMessage(latestUserMessage);
          assistantMessage = result.response.text();
        }

        metrics.recordAiCall({
          agentId,
          provider: 'gemini',
          model: geminiModelName,
          success: true,
          durationMs: Date.now() - startTime,
        });
      } catch (geminiErr: any) {
        console.error('Gemini API Error:', geminiErr?.message || geminiErr);
        metrics.recordAiCall({
          agentId,
          provider: 'gemini',
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          success: false,
          durationMs: Date.now() - startTime,
          error: geminiErr?.message || 'Error Gemini',
        });
        if (!anthropicKey) {
          const msg = geminiErr?.message || 'Error en el servicio de Gemini';
          metrics.recordError({
            route: '/chat',
            method: 'POST',
            statusCode: 500,
            message: `Error de IA (Gemini): ${msg}`,
            agentId,
          });
          return res.status(500).json({ error: `Error de IA (Gemini): ${msg}` });
        }
      }
    }

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
        metrics.recordAiCall({
          agentId,
          provider: 'anthropic',
          model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-20241022',
          success: false,
          durationMs: Date.now() - startTime,
          error: anthropicErr?.message || 'Error Anthropic',
        });
        metrics.recordError({
          route: '/chat',
          method: 'POST',
          statusCode: 500,
          message: `Error de IA (Anthropic): ${anthropicErr?.message || anthropicErr}`,
          agentId,
        });
        return res.status(500).json({ error: `Error de IA (Anthropic): ${anthropicErr?.message || anthropicErr}` });
      }
    }

    if (!assistantMessage) {
      metrics.recordError({
        route: '/chat',
        method: 'POST',
        statusCode: 500,
        message: 'No se ha configurado ninguna API Key de IA en el servidor (GEMINI_API_KEY o ANTHROPIC_API_KEY)',
        agentId,
      });
      return res.status(500).json({
        error: 'No se ha configurado ninguna API Key de IA en el servidor (GEMINI_API_KEY o ANTHROPIC_API_KEY). Por favor agrega GEMINI_API_KEY en las variables de entorno de Render.',
      });
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
    const errorMessage = error?.message || 'Error al procesar la consulta jurídica';
    metrics.recordError({
      route: '/chat',
      method: 'POST',
      statusCode: 500,
      message: errorMessage,
      details: String(error),
    });
    res.status(500).json({ error: errorMessage });
  }
});
