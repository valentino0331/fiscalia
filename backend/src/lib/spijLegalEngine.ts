/**
 * SISTEMA PERUANO DE INFORMACIÓN JURÍDICA (SPIJ) & CORTE SUPREMA DE JUSTICIA
 * Compendio Normativo y Jurisprudencial Vinculante por Especialista Legal
 *
 * Segmentado estrictamente según la especialidad de cada uno de los 8 abogados de Hardman:
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
    code: 'Casación N° 626-2013/Moquegua',
    specialistId: 'sebastian',
    court: 'Sala Penal Permanente de la Corte Suprema de Justicia',
    title: 'Doctrina jurisprudencial vinculante sobre presupuestos de la prisión preventiva y su cesación',
    category: 'Procesal Penal / Medidas Coercitivas',
    keywords: [
      'casacion 626-2013', 'moquegua', 'prision preventiva', 'cesacion', 'cesacion de prision preventiva',
      'nuevos elementos de conviccion', 'fumus comissi delicti', 'sospecha grave', 'periculum in mora',
      'peligro de fuga', 'peligro de obstaculizacion', 'arraigo de calidad', 'proporcionalidad'
    ],
    keyPrinciples: [
      'Establece con carácter vinculante los cinco presupuestos materiales del test de prisión preventiva.',
      'En la cesación (Art. 283 NCPP), los nuevos elementos de convicción deben enervar los motivos que determinaron la imposición inicial de la medida.',
      'El juez debe realizar una audiencia contradictoria e inaplazable para examinar si la sospecha grave ha disminuido o si el peligro procesal se ha disipado mediante arraigos comprobados.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 20 al 42 (análisis secuencial de los 5 presupuestos) y FJ 49-54 (estándar probatorio para la cesación).',
    legalApplication: 'Invocación obligatoria en toda solicitud de cesación de prisión preventiva, recurso de apelación u oposición a la medida.',
  },
  {
    code: 'Casación N° 391-2011/Piura',
    specialistId: 'sebastian',
    court: 'Sala Penal Permanente de la Corte Suprema de Justicia',
    title: 'Principio de mutabilidad procesal y cláusula rebus sic stantibus en la cesación de prisión preventiva',
    category: 'Procesal Penal / Cesación',
    keywords: [
      'casacion 391-2011', 'piura', 'cesacion de prision preventiva', 'rebus sic stantibus',
      'mutabilidad', 'nuevos elementos', 'variacion de medida', 'comparecencia con restricciones'
    ],
    keyPrinciples: [
      'Rige el principio de variabilidad o mutabilidad de las medidas cautelares bajo la regla "rebus sic stantibus".',
      'Los nuevos elementos de convicción deben ser sobrevenidos o no haber sido conocidos ni valorados en la audiencia inicial de prisión preventiva.',
      'Basta con que los nuevos elementos demuestren que no concurren copulativamente todos los requisitos del Art. 268° NCPP para que proceda la inmediata excarcelación con comparecencia restrictiva.',
    ],
    bindingGrounds: 'Fundamento Jurídico Cuarto (aplicación estricta de la cláusula rebus sic stantibus y estándar del Art. 283.3 NCPP).',
    legalApplication: 'Sustento dogmático esencial en solicitudes de cesación de prisión preventiva ante el Juzgado de Investigación Preparatoria.',
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
    code: 'Acuerdo Plenario Extraordinario N° 02-2016/CIJ-116',
    specialistId: 'sebastian',
    court: 'II Pleno Jurisdiccional Extraordinario Penal - Corte Suprema',
    title: 'Proceso penal inmediato reformado, flagrancia y evidencia delictiva (D. Leg. 1194)',
    category: 'Procesal Penal / Procesos Especiales',
    keywords: [
      'proceso inmediato', 'flagrancia', 'cuasiflagrancia', 'detencion policial',
      'evidencia delictiva', 'd leg 1194', 'incoacion de proceso inmediato', 'audiencia unica de proceso inmediato'
    ],
    keyPrinciples: [
      'Inmediatez temporal y personal estricta: percepción sensorial directa de la infracción para validar la flagrancia constitucional.',
      'Control riguroso de legalidad del registro personal y de las evidencias incautadas por la Policía Nacional.',
      'Improcedencia del proceso inmediato ante necesidad de pericias complejas o actos de investigación no actuados en diligencias preliminares.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 10 al 23 (doctrina legal vinculante sobre incoación de proceso inmediato y tutela de garantías).',
    legalApplication: 'Clave para oponerse a procesos inmediatos, requerir remisión a investigación común y deducir nulidades de actas policiales.',
  },
  {
    code: 'STC Exp. N° 01558-2015-PHC/TC & 02098-2010-PA/TC',
    specialistId: 'sebastian',
    court: 'Tribunal Constitucional del Perú',
    title: 'Contenido constitucional del derecho de defensa: tiempo y medios adecuados para preparar la defensa técnica',
    category: 'Derecho Procesal Penal / Constitucional',
    keywords: [
      'tiempo razonable', 'medios adecuados', 'notificacion de prision preventiva',
      'vicio de notificacion', 'anexos de prision preventiva', 'bajo puerta',
      'nulidad absoluta', 'art 150', 'art 150.d', 'suspension de audiencia',
      'indefension material', 'igualdad de armas', 'plazo razonable'
    ],
    keyPrinciples: [
      'El derecho de defensa exige de modo insoslayable contar con el tiempo y los medios necesarios para una defensa eficaz y en igualdad de armas.',
      'El plazo de 48 horas del Art. 271.1 NCPP es un límite temporal máximo para el juzgado, no una habilitación para recortar abusivamente el tiempo de la defensa.',
      'Notificar un requerimiento de prisión preventiva sin anexos o al cierre de la jornada judicial para el lunes temprano genera indefensión material y Nulidad Absoluta Insanable (Art. 150° inc. d NCPP).',
    ],
    bindingGrounds: 'Doctrina jurisprudencial constitucional vinculante sobre el contenido esencial del derecho a no quedar en estado de indefensión técnica.',
    legalApplication: 'Obligatorio al deducir Nulidad de Notificación, solicitar reprogramación de audiencias de prisión preventiva y fundamentar Hábeas Corpus por indefensión.',
  },
  {
    code: 'Acuerdo Plenario N° 04-2010/CJ-116',
    specialistId: 'sebastian',
    court: 'VI Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Audiencia de Tutela de Derechos (Art. 71 NCPP)',
    category: 'Procesal Penal',
    keywords: [
      'tutela de derechos', 'art 71', 'art 71.4', 'vulneracion fiscal',
      'imputacion necesaria fiscal', 'declaracion sin abogado ante policia'
    ],
    keyPrinciples: [
      'Vía residual y protectora exclusiva frente a vulneraciones u omisiones cometidas por el MINISTERIO PÚBLICO o la POLICÍA NACIONAL.',
      'INAPLICABILIDAD CONTRA ACTOS DEL JUEZ: NO procede contra actos, cédulas de notificación o resoluciones del Juzgado de Investigación Preparatoria.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 11 al 17 (ámbito residual exclusivo de la tutela frente a afectaciones de la Fiscalía).',
    legalApplication: 'Aplicable exclusivamente ante vulneraciones fiscales o policiales; NUNCA deducir tutela de derechos contra trámites o notificaciones judiciales.',
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
    code: 'Casación Vinculante N° 02-2008/La Libertad',
    specialistId: 'sebastian',
    court: 'Sala Penal Permanente - Corte Suprema de Justicia',
    title: 'Cómputo del plazo de las diligencias preliminares y control de plazos (Art. 334.2 NCPP)',
    category: 'Procesal Penal / Plazos',
    keywords: [
      'control de plazos', 'diligencias preliminares', 'plazo razonable', 'art 334', 'art 334.2',
      'vencimiento de plazo', 'fiscalia', 'audiencia de control de plazos', 'casacion 02-2008'
    ],
    keyPrinciples: [
      'Autonomía de los plazos de diligencias preliminares e investigación preparatoria formalizada.',
      'El plazo de diligencias preliminares no puede ser arbitrariamente prolongado ni exceder el plazo razonable fijado por ley.',
      'Si el fiscal vence el plazo sin formalizar ni archivar, el afectado acude directamente al Juez de Garantías en Audiencia de Control de Plazos para ordenar la conclusión en plazo perentorio de 10 días.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 7 al 12 (doctrina jurisprudencial vinculante sobre plazos máximos en sede fiscal y remedio procesal del Art. 334.2 NCPP).',
    legalApplication: 'Vital para deducir Audiencia de Control de Plazos ante investigaciones preliminares fiscales paralizadas o arbitrariamente prolongadas.',
  },
  {
    code: 'Acuerdo Plenario N° 06-2009/CJ-116',
    specialistId: 'sebastian',
    court: 'V Pleno Jurisdiccional Penal - Salas Penales Corte Suprema',
    title: 'Control formal y sustancial de la acusación fiscal en etapa intermedia (Art. 350-352 NCPP)',
    category: 'Procesal Penal / Etapa Intermedia',
    keywords: [
      'control de acusacion', 'etapa intermedia', 'sobreseimiento', 'imputacion necesaria',
      'observacion formal', 'subsanacion de acusacion', 'defensa previa', 'atipicidad', 'acuerdo plenario 06-2009'
    ],
    keyPrinciples: [
      'El juez de investigación preparatoria ejerce control formal previo (claridad de hechos, tipificación, individualización) devolviendo la acusación defectuosa para subsanación fiscal en plazo de 5 días.',
      'Control sustancial directo: si los hechos no constituyen delito, falta antijuridicidad o concurre causa de atipicidad manifiesta, el juez dicta Sobreseimiento de oficio o a pedido de parte (Art. 344.2 NCPP), evitando el juicio oral.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 8 al 15 (doctrina legal vinculante sobre el doble control judicial de la acusación penal).',
    legalApplication: 'Herramienta de cabecera al contestar el traslado de acusación fiscal y solicitar el sobreseimiento o devolver la acusación.',
  },
  {
    code: 'Acuerdo Plenario Extraordinario N° 02-2012/CJ-116',
    specialistId: 'sebastian',
    court: 'Pleno Jurisdiccional Extraordinario Penal - Salas Penales Corte Suprema',
    title: 'Audiencia de tutela de derechos e imputación suficiente en la formalización fiscal (Art. 71.4 NCPP)',
    category: 'Procesal Penal / Tutela de Derechos',
    keywords: [
      'tutela de derechos', 'imputacion suficiente', 'imputacion concreta', 'disposicion de formalizacion',
      'dfip', 'art 71.4', 'precision factica', 'acuerdo plenario 02-2012'
    ],
    keyPrinciples: [
      'Procede la audiencia de tutela de derechos para controlar la omisión o insuficiencia de imputación fáctica circunstanciada en la Disposición de Formalización.',
      'El Juez de Garantías ordena al Fiscal subsanar y precisar los hechos imputados y la participación atribuida para garantizar el derecho de defensa eficaz.',
      'La tutela no faculta al juez a archivar o sobreseer la formalización de la investigación, sino a exigir la subsanación de los defectos formales de imputación.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 9 al 12 (doctrina legal vinculante sobre tutela de derechos frente a la deficiencia de imputación fiscal).',
    legalApplication: 'Imprescindible en audiencias de tutela de derechos cuando la fiscalía formaliza con cargos vagos, genéricos o sin individualización de conductas.',
  },
  {
    code: 'Acuerdo Plenario N° 03-2010/CJ-116',
    specialistId: 'sebastian',
    court: 'VI Pleno Jurisdiccional Penal - Salas Penales Corte Suprema',
    title: 'Delito de lavado de activos: autonomía típica y estándar probatorio del delito previo',
    category: 'Derecho Penal Especial / Lavado de Activos',
    keywords: [
      'lavado de activos', 'delito previo', 'delito fuente', 'autonomia tipica', 'prueba indiciaria',
      'acuerdo plenario 03-2010', 'origen ilicito', 'incremento patrimonial'
    ],
    keyPrinciples: [
      'Autonomía sustantiva y procesal del delito de lavado de activos respecto del delito previo generador de las ganancias ilícitas.',
      'No se exige condena previa del delito previo; basta acreditar la procedencia delictiva mediante prueba indiciaria y descarte de orígenes lícitos.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 8 al 34 (doctrina legal vinculante sobre tipicidad, autonomía y prueba indiciaria en lavado de activos).',
    legalApplication: 'Esencial para alegatos y defensas penales en investigaciones y procesos por lavado de activos.',
  },

  {
    code: 'Acuerdo Plenario N° 05-2009/CJ-116',
    specialistId: 'sebastian',
    court: 'V Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Proceso Especial de Terminación Anticipada: beneficio premial y acumulación (Arts. 468-471 NCPP)',
    category: 'Derecho Procesal Penal / Procesos Especiales',
    keywords: [
      'terminacion anticipada', 'acuerdo de terminacion anticipada', 'beneficio de un sexto', 'reduccion de pena',
      'confesion sincera', 'art 468 ncpp', 'art 471 ncpp', 'acuerdo plenario 05-2009', 'pena consensuada'
    ],
    keyPrinciples: [
      'La terminación anticipada procede en la investigación preparatoria hasta antes de formularse acusación fiscal.',
      'Otorga el beneficio premial tasado de reducción de una sexta parte (1/6) de la pena corporal; la acumulación con confesión sincera (Art. 161 NCPP) se rige bajo sus propias reglas y límites legales (no procede en flagrancia ni reincidencia, evaluándose individualmente).',
      'El acuerdo consensuado vincula al Juez respecto de la pena acordada, salvo que vulnere el principio de legalidad o resulte desproporcionada.'
    ],
    bindingGrounds: 'Fundamentos Jurídicos 12 al 24 sobre aplicación uniforme del beneficio premial de reducción de pena en terminación anticipada.',
    legalApplication: 'Estratégico en solicitudes de audiencia de terminación anticipada para pactar penas suspendidas o reducidas con la Fiscalía.'
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

  {
    code: 'Pleno Jurisdiccional Nacional Laboral y Casación N° 12437-2016 Lima',
    specialistId: 'valentina',
    court: 'Corte Suprema de Justicia de la República',
    title: 'Actos de hostilidad laboral equiparables al despido y procedimiento de emplazamiento previo (Art. 30 D.S. 003-97-TR)',
    category: 'Derecho Laboral / Hostilidad',
    keywords: [
      'hostilidad laboral', 'actos de hostilidad', 'cese de hostilidad', 'reduccion de remuneracion',
      'traslado perjudicial', 'falta de pago oportuno', 'carta notarial de hostilidad', 'art 30 lpcl',
      'hostigamiento sexual laboral'
    ],
    keyPrinciples: [
      'Las causales de hostilidad laboral están taxativamente señaladas en el Art. 30 del D.S. 003-97-TR (falta de pago de remuneración, reducción inmotivada de sueldo o categoría, traslado perjudicial, hostigamiento sexual Ley 27942).',
      'Exige emplazamiento previo ineludible por CARTA NOTARIAL otorgando el plazo legal de 6 DÍAS NATURALES para descargos o enmienda de la conducta.',
      'Vencido el plazo sin rectificación del empleador, el trabajador puede accionar judicialmente para el cese de hostilidad o darse por despedido y demandar la indemnización por despido arbitrario del Art. 38 LPCL.'
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Laboral sobre rigor procedimental de imputación de actos de hostilidad previa a la demanda.',
    legalApplication: 'Obligatorio en cartas notariales de imputación de hostilidad laboral y demandas judiciales laborales de cese o indemnización.'
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
  {
    code: 'Casación N° 4922-2015 Cusco y Casación 2157-2016 Lima',
    specialistId: 'diego',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Exclusión de la Sucesión por Indignidad (Art. 667 CC) vs. Desheredación (Art. 742 CC) y Legítima (Art. 725 CC)',
    category: 'Derecho Civil / Sucesiones',
    keywords: [
      'indignidad', 'causales de indignidad', 'exclusion por indignidad', 'indigno',
      'desheredacion', 'desheredar', 'herencia', 'testamento', 'legitima', 'tercio de libre disposicion',
      'libre disposicion', 'art 667', 'art 668', 'art 669', 'art 724', 'art 725', 'art 726', 'peticion de herencia',
      'sucesion intestada', 'heredero forzoso', 'sucesiones'
    ],
    keyPrinciples: [
      'Las causales de exclusión de la sucesión por indignidad están taxativamente tipificadas en el ARTÍCULO 667° DEL CÓDIGO CIVIL (modificado por Ley 31643), no admitiendo analogía ni extensión.',
      'La indignidad no opera de pleno derecho: exige declaración judicial mediante sentencia firme en proceso de conocimiento (Art. 668° CC) y caduca al año de haber entrado el indigno en posesión de los bienes.',
      'DISTINCIÓN DOGMÁTICA VITAL: El ARTÍCULO 725° DEL CÓDIGO CIVIL regula exclusivamente el TERCIO DE LIBRE DISPOSICIÓN de quien tiene hijos u otros descendientes o cónyuge. NUNCA debe confundirse el Art. 725° con la indignidad (Art. 667°).',
      'La desheredación (Arts. 742° y ss. CC) es facultad privativa testamentaria del causante respecto de herederos forzosos, mientras que la acción de indignidad es promovida tras el fallecimiento del causante por los llamados a la sucesión.'
    ],
    bindingGrounds: 'Doctrina jurisprudencial uniforme de la Corte Suprema sobre causales taxativas de exclusión por indignidad (Art. 667 CC) y deslinde con legítima sucesoria (Art. 725 CC).',
    legalApplication: 'Obligatorio en demandas de Exclusión de Heredero por Indignidad, Justificación o Contradicción de Desheredación y contestación de demandas hereditarias.',
  },

  {
    code: 'II Pleno Casatorio Civil (Casación N° 2229-2008 Lambayeque)',
    specialistId: 'diego',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Prescripción adquisitiva de dominio (Usucapión - Art. 950 Código Civil)',
    category: 'Derecho Civil / Derechos Reales',
    keywords: [
      'usucapion', 'prescripcion adquisitiva', 'prescripcion adquisitiva de dominio', 'art 950',
      'posesion continua', 'posesion pacifica', 'posesion publica', 'justo titulo', 'buena fe',
      'coposesion', 'segundo pleno casatorio', 'ii pleno casatorio'
    ],
    keyPrinciples: [
      'La usucapión extraordinaria requiere posesión continua, pacífica, pública y a título de propietario por 10 años (Art. 950 primer párrafo CC).',
      'La usucapión ordinaria requiere 5 años de posesión con justo título y buena fe (Art. 950 segundo párrafo CC).',
      'La coposesión homogénea no habilita a un coposeedor a usucapir individualmente la totalidad del bien contra los demás coposeedores.',
      'La sentencia judicial de prescripción adquisitiva es declarativa, reconociendo el derecho nacido con el cumplimiento del plazo legal.'
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Vinculante - Reglas 1 a 6 sobre presupuestos fácticos y probatorios del Art. 950 del Código Civil.',
    legalApplication: 'Obligatorio en demandas de Prescripción Adquisitiva de Dominio, reconvenciones y oposiciones de usucapión frente a demandas de desalojo o reivindicación.'
  },
  {
    code: 'I Pleno Casatorio Civil (Casación N° 1465-2007 Cajamarca)',
    specialistId: 'diego',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Eficacia de la transacción extrajudicial y excepciones procesales (Arts. 1302 CC y 446 CPC)',
    category: 'Derecho Civil / Obligaciones y Contratos',
    keywords: [
      'transaccion', 'transaccion extrajudicial', 'cosa juzgada civil', 'excepcion de transaccion',
      'art 1302', 'art 446 cpc', 'primer pleno casatorio', 'i pleno casatorio', 'danos transados'
    ],
    keyPrinciples: [
      'La transacción extrajudicial celebrada con las formalidades del Art. 1302 del Código Civil extingue las obligaciones litigiosas o dudosas y surte efectos vinculantes de cosa juzgada entre las partes.',
      'Diferenciación procesal rigurosa: La excepción de conclusión del proceso por transacción (Art. 446 inc. 10 CPC) exige en estricto un proceso previo idéntico concluido con transacción judicial homologada; si la transacción es puramente extrajudicial, se hace valer como defensa previa, excepción de falta de interés para obrar o defensa de fondo por extinción obligacional.'
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Vinculante sobre oponibilidad procesal de acuerdos transaccionales frente a demandas de indemnización por daños.',
    legalApplication: 'Vital para formular Excepción de Transacción en contestaciones de demanda cuando la controversia ya fue resuelta extrajudicialmente.'
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

  {
    code: 'III Pleno Casatorio Civil (Casación N° 4664-2010 Puno)',
    specialistId: 'camila',
    court: 'Salas Civiles y de Familia de la Corte Suprema de Justicia',
    title: 'Divorcio por causal de separación de hecho e indemnización al cónyuge perjudicado (Arts. 333 inc. 12 y 345-A CC)',
    category: 'Derecho de Familia / Divorcio',
    keywords: [
      'separacion de hecho', 'divorcio por separacion de hecho', 'tercer pleno casatorio', 'iii pleno casatorio',
      'conyuge perjudicado', 'indemnizacion divorcio', 'art 333 inc 12', 'art 345-a', 'adjudicacion preferente',
      'alimentos divorcio', 'causales de divorcio'
    ],
    keyPrinciples: [
      'En divorcio por separación de hecho (Art. 333 inc. 12 CC), el Juez tiene el deber de evaluar de oficio si se ha acreditado en autos un cónyuge más perjudicado por la ruptura y, de verificarse el menoscabo o daño personal/patrimonial, fijar una indemnización o adjudicación preferente (Art. 345-A CC); no opera como una indemnización monetaria automática si no se acredita perjuicio real.',
      'Es requisito de procedencia sustancial acreditar el cumplimiento o estar al día en el pago de las obligaciones alimentarias fijadas o acordadas con anterioridad (Art. 345-A CC).',
      'Plazos legales de separación ininterrumpida: mínimo 2 años sin hijos menores o 4 años con hijos menores de edad.'
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Vinculante - Reglas 1 a 6 sobre tutela económica obligatoria al cónyuge inocente perjudicado en el divorcio.',
    legalApplication: 'Indispensable en toda demanda y contestación de Divorcio por Separación de Hecho para solicitar o contradecir la indemnización del Art. 345-A CC.'
  },
  {
    code: 'VIII Pleno Casatorio Civil (Casación N° 3006-2015 Junín)',
    specialistId: 'camila',
    court: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Disposición unilateral de bienes sociales por un solo cónyuge (Art. 315 Código Civil)',
    category: 'Derecho de Familia / Régimen Patrimonial Conyugal',
    keywords: [
      'sociedad de gananciales', 'disposicion unilateral', 'bien social', 'art 315', 'octavo pleno casatorio',
      'viii pleno casatorio', 'venta bien conyugal', 'nulidad venta conyuge', 'patrimonio autonomo'
    ],
    keyPrinciples: [
      'La disposición o gravamen de un bien social celebrado por uno solo de los cónyuges sin la intervención, poder ni consentimiento del otro adolece de NULIDAD ABSOLUTA por falta de manifestación de voluntad (Art. 219 inc. 1 CC).',
      'El cónyuge preterido tiene legitimidad activa para demandar la nulidad del acto jurídico de compraventa, hipoteca o gravamen del bien social.'
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Vinculante sobre ineficacia y nulidad absoluta de actos de disposición unilateral de bienes gananciales.',
    legalApplication: 'Obligatorio en demandas de Nulidad de Acto Jurídico cuando uno de los cónyuges vendió o hipotecó bienes de la sociedad conyugal a espaldas del otro.'
  },
  {
    code: 'Casación N° 4118-2016 Lima / Consulta de Familia Corte Suprema',
    specialistId: 'camila',
    court: 'Sala Civil Permanente de la Corte Suprema de Justicia',
    title: 'Adopción de personas mayores de edad capaces en Proceso No Contencioso (Arts. 781°-785° CPC y 377°-385° CC)',
    category: 'Derecho de Familia / Adopción de Mayores de Edad',
    keywords: [
      'adopcion de mayor', 'adopcion mayor de edad', 'adopcion personas capaces', 'adopcion mayor',
      'adopcion de personas capaces', 'adoptar mayor de edad', 'adoptar adulto', 'adopcion adulto',
      'art 781 cpc', 'art 782 cpc', 'art 783 cpc', 'proceso no contencioso adopcion', 'adopcion de personas mayores de edad',
      'adopcion', 'adopción', 'adoptar'
    ],
    keyPrinciples: [
      'La adopción de personas mayores de edad capaces se tramita con sujeción estricta a la Vía del PROCESO NO CONTENCIOSO bajo los Artículos 749° inciso 7, 750°, 751°, 781°, 782° y 783° del Código Procesal Civil; NUNCA es una demanda contenciosa ni se aplican normas de procesos abreviados o de conocimiento.',
      'El Código de los Niños y Adolescentes (Ley 27337) y el D. Leg. 1297 son estrictamente inaplicables a mayores de edad; no interviene la Dirección General de Adopciones (DGA).',
      'Requisitos materiales taxativos (Código Civil): solvencia moral del adoptante (Art. 378 inc. 1), diferencia de edad mínima de 18 años entre adoptante y adoptado (Art. 378 inc. 2), asentimiento del cónyuge del adoptante si fuere casado (Art. 378 inc. 3) y asentimiento libre y expreso del adoptado mayor de edad capaz (Art. 378 inc. 4).',
      'Anexos especiales obligatorios bajo sanción de inadmisibilidad (Art. 782 CPC): partidas de nacimiento y matrimonio/defunción, declaración jurada de bienes del adoptado y certificados médicos de salud física y mental de adoptante y adoptado.',
      'La intervención del Ministerio Público (Fiscalía Provincial de Familia) en la audiencia es obligatoria conforme al Art. 783° CPC, concluyendo con la aprobación judicial y la remisión de partes al RENIEC para la nueva partida de nacimiento.',
    ],
    bindingGrounds: 'Doctrina Jurisprudencial Vinculante sobre la competencia exclusiva de los Juzgados de Familia en Procesos No Contenciosos de Adopción de Mayores de Edad.',
    legalApplication: 'Invocable obligatoriamente en toda Solicitud de Adopción de Persona Mayor de Edad Capaz tramitada ante el Poder Judicial o en la vía notarial (Ley 26662).',
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

  {
    code: 'Precedente Vinculante Tribunal del Servicio Civil & Casación N° 1803-2017 Lima',
    specialistId: 'marco',
    court: 'Corte Suprema y Tribunales Administrativos',
    title: 'Régimen de nulidad de oficio (Art. 213) y silencio administrativo positivo (Arts. 38 y 39 TUO LPAG D.S. 006-2026-JUS)',
    category: 'Derecho Administrativo',
    keywords: [
      'nulidad de oficio', 'plazo de nulidad de oficio', 'silencio administrativo positivo', 'silencio positivo',
      'silencio administrativo negativo', 'art 213 lpag', 'art 38 lpag', 'aprobacion ficta', '2 anos nulidad de oficio'
    ],
    keyPrinciples: [
      'La facultad de la Administración para declarar la NULIDAD DE OFICIO de sus propios actos administrativos prescribe a los 2 AÑOS desde que quedaron consentidos (Art. 213 TUO LPAG D.S. 006-2026-JUS), sujeta a las condiciones y causales legales del artículo 10 y precedentes del TC; vencido el plazo, únicamente cabe acción de lesividad judicial.',
      'El Silencio Administrativo rige conforme al catálogo de procedimientos: el Silencio Positivo genera aprobación ficta únicamente en los procedimientos de evaluación previa calificados legalmente como tales (Arts. 38 y 39 TUO LPAG D.S. 006-2026-JUS); en los demás casos opera el silencio negativo para habilitar recursos o la vía contenciosa.'
    ],
    bindingGrounds: 'Doctrina Administrativa de observancia obligatoria sobre seguridad jurídica, límites de anulación y efectos de la aprobación ficta.',
    legalApplication: 'Fundamental para deducir prescripción de la nulidad de oficio que pretenda iniciar una municipalidad o ministerio contra licencias o autorizaciones.'
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
    keywords: ['dl 1585', 'prision preventiva', '5 anos', 'pena superior a 5 anos', 'vigilancia electronica', 'revision de oficio', 'cesacion', 'cesacion de prision preventiva', 'art 283', 'articulo 283'],
    summary: 'Reforma de las medidas cautelares y penas:',
    practicalImpact:
      '1. Prisión Preventiva (Art. 268.b NCPP): La pena probable DEBE SUPERAR LOS 5 AÑOS (antes 4 años).\n' +
      '2. Art. 268-A NCPP: Prioridad obligatoria de vigilancia electrónica para penas hasta 7 años.\n' +
      '3. Art. 283 NCPP: Revisión judicial de oficio cada 6 meses obligatoria.\n' +
      '4. Art. 57 CP: Suspensión de pena ampliada hasta 5 años.',
  },
  {
    lawCode: 'Código Procesal Penal (DL 957) Arts. IX T.P., 71.2.c y 80°-85°',
    specialistId: 'sebastian',
    date: 'Vigente 2026',
    affectedCode: 'Derecho a la Defensa Técnica y Estatuto del Abogado Defensor',
    articles: ['Art. IX T.P. NCPP', 'Art. 71.2.c NCPP', 'Art. 80 NCPP', 'Art. 84 NCPP', 'Art. 85 NCPP', 'Art. 62 NCPP'],
    keywords: [
      'abogado defensor', 'defensa tecnica', 'asistencia tecnica', 'derecho de defensa',
      'asistencia de abogado', 'art 80', 'art 84', 'art 62', 'exclusion del fiscal'
    ],
    summary: 'Régimen canónico del Derecho a la Defensa Técnica y Estatuto del Abogado Defensor:',
    practicalImpact:
      '1. Art. IX Título Preliminar y Art. 80° NCPP: La defensa técnica es un derecho fundamental irrenunciable e inviolable desde el inicio de la investigación.\n' +
      '2. Art. 71° num. 2 lit. c NCPP: Derecho a ser asistido por abogado defensor desde los primeros actos y en toda declaración.\n' +
      '3. Art. 84° NCPP: Derechos del Abogado Defensor (acceso a la carpeta, interrogar, aportar pruebas, entrevistarse reservadamente).\n' +
      '⚠️ ADVERTENCIA ANTI-ERROR: El Art. 62° del NCPP trata sobre la EXCLUSIÓN DEL FISCAL (reemplazo por el Fiscal Superior). JAMÁS citar el Art. 62° como derecho de defensa ni como asistencia técnica de abogado.',
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
  {
    lawCode: 'Ley N° 31307',
    specialistId: 'sebastian',
    date: 'Vigente 2026',
    affectedCode: 'Nuevo Código Procesal Constitucional (Arts. 33, 34)',
    articles: ['Art. 33 inc. 1', 'Art. 34', 'Art. 200 inc. 1 Const.'],
    keywords: ['ley 31307', 'habeas corpus', 'habeas corpus reparador', 'detencion arbitraria', 'libertad individual', 'sin audiencia previa', 'art 271 ncpp'],
    summary: 'Régimen de protección urgente de la libertad individual ante detenciones arbitrarias y autos cautelares nulos dictados sin audiencia.',
    practicalImpact:
      '1. Art. 33° inc. 1: Procede el habeas corpus reparador contra la privación arbitraria de la libertad.\n' +
      '2. Art. 34°: El juez constitucional ordena la libertad inmediata del afectado y la nulidad de las resoluciones emitidas sin audiencia previa obligatoria (Art. 271° NCPP).\n' +
      '3. Cierre procesal obligatorio: "POR LO EXPUESTO" solicitando libertad inmediata.',
  },
  {
    lawCode: 'D.Leg. N° 654 & D.Leg. N° 1296',
    specialistId: 'sebastian',
    date: 'Vigente 2026',
    affectedCode: 'Código de Ejecución Penal (Arts. 48 al 52, Art. 50)',
    articles: ['Art. 48 CEP', 'Art. 49 CEP', 'Art. 50 CEP', 'Art. 52 CEP'],
    keywords: ['codigo de ejecucion penal', 'd leg 654', 'd leg 1296', 'semilibertad', 'beneficio penitenciario', 'tercio de la pena', '1/3 de la pena', 'informe inpe', 'oferta laboral'],
    summary: 'Régimen procesal de beneficios penitenciarios y semilibertad:',
    practicalImpact:
      '1. Requisito objetivo: Cumplimiento de más de un tercio (1/3) de la pena privativa de libertad efectiva impuesta.\n' +
      '2. Requisito negativo: Verificación obligatoria de no encontrarse en la lista de delitos excluidos del Art. 50° CEP.\n' +
      '3. Requisitos sustantivos: Informe favorable de conducta y educación/trabajo emitido por el INPE, acreditación de oferta laboral formal y pago o fianza de reparación civil.\n' +
      '4. Competencia: Juez Penal Unipersonal de ejecución (Art. 52° CEP).',
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
    lawCode: 'Decreto Supremo N° 015-2026-TR',
    specialistId: 'valentina',
    date: 'Octubre 2026 - Vigente Oficial',
    affectedCode: 'Remuneración Mínima Vital (RMV) y Asignación Familiar',
    articles: ['RMV S/ 1,230', 'Asignación Familiar S/ 123'],
    keywords: ['rmv', 'sueldo minimo', '1230', '1130', 'asignacion familiar', '123'],
    summary: 'Establece la RMV oficial en S/ 1,230 mensuales y la Asignación Familiar legal en el 10% (S/ 123.00).',
    practicalImpact: 'Piso mínimo imperativo para liquidaciones laborales, beneficios sociales, cálculo referencial de alimentos y multas.',
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

  {
    lawCode: 'Código Penal (D. Leg. 635) Arts. 384°, 387°, 393°-398°, 400° y D. Leg. 1243',
    specialistId: 'sebastian',
    date: 'Vigente 2026',
    affectedCode: 'Delitos contra la Administración Pública y Corrupción de Funcionarios ("Muerte Civil")',
    articles: ['Art. 384 CP', 'Art. 387 CP', 'Art. 393 CP', 'Art. 394 CP', 'Art. 399 CP', 'Art. 400 CP', 'D. Leg. 1243'],
    keywords: [
      'colusion', 'colusion simple', 'colusion agravada', 'peculado', 'peculado doloso', 'peculado culposo',
      'cohecho', 'cohecho pasivo', 'cohecho activo', 'soborno', 'trafico de influencias', 'negociacion incompatible',
      'inhabilitacion perpetua', 'muerte civil'
    ],
    summary: 'Tipificación canónica y penas en delitos de Corrupción y Delitos contra la Administración Pública:',
    practicalImpact:
      'Colusión (Art. 384 CP): concertación ilegal en contratos u obras; agravada si causa perjuicio patrimonial (pena de 6 a 15 años). Peculado (Art. 387 CP): apropiación de caudales públicos confiados por razón del cargo (pena de 4 a 8 años, agravada de 8 a 12 años). Cohecho pasivo propio (Art. 393 CP: solicitud o recepción de soborno a cambio de faltar al deber). Tráfico de influencias (Art. 400 CP: invocación de influencias a cambio de dádiva). Las penas de inhabilitación ordinaria oscilan entre 5 a 20 años; la inhabilitación perpetua procede únicamente bajo los supuestos agravados expresamente previstos por ley (D. Leg. 1243 / Ley 30650, como pertenencia a organización criminal o grave daño patrimonial a programas estatales).'
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

  {
    lawCode: 'Decreto Legislativo N° 650 (CTS) y Decreto Legislativo N° 713 (Vacaciones e Indemnización)',
    specialistId: 'valentina',
    date: 'Vigente 2026',
    affectedCode: 'Compensación por Tiempo de Servicios y Descansos Remunerados Laborales',
    articles: ['D. Leg. 650', 'D.S. 001-97-TR', 'D. Leg. 713', 'D.S. 012-92-TR', 'Art. 24 D. Leg. 713', 'Art. 30 D.S. 003-97-TR'],
    keywords: [
      'cts', 'compensacion por tiempo de servicios', 'deposito de cts', 'vacaciones', 'triple vacacional',
      'indemnizacion vacacional', 'record vacacional', 'hostilidad laboral', 'carta de hostilidad', 'falta de pago sueldo'
    ],
    summary: 'Régimen de CTS (D. Leg. 650 y Ley 32027/32322 hasta 2026) y Descanso Vacacional con Triple Vacacional (D. Leg. 713):',
    practicalImpact:
      'Los depósitos ordinarios de CTS son semestrales (mayo y noviembre, D. Leg. 650). Se debe informar que por mandato legal extraordinario (Ley 32027 / Ley 32322) rige la autorización de retiro del 100% de la CTS disponible hasta el 31 de diciembre de 2026. En materia de descanso vacacional (D. Leg. 713), el trabajador goza de 30 días; la triple remuneración vacacional (Art. 24 D. Leg. 713) procede conforme a las condiciones de ley cuando el trabajador ordinario no goza del descanso en el año posterior a su adquisición (no aplica a gerentes o directivos con facultad de fijar su propio descanso).'
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
  {
    lawCode: 'Ley N° 31643 y Artículos 667°, 668°, 669° Código Civil',
    specialistId: 'diego',
    date: 'Vigente 2026',
    affectedCode: 'Código Civil (Libro IV: Sucesiones - Indignidad, Desheredación y Legítima)',
    articles: ['Art. 667 CC', 'Art. 668 CC', 'Art. 669 CC', 'Art. 724 CC', 'Art. 725 CC', 'Art. 726 CC', 'Art. 742 CC', 'Art. 744 CC', 'Art. 747 CC', 'Ley 31643'],
    keywords: [
      'indignidad', 'causales de indignidad', 'exclusion por indignidad', 'indigno',
      'desheredacion', 'desheredar', 'herencia', 'testamento', 'legitima', 'tercio de libre disposicion',
      'libre disposicion', 'art 667', 'art 725', 'art 668', 'art 726', 'violencia familiar herencia', 'alimentos herencia'
    ],
    summary: 'Régimen taxativo de causales de indignidad (Art. 667 CC) reformado por Ley 31643 y deslinde con legítima (Art. 725 CC):',
    practicalImpact:
      'Las causales de exclusión por indignidad corresponden OBLIGATORIA Y EXCLUSIVAMENTE AL ARTÍCULO 667° DEL CÓDIGO CIVIL (7 incisos: 1. Homicidio doloso/tentativa; 2. Delito doloso; 3. Denuncia calumniosa con pena de cárcel; 4. Coacción o violencia en testamento; 5. Falsificación o destrucción de testamento; 6. Sentencia firme por violencia familiar Ley 31643; 7. Reiterado incumplimiento de alimentos debidos Ley 31643). Requiere proceso de conocimiento y sentencia judicial firme (Art. 668 CC). NUNCA CONFUNDIR CON EL ARTÍCULO 725° CC, el cual norma únicamente el Tercio de Libre Disposición para causantes con hijos o cónyuge.',
  },

  {
    lawCode: 'Código Civil (D. Leg. 295) Arts. 219°, 1321°, 1969°-1985° y CPC Art. 720°',
    specialistId: 'diego',
    date: 'Vigente 2026',
    affectedCode: 'Nulidad de Acto Jurídico, Prescripción (Art. 2001 CC), Responsabilidad Civil y Ejecución Hipotecaria (Arts. 720-721 CPC)',
    articles: ['Art. 219 CC', 'Art. 221 CC', 'Art. 2001 inc. 1 y 4 CC', 'Art. 1321 CC', 'Art. 1969 CC', 'Art. 1970 CC', 'Art. 1985 CC', 'Art. 1097 CC', 'Art. 720 CPC', 'Art. 721 CPC'],
    keywords: [
      'nulidad de acto juridico', 'anulabilidad', 'art 219', 'art 221', 'danos y perjuicios', 'indemnizacion',
      'dano moral', 'lucro cesante', 'dano emergente', 'art 1969', 'art 1970', 'art 1985', 'responsabilidad civil',
      'hipoteca', 'ejecucion de garantias', 'art 720 cpc', 'remate judicial'
    ],
    summary: 'Nulidad de Acto Jurídico (Art. 219 CC), Anulabilidad (Art. 221 CC / prescripción 2 años Art. 2001.4 CC), Daños (Art. 1985 CC) y Ejecución Hipotecaria (Arts. 720-721 CPC):',
    practicalImpact:
      'El Art. 219 CC regula las causales de nulidad absoluta (prescripción de 10 años conforme al Art. 2001 inc. 1 CC). El Art. 221 CC regula las causales de anulabilidad, cuyo plazo de prescripción de 2 años emana del Art. 2001 inc. 4 CC. En responsabilidad extracontractual (Arts. 1969/1970 CC), la indemnización comprende daño emergente, lucro cesante, daño a la persona y daño moral (Art. 1985 CC). En ejecución de hipoteca (Art. 1097 CC), el Art. 720 CPC regula la procedencia y recaudos de la demanda, mientras que el mandato de ejecución con plazo de 3 días para pago bajo apercibimiento de remate emana del Art. 721 CPC.'
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

  {
    lawCode: 'Ley N° 28457 (modificada por Ley 30628) y Código Civil Arts. 315°, 318°-326°, 333°',
    specialistId: 'camila',
    date: 'Vigente 2026',
    affectedCode: 'Filiación Extramatrimonial sin Tasas, Liquidación de Sociedad Conyugal y Causales de Divorcio',
    articles: ['Ley 28457', 'Ley 30628', 'Art. 315 CC', 'Art. 318 CC', 'Art. 326 CC', 'Art. 333 CC', 'Art. 345-A CC'],
    keywords: [
      'filiacion', 'filiacion extramatrimonial', 'prueba de adn', 'demanda de paternidad', 'sociedad de gananciales',
      'liquidacion de gananciales', 'bienes conyugales', 'union de hecho', 'convivencia', 'causales de divorcio',
      'adulterio', 'abandono de hogar', 'violencia psicologica divorcio'
    ],
    summary: 'Proceso célere de filiación con prueba de ADN (Ley 28457/30628) y liquidación de gananciales (Arts. 318-326 CC):',
    practicalImpact:
      'En filiación extramatrimonial (Ley 28457 modificada por Ley 30628) no se pagan tasas; se confiere traslado por 10 días al demandado para oponerse y solicitar prueba biológica de ADN. De no mediar oposición válida en dicho plazo, el juzgado emite declaración judicial de paternidad; de haber oposición, se actúa la pericia de ADN bajo las reglas de la ley y se resuelven acumuladamente los alimentos. En la sociedad conyugal, la disposición de bienes requiere intervención de ambos (Art. 315 CC); las uniones de hecho propias originan sociedad de bienes (Art. 326 CC).'
  },
  {
    lawCode: 'Código Procesal Civil (Arts. 749° inc. 7, 750°, 751°, 781°-785°) y Código Civil (Arts. 377°-385°)',
    specialistId: 'camila',
    date: 'Vigente 2026',
    affectedCode: 'Adopción de Personas Mayores de Edad Capaces (Proceso No Contencioso y Vía Notarial)',
    articles: ['Arts. 749 inc. 7 CPC', 'Art. 750 CPC', 'Art. 751 CPC', 'Art. 781 CPC', 'Art. 782 CPC', 'Art. 783 CPC', 'Art. 785 CPC', 'Arts. 377-385 Código Civil', 'Ley 26662 Arts. 21-23'],
    keywords: [
      'adopcion de mayor', 'adopcion mayor de edad', 'adopcion personas capaces', 'adopcion mayor',
      'adopcion de personas capaces', 'adoptar mayor de edad', 'adoptar adulto', 'adopcion adulto',
      'art 781 cpc', 'art 782 cpc', 'art 783 cpc', 'proceso no contencioso adopcion', 'anexos adopcion',
      'solicitud de adopcion', 'adopcion notarial', 'diferencia de edad adopcion', 'adopcion', 'adopción'
    ],
    summary: 'Régimen procesal no contencioso exclusivo para adopción de mayores de edad y prohibición del CNA:',
    practicalImpact:
      'La adopción de personas mayores de edad capaces NO es una demanda contenciosa; se tramita obligatoriamente en la VÍA DEL PROCESO NO CONTENCIOSO ante el Juzgado de Familia (o Juzgado Civil/Mixto) bajo los Arts. 749° inc. 7, 781°, 782° y 783° del CPC, o ante Notario Público bajo la Ley 26662 (Arts. 21°-23°). La sumilla se titula "SOLICITUD", el cierre es "POR LO EXPUESTO" y se notifica al Ministerio Público conforme al Art. 783° CPC. Es obligatorio acompañar los 6 anexos especiales del Art. 782° CPC (partidas, certificado médico de salud física y mental de adoptante y adoptado, declaración jurada de bienes). En el Código Civil (Art. 378°), el adoptante debe ser al menos 18 años mayor que el adoptado y este último debe prestar su asentimiento expreso. Queda terminantemente PROHIBIDO aplicar el Código de los Niños y Adolescentes (Ley 27337) o el D. Leg. 1297 a mayores de edad, así como citar artículos de procesos de conocimiento o abreviados.'
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

  {
    lawCode: 'Decreto Supremo N° 006-2026-JUS (TUO LPAG) Arts. 217°-220° y Arts. 248°-252°',
    specialistId: 'marco',
    date: 'Vigente 2026',
    affectedCode: 'Régimen de Recursos Administrativos y Principios del Procedimiento Sancionador (PAS)',
    articles: ['D.S. 006-2026-JUS', 'Art. 217 LPAG', 'Art. 219 LPAG', 'Art. 220 LPAG', 'Art. 248 LPAG', 'Art. 252 LPAG'],
    keywords: [
      'recurso de reconsideracion', 'recurso de apelacion', 'plazo de apelacion administrativo', '15 dias habiles',
      'potestad sancionadora', 'procedimiento administrativo sancionador', 'pas', 'prescripcion pas', 'tipicidad pas'
    ],
    summary: 'Plazo fatal de 15 días hábiles para impugnaciones y prescripción de 4 años del PAS en el TUO LPAG D.S. 006-2026-JUS:',
    practicalImpact:
      'Los recursos de Reconsideración (con nueva prueba) y Apelación deben interponerse en el plazo perentorio e improrrogable de 15 DÍAS HÁBILES; la administración tiene 30 días hábiles para resolver. En el PAS rigen los principios de legalidad, tipicidad, debido procedimiento y presunción de licitud (Art. 248 TUO LPAG D.S. 006-2026-JUS); la prescripción general supletoria de la potestad sancionadora es de 4 años (Art. 252), salvo que leyes especiales establezcan plazos distintos.'
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
    'recurso de reclamacion', 'recurso contencioso', 'pacto de socios', 'contrato de arrendamiento',
    'audita', 'vicio procesal', 'nulidad procesal', 'estrategia de audiencia', 'litigacion oral', 'alegato oral'
  ];
  return draftingTriggers.some((t) => norm.includes(t));
}

/**
 * Detecta si el usuario solicita auditoría de vicios, nulidades procesales o revisión de notificaciones
 */
