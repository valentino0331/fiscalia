import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Voces neuronales HD de Microsoft Edge (100% Gratuitas, sin API Key y máxima calidad en español)
const EDGE_VOICE_IDS: Record<string, string> = {
  // Mujeres
  valentina: process.env.EDGE_VOICE_VALENTINA || 'es-PE-CamilaNeural', // Perú (Laboral - Formal y clara)
  camila: process.env.EDGE_VOICE_CAMILA || 'es-MX-DaliaNeural',       // México (Familia - Cálida, empática e interrogativa)
  fernanda: process.env.EDGE_VOICE_FERNANDA || 'es-CO-SalomeNeural',   // Colombia (Tributaria - Precisa y técnica)
  adriana: process.env.EDGE_VOICE_ADRIANA || 'es-ES-ElviraNeural',     // España (Corporativa - Firme y ejecutiva)

  // Hombres
  sebastian: process.env.EDGE_VOICE_SEBASTIAN || 'es-PE-AlexNeural',  // Perú (Penal - Firme, formal y seguro)
  diego: process.env.EDGE_VOICE_DIEGO || 'es-MX-JorgeNeural',         // México (Civil - Profesional y conversacional)
  rodrigo: process.env.EDGE_VOICE_RODRIGO || 'es-CO-GonzaloNeural',   // Colombia (Minero - Dinámico y claro)
  marco: process.env.EDGE_VOICE_MARCO || 'es-ES-AlvaroNeural',        // España (Administrativo - Estructurado)
};

// ElevenLabs Voice IDs (para cuando se active API Key de pago)
const DEFAULT_FEMALE_VOICE = process.env.ELEVENLABS_VOICE_FEMALE || 'p18tR9wFA5Ng9WhfWI0o';
const DEFAULT_MALE_VOICE = process.env.ELEVENLABS_VOICE_MALE || '6HCwgZXWcrhF6ZoTZJkf';

const ELEVENLABS_VOICE_IDS: Record<string, string> = {
  valentina: process.env.ELEVENLABS_VOICE_VALENTINA || DEFAULT_FEMALE_VOICE,
  camila: process.env.ELEVENLABS_VOICE_CAMILA || DEFAULT_FEMALE_VOICE,
  fernanda: process.env.ELEVENLABS_VOICE_FERNANDA || DEFAULT_FEMALE_VOICE,
  adriana: process.env.ELEVENLABS_VOICE_ADRIANA || DEFAULT_FEMALE_VOICE,
  sebastian: process.env.ELEVENLABS_VOICE_SEBASTIAN || DEFAULT_MALE_VOICE,
  diego: process.env.ELEVENLABS_VOICE_DIEGO || DEFAULT_MALE_VOICE,
  rodrigo: process.env.ELEVENLABS_VOICE_RODRIGO || DEFAULT_MALE_VOICE,
  marco: process.env.ELEVENLABS_VOICE_MARCO || DEFAULT_MALE_VOICE,
};

/**
 * Procesa y enriquece el texto para que el motor neuronal de voz aplique
 * la entonación correcta (preguntas, pausas, comas, puntos y siglas legales).
 */
