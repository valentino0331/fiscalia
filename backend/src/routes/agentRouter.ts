type AgentRoutingRule = {
  label: string;
  keywords: string[];
};

const AGENT_ROUTING_RULES: Record<string, AgentRoutingRule> = {
  valentina: {
    label: 'Laboral',
    keywords: [
      'despido', 'liquidacion', 'cts', 'gratificacion', 'vacaciones', 'planilla', 'sunafil',
      'renuncia', 'beneficios sociales', 'hostigamiento laboral', 'contrato de trabajo',
      'sueldo', 'salario', 'trabajo', 'trabajador', 'empleador', 'jornada laboral',
    ],
  },
  sebastian: {
    label: 'Penal',
    keywords: [
      'denuncia penal', 'fiscalia', 'detenido', 'prision preventiva', 'delito', 'hurto', 'robo',
      'lesiones', 'estafa', 'ncpp', 'proceso penal', 'crimen', 'imputado', 'querella',
    ],
  },
  diego: {
    label: 'Civil',
    keywords: [
      'desalojo', 'arrendamiento', 'contrato civil', 'incumplimiento', 'obligacion', 'indemnizacion',
      'responsabilidad civil', 'carta notarial', 'resolucion contractual', 'deuda', 'prestamo',
    ],
  },
  adriana: {
    label: 'Corporativo',
    keywords: [
      'empresa', 'sociedad', 'sac', 'srl', 'accionistas', 'fusiones', 'adquisicion',
      'compliance', 'due diligence', 'junta de accionistas', 'negocio', 'socio',
    ],
  },
  rodrigo: {
    label: 'Minero',
    keywords: [
      'mina', 'minero', 'concesion', 'ingemmet', 'oefa', 'reinfo', 'eia', 'formalizacion minera',
      'petitorio minero', 'extraccion', 'mineral',
    ],
  },
  camila: {
    label: 'Familia',
    keywords: [
      'divorcio', 'alimentos', 'tenencia', 'visitas', 'violencia familiar', 'pension alimenticia',
      'patria potestad', 'filiacion', 'separacion', 'custodia', 'matrimonio', 'conyuge',
      'hijo', 'hijos', 'pareja', 'conviviente', 'pension', 'adopcion',
    ],
  },
  fernanda: {
    label: 'Tributario',
    keywords: [
      'sunat', 'tributo', 'igv', 'renta', 'fiscalizacion tributaria', 'reclamacion tributaria',
      'factura', 'impuesto', 'declaracion jurada', 'regimen tributario',
    ],
  },
  marco: {
    label: 'Administrativo',
    keywords: [
      'licitacion', 'contrataciones del estado', 'acto administrativo', 'procedimiento sancionador',
      'pas', 'recurso administrativo', 'tupa', 'municipalidad', 'gobierno', 'estado',
    ],
  },
};

// Friendly first names for each agent
const AGENT_NAMES: Record<string, string> = {
  valentina: 'Valentina',
  sebastian: 'Sebastián',
  diego: 'Diego',
  adriana: 'Adriana',
  rodrigo: 'Rodrigo',
  camila: 'Camila',
  fernanda: 'Fernanda',
  marco: 'Marco',
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ' ')
    .replace(/[^a-z0-9ñ\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function scoreTopic(input: string, keywords: string[]): { score: number; hits: string[] } {
  const hits: string[] = [];
  for (const keyword of keywords) {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) continue;
    if (input.includes(normalizedKeyword)) hits.push(keyword);
  }

  return { score: hits.length, hits };
}

export type AgentTransferSuggestion = {
  agentId: string;
  agentLabel: string;
  agentName: string;
  matchedKeywords: string[];
};

export function suggestAgentTransfer(
  currentAgentId: string,
  userText: string
): AgentTransferSuggestion | null {
  const normalizedInput = normalize(userText);
  if (!normalizedInput) return null;

  const ranking = Object.entries(AGENT_ROUTING_RULES)
    .map(([agentId, rule]) => {
      const { score, hits } = scoreTopic(normalizedInput, rule.keywords);
      return {
        agentId,
        label: rule.label,
        score,
        hits,
      };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranking[0];
  // Allow transfer with score >= 1 (was 2) to be more responsive
  if (!best || best.score < 1 || best.agentId === currentAgentId) return null;

  const current = ranking.find((item) => item.agentId === currentAgentId);
  const currentScore = current?.score ?? 0;

  // Evita derivaciones ambiguas cuando el agente actual también es relevante.
  if (currentScore >= best.score) return null;

  return {
    agentId: best.agentId,
    agentLabel: best.label,
    agentName: AGENT_NAMES[best.agentId] || best.label,
    matchedKeywords: best.hits.slice(0, 3),
  };
}
