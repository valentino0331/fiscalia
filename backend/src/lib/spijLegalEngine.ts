/**
 * SISTEMA PERUANO DE INFORMACIÓN JURÍDICA (SPIJ) & CORTE SUPREMA DE JUSTICIA
 * Compendio Normativo y Jurisprudencial Vinculante por Especialista Legal
 *
 * Segmentado estrictamente según la especialidad de cada uno de los 8 abogados del bufete:
 * - sebastian: Derecho Penal y Procesal Penal (Corte Suprema, NCPP, CP)
 * - valentina: Derecho Laboral (Plenos Supremos Laborales, NLPT Ley 32155, SUNAFIL)
 * - diego: Derecho Civil e Inmobiliario (Plenos Casatorios Civiles, Desalojo Ley 30933)
 * - camila: Derecho de Familia (Ley 31590 Tenencia Compartida, Ley 30364 Violencia, Alimentos)
 * - marco: Derecho Administrativo y Contrataciones (TUO LPAG DS 006-2026-JUS, Ley 32069 OECE)
 * - fernanda: Derecho Tributario (RTF Tribunal Fiscal, Código Tributario, Bancarización DL 1529)
 * - adriana: Derecho Corporativo y Compliance (Ley 30424, Ley General de Sociedades, M&A)
 * - rodrigo: Derecho Minero y Ambiental (TUPA INGEMMET 2026, OEFA PAS Ambiental, REINFO)
 */

export interface PlenaryAgreement {
  code: string; // ej. "AP 01-2019/CIJ-116" o "IV Pleno Casatorio Civil"
  specialistId: string; // 'sebastian' | 'valentina' | 'diego' | 'camila' | 'marco' | 'fernanda' | 'adriana' | 'rodrigo'
  court: string; // ej. "Corte Suprema de Justicia de la República"
  title: string;
  category: string;
  keywords: string[];
  keyPrinciples: string[];
  bindingGrounds: string;
  legalApplication: string;
}

export interface LegalNormMod {
  lawCode: string; // ej. "D. Leg. 1585" o "Ley 32155"
  specialistId: string;
  date: string;
  affectedCode: string;
  articles: string[];
  keywords: string[];
  summary: string;
  practicalImpact: string;
}

export const SPECIALIST_LABELS: Record<string, string> = {
  sebastian: 'Derecho Penal y Procesal Penal',
  valentina: 'Derecho Laboral y Seguridad Social',
  diego: 'Derecho Civil, Contratos e Inmobiliario',
  camila: 'Derecho de Familia y Niñez',
  marco: 'Derecho Administrativo y Contrataciones Públicas',
  fernanda: 'Derecho Tributario y Fiscal',
  adriana: 'Derecho Corporativo, M&A y Compliance',
  rodrigo: 'Derecho Minero y Fiscalización Ambiental',
};