function enrichTextForSpeech(text: string): string {
  let t = text;

  // 1. Quitar bloques de código o enlaces markdown pero conservando su texto descriptivo
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/`([^`]+)`/g, '$1');
  t = t.replace(/\[(.*?)\]\((.*?)\)/g, '$1');

  // 2. Encabezados markdown (# Titulo) -> Convertir en oraciones con punto y pausa
  t = t.replace(/^#{1,6}\s*(.*?)$/gm, '$1. ');

  // 3. Viñetas y listas -> Agregar pausa y numeración hablada para que no se lean de corrido
  t = t.replace(/^\s*[\*\-\•]\s+/gm, '. ');
  t = t.replace(/^\s*(\d+)[\.\)]\s+/gm, '. Punto $1: ');

  // 4. Pronunciación de abreviaturas jurídicas comunes en Perú
  t = t.replace(/\bArt\.\s*(\d+)/gi, 'Artículo $1');
  t = t.replace(/\bArts\.\s*(\d+)/gi, 'Artículos $1');
  t = t.replace(/\binc\.\s*([a-z0-9]+)/gi, 'inciso $1');
  t = t.replace(/\b(D\.L\.|DL)\s*(\d+)/gi, 'Decreto Legislativo $2');
  t = t.replace(/\b(D\.S\.|DS)\s*(\d+)/gi, 'Decreto Supremo $2');
  t = t.replace(/\b(R\.M\.|RM)\s*(\d+)/gi, 'Resolución Ministerial $2');
  t = t.replace(/\bN°\s*(\d+)/gi, 'número $1');
  t = t.replace(/\bNro\.\s*(\d+)/gi, 'número $1');
  t = t.replace(/\bDr\.\s+/gi, 'Doctor ');
  t = t.replace(/\bDra\.\s+/gi, 'Doctora ');
  t = t.replace(/\bej\.\s+/gi, 'por ejemplo, ');
  t = t.replace(/\bvs\.?\s+/gi, 'versus ');
  t = t.replace(/\bpág\.\s*(\d+)/gi, 'página $1');
  t = t.replace(/\bpágs\.\s*(\d+)/gi, 'páginas $1');
  t = t.replace(/\bTUO\b/g, 'Texto Único Ordenado');

  // Expansión fonética de siglas e instituciones jurídicas peruanas
  t = t.replace(/\bS\/\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)/gi, '$1 soles');
  t = t.replace(/\bUIT\b/g, 'U-I-T');
  t = t.replace(/\bURP\b/g, 'U-R-P');
  t = t.replace(/\bNCPP\b/gi, 'Nuevo Código Procesal Penal');
  t = t.replace(/\bCPP\b/gi, 'Código Procesal Penal');
  t = t.replace(/\bCPC\b/gi, 'Código Procesal Civil');
  t = t.replace(/\bLPAG\b/gi, 'Ley del Procedimiento Administrativo General');
  t = t.replace(/\bNLPT\b/gi, 'Nueva Ley Procesal del Trabajo');
  t = t.replace(/\bLPCL\b/gi, 'Ley de Productividad y Competitividad Laboral');
  t = t.replace(/\bSUNAFIL\b/gi, 'Sunafil');
  t = t.replace(/\bINGEMMET\b/gi, 'Ingemmet');
  t = t.replace(/\bOEFA\b/gi, 'Oefa');
  t = t.replace(/\bSUNAT\b/gi, 'Sunat');
  t = t.replace(/\bOSIPTEL\b/gi, 'Osiptel');
  t = t.replace(/\bOSINERGMIN\b/gi, 'Osinergmin');
  t = t.replace(/\bOECE\b/gi, 'Organismo Especializado de Contrataciones Eficientes');
  t = t.replace(/\bTCP\b/gi, 'Tribunal de Contrataciones Públicas');
  t = t.replace(/\bJPRD\b/gi, 'Junta de Prevención y Resolución de Disputas');
  t = t.replace(/\bREINFO\b/gi, 'Reinfo');
  t = t.replace(/\bDEMUNA\b/gi, 'Demuna');
  t = t.replace(/\bJPLL\b/gi, 'Juzgado de Paz Letrado Laboral');

  // 5. Garantizar signos de interrogación en español para que module la curva de pregunta
  // Si hay una pregunta cerrada con '?' sin '¿' al inicio de la frase, la normalizamos
  t = t.replace(/(^|[.?!;\n])\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+)\?/g, '$1 ¿$2?');
  // Asegurar doble interrogación limpia si quedó ¿¿
  t = t.replace(/¿\s*¿/g, '¿');

  // 6. Limpieza de caracteres de marcado restantes sin borrar puntuación
  t = t.replace(/[*_~|=#><]/g, ' ');

  // 7. Normalizar espacios y signos duplicados
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/\.\s*\./g, '.');
  t = t.replace(/,\s*,/g, ',');
  t = t.replace(/\s*([,.;:?!])/g, '$1'); // Pegar signos a la palabra previa

  const cleaned = t.trim();
  const MAX_CHARS = 1200;
  if (cleaned.length <= MAX_CHARS) {
    return cleaned;
  }
  // Cortar en el último punto o signo de interrogación antes de MAX_CHARS
  const sub = cleaned.slice(0, MAX_CHARS);
  const lastPunctuation = Math.max(
    sub.lastIndexOf('. '),
    sub.lastIndexOf('? '),
    sub.lastIndexOf('! '),
    sub.lastIndexOf('.\n'),
    sub.lastIndexOf('\n')
  );
  if (lastPunctuation > 300) {
    return sub.slice(0, lastPunctuation + 1).trim();
  }
  return sub.trim();
}

const FEMALE_AGENTS = new Set(['valentina', 'camila', 'fernanda', 'adriana']);

export function isFemaleAgent(agentId?: string): boolean {
  if (!agentId) return false;
  return FEMALE_AGENTS.has(agentId.toLowerCase().trim());
}

export function getEdgeVoiceForAgent(agentId?: string): string {
  const norm = String(agentId || '').toLowerCase().trim();
  if (EDGE_VOICE_IDS[norm]) return EDGE_VOICE_IDS[norm];
  return isFemaleAgent(norm) ? EDGE_VOICE_IDS.valentina : EDGE_VOICE_IDS.sebastian;
}

export function getElevenLabsVoiceForAgent(agentId?: string): string {
  const norm = String(agentId || '').toLowerCase().trim();
  if (ELEVENLABS_VOICE_IDS[norm]) return ELEVENLABS_VOICE_IDS[norm];
  return isFemaleAgent(norm) ? DEFAULT_FEMALE_VOICE : DEFAULT_MALE_VOICE;
}

export async function generateEdgeSpeech(text: string, agentId: string): Promise<Buffer> {
  const enrichedText = enrichTextForSpeech(text);
  if (!enrichedText) {
    throw new Error('Texto vacío para síntesis de voz');
  }

  const voiceName = getEdgeVoiceForAgent(agentId);
  console.log(`[Edge TTS] Generando voz HD con entonación: voice=${voiceName}, agent=${agentId}, length=${enrichedText.length}`);

  const runSynthesis = async (voice: string, payload: string): Promise<Buffer> => {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    return new Promise((resolve, reject) => {
      let resolved = false;
      const chunks: Buffer[] = [];

      const { audioStream } = tts.toStream(payload, {
        rate: '-2%',
        pitch: '+0Hz',
        volume: '+0%',
      });

      const finishWithAudio = () => {
        if (resolved) return;
        if (chunks.length > 0) {
          const totalBuffer = Buffer.concat(chunks);
          if (totalBuffer.length >= 500) {
            resolved = true;
            return resolve(totalBuffer);
          }
        }
        resolved = true;
        reject(new Error('No se recibieron datos de audio válidos del motor TTS'));
      };

      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', finishWithAudio);
      audioStream.on('error', (err: any) => {
        const msg = String(err?.message || err);
        console.warn(`[Edge TTS Stream Info]: ${msg}`);
        // Si el stream se cerró prematuramente por el servidor (ej. 'no turn.end received'),
        // pero ya se recibieron bytes de audio MP3, el archivo es válido y perfectamente reproducible
        if (chunks.length > 0) {
          const totalBuffer = Buffer.concat(chunks);
          if (totalBuffer.length >= 500) {
            console.log(`[Edge TTS] Audio rescatado exitosamente (${totalBuffer.length} bytes) tras cierre del stream.`);
            resolved = true;
            return resolve(totalBuffer);
          }
        }
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
    });
  };

  try {
    return await runSynthesis(voiceName, enrichedText);
  } catch (firstErr: any) {
    console.warn('[Edge TTS] Intento inicial falló, reintentando con payload compacto...', firstErr?.message || firstErr);
    const compactText = enrichedText.slice(0, 500);
    return await runSynthesis(voiceName, compactText);
  }
}

export async function generateElevenLabsSpeech(text: string, agentId: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no está configurada');
  }

  const voiceId = getElevenLabsVoiceForAgent(agentId);
  const enrichedText = enrichTextForSpeech(text);
  if (!enrichedText) {
    throw new Error('Texto vacío para síntesis de voz');
  }

  const modelId = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  console.log(`[ElevenLabs TTS] voiceId=${voiceId}, agentId=${agentId}, textLength=${enrichedText.length}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: enrichedText,
      model_id: modelId,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorBody}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Función principal de síntesis de voz
export async function generateSpeech(text: string, agentId: string): Promise<Buffer> {
  // Si el usuario especificó explícitamente elevenlabs en TTS_PROVIDER y tiene API key activa
  if (process.env.TTS_PROVIDER === 'elevenlabs' && process.env.ELEVENLABS_API_KEY) {
    try {
      return await generateElevenLabsSpeech(text, agentId);
    } catch (err: any) {
      console.warn('[TTS] ElevenLabs falló, usando Microsoft Edge Neural TTS como respaldo inmediato:', err?.message || err);
    }
  }

  // Microsoft Edge Neural TTS (Predeterminado: 100% gratuito, sin API key, calidad neuronal HD)
  return await generateEdgeSpeech(text, agentId);
}
