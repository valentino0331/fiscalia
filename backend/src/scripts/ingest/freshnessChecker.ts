export interface FreshnessAlert {
  date: string;
  normTitle: string;
  officialId: string;
  targetP0Code: string;
  sourceUrl: string;
  summary: string;
}

export class FreshnessChecker {
  private static readonly P0_PATTERNS: Array<{ code: string; name: string; pattern: RegExp }> = [
    { code: 'CONST', name: 'Constitución Política del Perú', pattern: /(?:modifica|reforma).*(?:Constituci[oó]n\s+Pol[ií]tica)/i },
    { code: 'CC', name: 'Código Civil', pattern: /(?:modifica|deroga|incorpora).*(?:C[oó]digo\s+Civil|D\.?\s*Leg\.?\s*295)/i },
    { code: 'CPC', name: 'Código Procesal Civil', pattern: /(?:modifica|deroga|incorpora).*(?:C[oó]digo\s+Procesal\s+Civil|R\.?\s*M\.?\s*010-93-JUS)/i },
    { code: 'CP', name: 'Código Penal', pattern: /(?:modifica|deroga|incorpora).*(?:C[oó]digo\s+Penal|D\.?\s*Leg\.?\s*635)/i },
    { code: 'NCPP', name: 'Nuevo Código Procesal Penal', pattern: /(?:modifica|deroga|incorpora).*(?:C[oó]digo\s+Procesal\s+Penal|D\.?\s*Leg\.?\s*957)/i },
    { code: 'LPCL', name: 'TUO D. Leg. 728 (LPCL)', pattern: /(?:modifica|deroga|incorpora).*(?:D\.?\s*Leg\.?\s*728|D\.?\s*S\.?\s*003-97-TR|Productividad\s+y\s+Competitividad\s+Laboral)/i },
    { code: 'NLPT', name: 'Nueva Ley Procesal del Trabajo', pattern: /(?:modifica|deroga|incorpora).*(?:Ley\s+29497|Nueva\s+Ley\s+Procesal\s+del\s+Trabajo)/i },
    { code: 'CT', name: 'Código Tributario', pattern: /(?:modifica|deroga|incorpora).*(?:C[oó]digo\s+Tributario|D\.?\s*S\.?\s*133-2013-EF)/i },
    { code: 'LGS', name: 'Ley General de Sociedades', pattern: /(?:modifica|deroga|incorpora).*(?:Ley\s+26887|Ley\s+General\s+de\s+Sociedades)/i },
    { code: 'LPAG', name: 'TUO Ley 27444 (LPAG)', pattern: /(?:modifica|deroga|incorpora).*(?:Ley\s+27444|D\.?\s*S\.?\s*006-2026-JUS|D\.?\s*S\.?\s*004-2019-JUS|Procedimiento\s+Administrativo\s+General)/i },
    { code: 'LGCP', name: 'Ley de Contrataciones del Estado (Ley 32069)', pattern: /(?:modifica|deroga|incorpora).*(?:Ley\s+32069|D\.?\s*S\.?\s*009-2025-EF|Contrataciones\s+del\s+Estado)/i },
    { code: 'CNA', name: 'Código de los Niños y Adolescentes', pattern: /(?:modifica|deroga|incorpora).*(?:Ley\s+27337|Ni[ñn]os\s+y\s+Adolescentes)/i },
    { code: 'L30364', name: 'Ley 30364 (Violencia contra la mujer)', pattern: /(?:modifica|deroga|incorpora).*(?:Ley\s+30364|violencia\s+contra\s+las\s+mujeres)/i },
    { code: 'LGM', name: 'TUO Ley General de Minería', pattern: /(?:modifica|deroga|incorpora).*(?:D\.?\s*S\.?\s*014-92-EM|Ley\s+General\s+de\s+Miner[ií]a)/i },
    { code: 'LPCA', name: 'TUO Ley 27584 (Contencioso Administrativo)', pattern: /(?:modifica|deroga|incorpora).*(?:Ley\s+27584|D\.?\s*S\.?\s*011-2019-JUS|Proceso\s+Contencioso\s+Administrativo)/i },
  ];

  /**
   * Formatea una fecha YYYYMMDD para El Peruano
   */
  public static formatDateElPeruano(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}${m}${day}`;
  }

  /**
   * Consulta las normas legales publicadas en El Peruano en un rango de fechas
   */
  public async checkFreshness(date?: Date): Promise<FreshnessAlert[]> {
    const targetDate = date || new Date();
    const dateStr = FreshnessChecker.formatDateElPeruano(targetDate);
    const searchUrl = `https://busquedas.elperuano.pe/?fechaIni=${dateStr}&fechaFin=${dateStr}&tipoPublicacion=NL&ci=ONLY&start=0`;

    const alerts: FreshnessAlert[] = [];
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HardmanFreshnessBot/1.0',
        },
      });

      if (!response.ok) {
        console.warn(`[FreshnessChecker] Error HTTP ${response.status} al consultar El Peruano`);
        return alerts;
      }

      const html = await response.text();
      // Extraer dispositivos publicados
      const itemRegex = /<a\s+[^>]*href="\/dispositivo\/NL\/([0-9a-zA-Z\-_]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match;
      const seenIds = new Set<string>();

      while ((match = itemRegex.exec(html)) !== null) {
        const officialId = match[1];
        if (seenIds.has(officialId)) continue;
        seenIds.add(officialId);

        const rawTitle = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (rawTitle.length < 10) continue;

        // Contrastar contra patrones P0
        for (const p0 of FreshnessChecker.P0_PATTERNS) {
          if (p0.pattern.test(rawTitle)) {
            alerts.push({
              date: dateStr,
              normTitle: rawTitle,
              officialId,
              targetP0Code: p0.code,
              sourceUrl: `https://busquedas.elperuano.pe/dispositivo/NL/${officialId}`,
              summary: `Alerta oficial: El Peruano publicó una norma que impacta el cuerpo normativo '${p0.name}' (${p0.code}).`,
            });
          }
        }
      }
    } catch (err: any) {
      console.warn('[FreshnessChecker] Error al ejecutar verificación de frescura:', err.message);
    }

    return alerts;
  }
}

