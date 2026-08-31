const AGENT_VOICE_IDS: Record<string, string> = {
  // Mujeres
  valentina: process.env.ELEVENLABS_VOICE_VALENTINA || 'EXAVITQu4vr4xnSDxMaL', // Sarah
  camila: process.env.ELEVENLABS_VOICE_CAMILA || 'ThT5KcBeYPX3keUQqHPh',       // Serena
  fernanda: process.env.ELEVENLABS_VOICE_FERNANDA || '21m00Tcm4TlvDq8ikWAM',   // Rachel
  adriana: process.env.ELEVENLABS_VOICE_ADRIANA || 'oWAxZDx7wkiCglhlqReH',     // Jessica

  // Hombres
  sebastian: process.env.ELEVENLABS_VOICE_SEBASTIAN || 'pNInz6obpgDQGcFmaJgB', // Adam
  diego: process.env.ELEVENLABS_VOICE_DIEGO || 'ErXwobaYiN019PkySvjV',         // Antoni
  rodrigo: process.env.ELEVENLABS_VOICE_RODRIGO || 'JBFqnCBsd6RMkjVDRZzb',     // George
  marco: process.env.ELEVENLABS_VOICE_MARCO || 'N2lVS1w4EtoT3dr4eOWO',         // Callum
};

export async function generateElevenLabsSpeech(text: string, agentId: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY no está configurada');
  }

  const voiceId = AGENT_VOICE_IDS[agentId] || AGENT_VOICE_IDS.sebastian;

  // Clean text of markdown before sending to TTS
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[>#*_~|═━─•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000); // Limit length per TTS call

  if (!cleanText) {
    throw new Error('Texto vacío para síntesis de voz');
  }

  const modelId = process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

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
        style: 0.2,
        use_speaker_boost: true,
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
