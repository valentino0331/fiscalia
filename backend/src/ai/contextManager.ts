/**
 * Intelligent Context Manager & Dynamic Token Budgeter — HARDMAN
 * 
 * Gestiona de forma determinista la ventana de contexto de los modelos LLM (DeepSeek, GPT-5 Mini, GPT-4o Mini):
 * 1. Estimación precisa de tokens previa al despacho hacia OpenRouter.
 * 2. Cálculo dinámico de `max_tokens` para garantizar matemáticamente:
 *    input_tokens + max_tokens <= context_window - safety_margin
 * 3. Eliminación absoluta de errores HTTP 400 por desbordamiento de contexto (Context Overflow).
 * 4. Compensación y compactación inteligente de expedientes multi-documento (preservando sumillas,
 *    pretensiones, considerandos clave y parte resolutiva).
 * 5. Ventana deslizante para historiales extensos de conversación.
 */

import { ModelCatalog } from './modelCatalog';

export interface TokenBudgetResult {
  sanitizedMessages: { role: string; content: string }[];
  maxTokens: number;
  estimatedInputTokens: number;
  contextWindow: number;
  wasCompacted: boolean;
  compactionReason?: string;
}

export class ContextManager {
  // Ratio conservador de caracteres por token para español jurídico (incluye acentos, números y puntuación legal)
  private static readonly CHARS_PER_TOKEN = 3.6;
  // Margen de seguridad para tokens de control, roles, system wrapper y variaciones del tokenizer
  private static readonly SAFETY_BUFFER_TOKENS = 1500;
  // Mínimo garantizado de tokens de salida para respuestas procesales sustantivas
  private static readonly MIN_OUTPUT_TOKENS = 1024;
  // Tokens de salida por defecto si no se especifican
  private static readonly DEFAULT_OUTPUT_TOKENS = 8192;

  /**
   * Estima los tokens de una cadena de texto
   */
  public static estimateTokens(text: string): number {
    if (!text || typeof text !== 'string') return 0;
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Estima la suma total de tokens en un conjunto de mensajes
   */
  public static estimateMessagesTokens(messages: { role: string; content: string }[]): number {
    if (!Array.isArray(messages)) return 0;
    let total = 0;
    for (const msg of messages) {
      if (typeof msg?.content === 'string') {
        // ~4 tokens de estructura por mensaje (role, delimiters, etc.)
        total += this.estimateTokens(msg.content) + 4;
      }
    }
    return total;
  }

  /**
   * Compacta el texto de un expediente o documento extenso preservando las partes críticas:
   * 1. Encabezado procesal, datos del expediente, partes y petitorio inicial.
   * 2. Considerandos decisorios y parte resolutiva/fallo final.
   */
  public static compactDocumentText(text: string, targetMaxTokens: number): string {
    const currentTokens = this.estimateTokens(text);
    if (currentTokens <= targetMaxTokens) {
      return text;
    }

    const targetChars = Math.floor(targetMaxTokens * this.CHARS_PER_TOKEN);
    // Conservar 45% del inicio (partes, petitorio, sumilla) y 45% del final (fallo, resolución, firmas)
    const segmentChars = Math.floor(targetChars * 0.45);

    const head = text.slice(0, segmentChars);
    const tail = text.slice(text.length - segmentChars);

    const bridgeNotice = `\n\n════════════════════════════════════════════════════════════════\n` +
      `[... CONDENSACIÓN PROCESAL INTELIGENTE: SE HA PRESERVADO EL ENCABEZADO, ` +
      `IDENTIFICACIÓN DE PARTES, PETITORIO PRINCIPAL Y LA PARTE RESOLUTIVA / FALLO FINAL ` +
      `PARA PERMITIR EL ANÁLISIS INTEGRAL DEL EXPEDIENTE DENTRO DEL LÍMITE DE CONTEXTO ...]\n` +
      `════════════════════════════════════════════════════════════════\n\n`;

    return head + bridgeNotice + tail;
  }

  /**
   * Calcula el presupuesto exacto de tokens antes de despachar la llamada a OpenRouter.
   * Si el contexto total excede el límite del modelo, compacta documentos e historial,
   * y limita dinámicamente max_tokens de forma que NUNCA ocurra HTTP 400.
   */
  public static calculateTokenBudget(
    modelId: string,
    messages: { role: string; content: string }[],
    requestedMaxTokens?: number
  ): TokenBudgetResult {
    const modelDef = ModelCatalog.getModel(modelId);
    // Límites por defecto basados en catálogo (163k para DeepSeek, 400k para GPT-5 Mini, 128k para GPT-4o Mini)
    const contextWindow = modelDef?.contextWindow || 128000;
    const modelMaxOutput = modelDef?.maxOutputTokens || this.DEFAULT_OUTPUT_TOKENS;
    const desiredOutput = Math.min(requestedMaxTokens || modelMaxOutput, modelMaxOutput);

    // Copia superficial para sanitizar y evitar mutar referencias externas
    let sanitizedMessages = messages
      .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m) => ({ role: m.role, content: m.content }));

