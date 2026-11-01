/**
 * Case Memory Manager — HARDMAN
 * 
 * Gestor estructurado de memoria de expediente y continuidad conversacional.
 * Extrae y preserva:
 * 1. Hechos admitidos e inmutables del caso
 * 2. Normas y casaciones vinculantes acordadas
 * 3. Directivas e instrucciones procesales del letrado patrocinante
 * 4. Correcciones del abogado (actualizando datos anteriores sin amnesia)
 */

export interface CaseFact {
  category: 'FACT' | 'NORM' | 'DIRECTIVE' | 'PARTY';
  key: string;
  statement: string;
  confidence: number;
}

export class CaseMemoryManager {
  /**
   * Analiza el historial completo de mensajes y extrae la memoria viva estructurada
   */
  public static extractStructuredMemory(messages: any[]): {
    facts: string[];
    norms: string[];
    directives: string[];
    formattedBlock: string;
  } {
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return { facts: [], norms: [], directives: [], formattedBlock: '' };
    }

    const fullHistory = messages
      .filter((m) => m && typeof m.content === 'string')
      .map((m) => m.content);

    const fullText = fullHistory.join('\n');
    if (fullText.length < 30) {
      return { facts: [], norms: [], directives: [], formattedBlock: '' };
    }

    const factsMap = new Map<string, string>();
    const normsMap = new Map<string, string>();
    const directivesMap = new Map<string, string>();

    // ── 1. NORMAS Y CASACIONES VINCULANTES ACORDADAS ──
    if (/30364/.test(fullText)) {
      normsMap.set('ley_30364', 'Ley N° 30364 (Prevención y sanción de la violencia contra las mujeres y grupo familiar)');
    }
    if (/tercer\s+pleno\s+casatorio|4618[-–/]?2007/i.test(fullText)) {
      normsMap.set('iii_pleno', 'Tercer Pleno Casatorio Civil (Casación N° 4618-2007/Lima: cónyuge más perjudicado e indemnización obligatoria / adjudicación preferente)');
    }
    if (/2402[-–/]?2012/.test(fullText)) {
      normsMap.set('cas_2402', 'Casación N° 2402-2012/Lima (Daño moral in re ipsa derivado de denuncias calumniosas y zozobra procesal conyugal)');
    }
    if (/333.*(?:inciso|inc\.?)\s*4|injuria\s+grave/i.test(fullText)) {
      normsMap.set('art_333_4', 'Art. 333° inc. 4 del Código Civil (Injuria Grave que hace insoportable la vida en común)');
    }
    if (/333.*(?:inciso|inc\.?)\s*12|separaci[oó]n\s+de\s+hecho/i.test(fullText)) {
      normsMap.set('art_333_12', 'Art. 333° inc. 12 del Código Civil (Separación de Hecho ininterrumpida por más de 2 años)');
    }
    if (/345[-–]a/i.test(fullText)) {
      normsMap.set('art_345a', 'Art. 345-A° del Código Civil (Indemnización por daño personal y perjuicio al cónyuge inocente)');
    }
    if (/352/.test(fullText)) {
      normsMap.set('art_352', 'Art. 352° del Código Civil (Pérdida de gananciales procedentes de los bienes del cónyuge culpable)');
    }
    if (/197.*cpc|adquisici[oó]n\s+procesal|comunidad\s+de\s+la\s+prueba/i.test(fullText)) {
      normsMap.set('art_197_cpc', 'Art. 197° del Código Procesal Civil (Principio de Adquisición Procesal / Comunidad de la Prueba)');
    }
    if (/131.*cpc/.test(fullText)) {
      normsMap.set('art_131_cpc', 'Art. 131° del Código Procesal Civil (Firma de la Parte / Recurrente — Inadmisibilidad por omisión de firma del interesado)');
    }
    if (/132.*cpc|290.*lopj/.test(fullText)) {
      normsMap.set('art_132_cpc', 'Art. 132° CPC y Art. 290° LOPJ (Defensa Técnica Cautiva y Firma del Abogado Patrocinante)');
    }
    if (/31590|tenencia\s+compartida/i.test(fullText)) {
      normsMap.set('ley_31590', 'Ley N° 31590 (Tenencia Compartida como regla general preferente sin favoritismo maternal)');
    }
    if (/1585|prisi[oó]n\s+preventiva.*5\s+a[ñn]os/i.test(fullText)) {
      normsMap.set('dl_1585', 'Decreto Legislativo N° 1585 (Pronosis de pena superior a 5 años para prisión preventiva)');
    }

    // ── 2. HECHOS Y PARÁMETROS FÁCTICOS INMUTABLES ──
    const dateSepMatch = fullText.match(/(?:separaci[oó]n|separados)\s+(?:desde|el)\s+([0-9]{1,2}\s+de\s+[a-z]+\s+(?:de\s+)?[0-9]{4})/i);
    if (dateSepMatch) {
      factsMap.set('fecha_separacion', `Fecha cierta de separación conyugal ininterrumpida: ${dateSepMatch[1].trim()}`);
    } else if (/01\s+de\s+s[e|i]ptiembre\s+(?:de\s+)?2022/i.test(fullText)) {
      factsMap.set('fecha_separacion', 'Fecha cierta de separación conyugal ininterrumpida: 01 de septiembre de 2022 (acreditada con Acta 299-2023)');
    }

