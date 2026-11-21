import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Star,
  ExternalLink,
  ChevronRight,
  Filter,
  BookmarkCheck,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  MessageSquareQuote,
  ShieldAlert,
  Info,
  Lock,
} from 'lucide-react'

export interface SpijModalProps {
  isOpen: boolean
  onClose: () => void
  currentAgentId?: string
  lockSpecialist?: boolean
  onInsertPrompt?: (text: string, specialistId?: string) => void
  onSelectPromptAndAgent?: (promptText: string, specialistId: string) => void
}

export interface Plenary {
  code: string
  specialistId: string
  plenum: string
  title: string
  category: string
  tags: string[]
  keyPoints: string[]
  bindingGrounds: string
  practicalUse: string
  promptTemplate: string
  officialCourt: string
}

export interface Reform {
  lawCode: string
  specialistId: string
  affectedNorm: string
  date: string
  badge: string
  tags: string[]
  articles: string
  summary: string
  promptTemplate: string
}

interface SpecialistMeta {
  id: string
  name: string
  role: string
  badge: string
  image: string
  color: string
  bgColor: string
  accentColor: string
  primaryCourt: string
  governingLaws: string[]
}

export const SPECIALISTS: SpecialistMeta[] = [
  {
    id: 'all',
    name: 'Todos',
    role: 'Hardman Completo',
    badge: 'GENERAL',
    image: '',
    color: '#c9a84c',
    bgColor: 'rgba(201,168,76,0.12)',
    accentColor: '#c9a84c',
    primaryCourt: 'Poder Judicial & Tribunales del Perú',
    governingLaws: ['SPIJ - MINJUSDH', 'Corte Suprema de Justicia'],
  },
  {
    id: 'sebastian',
    name: 'Sebastián',
    role: 'Derecho Penal & Procesal Penal',
    badge: 'PENAL',
    image: '/agents/sebastian.jpg',
    color: '#EF4444',
    bgColor: 'rgba(239,68,68,0.12)',
    accentColor: '#f87171',
    primaryCourt: 'Salas Penales de la Corte Suprema de Justicia de la República',
    governingLaws: [
      'Código Penal (D. Leg. 635)',
      'Código Procesal Penal (D. Leg. 957)',
      'D. Leg. 1585 (Reforma Prisión Preventiva & Vigilancia)',
      'Ley 32130 (Investigación Preliminar PNP/Fiscalía)',
      'Leyes 32108 y 32138 (Crimen Organizado & Allanamiento)',
      'Ley 32735 (Extorsión Agravada)',
    ],
  },
  {
    id: 'valentina',
    name: 'Valentina',
    role: 'Derecho Laboral & Seguridad Social',
    badge: 'LABORAL',
    image: '/agents/valentina.jpg',
    color: '#6366F1',
    bgColor: 'rgba(99,102,241,0.12)',
    accentColor: '#818cf8',
    primaryCourt: 'Salas de Derecho Constitucional y Social de la Corte Suprema & TC',
    governingLaws: [
      'TUO D. Leg. 728 (LPCL D.S. 003-97-TR)',
      'Nueva Ley Procesal del Trabajo (Ley 29497 / Ley 32155)',
      'D. Leg. 650 & D.S. 001-97-TR (Compensación por Tiempo de Servicios)',
      'Ley 27735 & Ley 30334 (Gratificaciones & Bonificación 9% EsSalud)',
      'D.S. 015-2026-TR (Remuneración Mínima Vital S/ 1,230 y Asignación Familiar S/ 123)',
      'Ley 28806 (Ley General de Inspección del Trabajo - SUNAFIL)',
    ],
  },
  {
    id: 'diego',
    name: 'Diego',
    role: 'Derecho Civil, Contratos e Inmobiliario',
    badge: 'CIVIL',
    image: '/agents/diego.jpg',
    color: '#06B6D4',
    bgColor: 'rgba(6,182,212,0.12)',
    accentColor: '#22d3ee',
    primaryCourt: 'Salas Civiles de la Corte Suprema de Justicia de la República',
    governingLaws: [
      'Código Civil de 1984 (D. Leg. 295)',
      'Código Procesal Civil (D. Leg. 768 / Art. 594 Allanamiento)',
      'Ley 30933 & D.S. 013-2019-JUS (Desalojo Notarial Express)',
      'Ley 32430 (Ley de Arrendamiento Justo / Renta Percibida)',
      'Ley 27287 (Ley de Títulos Valores - Pagarés & Letras)',
      'Ley del Notariado (D. Leg. 1049)',
    ],
  },
  {
    id: 'camila',
    name: 'Camila',
    role: 'Derecho de Familia & Niñez',
    badge: 'FAMILIA',
    image: '/agents/camila.jpg',
    color: '#EC4899',
    bgColor: 'rgba(236,72,153,0.12)',
    accentColor: '#f472b6',
    primaryCourt: 'Juzgados Especializados de Familia del Poder Judicial',
    governingLaws: [
      'Código de los Niños y Adolescentes (Ley 27337)',
      'Código Civil (Libro III: Derecho de Familia)',
      'Ley 31590 (Tenencia Compartida Obligatoria & Coparentalidad)',
      'Ley 30364 & D.S. 009-2019-MIMP (Protección ante Violencia Familiar en 24-48h)',
      'Ley 31464 (Celeridad y Oralidad en Juicios de Alimentos)',
      'Ley 28970 (Registro de Deudores Alimentarios Morosos - REDAM)',
    ],
  },
  {
    id: 'marco',
    name: 'Marco',
    role: 'Administrativo & Contrataciones del Estado',
    badge: 'ADMIN',
    image: '/agents/marco.jpg',
    color: '#0D9488',
    bgColor: 'rgba(13,148,136,0.12)',
    accentColor: '#2dd4bf',
    primaryCourt: 'Tribunal de Contrataciones Públicas (TCP / OECE) & PJ Contencioso',
    governingLaws: [
      'TUO LPAG aprobado por D.S. 006-2026-JUS (Derogó formalmente al DS 004-2019-JUS)',
      'Ley 32069 (Nueva Ley General de Contrataciones Públicas)',
      'D.S. 001-2026-EF (Reglamento de la Ley 32069)',
      'Marco de Creación del OECE (Organismo de Contrataciones Eficientes)',
      'TUO Ley 27584 (Proceso Contencioso Administrativo)',
    ],
  },
  {
    id: 'fernanda',
    name: 'Fernanda',
    role: 'Derecho Tributario & Fiscal',
    badge: 'TRIBUTARIO',
    image: '/agents/fernanda.jpg',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.12)',
    accentColor: '#34d399',
    primaryCourt: 'Tribunal Fiscal del Perú (MEF) & SUNAT',
    governingLaws: [
      'TUO del Código Tributario (D.S. 133-2013-EF / Art. 154 RTF Vinculante)',
      'TUO de la Ley del Impuesto a la Renta (D.S. 179-2004-EF / Art. 37 Fehaciencia)',
      'D. Leg. 1529 (Ley de Bancarización Obligatoria desde S/ 2,000 o US$ 500)',
      'TUO de la Ley del IGV e ISC (D.S. 055-99-EF)',
      'Régimen de Gradualidad de Sanciones SUNAT (R.S. 063-2007/SUNAT)',
    ],
  },
  {
    id: 'adriana',
    name: 'Adriana',
    role: 'Corporativo, M&A y Compliance',
    badge: 'CORPORATIVO',
    image: '/agents/adriana.jpg',
    color: '#8B5CF6',
    bgColor: 'rgba(139,92,246,0.12)',
    accentColor: '#a78bfa',
    primaryCourt: 'Superintendencia del Mercado de Valores (SMV) & MINJUSDH',
    governingLaws: [
      'Ley General de Sociedades (Ley 26887)',
      'Ley 30424 (Responsabilidad Administrativa y Penal de Personas Jurídicas)',
      'D.S. 002-2019-JUS (Reglamento de la Ley 30424)',
      'Guía Oficial MINJUSDH de Modelos de Prevención de Delitos',
      'Código de Buen Gobierno Corporativo para Sociedades Peruanas (SMV)',
    ],
  },
  {
    id: 'rodrigo',
    name: 'Rodrigo',
    role: 'Minero, Ambiental & Recursos Naturales',
    badge: 'MINERO',
    image: '/agents/rodrigo.jpg',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.12)',
    accentColor: '#fbbf24',
    primaryCourt: 'Tribunal de Fiscalización Ambiental (TFA - OEFA) & Consejo de Minería',
    governingLaws: [
      'TUO de la Ley General de Minería (D.S. 014-92-EM)',
      'Ley General del Ambiente (Ley 28611)',
      'TUPA INGEMMET 2026 (Procedimientos de Concesión Minera)',
      'RCD N° 00020-2023-OEFA/CD (Reglamento de Fiscalización Ambiental)',
      'Marco Legal REINFO (Registro Integral de Formalización Minera)',
    ],
  },
]

