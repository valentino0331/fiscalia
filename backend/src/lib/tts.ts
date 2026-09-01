import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Voces neuronales HD de Microsoft Edge (100% Gratuitas, sin API Key y máxima calidad en español)
const EDGE_VOICE_IDS: Record<string, string> = {
  // Mujeres
  valentina: process.env.EDGE_VOICE_VALENTINA || 'es-PE-CamilaNeural', // Perú (Abogada Laboral)
  camila: process.env.EDGE_VOICE_CAMILA || 'es-MX-DaliaNeural',       // México (Abogada de Familia - Muy cálida)
  fernanda: process.env.EDGE_VOICE_FERNANDA || 'es-CO-SalomeNeural',   // Colombia (Abogada Tributaria - Clara y técnica)
  adriana: process.env.EDGE_VOICE_ADRIANA || 'es-ES-ElviraNeural',     // España (Abogada Corporativa / M&A)

  // Hombres
  sebastian: process.env.EDGE_VOICE_SEBASTIAN || 'es-PE-AlexNeural',  // Perú (Penalista - Firme y seguro)
  diego: process.env.EDGE_VOICE_DIEGO || 'es-MX-JorgeNeural',         // México (Civilista - Formal y natural)
  rodrigo: process.env.EDGE_VOICE_RODRIGO || 'es-CO-GonzaloNeural',   // Colombia (Minero / Ambiental - Dinámico)
  marco: process.env.EDGE_VOICE_MARCO || 'es-ES-AlvaroNeural',        // España (Administrativo / Licitaciones)
};

// ElevenLabs Voice IDs (para cuando se tenga API Key de pago)
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

function cleanTextForTTS(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[>#*_~|═━─•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);
}

export async function generateEdgeSpeech(text: string, agentId: string): Promise<Buffer> {
  const cleanText = cleanTextForTTS(text);
  if (!cleanText) {
    throw new Error('Texto vacío para síntesis de voz');
  }

  const voiceName = EDGE_VOICE_IDS[agentId] || EDGE_VOICE_IDS.sebastian;
  console.log(`[Edge TTS] Generando voz neuronal: voice=${voiceName}, agent=${agentId}, length=${cleanText.length}`);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  return new Promise((resolve, reject) => {
    const { audioStream } = tts.toStream(cleanText);
    const chunks: Buffer[] = [];

    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    audioStream.on('end', () => resolve(Buffer.concat(chunks)));
    audioStream.on('error', (err: any) => {
      console.error('[Edge TTS Error]:', err);
      reject(err);
    });
  });
}

export async function generateElevenLabsSpeech(text: string, agentId: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no está configurada');
  }

  const voiceId = ELEVENLABS_VOICE_IDS[agentId] || ELEVENLABS_VOICE_IDS.sebastian;
  const cleanText = cleanTextForTTS(text);
  if (!cleanText) {
    throw new Error('Texto vacío para síntesis de voz');
  }

  const modelId = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  console.log(`[ElevenLabs TTS] voiceId=${voiceId}, agentId=${agentId}, textLength=${cleanText.length}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: cleanText,
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
  // Si el usuario especificó explícitamente elevenlabs en TTS_PROVIDER y tiene API key, intenta ElevenLabs primero
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