export function isAuditRequest(query: string): boolean {
  const norm = normalizeText(query);
  const auditTriggers = [
    'audita', 'auditar', 'vicio', 'vicios procesales', 'nulidad procesal', 'defecto de notificacion',
    'cedula de notificacion', 'revisar notificacion', 'inadmisible', 'improcedente', 'debida motivacion',
    'notificacion', 'notificación', 'bajo puerta', 'sin anexar', 'emplazamiento', 'traslado'
  ];
  return auditTriggers.some((t) => norm.includes(t));
}

/**
 * Detecta si el usuario solicita cesación de prisión preventiva o variación de medida coercitiva (Art. 283 NCPP)
 */
export function isCesacionPrisionPreventivaRequest(query: string): boolean {
  const norm = normalizeText(query);
  const cesacionTriggers = [
    'cesacion de prision', 'cesacion de la prision', 'cesacion', 'cesar la prision', 'cesar prision',
    'cesacion preventiva', 'cese de prision', 'cesar prision preventiva', 'variacion de prision preventiva',
    'variar prision preventiva', 'variar prision', 'variar la prision', 'art 283', 'articulo 283',
    'nuevos elementos de conviccion', 'nuevos elementos', 'rebus sic stantibus',
    'escrito x cesacion', 'escrito de cesacion', 'escrito por cesacion', 'cesacion de prision preventiva'
  ];
  return cesacionTriggers.some((t) => norm.includes(t));
}

