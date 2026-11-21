/**
 * Estilo profesional — HARDMAN
 * Elimina emojis y pictogramas de las respuestas dirigidas a abogados.
 * Se aplica tanto al flujo en streaming como al texto persistido, para que ambos coincidan.
 */
const PICTOGRAPHS = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2B06}\u{2B1B}\u{2B1C}\u{23E9}-\u{23FF}\u{FE0F}\u{200D}\u{20E3}]/gu;

export function stripEmojis(text: string): string {
  if (!text) return text;
  return text
    .replace(PICTOGRAPHS, '')
    // Limpia espacios dobles dejados por la eliminación, sin tocar saltos de línea ni sangrías al inicio de línea
    .replace(/([^\s]) {2,}/g, '$1 ')
    .replace(/^[ \t]+(?=\n)/gm, '');
}
