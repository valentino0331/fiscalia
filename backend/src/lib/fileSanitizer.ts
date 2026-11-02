/**
 * File Sanitizer & Anti-Indirect Prompt Injection Shield — HARDMAN
 * 
 * Desinfecta el texto extraído de documentos adjuntos (PDF, DOCX, imágenes)
 * neutralizando intentos de Inyección Indirecta de Prompts (Indirect Prompt Injection).
 * 
 * Conforme al estándar de seguridad OWASP para agentes de IA:
 * Los documentos proporcionados por usuarios son datos no confiables de solo lectura,
 * nunca instrucciones de control del sistema.
 */

export function sanitizeDocumentPromptInjection(rawText: string): {
  sanitizedText: string;
  injectionNeutralized: boolean;
} {
  if (!rawText || typeof rawText !== 'string') {
    return { sanitizedText: '', injectionNeutralized: false };
  }

  const INJECTION_PATTERNS = [
    /(?:ignore|olvida|desestima)\s+(?:all\s+previous\s+instructions|todas\s+las\s+instrucciones\s+anteriores|los\s+prompts\s+anteriores)/gi,
    /(?:you\s+are\s+now|eres\s+ahora|act\s+as\s+a|act[úu]a\s+como)\s+(?:system|administrador|hacker|root|unrestricted)/gi,
    /(?:system\s+prompt|instrucciones\s+del\s+sistema):\s*/gi,
    /(?:nueva\s+regla\s+del\s+sistema|new\s+system\s+rule):\s*/gi,
    /(?:print|muestra|revela|descarga)\s+(?:system\s+prompt|el\s+system\s+prompt|las\s+instrucciones\s+ocultas)/gi,
    /(?:ignora\s+las\s+leyes\s+del\s+per[úu]|ignore\s+peruvian\s+laws)/gi,
    /(?:---|===)\s*(?:FIN\s+DEL\s+DOCUMENTO|CONTENIDO\s+EXTRA[ÍI]DO\s+DEL\s+DOCUMENTO)\s*(?:---|===)/gi,
  ];

  let text = rawText;
  let injectionNeutralized = false;

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      injectionNeutralized = true;
      text = text.replace(pattern, '[instrucción no confiable neutralizada por seguridad]');
    }
  }

  return { sanitizedText: text, injectionNeutralized };
}