/**
 * Detecta si el usuario solicita preparación para audiencia oral o litigación en estrados
 */
export function isOralHearingRequest(query: string): boolean {
  const norm = normalizeText(query);
  const hearingTriggers = [
    'audiencia', 'audiencia oral', 'estrado', 'litigacion', 'teoria del caso', 'alegato de apertura',
    'alegato de clausura', 'objecion', 'objeciones', 'informe oral', 'apelacion', 'apelacion de sentencia',
    'sentencia', 'condena', 'colusion', 'sustentacion', 'segunda instancia'
  ];
  return hearingTriggers.some((t) => norm.includes(t));
}

/**
 * Detecta si el usuario solicita adopción de personas mayores de edad o personas capaces
 */
export function isAdopcionMayorEdadRequest(query: string): boolean {
  const norm = normalizeText(query);
  const adopcionTriggers = [
    'adopcion de mayor', 'adopcion mayor', 'adopcion de adulto', 'adopcion persona capaz',
    'adopcion de personas capaces', 'adopcion de mayor de edad', 'adoptar mayor de edad',
    'adoptar a un mayor', 'adoptar mayor', 'adoptar adulto', 'adopcion adulto', 'adopcion',
    'adopción', 'adoptar'
  ];
  return adopcionTriggers.some((t) => norm.includes(t));
}

