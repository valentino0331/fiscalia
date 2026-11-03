/**
 * Case Memory Manager — HARDMAN
 * 
 * Gestor estructurado de memoria de expediente y continuidad conversacional.
 * Extrae y preserva dinámicamente y sin acoplamiento a casos específicos:
 * 1. Partes procesales (Demandante, Demandado, Agraviado, Imputado)
 * 2. Expedientes judiciales y carpetas fiscales
 * 3. Órgano jurisdiccional o autoridad competente
 * 4. Materia y pretensión sustantiva
 * 5. Hechos fácticos fechados (Tempus Regit Actum)
 * 6. Cuantías y montos económicos
 * 7. Normas, artículos y precedentes vinculantes acordados
 * 8. Directivas procesales del letrado y correcciones dinámicas
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

    const userMessages = messages.filter((m) => m && m.role === 'user' && typeof m.content === 'string');
    let targetHistory = messages
      .filter((m) => m && typeof m.content === 'string')
      .map((m) => m.content);

    // Prevención de contaminación cruzada: si se detecta un nuevo expediente o cambio de caso
    if (userMessages.length > 1) {
      const latestMsg = userMessages[userMessages.length - 1].content;
      const hasNewCaseSwitch = /(?:nuevo\s+caso|otro\s+caso|olvida\s+el\s+caso|cambiando\s+de\s+caso|nueva\s+carpeta|nuevo\s+expediente)\b/i.test(latestMsg) ||
        (/\b(?:Exp(?:ediente)?\.?|Carpeta\s+Fiscal)\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,7}[-–/][0-9]{4})/i.test(latestMsg) &&
         /\b(?:Exp(?:ediente)?\.?|Carpeta\s+Fiscal)\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,7}[-–/][0-9]{4})/i.test(userMessages[0].content) &&
         !latestMsg.includes(userMessages[0].content.slice(0, 30)));

      if (hasNewCaseSwitch) {
        let lastSwitchIdx = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
          const m = messages[i];
          if (m && m.role === 'user' && typeof m.content === 'string') {
            if (
              /(?:nuevo\s+caso|otro\s+caso|olvida\s+el\s+caso|cambiando\s+de\s+caso|nueva\s+carpeta|nuevo\s+expediente)\b/i.test(m.content) ||
              /\b(?:Exp(?:ediente)?\.?|Carpeta\s+Fiscal)\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,7}[-–/][0-9]{4})/i.test(m.content)
            ) {
              lastSwitchIdx = i;
              break;
            }
          }
        }
        if (lastSwitchIdx >= 0) {
          targetHistory = messages.slice(lastSwitchIdx).filter((m) => m && typeof m.content === 'string').map((m) => m.content);
        }
      }
    }

    const fullText = targetHistory.join('\n');
    if (fullText.length < 25) {
      return { facts: [], norms: [], directives: [], formattedBlock: '' };
    }

    const factsMap = new Map<string, string>();
    const normsMap = new Map<string, string>();
    const directivesMap = new Map<string, string>();

    // ── 1. NORMAS Y CASACIONES VINCULANTES IDENTIFICADAS EN EL DIÁLOGO ──
    if (/30364/.test(fullText)) {
      normsMap.set('ley_30364', 'Ley N° 30364 (Prevención y sanción de la violencia contra las mujeres y grupo familiar)');
    }
    if (/tercer\s+pleno\s+casatorio|4664[-–/]?2010/i.test(fullText)) {
      normsMap.set('iii_pleno', 'Tercer Pleno Casatorio Civil (Casación N° 4664-2010/Puno: cónyuge más perjudicado e indemnización obligatoria / adjudicación preferente)');
    }
    if (/cuarto\s+pleno\s+casatorio|2195[-–/]?2011/i.test(fullText)) {
      normsMap.set('iv_pleno', 'IV Pleno Casatorio Civil (Casación N° 2195-2011/Ucayali: desalojo por ocupación precaria y supuestos vinculantes)');
    }
    if (/segundo\s+pleno\s+casatorio|2229[-–/]?2008/i.test(fullText)) {
      normsMap.set('ii_pleno', 'II Pleno Casatorio Civil (Casación N° 2229-2008/Lambayeque: prescripción adquisitiva de dominio y coposesión)');
    }
    if (/primer\s+pleno\s+casatorio|1465[-–/]?2007/i.test(fullText)) {
      normsMap.set('i_pleno', 'I Pleno Casatorio Civil (Casación N° 1465-2007/Cajamarca: transacción extrajudicial y excepción de conclusión del proceso)');
    }
    if (/sexto\s+pleno\s+casatorio|2402[-–/]?2012/i.test(fullText)) {
      normsMap.set('vi_pleno', 'VI Pleno Casatorio Civil (Casación N° 2402-2012/Lambayeque: ejecución de garantías reales y estado de cuenta de saldo deudor)');
    }
    if (/s[eé]ptimo\s+pleno\s+casatorio|3671[-–/]?2014/i.test(fullText)) {
      normsMap.set('vii_pleno', 'VII Pleno Casatorio Civil (Casación N° 3671-2014/Lima: tercería de propiedad y embargo inscrito)');
    }
    if (/octavo\s+pleno\s+casatorio|3006[-–/]?2015/i.test(fullText)) {
      normsMap.set('viii_pleno', 'VIII Pleno Casatorio Civil (Casación N° 3006-2015/Junín: disposición de bienes de la sociedad de gananciales)');
    }
    if (/noveno\s+pleno\s+casatorio|4442[-–/]?2015/i.test(fullText)) {
      normsMap.set('ix_pleno', 'IX Pleno Casatorio Civil (Casación N° 4442-2015/Moquegua: otorgamiento de escritura pública y nulidad manifiesta)');
    }
    if (/d[eé]cimo\s+pleno\s+casatorio|1242[-–/]?2017/i.test(fullText)) {
      normsMap.set('x_pleno', 'X Pleno Casatorio Civil (Casación N° 1242-2017/Lima Este: prueba de oficio en el proceso civil)');
    }
    if (/626[-–/]?2013/.test(fullText)) {
      normsMap.set('cas_626', 'Casación N° 626-2013/Moquegua (Doctrina vinculante sobre los 5 presupuestos de prisión preventiva)');
    }
    if (/04[-–/]?2010.*(?:acuerdo|ap)/i.test(fullText)) {
      normsMap.set('ap_04_2010', 'Acuerdo Plenario N° 04-2010/CJ-116 (Audiencia de Tutela de Derechos residual contra afectaciones fiscales/policiales)');
    }
    if (/05[-–/]?2023.*(?:acuerdo|ap)/i.test(fullText)) {
      normsMap.set('ap_05_2023', 'Acuerdo Plenario N° 05-2023/CIJ-112 (Control difuso e inaplicabilidad de la Ley 31751 sobre prescripción)');
    }
    if (/31590|tenencia\s+compartida/i.test(fullText)) {
      normsMap.set('ley_31590', 'Ley N° 31590 (Tenencia Compartida como regla general preferente)');
    }
    if (/32069|oece/i.test(fullText)) {
      normsMap.set('ley_32069', 'Ley N° 32069 (Ley General de Contrataciones Públicas / OECE y TCP)');
    }
    if (/32155/i.test(fullText)) {
      normsMap.set('ley_32155', 'Ley N° 32155 (Reforma de cuantías procesales laborales ante Juzgados de Paz Letrado)');
    }
    if (/1585/i.test(fullText)) {
      normsMap.set('dl_1585', 'Decreto Legislativo N° 1585 (Pronosis de pena superior a 5 años para prisión preventiva)');
    }
    if (/131.*cpc/.test(fullText)) {
      normsMap.set('art_131_cpc', 'Art. 131° del Código Procesal Civil (Firma de la Parte / Recurrente — Subsanación personal obligatoria)');
    }
    if (/132.*cpc|290.*lopj/.test(fullText)) {
      normsMap.set('art_132_cpc', 'Art. 132° CPC y Art. 290° LOPJ (Defensa Técnica Cautiva y Firma del Abogado)');
    }
    if (/197.*cpc|adquisici[oó]n\s+procesal|comunidad\s+de\s+la\s+prueba/i.test(fullText)) {
      normsMap.set('art_197_cpc', 'Art. 197° CPC (Principio de Adquisición Procesal / Comunidad de la Prueba)');
    }
    if (/333.*(?:inciso|inc\.?)\s*12|separaci[oó]n\s+de\s+hecho/i.test(fullText)) {
      normsMap.set('art_333_12', 'Art. 333° inc. 12 del Código Civil (Separación de Hecho ininterrumpida por más de 2 años)');
    }
    if (/345[-–]a/i.test(fullText)) {
      normsMap.set('art_345a', 'Art. 345-A° del Código Civil (Indemnización u opción de adjudicación preferente al cónyuge más perjudicado)');
    }

    // ── 2. EXTRACCIÓN DINÁMICA DE PARTES, EXPEDIENTE Y PARÁMETROS DEL CASO ──
    const expedMatch = fullText.match(/\b(?:Exp(?:ediente)?\.?|Carpeta\s+Fiscal|Caso)\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,7}[-–/][0-9]{4}(?:[-–/][0-9]{1,4})?(?:[-–/][A-Za-z0-9-]+)?)/i);
    if (expedMatch) {
      factsMap.set('expediente', `Expediente / Carpeta del Proceso: ${expedMatch[0].trim()}`);
    }

    const demandanteMatch = fullText.match(/\b(?:demandante|actora?|agraviad[oa]|denunciante):\s*([^\n\.;,]{3,60})/i);
    if (demandanteMatch) {
      factsMap.set('demandante', `Sujeto Activo / Demandante: ${demandanteMatch[1].trim()}`);
    }

    const demandadoMatch = fullText.match(/\b(?:demandad[oa]|emplazad[oa]|imputad[oa]|investigad[oa]|denunciad[oa]):\s*([^\n\.;,]{3,60})/i);
    if (demandadoMatch) {
      factsMap.set('demandado', `Sujeto Pasivo / Demandado: ${demandadoMatch[1].trim()}`);
    }

    const juzgadoMatch = fullText.match(/\b((?:[0-9]{1,2}[°º]?\s+)?(?:Juzgado|Sala|Fiscalía|Tribunal)\s+[^\n\.,;]{4,60})/i);
    if (juzgadoMatch) {
      factsMap.set('autoridad', `Órgano Judicial o Fiscal: ${juzgadoMatch[1].trim()}`);
    }

    const dateFactMatch = fullText.match(/\b(?:separaci[oó]n|separados|cese(?:\s+laboral)?|despido(?:\s+arbitrario)?|notificaci[oó]n|intervenci[oó]n|hechos(?:\s+ocurridos)?)\s+(?:(?:ocurrid[oa]s?\s+)?(?:desde|el|en|con\s+fecha)\s+)?([0-9]{1,2}\s+de\s+[a-z]+\s+(?:de\s+)?[0-9]{4}|[0-9]{1,2}[\/-][0-9]{1,2}[\/-][0-9]{4})/i);
    if (dateFactMatch) {
      const extractedDate = dateFactMatch[1] || dateFactMatch[0];
      factsMap.set('fecha_hechos', `Fecha cierta de los hechos fácticos: ${extractedDate.trim()}`);
    }

    const montoMatch = fullText.match(/\b(?:indemnizaci[oó]n|pretensi[oó]n|monto|deuda|liquidaci[oó]n|reparaci[oó]n\s+civil).*?(?:S\/?\.?\s*|soles\s*)([0-9]{1,3}(?:[,.][0-9]{3})*(?:\.[0-9]{2})?)/i);
    if (montoMatch) {
      factsMap.set('cuantia', `Cuantía / Monto pretendido o liquidado: S/ ${montoMatch[1].trim()}`);
    }

    // ── 3. DIRECTIVAS E INSTRUCCIONES PROCESALES DEL ABOGADO ──
    if (/desist\w+.*nulidad/i.test(fullText)) {
      directivesMap.set('desistimiento', 'Desistimiento expreso de nulidad; reconducir el argumento como defensa de fondo');
    }
    if (/no\s+ingresar\s+(?:nuevos\s+)?medios\s+probatorios|sin\s+nuevos\s+anexos/i.test(fullText)) {
      directivesMap.set('anexos', 'NO ingresar nuevos anexos documentales; aplicar Principio de Adquisición Procesal');
    }
    if (/reconvenci[oó]n/i.test(fullText)) {
      directivesMap.set('dualidad', 'PRONUNCIAMIENTO DUAL OBLIGATORIO: Pronunciarse exhaustivamente sobre Contestación Y de manera separada sobre Reconvención');
    }

    // Detección de correcciones dinámicas del letrado ("no, la fecha es...", "rectifico:", "corrige:")
    const correctionMatch = fullText.match(/(?:no,\s+(?:la\s+fecha|el\s+monto|el\s+nombre|el\s+artículo|la\s+norma)|rectifico:|te\s+corrijo:)\s*([^\n\.]+)/i);
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
      'Parámetros jurídicos, fácticos y directivas procesales obligatorias fijadas en el caso:',
    ];

    if (norms.length > 0) {
      lines.push('\n1. MARCO LEGAL Y PRECEDENTES VINCULANTES:');
      norms.forEach((n) => lines.push(`   • ${n}`));
    }
    if (facts.length > 0) {
      lines.push('\n2. SUJETOS, EXPEDIENTE Y HECHOS FÁCTICOS DEL PROCESO:');
      facts.forEach((f) => lines.push(`   • ${f}`));
    }
    if (directives.length > 0) {
      lines.push('\n3. DIRECTIVAS PROCESALES DEL LETRADO PATROCINANTE:');
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