export const PLENARIES: Plenary[] = [
  // ── SEBASTIÁN: PENAL & PROCESAL PENAL ──
  {
    code: 'Acuerdo Plenario N° 01-2019/CIJ-116',
    specialistId: 'sebastian',
    plenum: 'XI Pleno Jurisdiccional Penal',
    officialCourt: 'Salas Penales de la Corte Suprema de Justicia',
    title: 'Prisión preventiva: sospecha grave, peligro procesal y estándar de arraigos',
    category: 'Procesal Penal',
    tags: ['Prisión Preventiva', 'Arraigos', 'Peligro Procesal', 'Sospecha Grave'],
    keyPoints: [
      'Exige estándar cualificado de "sospecha fuerte/grave", superando la mera sospecha reveladora formal.',
      'El peligro de fuga no se presume por la gravedad de la pena; exige análisis de arraigos de calidad (domiciliario, familiar y laboral).',
      'Ponderación obligatoria de proporcionalidad, necesidad y principio de estricta excepcionalidad.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 24-27 (estándar probatorio cualificado) y FJ 35-48 (peligro procesal y proporcionalidad).',
    practicalUse: 'Obligatorio en oposición a requerimientos de prisión preventiva, solicitudes de cesación y apelaciones de auto de prisión preventiva.',
    promptTemplate: 'Redacta un escrito de oposición a prisión preventiva aplicando los fundamentos vinculantes del Acuerdo Plenario N° 01-2019/CIJ-116 (FJ 24-27 y 35-48) y la reforma del D. Leg. 1585 para acreditar arraigo laboral y familiar de calidad.',
  },
  {
    code: 'Acuerdo Plenario N° 02-2005/CJ-116',
    specialistId: 'sebastian',
    plenum: 'I Pleno Jurisdiccional Penal',
    officialCourt: 'Corte Suprema de Justicia de la República',
    title: 'Garantías de certeza de la declaración de la víctima y coimputados',
    category: 'Procesal Penal / Prueba',
    tags: ['Testimonio de Víctima', 'Duda Razonable', 'Sobreseimiento', 'Verosimilitud'],
    keyPoints: [
      'Ausencia de incredibilidad subjetiva (inexistencia de relaciones de odio, resentimiento o venganza).',
      'Verosimilitud objetiva con corroboraciones periféricas externas e independientes.',
      'Persistencia en la incriminación prolongada en el tiempo sin contradicciones esenciales.',
    ],
    bindingGrounds: 'Fundamento Jurídico 10 (las 3 reglas copulativas de valoración del testimonio incriminador de cargo).',
    practicalUse: 'Fundamental en alegatos de clausura, apelación de sentencias condenatorias y solicitudes de sobreseimiento por falta de corroboración.',
    promptTemplate: 'Analiza la declaración testimonial del agraviado bajo el Acuerdo Plenario N° 02-2005/CJ-116 (FJ 10): demuestra la falta de corroboración objetiva y contradicciones para sustentar la absolución o sobreseimiento.',
  },
  {
    code: 'Acuerdo Plenario N° 04-2005/CJ-116',
    specialistId: 'sebastian',
    plenum: 'I Pleno Jurisdiccional Penal',
    officialCourt: 'Corte Suprema de Justicia de la República',
    title: 'Tentativa y consumación en los delitos de robo y hurto',
    category: 'Derecho Penal Especial',
    tags: ['Robo Agravado', 'Tentativa', 'Disponibilidad Potencial', 'Atenuación'],
    keyPoints: [
      'Adopta la teoría de la disponibilidad potencial (ablatio) sobre el bien sustraído.',
      'Si hay persecución ininterrumpida de la policía o la víctima, el hecho queda en grado de TENTATIVA (Art. 16 CP).',
      'Habilita la atenuación prudencial obligatoria de la pena por debajo del mínimo legal.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 7 al 9 (momento consumativo y disponibilidad del bien mueble).',
    practicalUse: 'Estrategia de defensa para recalificar la imputación fiscal de robo agravado consumado a tentativa, logrando penas de ejecución suspendida.',
    promptTemplate: 'Prepara alegatos de defensa penal fundamentados en el Acuerdo Plenario N° 04-2005/CJ-116 para recalificar el delito de robo agravado consumado a tentativa por persecución ininterrumpida.',
  },
  {
    code: 'Acuerdo Plenario N° 05-2023/CIJ-112',
    specialistId: 'sebastian',
    plenum: 'XII Pleno Jurisdiccional Penal',
    officialCourt: 'Corte Suprema de Justicia de la República',
    title: 'Inaplicabilidad vía control difuso de la Ley 31751 (Ley Soto) sobre prescripción',
    category: 'Derecho Penal / Prescripción',
    tags: ['Prescripción Penal', 'Ley Soto', 'Control Difuso', 'Sobreseimiento'],
    keyPoints: [
      'Declara inconstitucional e inaplica el límite restrictivo de 1 año para suspender la prescripción introducido por la Ley 31751.',
      'Rige el cómputo constitucional tradicional: plazo extraordinario de prescripción (pena máxima abstracta + su mitad).',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 38 al 47 (control difuso preferente de la Constitución sobre normas legales lesivas).',
    practicalUse: 'Deducción y contestación de Excepciones de Prescripción de la Acción Penal y control de plazos procesales.',
    promptTemplate: 'Evalúa la prescripción de la acción penal calculando el plazo ordinario y extraordinario conforme a la doctrina del Acuerdo Plenario N° 05-2023/CIJ-112 y los Arts. 80 y 83 del Código Penal.',
  },
  {
    code: 'Acuerdo Plenario Extraordinario N° 02-2016/CIJ-116',
    specialistId: 'sebastian',
    plenum: 'II Pleno Jurisdiccional Extraordinario Penal',
    officialCourt: 'Corte Suprema de Justicia de la República',
    title: 'Proceso penal inmediato reformado, flagrancia y evidencia delictiva (D. Leg. 1194)',
    category: 'Procesal Penal / Procesos Especiales',
    tags: ['Flagrancia', 'Proceso Inmediato', 'D. Leg. 1194', 'Evidencia Delictiva', 'Detención Policial'],
    keyPoints: [
      'Delimita los presupuestos materiales de la evidencia delictiva: delito flagrante, confesión sincera y delito evidente.',
      'Control riguroso de legalidad del registro personal y de las evidencias incautadas por la Policía Nacional.',
      'Improcedencia del proceso inmediato ante necesidad de pericias complejas o actos de investigación no actuados en diligencias preliminares.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 10 al 23 (doctrina legal vinculante sobre incoación de proceso inmediato y tutela de garantías).',
    practicalUse: 'Oposición en audiencia de incoación de proceso inmediato, solicitud de remisión a investigación común y nulidad de actas policiales irregulares.',
    promptTemplate: 'Redacta una oposición a la incoación de Proceso Inmediato sustentada en el Acuerdo Plenario Extraordinario N° 02-2016/CIJ-116 y el Art. 446° del NCPP por inexistencia de flagrancia estricta y necesidad de actos de investigación pericial compleja.',
  },
  {
    code: 'Acuerdo Plenario N° 04-2010/CJ-116',
    specialistId: 'sebastian',
    plenum: 'VI Pleno Jurisdiccional Penal',
    officialCourt: 'Corte Suprema de Justicia de la República',
    title: 'Audiencia de Tutela de Derechos (Art. 71 del Código Procesal Penal)',
    category: 'Procesal Penal / Garantías',
    tags: ['Tutela de Derechos', 'Art. 71 NCPP', 'Imputación Concreta', 'Defensa Eficaz'],
    keyPoints: [
      'Mecanismo residual de protección judicial inmediata frente a vulneraciones de garantías fundamentales del Art. 71 NCPP.',
      'Control judicial de imputación necesaria, derecho a una defensa técnica eficaz y exclusión de actos ilícitos.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 11 al 17 (supuestos habilitantes ante el Juez de Investigación Preparatoria).',
    practicalUse: 'Solicitud de tutela ante vulneración del derecho a la defensa, falta de precisión fáctica o diligencias sin abogado defensor.',
    promptTemplate: 'Elabora una solicitud de Audiencia de Tutela de Derechos al amparo del Art. 71.4 del NCPP y el Acuerdo Plenario N° 04-2010/CJ-116 por grave afectación al principio de imputación concreta.',
  },

  // ── VALENTINA: LABORAL ──
  {
    code: 'II Pleno Jurisdiccional Supremo Laboral',
    specialistId: 'valentina',
    plenum: 'Pleno Jurisdiccional Supremo Laboral',
    officialCourt: 'Salas de Derecho Constitucional y Social - Corte Suprema',
    title: 'Despido incausado y fraudulento: reposición e indemnización tasada',
    category: 'Derecho Laboral',
    tags: ['Despido Incausado', 'Reposición', 'Indemnización D.L. 728', 'Daño Moral'],
    keyPoints: [
      'Reconoce la procedencia de la reposición laboral en el régimen privado (DL 728) ante despido incausado o fraudulento.',
      'El trabajador puede optar alternativamente por la indemnización del Art. 38 LPCL (1.5 sueldos por año laborado, tope 12 sueldos).',
      'Compatibilidad procesal del cobro acumulado de lucro cesante y daño moral acreditado.',
    ],
    bindingGrounds: 'Tema 1 y 2 del II Pleno Laboral (protección adecuada y tutela restitutoria frente al despido arbitrario).',
    practicalUse: 'Demandas laborales de reposición al puesto habitual o cobro de indemnización por despido arbitrario ante Juzgados Laborales.',
    promptTemplate: 'Redacta una demanda laboral de reposición por despido incausado e indemnización conforme al II Pleno Jurisdiccional Supremo Laboral y el D.S. 003-97-TR (LPCL).',
  },
  {
    code: 'Precedente Huatuco (Exp. 05057-2013-PA/TC)',
    specialistId: 'valentina',
    plenum: 'Precedente Vinculante Constitucional',
    officialCourt: 'Tribunal Constitucional del Perú',
    title: 'Límites a la reposición en el sector público: exigencia de concurso público',
    category: 'Laboral Público',
    tags: ['Sector Público', 'Precedente Huatuco', 'Concurso Público', 'Indemnización'],
    keyPoints: [
      'En entidades del Estado no procede la reposición indeterminada sin concurso público de méritos para plaza presupuestada vacante.',
      'Ante desnaturalización de contratos en el Estado (CAS, locación de servicios), la única pretensión viable y amparable es la indemnización por despido.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 18 al 22 (precedente vinculante de observancia obligatoria para el Poder Judicial).',
    practicalUse: 'Estrategia de demanda contra ministerios, municipalidades, gobiernos regionales o entidades estatales: peticionar indemnización.',
    promptTemplate: 'Formula la pretensión laboral principal y subordinada en una demanda contra el Estado aplicando el Precedente Vinculante Caso Huatuco del Tribunal Constitucional.',
  },

  // ── DIEGO: CIVIL E INMOBILIARIO ──
  {
    code: 'IV Pleno Casatorio Civil (Cas. 2195-2011 Ucayali)',
    specialistId: 'diego',
    plenum: 'Pleno Casatorio Civil Vinculante',
    officialCourt: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Desalojo por ocupación precaria y títulos fenecidos (Art. 911 Código Civil)',
    category: 'Derecho Civil / Inmobiliario',
    tags: ['Desalojo', 'Ocupante Precario', 'Arrendamiento', 'Carta Notarial'],
    keyPoints: [
      'Define la precariedad: posesión sin título o con título fenecido legalmente.',
      'Vencido el plazo del arrendamiento y cursada la carta notarial de restitución, el arrendatario deviene automáticamente en ocupante precario.',
      'Alegar usucapión no frena el trámite sumario de desalojo.',
    ],
    bindingGrounds: 'Reglas Vinculantes 1 a 7 (supuestos de posesión precaria y legitimación procesal activa del propietario).',
    practicalUse: 'Demanda de desalojo por ocupante precario ante los Juzgados Civiles o Mixtos de la República.',
    promptTemplate: 'Redacta una demanda de desalojo por ocupante precario conforme a los lineamientos vinculantes del IV Pleno Casatorio Civil (Casación 2195-2011 Ucayali) y el Art. 911 del Código Civil.',
  },
  {
    code: 'IX Pleno Casatorio Civil (Cas. 4442-2015 Moquegua)',
    specialistId: 'diego',
    plenum: 'Pleno Casatorio Civil Vinculante',
    officialCourt: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Nulidad manifiesta de acto jurídico en otorgamiento de escritura pública',
    category: 'Derecho Civil / Contratos',
    tags: ['Escritura Pública', 'Nulidad Manifiesta', 'Contratos', 'Acto Jurídico'],
    keyPoints: [
      'El juez civil puede y debe declarar de oficio la nulidad de un contrato de compraventa si la causal es manifiesta y evidente, garantizando el contradictorio previo.',
    ],
    bindingGrounds: 'Reglas vinculantes 1 a 5 (facultad de control judicial oficioso de validez del acto jurídico material).',
    practicalUse: 'Contestación u oposición a demandas de otorgamiento de escritura pública basadas en contratos simulados o viciados.',
    promptTemplate: 'Prepara la contestación de demanda de otorgamiento de escritura deduciendo la nulidad manifiesta del acto jurídico bajo el IX Pleno Casatorio Civil.',
  },

  // ── CAMILA: FAMILIA ──
  {
    code: 'Pleno Jurisdiccional Nacional de Familia 2022',
    specialistId: 'camila',
    plenum: 'Pleno Jurisdiccional Nacional',
    officialCourt: 'Jueces Especializados de Familia - Poder Judicial',
    title: 'Tenencia compartida obligatoria y ponderación proporcional de alimentos',
    category: 'Derecho de Familia',
    tags: ['Tenencia Compartida', 'Alimentos', 'Interés Superior', 'Ley 31590'],
    keyPoints: [
      'La tenencia compartida constituye la regla legal preferente en virtud de la Ley 31590 para ambos progenitores.',
      'La pensión de alimentos en tenencia compartida se pondera según el tiempo efectivo de cuidado que cada progenitor asume.',
    ],
    bindingGrounds: 'Conclusiones plenarias de observancia obligatoria sobre el principio de coparentalidad y régimen de alimentos recíproco.',
    practicalUse: 'Demanda de tenencia compartida, régimen de visitas y balance proporcional de pensión alimenticia.',
    promptTemplate: 'Redacta una demanda de tenencia compartida y régimen de alimentos recíproco fundamentada en la Ley N° 31590 y las conclusiones del Pleno Nacional de Familia.',
  },

  // ── MARCO: ADMINISTRATIVO & CONTRATACIONES ──
  {
    code: 'Precedentes del Tribunal de Contrataciones (TCP / OECE)',
    specialistId: 'marco',
    plenum: 'Acuerdos de Sala Plena',
    officialCourt: 'Tribunal de Contrataciones Públicas - OECE',
    title: 'Impugnación de buena pro, plazos fatales y Junta de Disputas (JPRD)',
    category: 'Contrataciones del Estado',
    tags: ['OECE', 'Ley 32069', 'Buena Pro', 'JPRD', 'Apelación TCP'],
    keyPoints: [
      'Prevalencia de la verdad material y eficacia sobre formalismos intrascendentes en licitaciones públicas.',
      'Plazo perentorio de 8 días hábiles para apelar adjudicaciones de buena pro ante el TCP.',
      'Obligatoriedad de la Junta de Prevención y Resolución de Disputas (JPRD) en obras públicas bajo Ley 32069.',
    ],
    bindingGrounds: 'Acuerdos de Sala Plena del TCP sobre admisibilidad de recursos y ejecución de garantías.',
    practicalUse: 'Recursos de apelación contra descalificaciones o adjudicaciones arbitrarias ante el TCP del OECE.',
    promptTemplate: 'Redacta un recurso de apelación de adjudicación de buena pro ante el Tribunal de Contrataciones Públicas (TCP) conforme a la Ley N° 32069 y el D.S. 001-2026-EF.',
  },

  // ── FERNANDA: TRIBUTARIO ──
  {
    code: 'Resolución RTF N° 01807-1-2023 (Observancia Obligatoria)',
    specialistId: 'fernanda',
    plenum: 'Criterio Vinculante de Observancia Obligatoria',
    officialCourt: 'Tribunal Fiscal del Perú - Ministerio de Economía y Finanzas',
    title: 'Fehaciencia probatoria, gastos deducibles y operaciones no reales',
    category: 'Derecho Tributario',
    tags: ['SUNAT', 'Fehaciencia', 'Gastos Deducibles', 'Bancarización', 'RTF'],
    keyPoints: [
      'La factura y el medio de pago bancario no bastan por sí solos: se exige prueba documental de la efectiva prestación del servicio.',
      'Criterio de causalidad y fehaciencia estricta conforme al Art. 37 de la Ley del Impuesto a la Renta.',
    ],
    bindingGrounds: 'Criterio vinculante publicado en El Peruano (Art. 154 del Código Tributario).',
    practicalUse: 'Descargos técnicos ante requerimientos de fiscalización SUNAT y recursos de reclamación.',
    promptTemplate: 'Elabora un escrito de descargo ante un requerimiento de fiscalización SUNAT por reparo de fehaciencia de gastos aplicando la RTF N° 01807-1-2023.',
  },

  // ── ADRIANA: CORPORATIVO ──
  {
    code: 'Lineamientos SMV y Guía Oficial MINJUSDH Ley 30424',
    specialistId: 'adriana',
    plenum: 'Estándar Oficial de Cumplimiento',
    officialCourt: 'Superintendencia del Mercado de Valores & Ministerio de Justicia',
    title: 'Modelos de Prevención de Delitos Corporativos y Eximente de Responsabilidad',
    category: 'Corporativo & Compliance',
    tags: ['Compliance', 'Ley 30424', 'Prevención Penal', 'M&A Due Diligence'],
    keyPoints: [
      'Exención de responsabilidad administrativa y penal para la persona jurídica si implementó un modelo de prevención idóneo previo al delito.',
      'Obligación de debida diligencia legal integral en procesos de fusiones y adquisiciones (M&A).',
    ],
    bindingGrounds: 'D.S. N° 002-2019-JUS (Reglamento de la Ley 30424) y estándares de buen gobierno corporativo.',
    practicalUse: 'Diseño de programas de compliance penal, auditoría corporativa y redacción de pactos de accionistas.',
    promptTemplate: 'Diseña una cláusula de indemnidad y debida diligencia de compliance penal bajo la Ley N° 30424 para un contrato de compraventa de acciones (M&A).',
  },

  // ── RODRIGO: MINERO & AMBIENTAL ──
  {
    code: 'Precedentes del Tribunal de Fiscalización Ambiental (TFA - OEFA)',
    specialistId: 'rodrigo',
    plenum: 'Resolución de Sala Plena TFA',
    officialCourt: 'Tribunal de Fiscalización Ambiental - OEFA',
    title: 'Tipificación de infracciones mineras ambientales y atenuantes en PAS',
    category: 'Derecho Minero y Ambiental',
    tags: ['OEFA', 'PAS Ambiental', 'Atenuante 50%', 'INGEMMET', 'REINFO'],
    keyPoints: [
      'Proporcionalidad estricta en medidas correctivas y atenuación del 50% de multa económica por subsanación voluntaria previa al PAS.',
      'Vigencia de concesiones mineras y acreditación de producción mínima ante INGEMMET.',
    ],
    bindingGrounds: 'Resoluciones vinculantes de Sala Plena del TFA sobre determinación de daño ambiental potencial y real.',
    practicalUse: 'Descargos y recursos de reconsideración/apelación en Procedimientos Administrativos Sancionadores del OEFA.',
    promptTemplate: 'Redacta un escrito de descargo en un PAS ambiental ante el OEFA solicitando la atenuante del 50% por subsanación voluntaria conforme al precedente del TFA.',
  },

  // ── SEBASTIÁN: PENAL ADICIONALES ──
  {
    code: 'Casación Vinculante N° 02-2008/La Libertad',
    specialistId: 'sebastian',
    plenum: 'Doctrina Jurisprudencial Vinculante',
    officialCourt: 'Sala Penal Permanente de la Corte Suprema de Justicia',
    title: 'Plazo razonable en diligencias preliminares y audiencia de control de plazos (Art. 334.2 NCPP)',
    category: 'Procesal Penal / Control de Plazos',
    tags: ['Control de Plazos', 'Diligencias Preliminares', 'Plazo Razonable', 'Fiscalía', 'Art. 334.2 NCPP'],
    keyPoints: [
      'Autonomía de los plazos de diligencias preliminares e investigación preparatoria formalizada.',
      'El plazo de diligencias preliminares no puede ser arbitrariamente prolongado ni exceder el plazo razonable fijado por ley.',
      'Vencido el plazo sin pronunciamiento fiscal, el afectado solicita al Juez de Garantías Audiencia de Control de Plazos, quien conmina al fiscal a concluir en plazo perentorio de 10 días.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 7 al 12 (concordada con Casación 144-2012/Ancash y Casación 318-2011/Lima sobre plazos máximos en sede fiscal).',
    practicalUse: 'Solicitudes y audiencias de control de plazos para frenar investigaciones preliminares fiscales arbitrariamente dilatadas.',
    promptTemplate: 'Redacta una solicitud de Audiencia de Control de Plazos al amparo del Art. 334° numeral 2 del NCPP y la Casación Vinculante N° 02-2008/La Libertad por vencimiento excesivo del plazo razonable en diligencias preliminares.',
  },
  {
    code: 'Acuerdo Plenario N° 06-2009/CJ-116',
    specialistId: 'sebastian',
    plenum: 'V Pleno Jurisdiccional Penal',
    officialCourt: 'Salas Penales de la Corte Suprema de Justicia',
    title: 'Control de la acusación fiscal: control formal y sustancial en etapa intermedia',
    category: 'Procesal Penal / Etapa Intermedia',
    tags: ['Control de Acusación', 'Sobreseimiento', 'Etapa Intermedia', 'Atipicidad', 'Art. 350-352 NCPP'],
    keyPoints: [
      'Control formal previo: devolución de acusación defectuosa para subsanación fiscal en audiencia o en plazo de 5 días.',
      'Control sustancial directo: el juez dicta sobreseimiento de oficio o a pedido de parte por atipicidad, falta de elementos o causas de extinción.',
      'Filtro judicial obligatorio para evitar juicios orales innecesarios sin viabilidad típica ni probatoria.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 8 al 15 (doctrina legal vinculante sobre los alcances del control judicial de la acusación penal).',
    practicalUse: 'Absolución de traslado de acusación fiscal, deducción de excepciones y solicitudes de sobreseimiento en etapa intermedia.',
    promptTemplate: 'Redacta el escrito de absolución del traslado de la acusación fiscal solicitando el sobreseimiento por atipicidad conforme a los Arts. 350° y 344° del NCPP y el Acuerdo Plenario N° 06-2009/CJ-116.',
  },
  {
    code: 'Acuerdo Plenario Extraordinario N° 02-2012/CJ-116',
    specialistId: 'sebastian',
    plenum: 'Pleno Jurisdiccional Extraordinario Penal',
    officialCourt: 'Salas Penales de la Corte Suprema de Justicia',
    title: 'Audiencia de tutela de derechos e imputación suficiente en la formalización fiscal',
    category: 'Procesal Penal / Tutela de Derechos',
    tags: ['Tutela de Derechos', 'Imputación Suficiente', 'Investigación Preparatoria', 'Art. 71.4 NCPP'],
    keyPoints: [
      'Habilita la vía de tutela de derechos (Art. 71.4 NCPP) para cuestionar la omisión o deficiencia del principio de imputación fáctica suficiente en la Disposición de Formalización.',
      'El Juez de Garantías ordena al Fiscal subsanar y precisar circunstanciadamente los hechos, garantizando el derecho de defensa eficaz.',
      'La tutela no autoriza a decretar el archivo o sobreseimiento en esta etapa, sino a exigir la subsanación de los defectos formales de imputación.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 9 al 12 (doctrina legal vinculante sobre tutela de derechos frente a la imputación deficiente).',
    practicalUse: 'Audiencias de tutela de derechos para obligar al Ministerio Público a individualizar y precisar los hechos atribuidos en la formalización de investigación.',
    promptTemplate: 'Elabora una solicitud de Audiencia de Tutela de Derechos al amparo del Art. 71.4 del NCPP y el Acuerdo Plenario Extraordinario N° 02-2012/CJ-116 por vulneración del principio de imputación concreta y suficiente en la disposición fiscal de formalización.',
  },
  {
    code: 'Acuerdo Plenario N° 03-2010/CJ-116',
    specialistId: 'sebastian',
    plenum: 'VI Pleno Jurisdiccional Penal',
    officialCourt: 'Salas Penales de la Corte Suprema de Justicia',
    title: 'Delito de lavado de activos: autonomía típica y estándar probatorio del delito previo',
    category: 'Derecho Penal Especial / Lavado de Activos',
    tags: ['Lavado de Activos', 'Delito Fuente', 'Prueba Indiciaria', 'Autonomía Típica', 'D. Leg. 1106'],
    keyPoints: [
      'Autonomía sustantiva y procesal del delito de lavado de activos respecto del delito previo generador de las ganancias ilícitas.',
      'No se exige condena previa ni acreditación exhaustiva del delito fuente; basta acreditar la procedencia delictiva mediante prueba por indicios concurrentes.',
      'Exclusión razonable de orígenes lícitos del patrimonio incrementado o transferido.',
    ],
    bindingGrounds: 'Fundamentos Jurídicos 8 al 34 (doctrina legal vinculante sobre tipicidad, autonomía y prueba indiciaria en lavado de activos).',
    practicalUse: 'Estrategias de defensa penal en delitos de lavado de activos, excepciones de improcedencia de acción y peritajes contables de desbalance.',
    promptTemplate: 'Prepara una fundamentación de defensa técnica en delito de lavado de activos conforme al Acuerdo Plenario N° 03-2010/CJ-116, cuestionando la vinculación con el delito previo y acreditando el origen lícito de los fondos.',
  },

  // ── VALENTINA: LABORAL ADICIONALES ──
  {
    code: 'VII Pleno Jurisdiccional Supremo Laboral',
    specialistId: 'valentina',
    plenum: 'VII Pleno Supremo Laboral y Previsional',
    officialCourt: 'Salas de Derecho Constitucional y Social de la Corte Suprema',
    title: 'Indemnización por accidentes de trabajo, daño moral y lucro cesante',
    category: 'Derecho Laboral / Daños y Perjuicios',
    tags: ['Accidente de Trabajo', 'Ley 29783', 'Daño Moral', 'Lucro Cesante', 'SUNAFIL'],
    keyPoints: [
      'Responsabilidad objetiva del empleador por incumplimiento de medidas de seguridad y salud en el trabajo.',
      'Presunción de culpa inexcusable del empleador ante lesión o infortunio laboral.',
      'Cuantificación autónoma de daño emergente, lucro cesante proyectado y daño moral.',
    ],
    bindingGrounds: 'Tema N° 1 del VII Pleno Jurisdiccional Supremo Laboral (criterios de reparación integral).',
    practicalUse: 'Demandas laborales de indemnización por daños y perjuicios derivados de accidentes de trabajo.',
    promptTemplate: 'Redacta una demanda laboral de indemnización por daños y perjuicios por accidente de trabajo bajo la Ley N° 29783 y el VII Pleno Jurisdiccional Supremo Laboral, cuantificando daño moral y lucro cesante.',
  },
  {
    code: 'IX Pleno Jurisdiccional Supremo Laboral',
    specialistId: 'valentina',
    plenum: 'IX Pleno Supremo Laboral y Previsional',
    officialCourt: 'Salas de Derecho Constitucional y Social de la Corte Suprema',
    title: 'Desnaturalización de contratos modales y tercerización sin autonomía',
    category: 'Derecho Laboral / Contratación',
    tags: ['Desnaturalización', 'Contratos Modales', 'Tercerización', 'Planilla'],
    keyPoints: [
      'Exigencia estricta de causa objetiva determinante: la falta de precisión desnaturaliza el contrato temporal (Art. 77 D.S. 003-97-TR).',
      'En tercerización, la subordinación directa con la empresa principal determina el ingreso inmediato a su planilla.',
    ],
    bindingGrounds: 'Conclusiones plenarias N° 2 y 3 del IX Pleno Supremo Laboral.',
    practicalUse: 'Demandas de desnaturalización de contratos, reposición e inclusión en planilla a plazo indeterminado.',
    promptTemplate: 'Prepara una demanda laboral de desnaturalización de contrato sujeto a modalidad y reconocimiento de contrato a plazo indeterminado aplicando el Art. 77° del D.S. 003-97-TR y el IX Pleno Supremo Laboral.',
  },

  // ── DIEGO: CIVIL ADICIONALES ──
  {
    code: 'VII Pleno Casatorio Civil (Casación 3671-2014 Lima)',
    specialistId: 'diego',
    plenum: 'VII Pleno Casatorio Civil Vinculante',
    officialCourt: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Tercería de propiedad: propiedad no inscrita frente a embargo judicial inscrito',
    category: 'Derecho Civil / Derechos Reales',
    tags: ['Tercería de Propiedad', 'Embargo Inscrito', 'Fecha Cierta', 'Art. 2022 CC'],
    keyPoints: [
      'Prevalece la propiedad no inscrita sobre el embargo inscrito siempre que conste en documento de fecha cierta anterior.',
      'El juez debe verificar de oficio la legalidad de la fecha cierta para descartar fraudes procesales.',
    ],
    bindingGrounds: 'Doctrina Vinculante - Reglas 1 y 2 (segundo párrafo del Art. 2022 del Código Civil).',
    practicalUse: 'Demandas de tercería de propiedad para desafectar embargos trabados sobre inmuebles adquiridos pero no inscritos.',
    promptTemplate: 'Redacta una demanda de tercería de propiedad para levantar un embargo judicial inscrito invocando el segundo párrafo del Art. 2022° del Código Civil y las reglas vinculantes del VII Pleno Casatorio Civil.',
  },
  {
    code: 'X Pleno Casatorio Civil (Casación 1242-2017 Lima Este)',
    specialistId: 'diego',
    plenum: 'X Pleno Casatorio Civil Vinculante',
    officialCourt: 'Salas Civiles de la Corte Suprema de Justicia',
    title: 'Límites, excepcionalidad y contradictorio previo en la prueba de oficio',
    category: 'Derecho Procesal Civil / Prueba',
    tags: ['Prueba de Oficio', 'Art. 194 CPC', 'Contradictorio', 'Debido Proceso'],
    keyPoints: [
      'La prueba de oficio es excepcional y subsidiaria; no sustituye la inercia probatoria de las partes procesales.',
      'Deber judicial de motivar la excepcionalidad y garantizar el contradictorio previo de ambas partes.',
    ],
    bindingGrounds: 'Reglas vinculantes 1 a 12 del X Pleno Casatorio Civil sobre el ejercicio del Art. 194 del CPC.',
    practicalUse: 'Impugnación de autos judiciales que ordenan pruebas de oficio sin correr traslado previo ni fundamentar necesidad.',
    promptTemplate: 'Redacta un recurso de apelación contra una resolución judicial que dispone prueba de oficio sin contradictorio, invocando la violación de las reglas vinculantes del X Pleno Casatorio Civil.',
  },

  // ── CAMILA: FAMILIA ADICIONALES ──
  {
    code: 'Casación N° 3784-2019 Lima (Doctrina de Alimentos)',
    specialistId: 'camila',
    plenum: 'Doctrina Jurisprudencial Sala Civil Permanente',
    officialCourt: 'Corte Suprema de Justicia de la República',
    title: 'Presunción de necesidades del menor, capacidad productiva laboral y asignación anticipada',
    category: 'Derecho de Familia / Alimentos',
    tags: ['Alimentos', 'Asignación Anticipada', 'Presunción de Ingresos', 'Ley 31464'],
    keyPoints: [
      'Las necesidades de los hijos menores de edad se presumen iuris tantum y no requieren prueba exhaustiva de cada gasto.',
      'Alegar falta de empleo formal no exime de la obligación alimentaria: rige la presunción de capacidad productiva laboral.',
      'La asignación anticipada procede inaudita parte sin necesidad de fianza ni contracautela.',
    ],
    bindingGrounds: 'Fundamento Jurídico 6 (estándar probatorio y primacía del interés superior del niño).',
    practicalUse: 'Demandas de pensión de alimentos y solicitudes cautelares de asignación anticipada de pago inmediato.',
    promptTemplate: 'Redacta una demanda de pensión de alimentos y medida cautelar de asignación anticipada con descuento por planilla al amparo de la Ley N° 31464 y la Casación N° 3784-2019 Lima.',
  },

  // ── MARCO: ADMINISTRATIVO ADICIONALES ──
  {
    code: 'Régimen de caducidad y prescripción del PAS (TUO LPAG)',
    specialistId: 'marco',
    plenum: 'Doctrina Jurisprudencial Sala Constitucional y Social',
    officialCourt: 'Corte Suprema de Justicia de la República',
    title: 'Caducidad perentoria de 9 meses del PAS y prescripción de 4 años de la potestad sancionadora',
    category: 'Derecho Administrativo / Sancionador',
    tags: ['Caducidad PAS', 'Prescripción Sancionadora', 'D.S. 006-2026-JUS', 'Archivo'],
    keyPoints: [
      'El plazo de caducidad del Procedimiento Administrativo Sancionador (PAS) es de 9 meses desde la imputación de cargos.',
      'Operada la caducidad, el procedimiento fenece de pleno derecho y cualquier sanción posterior adolece de nulidad insubsanable.',
      'La prescripción de la potestad sancionadora opera indefectiblemente a los 4 años de cometida la infracción.',
    ],
    bindingGrounds: 'Régimen legal del TUO LPAG D.S. 006-2026-JUS (verifique numeración de artículos en SPIJ).',
    practicalUse: 'Solicitudes de caducidad y prescripción de procedimientos sancionadores iniciados por ministerios, municipalidades u organismos reguladores.',
    promptTemplate: 'Redacta un escrito solicitando la declaración de caducidad del Procedimiento Administrativo Sancionador (PAS) y archivo definitivo conforme al régimen de caducidad y prescripción del TUO de la LPAG (D.S. 006-2026-JUS); no cites casaciones salvo que consten en el contexto verificado.',
  },

  // ── FERNANDA: TRIBUTARIO ADICIONALES ──
  {
    code: 'Sentencia TC Exp. N° 03525-2021-PA/TC (Caso Maxus)',
    specialistId: 'fernanda',
    plenum: 'Precedente Constitucional Vinculante',
    officialCourt: 'Tribunal Constitucional del Perú',
    title: 'Inexigibilidad de intereses moratorios generados fuera del plazo legal de SUNAT o Tribunal Fiscal',
    category: 'Derecho Tributario / Intereses Moratorios',
    tags: ['Intereses Moratorios', 'SUNAT', 'Tribunal Fiscal', 'Precedente TC', 'Queja'],
    keyPoints: [
      'Es inconstitucional el cobro de intereses moratorios por el tiempo en que la autoridad tributaria excedió los plazos legales para resolver.',
      'El contribuyente solo responde por los intereses generados dentro del plazo fijado en el Código Tributario.',
    ],
    bindingGrounds: 'Precedente de observancia obligatoria emitido bajo el Nuevo Código Procesal Constitucional.',
    practicalUse: 'Recursos de queja ante el Tribunal Fiscal y demandas de amparo tributario para extinguir deudas por intereses moratorios abusivos.',
    promptTemplate: 'Elabora un recurso de queja tributaria invocando el precedente constitucional vinculante del TC (Exp. 03525-2021-PA/TC) para dejar sin efecto el cómputo de intereses moratorios generados en exceso del plazo legal.',
  },

  // ── ADRIANA: CORPORATIVO ADICIONALES ──
  {
    code: 'Resolución SUNARP N° 120-2022-SUNARP-TR',
    specialistId: 'adriana',
    plenum: 'Precedente Registral de Observancia Obligatoria',
    officialCourt: 'Tribunal Registral de la SUNARP',
    title: 'Validez, quórum y formalidades de Juntas Generales no presenciales y acuerdos en S.A.C.',
    category: 'Corporativo / Societario Registral',
    tags: ['Junta No Presencial', 'SAC', 'Quórum Societario', 'SUNARP', 'Aumento de Capital'],
    keyPoints: [
      'Las juntas generales no presenciales o telemáticas gozan de plena validez inscribible cuando se asegura el derecho de voz y voto (Art. 246 LGS).',
      'El derecho de preferencia en la transferencia de acciones es de orden público estatutario en la SAC y no puede ser omitido.',
    ],
    bindingGrounds: 'Precedente registral vinculante publicado en El Peruano.',
    practicalUse: 'Estructuración y redacción de actas de junta general de accionistas para inscripción registral expedita sin tachas.',
    promptTemplate: 'Redacta un acta de Junta General de Accionistas no presencial de una Sociedad Anónima Cerrada (S.A.C.) que aprueba un aumento de capital por nuevos aportes dinerarios y modificación estatutaria conforme al Art. 246° de la LGS.',
  },

  // ── RODRIGO: MINERO ADICIONALES ──
  {
    code: 'Precedente del Consejo de Minería N° 045-2023-MINEM/CM',
    specialistId: 'rodrigo',
    plenum: 'Criterio Vinculante Consejo de Minería',
    officialCourt: 'Consejo de Minería - Ministerio de Energía y Minas',
    title: 'Superposición de petitorios mineros, áreas de exclusión urbana y prelación registral en cuadrículas WGS84',
    category: 'Derecho Minero / Concesiones',
    tags: ['Petitorio Minero', 'Superposición', 'Cuadrículas WGS84', 'INGEMMET', 'Revisión'],
    keyPoints: [
      'Rige el principio de prelación temporal estricta ("primero en el tiempo, primero en el derecho") sobre la cuadrícula del SIDEMCAT.',
      'Los petitorios sobre áreas urbanas o naturales protegidas sin autorización previa son nulos de pleno derecho y objeto de cancelación liminar.',
    ],
    bindingGrounds: 'Criterio uniforme de observancia administrativa en resoluciones del Consejo de Minería.',
    practicalUse: 'Oposición a petitorios mineros superpuestos y recursos de revisión ante el Consejo de Minería.',
    promptTemplate: 'Elabora un escrito de oposición a un petitorio minero ante el INGEMMET por superposición indebida en cuadrículas catastrales preexistentes bajo el TUO de la Ley General de Minería y el precedente del Consejo de Minería.',
  },
]

export const REFORMS: Reform[] = [
  // ── SEBASTIÁN (PENAL) ──
  {
    lawCode: 'Decreto Legislativo N° 1585',
    specialistId: 'sebastian',
    affectedNorm: 'Código Procesal Penal (DL 957) & Código Penal (DL 635)',
    date: 'Noviembre 2023 - Vigente 2026',
    badge: 'PRISIÓN PREVENTIVA',
    tags: ['Prisión Preventiva', 'Vigilancia Electrónica', 'Pena Suspendida'],
    articles: 'Arts. 268, 268-A, 283 NCPP / Arts. 52, 57 CP',
    summary:
      '1. Prisión preventiva exige pena privativa superior a 5 años (antes 4 años).\n' +
      '2. Art. 268-A NCPP: Prioridad OBLIGATORIA de vigilancia electrónica si la pena es hasta 7 años.\n' +
      '3. Art. 283 NCPP: Revisión de oficio semestral obligatoria por el juez de investigación preparatoria.\n' +
      '4. Art. 57 CP: Suspensión de pena privativa de la libertad ampliada hasta 5 años.',
    promptTemplate: 'Redacta un recurso de apelación contra el auto de prisión preventiva invocando la reforma del D. Leg. 1585 (Art. 268 modificado y deber de aplicar vigilancia electrónica Art. 268-A).',
  },
  {
    lawCode: 'Arts. IX T.P., 71.2.c y 80°-85° NCPP',
    specialistId: 'sebastian',
    affectedNorm: 'Código Procesal Penal (DL 957) — Defensa Técnica & Abogado',
    date: 'Vigente 2026',
    badge: 'DEFENSA TÉCNICA',
    tags: ['Derecho de Defensa', 'Abogado Defensor', 'Art. 80 NCPP', 'Art. 84 NCPP'],
    articles: 'Arts. IX T.P., 71.2.c, 80, 84, 85 NCPP (Nota: Art. 62 es Exclusión del Fiscal)',
    summary:
      '1. Art. IX Título Preliminar y Art. 80° NCPP: La defensa técnica es un derecho inviolable e irrenunciable.\n' +
      '2. Art. 71.2.c NCPP: Derecho a ser asistido por abogado defensor desde los primeros actos y en toda diligencia.\n' +
      '3. Art. 84° NCPP: Prerrogativas y derechos del Abogado Defensor.\n' +
      '⚠️ ADVERTENCIA: En el NCPP peruano el Art. 62° regula la EXCLUSIÓN DEL FISCAL (reemplazo por Fiscal Superior), no la defensa técnica.',
    promptTemplate: 'Formula un escrito de personamiento formal y designación de abogado defensor al amparo del Art. IX del Título Preliminar y Arts. 71° num. 2 lit. c y 84° del Código Procesal Penal, solicitando copias de los actuados.',
  },
  {
    lawCode: 'Ley N° 32130',
    specialistId: 'sebastian',
    affectedNorm: 'Código Procesal Penal — Investigación Preliminar',
    date: 'Octubre 2024 - Vigente 2026',
    badge: 'PNP & FISCALÍA',
    tags: ['Investigación PNP', 'Fiscalía', 'Diligencias Preliminares'],
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
    tags: ['Crimen Organizado', 'Allanamiento', 'Abogado Defensor'],
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
    tags: ['Extorsión', 'Gota a Gota', 'Ciberdelito', 'Sicariato'],
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
    tags: ['Cuantías Laborales', 'Jaz de Paz Letrado', '70 URP'],
    articles: 'Competencia JPLL hasta 70 URP (S/ 38,500)',
    summary:
      'Reforma las competencias judiciales laborales: los Juzgados de Paz Letrados Laborales conocen pretensiones hasta 70 URP e indemnizaciones por daños hasta 60 URP.',
    promptTemplate: 'Determina la vía procesal y el juzgado competente para demandar indemnización laboral bajo las cuantías vigentes de la Ley N° 32155.',
  },
  {
    lawCode: 'D.S. N° 015-2026-TR',
    specialistId: 'valentina',
    affectedNorm: 'Remuneración Mínima Vital y Asignación Familiar',
    date: 'Octubre 2026 - Vigente Oficial',
    badge: 'SUELDO MÍNIMO',
    tags: ['RMV S/ 1,230', 'Asignación Familiar S/ 123', 'Beneficios'],
    articles: 'RMV S/ 1,230 / Asignación Familiar S/ 123',
    summary: 'Establece la RMV oficial en S/ 1,230 mensuales y la Asignación Familiar legal en el 10% (S/ 123.00).',
    promptTemplate: 'Calcula la liquidación de beneficios sociales aplicando la RMV vigente de S/ 1,230 y la asignación familiar conforme al D.S. 015-2026-TR.',
  },

  // ── DIEGO (CIVIL) ──
  {
    lawCode: 'Ley N° 30933 y D.S. 013-2019-JUS',
    specialistId: 'diego',
    affectedNorm: 'Desalojo Notarial con Ejecución Judicial',
    date: 'Vigente 2026',
    badge: 'DESALOJO EXPRESS',
    tags: ['Desalojo Notarial', 'Allanamiento Futuro', 'Inquilinos'],
    articles: 'Arts. 4, 5, 6, 7 Ley 30933 / Art. 594 CPC',
    summary:
      'Procedimiento sumarísimo para desalojar inquilinos por falta de pago o vencimiento de contrato en menos de 30 días, requiriendo contrato notarial con cláusula de allanamiento a futuro.',
    promptTemplate: 'Redacta un contrato de arrendamiento blindado con cláusula de allanamiento a futuro (Art. 594 CPC) y sometimiento expreso a la Ley N° 30933 de Desalojo Notarial.',
  },
  {
    lawCode: 'Ley N° 32430',
    specialistId: 'diego',
    affectedNorm: 'Ley de Arrendamiento Justo (TUO Ley Impuesto Renta)',
    date: '1 de Enero de 2026 - Vigente',
    badge: 'ARRENDAMIENTO JUSTO',
    tags: ['Impuesto a la Renta', 'Criterio Percibido', 'Alquiler'],
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
    tags: ['Tenencia Compartida', 'Coparentalidad', 'Hijos'],
    articles: 'Arts. 81, 82, 83, 84 CNA',
    summary:
      'Establece la Tenencia Compartida como regla general obligatoria para ambos progenitores, velando por el interés superior del niño y equilibrando el tiempo de cuidado.',
    promptTemplate: 'Redacta una demanda de tenencia compartida bajo el amparo de la Ley N° 31590 acreditando la aptitud parental del padre y arraigo familiar.',
  },
  {
    lawCode: 'Ley N° 30364 y D.S. 009-2019-MIMP',
    specialistId: 'camila',
    affectedNorm: 'Prevención y Sanción de Violencia Familiar',
    date: 'Vigente 2026',
    badge: 'VIOLENCIA FAMILIAR',
    tags: ['Medidas de Protección', 'Violencia 24-48h', 'CEM'],
    articles: 'Medidas de Protección en 24-48h',
    summary:
      'Procedimiento especial urgente para dictar medidas de protección inmediatas (retiro del agresor, impedimento de acercamiento) sin audiencia previa en caso de riesgo severo.',
    promptTemplate: 'Solicita medidas de protección urgentes de retiro del agresor y prohibición de comunicación al amparo de la Ley N° 30364.',
  },

  // ── MARCO (ADMINISTRATIVO) ──
  {
    lawCode: 'D.S. N° 006-2026-JUS (TUO LPAG)',
    specialistId: 'marco',
    affectedNorm: 'Ley del Procedimiento Administrativo General (Ley 27444)',
    date: '30 de Abril de 2026 - Vigente',
    badge: 'ADMINISTRATIVO',
    tags: ['LPAG', 'TUO 2026', 'Derogó DS 004-2019', 'Apelación'],
    articles: 'Arts. 209-228 LPAG (Derogó formalmente al DS 004-2019-JUS)',
    summary:
      'Nuevo Texto Único Ordenado que deroga formalmente al D.S. 004-2019-JUS. Prohibido citar el D.S. 004-2019-JUS en escritos administrativos dirigidos a entidades públicas.',
    promptTemplate: 'Redacta un recurso de apelación administrativa bajo el nuevo TUO de la Ley 27444 aprobado por Decreto Supremo N° 006-2026-JUS.',
  },
  {
    lawCode: 'Ley N° 32069 y D.S. 001-2026-EF',
    specialistId: 'marco',
    affectedNorm: 'Ley General de Contrataciones Públicas',
    date: 'Abril 2025 - Vigente 2026',
    badge: 'CONTRATACIONES',
    tags: ['OECE', 'TCP', 'Licitaciones', 'Extinción OSCE'],
    articles: 'OECE / Tribunal de Contrataciones Públicas (TCP)',
    summary:
      'Deroga totalmente la Ley 30225 y extingue al OSCE. Rige el Organismo de Contrataciones Eficientes (OECE) y el Tribunal de Contrataciones Públicas (TCP).',
    promptTemplate: 'Elabora un recurso de apelación de adjudicación de buena pro ante el Tribunal de Contrataciones Públicas (TCP) conforme a la Ley N° 32069.',
  },

  // ── FERNANDA (TRIBUTARIO) ──
  {
    lawCode: 'Decreto Legislativo N° 1529',
    specialistId: 'fernanda',
    affectedNorm: 'Ley de Bancarización (Ley 28194)',
    date: 'Vigente 2026',
    badge: 'BANCARIZACIÓN',
    tags: ['Bancarización', 'S/ 2,000', 'Crédito Fiscal', 'SUNAT'],
    articles: 'Obligatoriedad desde S/ 2,000 o US$ 500',
    summary:
      'Exige uso obligatorio de medios de pago bancarios para operaciones desde S/ 2,000 o US$ 500; su inobservancia desconoce costo, gasto y crédito fiscal ante SUNAT.',
    promptTemplate: 'Sustenta la deducción tributaria de facturas acreditando los medios de pago bancarios exigidos por el D. Leg. 1529 ante fiscalización SUNAT.',
  },

  // ── ADRIANA (CORPORATIVO) ──
  {
    lawCode: 'Ley N° 30424 y D.S. 002-2019-JUS',
    specialistId: 'adriana',
    affectedNorm: 'Responsabilidad Penal de Personas Jurídicas',
    date: 'Vigente 2026',
    badge: 'COMPLIANCE',
    tags: ['Compliance Penal', 'Prevención de Delitos', 'Empresas'],
    articles: 'Modelos de Prevención Eximentes',
    summary:
      'Regula la responsabilidad de las empresas por delitos de cohecho, lavado de activos y colusión, eximiéndolas si cuentan con un modelo de prevención eficaz antes del hecho.',
    promptTemplate: 'Estructura una matriz de riesgos penales y compliance corporativo conforme a los requisitos de la Ley N° 30424.',
  },

  // ── RODRIGO (MINERO) ──
  {
    lawCode: 'TUPA INGEMMET 2026 & RCD OEFA',
    specialistId: 'rodrigo',
    affectedNorm: 'Procedimientos Mineros & Fiscalización Ambiental',
    date: 'Vigente 2026',
    badge: 'INGEMMET & OEFA',
    tags: ['Petitorios Mineros', 'OEFA', 'REINFO', 'Medio Ambiente'],
    articles: 'Petitorios Mineros / PAS Ambiental / REINFO',
    summary:
      'Regula la tramitación electrónica de petitorios mineros, plazos de fiscalización ambiental y causales de exclusión de REINFO.',
    promptTemplate: 'Redacta un descargo técnico ante una imputación de infracción ambiental minera del OEFA al amparo del RCD de fiscalización.',
  },

  // ── SEBASTIÁN (PENAL REFORMA ADICIONAL) ──
  {
    lawCode: 'Código de Ejecución Penal (D. Leg. 654 y D. Leg. 1585)',
    specialistId: 'sebastian',
    affectedNorm: 'Beneficios Penitenciarios y Redención de Pena',
    date: 'Vigente 2026',
    badge: 'BENEFICIOS PENITENCIARIOS',
    tags: ['Semilibertad', 'Liberación Condicional', 'Redención 2x1', 'D. Leg. 1585'],
    articles: 'Arts. 44-57 CEP / D. Leg. 1585',
    summary:
      'Semilibertad al cumplir 1/3 o 1/2 de pena según el tipo delictivo, y liberación condicional a los 2/3. Redención por trabajo o estudio a razón de 2x1 o 3x1.',
    promptTemplate: 'Elabora una solicitud de beneficio penitenciario de semilibertad o redención de pena por trabajo y educación conforme al Código de Ejecución Penal y el D. Leg. 1585.',
  },

  // ── VALENTINA (LABORAL REFORMA ADICIONAL) ──
  {
    lawCode: 'Leyes N° 27735 y 30334 & Ley N° 31572',
    specialistId: 'valentina',
    affectedNorm: 'Gratificaciones Inafectas & Ley de Teletrabajo',
    date: 'Vigente 2026',
    badge: 'BENEFICIOS & TELETRABAJO',
    tags: ['Gratificaciones', 'Bono 9% Essalud', 'Teletrabajo', 'Desconexión Digital'],
    articles: 'Ley 27735 / Ley 30334 / Ley 31572 / D.S. 002-2023-TR',
    summary:
      'Gratificaciones de julio y diciembre libres de aportes previsionales con bonificación extraordinaria del 9% (Essalud) o 6.75% (EPS). En teletrabajo: desconexión digital de 12 horas continuas y compensación económica de internet y energía.',
    promptTemplate: 'Liquida las gratificaciones truncas con bonificación extraordinaria del 9% (Ley 30334) y reclama reintegros de gastos de teletrabajo bajo la Ley N° 31572.',
  },

  // ── DIEGO (CIVIL REFORMA ADICIONAL) ──
  {
    lawCode: 'Ley N° 27157 & Arts. 1428-1430 Código Civil',
    specialistId: 'diego',
    affectedNorm: 'Propiedad Horizontal & Resolución Contractual',
    date: 'Vigente 2026',
    badge: 'PROPIEDAD HORIZONTAL & RESOLUCIÓN',
    tags: ['Propiedad Horizontal', 'Junta de Propietarios', 'Resolución de Pleno Derecho', 'Cláusula Resolutoria'],
    articles: 'Ley 27157 / D.S. 035-2006-VIVIENDA / Arts. 1428, 1429, 1430 CC',
    summary:
      'Mérito ejecutivo judicial de liquidaciones de cuotas de mantenimiento emitidas por la Junta de Propietarios. Cláusula resolutoria expresa (Art. 1430 CC) para resolver contratos de pleno derecho sin requerir 15 días.',
    promptTemplate: 'Redacta una carta notarial comunicando la resolución de pleno derecho del contrato de compraventa al amparo del Art. 1430° del Código Civil por incumplimiento de pago de cuotas.',
  },

  // ── CAMILA (FAMILIA REFORMA ADICIONAL) ──
  {
    lawCode: 'Ley N° 28970 (REDAM) & Ley N° 29227 (Divorcio Rápido)',
    specialistId: 'camila',
    affectedNorm: 'Registro de Deudores Alimentarios & Divorcio Notarial/Municipal',
    date: 'Vigente 2026',
    badge: 'REDAM & DIVORCIO NOTARIAL',
    tags: ['REDAM', 'Deudor Moroso', 'Divorcio Rápido', 'Separación Convencional'],
    articles: 'Ley 28970 / Ley 30795 / Ley 29227 / D.S. 009-2008-JUS',
    summary:
      'Inscripción de oficio en el REDAM ante 3 cuotas alimentarias impagas, generando reporte a centrales de riesgo y retención en cuentas. En divorcio rápido: disolución en menos de 90 días con separación convencional y cese de convivencia.',
    promptTemplate: 'Solicita al Juez de Paz Letrado la inscripción del demandado en el Registro de Deudores Alimentarios Morosos (REDAM) y la retención judicial de sus cuentas bancarias bajo la Ley N° 28970.',
  },

  // ── MARCO (ADMINISTRATIVO REFORMA ADICIONAL) ──
  {
    lawCode: 'Ley N° 27584 (TUO Proceso Contencioso D.S. 011-2019-JUS)',
    specialistId: 'marco',
    affectedNorm: 'Impugnación Judicial de Resoluciones Administrativas',
    date: 'Vigente 2026',
    badge: 'CONTENCIOSO ADMINISTRATIVO',
    tags: ['Contencioso Administrativo', 'Plazo 3 Meses', 'Nulidad de Resolución', 'Agotamiento de Vía'],
    articles: 'Arts. 4, 18, 28 D.S. 011-2019-JUS / TUO Ley 27584',
    summary:
      'Plazo perentorio de caducidad de 3 meses para demandar la nulidad de resoluciones administrativas firmes que agotan la vía gubernativa, exigiendo restablecimiento del derecho conculcado.',
    promptTemplate: 'Redacta una demanda contencioso-administrativa al amparo del TUO de la Ley N° 27584 (D.S. 011-2019-JUS) solicitando la nulidad total de una resolución administrativa sancionadora.',
  },

  // ── FERNANDA (TRIBUTARIO REFORMA ADICIONAL) ──
  {
    lawCode: 'Arts. 43-44 TUO Código Tributario & D. Leg. 1535',
    specialistId: 'fernanda',
    affectedNorm: 'Prescripción de Deudas Tributarias & Perfil de Cumplimiento',
    date: 'Vigente 2026',
    badge: 'PRESCRIPCIÓN & PERFIL SUNAT',
    tags: ['Prescripción 4 Años', 'No Declarantes 6 Años', 'Perfil de Cumplimiento', 'Extinción'],
    articles: 'Arts. 43, 44, 45 Código Tributario / D. Leg. 1535',
    summary:
      'Prescripción de la facultad de SUNAT para determinar y exigir el pago a los 4 años (declarantes) o 6 años (no declarantes). Se prohíbe el inicio o prosecución de cobranza coactiva de periodos tributarios prescritos.',
    promptTemplate: 'Redacta una solicitud de prescripción de deuda tributaria ante SUNAT al amparo de los Arts. 43° y 44° del TUO del Código Tributario para extinguir valores emitidos fuera del plazo legal.',
  },

  // ── ADRIANA (CORPORATIVO REFORMA ADICIONAL) ──
  {
    lawCode: 'Arts. 234-248 LGS Ley 26887 & Ley N° 31112 (M&A)',
    specialistId: 'adriana',
    affectedNorm: 'Régimen de S.A.C. & Control Previo Antitrust INDECOPI',
    date: 'Vigente 2026',
    badge: 'SAC & CONTROL DE FUSIONES',
    tags: ['SAC', 'Derecho de Preferencia', 'Pactos Parasocietarios', 'M&A Antitrust'],
    articles: 'Arts. 234-248 LGS / Art. 8 LGS / Ley 31112',
    summary:
      'Régimen especial de Sociedad Anónima Cerrada (sin directorio estatutario obligatorio, juntas no presenciales y derecho de adquisición preferente). Notificación previa a INDECOPI si transacciones M&A superan 118,000 UIT.',
    promptTemplate: 'Elabora un convenio de accionistas (pacto de socios) al amparo del Art. 8° y 237° de la Ley General de Sociedades con cláusulas de tag along, drag along y derecho de preferencia en S.A.C.',
  },

  // ── RODRIGO (MINERO REFORMA ADICIONAL) ──
  {
    lawCode: 'D.S. 020-2020-EM & Ley del SEIA (Ley 27446)',
    specialistId: 'rodrigo',
    affectedNorm: 'Procedimientos Mineros & Certificación Ambiental SENACE',
    date: 'Vigente 2026',
    badge: 'PROCEDIMIENTOS & SEIA',
    tags: ['Procedimientos Mineros', 'SENACE', 'DIA', 'EIA-sd', 'EIA-d', 'Certificación'],
    articles: 'Arts. 12-30 D.S. 020-2020-EM / Ley 27446 / D.S. 019-2009-MINAM',
    summary:
      'Secuencia obligatoria de autorizaciones mineras: Instrumento de Gestión Ambiental aprobado (DIA, EIA-sd o EIA-d), autorización superficial, licencia de agua ANA y Autorización de Inicio de Actividades.',
    promptTemplate: 'Prepara un informe de viabilidad legal ambiental y ruta crítica de autorizaciones mineras ante el INGEMMET, SENACE y MINEM bajo el D.S. 020-2020-EM y la Ley del SEIA.',
  },
]

export default function SpijModal({
  isOpen,
  onClose,
  currentAgentId,
  lockSpecialist = false,
  onInsertPrompt,
  onSelectPromptAndAgent,
}: SpijModalProps) {
  // If lockSpecialist is true or currentAgentId points to a specific lawyer, strictly lock to that specialist!
  const isLocked = Boolean(lockSpecialist || (currentAgentId && currentAgentId !== 'all'))
  const lockedSpecialistId = currentAgentId && currentAgentId !== 'all' ? currentAgentId : 'all'

  const [selectedSpecialist, setSelectedSpecialist] = useState<string>(
    isLocked ? lockedSpecialistId : currentAgentId || 'all'
  )
  const [tab, setTab] = useState<'plenaries' | 'reforms' | 'favorites' | 'guide'>('plenaries')
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedType, setCopiedType] = useState<'quote' | 'prompt' | null>(null)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('spij_favorites')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Whenever modal opens or agent changes, sync selectedSpecialist
  useEffect(() => {
    if (isLocked) {
      setSelectedSpecialist(lockedSpecialistId)
      setSelectedTag(null)
    } else if (currentAgentId && SPECIALISTS.some((s) => s.id === currentAgentId)) {
      setSelectedSpecialist(currentAgentId)
    }
  }, [currentAgentId, isOpen, isLocked, lockedSpecialistId])

  // The active specialist target (in locked mode, strictly forced to lockedSpecialistId)
  const activeSpecialistId = isLocked ? lockedSpecialistId : selectedSpecialist

  const currentSpecialistInfo = useMemo(
    () => SPECIALISTS.find((s) => s.id === activeSpecialistId) || SPECIALISTS[0],
    [activeSpecialistId]
  )

  // Save favorites to localStorage
  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id)
      const updated = exists ? prev.filter((item) => item !== id) : [...prev, id]
      try {
        localStorage.setItem('spij_favorites', JSON.stringify(updated))
      } catch (e) {
        console.error('Failed to save favorites', e)
      }
      return updated
    })
  }

  const normSearch = search.toLowerCase().trim()

  // Collect available topic tags strictly for the active specialist
  const availableTags = useMemo(() => {
    const set = new Set<string>()
    PLENARIES.forEach((p) => {
      if (activeSpecialistId === 'all' || p.specialistId === activeSpecialistId) {
        p.tags.forEach((t) => set.add(t))
      }
    })
    REFORMS.forEach((r) => {
      if (activeSpecialistId === 'all' || r.specialistId === activeSpecialistId) {
        r.tags.forEach((t) => set.add(t))
      }
    })
    return Array.from(set)
  }, [activeSpecialistId])

  // Reset tag if it does not belong to the current specialist
  useEffect(() => {
    if (selectedTag && !availableTags.includes(selectedTag)) {
      setSelectedTag(null)
    }
  }, [availableTags, selectedTag])

  // Filtered Plenaries (Strictly filtered when in locked specialist mode)
  const filteredPlenaries = useMemo(() => {
    return PLENARIES.filter((p) => {
      const matchSpecialist =
        activeSpecialistId === 'all' ? true : p.specialistId === activeSpecialistId
      const matchTag = !selectedTag || p.tags.includes(selectedTag)
      const matchSearch =
        !normSearch ||
        p.code.toLowerCase().includes(normSearch) ||
        p.title.toLowerCase().includes(normSearch) ||
        p.category.toLowerCase().includes(normSearch) ||
        p.bindingGrounds.toLowerCase().includes(normSearch) ||
        p.practicalUse.toLowerCase().includes(normSearch) ||
        p.keyPoints.some((kp) => kp.toLowerCase().includes(normSearch))
      return matchSpecialist && matchTag && matchSearch
    })
  }, [activeSpecialistId, selectedTag, normSearch])

  // Filtered Reforms (Strictly filtered when in locked specialist mode)
  const filteredReforms = useMemo(() => {
    return REFORMS.filter((r) => {
      const matchSpecialist =
        activeSpecialistId === 'all' ? true : r.specialistId === activeSpecialistId
      const matchTag = !selectedTag || r.tags.includes(selectedTag)
      const matchSearch =
        !normSearch ||
        r.lawCode.toLowerCase().includes(normSearch) ||
        r.affectedNorm.toLowerCase().includes(normSearch) ||
        r.summary.toLowerCase().includes(normSearch) ||
        r.badge.toLowerCase().includes(normSearch) ||
        r.articles.toLowerCase().includes(normSearch)
      return matchSpecialist && matchTag && matchSearch
    })
  }, [activeSpecialistId, selectedTag, normSearch])

  // Favorite Items (Filtered to active specialist when in locked mode)
  const favoritePlenaries = useMemo(() => {
    return PLENARIES.filter((p) => {
      const isFav = favorites.includes(p.code)
      const matchSpec = activeSpecialistId === 'all' ? true : p.specialistId === activeSpecialistId
      return isFav && matchSpec
    })
  }, [favorites, activeSpecialistId])

  const favoriteReforms = useMemo(() => {
    return REFORMS.filter((r) => {
      const isFav = favorites.includes(r.lawCode)
      const matchSpec = activeSpecialistId === 'all' ? true : r.specialistId === activeSpecialistId
      return isFav && matchSpec
    })
  }, [favorites, activeSpecialistId])

  if (!isOpen) return null

  const handleCopyQuote = (p: Plenary) => {
    const formattedQuote = `CORTE SUPREMA DE JUSTICIA DE LA REPÚBLICA — ${p.code}: "${p.title}". ${p.bindingGrounds}. Doctrina jurisprudencial de observancia obligatoria (Criterio vinculante).`
    navigator.clipboard.writeText(formattedQuote)
    setCopiedCode(p.code)
    setCopiedType('quote')
    setTimeout(() => {
      setCopiedCode(null)
      setCopiedType(null)
    }, 2500)
  }

  const handleCopyReform = (rf: Reform) => {
    const formattedReform = `BASE NORMATIVA SPIJ (MINJUSDH) — ${rf.lawCode}: ${rf.affectedNorm} (${rf.articles}) [${rf.date}]. ${rf.summary}`
    navigator.clipboard.writeText(formattedReform)
    setCopiedCode(rf.lawCode)
    setCopiedType('quote')
    setTimeout(() => {
      setCopiedCode(null)
      setCopiedType(null)
    }, 2500)
  }

  const handleUsePrompt = (promptText: string, specialistId: string) => {
    if (onInsertPrompt) {
      onInsertPrompt(promptText, specialistId)
      onClose()
      return
    }
    if (onSelectPromptAndAgent) {
      onSelectPromptAndAgent(promptText, specialistId)
      onClose()
      return
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          background: 'linear-gradient(180deg, #181818 0%, #121212 100%)',
          borderColor: isLocked ? `${currentSpecialistInfo.color}55` : 'rgba(201,168,76,0.30)',
          color: '#ffffff',
          boxShadow: isLocked
            ? `0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px -10px ${currentSpecialistInfo.color}33`
            : '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px -10px rgba(201,168,76,0.15)',
        }}
      >
        {/* Top Luxury Header */}
        <div
          className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b flex-shrink-0"
          style={{
            borderColor: 'rgba(255,255,255,0.08)',
            background: isLocked
              ? `linear-gradient(90deg, ${currentSpecialistInfo.bgColor} 0%, #171717 100%)`
              : 'linear-gradient(90deg, #1c1a14 0%, #171717 100%)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative shadow-inner"
              style={{
                background: isLocked
                  ? `linear-gradient(135deg, ${currentSpecialistInfo.color}33 0%, rgba(20,20,20,0.6) 100%)`
                  : 'linear-gradient(135deg, rgba(201,168,76,0.25) 0%, rgba(201,168,76,0.08) 100%)',
                border: `1px solid ${isLocked ? currentSpecialistInfo.color : 'rgba(201,168,76,0.40)'}`,
                color: isLocked ? currentSpecialistInfo.accentColor : '#c9a84c',
              }}
            >
              <Scale size={20} className="drop-shadow" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#34d17a] border-2 border-[#1c1a14]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[14px] sm:text-[16px] font-bold text-white tracking-tight flex items-center gap-1.5">
                  {isLocked ? (
                    <>
                      Base Jurídica SPIJ · Despacho de{' '}
                      <span style={{ color: currentSpecialistInfo.accentColor }}>
                        {currentSpecialistInfo.name}
                      </span>
                    </>
                  ) : (
                    'Base Jurídica SPIJ & Acuerdos Plenarios'
                  )}
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center gap-1 flex-shrink-0 uppercase tracking-wider"
                  style={{
                    background: isLocked ? `${currentSpecialistInfo.color}22` : 'rgba(52,209,122,0.12)',
                    border: `1px solid ${isLocked ? currentSpecialistInfo.color + '44' : 'rgba(52,209,122,0.30)'}`,
                    color: isLocked ? currentSpecialistInfo.accentColor : '#34d17a',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34d17a] animate-pulse" />
                  {isLocked ? `${currentSpecialistInfo.badge} · VIGENCIA 2026` : 'VIGENCIA 2026 OFICIAL'}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-white/60 font-light truncate">
                {isLocked
                  ? `Doctrina Vinculante de la Corte Suprema y Leyes Oficiales exclusivas de ${currentSpecialistInfo.role}`
                  : 'Doctrina Vinculante de la Corte Suprema del Perú · Leyes Actualizadas del MINJUSDH · Citas Procesales'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 ml-2"
          >
            <X size={18} />
          </button>
        </div>

        {/* Specialist Bar: LOCKED vs GENERAL EXPLORER */}
        {isLocked ? (
          /* Locked specialist single banner */
          <div
            className="px-4 sm:px-6 py-2.5 border-b flex items-center justify-between flex-shrink-0"
            style={{
              background: `linear-gradient(90deg, ${currentSpecialistInfo.bgColor} 0%, #151515 100%)`,
              borderColor: `${currentSpecialistInfo.color}33`,
            }}
          >
            <div className="flex items-center gap-3">
              {currentSpecialistInfo.image && (
                <img
                  src={currentSpecialistInfo.image}
                  alt={currentSpecialistInfo.name}
                  className="w-7 h-7 rounded-full object-cover border shadow-sm flex-shrink-0"
                  style={{ borderColor: currentSpecialistInfo.color }}
                />
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12px] font-bold text-white">
                  Despacho de {currentSpecialistInfo.name}
                </span>
                <span
                  className="px-2 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider"
                  style={{
                    background: `${currentSpecialistInfo.color}25`,
                    color: currentSpecialistInfo.color,
                    border: `1px solid ${currentSpecialistInfo.color}45`,
                  }}
                >
                  {currentSpecialistInfo.badge}
                </span>
                <span className="text-[11px] text-white/60 font-light hidden md:inline">
                  — {currentSpecialistInfo.role}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-white/60 font-light">
              <Lock size={11} className="text-[#c9a84c]" />
              <span className="hidden sm:inline">Filtrado exclusivamente para este abogado</span>
            </div>
          </div>
        ) : (
          /* General Explorer: All specialists carousel */
          <div
            className="px-4 sm:px-6 py-2.5 border-b overflow-x-auto custom-scrollbar flex items-center gap-2 flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#141414' }}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-1 flex-shrink-0 mr-1">
              <UserCheck size={11} className="text-[#c9a84c]" />
              Especialista:
            </span>

            {SPECIALISTS.map((sp) => {
              const isSelected = selectedSpecialist === sp.id
              const isCurrentInChat = currentAgentId === sp.id
              return (
                <button
                  key={sp.id}
                  onClick={() => {
                    setSelectedSpecialist(sp.id)
                    setSelectedTag(null)
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all whitespace-nowrap flex items-center gap-2 flex-shrink-0 group ${
                    isSelected
                      ? 'shadow-md scale-[1.02]'
                      : 'bg-white/[0.03] border border-white/5 text-white/60 hover:text-white hover:border-white/15'
                  }`}
                  style={{
                    background: isSelected
                      ? sp.id === 'all'
                        ? 'linear-gradient(135deg, #c9a84c 0%, #a68434 100%)'
                        : sp.color
                      : undefined,
                    color: isSelected ? '#ffffff' : undefined,
                    borderColor: isSelected ? 'rgba(255,255,255,0.3)' : undefined,
                  }}
                >
                  {sp.image ? (
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20 flex-shrink-0 bg-black/40">
                      <img
                        src={sp.image}
                        alt={sp.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.15)' }}
                    >
                      ★
                    </div>
                  )}

                  <span className={isSelected ? 'font-bold' : 'font-normal'}>{sp.name}</span>

                  {isCurrentInChat && sp.id !== 'all' && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#34d17a]'}`}
                      title="Abogado activo en el chat"
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Search, Tabs & Quick Tag Filters Bar */}
        <div
          className="px-4 sm:px-6 py-3 border-b flex flex-col gap-2.5 flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#161616' }}
        >
          {/* Main Controls Row: Tabs + Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Tab Selector */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/10 overflow-x-auto custom-scrollbar">
              <button
                onClick={() => setTab('plenaries')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'plenaries'
                    ? 'bg-[#c9a84c] text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Gavel size={12} />
                <span>Acuerdos Plenarios</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab === 'plenaries' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {filteredPlenaries.length}
                </span>
              </button>

              <button
                onClick={() => setTab('reforms')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'reforms'
                    ? 'bg-[#c9a84c] text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <BookOpen size={12} />
                <span>Leyes SPIJ Vigentes</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    tab === 'reforms' ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {filteredReforms.length}
                </span>
              </button>

              <button
                onClick={() => setTab('favorites')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'favorites'
                    ? 'bg-[#c9a84c] text-black font-bold shadow-sm'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Star size={12} className={favorites.length > 0 ? 'text-[#f59e0b] fill-[#f59e0b]' : ''} />
                <span>Favoritos</span>
                {favorites.length > 0 && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                      tab === 'favorites' ? 'bg-black/20 text-black' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                    }`}
                  >
                    {favoritePlenaries.length + favoriteReforms.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setTab('guide')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  tab === 'guide'
                    ? 'bg-white/20 text-white font-bold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <ShieldCheck size={12} className="text-[#34d17a]" />
                <span>{isLocked ? 'Rigor del Despacho' : 'Rigor SPIJ 2026'}</span>
              </button>
            </div>

            {/* Live Search Bar */}
            {tab !== 'guide' && (
              <div className="relative flex-1 sm:max-w-xs">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    isLocked
                      ? `Buscar en despacho de ${currentSpecialistInfo.name}...`
                      : 'Buscar por artículo, pleno, delito o ley...'
                  }
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl text-[11px] bg-black/60 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Subtopic Chips Row */}
          {tab !== 'guide' && availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1">
              <span className="text-[9px] font-semibold text-white/40 flex items-center gap-1 flex-shrink-0 uppercase mr-0.5">
                <Filter size={10} className="text-[#c9a84c]" />
                Tema:
              </span>

              <button
                onClick={() => setSelectedTag(null)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all flex-shrink-0 ${
                  selectedTag === null
                    ? 'bg-white/20 text-white font-semibold'
                    : 'bg-white/[0.03] text-white/50 hover:text-white'
                }`}
              >
                Todos los temas
              </button>

              {availableTags.map((tag) => {
                const isActive = selectedTag === tag
                return (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(isActive ? null : tag)}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium transition-all flex-shrink-0 flex items-center gap-1 ${
                      isActive
                        ? 'bg-[#c9a84c]/20 border border-[#c9a84c]/50 text-[#c9a84c] font-semibold'
                        : 'bg-white/[0.03] border border-white/5 text-white/60 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <span>{tag}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
          {/* Active Specialist Banner (ONLY in general explorer, not when locked in specialist chat) */}
          {!isLocked && selectedSpecialist !== 'all' && currentSpecialistInfo && (
            <div
              className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
              style={{
                background: `linear-gradient(90deg, ${currentSpecialistInfo.bgColor} 0%, rgba(20,20,20,0.8) 100%)`,
                borderColor: `${currentSpecialistInfo.color}33`,
              }}
            >
              <div className="flex items-center gap-3">
                {currentSpecialistInfo.image && (
                  <img
                    src={currentSpecialistInfo.image}
                    alt={currentSpecialistInfo.name}
                    className="w-9 h-9 rounded-full object-cover border-2 shadow-sm flex-shrink-0"
                    style={{ borderColor: currentSpecialistInfo.color }}
                  />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-white">
                      Despacho de {currentSpecialistInfo.name}
                    </span>
                    <span
                      className="px-2 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase"
                      style={{
                        background: `${currentSpecialistInfo.color}22`,
                        color: currentSpecialistInfo.color,
                        border: `1px solid ${currentSpecialistInfo.color}44`,
                      }}
                    >
                      {currentSpecialistInfo.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/60 font-light">
                    {currentSpecialistInfo.role} · Normativa y doctrina vinculante calibrada para redactar demandas y contestaciones.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedSpecialist('all')
                  setSelectedTag(null)
                }}
                className="text-[11px] font-medium hover:underline self-start sm:self-center"
                style={{ color: currentSpecialistInfo.color }}
              >
                Ver todos los abogados
              </button>
            </div>
          )}

          {/* TAB 1: ACUERDOS PLENARIOS */}
          {tab === 'plenaries' && (
            <>
              {filteredPlenaries.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
                  <Gavel size={32} className="mx-auto text-white/20 mb-2" />
                  <p className="text-white/60 text-[13px] font-medium">No se encontraron Acuerdos Plenarios</p>
                  <p className="text-white/40 text-[11px] mt-1 max-w-md mx-auto font-light">
                    {isLocked
                      ? `No hay acuerdos que coincidan con la búsqueda dentro del despacho de ${currentSpecialistInfo.name}.`
                      : 'Prueba cambiando los términos de búsqueda o seleccionando otro especialista.'}
                  </p>
                  {(search || selectedTag) && (
                    <button
                      onClick={() => {
                        setSearch('')
                        setSelectedTag(null)
                      }}
                      className="mt-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/30 hover:bg-[#c9a84c]/20 transition-all"
                    >
                      Restablecer filtros
                    </button>
                  )}
                </div>
              ) : (
                filteredPlenaries.map((ap) => {
                  const specialist = SPECIALISTS.find((s) => s.id === ap.specialistId)
                  const isFavorited = favorites.includes(ap.code)
                  const isCopied = copiedCode === ap.code

                  return (
                    <div
                      key={ap.code}
                      className="p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:border-white/20 group relative shadow-sm"
                      style={{
                        background: '#191919',
                        borderColor: isFavorited ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      {/* Card Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase font-mono shadow-sm"
                            style={{ background: 'rgba(201,168,76,0.18)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.30)' }}
                          >
                            {ap.code}
                          </span>
                          <span className="text-[11px] font-medium text-white/50">{ap.category}</span>
                          {!isLocked && specialist && (
                            <span
                              className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
                              style={{
                                background: `${specialist.color}18`,
                                color: specialist.color,
                                border: `1px solid ${specialist.color}33`,
                              }}
                            >
                              {specialist.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[10px] text-white/40 italic flex items-center gap-1">
                            <Building2 size={11} className="text-white/30" />
                            {ap.plenum}
                          </span>
                          <button
                            onClick={() => toggleFavorite(ap.code)}
                            title={isFavorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
                          >
                            <Star
                              size={15}
                              className={isFavorited ? 'text-[#f59e0b] fill-[#f59e0b]' : 'hover:text-[#f59e0b]'}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-[13px] sm:text-[14px] font-semibold text-white mb-2 leading-snug">
                        {ap.title}
                      </h3>

                      {/* Topic tags */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        {ap.tags.map((t) => (
                          <span
                            key={t}
                            onClick={() => setSelectedTag(t)}
                            className="text-[9px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/60 hover:text-white cursor-pointer hover:bg-white/10 transition-colors"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      {/* Key Points */}
                      <div className="space-y-1.5 mb-3 bg-black/30 p-3 rounded-xl border border-white/5">
                        <div className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <Layers size={11} className="text-[#c9a84c]" />
                          Criterios Fundamentales:
                        </div>
                        {ap.keyPoints.map((kp, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-[11px] text-white/80 font-light leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] flex-shrink-0 mt-1.5" />
                            <span>{kp}</span>
                          </div>
                        ))}
                      </div>

                      {/* Binding Grounds & Practical Use */}
                      <div
                        className="p-3 rounded-xl mb-3 text-[11px] border"
                        style={{
                          background: 'linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(0,0,0,0.2) 100%)',
                          borderColor: 'rgba(201,168,76,0.20)',
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquareQuote size={14} className="text-[#c9a84c] flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[#c9a84c] font-semibold">Fundamentos Vinculantes: </span>
                            <span className="text-white/90 font-light">{ap.bindingGrounds}</span>
                            <p className="text-white/60 text-[10px] mt-1.5 font-light">
                              <strong className="text-white/80 font-medium">Estrategia y aplicación procesal: </strong>
                              {ap.practicalUse}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-white/5">
                        <button
                          onClick={() => handleCopyQuote(ap)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-white/70 hover:text-white transition-colors"
                        >
                          {isCopied && copiedType === 'quote' ? (
                            <>
                              <Check size={13} className="text-[#34d17a]" />
                              <span className="text-[#34d17a] font-semibold">Cita procesal copiada</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} className="text-white/40" />
                              <span>Copiar cita procesal para escrito</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleUsePrompt(ap.promptTemplate, ap.specialistId)}
                            className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                            style={{
                              background: 'linear-gradient(135deg, rgba(201,168,76,0.20) 0%, rgba(201,168,76,0.08) 100%)',
                              border: '1px solid rgba(201,168,76,0.40)',
                              color: '#c9a84c',
                            }}
                          >
                            <Sparkles size={12} />
                            <span>
                              {onInsertPrompt ? 'Insertar en chat' : `Consultar con ${specialist?.name || 'Especialista'} →`}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}

          {/* TAB 2: REFORMAS SPIJ */}
          {tab === 'reforms' && (
            <>
              {filteredReforms.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
                  <BookOpen size={32} className="mx-auto text-white/20 mb-2" />
                  <p className="text-white/60 text-[13px] font-medium">No se encontraron Leyes SPIJ para este filtro</p>
                  <p className="text-white/40 text-[11px] mt-1 max-w-md mx-auto font-light">
                    {isLocked
                      ? `No hay leyes registradas bajo los términos actuales en el despacho de ${currentSpecialistInfo.name}.`
                      : 'Intenta seleccionando "Todos los temas" o borrando la búsqueda.'}
                  </p>
                </div>
              ) : (
                filteredReforms.map((rf) => {
                  const specialist = SPECIALISTS.find((s) => s.id === rf.specialistId)
                  const isFavorited = favorites.includes(rf.lawCode)
                  const isCopied = copiedCode === rf.lawCode

                  return (
                    <div
                      key={rf.lawCode}
                      className="p-4 sm:p-5 rounded-2xl border transition-all duration-200 hover:border-white/20 shadow-sm"
                      style={{
                        background: '#191919',
                        borderColor: isFavorited ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider font-mono shadow-sm"
                            style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.30)' }}
                          >
                            {rf.badge}
                          </span>
                          <h3 className="text-[13px] sm:text-[14px] font-bold text-white">{rf.lawCode}</h3>
                          {!isLocked && specialist && (
                            <span
                              className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase"
                              style={{
                                background: `${specialist.color}18`,
                                color: specialist.color,
                                border: `1px solid ${specialist.color}33`,
                              }}
                            >
                              {specialist.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[10px] text-white/40 flex items-center gap-1">
                            <Calendar size={11} />
                            {rf.date}
                          </span>
                          <button
                            onClick={() => toggleFavorite(rf.lawCode)}
                            title={isFavorited ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                            className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
                          >
                            <Star
                              size={15}
                              className={isFavorited ? 'text-[#f59e0b] fill-[#f59e0b]' : 'hover:text-[#f59e0b]'}
                            />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#c9a84c] mb-2 font-medium flex items-center gap-1">
                        <Info size={12} />
                        Norma afectada: <span className="text-white/90">{rf.affectedNorm}</span> · {rf.articles}
                      </p>

                      <div className="text-[11px] font-light text-white/80 whitespace-pre-line leading-relaxed mb-3 bg-black/30 p-3 rounded-xl border border-white/5">
                        {rf.summary}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-white/5">
                        <button
                          onClick={() => handleCopyReform(rf)}
                          className="flex items-center gap-1.5 text-[11px] font-medium text-white/60 hover:text-white transition-colors"
                        >
                          {isCopied && copiedType === 'quote' ? (
                            <>
                              <Check size={13} className="text-[#34d17a]" />
                              <span className="text-[#34d17a] font-semibold">Referencia legal copiada</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} className="text-white/40" />
                              <span>Copiar concordancia legal</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleUsePrompt(rf.promptTemplate, rf.specialistId)}
                          className="px-3 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                          style={{
                            background: 'rgba(56,189,248,0.12)',
                            border: '1px solid rgba(56,189,248,0.30)',
                            color: '#38bdf8',
                          }}
                        >
                          <Sparkles size={12} />
                          <span>
                            {onInsertPrompt ? 'Insertar en chat' : `Consultar con ${specialist?.name || 'Especialista'} →`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </>
          )}

          {/* TAB 3: FAVORITOS */}
          {tab === 'favorites' && (
            <div className="space-y-4">
              {favoritePlenaries.length === 0 && favoriteReforms.length === 0 ? (
                <div className="py-14 px-4 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                  <BookmarkCheck size={36} className="mx-auto text-white/20 mb-2" />
                  <h3 className="text-white/70 text-[14px] font-semibold">
                    {isLocked
                      ? `No tienes favoritos en el despacho de ${currentSpecialistInfo.name}`
                      : 'Aún no tienes favoritos guardados'}
                  </h3>
                  <p className="text-white/40 text-[11px] mt-1 max-w-sm mx-auto font-light leading-relaxed">
                    Haz clic en el icono de estrella (★) en cualquier Acuerdo Plenario o Ley SPIJ de este despacho para fijarlo aquí y tener acceso inmediato en tus audiencias y escritos.
                  </p>
                </div>
              ) : (
                <>
                  {favoritePlenaries.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#c9a84c] flex items-center gap-1.5">
                        <Gavel size={12} />
                        Acuerdos Plenarios Favoritos ({favoritePlenaries.length})
                      </h4>
                      {favoritePlenaries.map((ap) => (
                        <div
                          key={ap.code}
                          className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-[#191919] border-white/10 hover:border-[#c9a84c]/40 transition-all"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-[#c9a84c] font-mono">{ap.code}</span>
                              <span className="text-[10px] text-white/50">{ap.category}</span>
                            </div>
                            <p className="text-[12px] font-semibold text-white truncate mt-0.5">{ap.title}</p>
                            <p className="text-[10px] text-white/50 truncate font-light">{ap.bindingGrounds}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleCopyQuote(ap)}
                              className="p-1.5 rounded-lg text-white/50 hover:text-white bg-white/5 hover:bg-white/10"
                              title="Copiar cita"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => handleUsePrompt(ap.promptTemplate, ap.specialistId)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40 hover:bg-[#c9a84c]/30"
                            >
                              Consultar →
                            </button>
                            <button
                              onClick={() => toggleFavorite(ap.code)}
                              className="p-1.5 text-[#f59e0b] hover:text-white/40"
                              title="Quitar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {favoriteReforms.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                        <BookOpen size={12} />
                        Leyes SPIJ Favoritas ({favoriteReforms.length})
                      </h4>
                      {favoriteReforms.map((rf) => (
                        <div
                          key={rf.lawCode}
                          className="p-3.5 rounded-xl border flex items-center justify-between gap-3 bg-[#191919] border-white/10 hover:border-[#38bdf8]/40 transition-all"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-[#38bdf8] font-mono">{rf.badge}</span>
                              <span className="text-[10px] text-white/50">{rf.date}</span>
                            </div>
                            <p className="text-[12px] font-semibold text-white truncate mt-0.5">{rf.lawCode} — {rf.affectedNorm}</p>
                            <p className="text-[10px] text-white/50 truncate font-light">{rf.articles}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleCopyReform(rf)}
                              className="p-1.5 rounded-lg text-white/50 hover:text-white bg-white/5 hover:bg-white/10"
                              title="Copiar"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={() => handleUsePrompt(rf.promptTemplate, rf.specialistId)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 hover:bg-[#38bdf8]/30"
                            >
                              Consultar →
                            </button>
                            <button
                              onClick={() => toggleFavorite(rf.lawCode)}
                              className="p-1.5 text-[#f59e0b] hover:text-white/40"
                              title="Quitar"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 4: GARANTÍA DE RIGOR */}
          {tab === 'guide' && (
            <div className="space-y-4 text-[12px] font-light text-white/80 leading-relaxed">
              {/* Trust Seals Banner */}
              <div
                className="p-5 rounded-2xl border relative overflow-hidden"
                style={{
                  background: isLocked
                    ? `linear-gradient(135deg, ${currentSpecialistInfo.bgColor} 0%, rgba(20,20,20,0.95) 100%)`
                    : 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(20,20,20,0.95) 100%)',
                  borderColor: isLocked ? `${currentSpecialistInfo.color}44` : 'rgba(201,168,76,0.35)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <ShieldCheck
                        size={20}
                        style={{ color: isLocked ? currentSpecialistInfo.accentColor : '#c9a84c' }}
                      />
                      <h3 className="text-[15px] font-bold text-white tracking-tight">
                        {isLocked
                          ? `Compendio Oficial Concordado — Despacho de ${currentSpecialistInfo.name}`
                          : 'Compendio Oficial Concordado al 100%'}
                      </h3>
                    </div>
                    <p className="text-[11px] text-white/70 max-w-xl">
                      {isLocked
                        ? `Todas las consultas y escritos redactados por ${currentSpecialistInfo.name} se sustentan estrictamente en la jurisprudencia vinculante del Poder Judicial y las normas vigentes del SPIJ en materia de ${currentSpecialistInfo.role}.`
                        : 'Cada respuesta procesal, cálculo numérico y modelo de escrito emitido por Hardman está anclado a fuentes jurídicas primarias y vigentes en el Perú.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/15 text-[10px] font-bold text-[#c9a84c]">
                      MINJUSDH / SPIJ
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-black/40 border border-white/15 text-[10px] font-bold text-[#34d17a]">
                      CORTE SUPREMA
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialist Specific Framework (if locked) OR 2024-2026 Timeline (if general) */}
              {isLocked ? (
                <div className="p-5 rounded-2xl border bg-[#181818] border-white/10 space-y-3.5">
                  <div className="flex items-center gap-2 text-white">
                    <Building2 size={16} style={{ color: currentSpecialistInfo.accentColor }} />
                    <h4 className="text-[13px] font-bold uppercase tracking-wider">
                      Órgano Jurisdiccional Rector & Fuentes de Este Despacho
                    </h4>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                    <p className="text-[12px] font-semibold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: currentSpecialistInfo.color }} />
                      {currentSpecialistInfo.primaryCourt}
                    </p>
                    <p className="text-[11px] text-white/60 font-light">
                      Los Acuerdos Plenarios y sentencias casatorias vinculantes emitidas por esta instancia son de observancia obligatoria para todos los jueces del territorio nacional.
                    </p>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2 flex items-center gap-1.5">
                      <BookOpen size={12} />
                      Normativa Primaria y Códigos Aplicados por {currentSpecialistInfo.name}:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentSpecialistInfo.governingLaws.map((law, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-white/80 font-light flex items-center gap-2"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: currentSpecialistInfo.color }}
                          />
                          <span>{law}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* General timeline when in full explorer */
                <div className="p-5 rounded-2xl border bg-[#181818] border-white/10 space-y-3">
                  <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} className="text-[#34d17a]" />
                    Cronología de Reformas Legislativas Vigentes 2024 – 2026
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-[#f87171] uppercase font-mono">D. LEG. 1585</span>
                      <p className="text-[11px] font-semibold text-white">Reforma de Prisión Preventiva y Vigilancia Electrónica</p>
                      <p className="text-[10px] text-white/60">Eleva el umbral a más de 5 años y prioriza la vigilancia electrónica en penas hasta 7 años.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-[#f87171] uppercase font-mono">LEY 32130 & LEY 32108/32138</span>
                      <p className="text-[11px] font-semibold text-white">Investigación Preliminar PNP y Crimen Organizado</p>
                      <p className="text-[10px] text-white/60">Restituye investigación a PNP y exige abogado defensor obligatorio en allanamientos fiscales.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-[#2dd4bf] uppercase font-mono">D.S. 006-2026-JUS (TUO LPAG)</span>
                      <p className="text-[11px] font-semibold text-white">Nuevo Texto Único Ordenado Ley 27444</p>
                      <p className="text-[10px] text-white/60">Derogación formal del D.S. 004-2019-JUS. Prohibido citar la norma derogada ante entidades.</p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-[#2dd4bf] uppercase font-mono">LEY 32069 & D.S. 001-2026-EF</span>
                      <p className="text-[11px] font-semibold text-white">Nueva Ley de Contrataciones Públicas</p>
                      <p className="text-[10px] text-white/60">Extinción formal del OSCE. Creación del OECE y obligatoriedad de la Junta de Disputas (JPRD).</p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-[#22d3ee] uppercase font-mono">LEY 32430</span>
                      <p className="text-[11px] font-semibold text-white">Ley de Arrendamiento Justo</p>
                      <p className="text-[10px] text-white/60">Rentas de primera categoría tributan bajo criterio de lo percibido (solo sobre cobros efectivos).</p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
                      <span className="text-[9px] font-bold text-[#f472b6] uppercase font-mono">LEY 31590</span>
                      <p className="text-[11px] font-semibold text-white">Tenencia Compartida Obligatoria</p>
                      <p className="text-[10px] text-white/60">Regla legal preferente de coparentalidad igualitaria en el Código de Niños y Adolescentes.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Specialist Roster Reference (ONLY in general explorer) */}
              {!isLocked && (
                <div className="p-5 rounded-2xl border bg-[#181818] border-white/10 space-y-3">
                  <h4 className="text-[12px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <UserCheck size={14} className="text-[#c9a84c]" />
                    Distribución de Especialistas y Fuentes
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                    {SPECIALISTS.filter((s) => s.id !== 'all').map((sp) => (
                      <div
                        key={sp.id}
                        className="p-2.5 rounded-xl border bg-black/30 flex items-center gap-2.5"
                        style={{ borderColor: `${sp.color}25` }}
                      >
                        {sp.image && (
                          <img
                            src={sp.image}
                            alt={sp.name}
                            className="w-8 h-8 rounded-full object-cover border flex-shrink-0"
                            style={{ borderColor: sp.color }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-white leading-tight">{sp.name}</p>
                          <p className="text-[9px] truncate" style={{ color: sp.color }}>
                            {sp.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className="px-4 sm:px-6 py-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-light text-white/50 flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#161616' }}
        >
          <div className="flex items-center gap-2">
            <Scale size={13} className="text-[#c9a84c]" />
            <span>
              {isLocked
                ? `Fuentes Oficiales: SPIJ (MINJUSDH) · ${currentSpecialistInfo.primaryCourt}`
                : 'Fuentes Oficiales: SPIJ (MINJUSDH) · Corte Suprema de Justicia · El Peruano'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl font-semibold text-black bg-[#c9a84c] hover:bg-[#d6b75e] transition-colors self-end sm:self-auto shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