    if (/dp\s*world/i.test(fullText)) {
      factsMap.set('laboral', 'Despido y precarización económica en DP World Callao S.R.L. ocasionados por persecución de la contraparte');
    }
    if (/e001[-–]?6|recibo\s+por\s+honorarios/i.test(fullText)) {
      factsMap.set('ingresos', 'Precarización económica actual acreditada con Recibo por Honorarios Electrónico N° E001-6');
    }
    if (/no\s+(?:tengo|tiene)\s+bienes\s+propios|carece\s+de\s+bienes\s+propios/i.test(fullText)) {
      factsMap.set('bienes', 'El demandado carece de bienes propios (los bienes son sociales y se liquidan en ejecución de sentencia)');
    }
    if (/discapacidad.*menor|carnet.*discapacidad|conadis/i.test(fullText)) {
      factsMap.set('salud_menor', 'Salud del menor / Carnet CONADIS: NO atacar ni desacreditar la salud del menor; enfocar la defensa en la solvencia económica de la madre y en la instrumentalización procesal');
    }
    const montoMatch = fullText.match(/indemnizaci[oó]n.*?(?:S\/?\.?\s*|soles\s*)([0-9]{1,3}(?:[,.][0-9]{3})*(?:\.[0-9]{2})?)/i);
    if (montoMatch) {
      factsMap.set('monto_indemnizatorio', `Monto indemnizatorio pretendido por Daño Moral y Personal: S/ ${montoMatch[1]}`);
    } else if (/133[,.]000/.test(fullText)) {
      factsMap.set('monto_indemnizatorio', 'Monto indemnizatorio por Daño Moral, Daño Personal y Proyecto de Vida: S/ 133,000.00');
    }

    // ── 3. DIRECTIVAS E INSTRUCCIONES PROCESALES DEL ABOGADO ──
    if (/desist\w+.*nulidad/i.test(fullText)) {
      directivesMap.set('desistimiento', 'Desistimiento expreso de la nulidad de todo lo actuado; reconducir DNI caducado como argumento de fondo');
    }
    if (/no\s+ingresar\s+(?:nuevos\s+)?medios\s+probatorios|sin\s+nuevos\s+anexos/i.test(fullText)) {
      directivesMap.set('anexos', 'NO ingresar nuevos anexos documentales; aplicar Principio de Adquisición Procesal sobre las pruebas de la actora');
    }
    if (/reconvenci[oó]n/i.test(fullText)) {
      directivesMap.set('dualidad', 'PRONUNCIAMIENTO DUAL OBLIGATORIO: Pronunciarse exhaustivamente sobre la Contestación Y de manera separada e independiente sobre la Reconvención');
    }

    // Detección de correcciones dinámicas del letrado ("no, la fecha es...", "rectifico:", "corrige:")
    const correctionMatch = fullText.match(/(?:no,\s+(?:la\s+fecha|el\s+monto|el\s+nombre)|rectifico:|te\s+corrijo:)\s*([^\n\.]+)/i);
    if (correctionMatch) {
      directivesMap.set('correccion_abogado', `Instrucción correctiva del patrocinante: ${correctionMatch[1].trim()}`);
    }

    const facts = Array.from(factsMap.values());
    const norms = Array.from(normsMap.values());
    const directives = Array.from(directivesMap.values());

    if (facts.length === 0 && norms.length === 0 && directives.length === 0) {
      return { facts: [], norms: [], directives: [], formattedBlock: '' };
    }

    const lines: string[] = [
      '════════════════════════════════════════════════════════════════',
      'MEMORIA HISTÓRICA ESTRUCTURADA DEL CASO (REGLAS Y ACUERDOS VINCULANTES)',
      '════════════════════════════════════════════════════════════════',
      'Parámetros jurídicos, fácticos y directivas procesales obligatorias establecidas con el abogado patrocinante:',
    ];

    if (norms.length > 0) {
      lines.push('\n1. MARCO LEGAL Y CASACIONES OBLIGATORIAS:');
      norms.forEach((n) => lines.push(`   • ${n}`));
    }
    if (facts.length > 0) {
      lines.push('\n2. HECHOS Y PARÁMETROS FÁCTICOS INMUTABLES:');
      facts.forEach((f) => lines.push(`   • ${f}`));
    }
    if (directives.length > 0) {
      lines.push('\n3. DIRECTIVAS PROCESALES DEL PATROCINANTE:');
      directives.forEach((d) => lines.push(`   • ${d}`));
    }

    lines.push('\n⛔ DIRECTIVA SUPREMA ANTI-AMNESIA:');
    lines.push('Está TERMINANTEMENTE PROHIBIDO olvidar, descartar o contradecir cualquiera de estas normas, hechos o directivas.');
    lines.push('Cualquier corrección u observación del abogado debe ser asimilada de inmediato sin perder ni omitir los puntos ya acordados.');
    lines.push('════════════════════════════════════════════════════════════════\n\n');

    return {
      facts,
      norms,
      directives,
      formattedBlock: '\n\n' + lines.join('\n'),
    };
  }
}