export const JURISPRUDENCE_COMPENDIUM: PlenaryAgreement[] = [
  // ── SEBASTIÁN: PENAL & PROCESAL PENAL ──
  {
    code: 'Acuerdo Plenario N° 01-2019/CIJ-116',
    specialistId: 'sebastian',
    court: 'XI Pleno Jurisdiccional Penal - Salas Penales de la Corte Suprema',
    title: 'Prisión preventiva: presupuestos, sospecha grave y peligro procesal',
    category: 'Procesal Penal',
    keywords: [
      'prision preventiva', 'sospecha grave', 'sospecha fuerte', 'peligro de fuga',
      'obstaculizacion', 'arraigo', 'arraigo laboral', 'arraigo familiar', 'arraigo domiciliario',
      'medida coercitiva', 'medidas de coercion', 'requerimiento de prision preventiva', 'cesacion',
      'cesacion de prision preventiva', 'apelacion de prision preventiva', 'comparecencia'
    ],
    keyPrinciples: [
      'Exigencia ineludible de "Sospecha Fuerte/Grave", estándar cualificado superior a la sospecha reveladora.',
      'El peligro de fuga no se presume por la gravedad del delito; exige análisis de arraigos de calidad (domiciliario, familiar y laboral).',
      'Principio de excepcionalidad, proporcionalidad y necesidad estricta de la medida de coerción personal.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 24-27 (estándar probatorio) y FJ 35-48 (peligro procesal y proporcionalidad).',
    legalApplication: 'Obligatorio en toda Oposición a Prisión Preventiva, Apelación de Auto o Solicitud de Cesación.',
  },
  {
    code: 'Acuerdo Plenario N° 02-2005/CJ-116',
    specialistId: 'sebastian',
    court: 'I Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Garantías de certeza de la declaración de la víctima y coimputados',
    category: 'Procesal Penal / Prueba',
    keywords: [
      'declaracion de testigo', 'declaracion de victima', 'agraviado', 'testigo unico',
      'coimputado', 'declaracion de agraviado', 'verosimilitud', 'incredibilidad subjetiva',
      'persistencia', 'prueba testimonial', 'duda razonable', 'insuficiencia probatoria'
    ],
    keyPrinciples: [
      'Ausencia de incredibilidad subjetiva (inexistencia de relaciones de odio, resentimiento, enemistad o móvil espurio).',
      'Verosimilitud del testimonio con corroboraciones periféricas de carácter objetivo.',
      'Persistencia en la incriminación prolongada en el tiempo y sin contradicciones sustanciales.',
    ],
    bindingGrounds: 'Fundamento Jurídico 10 (las 3 reglas copulativas de valoración del testimonio incriminador).',
    legalApplication: 'Vital en alegatos de clausura, apelación de condenas o solicitudes de sobreseimiento cuando la imputación dependa del dicho de la víctima o coimputado.',
  },
  {
    code: 'Acuerdo Plenario N° 04-2005/CJ-116',
    specialistId: 'sebastian',
    court: 'I Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Tentativa y consumación en los delitos de robo y hurto',
    category: 'Derecho Penal',
    keywords: [
      'robo', 'hurto', 'robo agravado', 'tentativa', 'consumacion', 'disponibilidad',
      'ablatio', 'persecucion', 'persecucion inmediata', 'recuperacion del bien', 'apoderamiento'
    ],
    keyPrinciples: [
      'Adopción de la teoría de la disponibilidad potencial sobre el bien sustraído.',
      'Si el agente es perseguido ininterrumpidamente o pierde el bien en la fuga inmediata, el delito queda en grado de TENTATIVA (Art. 16 CP).',
      'Permite la reducción prudencial de la pena por debajo del mínimo legal.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 7 al 9 (criterio de disponibilidad y momento consumativo del apoderamiento).',
    legalApplication: 'Esencial para recalificar la imputación fiscal de robo consumado a tentativa, logrando penas suspendidas o reducidas.',
  },
  {
    code: 'Acuerdo Plenario N° 05-2023/CIJ-112',
    specialistId: 'sebastian',
    court: 'XII Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Inaplicabilidad vía control difuso de la Ley 31751 (Ley Soto) sobre prescripción penal',
    category: 'Derecho Penal / Prescripción',
    keywords: [
      'prescripcion', 'prescripcion de la accion penal', 'ley 31751', 'ley soto', 'plazo de prescripcion',
      'suspension de prescripcion', 'formalizacion', 'control difuso', 'sobreseimiento por prescripcion',
      'excepcion de prescripcion'
    ],
    keyPrinciples: [
      'Declara inconstitucional el límite de 1 año fijado por la Ley 31751 para suspender la prescripción.',
      'Los jueces deben aplicar control difuso e inaplicar el límite de un año.',
      'Rige el plazo extraordinario constitucional: pena máxima abstracta más su mitad.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 38 al 47 (control difuso preferente sobre la Ley 31751).',
    legalApplication: 'Imprescindible al deducir o absolver Excepciones de Prescripción de la Acción Penal.',
  },
  {
    code: 'Acuerdo Plenario N° 02-2023/CIJ-112',
    specialistId: 'sebastian',
    court: 'XII Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Flagrancia delictiva, detención policial y proceso inmediato reformado',
    category: 'Procesal Penal',
    keywords: [
      'flagrancia', 'flagrancia delictiva', 'cuasiflagrancia', 'detencion policial',
      'proceso inmediato', 'registro personal', 'incoacion de proceso inmediato'
    ],
    keyPrinciples: [
      'Inmediatez temporal y personal estricta: percepción sensorial directa de la infracción.',
      'Control de legalidad del registro personal y de las evidencias incautadas por la PNP.',
      'Presupuestos materiales indispensables para admitir la incoación de Proceso Inmediato.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 18 al 26 (estándares de flagrancia y legalidad de la incautación inicial).',
    legalApplication: 'Clave para oponerse a procesos inmediatos y solicitar nulidades de actas policiales.',
  },
  {
    code: 'Acuerdo Plenario N° 04-2010/CJ-116',
    specialistId: 'sebastian',
    court: 'VI Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Audiencia de Tutela de Derechos (Art. 71 NCPP)',
    category: 'Procesal Penal',
    keywords: [
      'tutela de derechos', 'art 71', 'art 71.4', 'vulneracion de derechos', 'defensa tecnica',
      'imputacion necesaria', 'declaracion sin abogado'
    ],
    keyPrinciples: [
      'Vía residual y protectora exclusiva de los derechos fundamentales reconocidos en el Art. 71 NCPP.',
      'Permite subsanar vulneraciones al derecho de defensa, imputación necesaria y legalidad de actos.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 11 al 17 (supuestos habilitantes de la tutela de derechos).',
    legalApplication: 'Básico al formular solicitudes de Tutela de Derechos ante el Juez de Investigación Preparatoria.',
  },

  // ── VALENTINA: LABORAL ──
  {
    code: 'II Pleno Jurisdiccional Supremo Laboral',
    specialistId: 'valentina',
    court: 'Corte Suprema de Justicia de la República (Salas de Derecho Constitucional y Social)',
    title: 'Despido incausado y fraudulento: reposición e indemnización tasada',
    category: 'Derecho Laboral',
    keywords: [
      'despido incausado', 'despido fraudulento', 'reposicion laboral', 'indemnizacion por despido',
      'lucro cesante laboral', 'dano moral laboral', 'nulidad de despido', 'despido arbitrario'
    ],
    keyPrinciples: [
      'Procede la reposición en el empleo ante despido incausado o fraudulento en el régimen privado (DL 728).',
      'El trabajador despedido puede optar alternativamente por la indemnización del Art. 38 del D.S. 003-97-TR (1.5 sueldos por año laborado, máximo 12 sueldos).',
      'Compatibilidad del reclamo de lucro cesante y daño moral acreditado fehacientemente.',
    ],
    bindingGrounds: 'Tema N° 1 y 2 del II Pleno Jurisdiccional Supremo Laboral (reparación adecuada ante despido inconstitucional).',
    legalApplication: 'Obligatorio en demandas laborales de reposición o indemnización por despido arbitrario/incausado.',
  },
  {
    code: 'Precedente Vinculante TC - Caso Huatuco Huatuco (Exp. 05057-2013-PA/TC)',
    specialistId: 'valentina',
    court: 'Tribunal Constitucional del Perú',
    title: 'Límites a la reposición en el sector público: exigencia de concurso público de méritos',
    category: 'Laboral Público',
    keywords: [
      'huatuco', 'sector publico', 'reposicion sector publico', 'concurso publico', 'plaza presupuestada',
      'contrato cas', 'carrera administrativa', 'desnaturalizacion de contratos estado'
    ],
    keyPrinciples: [
      'En el sector público (Estado, ministerios, municipalidades), NO procede la reposición a plazo indeterminado si el trabajador no ingresó por concurso público de méritos para una plaza vacante y presupuestada.',
      'Ante la desnaturalización de contratos en el Estado, la única pretensión viable es la indemnización por despido arbitrario.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 18 al 22 (precedente de observancia obligatoria).',
    legalApplication: 'Fundamental para definir la viabilidad de demandas contra entidades estatales: exigir indemnización en vez de reposición improcedente.',
  },

  // ── DIEGO: CIVIL & INMOBILIARIO ──
  {
    code: 'IV Pleno Casatorio Civil (Casación 2195-2011 Ucayali)',
    specialistId: 'diego',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Ocupación precaria y proceso de desalojo (Art. 911 Código Civil)',
    category: 'Derecho Civil / Derechos Reales',
    keywords: [
      'ocupante precario', 'desalojo por precario', 'titulo fenecido', 'sin titulo', 'arrendamiento vencido',
      'posesion precaria', 'demanda de desalojo', 'resolucion de contrato arrendamiento'
    ],
    keyPrinciples: [
      'Define al ocupante precario como quien posee sin título alguno o cuando el que tenía ha fenecido.',
      'Vencido el contrato de arrendamiento y requerido notarialmente la devolución del bien, el arrendatario deviene automáticamente en precario.',
      'La alegación de usucapión no suspende el desalojo por precario.',
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Vinculante - Reglas 1 a 7 (Alcances del Art. 911 CC y causales de precariedad).',
    legalApplication: 'Indispensable en toda demanda judicial de desalojo por ocupante precario ante los Juzgados Civiles o Mixtos.',
  },
  {
    code: 'IX Pleno Casatorio Civil (Casación 4442-2015 Moquegua)',
    specialistId: 'diego',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Nulidad manifiesta de acto jurídico en los procesos de otorgamiento de escritura pública',
    category: 'Derecho Civil / Contratos',
    keywords: [
      'nulidad manifiesta', 'otorgamiento de escritura', 'acto juridico nulo', 'escritura publica',
      'minuta de compraventa', 'simulacion absoluta'
    ],
    keyPrinciples: [
      'El juez puede declarar de oficio la nulidad manifiesta de un contrato privado o minuta si salta a la vista su causal de nulidad absoluta, previa audiencia de contradicción.',
    ],
    bindingGrounds: 'Reglas vinculantes 1 a 5 (facultad de control judicial de validez sustancial del contrato).',
    legalApplication: 'Invocable en demandas o contestaciones sobre formalización y elevación a escritura pública de contratos civiles.',
  },

  // ── CAMILA: FAMILIA ──
  {
    code: 'Pleno Jurisdiccional Nacional de Familia 2022',
    specialistId: 'camila',
    court: 'Poder Judicial del Perú - Jueces Especializados de Familia',
    title: 'Tenencia compartida obligatoria y ponderación de la pensión de alimentos',
    category: 'Derecho de Familia',
    keywords: [
      'tenencia compartida', 'alimentos', 'pension alimenticia', 'regimen de visitas',
      'interes superior del nino', 'ley 31590', 'asignacion anticipada'
    ],
    keyPrinciples: [
      'La tenencia compartida constituye la regla general preferente bajo la Ley 31590, requiriéndose prueba fehaciente de riesgo para denegarla.',
      'La fijación de pensión alimenticia en tenencia compartida debe considerar el tiempo directo que cada progenitor pasa con el hijo.',
    ],
    bindingGrounds: 'Conclusiones plenarias del Pleno de Familia sobre la aplicación preferente de la Ley 31590.',
    legalApplication: 'Obligatorio en demandas de Tenencia Compartida y contestaciones de demanda de pensión de alimentos.',
  },

  // ── MARCO: ADMINISTRATIVO & CONTRATACIONES ──
  {
    code: 'Precedentes de Observancia Obligatoria del TCP / OECE',
    specialistId: 'marco',
    court: 'Tribunal de Contrataciones Públicas (OECE / antes OSCE)',
    title: 'Admisibilidad de ofertas, subsanación y ejecución de garantías contractuales',
    category: 'Contrataciones Públicas',
    keywords: [
      'licitacion', 'contrataciones del estado', 'oece', 'osce', 'buena pro', 'apelacion contrataciones',
      'recurso de apelacion tcp', 'garantia de fiel cumplimiento', 'jprd'
    ],
    keyPrinciples: [
      'Principio de eficacia y eficiencia sobre formalismos intrascendentes en la subsanación de ofertas.',
      'Legitimación procesal exclusiva para apelar: postores y participantes con interés directo (D.S. 001-2026-EF).',
      'Obligatoriedad de la Junta de Prevención y Resolución de Disputas (JPRD) en obras públicas bajo la Ley 32069.',
    ],
    bindingGrounds: 'Resoluciones de Pleno del TCP vinculantes sobre plazos de interposición de apelaciones (8 días hábiles).',
    legalApplication: 'Vital en recursos de apelación contra el otorgamiento de la Buena Pro ante el TCP o la propia Entidad.',
  },

  // ── FERNANDA: TRIBUTARIO ──
  {
    code: 'Resolución de Observancia Obligatoria RTF N° 01807-1-2023',
    specialistId: 'fernanda',
    court: 'Tribunal Fiscal del Perú (Ministerio de Economía y Finanzas)',
    title: 'Fehaciencia probatoria, causalidad del gasto y operaciones no reales',
    category: 'Derecho Tributario',
    keywords: [
      'sunat', 'fehaciencia', 'operaciones no reales', 'gasto deducible', 'impuesto a la renta',
      'credito fiscal', 'bancarizacion', 'reclamacion tributaria', 'tribunal fiscal'
    ],
    keyPrinciples: [
      'Para deducir el gasto y crédito fiscal, no basta la factura y el pago bancario; se exige el acervo documentario que demuestre la efectiva prestación del servicio (guías, informes, correos, entregables).',
      'Criterio estricto de causalidad del gasto conforme al Art. 37 de la Ley del Impuesto a la Renta.',
    ],
    bindingGrounds: 'Jurisprudencia de observancia obligatoria publicada en El Peruano (Art. 154 Código Tributario).',
    legalApplication: 'Fundamental para estructurar descargos en fiscalizaciones SUNAT y recursos de reclamación.',
  },

  // ── ADRIANA: CORPORATIVO & COMPLIANCE ──
  {
    code: 'Lineamientos de la SMV y Guía MINJUSDH Ley 30424',
    specialistId: 'adriana',
    court: 'Superintendencia del Mercado de Valores & MINJUSDH',
    title: 'Modelos de Prevención de Delitos Corporativos y Eximente de Responsabilidad (Ley 30424)',
    category: 'Derecho Corporativo / Compliance',
    keywords: [
      'compliance', 'ley 30424', 'responsabilidad personas juridicas', 'debida diligencia',
      'm&a', 'modelo de prevencion', 'oficial de cumplimiento', 'pacto de socios'
    ],
    keyPrinciples: [
      'La persona jurídica queda exenta de responsabilidad administrativa y penal si implementó con anterioridad a la comisión del delito un Modelo de Prevención adecuado a su naturaleza, riesgos y tamaño.',
      'Debida diligencia obligatoria en fusiones y adquisiciones (M&A) para evitar transmisión de pasivos penales.',
    ],
    bindingGrounds: 'D.S. N° 002-2019-JUS (Reglamento de la Ley 30424) y resoluciones de observancia general de la SMV.',
    legalApplication: 'Imprescindible al diseñar Programas de Cumplimiento Normativo y acuerdos de adquisición empresarial.',
  },

  // ── RODRIGO: MINERO & AMBIENTAL ──
  {
    code: 'Precedente del Tribunal de Fiscalización Ambiental (TFA) - OEFA',
    specialistId: 'rodrigo',
    court: 'Organismo de Evaluación y Fiscalización Ambiental (OEFA)',
    title: 'Tipificación de infracciones ambientales mineras y graduación de multas (RCD OEFA)',
    category: 'Derecho Minero y Ambiental',
    keywords: [
      'oefa', 'pas ambiental', 'infraccion ambiental', 'gradualidad de multas oefa',
      'tupa ingemmet', 'petitorio minero', 'reinfo', 'cierre de mina'
    ],
    keyPrinciples: [
      'Principio de causalidad y proporcionalidad en la imposición de medidas correctivas ambientales.',
      'El cumplimiento voluntario antes del inicio del PAS genera reducción del 50% de la sanción económica.',
      'Vigencia de derechos en concesiones mineras y plazos perentorios de acreditación de producción mínima.',
    ],
    bindingGrounds: 'Resoluciones de Sala Plena del TFA-OEFA sobre tipificación de daño ambiental potencial y real.',
    legalApplication: 'Básico para la elaboración de descargos técnicos y recursos de reconsideración/apelación ante el OEFA.',
  },

  // ── SEBASTIÁN: PENAL ADICIONALES SPIJ ──
  {
    code: 'Acuerdo Plenario N° 03-2010/CJ-116',
    specialistId: 'sebastian',
    court: 'VI Pleno Jurisdiccional Penal - Salas Penales Corte Suprema',
    title: 'Cómputo del plazo de las diligencias preliminares y control de plazos (Art. 334.2 NCPP)',
    category: 'Procesal Penal / Plazos',
    keywords: [
      'control de plazos', 'diligencias preliminares', 'plazo razonable', 'art 334', 'art 334.2',
      'vencimiento de plazo', 'fiscalia', 'audiencia de control de plazos'
    ],
    keyPrinciples: [
      'Fijación del plazo de diligencias preliminares ordinarias en 60 días, prorrogables a un plazo razonable no superior a 120 días (casos complejos 8 meses).',
      'Si el fiscal vence el plazo sin formalizar ni archivar, el afectado acude directamente al Juez de Garantías en Audiencia de Control de Plazos.',
      'El juez ordena conminatoriamente al fiscal dar por concluidas las diligencias preliminares en plazo perentorio de 10 días.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 14 al 21 (doctrina legal vinculante sobre plazos máximos en sede fiscal y remedio procesal).',
    legalApplication: 'Vital para deducir Audiencia de Control de Plazos ante investigaciones fiscales estancadas o arbitrariamente prolongadas.',
  },
  {
    code: 'Acuerdo Plenario N° 02-2012/CJ-116',
    specialistId: 'sebastian',
    court: 'VIII Pleno Jurisdiccional Penal - Salas Penales Corte Suprema',
    title: 'Control formal y sustancial de la acusación fiscal en etapa intermedia (Art. 350-352 NCPP)',
    category: 'Procesal Penal / Etapa Intermedia',
    keywords: [
      'control de acusacion', 'etapa intermedia', 'sobreseimiento', 'imputacion necesaria',
      'observacion formal', 'subsanacion de acusacion', 'defensa previa', 'atipicidad'
    ],
    keyPrinciples: [
      'El juez de investigación preparatoria ejerce control formal previo (claridad de hechos, tipificación, individualización) devolviendo la acusación si adolece de defectos.',
      'Control sustancial directo: si los hechos no constituyen delito, falta antijuridicidad o concurre causa de atipicidad manifiesta, el juez dicta Sobreseimiento de oficio o a pedido de parte.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 8 al 15 (alcances del control judicial de la acusación penal).',
    legalApplication: 'Herramienta de cabecera al contestar el traslado de acusación fiscal y solicitar el sobreseimiento o devolver la acusación.',
  },

  // ── VALENTINA: LABORAL ADICIONALES SPIJ ──
  {
    code: 'VII Pleno Jurisdiccional Supremo Laboral y Previsional',
    specialistId: 'valentina',
    court: 'Salas de Derecho Constitucional y Social - Corte Suprema',
    title: 'Indemnización por daños y perjuicios derivados de accidentes de trabajo y enfermedades profesionales',
    category: 'Derecho Laboral / Daños y Perjuicios',
    keywords: [
      'accidente de trabajo', 'enfermedad profesional', 'responsabilidad del empleador', 'dano moral',
      'lucro cesante accidente', 'dano emergente', 'seguridad y salud', 'ley 29783'
    ],
    keyPrinciples: [
      'Responsabilidad objetiva y deber de prevención patronal conforme a la Ley 29783 (Ley de Seguridad y Salud en el Trabajo).',
      'Acreditado el nexo causal y la lesión corporal o enfermedad, se presume la culpa inexcusable del empleador si no demuestra cumplimiento cabal de estándares de seguridad.',
      'El quantum indemnizatorio debe cuantificar separadamente daño emergente, lucro cesante proyectado y daño moral.',
    ],
    bindingGrounds: 'Tema N° 1 del VII Pleno Jurisdiccional Supremo Laboral (reparación integral por infortunios laborales).',
    legalApplication: 'Obligatorio en demandas de indemnización por daños y perjuicios por accidentes de trabajo o enfermedades ocupacionales.',
  },
  {
    code: 'IX Pleno Jurisdiccional Supremo Laboral',
    specialistId: 'valentina',
    court: 'Salas de Derecho Constitucional y Social - Corte Suprema',
    title: 'Desnaturalización de contratos de trabajo sujetos a modalidad y tercerización con desplazamiento continuo',
    category: 'Derecho Laboral / Contratos Modales',
    keywords: [
      'desnaturalizacion', 'contrato modal', 'tercerizacion laboral', 'desplazamiento continuo',
      'contrato de servicio especifico', 'incremento de actividad', 'plazo indeterminado'
    ],
    keyPrinciples: [
      'Exigencia ineludible de consignar la "causa objetiva determinante" de la contratación temporal; las cláusulas genéricas desnaturalizan automáticamente el contrato (Art. 77 D.S. 003-97-TR).',
      'En tercerización de servicios, si la empresa principal imparte órdenes directas, supervisa o sanciona al personal tercerizado, opera la desnaturalización y el trabajador ingresa a la planilla principal.',
    ],
    bindingGrounds: 'Conclusiones plenarias N° 2 y 3 del IX Pleno Supremo Laboral.',
    legalApplication: 'Invocable en demandas de reconocimiento de contrato de trabajo a plazo indeterminado y cobro de reintegros.',
  },

  // ── DIEGO: CIVIL & INMOBILIARIO ADICIONALES SPIJ ──
  {
    code: 'VII Pleno Casatorio Civil (Casación 3671-2014 Lima)',
    specialistId: 'diego',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Propiedad no inscrita frente a embargo judicial inscrito (Tercería de Propiedad - Art. 2022 CC)',
    category: 'Derecho Civil / Registral / Medidas Cautelares',
    keywords: [
      'terceria de propiedad', 'embargo inscrito', 'propiedad no inscrita', 'art 2022', 'fecha cierta',
      'minuta legalizada', 'escritura publica no inscrita', 'acreedor quirografario'
    ],
    keyPrinciples: [
      'En las tercerías de propiedad sobre bienes inmuebles, prevalece el derecho de propiedad no inscrito sobre el embargo inscrito del acreedor, siempre que el título de propiedad tenga FECHA CIERTA anterior a la inscripción del embargo.',
      'El juez debe verificar de oficio la legalidad de la fecha cierta y la autenticidad del documento para descartar fraudes procesales.',
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Vinculante - Reglas 1 y 2 (segundo párrafo del Art. 2022 del Código Civil).',
    legalApplication: 'Pilar absoluto en demandas de Tercería de Propiedad para levantar embargos trabados sobre inmuebles adquiridos pero pendientes de inscripción.',
  },
  {
    code: 'X Pleno Casatorio Civil (Casación 1242-2017 Lima Este)',
    specialistId: 'diego',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Prueba de oficio judicial y garantías del contradictorio (Art. 194 Código Procesal Civil)',
    category: 'Derecho Procesal Civil / Prueba',
    keywords: [
      'prueba de oficio', 'art 194 cpc', 'contradictorio', 'motivacion', 'facultad probatoria',
      'fuente de prueba', 'pericia de oficio'
    ],
    keyPrinciples: [
      'La prueba de oficio es excepcional y subsidiaria; no sustituye la inercia probatoria de las partes, sino que complementa fuentes ya introducidas al proceso.',
      'El juez está obligado a garantizar previamente el derecho de contradicción de ambas partes y motivar la pertinencia de la prueba.',
    ],
    bindingGrounds: 'Reglas vinculantes 1 a 12 del X Pleno Casatorio Civil sobre el ejercicio del Art. 194 CPC.',
    legalApplication: 'Invocable para cuestionar resoluciones judiciales que incorporan pruebas de oficio sin correr traslado previo ni motivar su excepcionalidad.',
  },

  // ── CAMILA: FAMILIA ADICIONALES SPIJ ──
  {
    code: 'Casación N° 3784-2019 Lima (Doctrina Jurisprudencial de Alimentos)',
    specialistId: 'camila',
    court: 'Sala Civil Permanente de la Corte Suprema de Justicia',
    title: 'Ponderación de ingresos del alimentante, proporcionalidad y asignación anticipada cautelar',
    category: 'Derecho de Familia / Alimentos',
    keywords: [
      'alimentos', 'proporcionalidad alimentos', 'capacidad economica', 'carga de la prueba alimentos',
      'necesidades del menor', 'aumento de alimentos', 'reduccion de alimentos'
    ],
    keyPrinciples: [
      'Las necesidades de los hijos menores de edad se presumen iuris tantum y no requieren prueba exhaustiva de cada gasto diario.',
      'No es causal para negar la pensión de alimentos que el demandado alegue carecer de trabajo formal o ingresos en planilla; rige la presunción de capacidad productiva laboral.',
      'La asignación anticipada (Art. 675 CPC / Ley 31464) procede inaudita parte sin necesidad de fianza ni contracautela.',
    ],
    bindingGrounds: 'Fundamento Jurídico 6 (estándar de acreditación y prevalencia del interés superior del niño).',
    legalApplication: 'Clave en demandas de alimentos, incremento de pensión o para desvirtuar la defensa del demandado que alega desempleo.',
  },
  {
    code: 'Pleno Jurisdiccional Distrital de Familia - Medidas de Protección Ley 30364',
    specialistId: 'camila',
    court: 'Cortes Superiores de Justicia del Perú - Especialidad Familia',
    title: 'Inmediatez en el dictado de medidas de protección y proscripción del careo agresor-víctima',
    category: 'Familia / Violencia Familiar',
    keywords: [
      'medidas de proteccion', 'ley 30364', 'riesgo leve', 'riesgo moderado', 'riesgo severo',
      'retiro del agresor', 'impedimento de acercamiento', 'careo'
    ],
    keyPrinciples: [
      'Las medidas de protección ante violencia física o psicológica deben dictarse en un plazo máximo de 24 a 72 horas según la ficha de valoración de riesgo.',
      'Está estrictamente prohibido realizar audiencias de confrontación (careo) o someter a la víctima a revictimización en sede judicial o policial.',
    ],
    bindingGrounds: 'Conclusiones plenarias vinculantes sobre la Ley 30364 y D.S. 004-2020-MIMP.',
    legalApplication: 'Fundamental para exigir al Juzgado de Familia el dictado inmediato de medidas de retiro del agresor e impedimento de acercamiento.',
  },

  // ── MARCO: ADMINISTRATIVO ADICIONALES SPIJ ──
  {
    code: 'Casación Vinculante N° 8453-2014 Lima',
    specialistId: 'marco',
    court: 'Sala de Derecho Constitucional y Social Permanente - Corte Suprema',
    title: 'Caducidad del procedimiento administrativo sancionador y prescripción de la potestad sancionadora',
    category: 'Derecho Administrativo / Sancionador',
    keywords: [
      'caducidad pas', 'prescripcion pas', 'potestad sancionadora', 'art 252 lpag', 'art 257 lpag',
      'excepcion de prescripcion administrativa', 'archivo del pas'
    ],
    keyPrinciples: [
      'El plazo de caducidad del Procedimiento Administrativo Sancionador (PAS) es de 9 meses contados desde la notificación de la imputación de cargos, ampliable excepcionalmente por 3 meses (Art. 257 TUO LPAG D.S. 006-2026-JUS).',
      'Operada la caducidad, el procedimiento fenece de pleno derecho y la resolución sancionadora extemporánea adolece de nulidad de pleno derecho.',
      'La prescripción de la acción sancionadora opera indefectiblemente a los 4 años de cometida la infracción.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 11 al 18 (garantía del plazo razonable en el ius puniendi estatal).',
    legalApplication: 'Esencial para solicitar la caducidad y archivo definitivo de procedimientos sancionadores iniciados por ministerios o municipalidades.',
  },

  // ── FERNANDA: TRIBUTARIO ADICIONALES SPIJ ──
  {
    code: 'RTF de Observancia Obligatoria N° 00372-5-2019',
    specialistId: 'fernanda',
    court: 'Tribunal Fiscal del Perú - Sala Plena',
    title: 'Cómputo del plazo de prescripción en fiscalizaciones definitivas y parciales electrónicas (Art. 62-A Código Tributario)',
    category: 'Derecho Tributario / Prescripción',
    keywords: [
      'prescripcion tributaria', 'computo de prescripcion', 'plazo de fiscalizacion', 'suspension de prescripcion',
      'requerimiento sunat', 'art 43 codigo tributario', 'art 62-a'
    ],
    keyPrinciples: [
      'La notificación del requerimiento de fiscalización suspende el plazo de prescripción únicamente por el plazo legal de 1 año (fiscalización definitiva) o 6 meses (fiscalización parcial).',
      'Vencido dicho plazo sin que SUNAT emita la Resolución de Determinación o Multa, la suspensión cesa y el plazo prescriptorio de 4 años se reanuda inmediatamente en beneficio del deudor.',
    ],
    bindingGrounds: 'Jurisprudencia de observancia obligatoria publicada en El Peruano (Art. 154 Código Tributario).',
    legalApplication: 'Clave para solicitar la declaración de Prescripción de deudas tributarias en fiscalizaciones dilatadas de SUNAT.',
  },
  {
    code: 'Sentencia del Tribunal Constitucional Exp. N° 03525-2021-PA/TC (Caso Maxus)',
    specialistId: 'fernanda',
    court: 'Tribunal Constitucional del Perú',
    title: 'Inexigibilidad de intereses moratorios generados fuera del plazo legal por desidia de SUNAT o Tribunal Fiscal',
    category: 'Derecho Tributario / Intereses Moratorios',
    keywords: [
      'intereses moratorios', 'capitalizacion de intereses', 'plazo legal sunat', 'plazo legal tribunal fiscal',
      'demora administrativa', 'exp 03525-2021-pa/tc', 'caso maxus'
    ],
    keyPrinciples: [
      'Es inconstitucional el cobro de intereses moratorios por el tiempo en que la Administración Tributaria (SUNAT) o el Tribunal Fiscal excedieron los plazos legales fijados en el Código Tributario para resolver reclamaciones o apelaciones.',
      'El deudor tributario solo responde por los intereses generados dentro del plazo que la ley concedió a la autoridad para resolver.',
    ],
    bindingGrounds: 'Precedente vinculante de observancia obligatoria (Arts. VI y VII del Título Preliminar del Nuevo Código Procesal Constitucional).',
    legalApplication: 'Obligatorio en demandas de amparo y quejas tributarias para anular millones de soles en intereses moratorios indebidos.',
  },

  // ── ADRIANA: CORPORATIVO ADICIONALES SPIJ ──
  {
    code: 'Resolución del Tribunal Registral SUNARP N° 120-2022-SUNARP-TR',
    specialistId: 'adriana',
    court: 'Tribunal Registral de la SUNARP - Sala Plena',
    title: 'Validez, quórum y formalidades de las Juntas Generales de Accionistas no presenciales y acuerdos en SAC',
    category: 'Derecho Societario / Registral',
    keywords: [
      'junta no presencial', 'junta general de accionistas', 'sac', 'quorum societario', 'sunarp',
      'aumento de capital', 'acuerdo de accionistas', 'esquela de convocatoria'
    ],
    keyPrinciples: [
      'Las Juntas no presenciales o mixtas en las Sociedades Anónimas Cerradas (S.A.C.) gozan de plena validez inscribible cuando se garantiza la identidad de los accionistas y el derecho de deliberación y voto mediante medios telemáticos (Art. 246 LGS).',
      'El derecho de adquisición preferente de acciones (Art. 237 LGS) es de orden público estatutario en la SAC y su omisión genera nulidad del acuerdo de transferencia.',
    ],
    bindingGrounds: 'Precedente registral de observancia obligatoria emitido en Sesión de Sala Plena del Tribunal Registral.',
    legalApplication: 'Invocable al estructurar actas de junta general, formalizar aumentos de capital e inscribirlos sin observaciones registrales.',
  },

  // ── RODRIGO: MINERO & AMBIENTAL ADICIONALES SPIJ ──
  {
    code: 'Precedente del Consejo de Minería N° 045-2023-MINEM/CM',
    specialistId: 'rodrigo',
    court: 'Consejo de Minería del Ministerio de Energía y Minas (MINEM)',
    title: 'Superposición de petitorios mineros, áreas de exclusión urbana y prelación registral en cuadrículas WGS84',
    category: 'Derecho Minero / Concesiones',
    keywords: [
      'petitorio minero', 'superposicion minera', 'concesion minera', 'cuadriculas wgs84',
      'ingemmet', 'consejo de mineria', 'derecho de vigencia'
    ],
    keyPrinciples: [
      'La prelación en el otorgamiento de la concesión minera se rige por el principio "primero en el tiempo, primero en el derecho" sobre la cuadrícula del catastro minero nacional (SIDEMCAT).',
      'Los petitorios formulados sobre áreas de expansión urbana o zonas reservadas sin autorización previa del concejo provincial o SERNANP adolecen de causal insubsanable de cancelación y rechazo liminar.',
    ],
    bindingGrounds: 'Criterio uniforme de observancia administrativa en resoluciones del Consejo de Minería.',
    legalApplication: 'Indispensable en recursos de revisión y oposición a petitorios mineros superpuestos ante el INGEMMET.',
  },
];

export const NORMATIVE_REFORMS_COMPENDIUM: LegalNormMod[] = [
  // ── SEBASTIÁN (PENAL) ──
  {
    lawCode: 'Decreto Legislativo N° 1585',
    specialistId: 'sebastian',
    date: 'Noviembre 2023 (Vigente 2026)',
    affectedCode: 'Código Procesal Penal (DL 957) & Código Penal (DL 635)',
    articles: ['Art. 268 NCPP', 'Art. 268-A NCPP', 'Art. 283 NCPP', 'Art. 52 CP', 'Art. 57 CP'],
    keywords: ['dl 1585', 'prision preventiva', '5 anos', 'pena superior a 5 anos', 'vigilancia electronica', 'revision de oficio'],
    summary: 'Reforma de las medidas cautelares y penas:',
    practicalImpact:
      '1. Prisión Preventiva (Art. 268.b NCPP): La pena probable DEBE SUPERAR LOS 5 AÑOS (antes 4 años).\n' +
      '2. Art. 268-A NCPP: Prioridad obligatoria de vigilancia electrónica para penas hasta 7 años.\n' +
      '3. Art. 283 NCPP: Revisión judicial de oficio cada 6 meses obligatoria.\n' +
      '4. Art. 57 CP: Suspensión de pena ampliada hasta 5 años.',
  },
  {
    lawCode: 'Ley N° 32130',
    specialistId: 'sebastian',
    date: 'Octubre 2024 (Vigente 2026)',
    affectedCode: 'Código Procesal Penal (DL 957) — Investigación del Delito',
    articles: ['Arts. 60, 65, 67, 68, 322, 331, 332 NCPP'],
    keywords: ['ley 32130', 'investigacion policial', 'pnp', 'ministerio publico', 'conduccion juridica', 'informe policial'],
    summary: 'Restituye a la Policía Nacional del Perú (PNP) la facultad de investigación preliminar material bajo conducción jurídica fiscal.',
    practicalImpact:
      'La PNP asume la ejecución de diligencias preliminares emitiendo informe policial. El Fiscal mantiene la dirección jurídica de la investigación y titularidad de la acción penal.',
  },
  {
    lawCode: 'Leyes N° 32108 y 32138',
    specialistId: 'sebastian',
    date: 'Agosto y Octubre 2024 (Vigente 2026)',
    affectedCode: 'Ley contra el Crimen Organizado (Ley 30077) & Art. 317 CP',
    articles: ['Art. 317 CP', 'Art. 2 Ley 30077'],
    keywords: ['ley 32108', 'ley 32138', 'organizacion criminal', 'allanamiento', 'defensor publico', 'beneficio economico'],
    summary: 'Redefinición de Organización Criminal y presencia obligatoria de abogado en allanamientos.',
    practicalImpact:
      'Para imputar Organización Criminal se exige delitos con pena superior a 5 años y fin de beneficio económico o material. En allanamientos es obligatoria la presencia del abogado defensor o defensor público.',
  },
  {
    lawCode: 'Ley N° 32735',
    specialistId: 'sebastian',
    date: '21 de Julio de 2026 (Vigente)',
    affectedCode: 'Código Penal (Art. 200) y NCPP',
    articles: ['Art. 200 CP', 'Art. 272 NCPP'],
    keywords: ['ley 32735', 'extorsion', 'sicariato', 'banda criminal', 'gota a gota', 'cobro de cupos'],
    summary: 'Severas penas para extorsión digital, préstamos "gota a gota" y ampliación de plazos procesales.',
    practicalImpact:
      'Agravantes de extorsión digital y celeridad procesal para medidas cautelares en extorsión.',
  },

  // ── VALENTINA (LABORAL) ──
  {
    lawCode: 'Ley N° 32155',
    specialistId: 'valentina',
    date: 'Noviembre 2024 (Vigente 2026)',
    affectedCode: 'Nueva Ley Procesal del Trabajo (Ley 29497)',
    articles: ['Art. 1', 'Art. 2', 'Competencia JPLL'],
    keywords: ['ley 32155', 'nlpt', 'competencia laboral', 'jpll', '70 urp', '60 urp', 'juzgado de paz letrado laboral'],
    summary: 'Nueva distribución de competencias en la justicia laboral peruana:',
    practicalImpact:
      '1. Juzgados de Paz Letrados Laborales (JPLL): Conocen pretensiones hasta 70 URP (S/ 38,500 en 2026).\n' +
      '2. Indemnizaciones por daños y perjuicios: Hasta 60 URP (S/ 33,000 en 2026) ante el JPLL.\n' +
      '3. Juzgados Especializados de Trabajo: Pretensiones que superen las 70 URP.',
  },
  {
    lawCode: 'Decreto Supremo N° 006-2024-TR',
    specialistId: 'valentina',
    date: 'Enero 2025 - Vigente 2026',
    affectedCode: 'Remuneración Mínima Vital (RMV)',
    articles: ['RMV S/ 1,130', 'Asignación Familiar S/ 113'],
    keywords: ['rmv', 'sueldo minimo', '1130', 'asignacion familiar', '113'],
    summary: 'Fija la RMV en S/ 1,130 mensuales y la Asignación Familiar en el 10% (S/ 113).',
    practicalImpact: 'Piso mínimo obligatorio para liquidaciones, CTS, gratificaciones y beneficios laborales.',
  },

  // ── DIEGO (CIVIL) ──
  {
    lawCode: 'Ley N° 30933 y D.S. 013-2019-JUS',
    specialistId: 'diego',
    date: 'Vigente 2026',
    affectedCode: 'Procedimiento Especial de Desalojo Notarial con Ejecución Judicial',
    articles: ['Arts. 4, 5, 6, 7 Ley 30933'],
    keywords: ['ley 30933', 'desalojo notarial', 'desalojo express', 'allanamiento', 'cuenta bancaria arrendamiento'],
    summary: 'Procedimiento sumarísimo para desalojar arrendatarios morosos o con plazo vencido en menos de 30 días.',
    practicalImpact:
      'Exige contrato con firmas legalizadas notarialmente, cláusula de allanamiento a futuro, sometimiento expreso a la Ley 30933 y cuenta bancaria determinada para el pago de rentas.',
  },
  {
    lawCode: 'Ley N° 32430 (Ley de Arrendamiento Justo)',
    specialistId: 'diego',
    date: '1 de Enero de 2026 (Vigente)',
    affectedCode: 'Ley del Impuesto a la Renta & Contratos de Arrendamiento',
    articles: ['Art. 57 TUO LIR', 'Arrendamiento de Inmuebles'],
    keywords: ['ley 32430', 'arrendamiento justo', 'primera categoria', 'criterio de lo percibido'],
    summary: 'Establece que las rentas de primera categoría tributan bajo el criterio de lo percibido (solo si efectivamente se cobran).',
    practicalImpact:
      'El arrendador ya no está obligado a tributar el 5% de Impuesto a la Renta de primera categoría sobre rentas devengadas pero impagas por inquilinos morosos.',
  },

  // ── CAMILA (FAMILIA) ──
  {
    lawCode: 'Ley N° 31590',
    specialistId: 'camila',
    date: 'Vigente 2026',
    affectedCode: 'Código de los Niños y Adolescentes (Ley 27337)',
    articles: ['Arts. 81, 82, 83, 84 CNA'],
    keywords: ['ley 31590', 'tenencia compartida', 'patria potestad', 'regimen de visitas', 'custodia compartida'],
    summary: 'Modifica el Código de los Niños y Adolescentes para establecer la Tenencia Compartida como regla general obligatoria.',
    practicalImpact:
      'Prohíbe conceder automáticamente la tenencia exclusiva materna; el juez de familia debe disponer tenencia compartida salvo imposibilidad física justificada o riesgo comprobado para el menor.',
  },
  {
    lawCode: 'Ley N° 31464',
    specialistId: 'camila',
    date: 'Vigente 2026',
    affectedCode: 'Celeridad en Procesos de Alimentos (Código Procesal Civil & CNA)',
    articles: ['Formato único de demanda', 'Exoneración de tasas', 'Medida cautelar de asignación anticipada'],
    keywords: ['ley 31464', 'demanda de alimentos', 'asignacion anticipada', 'formato unico alimentos', 'sin arancel'],
    summary: 'Elimina formalismos en demandas de alimentos, habilita formato digital simplificado y exige dictar asignación anticipada de oficio.',
    practicalImpact:
      'Demanda admisible sin necesidad de firma de abogado y fijación cautelar inmediata de pensión en favor de niños y adolescentes.',
  },

  // ── MARCO (ADMINISTRATIVO & CONTRATACIONES) ──
  {
    lawCode: 'Decreto Supremo N° 006-2026-JUS (TUO LPAG)',
    specialistId: 'marco',
    date: '30 de Abril de 2026 (Vigente)',
    affectedCode: 'Texto Único Ordenado de la Ley del Procedimiento Administrativo General (Ley 27444)',
    articles: ['Arts. 209-228', 'Principios LPAG', 'Derogatoria formal del DS 004-2019-JUS'],
    keywords: ['ds 006-2026-jus', 'lpag', 'ley 27444', 'recurso de apelacion', 'reconsideracion', 'procedimiento administrativo'],
    summary: 'Nuevo TUO de la Ley 27444 que deroga formalmente al DS 004-2019-JUS.',
    practicalImpact:
      'PROHIBIDO citar el D.S. 004-2019-JUS. Toda referencia a la LPAG debe citarse bajo el TUO aprobado por Decreto Supremo N° 006-2026-JUS.',
  },
  {
    lawCode: 'Ley N° 32069 y D.S. N° 001-2026-EF',
    specialistId: 'marco',
    date: 'Abril 2025 - Vigente 2026',
    affectedCode: 'Ley General de Contrataciones Públicas (Reemplazó a la Ley 30225)',
    articles: ['OECE', 'Tribunal de Contrataciones Públicas (TCP)', 'JPRD obligatoria en obras'],
    keywords: ['ley 32069', 'oece', 'osce', 'contrataciones del estado', 'tcp', 'jprd', 'licitacion'],
    summary: 'Derogación total de la Ley 30225 y extinción definitiva del OSCE. Rige el Organismo de Contrataciones Eficientes (OECE).',
    practicalImpact:
      'PROHIBIDO mencionar al OSCE o la Ley 30225. Rige la Ley 32069 y el Decreto Supremo N° 001-2026-EF.',
  },

  // ── FERNANDA (TRIBUTARIO) ──
  {
    lawCode: 'Decreto Legislativo N° 1529',
    specialistId: 'fernanda',
    date: 'Vigente 2026',
    affectedCode: 'Ley para la Lucha contra la Evasión y Bancarización (Ley 28194)',
    articles: ['Art. 3', 'Art. 4', 'Medios de Pago'],
    keywords: ['dl 1529', 'bancarizacion', '2000 soles', '500 dolares', 'medios de pago', 'gasto no deducible'],
    summary: 'Obliga a usar medios de pago bancarios para obligaciones iguales o superiores a S/ 2,000.00 o US$ 500.00.',
    practicalImpact:
      'Todo pago que no utilice medios bancarios para dichos importes desconoce el costo/gasto para el Impuesto a la Renta y genera la pérdida del crédito fiscal de IGV.',
  },

  // ── ADRIANA (CORPORATIVO) ──
  {
    lawCode: 'Ley N° 30424 y D.S. 002-2019-JUS',
    specialistId: 'adriana',
    date: 'Vigente 2026',
    affectedCode: 'Responsabilidad Administrativa y Penal de Personas Jurídicas',
    articles: ['Modelo de Prevención', 'Compliance', 'Debida Diligencia'],
    keywords: ['ley 30424', 'compliance', 'responsabilidad personas juridicas', 'debida diligencia', 'oficial de cumplimiento'],
    summary: 'Responsabilidad autónoma de empresas por delitos de cohecho, lavado de activos, financiamiento del terrorismo, colusión y tráfico de influencias.',
    practicalImpact:
      'La implementación y auditoría de un Modelo de Prevención eficaz exime o atenúa significativamente las sanciones de multa, inhabilitación o disolución societaria.',
  },

  // ── RODRIGO (MINERO & AMBIENTAL) ──
  {
    lawCode: 'Nuevo TUPA INGEMMET 2026 & RCD OEFA',
    specialistId: 'rodrigo',
    date: 'Vigente 2026',
    affectedCode: 'Texto Único de Procedimientos Administrativos Mineros & Fiscalización Ambiental',
    articles: ['Petitorios Mineros', 'PAS Ambiental OEFA', 'REINFO D.L. 1293 / 1336'],
    keywords: ['ingemmet', 'tupa 2026', 'oefa', 'petitorio minero', 'reinfo', 'canon minero'],
    summary: 'Actualización de tasas, requisitos y régimen sancionador para concesiones mineras y fiscalización ambiental.',
    practicalImpact:
      'Plazos fatales de tramitación de petitorios, régimen de acreditación de producción mínima y atenuantes en fiscalización ambiental del OEFA.',
  },

  // ── SEBASTIÁN (PENAL REFORMA SPIJ) ──
  {
    lawCode: 'Código de Ejecución Penal (D. Leg. 654 y D. Leg. 1585)',
    specialistId: 'sebastian',
    date: 'Vigente 2026',
    affectedCode: 'Beneficios Penitenciarios (Semilibertad, Liberación Condicional y Redención)',
    articles: ['Arts. 44-57 CEP', 'Redención 2x1 y 3x1', 'D. Leg. 1585'],
    keywords: ['beneficios penitenciarios', 'semilibertad', 'liberacion condicional', 'redencion de pena', '2x1', 'computo laboral penitenciario'],
    summary: 'Régimen de beneficios penitenciarios y reducción efectiva del tiempo de reclusión:',
    practicalImpact:
      'Habilita la semilibertad al cumplir un tercio o la mitad de la pena según el tipo de delito, y liberación condicional a los dos tercios. La redención de pena por trabajo o educación computa a razón de 2 días de labor por 1 de pena (casos agravados 3x1 o 4x1).',
  },

  // ── VALENTINA (LABORAL REFORMA SPIJ) ──
  {
    lawCode: 'Leyes N° 27735 y 30334 (Gratificaciones) & Ley N° 31572 (Teletrabajo)',
    specialistId: 'valentina',
    date: 'Vigente 2026',
    affectedCode: 'Beneficios Sociales y Nuevas Modalidades Laborales',
    articles: ['Ley 27735', 'Ley 30334', 'Ley 31572', 'D.S. 002-2023-TR'],
    keywords: ['gratificaciones', 'bonificacion extraordinaria 9%', 'teletrabajo', 'desconexion digital', 'compensacion equipos'],
    summary: 'Inafectación permanente de gratificaciones legales y derechos laborales en teletrabajo:',
    practicalImpact:
      'Las gratificaciones de Fiestas Patrias y Navidad se pagan libres de descuentos de AFP/ONP y se adiciona la bonificación extraordinaria del 9% (Essalud) o 6.75% (EPS). En teletrabajo rige la desconexión digital de mínimo 12 horas continuas y compensación económica de luz e internet.',
  },

  // ── DIEGO (CIVIL REFORMA SPIJ) ──
  {
    lawCode: 'Ley N° 27157 y Arts. 1428-1430 Código Civil',
    specialistId: 'diego',
    date: 'Vigente 2026',
    affectedCode: 'Régimen de Propiedad Horizontal y Resolución Contractual de Pleno Derecho',
    articles: ['Ley 27157', 'D.S. 035-2006-VIVIENDA', 'Arts. 1428, 1429, 1430 CC'],
    keywords: ['propiedad horizontal', 'junta de propietarios', 'cuotas de mantenimiento', 'resolucion contractual', 'clausula resolutoria expresa'],
    summary: 'Mérito ejecutivo de recibos de mantenimiento y resolución automática de contratos:',
    practicalImpact:
      'Las liquidaciones de cuotas impagas emitidas por la Junta de Propietarios constituyen título ejecutivo judicial. En contratos patrimoniales, la cláusula resolutoria expresa (Art. 1430 CC) permite dar por resuelto el contrato de pleno derecho mediante simple comunicación fehaciente sin esperar plazo de 15 días.',
  },

  // ── CAMILA (FAMILIA REFORMA SPIJ) ──
  {
    lawCode: 'Ley N° 28970 (REDAM) y Ley N° 29227 (Divorcio Rápido)',
    specialistId: 'camila',
    date: 'Vigente 2026',
    affectedCode: 'Registro de Deudores Alimentarios Morosos y Divorcio Notarial/Municipal',
    articles: ['Ley 28970', 'Ley 30795', 'Ley 29227', 'D.S. 009-2008-JUS'],
    keywords: ['redam', 'deudor alimentario moroso', 'divorcio rapido', 'separacion convencional notarial', 'divorcio ulterior'],
    summary: 'Sanciones directas al deudor alimentario y disolución del vínculo matrimonial en 3 meses:',
    practicalImpact:
      'Inscripción de oficio en el REDAM tras adeudar 3 cuotas sucesivas o alternadas, bloqueando trámites bancarios, notariales y acceso a cargos públicos. En divorcio rápido, con mutuo acuerdo y cese de vida común, el divorcio ulterior se declara en menos de 90 días naturales ante notario o municipio.',
  },

  // ── MARCO (ADMINISTRATIVO REFORMA SPIJ) ──
  {
    lawCode: 'Ley N° 27584 (TUO Proceso Contencioso Administrativo D.S. 011-2019-JUS)',
    specialistId: 'marco',
    date: 'Vigente 2026',
    affectedCode: 'Impugnación Judicial de Actuaciones de la Administración Pública',
    articles: ['Arts. 4, 18, 28 D.S. 011-2019-JUS', 'Plazo de Caducidad 3 Meses'],
    keywords: ['contencioso administrativo', 'plazo de caducidad 3 meses', 'demanda contenciosa', 'agotamiento de la via administrativa', 'nulidad de resolucion'],
    summary: 'Control judicial de resoluciones ministeriales, municipales y de organismos reguladores:',
    practicalImpact:
      'Plazo perentorio de caducidad de 3 meses para interponer la demanda judicial tras la notificación del acto que agota la vía administrativa. Procede la pretensión de nulidad total o parcial, restablecimiento del derecho vulnerado e indemnización por daños.',
  },

  // ── FERNANDA (TRIBUTARIO REFORMA SPIJ) ──
  {
    lawCode: 'Artículos 43-44 TUO Código Tributario (D.S. 133-2013-EF) & D. Leg. 1535',
    specialistId: 'fernanda',
    date: 'Vigente 2026',
    affectedCode: 'Prescripción de Deudas Tributarias y Perfil de Cumplimiento SUNAT',
    articles: ['Arts. 43, 44, 45 CT', 'D. Leg. 1535', 'Perfil A hasta E'],
    keywords: ['prescripcion tributaria 4 anos', '6 anos no declarantes', 'perfil de cumplimiento', 'calificacion sunat', 'archivo de deuda'],
    summary: 'Plazos de prescripción de la acción de SUNAT para determinar y cobrar tributos:',
    practicalImpact:
      'La acción para determinar la obligación y exigir el pago prescribe a los 4 años para contribuyentes que presentaron declaración, 6 años para no declarantes y 10 años para agentes de retención. SUNAT no puede iniciar cobranza coactiva de periodos prescritos.',
  },

  // ── ADRIANA (CORPORATIVO REFORMA SPIJ) ──
  {
    lawCode: 'Arts. 234-248 Ley General de Sociedades (Ley 26887) & Ley N° 31112 (M&A)',
    specialistId: 'adriana',
    date: 'Vigente 2026',
    affectedCode: 'Régimen Especial de S.A.C. y Control Previo de Fusiones Empresariales',
    articles: ['Arts. 234-248 LGS', 'Art. 8 LGS (Pactos de Socios)', 'Ley 31112'],
    keywords: ['sac', 'sociedad anonima cerrada', 'derecho de preferencia', 'convenio de accionistas', 'fusiones empresariales', 'indecopi control previo'],
    summary: 'Régimen flexible de S.A.C. y umbrales de notificación antimonopolio:',
    practicalImpact:
      'Permite suprimir el Directorio en los estatutos (delegando gestión en la Gerencia General), pactar derecho de adquisición preferente y celebrar convenios parasocietarios vinculantes. Las operaciones de fusión o adquisición que superen umbrales de ventas brutas conjuntas (118,000 UIT) exigen autorización previa de INDECOPI.',
  },

  // ── RODRIGO (MINERO REFORMA SPIJ) ──
  {
    lawCode: 'D.S. 020-2020-EM (Reglamento de Procedimientos Mineros) & Ley del SEIA (Ley 27446)',
    specialistId: 'rodrigo',
    date: 'Vigente 2026',
    affectedCode: 'Titulación de Concesiones Mineras y Certificación Ambiental (SENACE / MINEM)',
    articles: ['Arts. 12-30 D.S. 020-2020-EM', 'Ley 27446', 'D.S. 019-2009-MINAM'],
    keywords: ['procedimientos mineros', 'concesion de exploracion', 'concesion de explotacion', 'seia', 'dia', 'eia-sd', 'eia-d', 'senace'],
    summary: 'Cadena de autorizaciones administrativas para el desarrollo de proyectos mineros:',
    practicalImpact:
      'El título de concesión minera no autoriza por sí solo a iniciar actividades: se requiere Instrumento de Gestión Ambiental aprobado (DIA, EIA-sd o EIA-d), autorización de uso de terreno superficial, licencia de uso de agua de la ANA y Autorización de Inicio de Actividades del MINEM/DREM.',
  },
];

/**
 * Normaliza texto para búsqueda libre de acentos y mayúsculas
 */
function normalizeText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Detecta si el usuario está solicitando la redacción de un escrito o documento legal
 */
export function isLegalDraftingRequest(query: string): boolean {
  const norm = normalizeText(query);
  const draftingTriggers = [
    'redacta', 'redactame', 'redactar', 'hazme un escrito', 'prepara un escrito',
    'elabora un escrito', 'haz una demanda', 'redacta una demanda', 'demanda de',
    'denuncia penal', 'redacta una denuncia', 'interponer denuncia', 'interpongo denuncia',
    'requerimiento de', 'prision preventiva', 'oposicion a prision preventiva',
    'apelacion de auto', 'recurso de apelacion', 'tutela de derechos', 'control de plazos',
    'sobreseimiento', 'excepcion de prescripcion', 'terminacion anticipada',
    'carta notarial', 'solicitud de', 'minuta', 'habeas corpus', 'reclamacion sunat',
    'recurso de reclamacion', 'recurso contencioso', 'pacto de socios', 'contrato de arrendamiento'
  ];
  return draftingTriggers.some((t) => norm.includes(t));
}

/**
 * Busca y extrae los Acuerdos Plenarios y Normas Vigentes relevantes según el especialista y la consulta
 */
export function findRelevantSpijKnowledge(agentId: string, userQuery: string): {
  plenaries: PlenaryAgreement[];
  reforms: LegalNormMod[];
} {
  const norm = normalizeText(userQuery);

  // Filtrar estrictamente por el especialista actual
  const specialistPlenaries = JURISPRUDENCE_COMPENDIUM.filter(
    (ap) => ap.specialistId === agentId
  );
  const specialistReforms = NORMATIVE_REFORMS_COMPENDIUM.filter(
    (r) => r.specialistId === agentId
  );

  let matchedPlenaries: PlenaryAgreement[] = [];
  let matchedReforms: LegalNormMod[] = [];

  // Match específico por palabras clave
  for (const ap of specialistPlenaries) {
    const hits = ap.keywords.filter((kw) => norm.includes(normalizeText(kw)));
    if (hits.length > 0) {
      matchedPlenaries.push(ap);
    }
  }

  for (const reform of specialistReforms) {
    const hits = reform.keywords.filter((kw) => norm.includes(normalizeText(kw)));
    if (hits.length > 0) {
      matchedReforms.push(reform);
    }
  }

  // Fallback: si no hubo match exacto por keywords en la consulta del usuario,
  // proveer los compendios rectores de la especialidad para asegurar siempre rigor técnico
  if (matchedPlenaries.length === 0 && specialistPlenaries.length > 0) {
    matchedPlenaries = specialistPlenaries.slice(0, 2);
  }
  if (matchedReforms.length === 0 && specialistReforms.length > 0) {
    matchedReforms = specialistReforms.slice(0, 2);
  }

  return {
    plenaries: matchedPlenaries.slice(0, 3),
    reforms: matchedReforms.slice(0, 3),
  };
}

/**
 * Genera el bloque de inyección para el Prompt de la IA con el sustento legal oficial segmentado por especialista
 */
export function getSpijLegalGrounding(agentId: string, userQuery: string): string {
  const { plenaries, reforms } = findRelevantSpijKnowledge(agentId, userQuery);
  const isDrafting = isLegalDraftingRequest(userQuery);
  const specialistArea = SPECIALIST_LABELS[agentId] || 'Derecho Peruano';

  if (plenaries.length === 0 && reforms.length === 0 && !isDrafting) {
    return '';
  }

  const sections: string[] = [];

  sections.push('════════════════════════════════════════════════════════════════');
  sections.push(`BASE NORMATIVA SPIJ Y JURISPRUDENCIA VINCULANTE — ${specialistArea.toUpperCase()}`);
  sections.push('════════════════════════════════════════════════════════════════');
  sections.push(`Como especialista en ${specialistArea}, tu respuesta y redacción deben concordar OBLIGATORIAMENTE con las siguientes normas vigentes del SPIJ y jurisprudencia vinculante de tu área:\n`);

  if (plenaries.length > 0) {
    sections.push('► PRECEDENTES Y PLENOS JURISDICCIONALES VINCULANTES DE TU ESPECIALIDAD:');
    plenaries.forEach((p) => {
      sections.push(`• [${p.code}] ${p.title}`);
      sections.push(`  - Órgano: ${p.court}`);
      sections.push(`  - Criterio vinculante: ${p.bindingGrounds}`);
      sections.push(`  - Principios rectores: ${p.keyPrinciples.join('; ')}`);
      sections.push(`  - Aplicación procesal: ${p.legalApplication}\n`);
    });
  }

  if (reforms.length > 0) {
    sections.push('► NORMAS Y MODIFICATORIAS ACTUALIZADAS DEL SPIJ (MINJUSDH / EL PERUANO):');
    reforms.forEach((r) => {
      sections.push(`• [${r.lawCode}] (${r.affectedCode}) - Fecha: ${r.date}`);
      sections.push(`  - Artículos aplicables: ${r.articles.join(', ')}`);
      sections.push(`  - Criterio de aplicación: ${r.practicalImpact}\n`);
    });
  }

  if (isDrafting) {
    sections.push('► REGLAS ESTRICTAS PARA LA REDACCIÓN DE ESTE ESCRITO LEGAL:');
    sections.push('- En la sección de "FUNDAMENTACIÓN JURÍDICA", debes citar los artículos de la ley CON SUS MODIFICATORIAS VIGENTES.');
    sections.push('- Debes incluir una subsección de "DOCTRINA JURISPRUDENCIAL VINCULANTE" citando el Pleno o Precedente exacto de tu especialidad.');
    sections.push('- Mantén rigor formal absoluto, redactado en el bloque ```document con sus correspondientes Otrosíes Digo procesales (Casilla SINOE, facultades Arts. 74°/80° CPC o personamiento NCPP).');
  }

  sections.push('════════════════════════════════════════════════════════════════');

  return sections.join('\n');
}
