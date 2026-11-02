/**
 * Streaming Citation Filter — HARDMAN
 * 
 * Filtro de flujo continuo (SSE) en tiempo real para validación jurídica.
 * Evita la fuga de casaciones, acuerdos plenarios o citas alucinadas al navegador:
 * 1. Mantiene una ventana deslizante de tokens entrantes.
 * 2. Cuando detecta un patrón de citación judicial (ej. "Casación N°", "Cas.", "AP"),
 *    retiene el fragmento en búfer hasta delimitar la cita completa.
 * 3. Valida la cita contra el registro de precedentes verificados antes de emitirla al cliente.
 * 4. Si la cita es legítima y verificada, se transmite de inmediato.
 * 5. Si la cita es ficticia o no verificada, sustituye el número judicial inventado por
 *    "[criterio jurisprudencial pendiente de verificación documental]" ANTES de emitirlo,
 *    impidiendo que el usuario reciba referencias falsas en su pantalla.
 * 6. Al finalizar el stream (flush), emite las alertas de rigor procesal correspondientes.
 */

import { VERIFIED_JURISPRUDENCE_REGISTRY } from './legalCitationValidator';
import { LegalSourceRegistry, validateStatutoryArticle } from './legalSourceRegistry';

export class StreamingCitationFilter {
  private buffer: string = '';
  private outCallback: (chunk: string) => void;
  private recentEmittedText: string = '';
  private unverifiedCitations: string[] = [];
  private static readonly TRIGGER_REGEX = /(?:casaci[óo]n|cas\.|acuerdo\s+plenario|ap\s*\d|pleno\s+casatorio|pleno\s+jurisdiccional|rtf\s*(?:n[°º.]?)?|directiva\s*(?:oece|osce)|resoluci[óo]n\s+(?:del\s+tribunal\s+fiscal|de\s+oefa|del\s+tfa|de\s+indecopi)|ley\s*(?:n[°º.]?\s*)?30225|d\.?\s*s\.?\s*004[-–]2019|ley\s*(?:n[°º.]?\s*)?28677|c[óo]digo\s+civil\s+federal|ley\s+de\s+enjuiciamiento|c[óo]digo\s+general\s+del\s+proceso|c[óo]digo\s+nacional\s+de\s+procedimientos\s+penales|suprema\s+corte\s+de\s+justicia\s+de\s+la\s+naci[óo]n|estatuto\s+de\s+los\s+trabajadores|ley\s+federal\s+del\s+trabajo|c[óo]digo\s+fiscal\s+de\s+la\s+federaci[óo]n|prodecon|ley\s+general\s+de\s+sociedades\s+mercantiles|ley\s+de\s+sociedades\s+de\s+capital|ley\s+de\s+minas|tacrc|tribunal\s+supremo\s+espa[ñn]ol|art[íi]culo\s*\d+|art\.\s*\d+)/i;
  private static readonly SAFE_LOOKAHEAD = 25; // Longitud máxima para no cortar una palabra trigger

  constructor(outCallback: (chunk: string) => void) {
    this.outCallback = outCallback;
  }

  private emit(chunk: string): void {
    if (!chunk) return;
    this.recentEmittedText = (this.recentEmittedText + chunk).slice(-300);
    this.outCallback(chunk);
  }

  /**
   * Procesa un fragmento de texto entrante del LLM
   */
  public processChunk(chunk: string): void {
    if (!chunk) return;
    this.buffer += chunk;
    this.drainBuffer(false);
  }

