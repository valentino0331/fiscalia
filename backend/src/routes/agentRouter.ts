type AgentRoutingRule = {
  label: string;
  keywords: string[];
};

export const AGENT_ROUTING_RULES: Record<string, AgentRoutingRule> = {
  valentina: {
    label: 'Laboral',
    keywords: [
      'despido', 'despido arbitrario', 'despido nulo', 'liquidacion', 'cts', 'gratificacion',
      'vacaciones truncas', 'planilla', 'sunafil', 'renuncia', 'beneficios sociales',
      'hostigamiento laboral', 'contrato de trabajo', 'sueldo', 'salario', 'trabajador',
      'empleador', 'jornada laboral', 'nlpt', 'ley 29497', 'dl 728',
      'indemnizacion por despido', 'reduccion de remuneracion', 'locacion de servicios',
      'desnaturalizacion', 'reposicion laboral', 'accidente de trabajo', 'comite de sst', 'convenio colectivo'
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
      'plazos penales', 'plazo penal', 'plazos procesales', 'plazo procesal', 'formalizacion',
      'formalizacion de investigacion preparatoria', 'resolucion de prision preventiva',
      'duracion de juicio oral', 'habeas corpus', 'cesacion de prision preventiva', 'cesacion',
      'comparecencia con restricciones', 'comparecencia simple', 'prescripcion penal',
      'inculpado', 'agraviado', 'ministerio publico', 'dl 1585', 'acuerdo plenario 1-2019',
      'medidas de coercion', 'requerimiento fiscal', 'apelacion de auto',
      'apelacion de prision preventiva', 'apelacion contra auto de prision preventiva',
      'peligro de fuga', 'peligro de obstaculizacion', 'arraigo domiciliario', 'arraigo laboral',
      'arraigo familiar', 'casacion 626-2013', 'acuerdo plenario 01-2017',
      'descargo fiscal', 'escrito de descargo', 'semilibertad', 'beneficio penitenciario',
      'codigo de ejecucion penal', 'd leg 654', 'ley 31307', 'habeas corpus reparador',
      'diligencias preliminares solicitadas', 'pretension reparadora', 'inpe', 'redencion de pena',
      'error de tipo', 'conversion de pena', 'suspension de ejecucion'
    ],
  },
  diego: {
    label: 'Civil',
    keywords: [
      'civil', 'derecho civil', 'problema civil', 'tema civil', 'caso civil', 'asunto civil',
      'demanda civil', 'abogado civil', 'juicio civil', 'materia civil',
      'contestacion a una demanda', 'contestacion de demanda', 'contestar demanda', 'escrito de contestacion', 'contesto demanda',
      'desalojo', 'arrendamiento', 'contrato civil', 'incumplimiento contractual',
      'indemnizacion', 'responsabilidad civil', 'carta notarial', 'resolucion contractual',
      'deuda', 'prestamo', 'garantia hipotecaria', 'derechos reales', 'propiedad',
      'codigo civil', 'ley 30933', 'allanamiento futuro', 'cpc', 'codigo procesal civil',
      'ocupacion precaria', 'precario', 'desalojo por ocupacion precaria', 'cuarto pleno casatorio',
      'iv pleno casatorio', 'restitucion de inmueble', 'frutos devengados',
      'prescripcion adquisitiva', 'usucapion', 'embargo', 'terceria', 'hipoteca', 'mutuo',
      'clausula penal', 'arras', 'particion de bienes', 'reivindicacion', 'interdicto'
    ],
  },
  adriana: {
    label: 'Corporativo',
    keywords: [
      'corporativo', 'derecho corporativo', 'societario', 'derecho societario', 'problema societario',
      'abogado corporativo', 'sociedad anonima', 'sac', 'srl', 'eirl', 'sacs', 'accionistas', 'fusiones y adquisiciones', 'm&a',
      'compliance', 'due diligence', 'junta general de accionistas', 'pacto de socios', 'pacto de accionistas',
      'drag along', 'tag along', 'ley general de sociedades', 'ley 30424', 'reorganizacion societaria',
      'fusion por absorcion', 'escision', 'transformacion societaria', 'spa', 'sha', 'loi', 'term sheet',
      'sigm', 'garantias mobiliarias', 'ley 31112', 'control previo de concentraciones', 'splaft', 'ley 27693',
      'insolvencia', 'reestructuracion patrimonial', 'concursal', 'indecopi concursal', 'pco', 'pcp',
      'joint venture', 'asociacion en participacion', 'disolucion y liquidacion'
    ],
  },
  rodrigo: {
    label: 'Minero',
    keywords: [
      'minero', 'derecho minero', 'problema minero', 'abogado minero', 'tema minero',
      'concesion minera', 'ingemmet', 'oefa minero', 'oefa', 'reinfo', 'formalizacion minera',
      'petitorio minero', 'cierre de mina', 'estudio de impacto ambiental minero', 'eia minero',
      'pas ambiental minero', 'canon minero', 'titular minero', 'consejo de mineria',
      'osinergmin', 'tastem', 'tfa', 'ana', 'licencia de agua', 'recursos hidricos',
      'derecho de vigencia', 'caducidad minera', 'abandono minero', 'amparo minero',
      'seguridad minera', 'relaves', 'igafom', 'autoridad nacional del agua'
    ],
  },
  camila: {
    label: 'Familia',
    keywords: [
      'familia', 'derecho de familia', 'problema familiar', 'tema familiar', 'caso de familia',
      'abogado de familia', 'divorcio', 'pension de alimentos', 'demanda de alimentos', 'aumento de alimentos',
      'tenencia compartida', 'tenencia exclusiva', 'regimen de visitas', 'violencia familiar',
      'patria potestad', 'filiacion', 'sociedad de gananciales', 'separacion de patrimonios',
      'ley 31590', 'ley 30364', 'codigo de los ninos y adolescentes',
      'omision a la asistencia familiar', 'liquidacion de alimentos devengados',
      'reconocimiento de paternidad', 'autorizacion de viaje de menor'
    ],
  },
  fernanda: {
    label: 'Tributario',
    keywords: [
      'tributario', 'derecho tributario', 'problema tributario', 'tema tributario', 'caso tributario',
      'abogado tributario', 'sunat', 'fiscalizacion sunat', 'reclamacion tributaria', 'tribunal fiscal',
      'apelacion tf', 'impuesto a la renta', 'igv', 'orden de pago', 'resolucion de determinacion',
      'resolucion de multa', 'cobranza coactiva', 'gradualidad de multas', 'codigo tributario',
      'prescripcion tributaria', 'nrus', 'rer', 'rmt', 'regimen general',
      'detracciones', 'retenciones', 'percepciones', 'bancarizacion', 'dl 1529', 'itf',
      'declaracion jurada', 'saldo a favor', 'credito fiscal', 'comprobante de pago',
      'factura electronica', 'guia de remision', 'rtf', 'tribunal fiscal rtf',
      'esquela de citacion sunat', 'carta de presentacion sunat'
    ],
  },
  marco: {
    label: 'Administrativo',
    keywords: [
      'administrativo', 'derecho administrativo', 'problema administrativo', 'tema administrativo',
      'abogado administrativo', 'licitacion publica', 'contrataciones del estado', 'oece', 'osce', 'ley 32069',
      'tribunal de contrataciones publicas', 'tcp', 'procedimiento administrativo sancionador',
      'pas administrativo', 'recurso de reconsideracion', 'recurso de apelacion administrativa',
      'tupa', 'silencio administrativo', 'proceso contencioso administrativo', 'ley 27444', 'ds 006-2026-jus',
      'reconsideracion', 'apelacion administrativa', 'caducidad administrativa',
      'prescripcion administrativa', 'sancionador', 'medida cautelar administrativa',
      'acto administrativo', 'resolucion directoral', 'resolucion de alcaldia', 'recurso de revision',
      'buena pro', 'pladicop', 'jprd', 'regaju', 'rnp', 'ampliacion de plazo contractual', 'adicional de obra',
      'penalidades contractuales', 'resolucion de contrato'
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

const EXPLICIT_BRANCH_TRIGGERS: Array<{
  agentId: string;
  label: string;
  name: string;
  triggers: string[];
}> = [
  {
    agentId: 'diego',
    label: 'Civil',
    name: 'Diego',
    triggers: [
      'problema civil', 'derecho civil', 'tema civil', 'caso civil', 'abogado civil',
      'asunto civil', 'demanda civil', 'materia civil', 'juicio civil', 'litigio civil',
      'un civil', 'algo civil', 'desalojo', 'arrendamiento', 'contrato de alquiler',
      'contestacion a una demanda', 'contestacion de demanda', 'contestar demanda', 'escrito de contestacion',
    ],
  },
  {
    agentId: 'sebastian',
    label: 'Penal',
    name: 'Sebastián',
    triggers: [
      'problema penal', 'derecho penal', 'tema penal', 'caso penal', 'abogado penal',
      'asunto penal', 'denuncia penal', 'materia penal', 'juicio penal', 'un penal',
      'algo penal', 'prision preventiva', 'detenido', 'fiscalia penal',
    ],
  },
  {
    agentId: 'valentina',
    label: 'Laboral',
    name: 'Valentina',
    triggers: [
      'problema laboral', 'derecho laboral', 'tema laboral', 'caso laboral', 'abogado laboral',
      'asunto laboral', 'demanda laboral', 'materia laboral', 'un laboral', 'algo laboral',
      'despido arbitrario', 'liquidacion de beneficios', 'sunafil', 'cobro de cts',
    ],
  },
  {
    agentId: 'camila',
    label: 'Familia',
    name: 'Camila',
    triggers: [
      'problema familiar', 'derecho de familia', 'tema de familia', 'caso de familia',
      'abogado de familia', 'asunto familiar', 'demanda de alimentos', 'pension de alimentos',
      'divorcio', 'tenencia compartida', 'regimen de visitas', 'patria potestad',
    ],
  },
  {
    agentId: 'fernanda',
    label: 'Tributario',
    name: 'Fernanda',
    triggers: [
      'problema tributario', 'derecho tributario', 'tema tributario', 'caso tributario',
      'abogado tributario', 'asunto tributario', 'fiscalizacion de sunat', 'multa de sunat',
      'tribunal fiscal', 'reclamacion tributaria', 'cobranza coactiva sunat',
    ],
  },
  {
    agentId: 'marco',
    label: 'Administrativo',
    name: 'Marco',
    triggers: [
      'problema administrativo', 'derecho administrativo', 'tema administrativo',
      'caso administrativo', 'abogado administrativo', 'contratacion publica', 'oece',
      'licitacion publica', 'procedimiento administrativo sancionador', 'silencio administrativo',
      'buena pro', 'tribunal de contrataciones publicas', 'tcp', 'pladicop',
    ],
  },
  {
    agentId: 'adriana',
    label: 'Corporativo',
    name: 'Adriana',
    triggers: [
      'problema corporativo', 'derecho corporativo', 'tema corporativo', 'caso corporativo',
      'abogado corporativo', 'derecho societario', 'tema societario', 'problema societario',
      'junta de accionistas', 'pacto de socios', 'compliance corporativo', 'pacto de accionistas',
      'fusiones y adquisiciones', 'm&a', 'insolvencia empresarial', 'reestructuracion patrimonial',
    ],
  },
  {
    agentId: 'rodrigo',
    label: 'Minero',
    name: 'Rodrigo',
    triggers: [
      'problema minero', 'derecho minero', 'tema minero', 'caso minero', 'abogado minero',
      'concesion minera', 'petitorio minero', 'reinfo', 'oefa minero', 'ingemmet',
    ],
  },
];

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9ñ\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function scoreTopic(input: string, keywords: string[]): { score: number; hits: string[] } {
  const hits: string[] = [];
  // Asegurar delimitadores de espacio para chequeos exactos
  const paddedInput = ` ${input} `;

  for (const keyword of keywords) {
    const normalizedKeyword = normalize(keyword);
    if (!normalizedKeyword) continue;

    let matched = false;
    // Si la palabra clave es corta (<= 4 caracteres, ej. 'cts', 'igv', 'sac', 'ana'), exigir palabra aislada
    if (normalizedKeyword.length <= 4) {
      const regex = new RegExp(`(?:^|\\s)${normalizedKeyword}(?:\\s|$)`, 'i');
      matched = regex.test(input);
    } else {
      matched = paddedInput.includes(` ${normalizedKeyword} `) || input.includes(normalizedKeyword);
    }

    if (matched) {
      // Recompensar términos compuestos con mayor peso (especificidad jurídica alta)
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
  if (!normalizedInput || normalizedInput.length < 5) return null;

  // 1. REGLA DE TRANSFERENCIA EXPLÍCITA DIRECTA (Máxima prioridad)
  // Si el usuario dice "tengo un problema civil", "tema laboral", "consulta familiar", etc.
  for (const item of EXPLICIT_BRANCH_TRIGGERS) {
    if (item.agentId !== currentAgentId) {
      for (const phrase of item.triggers) {
        const normPhrase = normalize(phrase);
        if (normPhrase && normalizedInput.includes(normPhrase)) {
          return {
            agentId: item.agentId,
            agentLabel: item.label,
            agentName: item.name,
            matchedKeywords: [phrase],
          };
        }
      }
    }
  }

  // 2. Si Sebastián (Penal) está atendiendo y la consulta trata de plazos, investigación, fiscalía o delitos, no transferir salvo trigger explícito
  if (currentAgentId === 'sebastian') {
    const penalTriggers = [
      'plazo', 'proceso', 'penal', 'fiscal', 'investigacion', 'prision', 'juicio', 'delito',
      'formalizacion', 'audiencia', 'etapa', 'cpp', 'ncpp', 'sobreseimiento', 'acusacion',
      'imputado', 'carpeta', 'diligencias', 'defensa', 'coercion', 'descargo', 'semilibertad',
      'beneficio', 'habeas', 'penitenciario', 'inpe'
    ];
    if (penalTriggers.some((t) => normalizedInput.includes(t))) {
      return null;
    }
  }

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
