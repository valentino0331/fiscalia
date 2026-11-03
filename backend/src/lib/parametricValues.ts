/**
 * HARDMAN LEGAL CORE — VALORES PARAMÉTRICOS Y ANCLAJE TEMPORAL DETERMINISTA
 * 
 * Centraliza los valores paramétricos oficiales vigentes en el Perú (UIT, RMV, URP)
 * y proporciona la fecha oficial del sistema en la zona horaria de Lima (America/Lima).
 * 
 * Fuentes oficiales contrastadas:
 * - UIT 2026: S/ 5,500 (D.S. N° 301-2025-EF)
 * - RMV: S/ 1,230 vigente desde el 01/10/2026 (D.S. N° 015-2026-TR). Anterior: S/ 1,130.
 * - Asignación Familiar: 10% de la RMV (Ley N° 25129) = S/ 123.00 desde oct-2026.
 * - URP 2026: 10% de la UIT = S/ 550.00 (Disposición Complementaria Única del CPC).
 * - TUO LPAG: D.S. N° 006-2026-JUS (derogó expresamente al D.S. N° 004-2019-JUS).
 * - Ley General de Contrataciones Públicas: Ley N° 32069 y Reglamento D.S. N° 009-2025-EF
 *   (con D.S. N° 001-2026-EF y 222-2026-EF) - Transición a OECE (extinción de OSCE).
 */

export interface ParametricValues {
  uit: number;
  uitLegalBasis: string;
  rmv: number;
  rmvLegalBasis: string;
  familyAllowancePercent: number;
  familyAllowanceAmount: number;
  familyAllowanceLegalBasis: string;
  urp: number;
  urpNote: string;
  tuoLPAG: string;
  contratacionesLaw: string;
}

/**
 * Obtiene la fecha actual en la zona horaria oficial del Perú (America/Lima).
 */
export function getLimaDate(): Date {
  const now = new Date();
  const limaString = now.toLocaleString('en-US', { timeZone: 'America/Lima' });
  return new Date(limaString);
}

/**
 * Formatea la fecha de Lima en lenguaje formal en español: "2 de noviembre de 2026".
 */
export function getLimaDateFormatted(): string {
  const d = getLimaDate();
  const day = d.getDate();
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/**
 * Retorna los valores paramétricos vigentes según la fecha procesal consultada.
 */
export function getParametricValues(date: Date = getLimaDate()): ParametricValues {
  const year = date.getFullYear();
  // RMV: S/ 1,230 a partir del 1 de octubre de 2026 (D.S. 015-2026-TR). Anterior: S/ 1,130.
  const isPostOct2026 = date >= new Date('2026-10-01T00:00:00');
  const rmv = isPostOct2026 ? 1230 : 1130;
  const familyAllowanceAmount = isPostOct2026 ? 123.0 : 113.0;

  return {
    uit: year === 2026 ? 5500 : 5500,
    uitLegalBasis: 'D.S. N° 301-2025-EF',
    rmv,
    rmvLegalBasis: 'D.S. N° 015-2026-TR',
    familyAllowancePercent: 0.10,
    familyAllowanceAmount,
    familyAllowanceLegalBasis: 'Ley N° 25129',
    urp: 550,
    urpNote: '10% de la UIT, según Disposición Complementaria Única del CPC',
    tuoLPAG: 'D.S. N° 006-2026-JUS (derogó D.S. N° 004-2019-JUS)',
    contratacionesLaw: 'Ley N° 32069 y D.S. N° 009-2025-EF / D.S. N° 001-2026-EF (OECE)',
  };
}

/**
 * Bloque estructurado de anclaje temporal y valores paramétricos para inyección en el prompt del sistema.
 */
export function buildTemporalAnchorBlock(date: Date = getLimaDate()): string {
  const params = getParametricValues(date);
  const formattedDate = getLimaDateFormatted();

  return `
══════════════════════════════════════════════════════════════════════
ANCLAJE TEMPORAL Y VALORES PARAMÉTRICOS OFICIALES (LIMA, PERÚ)
══════════════════════════════════════════════════════════════════════
FECHA ACTUAL EN LIMA: ${formattedDate}.
VALORES OFICIALES VIGENTES:
- Unidad Impositiva Tributaria (UIT 2026): S/ ${params.uit.toLocaleString('es-PE')} (${params.uitLegalBasis})
- Remuneración Mínima Vital (RMV): S/ ${params.rmv.toLocaleString('es-PE')} (${params.rmvLegalBasis})
- Asignación Familiar: S/ ${params.familyAllowanceAmount.toFixed(2)} (10% RMV, ${params.familyAllowanceLegalBasis})
- Unidad de Referencia Procesal (URP): S/ ${params.urp.toFixed(2)} (${params.urpNote})
- TUO Ley 27444 (Procedimiento Administrativo General): ${params.tuoLPAG}
- Ley General de Contrataciones Públicas: ${params.contratacionesLaw}
REGLA DOGMÁTICA DE VIGENCIA:
- Todo cómputo procesal, cuantía, vía o plazo de hoy se rige por la normativa y parámetros vigentes a esta fecha.
- Si un valor o fecha no consta expresamente en este bloque o en las fuentes [F#], márcalo como [Por verificar].
══════════════════════════════════════════════════════════════════════
`;
}

