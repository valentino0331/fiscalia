type AgentRoutingRule = {
  label: string;
  keywords: string[];
};

const AGENT_ROUTING_RULES: Record<string, AgentRoutingRule> = {
  valentina: {
    label: 'Laboral',
    keywords: [
      'despido', 'despido arbitrario', 'despido nulo', 'liquidacion', 'cts', 'gratificacion',
      'vacaciones truncas', 'planilla', 'sunafil', 'renuncia', 'beneficios sociales',
      'hostigamiento laboral', 'contrato de trabajo', 'sueldo', 'salario', 'trabajador',
      'empleador', 'jornada laboral', 'nlpt', 'ley 29497', 'dl 728',
    ],
  },
  sebastian: {
    label: 'Penal',
    keywords: [
      'denuncia penal', 'fiscalia', 'fiscal', 'detenido', 'detencion', 'prision preventiva',
      'delito', 'hurto', 'robo', 'lesiones', 'estafa', 'ncpp', 'cpp', 'codigo penal',
      'codigo procesal penal', 'proceso penal', 'crimen', 'imputado', 'querella',
      'investigacion preparatoria', 'diligencias preliminares', 'juicio oral', 'etapa intermedia',
      'acusacion fiscal', 'sobreseimiento', 'tutela de derechos', 'control de plazos',
      'plazos penales', 'plazo penal', 'habeas corpus', 'cesacion', 'comparecencia',
      'prescripcion penal', 'inculpado', 'agraviado', 'ministerio publico', 'dl 1585',
    ],
  },
  diego: {
    label: 'Civil',
    keywords: [
      'desalojo', 'arrendamiento', 'contrato civil', 'incumplimiento contractual',
      'indemnizacion', 'responsabilidad civil', 'carta notarial', 'resolucion contractual',
      'deuda', 'prestamo', 'garantia hipotecaria', 'derechos reales', 'propiedad',
      'codigo civil', 'ley 30933', 'allanamiento futuro',
    ],
  },
  adriana: {
    label: 'Corporativo',
    keywords: [
      'sociedad anonima', 'sac', 'srl', 'accionistas', 'fusiones y adquisiciones', 'm&a',
      'compliance', 'due diligence', 'junta general de accionistas', 'pacto de socios',
      'drag along', 'tag along', 'ley general de sociedades', 'ley 30424', 'reorganizacion societaria',
    ],
  },
  rodrigo: {
    label: 'Minero',
    keywords: [
      'concesion minera', 'ingemmet', 'oefa', 'reinfo', 'formalizacion minera',
      'petitorio minero', 'cierre de mina', 'estudio de impacto ambiental', 'eia minero',
      'pas ambiental', 'canon minero', 'derecho minero',
    ],
  },
  camila: {
    label: 'Familia',
    keywords: [
      'divorcio', 'pension de alimentos', 'demanda de alimentos', 'aumento de alimentos',
      'tenencia compartida', 'tenencia exclusiva', 'regimen de visitas', 'violencia familiar',
      'patria potestad', 'filiacion', 'sociedad de gananciales', 'separacion de patrimonios',
      'ley 31590', 'ley 30364', 'codigo de los ninos y adolescentes',
    ],
  },
  fernanda: {
    label: 'Tributario',
    keywords: [
      'sunat', 'fiscalizacion sunat', 'reclamacion tributaria', 'tribunal fiscal',
      'apelacion tf', 'impuesto a la renta', 'igv', 'orden de pago', 'resolucion de determinacion',
      'resolucion de multa', 'cobranza coactiva', 'gradualidad de multas', 'codigo tributario',
      'prescripcion tributaria', 'nrus', 'rer', 'rmt', 'regimen general',
    ],
  },
  marco: {
    label: 'Administrativo',
    keywords: [
      'licitacion publica', 'contrataciones del estado', 'oece', 'osce', 'ley 32069',
      'tribunal de contrataciones publicas', 'tcp', 'procedimiento administrativo sancionador',
      'pas administrativo', 'recurso de reconsideracion', 'recurso de apelacion administrativa',
      'tupa', 'silencio administrativo', 'proceso contencioso administrativo', 'ley 27444',
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
    // Word boundary or substring matching for compound phrases
    if (input.includes(normalizedKeyword)) {
      // Reward multi-word specific legal terms higher
      const weight = normalizedKeyword.includes(' ') ? 2 : 1;
      for (let i = 0; i < weight; i++) hits.push(keyword);
    }
  }

  return { score: hits.length, hits: Array.from(new Set(hits)) };
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
  if (!normalizedInput || normalizedInput.length < 10) return null;

  const currentRule = AGENT_ROUTING_RULES[currentAgentId];
  const currentCheck = currentRule ? scoreTopic(normalizedInput, currentRule.keywords) : { score: 0, hits: [] };

  // Si la consulta contiene conceptos clave del agente actual, no transferir
  if (currentCheck.score >= 1) {
    return null;
  }

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
  // Requiere coincidencia sólida (mínimo 2 puntos) y que sea diferente al agente actual
  if (!best || best.score < 2 || best.agentId === currentAgentId) return null;

  return {
    agentId: best.agentId,
    agentLabel: best.label,
    agentName: AGENT_NAMES[best.agentId] || best.label,
    matchedKeywords: best.hits.slice(0, 3),
  };
}
