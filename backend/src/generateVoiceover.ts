import { generateSpeech } from './lib/tts';
import fs from 'fs';
import path from 'path';

async function generateCommercialVoiceover() {
  const script = `¿Tienes un problema legal urgente y no sabes por dónde empezar?
En el Perú, contratar una consulta tradicional puede costarte cientos de soles y semanas de espera.
Hoy todo cambió. Te presentamos Hardman IA.
El primer bufete de abogados con Inteligencia Artificial del Perú.
Ocho especialistas jurídicos de élite disponibles las 24 horas del día.
Habla en tiempo real por llamada de voz con tu abogada laboralista, redacta demandas y cartas notariales listas en formato Word y PDF en segundos, y calcula tus liquidaciones exactas en Soles.
Toma el control de tus derechos.
Ingresa ahora a hardman.pe y realiza tu primera consulta completamente gratis.
Hardman IA. La justicia y el derecho, al alcance de tus manos.`;

  console.log('Generando locución comercial con IA Neural...');
  const buffer = await generateSpeech(script, 'sebastian');
  
  const artifactDir = path.resolve('C:/Users/marca/.gemini/antigravity-ide/brain/063cb6e6-ffba-477d-85c5-ff420a717eb3');
  const outputPath = path.join(artifactDir, 'locucion_comercial_hardman.mp3');

  fs.writeFileSync(outputPath, buffer);
  console.log('Locución comercial generada con éxito en:', outputPath);
}

generateCommercialVoiceover().catch(console.error);
