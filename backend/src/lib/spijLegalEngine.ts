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
