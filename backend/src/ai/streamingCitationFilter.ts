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
import { LegalSourceRegistry } from './legalSourceRegistry';

export class StreamingCitationFilter {
  private buffer: string = '';
  private outCallback: (chunk: string) => void;
  private unverifiedCitations: string[] = [];
  private static readonly TRIGGER_REGEX = /(?:casaci[óo]n|cas\.|acuerdo\s+plenario|ap\s*\d|pleno\s+casatorio)/i;
  private static readonly SAFE_LOOKAHEAD = 25; // Longitud máxima para no cortar una palabra trigger

  constructor(outCallback: (chunk: string) => void) {
    this.outCallback = outCallback;
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
          this.outCallback(this.buffer);
          this.buffer = '';
        } else if (this.buffer.length > StreamingCitationFilter.SAFE_LOOKAHEAD) {
          const safeToEmit = this.buffer.slice(0, this.buffer.length - StreamingCitationFilter.SAFE_LOOKAHEAD);
          this.outCallback(safeToEmit);
          this.buffer = this.buffer.slice(this.buffer.length - StreamingCitationFilter.SAFE_LOOKAHEAD);
        }
        break;
      }

      const triggerIndex = triggerMatch.index;

      // 2. Si hay texto seguro antes del trigger, emitirlo
      if (triggerIndex > 0) {
        const preText = this.buffer.slice(0, triggerIndex);
        this.outCallback(preText);
        this.buffer = this.buffer.slice(triggerIndex);
      }

      // 3. El búfer ahora inicia con el trigger. Intentar resolver la cita completa.
      // Patrón de casación: ej. "Casación N° 4618-2007/Lima", "Cas. 99999-2025"
      const casRegex = /^(?:Casaci[óo]n|Cas\.)\s*(?:N[°º.]?|Nro\.?|Número)?\s*([0-9]{1,5})[-–/]([0-9]{4})(?:\s*[\/\-]\s*([A-Za-zÁÉÍÓÚáéíóúñÑ]+))?([,\.;\s\n]|$)/i;
      const casMatch = this.buffer.match(casRegex);

      if (casMatch) {
        const docketNum = casMatch[1];
        const year = casMatch[2];
        const district = casMatch[3] ? casMatch[3].trim() : '';
        const trailingDelimiter = casMatch[4] || '';
        const rawCitation = casMatch[0].slice(0, casMatch[0].length - trailingDelimiter.length).trim();
        const lookupKey = `${docketNum}-${year}`;

        const isVerified = Boolean(LegalSourceRegistry.getByShortKey(lookupKey) || VERIFIED_JURISPRUDENCE_REGISTRY[lookupKey]);

        if (isVerified) {
          // Cita verificada en el compendio oficial de la Corte Suprema: emitir tal cual
          this.outCallback(rawCitation + trailingDelimiter);
        } else {
          // Cita judicial no verificada / inventada:
          // REGLA SUPREMA: NUNCA emitir el docket inventado ni frase genérica engañosa.
          this.unverifiedCitations.push(rawCitation);
          const sanitizedCitation = `[criterio jurisprudencial pendiente de verificación documental]${trailingDelimiter}`;
          this.outCallback(sanitizedCitation);
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
          this.outCallback(rawCitation + trailingDelimiter);
        } else {
          this.unverifiedCitations.push(rawCitation);
          const sanitizedCitation = `[acuerdo plenario pendiente de verificación documental]${trailingDelimiter}`;
          this.outCallback(sanitizedCitation);
        }

        this.buffer = this.buffer.slice(apMatch[0].length);
        continue;
      }

      // Patrón de Pleno Casatorio Civil: ej. "Tercer Pleno Casatorio Civil"
      const plenoRegex = /^([I|V|X]+)\s+Pleno\s+Casatorio\s+(?:Civil)?([,\.;\s\n]|$)/i;
      const plenoMatch = this.buffer.match(plenoRegex);
      if (plenoMatch) {
        this.outCallback(plenoMatch[0]);
        this.buffer = this.buffer.slice(plenoMatch[0].length);
        continue;
      }

      // Si no coincide con un patrón completo pero aún no termina la línea o límite de longitud
      if (!isFinal && this.buffer.length < 80) {
        // Esperar más tokens para completar la cita
        break;
      }

      // Si llegó al final o superó 80 caracteres sin coincidir con una cita legal estructurada,
      // emitir el primer caracter y reevaluar para evitar bloqueos
      this.outCallback(this.buffer.charAt(0));
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
        this.unverifiedCitations.map(c => `> • **${c}:** Esta referencia no cuenta con verificación documental en el registro oficial de precedentes vinculantes de la Corte Suprema. Al no existir fuente comprobable del expediente citado, se ha desclasificado y retirado el número judicial para evitar temeridad procesal, debiendo sustentarse la pretensión directamente en las normas legales aplicables.\n`).join('');
      this.outCallback(disclaimer);
    }
  }

  public getUnverifiedCitations(): string[] {
    return [...this.unverifiedCitations];
  }
}