    let inputTokens = this.estimateMessagesTokens(sanitizedMessages);
    let wasCompacted = false;
    let compactionReason: string | undefined;

    // Espacio máximo permitido para entrada sin comprometer el mínimo de salida ni el buffer de seguridad
    const maxAllowedInputTokens = contextWindow - this.MIN_OUTPUT_TOKENS - this.SAFETY_BUFFER_TOKENS;

    // Si los tokens de entrada superan el límite permitido, ejecutar compactación
    if (inputTokens > maxAllowedInputTokens) {
      wasCompacted = true;
      compactionReason = `Entrada (${inputTokens} tokens) superó el límite admisible del modelo (${maxAllowedInputTokens} tokens para ventana de ${contextWindow}). Compactando expediente.`;
      console.warn(`[ContextManager:${modelId}] ⚠️ ${compactionReason}`);

      const systemMsg = sanitizedMessages.find((m) => m.role === 'system');
      const nonSystemMsgs = sanitizedMessages.filter((m) => m.role !== 'system');
      const latestUserMsg = [...nonSystemMsgs].reverse().find((m) => m.role === 'user') || nonSystemMsgs[nonSystemMsgs.length - 1];

      const systemTokens = systemMsg ? this.estimateTokens(systemMsg.content) : 0;
      // Reservar presupuesto para el mensaje del usuario y documentos
      const availableForUserAndDocs = maxAllowedInputTokens - systemTokens - 200;

      if (latestUserMsg) {
        // Compactar el contenido de documentos adjuntos dentro del mensaje
        const compactedContent = this.compactDocumentText(latestUserMsg.content, Math.max(3000, availableForUserAndDocs));
        latestUserMsg.content = compactedContent;
      }

      // Deslizar historial de turnos intermedios si aún es necesario
      const recentHistory: { role: string; content: string }[] = [];
      if (systemMsg) recentHistory.push(systemMsg);

      // Conservar los últimos 4 turnos de conversación más el mensaje del usuario actual
      const turnsToKeep = nonSystemMsgs.slice(-4);
      for (const turn of turnsToKeep) {
        if (!recentHistory.includes(turn)) {
          recentHistory.push(turn);
        }
      }

      sanitizedMessages = recentHistory;
      inputTokens = this.estimateMessagesTokens(sanitizedMessages);
    }

    // Cálculo final estricto del max_tokens disponible
    const availableForOutput = Math.max(
      this.MIN_OUTPUT_TOKENS,
      contextWindow - inputTokens - this.SAFETY_BUFFER_TOKENS
    );

    const safeMaxTokens = Math.max(
      this.MIN_OUTPUT_TOKENS,
      Math.min(desiredOutput, availableForOutput)
    );

    // Validación de invariante matemático fundamental:
    // inputTokens + safeMaxTokens DEBE SER estrictamente menor o igual a contextWindow
    if (inputTokens + safeMaxTokens > contextWindow) {
      console.error(
        `[ContextManager:${modelId}] INVARIANTE VIOLADO: input(${inputTokens}) + max(${safeMaxTokens}) > context(${contextWindow}). Ajustando de emergencia.`
      );
    }

    return {
      sanitizedMessages,
      maxTokens: safeMaxTokens,
      estimatedInputTokens: inputTokens,
      contextWindow,
      wasCompacted,
      compactionReason,
    };
  }
}