  /**
   * Drena los tokens seguros del búfer hacia el cliente
   */
  private drainBuffer(isFinal: boolean): void {
    while (this.buffer.length > 0) {
      // 1. Buscar si hay algún trigger de cita judicial en el búfer
      const triggerMatch = this.buffer.match(StreamingCitationFilter.TRIGGER_REGEX);

      if (!triggerMatch || triggerMatch.index === undefined) {
        // No hay triggers de citas en el búfer
        if (isFinal) {
          this.emit(this.buffer);
          this.buffer = '';
        } else if (this.buffer.length > StreamingCitationFilter.SAFE_LOOKAHEAD) {
          const safeToEmit = this.buffer.slice(0, this.buffer.length - StreamingCitationFilter.SAFE_LOOKAHEAD);
          this.emit(safeToEmit);
          this.buffer = this.buffer.slice(this.buffer.length - StreamingCitationFilter.SAFE_LOOKAHEAD);
        }
        break;
      }

      const triggerIndex = triggerMatch.index;

      // 2. Si hay texto seguro antes del trigger, emitirlo
      if (triggerIndex > 0) {
        const preText = this.buffer.slice(0, triggerIndex);
        this.emit(preText);
        this.buffer = this.buffer.slice(triggerIndex);
      }

      // 3. El búfer ahora inicia con el trigger. Intentar resolver la cita completa.
      // Patrón de casación: ej. "Casación N° 4618-2007/Lima", "Casación Laboral N° 12475-2014", "Cas. 99999-2025"
      const casRegex = /^(?:Casaci[óo]n|Cas\.)\s*(?:(Laboral|Penal|Civil|Constitucional|Social|Comercial)\s+)?(?:N[°º.]?|Nro\.?|Número)?\s*([0-9]{1,5})[-–/]([0-9]{4})(?:\s*[\/\-]\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+))?([,\.;\s\n]|$)/i;
      const casMatch = this.buffer.match(casRegex);

      if (casMatch) {
        const specialty = casMatch[1] ? casMatch[1].trim() : '';
        const docketNum = casMatch[2];
        const year = casMatch[3];
        const district = casMatch[4] ? casMatch[4].trim() : '';
        const trailingDelimiter = casMatch[5] || '';
        const rawCitation = casMatch[0].slice(0, casMatch[0].length - trailingDelimiter.length).trim();
        const lookupKey = `${docketNum}-${year}`;

        const isVerified = Boolean(LegalSourceRegistry.getByShortKey(lookupKey) || VERIFIED_JURISPRUDENCE_REGISTRY[lookupKey]);

        if (isVerified) {
          // Cita verificada en el compendio oficial de la Corte Suprema: emitir tal cual
          this.emit(rawCitation + trailingDelimiter);
        } else {
          // Cita judicial no verificada / inventada:
          // REGLA SUPREMA: NUNCA emitir el docket inventado ni frase genérica engañosa.
          this.unverifiedCitations.push(rawCitation);
          const sanitizedCitation = `[criterio jurisprudencial pendiente de verificación documental]${trailingDelimiter}`;
          this.emit(sanitizedCitation);
        }

        this.buffer = this.buffer.slice(casMatch[0].length);
        continue;
      }

      // Patrón de Acuerdo Plenario: ej. "Acuerdo Plenario N° 01-2019/CIJ-116", "AP 06-2009"
      const apRegex = /^(?:Acuerdo\s+Plenario|AP)\s*(?:Extraordinario|Ext\.?)?\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,3})[-–/]([0-9]{4})(?:\/([A-Z0-9-]+))?([,\.;\s\n]|$)/i;
      const apMatch = this.buffer.match(apRegex);

      if (apMatch) {
        const apNum = apMatch[1].padStart(2, '0');
        const apYear = apMatch[2];
        const trailingDelimiter = apMatch[4] || '';
        const rawCitation = apMatch[0].slice(0, apMatch[0].length - trailingDelimiter.length).trim();
        const lookupKey = `${apNum}-${apYear}`;

        const isVerified = Boolean(LegalSourceRegistry.getByShortKey(lookupKey) || VERIFIED_JURISPRUDENCE_REGISTRY[lookupKey]);

        if (isVerified) {
          this.emit(rawCitation + trailingDelimiter);
        } else {
          this.unverifiedCitations.push(rawCitation);
          const sanitizedCitation = `[acuerdo plenario pendiente de verificación documental]${trailingDelimiter}`;
          this.emit(sanitizedCitation);
        }

        this.buffer = this.buffer.slice(apMatch[0].length);
        continue;
      }

      // Patrón de Pleno Casatorio Civil: I al X únicamente
      const VALID_CIVIL_PLENOS = new Set([
        'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
        '1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°', '10°',
        'PRIMER', 'SEGUNDO', 'TERCER', 'TERCERO', 'CUARTO', 'QUINTO',
        'SEXTO', 'SÉPTIMO', 'SEPTIMO', 'OCTAVO', 'NOVENO', 'DÉCIMO', 'DECIMO'
      ]);

      const plenoRegex = /^(?:([I|V|X]+|[0-9]{1,2}[°º]?|[a-záéíóúñ]+)\s+Pleno\s+Casatorio(?:\s+([A-Za-zÁÉÍÓÚáéíóúñÑ]+))?|Pleno\s+Casatorio\s+(?:([A-Za-zÁÉÍÓÚáéíóúñÑ]+)\s*)?(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,2}|[I|V|X]+)?)([,\.;\s\n]|$)/i;
      const plenoMatch = this.buffer.match(plenoRegex);
      if (plenoMatch) {
        const numPart = (plenoMatch[1] || plenoMatch[4] || '').toUpperCase();
        const specialty = (plenoMatch[2] || plenoMatch[3] || '').trim().toLowerCase();
        const trailing = plenoMatch[5] || '';
        const rawText = plenoMatch[0].slice(0, plenoMatch[0].length - trailing.length);

        if (specialty === 'mercantil' || specialty === 'comercial' || rawText.toLowerCase().includes('mercantil') || rawText.toLowerCase().includes('comercial')) {
          this.unverifiedCitations.push(rawText);
          this.emit(`[precedente inexistente: en el Perú no existen Plenos Casatorios Mercantiles/Comerciales]${trailing}`);
        } else if (VALID_CIVIL_PLENOS.has(numPart)) {
          this.emit(plenoMatch[0]);
        } else {
          this.unverifiedCitations.push(rawText);
          this.emit(`[criterio jurisprudencial pendiente de verificación documental: la Corte Suprema solo cuenta con X Plenos Casatorios Civiles]${trailing}`);
        }
        this.buffer = this.buffer.slice(plenoMatch[0].length);
        continue;
      }

      // Patrón de Pleno Jurisdiccional (Distrital, Regional, Nacional)
      const plenoJurisdiccionalRegex = /^(?:Pleno\s+Jurisdiccional\s+(?:Nacional|Distrital|Regional|Laboral|Civil|Penal|Comercial|de\s+Familia)?(?:\s+(?:de|del)?\s*([0-9]{4}))?)([,\.;\s\n]|$)/i;
      const pjMatch = this.buffer.match(plenoJurisdiccionalRegex);
      if (pjMatch) {
        const trailing = pjMatch[2] || '';
        const rawText = pjMatch[0].slice(0, pjMatch[0].length - trailing.length);
        const yearPart = pjMatch[1] || '';
        const isVerified = Boolean(LegalSourceRegistry.getByShortKey(`PJ-${yearPart}`));

        if (isVerified) {
          this.emit(pjMatch[0]);
        } else {
          this.unverifiedCitations.push(rawText);
          this.emit(`[criterio jurisprudencial pendiente de verificación documental]${trailing}`);
        }
        this.buffer = this.buffer.slice(pjMatch[0].length);
        continue;
      }

      // Patrón de RTF, Resoluciones Administrativas y Directivas no verificadas
      const rtfRegex = /^(?:RTF\s*(?:N[°º.]?|Nro\.?)?\s*([0-9]{1,6}(?:[-–][0-9]{1,2})?[-–][0-9]{4})|Resoluci[óo]n\s+(?:del\s+Tribunal\s+Fiscal|de\s+OEFA|del\s+TFA|de\s+INDECOPI)\s*N[°º.]?\s*([0-9A-Za-z\/\-]+)|Directiva\s*(?:OECE|OSCE)\s*N[°º.]?\s*([0-9]{1,4}[-–/][0-9]{4}(?:[-–][A-Za-z0-9]+)?))([,\.;\s\n]|$)/i;
      const rtfMatch = this.buffer.match(rtfRegex);
      if (rtfMatch) {
        const rtfKey = rtfMatch[1] || rtfMatch[2] || rtfMatch[3] || '';
        const trailing = rtfMatch[4] || '';
        const rawText = rtfMatch[0].slice(0, rtfMatch[0].length - trailing.length);
        const isVerified = Boolean(LegalSourceRegistry.getByShortKey(rtfKey));

        if (isVerified) {
          this.emit(rtfMatch[0]);
        } else {
          this.unverifiedCitations.push(rawText);
          this.emit(`[resolución administrativa pendiente de verificación documental]${trailing}`);
        }
        this.buffer = this.buffer.slice(rtfMatch[0].length);
        continue;
      }

      // Patrón de Ley 30225 derogada
      const ley30225Regex = /^(?:Ley\s*(?:N[°º.]?\s*)?30225|Ley\s+de\s+Contrataciones\s+del\s+Estado\s+30225)([,\.;\s\n]|$)/i;
      const ley30225Match = this.buffer.match(ley30225Regex);
      if (ley30225Match) {
        const trailing = ley30225Match[1] || '';
        this.emit(`[norma derogada Ley 30225 reemplazada por Ley 32069 (OECE/TCP)]${trailing}`);
        this.buffer = this.buffer.slice(ley30225Match[0].length);
        continue;
      }

      // Patrón de D.S. 004-2019-JUS derogado
      const ds004Regex = /^(?:D\.?\s*S\.?\s*(?:N[°º.]?\s*)?004[-–]2019[-–]JUS|Decreto\s+Supremo\s+004[-–]2019[-–]JUS)([,\.;\s\n]|$)/i;
      const ds004Match = this.buffer.match(ds004Regex);
      if (ds004Match) {
        const trailing = ds004Match[1] || '';
        this.emit(`[norma derogada D.S. 004-2019-JUS reemplazada por D.S. 006-2026-JUS]${trailing}`);
        this.buffer = this.buffer.slice(ds004Match[0].length);
        continue;
      }

      // Patrón de Ley 28677 derogada
      const ley28677Regex = /^(?:Ley\s*(?:N[°º.]?\s*)?28677|Ley\s+de\s+Garant[ií]as\s+Mobiliarias\s+28677)([,\.;\s\n]|$)/i;
      const ley28677Match = this.buffer.match(ley28677Regex);
      if (ley28677Match) {
        const trailing = ley28677Match[1] || '';
        this.emit(`[norma derogada Ley 28677 reemplazada por D.L. 1400 (SIGM)]${trailing}`);
        this.buffer = this.buffer.slice(ley28677Match[0].length);
        continue;
      }

      // Patrón de Normas Extranjeras no aplicables en el Perú
      const foreignRegex = /^(?:C[óo]digo\s+Civil\s+Federal|Ley\s+de\s+Enjuiciamiento\s+Civil|Ley\s+de\s+Enjuiciamiento\s+Criminal|C[óo]digo\s+General\s+del\s+Proceso|C[óo]digo\s+Nacional\s+de\s+Procedimientos\s+Penales|Suprema\s+Corte\s+de\s+Justicia\s+de\s+la\s+Naci[óo]n|Tribunal\s+Supremo\s+espa[ñn]ol|Estatuto\s+de\s+los\s+Trabajadores|Ley\s+Federal\s+del\s+Trabajo|C[óo]digo\s+Fiscal\s+de\s+la\s+Federaci[óo]n|PRODECON|Ley\s+General\s+de\s+Sociedades\s+Mercantiles|Ley\s+de\s+Sociedades\s+de\s+Capital|Ley\s+de\s+Minas|Tribunal\s+Administrativo\s+Central\s+de\s+Recursos\s+Contractuales|TACRC)([,\.;\s\n]|$)/i;
      const foreignMatch = this.buffer.match(foreignRegex);
      if (foreignMatch) {
        const trailing = foreignMatch[1] || '';
        const cleanContextBefore = this.recentEmittedText.replace(/\[norma\/tribunal for[áa]neo[^\]]*\]/gi, '');
        const contextAfter = this.buffer.slice(foreignMatch[0].length, foreignMatch[0].length + 100);
        const fullContext = cleanContextBefore + ' ' + contextAfter;
        const isComparative = /(?:a\s+diferencia\s+de|frente\s+a|en\s+el\s+derecho\s+comparado|comparad[oa]\s+con|en\s+contraste\s+con|mientras\s+que\s+en|a\s+nivel\s+comparado)/i.test(fullContext);

        if (isComparative) {
          this.emit(foreignMatch[0]);
        } else {
          this.emit(`[norma/tribunal foráneo no aplicable en el Perú — rige legislación peruana]${trailing}`);
        }
        this.buffer = this.buffer.slice(foreignMatch[0].length);
        continue;
      }

      // Patrón de Artículos con verificación de límites de códigos peruanos
      const artRegex = /^(?:Art[íi]culo|Art\.?)\s*([0-9]{1,5})(?:[-–]([A-Za-z0-9]+))?\s*(?:[º°\.]\s*)?(?:del|de\s+la|de\s+los|del\s+TUO\s+de\s+la)?\s*(C[óo]digo\s+Civil|C[óo]digo\s+Penal|C[óo]digo\s+Procesal\s+Civil|C[óo]digo\s+Procesal\s+Penal|Nuevo\s+C[óo]digo\s+Procesal\s+Penal|NCPP|CPC|CPP|CC|C\.P\.|C\.C\.|C\.P\.C\.|C[óo]digo\s+Tributario|C[óo]digo\s+Procesal\s+Constitucional|Constituci[óo]n(?:\s+Pol[íi]tica)?|Ley\s+General\s+de\s+Sociedades|LGS|LPAG|Nueva\s+Ley\s+Procesal\s+del\s+Trabajo|NLPT|Ley\s+de\s+T[íi]tulos\s+Valores)([,\.;\s\n]|$)/i;
      const artMatch = this.buffer.match(artRegex);
      if (artMatch) {
        const artNum = parseInt(artMatch[1], 10);
        const codeMention = artMatch[3];
        const trailing = artMatch[4] || '';
        const rawText = artMatch[0].slice(0, artMatch[0].length - trailing.length);
        const validation = validateStatutoryArticle(artNum, codeMention);

        if (!validation.isValid && validation.codeBoundary) {
          this.unverifiedCitations.push(rawText);
          this.emit(`[artículo inexistente: ${validation.codeBoundary.name} solo cuenta con ${validation.codeBoundary.maxArticle} artículos]${trailing}`);
        } else {
          this.emit(artMatch[0]);
        }
        this.buffer = this.buffer.slice(artMatch[0].length);
        continue;
      }

      // Si no coincide con un patrón completo pero aún no termina la línea o límite de longitud
      if (!isFinal && this.buffer.length < 80) {
        // Esperar más tokens para completar la cita
        break;
      }

      // Si llegó al final o superó 80 caracteres sin coincidir con una cita legal estructurada,
      // emitir el primer caracter y reevaluar para evitar bloqueos
      this.emit(this.buffer.charAt(0));
      this.buffer = this.buffer.slice(1);
    }
  }

  /**
   * Finaliza el flujo de streaming, drenando todo el búfer residual
   * y emitiendo el disclaimer procesal si hubo citas desclasificadas
   */
  public flush(): void {
    this.drainBuffer(true);

    if (this.unverifiedCitations.length > 0) {
      const disclaimer = `\n\n> ⚖️ **NOTA DE RIGOR Y AUDITORÍA PROCESAL (ESTÁNDAR HARDMAN):**\n` +
        this.unverifiedCitations.map(c => `> • **${c}:** No he podido verificar esta referencia en las fuentes jurídicas disponibles. No puedo presentarla como una cita auténtica ni utilizarla como fundamento confirmado. Al no existir fuente comprobable del expediente citado, se ha desclasificado y retirado el número judicial para evitar temeridad procesal, debiendo sustentarse la pretensión directamente en las normas legales aplicables.\n`).join('');
      this.emit(disclaimer);
    }
  }

  public getUnverifiedCitations(): string[] {
    return [...this.unverifiedCitations];
  }
}

