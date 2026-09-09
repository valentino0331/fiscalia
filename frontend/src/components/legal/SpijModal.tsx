import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Scale,
  BookOpen,
  Check,
  Copy,
  Search,
  ShieldCheck,
  FileText,
  Gavel,
  Sparkles,
  UserCheck,
} from 'lucide-react'

interface SpijModalProps {
  isOpen: boolean
  onClose: () => void
  currentAgentId?: string
  onInsertPrompt?: (text: string) => void
}

interface Plenary {
  code: string
  specialistId: string
  plenum: string
  title: string
  category: string
  keyPoints: string[]
  bindingGrounds: string
  practicalUse: string
  promptTemplate: string
}

interface Reform {
  lawCode: string
  specialistId: string
  affectedNorm: string
  date: string
  badge: string
  articles: string
  summary: string
  promptTemplate: string
}

const SPECIALISTS = [
  { id: 'all', name: 'Todos los Especialistas', role: 'General' },
  { id: 'sebastian', name: 'Sebastián', role: 'Derecho Penal', badge: 'PENAL' },
  { id: 'valentina', name: 'Valentina', role: 'Derecho Laboral', badge: 'LABORAL' },
  { id: 'diego', name: 'Diego', role: 'Derecho Civil e Inm.', badge: 'CIVIL' },
  { id: 'camila', name: 'Camila', role: 'Derecho de Familia', badge: 'FAMILIA' },
  { id: 'marco', name: 'Marco', role: 'Administrativo y OECE', badge: 'ADMIN' },
  { id: 'fernanda', name: 'Fernanda', role: 'Derecho Tributario', badge: 'TRIBUTARIO' },
  { id: 'adriana', name: 'Adriana', role: 'Corporativo y M&A', badge: 'CORPORATIVO' },
  { id: 'rodrigo', name: 'Rodrigo', role: 'Minero y Ambiental', badge: 'MINERO' },
]