/**
 * Detecta si el usuario adjunta o consulta sobre una resolución judicial de inadmisibilidad, subsanación o queja (Arts. 131-132 CPC)
 */
export function isResolucionSubsanacionRequest(query: string): boolean {
  const norm = normalizeText(query);
  const subsanacionTriggers = [
    'inadmisible', 'inadmisibilidad', 'subsanacion', 'subsanar', 'subsanar queja',
    'resolucion 1', 'resolucion n 1', 'resolucion n° 1', 'resolucion uno', 'resolucion numero uno',
    'art 131', 'articulo 131', 'art 132', 'articulo 132', 'firma de dicha recurrente',
    'firma de la recurrente', 'falta firmar', 'falta firma', 'regularizar firma',
    'ratificar firma', 'queja ingresada', 'auto de inadmisibilidad', 'subsanar escrito'
  ];
  return subsanacionTriggers.some((t) => norm.includes(t));
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

  const isAudit = isAuditRequest(userQuery);
  const isHearing = isOralHearingRequest(userQuery);
  const isCesacion = isCesacionPrisionPreventivaRequest(userQuery);
  const isAdopcion = (agentId === 'camila' || agentId === 'diego') && isAdopcionMayorEdadRequest(userQuery);
  const isSubsanacion = isResolucionSubsanacionRequest(userQuery);

  if (isSubsanacion) {
    sections.push('► DIRECTIVA CANÓNICA DE LITERALIDAD Y SUBSANACIÓN DE RESOLUCIONES JUDICIALES (CERO CONFUSIÓN):');
    sections.push('- LITERALIDAD TEXTUAL OBLIGATORIA DEL AUTO JUDICIAL:');
    sections.push('  * Cita textualmente entre comillas el considerando donde el Juez formula la observación procesal.');
    sections.push('  * ⛔ PROHIBICIÓN RADICAL DE ASUMIR POR DEFECTO QUE "FALTA FIRMA DE ABOGADO": Nunca inventes ni asumas que la omisión es del abogado cuando la resolución judicial observa a la parte.');
    sections.push('- DISTINCIÓN DOGMÁTICA INVIOLABLE (Art. 131° CPC vs Art. 132° CPC / Art. 290° LOPJ):');
    sections.push('  1. ARTÍCULO 131° DEL CÓDIGO PROCESAL CIVIL (Firma de la Parte o Recurrente):');
    sections.push('     - Rige la firma de la persona interesada, demandante, quejosa o recurrente (ejemplo: Hermelinda Albino Beteta).');
    sections.push('     - Si la resolución cita el Art. 131° CPC o señala que "la firma de dicha recurrente no figura", la omisión es EXCLUSIVAMENTE de la PARTE/RECURRENTE, NUNCA DEL ABOGADO.');
    sections.push('     - La subsanación consiste en que LA RECURRENTE estampe su firma gráfica o digital ratificando la queja o escrito. El escrito de subsanación debe expresar con claridad que la recurrente cumple con estampar su firma y ratificarse en el contenido del escrito primigenio.');
    sections.push('  2. ARTÍCULO 132° DEL CÓDIGO PROCESAL CIVIL Y ARTÍCULO 290° DE LA LOPJ (Firma y Colegiatura de Abogado):');
    sections.push('     - Rige la defensa técnica cautiva. Solo si la resolución cita expresamente el Art. 132° CPC, Art. 290° LOPJ o indica textualmente que el escrito carece de firma o sello de abogado, se subsanará la firma letrada.');
    sections.push('  3. TASAS Y ARANCELES (Art. 130° CPC y LOPJ):');
    sections.push('     - Solo si la resolución observa pago de aranceles judiciales o cédulas de notificación se redactará subsanación adjuntando tasa judicial.');
    sections.push('- IDENTIFICACIÓN NOMINAL DEL SUJETO OBSERVADO: Identifica con exactitud el nombre de la recurrente/parte observada, el número o código digital del escrito/queja y el plazo legal para subsanar (ej. 3 días hábiles bajo apercibimiento de rechazo).');
    sections.push('- REDACCIÓN INMEDIATA DEL ESCRITO DE SUBSANACIÓN (BLOQUE DOCUMENT):');
    sections.push('  * TÍTULO: SUBSANACION_INADMISIBILIDAD_FIRMA_RECURRENTE');
    sections.push('  * TIPO: ESCRITO JUDICIAL / CUADERNO PRINCIPAL O QUEJA');
    sections.push('  * SUMILLA: SUBSANA OBSERVACIÓN DE INADMISIBILIDAD CONFORME A LA RESOLUCIÓN N° 1 — RATIFICA FIRMA DE LA RECURRENTE (ARTÍCULO 131° CPC)');
    sections.push('  * SEÑOR JUEZ DEL [ÓRGANO JURISDICCIONAL]:');
    sections.push('  * Comparecencia de la recurrente [NOMBRE] con asesoría letrada');
    sections.push('  * I. PETITORIO: Subsanar la omisión formal de firma de la recurrente y conceder la admisión a trámite');
    sections.push('  * II. CUMPLIMIENTO DE SUBSANACIÓN: Declaración expresa de la recurrente suscribiendo y ratificando el escrito');
    sections.push('  * III. FUNDAMENTACIÓN JURÍDICA: Art. 131° del Código Procesal Civil y principio pro actione (acceso a la justicia)');
    sections.push('  * POR TANTO y OTROSÍES DIGO (Casilla SINOE, correo, teléfono y autorización de abogado bajo Art. 132° CPC).');
  }

  if (isAdopcion) {
    sections.push('► DIRECTIVA SUPREMA Y VINCULANTE — ADOPCIÓN DE PERSONAS MAYORES DE EDAD (PERSONAS CAPACES):');
    sections.push('- NATURALEZA Y VÍA PROCEDIMENTAL EXCLUSIVA: PROCESO NO CONTENCIOSO (Subcapítulo 4 de la Sección Sexta del Código Procesal Civil, Artículos 749° inciso 7, 750°, 751°, 781°, 782°, 783°, 784° y 785° CPC).');
    sections.push('- SUMILLA EXACTA: "SOLICITUD DE ADOPCIÓN DE PERSONA MAYOR DE EDAD CAPAZ". Jamás la titules como "Demanda Contenciosa".');
    sections.push('- CIERRE OBLIGATORIO: "POR LO EXPUESTO" (en procesos no contenciosos se utiliza "POR LO EXPUESTO", NUNCA "POR TANTO... declare fundada la demanda").');
    sections.push('- COMPETENCIA: Señor(a) Juez(a) del Juzgado Especializado de Familia (o Juzgado Civil/Mixto en su defecto) conforme al Art. 750° CPC.');
    sections.push('- INTERVENCIÓN FISCAL OBLIGATORIA (Art. 783° CPC): Notificación expresa a la Fiscalía Provincial de Familia para su dictamen y participación en audiencia.');
    sections.push('- REQUISITOS SUSTANTIVOS TAXATIVOS (CÓDIGO CIVIL):');
    sections.push('  * Art. 377° CC: Por la adopción el adoptado adquiere la calidad de hijo del adoptante y deja de pertenecer a su familia consanguínea.');
    sections.push('  * Art. 378° inc. 1 CC: Solvencia moral del adoptante.');
    sections.push('  * Art. 378° inc. 2 CC: La edad del adoptante debe ser por lo menos igual a la suma de la mayoridad y la del hijo por adoptar (diferencia mínima de 18 años entre adoptante y adoptado).');
    sections.push('  * Art. 378° inc. 3 CC: Asentimiento del cónyuge del adoptante si este fuere casado.');
    sections.push('  * Art. 378° inc. 4 CC: Asentimiento libre y expreso del adoptado mayor de edad capaz, compareciendo conjuntamente en la solicitud.');
    sections.push('  * Art. 381° CC: La adopción no admite condición ni plazo.');
    sections.push('  * Art. 385° CC: La adopción es irrevocable.');
    sections.push('- ANEXOS ESPECIALES OBLIGATORIOS (ARTÍCULO 782° DEL CÓDIGO PROCESAL CIVIL):');
    sections.push('  1. Copia certificada de la partida de nacimiento del adoptado y de matrimonio del adoptante (si es casado).');
    sections.push('  2. Copia certificada de la partida de defunción del cónyuge del adoptante (si fuera viudo).');
    sections.push('  3. Documento que acredite aprobación de cuentas de administración si el solicitante fue tutor del adoptado.');
    sections.push('  4. Copia certificada del inventario de bienes del adoptado y testimonio de garantía prestada por el tutor (en su caso).');
    sections.push('  5. Declaración jurada de no tener bienes el adoptado o relación de los que tenga.');
    sections.push('  6. Certificado médico de salud mental y física del adoptante y del adoptado.');
    sections.push('- VÍA NOTARIAL ALTERNATIVA (Art. 785° CPC): Conforme a la Ley N° 26662 (Arts. 21° al 23°), la adopción de personas mayores de edad capaces también puede tramitarse ante Notario Público si existe pleno acuerdo.');
    sections.push('- ⛔ REGLAS TERMINANTES ANTI-ALUCINACIÓN (CERO ERRORES):');
    sections.push('  1. PROHIBICIÓN RADICAL DEL CNA: Queda terminantemente PROHIBIDO citar el Código de los Niños y Adolescentes (Ley 27337) o el D. Leg. 1297 para la adopción de personas mayores de edad. No interviene la Dirección General de Adopciones (DGA/MIMP).');
    sections.push('  2. PROHIBICIÓN DE NORMAS CONTENCIOSAS: Queda terminantemente PROHIBIDO citar artículos de procesos de conocimiento (Art. 480 CPC), abreviados (Art. 486 CPC) o sumarísimos (Art. 546 CPC) como vía procedimental, o inventar artículos inexistentes del CPC.');
    sections.push('  3. Si el usuario solicita redactar el documento, redacta de inmediato la SOLICITUD completa dentro del bloque ```document cumpliendo con todos los requisitos del Art. 782° CPC.');
  }

  if (isDrafting) {
    sections.push('► REGLAS ESTRICTAS PARA LA REDACCIÓN DE ESTE ESCRITO LEGAL:');
    sections.push('- En la sección de "FUNDAMENTACIÓN JURÍDICA", debes citar los artículos de la ley CON SUS MODIFICATORIAS VIGENTES.');
    sections.push('- Debes incluir una subsección de "DOCTRINA JURISPRUDENCIAL VINCULANTE" citando el Pleno o Precedente exacto de tu especialidad.');
    sections.push('- Mantén rigor formal absoluto, redactado en el bloque ```document con sus correspondientes Otrosíes Digo procesales (Casilla SINOE, facultades Arts. 74°/80° CPC o personamiento NCPP).');
  }

  if (isAudit) {
    sections.push('► DIRECTIVA CANÓNICA PARA AUDITORÍA Y CONTROL DE VICIOS PROCESALES (MÁXIMA PROFUNDIDAD 10/10 SUPREMO):');
    sections.push('- EXIGENCIA DE DESARROLLO EXHAUSTIVO: Queda TERMINANTEMENTE PROHIBIDO responder con esquemas telegráficos o viñetas superficiales de una sola línea. Cada acápite debe desarrollarse en prosa jurídica rigurosa, articulada y fundamentada como socio litigante senior.');
    sections.push('- ESTRUCTURA OBLIGATORIA DE RESPUESTA EN 4 BLOQUES DE EXCELENCIA:');
    sections.push('  I. DIAGNÓSTICO DE VICIOS PROCESALES Y VULNERACIÓN CONSTITUCIONAL:');
    sections.push('     1. VICIO RADICAL DE NULIDAD ABSOLUTA INSANABLE: Desarrolla y califica la gravedad bajo el Art. 150° inc. d del NCPP por inobservancia del contenido esencial del Derecho de Defensa, Principio de Contradicción, Igualdad de Armas y Debido Proceso (Art. 139° inc. 14 de la Constitución).');
    sections.push('     2. NOTIFICACIÓN DEFECTUOSA E INCOMPLETA (Omisión de Anexos): Conforme al Art. 127° inc. 1 y Art. 271° inc. 1 del NCPP, el traslado del requerimiento de prisión preventiva exige la entrega física o digital completa de todos los elementos de convicción que lo sustentan; omitir declaraciones testimoniales deja a la defensa técnica en total indefensión material para contradecir el primer presupuesto de "Sospecha Fuerte" o Fumus Comissi Delicti.');
    sections.push('     3. EMPLAZAMIENTO IRREGULAR Y DEPOSITADO "BAJO PUERTA": Infracción de los Arts. 127° y 129° del NCPP al notificar sin garantías fehacientes de recepción y fuera de horario judicial de despacho.');
    sections.push('     4. VULNERACIÓN AL PLAZO RAZONABLE DE PREPARACIÓN DE LA DEFENSA: Aclara con contundencia dogmática que el plazo de 48 horas del Art. 271° inc. 1 del NCPP es un plazo legal máximo fijado para el juzgado, NO un plazo de asfixia ni de recorte del derecho de defensa.');
    sections.push('  II. CÓMPUTO DE PLAZO Y SUSTENTO JURISPRUDENCIAL VINCULANTE:');
    sections.push('     - Cómputo fatal: Declara con crudeza que de viernes 7:00 pm a lunes 8:30 am el plazo efectivo de preparación fue de exactamente 0 DÍAS HÁBILES (sábado y domingo juzgado y fiscalía cerrados).');
    sections.push('     - Artículos exactos del NCPP: Art. 150° inc. d (nulidad absoluta), Arts. 127° y 129° (formalidad de notificaciones), Art. 271° inc. 1 (traslado íntegro en prisión preventiva) y Art. IX del Título Preliminar del NCPP.');
    sections.push('     - Jurisprudencia rectora y precedentes vinculantes:');
    sections.push('       * Acuerdo Plenario N° 01-2019/CIJ-116 (Fundamentos Jurídicos 24 y 25: Exigencia de contradicción cualificada sobre el estándar de "Sospecha Fuerte").');
    sections.push('       * STC Exp. N° 01558-2015-PHC/TC y STC Exp. N° 02098-2010-PA/TC (el derecho de defensa comprende el tiempo y los medios razonables e indispensables para preparar la defensa técnica).');
    sections.push('  III. PLAN DE ACCIÓN Y LITIGACIÓN EN 3 PASOS:');
    sections.push('     - PASO 1 (HOY / VÍA SINOE): Ingresar Escrito de Nulidad Absoluta de Notificación y Emplazamiento con solicitud de Reprogramación de audiencia y entrega inmediata de anexos.');
    sections.push('     - PASO 2 (EN AUDIENCIA 8:30 AM): Al instalarse la audiencia y ANTES de que el Fiscal exponga su requerimiento, formular INCIDENCIA PREVIA DE INEFICACIA PROCESAL (Art. 150.d NCPP) solicitando suspensión y plazo prudencial de 24 a 48 horas.');
    sections.push('     - PASO 3 (TÁCTICA SUBSIDIARIA EN ESTRADOS): Si el Juez rechaza la suspensión, interponer de inmediato en el acto RECURSO DE REPOSICIÓN ORAL EN AUDIENCIA bajo el ARTÍCULO 415° DEL NCPP (OBLIGATORIO: citar siempre el Art. 415° NCPP para reposición in situ; NUNCA citar Art. 421° que corresponde a la apelación), consignando reserva expresa de Apelación y demanda de Hábeas Corpus.');
    sections.push('  IV. ADVERTENCIA BLINDAJE ANTITRAMPAS:');
    sections.push('     * Señala expresamente: ⚠️ ADVERTENCIA: NO procede Tutela de Derechos (Acuerdo Plenario N° 04-2010/CJ-116) porque el defecto proviene del Juzgado, no de la Fiscalía. El remedio es NULIDAD ABSOLUTA (Art. 150.d).');
    sections.push('  V. OBLIGACIÓN PROCESAL DE REDACCIÓN INMEDIATA DEL ESCRITO JUDICIAL (BLOQUE DOCUMENT):');
    sections.push('     - Tras concluir el análisis de los 4 bloques anteriores, redacta DE INMEDIATO el escrito judicial formal completo dentro del bloque ```document listo para ingresar al SINOE:');
    sections.push('       * TÍTULO: NULIDAD_ABSOLUTA_DE_NOTIFICACION_PRISION_PREVENTIVA');
    sections.push('       * TIPO: INCIDENTE DE NULIDAD / ESCRITO JUDICIAL');
    sections.push('       * CONTENIDO OBLIGATORIO Y PROFUNDIDAD EXIGIDA: Redacta íntegramente todo el escrito procesal formal en texto plano limpio (sin asteriscos), desarrollando cada sección con extensión profesional y fundamentos sólidos de hecho y de derecho:');
    sections.push('         - SUMILLA: DEDUCE NULIDAD ABSOLUTA DE NOTIFICACIÓN Y EMPLAZAMIENTO POR VULNERACIÓN DEL CONTENIDO ESENCIAL DEL DERECHO DE DEFENSA Y SOLICITA REPROGRAMACIÓN CON TRASLADO ÍNTEGRO DE ELEMENTOS DE CONVICCIÓN');
    sections.push('         - CUADERNO: CAUTELAR / PRISIÓN PREVENTIVA');
    sections.push('         - SEÑOR JUEZ DEL JUZGADO DE INVESTIGACIÓN PREPARATORIA DE [CIUDAD]:');
    sections.push('         - Comparecencia del abogado defensor y datos del imputado');
    sections.push('         - I. PETITORIO: Tres pretensiones numeradas (Pretensión Principal de nulidad absoluta bajo Art. 150° inc. d NCPP, Primera Pretensión Accesoria de entrega íntegra de testimoniales bajo Arts. 127° y 271° NCPP, y Segunda Pretensión Accesoria de reprogramación con plazo razonable no menor a 48 horas hábiles).');
    sections.push('         - II. FUNDAMENTOS DE HECHO: Relato circunstanciado y cronológico extenso del depósito bajo puerta a las 19:00 hrs del viernes, la ausencia de copias de declaraciones testimoniales que fundamentan la imputación, la fijación intempestiva para el lunes 08:30 am y la existencia real de 0 días hábiles de preparación.');
    sections.push('         - III. FUNDAMENTACIÓN JURÍDICA: Análisis dogmático profundo de la afectación constitucional (Art. 139° inc. 14), normas procesales del NCPP (Arts. IX T.P., 127°, 129°, 150°.d y 271°.1), doctrina vinculante de la STC Exp. N° 01558-2015-PHC/TC sobre el tiempo y medios razonables de defensa, y el Acuerdo Plenario N° 01-2019/CIJ-116 FJ 24-25 sobre contradicción de la sospecha fuerte.');
    sections.push('         - IV. MEDIOS PROBATORIOS: Cédula de notificación con constancia de recepción bajo puerta y cargo donde se constata la omisión de testimoniales.');
    sections.push('         - POR TANTO: Fórmula procesal formal de admisibilidad y fundabilidad.');
    sections.push('         - PRIMER OTROSÍ DIGO: Señalamiento de Casilla Electrónica SINOE, Casilla física, correo electrónico procesal y celular.');
    sections.push('         - SEGUNDO OTROSÍ DIGO: Delegación de facultades procesales.');
    sections.push('       * ⛔ PROHIBICIÓN ABSOLUTA: NUNCA hagas un esquema o borrador resumido de una línea por acápite. NUNCA escribas "[CUERPO DEL DOCUMENTO EN TEXTO PLANO — CERO MARKDOWN]". Redacta todo el escrito judicial formal completo y exhaustivo.');
  }

  if (isHearing) {
    sections.push('► DIRECTIVA CANÓNICA PARA PREPARACIÓN DE AUDIENCIAS Y EXAMEN DE SENTENCIAS (ESTÁNDAR SUPREMO):');
    sections.push('- PROHIBIDO CONFUNDIR HIPÓTESIS DEFENSIVA CON CONCLUSIÓN PROBADA: No afirmes que la sentencia tiene "motivación aparente" o "indicios débiles" sin demostrarlo mediante el quiebre puntual del enlace inferencial del Juez.');
    sections.push('- MATRIZ OBLIGATORIA DE CONTRASTE PÁRRAFO POR PÁRRAFO:');
    sections.push('  1. Qué afirma el Juez: Cita expresa del fundamento y página de la sentencia apelada.');
    sections.push('  2. Qué prueba de cargo utiliza: Correos, cotizaciones, testimonios, audios, peritajes.');
    sections.push('  3. Qué inferencia extrae: El razonamiento judicial que conecta el hecho con la condena.');
    sections.push('  4. Qué objeta la apelación: El agravio concreto y formalmente planteado.');
    sections.push('  5. Quid iuris / Contradicción no resuelta: Explicaciones alternativas que el Colegiado no descartó.');
    sections.push('- DELITOS DE CORRUPCIÓN (COLUSIÓN ART. 384° CP): En colusión simple (primer párrafo) rige el peligro abstracto (concertación ilegal idónea); NUNCA alegues que "no hay delito por falta de perjuicio económico o lucro", pues la ley no lo exige. En colusión agravada (segundo párrafo), exige perjuicio patrimonial real peritado (Casación 661-2016/Piura).');
    sections.push('- CERO ALUCINACIÓN EN CITAS NORMATIVAS: La apelación de sentencia es Art. 416° inc. 1.a) y Arts. 421°-426° NCPP (Pretensión de nulidad: Arts. 150° y 425°.3.b NCPP; NUNCA cites Art. 427° que es CASACIÓN ante la Corte Suprema). El Amparo es Art. 200° inc. 2 de la Constitución (NUNCA cites Art. 200° inc. 4 que es Acción Popular). La Queja solo procede ante denegatoria formal del recurso.');
    sections.push('- CONTROL ESTRICTO DE RESTRICCIONES NEGATIVAS: Si el usuario pidió excluir a un testigo o argumento (ej. la secretaria), queda TERMINANTEMENTE PROHIBIDO mencionarlo o reincorporarlo.');
    sections.push('- EVALUACIÓN CRÍTICA DE LA APELACIÓN (RED TEAM): Señala qué agravios de la defensa son genéricos y anticipa la objeción más hostil del Fiscal o de la Sala con su respuesta técnica.');
  }

  if (isCesacion) {
    sections.push('► DIRECTIVA CANÓNICA PARA CESACIÓN DE PRISIÓN PREVENTIVA (ART. 283° NCPP, D. LEG. 1585 Y CORTE SUPREMA):');
    sections.push('- EXIGENCIA DOGMÁTICA VINCULANTE: Al amparo del Art. 283° del Código Procesal Penal (modificado por D. Leg. 1585), Casación 626-2013 Moquegua, Casación 391-2011 Piura y Acuerdo Plenario 01-2019/CIJ-116, la cesación exige que NUEVOS ELEMENTOS DE CONVICCIÓN sobrevenidos o no valorados desvanezcan los motivos iniciales.');
    sections.push('- DOBLE IMPACTO PROBATORIO OBLIGATORIO:');
    sections.push('  1. Fumus Comissi Delicti (Sospecha Grave): Demostrar cómo las nuevas diligencias (declaraciones, pericias o documentales) debilitan la imputación inicial (AP 01-2019 FJ 24-27).');
    sections.push('  2. Periculum Libertatis (Peligro Procesal): Acreditar arraigos de calidad (domiciliario, familiar, laboral) y descartar peligro de fuga u obstaculización (AP 01-2019 FJ 35-48).');
    sections.push('  3. Principio de Proporcionalidad: Sustitución por Comparecencia con Restricciones (Art. 288° NCPP), Vigilancia Electrónica Personal (Art. 268-A NCPP) o Caución Económica.');
    sections.push('- FIDELIDAD ESTRICTA AL EXPEDIENTE ADJUNTO: Cita con fidelidad los hechos, delito y fojas del expediente real. PROHIBIDO INVENTAR PRUEBAS FALSAS. Si falta algún comprobante de arraigo por remitir, señala con transparencia: "[Adjuntar aquí: Constancia de arraigo laboral / pericia técnica correspondiente que acredite este extremo]".');
    sections.push('- SI EL ABOGADO CONSULTA DE FORMA GENERAL O PREVIA: Responde con claridad meridiana confirmando que el sistema lee el expediente completo, detecta la imputación y los cargos, y redacta el escrito formal de cesación listo para presentar ante el Juzgado de Investigación Preparatoria (SINOE), indicándole qué nuevos elementos puede aportar.');
    sections.push('- SI PIDE EL ESCRITO O ADJUNTA EXPEDIENTE: Redacta de inmediato el escrito judicial formal completo dentro del bloque ```document listo para presentar al Juez de Investigación Preparatoria:');
    sections.push('  * TÍTULO: SOLICITUD_CESACION_PRISION_PREVENTIVA');
    sections.push('  * TIPO: ESCRITO JUDICIAL / CUADERNO DE CESACIÓN');
    sections.push('  * SUMILLA: SOLICITO CESACIÓN DE PRISIÓN PREVENTIVA POR NUEVOS ELEMENTOS DE CONVICCIÓN Y SUSTITUCIÓN POR MANDATO DE COMPARECENCIA CON RESTRICCIONES (O VIGILANCIA ELECTRÓNICA PERSONAL)');
    sections.push('  * CUADERNO: CESACIÓN DE PRISIÓN PREVENTIVA');
    sections.push('  * SEÑOR JUEZ DEL JUZGADO DE INVESTIGACIÓN PREPARATORIA DE [CIUDAD]:');
    sections.push('  * Comparecencia del imputado y abogado patrocinante con datos procesales');
    sections.push('  * I. PETITORIO: Solicitud expresa de cesación bajo el Art. 283° NCPP y sustitución por comparecencia restrictiva o vigilancia electrónica');
    sections.push('  * II. ANTECEDENTES PROCESALES: Resolución que dictó la prisión preventiva, fecha y plazo impuesto');
    sections.push('  * III. NUEVOS ELEMENTOS DE CONVICCIÓN (Cláusula Rebus Sic Stantibus - Casación 391-2011 Piura y Casación 626-2013 Moquegua): Desarrollo pormenorizado respecto a la sospecha grave y los arraigos sobrevenidos');
    sections.push('  * IV. MEDIDA SUSTITUTIVA PROPUESTA: Detalle de reglas de conducta del Art. 288° NCPP o vigilancia electrónica');
    sections.push('  * V. FUNDAMENTACIÓN JURÍDICA: Art. 139° inc. 14 de la Constitución, Arts. IX T.P., 253°, 283° y 288° NCPP, D. Leg. 1585, Casaciones 626-2013 Moquegua y 391-2011 Piura, y Acuerdo Plenario 01-2019/CIJ-116');
    sections.push('  * VI. MEDIOS PROBATORIOS');
    sections.push('  * POR TANTO y OTROSÍES DIGO (Casilla SINOE, correo, teléfono y facultades procesales).');
  }

  sections.push('════════════════════════════════════════════════════════════════');

  return sections.join('\n');
}
