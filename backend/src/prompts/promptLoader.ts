/**
 * HARDMAN PROMPT LOADER — GOBERNANZA DE PROMPTS Y FLAG PROMPT_VERSION
 * 
 * Gestiona la carga modular de prompts:
 * - PROMPT_VERSION=v1: Prompt tradicional (prompts/agents.ts) con anclaje temporal dinámico.
 * - PROMPT_VERSION=v2: Núcleo v2 compacto (prompts/v2/core.md) + módulo especializado por rama
 *   (prompts/v2/ramas/*.md) ≤ 3,500 tokens, con anclaje temporal y valores paramétricos dinámicos.
 * 
 * Cumple con la regla de bandera: todo cambio de comportamiento visible queda tras flag
 * (PROMPT_VERSION=v1|v2) hasta superar el set de evaluación de la Fase 6.
 */

import fs from 'fs';
import path from 'path';
import { getLimaDateFormatted, buildTemporalAnchorBlock } from '../lib/parametricValues';
import { SYSTEM_PROMPTS } from './agents';

export interface AgentRamaMetadata {
  name: string;
  rama: string;
  file: string;
}

export const AGENT_RAMA_MAP: Record<string, AgentRamaMetadata> = {
  sebastian: { name: 'Sebastián', rama: 'Penal y Procesal Penal', file: 'penal.md' },
  diego: { name: 'Diego', rama: 'Civil y Procesal Civil', file: 'civil.md' },
  valentina: { name: 'Valentina', rama: 'Laboral y Procesal Laboral', file: 'laboral.md' },
  camila: { name: 'Camila', rama: 'Familia y Niñez', file: 'familia.md' },
  marco: { name: 'Marco', rama: 'Administrativo y Contrataciones con el Estado', file: 'administrativo.md' },
  fernanda: { name: 'Fernanda', rama: 'Tributario y Aduanero', file: 'tributario.md' },
  adriana: { name: 'Adriana', rama: 'Corporativo, Compliance y M&A', file: 'corporativo.md' },
  rodrigo: { name: 'Rodrigo', rama: 'Minero, Ambiental y Recursos Naturales', file: 'minero.md' },
};

export class PromptLoader {
  private static v2CoreCache: string | null = null;
  private static v2RamaCache: Map<string, string> = new Map();

  /**
   * Determina la versión activa del sistema de prompts (por defecto 'v1').
   */
  public static getPromptVersion(): 'v1' | 'v2' {
    return process.env.PROMPT_VERSION === 'v2' ? 'v2' : 'v1';
  }

  /**
   * Carga el núcleo común v2 (prompts/v2/core.md).
   */
  private static loadV2Core(): string {
    if (this.v2CoreCache) return this.v2CoreCache;
    const corePath = path.join(__dirname, 'v2', 'core.md');
    if (fs.existsSync(corePath)) {
      this.v2CoreCache = fs.readFileSync(corePath, 'utf8');
      return this.v2CoreCache;
    }
    return '';
  }

  /**
   * Carga el módulo especializado de rama v2 (prompts/v2/ramas/*.md).
   */
  private static loadV2Rama(file: string): string {
    if (this.v2RamaCache.has(file)) return this.v2RamaCache.get(file)!;
    const ramaPath = path.join(__dirname, 'v2', 'ramas', file);
    if (fs.existsSync(ramaPath)) {
      const content = fs.readFileSync(ramaPath, 'utf8');
      this.v2RamaCache.set(file, content);
      return content;
    }
    return '';
  }

  /**
   * Construye el prompt de sistema del agente según la versión activa.
   */
  public static getAgentPrompt(agentId: string): string {
    const version = this.getPromptVersion();

    if (version === 'v2') {
      const meta = AGENT_RAMA_MAP[agentId];
      if (meta) {
        let core = this.loadV2Core();
        core = core.replace(/\{\{NOMBRE\}\}/g, meta.name);
        core = core.replace(/\{\{RAMA\}\}/g, meta.rama);
        core = core.replace(/\{\{FECHA_LIMA\}\}/g, getLimaDateFormatted());

        const ramaModule = this.loadV2Rama(meta.file);
        const anchor = buildTemporalAnchorBlock();

        return `${core}\n\n${ramaModule}\n\n${anchor}`;
      }
    }

    // Fallback estándar a v1 con compatibilidad total
    return SYSTEM_PROMPTS[agentId] || '';
  }

  /**
   * Limpia caches en caliente (útil para pruebas y desarrollo).
   */
  public static clearCache(): void {
    this.v2CoreCache = null;
    this.v2RamaCache.clear();
  }
}