const PLENARIES: Plenary[] = [
  // ── SEBASTIÁN: PENAL & PROCESAL PENAL ──
  {
    code: 'Acuerdo Plenario N° 01-2019/CIJ-116',
    specialistId: 'sebastian',
    plenum: 'XI Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Prisión preventiva: sospecha grave, peligro de fuga y arraigos',
    category: 'Procesal Penal',
    keyPoints: [
      'Exige estándar de "sospecha fuerte/grave", superior a la sospecha reveladora.',
      'El peligro de fuga no se presume por la gravedad de la pena; exige análisis de arraigos de calidad (domiciliario, familiar y laboral).',
      'Ponderación de proporcionalidad y principio de excepcionalidad.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 24-27 (estándar probatorio) y FJ 35-48 (peligro procesal).',
    practicalUse: 'Oposición o apelación a prisión preventiva, cesación de prisión preventiva y comparecencia.',
    promptTemplate: 'Redacta un escrito de oposición a prisión preventiva aplicando los fundamentos vinculantes del Acuerdo Plenario N° 01-2019/CIJ-116 (FJ 24-27 y 35-48) y el D. Leg. 1585 para mi patrocinado.',
  },
  {
    code: 'Acuerdo Plenario N° 02-2005/CJ-116',
    specialistId: 'sebastian',
    plenum: 'I Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Garantías de certeza de la declaración de la víctima y coimputados',
    category: 'Procesal Penal / Probatorio',
    keyPoints: [
      'Ausencia de incredibilidad subjetiva (sin relaciones de venganza o enemistad).',
      'Verosimilitud objetiva con corroboraciones periféricas de cargo.',
      'Persistencia en la incriminación prolongada y sin contradicciones sustanciales.',
    ],
    bindingGrounds: 'Fundamento Jurídico 10 (las 3 reglas de eficacia del testimonio único).',
    practicalUse: 'Alegatos de clausura, apelación de sentencia condenatoria o sobreseimiento.',
    promptTemplate: 'Analiza la declaración del agraviado bajo el Acuerdo Plenario N° 02-2005/CJ-116 (FJ 10): demuestra la falta de corroboración objetiva e incredibilidad subjetiva para pedir sobreseimiento.',
  },
  {
    code: 'Acuerdo Plenario N° 04-2005/CJ-116',
    specialistId: 'sebastian',
    plenum: 'I Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Tentativa y consumación en los delitos de robo y hurto',
    category: 'Derecho Penal Parte Especial',
    keyPoints: [
      'Adopta la teoría de la disponibilidad potencial (ablatio) sobre el bien sustraído.',
      'Si hay persecución ininterrumpida o se recupera el bien en flagrancia inmediata, el delito queda en grado de TENTATIVA (Art. 16 CP).',
      'Permite la atenuación facultativa de la pena por debajo del mínimo legal.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 7 al 9 (momento consumativo y disponibilidad del bien).',
    practicalUse: 'Defensa técnica y alegatos para desvirtuar la imputación fiscal de robo consumado a tentativa.',
    promptTemplate: 'Prepara alegatos de defensa penal fundamentados en el Acuerdo Plenario N° 04-2005/CJ-116 para recalificar el delito de robo agravado consumado a tentativa por persecución ininterrumpida.',
  },
  {
    code: 'Acuerdo Plenario N° 05-2023/CIJ-112',
    specialistId: 'sebastian',
    plenum: 'XII Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Inaplicabilidad vía control difuso de la Ley 31751 (Ley Soto) sobre prescripción',
    category: 'Derecho Penal / Prescripción',
    keyPoints: [
      'Declara inconstitucional e inaplica el límite de 1 año para la suspensión de la prescripción fijado por la Ley 31751.',
      'Rige el criterio constitucional tradicional: plazo extraordinario de prescripción (pena máxima abstracta + su mitad).',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 38 al 47 (control difuso preferente de la Constitución).',
    practicalUse: 'Deducción y contestación de Excepciones de Prescripción de la Acción Penal y control de plazos.',
    promptTemplate: 'Evalúa la prescripción de la acción penal calculando el plazo ordinario y extraordinario conforme a la doctrina del Acuerdo Plenario N° 05-2023/CIJ-112 y los Arts. 80 y 83 del Código Penal.',
  },
  {
    code: 'Acuerdo Plenario N° 02-2023/CIJ-112',
    specialistId: 'sebastian',
    plenum: 'XII Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Flagrancia delictiva, detención policial y proceso inmediato reformado',
    category: 'Procesal Penal',
    keyPoints: [
      'Estándar estricto de inmediatez personal y temporal para validar la flagrancia.',
      'Control riguroso de legalidad del registro personal e incautación policial.',
      'Presupuestos materiales para admitir o rechazar la incoación de Proceso Inmediato.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 18 al 26 (flagrancia y legalidad de la detención).',
    practicalUse: 'Audiencia de incoación de proceso inmediato, nulidad de detención y tutelas de derechos.',
    promptTemplate: 'Redacta una oposición a la incoación de Proceso Inmediato sustentada en el Acuerdo Plenario N° 02-2023/CIJ-112 por inexistencia de flagrancia estricta y necesidad de actos de investigación.',
  },
  {
    code: 'Acuerdo Plenario N° 04-2010/CJ-116',
    specialistId: 'sebastian',
    plenum: 'VI Pleno Jurisdiccional Penal - Corte Suprema',
    title: 'Audiencia de Tutela de Derechos (Art. 71 del Código Procesal Penal)',
    category: 'Procesal Penal / Garantías',
    keyPoints: [
      'Mecanismo residual de protección judicial frente a vulneraciones a los derechos del Art. 71 NCPP.',
      'Control de imputación necesaria, derecho a la defensa y exclusión de actos de investigación ilícitos.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 11 al 17 (supuestos habilitantes ante el Juez de Investigación Preparatoria).',
    practicalUse: 'Solicitud de audiencia de tutela de derechos ante vulneración del derecho a la defensa o imputación imprecisa.',
    promptTemplate: 'Elabora una solicitud de Audiencia de Tutela de Derechos al amparo del Art. 71.4 del NCPP y el Acuerdo Plenario N° 04-2010/CJ-116 por afectación al principio de imputación concreta.',
  },

  // ── VALENTINA: LABORAL ──
  {
    code: 'II Pleno Jurisdiccional Supremo Laboral',
    specialistId: 'valentina',
    plenum: 'Salas de Derecho Constitucional y Social - Corte Suprema',
    title: 'Despido incausado y fraudulento: reposición e indemnización tasada',
    category: 'Derecho Laboral',
    keyPoints: [
      'Reconoce la procedencia de la reposición laboral en el régimen privado (DL 728) ante despido incausado o fraudulento.',
      'El trabajador puede optar alternativamente por la indemnización del Art. 38 LPCL (1.5 sueldos por año laborado, tope 12 sueldos).',
      'Compatibilidad de reclamo acumulado de lucro cesante y daño moral acreditado.',
    ],
    bindingGrounds: 'Tema 1 y 2 del II Pleno Laboral (protección adecuada contra el despido arbitrario).',
    practicalUse: 'Demandas laborales de reposición o cobro de indemnización por despido arbitrario ante el Juzgado Laboral.',
    promptTemplate: 'Redacta una demanda laboral de reposición por despido incausado e indemnización conforme al II Pleno Jurisdiccional Supremo Laboral y el D.S. 003-97-TR (LPCL).',
  },
  {
    code: 'Precedente Vinculante TC - Caso Huatuco Huatuco (Exp. 05057-2013-PA/TC)',
    specialistId: 'valentina',
    plenum: 'Tribunal Constitucional del Perú',
    title: 'Límites a la reposición en el sector público: exigencia de concurso público',
    category: 'Laboral Público',
    keyPoints: [
      'En entidades del Estado no procede reposición indeterminada sin concurso público de méritos para plaza presupuestada.',
      'Ante desnaturalización de contratos en el Estado, la única pretensión viable es la indemnización por despido arbitrario.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 18 al 22 (precedente vinculante de observancia obligatoria).',
    practicalUse: 'Estrategia de demanda contra ministerios, municipalidades o entidades estatales: peticionar indemnización.',
    promptTemplate: 'Formula la pretensión laboral principal y subordinada en una demanda contra el Estado aplicando el Precedente Vinculante Caso Huatuco del Tribunal Constitucional.',
  },

  // ── DIEGO: CIVIL E INMOBILIARIO ──
  {
    code: 'IV Pleno Casatorio Civil (Casación 2195-2011 Ucayali)',
    specialistId: 'diego',
    plenum: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Desalojo por ocupación precaria y títulos fenecidos (Art. 911 Código Civil)',
    category: 'Derecho Civil / Inmobiliario',
    keyPoints: [
      'Define la precariedad: posesión sin título o con título fenecido.',
      'Vencido el plazo del arrendamiento y cursada la carta notarial de restitución, el arrendatario deviene en ocupante precario.',
      'Alegar usucapión no frena el proceso de desalojo.',
    ],
    bindingGrounds: 'Reglas Vinculantes 1 a 7 (supuestos de posesión precaria y legitimación activa).',
    practicalUse: 'Demanda de desalojo por ocupante precario ante los Juzgados Civiles o Mixtos.',
    promptTemplate: 'Redacta una demanda de desalojo por ocupante precario conforme a los lineamientos vinculantes del IV Pleno Casatorio Civil (Casación 2195-2011 Ucayali) y el Art. 911 del Código Civil.',
  },
  {
    code: 'IX Pleno Casatorio Civil (Casación 4442-2015 Moquegua)',
    specialistId: 'diego',
    plenum: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Nulidad manifiesta de acto jurídico en otorgamiento de escritura pública',
    category: 'Derecho Civil / Contratos',
    keyPoints: [
      'El juez puede declarar de oficio la nulidad de un contrato de compraventa si la causal es evidente, previa contradicción.',
    ],
    bindingGrounds: 'Reglas vinculantes 1 a 5 (facultad de control judicial de validez del contrato).',
    practicalUse: 'Contestación u oposición a demandas de otorgamiento de escritura pública de contratos simulados.',
    promptTemplate: 'Prepara la contestación de demanda de otorgamiento de escritura deduciendo la nulidad manifiesta del acto jurídico bajo el IX Pleno Casatorio Civil.',
  },

  // ── CAMILA: FAMILIA ──
  {
    code: 'Pleno Jurisdiccional Nacional de Familia 2022',
    specialistId: 'camila',
    plenum: 'Jueces Especializados de Familia - Poder Judicial',
    title: 'Tenencia compartida obligatoria y cuantificación proporcional de alimentos',
    category: 'Derecho de Familia',
    keyPoints: [
      'La tenencia compartida constituye la regla legal preferente en virtud de la Ley 31590.',
      'La pensión de alimentos en tenencia compartida se pondera según el tiempo efectivo que cada progenitor asume.',
    ],
    bindingGrounds: 'Conclusiones plenarias de observancia obligatoria sobre el principio de coparentalidad.',
    practicalUse: 'Demanda de tenencia compartida, régimen de visitas y balance proporcional de pensión alimenticia.',
    promptTemplate: 'Redacta una demanda de tenencia compartida y régimen de alimentos recíproco fundamentada en la Ley N° 31590 y las conclusiones del Pleno Nacional de Familia.',
  },

  // ── MARCO: ADMINISTRATIVO & CONTRATACIONES ──
  {
    code: 'Precedentes del Tribunal de Contrataciones Públicas (TCP / OECE)',
    specialistId: 'marco',
    plenum: 'Tribunal de Contrataciones Públicas - Organismo de Contrataciones Eficientes',
    title: 'Impugnación de buena pro, plazos fatales y Junta de Disputas (JPRD)',
    category: 'Contrataciones del Estado',
    keyPoints: [
      'Prevalencia de la verdad material y eficacia sobre formalismos intrascendentes.',
      'Plazo perentorio de 8 días hábiles para apelar adjudicaciones ante el TCP.',
      'Obligatoriedad de la Junta de Prevención y Resolución de Disputas (JPRD) en obras públicas bajo Ley 32069.',
    ],
    bindingGrounds: 'Acuerdos de Sala Plena del TCP sobre admisibilidad de recursos y ejecución de garantías.',
    practicalUse: 'Recursos de apelación contra descalificaciones o adjudicaciones ante el TCP del OECE.',
    promptTemplate: 'Redacta un recurso de apelación de adjudicación de buena pro ante el Tribunal de Contrataciones Públicas (TCP) conforme a la Ley N° 32069 y el D.S. 001-2026-EF.',
  },

  // ── FERNANDA: TRIBUTARIO ──
  {
    code: 'Resolución RTF N° 01807-1-2023 (Observancia Obligatoria)',
    specialistId: 'fernanda',
    plenum: 'Tribunal Fiscal del Perú - Ministerio de Economía y Finanzas',
    title: 'Fehaciencia probatoria, gastos deducibles y operaciones no reales',
    category: 'Derecho Tributario',
    keyPoints: [
      'La factura y el medio de pago bancario no bastan por sí solos: se exige prueba documental de la efectiva prestación del servicio.',
      'Criterio de causalidad y fehaciencia conforme al Art. 37 de la Ley del Impuesto a la Renta.',
    ],
    bindingGrounds: 'Criterio vinculante publicado en El Peruano (Art. 154 del Código Tributario).',
    practicalUse: 'Descargos ante requerimientos de fiscalización SUNAT y recursos de reclamación.',
    promptTemplate: 'Elabora un escrito de descargo ante un requerimiento de fiscalización SUNAT por reparo de fehaciencia de gastos aplicando la RTF N° 01807-1-2023.',
  },

  // ── ADRIANA: CORPORATIVO ──
  {
    code: 'Lineamientos SMV y Guía Oficial MINJUSDH Ley 30424',
    specialistId: 'adriana',
    plenum: 'Superintendencia del Mercado de Valores & Ministerio de Justicia',
    title: 'Modelos de Prevención de Delitos Corporativos y Eximente de Responsabilidad',
    category: 'Corporativo & Compliance',
    keyPoints: [
      'Exención de responsabilidad administrativa y penal para la empresa si implementó un modelo de prevención idóneo previo al delito.',
      'Obligación de debida diligencia en procesos de fusiones y adquisiciones (M&A).',
    ],
    bindingGrounds: 'D.S. N° 002-2019-JUS (Reglamento de la Ley 30424) y estándares de buen gobierno corporativo.',
    practicalUse: 'Diseño de programas de compliance penal, auditoría corporativa y pactos de accionistas.',
    promptTemplate: 'Diseña una cláusula de indemnidad y debida diligencia de compliance penal bajo la Ley N° 30424 para un contrato de compraventa de acciones (M&A).',
  },

  // ── RODRIGO: MINERO & AMBIENTAL ──
  {
    code: 'Precedentes del Tribunal de Fiscalización Ambiental (TFA - OEFA)',
    specialistId: 'rodrigo',
    plenum: 'Tribunal de Fiscalización Ambiental - OEFA',
    title: 'Tipificación de infracciones mineras ambientales y atenuantes en PAS',
    category: 'Derecho Minero y Ambiental',
    keyPoints: [
      'Proporcionalidad en medidas correctivas y atenuación del 50% de multa por subsanación previa al PAS.',
      'Vigencia de concesiones mineras y acreditación de producción mínima ante INGEMMET.',
    ],
    bindingGrounds: 'Resoluciones vinculantes de Sala Plena del TFA sobre daño ambiental potencial y real.',
    practicalUse: 'Descargos y recursos de reconsideración/apelación en Procedimientos Administrativos Sancionadores del OEFA.',
    promptTemplate: 'Redacta un escrito de descargo en un PAS ambiental ante el OEFA solicitando la atenuante del 50% por subsanación voluntaria conforme al precedente del TFA.',
  },
]

const REFORMS: Reform[] = [
  // ── SEBASTIÁN (PENAL) ──
  {
    lawCode: 'Decreto Legislativo N° 1585',
    specialistId: 'sebastian',
    affectedNorm: 'Código Procesal Penal (DL 957) & Código Penal (DL 635)',
    date: 'Noviembre 2023 - Vigente 2026',
    badge: 'PRISIÓN PREVENTIVA',
    articles: 'Arts. 268, 268-A, 283 NCPP / Arts. 52, 57 CP',
    summary:
      '1. Prisión preventiva exige pena superior a 5 años (antes 4 años).\n' +
      '2. Art. 268-A NCPP: Prioridad OBLIGATORIA de vigilancia electrónica si la pena es hasta 7 años.\n' +
      '3. Art. 283 NCPP: Revisión de oficio semestral obligatoria por el juez.\n' +
      '4. Art. 57 CP: Suspensión de pena privativa de la libertad ampliada hasta 5 años.',
    promptTemplate: 'Redacta un recurso de apelación contra el auto de prisión preventiva invocando la reforma del D. Leg. 1585 (Art. 268 modificado y deber de aplicar vigilancia electrónica Art. 268-A).',
  },
  {
    lawCode: 'Ley N° 32130',
    specialistId: 'sebastian',
    affectedNorm: 'Código Procesal Penal — Investigación Preliminar',
    date: 'Octubre 2024 - Vigente 2026',
    badge: 'PNP & FISCALÍA',
    articles: 'Arts. 60, 65, 67, 68, 322, 331, 332 NCPP',
    summary:
      'Restituye a la Policía Nacional del Perú (PNP) la facultad de investigación preliminar del delito bajo la conducción jurídica obligatoria del Ministerio Público.',
    promptTemplate: 'Analiza la validez de las diligencias policiales y el informe preliminar bajo la Ley N° 32130 y los límites de la conducción jurídica del Fiscal en diligencias preliminares.',
  },
  {
    lawCode: 'Leyes N° 32108 y 32138',
    specialistId: 'sebastian',
    affectedNorm: 'Ley contra el Crimen Organizado (Ley 30077) & Art. 317 CP',
    date: 'Agosto/Octubre 2024 - Vigente 2026',
    badge: 'CRIMEN ORGANIZADO',
    articles: 'Art. 317 CP, Art. 2 Ley 30077',
    summary:
      'Redefine los requisitos para imputar Organización Criminal (delitos con pena superior a 5 años y fin de beneficio económico). Exige presencia obligatoria de abogado defensor en allanamientos.',
    promptTemplate: 'Cuestiona la imputación de organización criminal formulando excepción de improcedencia de acción bajo los nuevos presupuestos típicos de las Leyes N° 32108 y 32138.',
  },
  {
    lawCode: 'Ley N° 32735',
    specialistId: 'sebastian',
    affectedNorm: 'Código Penal & NCPP (Extorsión y Coerción)',
    date: 'Julio 2026 - Vigente 2026',
    badge: 'EXTORSIÓN Y SICARIATO',
    articles: 'Art. 200 CP, Art. 272 NCPP',
    summary:
      'Tipificación agravada de extorsión digital, préstamos extorsivos ("gota a gota"), cobro de cupos y ampliación de plazos para bandas delictivas.',
    promptTemplate: 'Prepara una denuncia penal detallada por delito de extorsión agravada conforme a las modificatorias de la Ley N° 32735 y el Art. 200 del Código Penal.',
  },

  // ── VALENTINA (LABORAL) ──
  {
    lawCode: 'Ley N° 32155',
    specialistId: 'valentina',
    affectedNorm: 'Nueva Ley Procesal del Trabajo (Ley 29497)',
    date: 'Noviembre 2024 - Vigente 2026',
    badge: 'COMPETENCIA LABORAL',
    articles: 'Competencia JPLL hasta 70 URP (S/ 38,500)',
    summary:
      'Reforma las competencias judiciales laborales: los Juzgados de Paz Letrados Laborales conocen pretensiones hasta 70 URP e indemnizaciones por daños hasta 60 URP.',
    promptTemplate: 'Determina la vía procesal y el juzgado competente para demandar indemnización laboral bajo las cuantías vigentes de la Ley N° 32155.',
  },
  {
    lawCode: 'D.S. N° 006-2024-TR',
    specialistId: 'valentina',
    affectedNorm: 'Remuneración Mínima Vital',
    date: 'Enero 2025 - Vigente 2026',
    badge: 'SUELDO MÍNIMO',
    articles: 'RMV S/ 1,130 / Asignación Familiar S/ 113',
    summary: 'Establece la RMV en S/ 1,130 mensuales y la Asignación Familiar legal en el 10% (S/ 113.00).',
    promptTemplate: 'Calcula la liquidación de beneficios sociales aplicando la RMV vigente de S/ 1,130 y la asignación familiar conforme al D.S. 006-2024-TR.',
  },

  // ── DIEGO (CIVIL) ──
  {
    lawCode: 'Ley N° 30933 y D.S. 013-2019-JUS',
    specialistId: 'diego',
    affectedNorm: 'Desalojo Notarial con Ejecución Judicial',
    date: 'Vigente 2026',
    badge: 'DESALOJO EXPRESS',
    articles: 'Arts. 4, 5, 6, 7 Ley 30933 / Art. 594 CPC',
    summary:
      'Procedimiento sumarísimo para desalojar inquilinos por falta de pago o vencimiento en menos de 30 días, requiriendo contrato notarial con cláusula de allanamiento.',
    promptTemplate: 'Redacta un contrato de arrendamiento blindado con cláusula de allanamiento a futuro (Art. 594 CPC) y sometimiento expreso a la Ley N° 30933 de Desalojo Notarial.',
  },
  {
    lawCode: 'Ley N° 32430',
    specialistId: 'diego',
    affectedNorm: 'Ley de Arrendamiento Justo (TUO Ley Impuesto Renta)',
    date: '1 de Enero de 2026 - Vigente',
    badge: 'ARRENDAMIENTO JUSTO',
    articles: 'Art. 57 Inciso b) LIR',
    summary:
      'Establece que las rentas de primera categoría tributan bajo el criterio de lo percibido (solo sobre mensualidades efectivamente cobradas, no sobre las devengadas e impagas).',
    promptTemplate: 'Incorpora la cláusula tributaria de la Ley N° 32430 (Ley de Arrendamiento Justo) en un contrato de alquiler de vivienda.',
  },

  // ── CAMILA (FAMILIA) ──
  {
    lawCode: 'Ley N° 31590',
    specialistId: 'camila',
    affectedNorm: 'Código de los Niños y Adolescentes (Ley 27337)',
    date: 'Vigente 2026',
    badge: 'TENENCIA COMPARTIDA',
    articles: 'Arts. 81, 82, 83, 84 CNA',
    summary:
      'Establece la Tenencia Compartida como regla general obligatoria para ambos progenitores, velando por el interés superior del niño.',
    promptTemplate: 'Redacta una demanda de tenencia compartida bajo el amparo de la Ley N° 31590 acreditando la aptitud parental del padre y arraigo familiar.',
  },
  {
    lawCode: 'Ley N° 30364 y D.S. 009-2019-MIMP',
    specialistId: 'camila',
    affectedNorm: 'Prevención y Sanción de Violencia Familiar',
    date: 'Vigente 2026',
    badge: 'VIOLENCIA FAMILIAR',
    articles: 'Medidas de Protección en 24-48h',
    summary:
      'Procedimiento especial urgente para dictar medidas de protección inmediatas (retiro del agresor, impedimento de acercamiento) sin audiencia previa en riesgo severo.',
    promptTemplate: 'Solicita medidas de protección urgentes de retiro del agresor y prohibición de comunicación al amparo de la Ley N° 30364.',
  },

  // ── MARCO (ADMINISTRATIVO) ──
  {
    lawCode: 'D.S. N° 006-2026-JUS (TUO LPAG)',
    specialistId: 'marco',
    affectedNorm: 'Ley del Procedimiento Administrativo General (Ley 27444)',
    date: '30 de Abril de 2026 - Vigente',
    badge: 'ADMINISTRATIVO',
    articles: 'Arts. 209-228 LPAG (Derogó DS 004-2019-JUS)',
    summary:
      'Nuevo Texto Único Ordenado que deroga formalmente al D.S. 004-2019-JUS. Prohibido citar el D.S. 004-2019-JUS en escritos administrativos.',
    promptTemplate: 'Redacta un recurso de apelación administrativa bajo el nuevo TUO de la Ley 27444 aprobado por Decreto Supremo N° 006-2026-JUS.',
  },
  {
    lawCode: 'Ley N° 32069 y D.S. 001-2026-EF',
    specialistId: 'marco',
    affectedNorm: 'Ley General de Contrataciones Públicas',
    date: 'Abril 2025 - Vigente 2026',
    badge: 'CONTRATACIONES',
    articles: 'OECE / Tribunal de Contrataciones Públicas (TCP)',
    summary:
      'Deroga totalmente la Ley 30225 y extingue al OSCE. Rige el Organismo de Contrataciones Eficientes (OECE) y el Tribunal de Contrataciones Públicas.',
    promptTemplate: 'Elabora un recurso de apelación de adjudicación de buena pro ante el Tribunal de Contrataciones Públicas (TCP) conforme a la Ley N° 32069.',
  },

  // ── FERNANDA (TRIBUTARIO) ──
  {
    lawCode: 'Decreto Legislativo N° 1529',
    specialistId: 'fernanda',
    affectedNorm: 'Ley de Bancarización (Ley 28194)',
    date: 'Vigente 2026',
    badge: 'BANCARIZACIÓN',
    articles: 'Obligatoriedad desde S/ 2,000 o US$ 500',
    summary:
      'Exige uso obligatorio de medios de pago bancarios para operaciones desde S/ 2,000 o US$ 500; su inobservancia desconoce costo, gasto y crédito fiscal.',
    promptTemplate: 'Sustenta la deducción tributaria de facturas acreditando los medios de pago bancarios exigidos por el D. Leg. 1529 ante fiscalización SUNAT.',
  },

  // ── ADRIANA (CORPORATIVO) ──
  {
    lawCode: 'Ley N° 30424 y D.S. 002-2019-JUS',
    specialistId: 'adriana',
    affectedNorm: 'Responsabilidad Penal de Personas Jurídicas',
    date: 'Vigente 2026',
    badge: 'COMPLIANCE',
    articles: 'Modelos de Prevención Eximentes',
    summary:
      'Regula la responsabilidad de las empresas por delitos de cohecho, lavado de activos y colusión, eximiéndolas si cuentan con un modelo de prevención eficaz.',
    promptTemplate: 'Estructura una matriz de riesgos penales y compliance corporativo conforme a los requisitos de la Ley N° 30424.',
  },

  // ── RODRIGO (MINERO) ──
  {
    lawCode: 'TUPA INGEMMET 2026 & RCD OEFA',
    specialistId: 'rodrigo',
    affectedNorm: 'Procedimientos Mineros & Fiscalización Ambiental',
    date: 'Vigente 2026',
    badge: 'INGEMMET & OEFA',
    articles: 'Petitorios Mineros / PAS Ambiental / REINFO',
    summary:
      'Regula la tramitación electrónica de petitorios mineros, plazos de fiscalización ambiental y causales de exclusión de REINFO.',
    promptTemplate: 'Redacta un descargo técnico ante una imputación de infracción ambiental minera del OEFA al amparo del RCD de fiscalización.',
  },
]

export default function SpijModal({ isOpen, onClose, currentAgentId, onInsertPrompt }: SpijModalProps) {
  const [selectedSpecialist, setSelectedSpecialist] = useState<string>(currentAgentId || 'all')
  const [tab, setTab] = useState<'plenaries' | 'reforms' | 'guide'>('plenaries')
  const [search, setSearch] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    if (currentAgentId && SPECIALISTS.some((s) => s.id === currentAgentId)) {
      setSelectedSpecialist(currentAgentId)
    }
  }, [currentAgentId, isOpen])

  if (!isOpen) return null

  const normSearch = search.toLowerCase().trim()

  // Filtrado por especialista y búsqueda
  const filteredPlenaries = PLENARIES.filter((p) => {
    const matchSpecialist = selectedSpecialist === 'all' || p.specialistId === selectedSpecialist
    const matchSearch =
      !normSearch ||
      p.code.toLowerCase().includes(normSearch) ||
      p.title.toLowerCase().includes(normSearch) ||
      p.keyPoints.some((kp) => kp.toLowerCase().includes(normSearch)) ||
      p.category.toLowerCase().includes(normSearch)
    return matchSpecialist && matchSearch
  })

  const filteredReforms = REFORMS.filter((r) => {
    const matchSpecialist = selectedSpecialist === 'all' || r.specialistId === selectedSpecialist
    const matchSearch =
      !normSearch ||
      r.lawCode.toLowerCase().includes(normSearch) ||
      r.affectedNorm.toLowerCase().includes(normSearch) ||
      r.summary.toLowerCase().includes(normSearch) ||
      r.badge.toLowerCase().includes(normSearch)
    return matchSpecialist && matchSearch
  })

  const currentSpecialistInfo = SPECIALISTS.find((s) => s.id === selectedSpecialist)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2500)
  }

  const handleUsePrompt = (promptText: string) => {
    if (onInsertPrompt) {
      onInsertPrompt(promptText)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: '#161616',
          border: '1px solid rgba(201,168,76,0.25)',
          color: '#ffffff',
        }}
      >
        {/* Header */}
        <div
          className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-b"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#1c1c1c' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(201,168,76,0.12)',
                border: '1px solid rgba(201,168,76,0.30)',
                color: '#c9a84c',
              }}
            >
              <Scale size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[13px] sm:text-[15px] font-semibold text-white truncate">
                  Base Jurídica SPIJ & Acuerdos Plenarios
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-medium flex items-center gap-1 flex-shrink-0"
                  style={{
                    background: 'rgba(52,209,122,0.12)',
                    border: '1px solid rgba(52,209,122,0.30)',
                    color: '#34d17a',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34d17a] animate-pulse" />
                  Calibrado por Especialista
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-light text-white/50 truncate">
                Doctrina Vinculante de la Corte Suprema y Leyes Vigentes del MINJUSDH aplicables según tu abogado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Specialist Selector Bar */}
        <div
          className="px-4 sm:px-5 py-2.5 border-b overflow-x-auto custom-scrollbar flex items-center gap-1.5"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#191919' }}
        >
          <span className="text-[10px] font-semibold uppercase text-white/40 mr-1 flex items-center gap-1 flex-shrink-0">
            <UserCheck size={12} className="text-[#c9a84c]" />
            Especialista:
          </span>
          {SPECIALISTS.map((sp) => {
            const isSelected = selectedSpecialist === sp.id
            const isCurrentInChat = currentAgentId === sp.id
            return (
              <button
                key={sp.id}
                onClick={() => setSelectedSpecialist(sp.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#c9a84c] text-black font-semibold shadow-sm'
                    : 'bg-black/30 border border-white/5 text-white/60 hover:text-white hover:border-white/15'
                }`}
              >
                <span>{sp.name}</span>
                {isCurrentInChat && sp.id !== 'all' && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-black' : 'bg-[#34d17a]'}`}
                    title="Especialista actual en el chat"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Search & Tabs */}
        <div
          className="px-4 sm:px-5 py-2.5 border-b flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#161616' }}
        >
          {/* Tab selector */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-black/40 border border-white/5">
            <button
              onClick={() => setTab('plenaries')}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all ${
                tab === 'plenaries'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Acuerdos Plenarios ({filteredPlenaries.length})
            </button>
            <button
              onClick={() => setTab('reforms')}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all ${
                tab === 'reforms'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Leyes SPIJ Vigentes ({filteredReforms.length})
            </button>
            <button
              onClick={() => setTab('guide')}
              className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all ${
                tab === 'guide'
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Garantía de Rigor
            </button>
          </div>

          {/* Search bar */}
          {tab !== 'guide' && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por delito, artículo o pleno..."
                className="w-full pl-7 pr-3 py-1 rounded-lg text-[11px] bg-black/40 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]/50 transition-colors"
              />
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 custom-scrollbar">
          {selectedSpecialist !== 'all' && currentSpecialistInfo && (
            <div
              className="p-3 rounded-xl border flex items-center justify-between"
              style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.20)' }}
            >
              <div className="flex items-center gap-2">
                <Gavel size={14} className="text-[#c9a84c]" />
                <span className="text-[11px] font-medium text-white">
                  Despacho de <strong className="text-[#c9a84c]">{currentSpecialistInfo.name}</strong> ({currentSpecialistInfo.role}):
                </span>
                <span className="text-[10px] text-white/60 hidden md:inline">
                  Doctrina y normas SPIJ aplicadas en cada respuesta y escrito.
                </span>
              </div>
              <button
                onClick={() => setSelectedSpecialist('all')}
                className="text-[10px] text-[#c9a84c] hover:underline whitespace-nowrap"
              >
                Ver todos los abogados
              </button>
            </div>
          )}

          {tab === 'plenaries' && (
            <>
              {filteredPlenaries.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-[12px]">
                  No se encontraron Acuerdos Plenarios para el filtro seleccionado.
                </div>
              ) : (
                filteredPlenaries.map((ap) => (
                  <div
                    key={ap.code}
                    className="p-4 rounded-xl border transition-all"
                    style={{
                      background: '#191919',
                      borderColor: 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
                          style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
                        >
                          {ap.code}
                        </span>
                        <span className="text-[10px] text-white/40">{ap.category}</span>
                      </div>
                      <span className="text-[10px] text-white/40 italic">{ap.plenum}</span>
                    </div>

                    <h3 className="text-[13px] font-semibold text-white mb-2">{ap.title}</h3>

                    <div className="space-y-1 mb-2.5">
                      {ap.keyPoints.map((kp, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] font-light text-white/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0 mt-1.5" />
                          <span>{kp}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      className="p-2.5 rounded-lg mb-2.5 text-[11px]"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <span className="text-[#c9a84c] font-medium">Fundamentos Clave: </span>
                      <span className="text-white/80">{ap.bindingGrounds}</span>
                      <p className="text-white/50 text-[10px] mt-1">
                        <span className="font-medium text-white/70">Aplicación procesal: </span>
                        {ap.practicalUse}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleCopy(`${ap.code} — ${ap.title} (${ap.bindingGrounds})`, ap.code)}
                        className="flex items-center gap-1.5 text-[11px] font-light text-white/60 hover:text-white transition-colors"
                      >
                        {copiedCode === ap.code ? (
                          <>
                            <Check size={13} className="text-[#34d17a]" />
                            <span className="text-[#34d17a]">Cita copiada</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar cita procesal</span>
                          </>
                        )}
                      </button>

                      {onInsertPrompt && (
                        <button
                          onClick={() => handleUsePrompt(ap.promptTemplate)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all active:scale-95"
                          style={{
                            background: 'rgba(201,168,76,0.12)',
                            border: '1px solid rgba(201,168,76,0.25)',
                            color: '#c9a84c',
                          }}
                        >
                          <Sparkles size={11} />
                          <span>Redactar con este criterio →</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'reforms' && (
            <>
              {filteredReforms.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-[12px]">
                  No se encontraron reformas legislativas para el filtro seleccionado.
                </div>
              ) : (
                filteredReforms.map((rf) => (
                  <div
                    key={rf.lawCode}
                    className="p-4 rounded-xl border"
                    style={{
                      background: '#191919',
                      borderColor: 'rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                          style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8' }}
                        >
                          {rf.badge}
                        </span>
                        <span className="text-[12px] font-semibold text-white">{rf.lawCode}</span>
                      </div>
                      <span className="text-[10px] text-white/40">{rf.date}</span>
                    </div>

                    <p className="text-[11px] text-[#c9a84c] mb-2 font-medium">
                      Norma afectada: {rf.affectedNorm} · {rf.articles}
                    </p>

                    <div className="text-[11px] font-light text-white/80 whitespace-pre-line leading-relaxed mb-3">
                      {rf.summary}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleCopy(`${rf.lawCode} — ${rf.affectedNorm}`, rf.lawCode)}
                        className="flex items-center gap-1.5 text-[11px] font-light text-white/60 hover:text-white transition-colors"
                      >
                        {copiedCode === rf.lawCode ? (
                          <>
                            <Check size={13} className="text-[#34d17a]" />
                            <span className="text-[#34d17a]">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>Copiar referencia</span>
                          </>
                        )}
                      </button>

                      {onInsertPrompt && (
                        <button
                          onClick={() => handleUsePrompt(rf.promptTemplate)}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all active:scale-95"
                          style={{
                            background: 'rgba(56,189,248,0.12)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            color: '#38bdf8',
                          }}
                        >
                          <Sparkles size={11} />
                          <span>Redactar bajo esta ley →</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'guide' && (
            <div className="space-y-3.5 text-[12px] font-light text-white/80 leading-relaxed">
              <div
                className="p-4 rounded-xl border"
                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <h3 className="text-[13px] font-semibold text-[#c9a84c] mb-2 flex items-center gap-2">
                  <ShieldCheck size={15} />
                  Calibración Estricta por Especialista Legal
                </h3>
                <p className="mb-2">
                  Cada uno de los <strong>8 abogados del bufete</strong> opera con un catálogo normativo y
                  jurisprudencial específico:
                </p>
                <ul className="list-disc list-inside space-y-1 text-white/70 pl-2">
                  <li><strong>Sebastián (Penal):</strong> Código Penal, NCPP, D. Leg. 1585, Ley 32130, Ley 32108/32138 y todos los Acuerdos Plenarios penales supremos.</li>
                  <li><strong>Valentina (Laboral):</strong> Plenos Jurisdiccionales Supremos Laborales, Precedente Huatuco del TC, Ley 32155 y LPCL.</li>
                  <li><strong>Diego (Civil):</strong> Plenos Casatorios Civiles (IV Pleno de Ocupante Precario, IX Pleno de Nulidad), Ley 30933 de Desalojo Express y Ley 32430.</li>
                  <li><strong>Camila (Familia):</strong> Ley 31590 de Tenencia Compartida obligatoria, Ley 30364 de Violencia y Ley 31464 de Alimentos.</li>
                  <li><strong>Marco (Administrativo):</strong> TUO LPAG D.S. 006-2026-JUS (derogó DS 004-2019-JUS) y Ley 32069 de Contrataciones (OECE/TCP).</li>
                  <li><strong>Fernanda (Tributario):</strong> Resoluciones de Observancia Obligatoria del Tribunal Fiscal (RTF), Código Tributario y bancarización D. Leg. 1529.</li>
                  <li><strong>Adriana (Corporativo):</strong> Ley General de Sociedades, Ley 30424 de Compliance y lineamientos SMV.</li>
                  <li><strong>Rodrigo (Minero):</strong> TUPA INGEMMET 2026, precedentes OEFA ambiental y marco REINFO.</li>
                </ul>
              </div>

              <div
                className="p-4 rounded-xl border"
                style={{ background: '#1a1a1a', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <h3 className="text-[13px] font-semibold text-[#34d17a] mb-2 flex items-center gap-2">
                  <FileText size={15} />
                  Redacción Procesal y Descarga Editable
                </h3>
                <p>
                  Cualquier escrito generado en el bloque de documento sale listo con la estructura procesal
                  exigida en los juzgados peruanos, con sus Otrosíes Digo, Casilla SINOE y fundamentación legal
                  actualizada, listo para descargar en <strong>Microsoft Word (.docx)</strong> o imprimir en <strong>PDF oficial</strong> con el membrete de tu estudio.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 sm:px-5 py-3 border-t flex items-center justify-between text-[11px] font-light text-white/50"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#191919' }}
        >
          <span>Fuentes: SPIJ (MINJUSDH) · Corte Suprema de Justicia del Perú · El Peruano</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-medium text-black bg-[#c9a84c] hover:bg-[#d6b75e] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
