import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ArrowUp, Trash2, MessageSquare,
  Copy, Check, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, CornerDownLeft, RefreshCw,
  Download, Paperclip, Image as ImageIcon,
  X, AlertTriangle, FileText, Loader2, FileDown, Printer,
  Menu, Mic, Square, Volume2, VolumeX, Play, Pause, ArrowRight, Share2, MessageCircle,
  Star, Calendar, BookOpen, Sparkles, Calculator, MapPin, Baby, Briefcase,
  Home, MailCheck, ShieldAlert, FileSignature, ShoppingBag,
  Scale, Shield, Gavel, Building2, Search, Edit2, RotateCcw, type LucideIcon
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '@/context/AuthContext'
import { getAgent, AGENTS } from '@/lib/agents'
import { api } from '@/lib/api'
import { formatDate, formatTime } from '@/lib/utils'
import { downloadWordDoc, downloadPdfDoc, printDocument, extractDocumentFromMessage, renderDocHtmlBody, getSavedLetterhead } from '@/lib/exportDoc'
import type { Message, Conversation } from '@/types'
import JurisClaudeLogo from '@/components/brand/JurisClaudeLogo'
import DocumentScannerModal from '@/components/citizen/DocumentScannerModal'
import CitizenCalculatorsModal from '@/components/citizen/CitizenCalculatorsModal'
import CitizenDocumentGeneratorModal, { type DocType } from '@/components/citizen/CitizenDocumentGeneratorModal'
import WhereToGoModal from '@/components/citizen/WhereToGoModal'
import UsageCounterBadge from '@/components/ui/UsageCounterBadge'

const SpijModal = lazy(() => import('@/components/legal/SpijModal'))

interface PromptModeItem {
  id: string
  label: string
  icon: LucideIcon
  badge: string
  promptPrefix: string
}

const PROMPT_MODES: PromptModeItem[] = [
  {
    id: 'explicacion',
    label: 'Explicar en Sencillo',
    icon: Sparkles,
    badge: 'Paso a Paso',
    promptPrefix: 'Por favor explícame este problema en palabras sencillas, sin términos difíciles y con un plan de acción paso a paso (Paso 1, 2 y 3): ',
  },
  {
    id: 'calculo',
    label: 'Cálculo de Monto',
    icon: Calculator,
    badge: 'Montos S/',
    promptPrefix: 'Calcula exactamente los montos en Soles, beneficios o porcentaje que me corresponden por ley para: ',
  },
  {
    id: 'tramite',
    label: 'Guía de Trámite',
    icon: MapPin,
    badge: 'A Dónde Ir',
    promptPrefix: 'Indícame a qué entidad pública debo acudir (DEMUNA, SUNAFIL, Indecopi, Juzgado), qué requisitos llevar y si el trámite es gratuito para: ',
  },
  {
    id: 'escrito',
    label: 'Redactar Documento',
    icon: FileSignature,
    badge: 'Redacción',
    promptPrefix: 'Redacta el modelo oficial de escrito, carta notarial o solicitud formal con estructura legal peruana completa listo para presentar para: ',
  },
]

const FILE_ACCEPT = '.pdf,.docx,.doc,.png,.jpg,.jpeg,.gif,.webp'
const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.gif,.webp'

interface DocumentTemplateItem {
  label: string
  icon: LucideIcon
  badgeColor: string
  prompt: string
}

const SPECIALIST_TEMPLATES: Record<string, DocumentTemplateItem[]> = {
  valentina: [
    {
      label: 'Carta Notarial - Pago de Beneficios Sociales (Plazo 48h)',
      icon: MailCheck,
      badgeColor: '#6366F1',
      prompt: 'Redacta una carta notarial formal conforme a la Ley del Notariado (D. Leg. 1049) y D. Leg. 728, requiriendo a mi empleador el pago inmediato de mi liquidación de beneficios sociales dentro del plazo improrrogable de 48 horas: [empresa, cargo, fecha de ingreso, fecha de cese, sueldo mensual]',
    },
    {
      label: 'Carta de Renuncia con Exoneración de Preaviso de 30 Días',
      icon: Briefcase,
      badgeColor: '#34d17a',
      prompt: 'Redacta una carta formal de renuncia voluntaria con solicitud de exoneración del plazo de 30 días de preaviso conforme al Art. 18 del D.S. 003-97-TR: [empresa, cargo, último día efectivo de labores]',
    },
    {
      label: 'Denuncia por Despido Arbitrario e Inspección ante SUNAFIL',
      icon: ShieldAlert,
      badgeColor: '#f59e0b',
      prompt: 'Redacta una solicitud de inspección laboral y denuncia ante SUNAFIL por despido arbitrario incausado e incumplimiento de obligaciones laborales: [razón social, RUC, centro de labores, hechos]',
    },
    {
      label: 'Contrato de Trabajo a Plazo Fijo Sujeto a Modalidad',
      icon: FileText,
      badgeColor: '#6366F1',
      prompt: 'Redacta un contrato individual de trabajo sujeto a modalidad (D.S. 003-97-TR) con causa objetiva determinante, periodo de prueba y cláusula de confidencialidad: [empleador, trabajador, puesto, remuneración, plazo]',
    },
  ],
  sebastian: [
    {
      label: 'Recurso de Apelación contra Auto de Prisión Preventiva (Art. 278 NCPP / Plazo 3 días)',
      icon: Scale,
      badgeColor: '#EF4444',
      prompt: 'Redacta un recurso formal de apelación contra el auto que declaró fundada la prisión preventiva, conforme al Art. 278 numeral 1 del NCPP (plazo de 3 días) y D. Leg. 1585. Debe contener: Fundamentos de hecho y derecho, agravio producido, cuestionamiento de graves y fundados elementos de convicción, prognosis de pena, acreditación de arraigo familiar/laboral/domiciliario de calidad, ausencia de peligro de fuga y obstaculización, y pretensión concreta de revocatoria e imposición de comparecencia con restricciones. Incluye Otrosí Digo de Casilla SINOE y facultades Arts. 74 y 80 CPC.',
    },
    {
      label: 'Apelación de Prisión Preventiva (Art. 278 CPP / Cas. 626-2013)',
      icon: Scale,
      badgeColor: '#EF4444',
      prompt: 'Redacta un recurso de apelación contra auto de prisión preventiva al amparo del Art. 278 del NCPP, Casación 626-2013-Moquegua y Acuerdo Plenario 01-2017, dirigido al Juez de Investigación Preparatoria para elevación a Sala, acreditando arraigo integral (domiciliario, laboral y familiar), ausencia de peligro procesal y reserva de sustentación oral (Art. 420 CPP): [imputado, delito, juzgado, plazo en meses, fecha notificación]',
    },
    {
      label: 'Excepción de Improcedencia de Acción (Art. 6.1.b NCPP)',
      icon: Shield,
      badgeColor: '#EF4444',
      prompt: 'Redacta un escrito de excepción de improcedencia de acción deducida al amparo del Art. 6 numeral 1 literal b del NCPP. Fundamenta que el hecho denunciado no constituye delito (atipicidad absoluta o relativa) o no es justiciable penalmente, analizando los elementos objetivos y subjetivos del tipo penal imputado y solicitando el sobreseimiento definitivo. Incluye Otrosí Digo legal.',
    },
    {
      label: 'Recurso de Casación Penal Extraordinaria (Arts. 427 y 429 NCPP)',
      icon: Gavel,
      badgeColor: '#EF4444',
      prompt: 'Redacta un recurso de casación excepcional/extraordinaria conforme a los Arts. 427 numeral 4 y 429 causales 1, 3 y 4 del NCPP ante la Sala Penal de la Corte Suprema, justificando el interés casacional para el desarrollo de la doctrina jurisprudencial, quebrantamiento de precepto constitucional y falta de motivación lógica. Incluye Otrosí Digo.',
    },
    {
      label: 'Recurso de Oposición a Prisión Preventiva (DL 1585 / NCPP)',
      icon: Shield,
      badgeColor: '#EF4444',
      prompt: 'Redacta un escrito de oposición al requerimiento de prisión preventiva conforme a los Arts. 268 y siguientes del NCPP y los criterios del D. Leg. 1585, acreditando arraigo y solicitando comparecencia con restricciones: [delito imputado, imputado, carpeta fiscal, elementos de convicción cuestionados]',
    },
    {
      label: 'Solicitud de Audiencia de Tutela de Derechos (Art. 71 NCPP)',
      icon: Gavel,
      badgeColor: '#EF4444',
      prompt: 'Redacta una solicitud de audiencia de tutela de derechos dirigida al Juez de Investigación Preparatoria conforme al Art. 71 numeral 4 del Código Procesal Penal por vulneración del derecho de defensa: [fiscalía a cargo, carpeta fiscal, actos lesivos]',
    },
    {
      label: 'Denuncia Penal de Parte ante Fiscalía Provincial Penal',
      icon: FileText,
      badgeColor: '#f59e0b',
      prompt: 'Redacta una denuncia penal de parte formal dirigida al Fiscal Provincial Penal de Turno por delito contra el patrimonio / estafa / lesiones, con fundamentación fáctica, tipicidad y ofrecimiento de pruebas: [denunciante, denunciado, relato de hechos, elementos probatorios]',
    },
    {
      label: 'Solicitud de Control de Plazos de Diligencias Preliminares (Art. 343 NCPP)',
      icon: Scale,
      badgeColor: '#EF4444',
      prompt: 'Redacta una solicitud de control de plazos conforme al Art. 343 del NCPP ante el Juez de Investigación Preparatoria por vencimiento excesivo del plazo de diligencias preliminares sin pronunciamiento fiscal: [carpeta fiscal, fecha de disposición de inicio, plazo vencido]',
    },
  ],
  diego: [
    {
      label: 'Demanda de Desalojo por Ocupación Precaria (Estructura 1 - Sumarísimo)',
      icon: Home,
      badgeColor: '#06B6D4',
      prompt: 'Redacta una demanda de desalojo por ocupación precaria en proceso sumarísimo (Art. 546 inc. 4 CPC) conforme a la Estructura 1, Art. 911 del Código Civil y el IV Pleno Casatorio Civil (Cas. 2195-2011-Ucayali), con restitución de inmueble SUNARP, frutos devengados y costas: [demandante, demandado, dirección del inmueble, partida electrónica SUNARP, fecha carta notarial]',
    },
    {
      label: 'Demanda en Proceso Único de Ejecución — Título Valor (Estructura 2)',
      icon: FileText,
      badgeColor: '#06B6D4',
      prompt: 'Redacta una demanda en Proceso Único de Ejecución (Art. 688 CPC) conforme a la Estructura 2 para cobro de Letra de Cambio / Pagaré protestado, incluyendo tabla de características del título, tabla de liquidación de la deuda y petitorio de mandato ejecutivo: [ejecutante, ejecutado, tipo de título, fecha de emisión, vencimiento, capital adeudado en S/, fecha de protesto]',
    },
    {
      label: 'Solicitud de Sucesión Intestada Judicial (Estructura 3 - No Contencioso)',
      icon: Scale,
      badgeColor: '#06B6D4',
      prompt: 'Redacta una solicitud de sucesión intestada en proceso no contencioso (Art. 749 inc. 1 y 830 CPC) conforme a la Estructura 3, con orden de prelación hereditaria de los Arts. 815 y 816 CC, sin demandado y con petición de declaración de herederos: [solicitante, causante, fecha de defunción, cónyuge e hijos herederos con DNI]',
    },
    {
      label: 'Contestación de Demanda y Reconvención (Estructura 4)',
      icon: Scale,
      badgeColor: '#06B6D4',
      prompt: 'Redacta un escrito de contestación de demanda y reconvención conforme a la Estructura 4 y Art. 442 CPC, con pronunciamiento categórico hecho por hecho (NIEGO/AFIRMO) y reconvención en el Primer Otrosí Digo (Art. 445 CPC) pidiendo declarar infundada la demanda: [expediente, demandante, demandado, materia, hechos contestados, pretensión reconvencional]',
    },
    {
      label: 'Medida Cautelar Fuera de Proceso — Embargo en Inscripción (Estructura 5)',
      icon: Shield,
      badgeColor: '#06B6D4',
      prompt: 'Redacta una solicitud de medida cautelar fuera de proceso de embargo en forma de inscripción (Art. 636 y 656 CPC) en cuaderno CAUTELAR, fundamentando fumus boni iuris, periculum in mora, contracautela juratoria y la alerta de 10 días hábiles para demandar: [solicitante, futuro demandado, bien inmueble con partida SUNARP, monto de afectación en S/]',
    },
    {
      label: 'Recurso de Apelación contra Sentencia Civil (Arts. 364 y 366 CPC)',
      icon: Scale,
      badgeColor: '#06B6D4',
      prompt: 'Redacta un recurso formal de apelación contra sentencia civil de primera instancia al amparo de los Arts. 364 y 366 del Código Procesal Civil. Fundamenta el error de hecho y de derecho en que incurrió el juzgador, la naturaleza del agravio sufrido, la inadecuada valoración probatoria y el sustento de la pretensión impugnatoria solicitando su revocatoria o nulidad total. Incluye los tres Otrosí Digo de rigor (Casilla SINOE, física y Arts. 74/80 CPC).',
    },
    {
      label: 'Contrato de Alquiler con Desalojo Notarial Express (Ley 30933)',
      icon: Home,
      badgeColor: '#06B6D4',
      prompt: 'Redacta un contrato de arrendamiento de inmueble con Cláusula de Allanamiento Futuro (Ley 30201) y sometimiento al Desalojo Notarial Express (Ley 30933), con cláusulas de resolución por falta de pago y garantía: [arrendador, arrendatario, dirección del predio, renta mensual en S/, cuenta bancaria]',
    },
    {
      label: 'Contrato de Mutuo Dinerario con Mérito Ejecutivo',
      icon: FileText,
      badgeColor: '#06B6D4',
      prompt: 'Redacta un contrato privado de mutuo dinerario con legalización notarial de firmas (Arts. 1648 y ss. del Código Civil), con pacto de intereses y cláusula de mérito ejecutivo: [prestamista, prestatario, monto en Soles, cronograma de pago]',
    },
  ],
  adriana: [
    {
      label: 'Pacto de Socios / Accionistas (Cláusulas Drag & Tag Along)',
      icon: Building2,
      badgeColor: '#8B5CF6',
      prompt: 'Redacta un acuerdo de accionistas conforme a la Ley General de Sociedades (Ley 26887), incorporando cláusulas de derecho de adquisición preferente, acompañamiento (Tag Along) y arrastre (Drag Along): [sociedad, accionistas, porcentaje accionario]',
    },
    {
      label: 'Acuerdo de Confidencialidad y No Divulgación (NDA Empresarial)',
      icon: Shield,
      badgeColor: '#8B5CF6',
      prompt: 'Redacta un acuerdo de confidencialidad y no divulgación (NDA) bilateral para negociación comercial y M&A, con penalidad por incumplimiento y plazo de vigencia: [parte reveladora, parte receptora, finalidad]',
    },
    {
      label: 'Acta de Junta General de Accionistas de Aumento de Capital',
      icon: FileText,
      badgeColor: '#34d17a',
      prompt: 'Redacta un acta de Junta General de Accionistas de S.A.C. que aprueba el aumento de capital social por nuevos aportes y la consecuente modificación estatutaria: [razón social, RUC, capital actual, nuevo capital]',
    },
    {
      label: 'Contrato de Prestación de Servicios B2B con Propiedad Intelectual',
      icon: FileText,
      badgeColor: '#8B5CF6',
      prompt: 'Redacta un contrato de locación de servicios profesionales e independientes para empresas (B2B), con estipulación de entregables, propiedad intelectual y no sujeción laboral (Art. 1764 Código Civil): [cliente, proveedor, servicios, retribución]',
    },
  ],
  rodrigo: [
    {
      label: 'Solicitud de Petitorio Minero ante INGEMMET (TUPA 2026)',
      icon: FileText,
      badgeColor: '#F59E0B',
      prompt: 'Redacta una solicitud de petitorio minero conforme al TUO de la Ley General de Minería y el TUPA del INGEMMET, con coordenadas UTM WGS84 y cuadícula: [titular, nombre del petitorio, extensión en hectáreas, ubicación, coordenadas]',
    },
    {
      label: 'Escrito de Descargo en PAS ante OEFA',
      icon: ShieldAlert,
      badgeColor: '#F59E0B',
      prompt: 'Redacta un escrito de descargos frente a imputación de cargos en Procedimiento Administrativo Sancionador (PAS) de OEFA, sustentando causales eximentes y subsanación voluntaria: [empresa, resolución de imputación, hechos imputados]',
    },
    {
      label: 'Contrato de Cesión y Explotación Minera',
      icon: FileText,
      badgeColor: '#34d17a',
      prompt: 'Redacta un contrato de cesión minera conforme a la Ley General de Minería con regalías, cumplimiento de IGA y plan de cierre: [cedente, cesionario, código de concesión, plazo]',
    },
    {
      label: 'Solicitud de Levantamiento de Suspensión en REINFO',
      icon: Scale,
      badgeColor: '#F59E0B',
      prompt: 'Redacta una solicitud dirigida a la DGFM del MINEM solicitando el levantamiento de suspensión de inscripción en REINFO con acreditación de IGAFOM: [minero formalizado, código REINFO, concesión]',
    },
  ],
  camila: [
    {
      label: 'Formato Único de Demanda de Alimentos con Asignación Anticipada',
      icon: Baby,
      badgeColor: '#EC4899',
      prompt: 'Redacta una demanda de pensión de alimentos con solicitud de medida cautelar de Asignación Anticipada ante el Juzgado de Paz Letrado conforme a la Ley 28439: [demandante, demandado, nombres y edades de los hijos, gastos e ingresos aproximados]',
    },
    {
      label: 'Demanda de Tenencia Compartida y Régimen de Visitas (Ley 31590)',
      icon: Scale,
      badgeColor: '#EC4899',
      prompt: 'Redacta una demanda de tenencia compartida obligatoria al amparo de la Ley 31590, fundamentando el principio de corresponsabilidad parental y el interés superior del niño: [demandante, demandado, hijos, propuesta de régimen]',
    },
    {
      label: 'Solicitud de Divorcio por Mutuo Acuerdo (Vía Notarial / Municipal)',
      icon: FileText,
      badgeColor: '#34d17a',
      prompt: 'Redacta una solicitud de divorcio ulterior por mutuo acuerdo al amparo de la Ley 29227 (Divorcio Rápido) para presentar ante Notaría o Municipalidad: [cónyuges, fecha y lugar de matrimonio]',
    },
    {
      label: 'Demanda de Aumento / Reducción de Pensión de Alimentos',
      icon: Baby,
      badgeColor: '#EC4899',
      prompt: 'Redacta una demanda de aumento / reducción de pensión de alimentos conforme al Art. 482 del Código Civil por variación de las necesidades o posibilidades económicas: [partes, sentencia o acta anterior, nuevo monto solicitado]',
    },
  ],
  fernanda: [
    {
      label: 'Recurso de Reclamación contra Determinación / Multa SUNAT',
      icon: FileText,
      badgeColor: '#10B981',
      prompt: 'Redacta un recurso de reclamación tributaria al amparo del Art. 137 del Código Tributario contra Resolución de Determinación / Multa emitida por SUNAT, sustentando la nulidad o improcedencia del reparo: [contribuyente, RUC, valor impugnado, fundamentos]',
    },
    {
      label: 'Recurso de Apelación ante el Tribunal Fiscal',
      icon: Scale,
      badgeColor: '#10B981',
      prompt: 'Redacta un recurso de apelación ante el Tribunal Fiscal conforme al Art. 146 del Código Tributario con solicitud de suspensión de cobranza coactiva (Art. 119 C.T.): [recurrente, RUC, resolución apelada, agravios]',
    },
    {
      label: 'Solicitud de Prescripción de Deuda Tributaria (Art. 43 Código Tributario)',
      icon: FileText,
      badgeColor: '#34d17a',
      prompt: 'Redacta una solicitud formal ante SUNAT requiriendo la declaración de prescripción de la deuda tributaria y multas conforme a los Arts. 43 a 48 del Código Tributario: [contribuyente, RUC, tributos y periodos]',
    },
    {
      label: 'Escrito de Levantamiento de Embargo Coactivo de SUNAT',
      icon: ShieldAlert,
      badgeColor: '#10B981',
      prompt: 'Redacta un escrito ante el Ejecutor Coactivo de SUNAT solicitando el levantamiento inmediato de embargo en cuenta bancaria por vulneración del procedimiento de cobranza coactiva: [contribuyente, expediente coactivo, banco]',
    },
  ],
  marco: [
    {
      label: 'Recurso de Apelación en Licitación Pública ante OECE (Ley 32069)',
      icon: Gavel,
      badgeColor: '#0D9488',
      prompt: 'Redacta un recurso de apelación contra el otorgamiento de la buena pro / descalificación de oferta bajo la Ley 32069 dirigido al Tribunal de Contrataciones del Estado (OECE): [postor, entidad convocante, proceso, fundamentos]',
    },
    {
      label: 'Escrito de Descargo en Procedimiento Sancionador (LPAG Ley 27444)',
      icon: ShieldAlert,
      badgeColor: '#0D9488',
      prompt: 'Redacta un escrito de descargos contra la imputación de cargos en Procedimiento Administrativo Sancionador (PAS) conforme a la Ley 27444, invocando presunción de licitud y tipicidad: [administrado, entidad, acto de imputación, descargos]',
    },
    {
      label: 'Recurso de Reconsideración contra Acto Administrativo',
      icon: FileText,
      badgeColor: '#34d17a',
      prompt: 'Redacta un recurso de reconsideración al amparo del Art. 219 de la Ley 27444 contra resolución administrativa desfavorable, adjuntando nueva prueba instrumental: [administrado, resolución, autoridad emisora, nueva prueba]',
    },
    {
      label: 'Solicitud de Aplicación de Silencio Administrativo Positivo',
      icon: Scale,
      badgeColor: '#0D9488',
      prompt: 'Redacta una declaración jurada y solicitud de aplicación de Silencio Administrativo Positivo conforme a la Ley 27444 por vencimiento del plazo legal de 30 días hábiles sin pronunciamiento: [administrado, expediente, trámite]',
    },
  ],
}

function requestPushPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {})
  }
}

function sendPushNotification(agentName: string) {
  if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
    try {
      new Notification(`${agentName} te respondió`, {
        body: 'Tu consulta jurídica está lista. Haz clic para verla.',
        icon: '/icon-192.png',
        tag: 'hardman-response',
      })
    } catch { /* notification not supported */ }
  }
}

const PERU_HOLIDAYS_2026: { month: number; day: number; name: string }[] = [
  { month: 0, day: 1, name: 'Año Nuevo' },
  { month: 3, day: 2, name: 'Jueves Santo' },
  { month: 3, day: 3, name: 'Viernes Santo' },
  { month: 4, day: 1, name: 'Día del Trabajo' },
  { month: 5, day: 7, name: 'Batalla de Arica y Día de la Bandera' },
  { month: 5, day: 29, name: 'San Pedro y San Pablo' },
  { month: 6, day: 23, name: 'Día de la Fuerza Aérea del Perú' },
  { month: 6, day: 28, name: 'Fiestas Patrias' },
  { month: 6, day: 29, name: 'Fiestas Patrias' },
  { month: 7, day: 6, name: 'Batalla de Junín' },
  { month: 7, day: 30, name: 'Santa Rosa de Lima' },
  { month: 9, day: 8, name: 'Combate de Angamos' },
  { month: 10, day: 1, name: 'Día de Todos los Santos' },
  { month: 11, day: 8, name: 'Inmaculada Concepción' },
  { month: 11, day: 9, name: 'Batalla de Ayacucho' },
  { month: 11, day: 25, name: 'Navidad' },
]

function detectDeadlines(text: string): string[] {
  const patterns = [
    /(\d+)\s*días?\s*hábiles?/gi,
    /(\d+)\s*días?\s*calendario/gi,
    /plazo\s+(?:de\s+)?(\d+)\s*días?/gi,
    /caducidad[^.]*(\d+)\s*días?/gi,
    /vence?\s+el\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /hasta\s+el\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /plazo\s+(?:vence|fatal|improrrogable)/gi,
  ]
  const found: string[] = []
  for (const pattern of patterns) {
    const matches = text.match(pattern)
    if (matches) found.push(...matches)
  }
  return [...new Set(found)].slice(0, 3)
}

function calculatePeruvianDeadline(
  startDateStr: string,
  daysCount: number,
  isBusinessDays: boolean
) {
  const [year, month, day] = startDateStr.split('-').map(Number)
  const start = new Date(year, month - 1, day)
  let current = new Date(start)
  const holidaysSkipped: string[] = []
  
  if (isBusinessDays) {
    let added = 0
    while (added < daysCount) {
      current.setDate(current.getDate() + 1)
      const dayOfWeek = current.getDay()
      const m = current.getMonth()
      const d = current.getDate()
      const holiday = PERU_HOLIDAYS_2026.find((h) => h.month === m && h.day === d)
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holiday) {
        added++
      } else if (holiday) {
        holidaysSkipped.push(`${holiday.name} (${d}/${m + 1})`)
      }
    }
  } else {
    current.setDate(current.getDate() + daysCount)
  }

  const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre']
  
  const formattedDueDate = `${daysOfWeek[current.getDay()]}, ${current.getDate()} de ${months[current.getMonth()]} de ${current.getFullYear()}`
  return { dueDate: current, formattedDueDate, holidaysSkipped }
}

function openGoogleCalendar(title: string, details: string, dueDate: Date) {
  const y = dueDate.getFullYear()
  const m = String(dueDate.getMonth() + 1).padStart(2, '0')
  const d = String(dueDate.getDate()).padStart(2, '0')
  const dateStr = `${y}${m}${d}`
  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${dateStr}T140000Z/${dateStr}T150000Z&details=${encodeURIComponent(details)}&location=Mesa+de+Partes+Virtual`
  window.open(url, '_blank', 'noopener,noreferrer')
}

function downloadCalculatedICS(title: string, details: string, dueDate: Date) {
  const now = new Date()
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const y = dueDate.getFullYear()
  const m = String(dueDate.getMonth() + 1).padStart(2, '0')
  const d = String(dueDate.getDate()).padStart(2, '0')
  const dtStart = `${y}${m}${d}T090000Z`
  const dtEnd = `${y}${m}${d}T235900Z`
  const uid = `hardman-plazo-${Date.now()}@hardman.pe`
  
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HARDMAN//Inteligencia Juridica//ES',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de vencimiento de plazo procesal',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Plazo_${title.replace(/[^a-zA-Z0-9]/g, '_')}_${y}-${m}-${d}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

interface DeadlineModalProps {
  isOpen: boolean
  onClose: () => void
  agentName: string
  initialDeadlineText?: string
}

function DeadlineModal({ isOpen, onClose, agentName, initialDeadlineText }: DeadlineModalProps) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('Vencimiento de Plazo Procesal')
  const [reference, setReference] = useState('')
  const [startDate, setStartDate] = useState(todayStr)
  const [daysCount, setDaysCount] = useState(3)
  const [isBusinessDays, setIsBusinessDays] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [copiedSuccess, setCopiedSuccess] = useState(false)

  useEffect(() => {
    if (initialDeadlineText) {
      const matchDays = initialDeadlineText.match(/(\d+)/)
      if (matchDays) {
        setDaysCount(parseInt(matchDays[1], 10))
      }
      if (initialDeadlineText.toLowerCase().includes('calendario')) {
        setIsBusinessDays(false)
      } else {
        setIsBusinessDays(true)
      }
      setTitle(`Plazo procesal (${agentName})`)
    }
  }, [initialDeadlineText, agentName])

  if (!isOpen) return null

  const calculation = calculatePeruvianDeadline(startDate, daysCount, isBusinessDays)

  const fullDetails = `CÓMPUTO DE PLAZO PROCESAL — HARDMAN INTELIGENCIA JURÍDICA
Especialista: ${agentName}
Materia/Asunto: ${title}
${reference ? `Expediente / Ref: ${reference}` : ''}
Fecha de Notificación / Inicio: ${startDate}
Tipo de Cómputo: ${isBusinessDays ? `${daysCount} días hábiles judiciales (excluye sábados, domingos y feriados nacionales peruanos)` : `${daysCount} días calendario`}
${calculation.holidaysSkipped.length > 0 ? `Feriados descontados: ${calculation.holidaysSkipped.join(', ')}` : ''}
FECHA FATAL DE VENCIMIENTO: ${calculation.formattedDueDate} (Hasta las 23:59 hrs en Mesa de Partes Virtual)`

  const handleGoogleCalendar = () => {
    openGoogleCalendar(title, fullDetails, calculation.dueDate)
  }

  const handleDownloadICS = () => {
    downloadCalculatedICS(title, fullDetails, calculation.dueDate)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullDetails)
    setCopiedSuccess(true)
    setTimeout(() => setCopiedSuccess(false), 2000)
  }

  const handleSaveLocal = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('hardman_saved_deadlines') || '[]')
      const newEntry = {
        id: Date.now().toString(),
        title,
        reference,
        dueDate: calculation.dueDate.toISOString(),
        formattedDueDate: calculation.formattedDueDate,
        agentName,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('hardman_saved_deadlines', JSON.stringify([newEntry, ...existing]))
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    } catch { /* storage error */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: '#161616',
          border: '1px solid #333333',
          boxShadow: '0 20px 50px rgba(0,0,0,0.80)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}>
              <Calendar size={15} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Calculadora & Gestor de Plazos</h3>
              <p className="text-[10px] text-white/40">Cómputo según calendario judicial peruano</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3.5 text-[12px]">
          <div>
            <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1" style={{ letterSpacing: '1px' }}>
              Asunto / Título del Plazo
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#c9a84c] text-[12px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1" style={{ letterSpacing: '1px' }}>
                Fecha de Notificación
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#c9a84c] text-[12px]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1" style={{ letterSpacing: '1px' }}>
                Cantidad de Días
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={daysCount}
                onChange={(e) => setDaysCount(Math.max(1, parseInt(e.target.value || '1', 10)))}
                className="w-full bg-[#111111] border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-[#c9a84c] text-[12px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1" style={{ letterSpacing: '1px' }}>
              Tipo de Cómputo Procesal
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsBusinessDays(true)}
                className={`py-2 px-3 rounded-lg text-[11px] font-medium border transition-all text-left ${
                  isBusinessDays
                    ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]'
                    : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
                }`}
              >
                ⚖️ Días Hábiles Judiciales
                <span className="block text-[9px] font-light opacity-70">Excluye sáb, dom y feriados</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBusinessDays(false)}
                className={`py-2 px-3 rounded-lg text-[11px] font-medium border transition-all text-left ${
                  !isBusinessDays
                    ? 'border-[#c9a84c] bg-[#c9a84c]/10 text-[#c9a84c]'
                    : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
                }`}
              >
                📅 Días Calendario
                <span className="block text-[9px] font-light opacity-70">Días corridos continuos</span>
              </button>
            </div>
          </div>

          {/* Result Card */}
          <div className="p-3.5 rounded-xl border" style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.25)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] mb-1">
              Vencimiento Fatal
            </p>
            <p className="text-sm font-semibold text-white">
              {calculation.formattedDueDate}
            </p>
            <p className="text-[10px] text-white/50 mt-1">
              Límite hasta las 23:59 hrs en Mesa de Partes Virtual (Poder Judicial / Fiscalía / SUNAT).
            </p>
            {calculation.holidaysSkipped.length > 0 && (
              <p className="text-[10px] text-[#c9a84c]/80 mt-1.5 pt-1.5 border-t border-white/5">
                ℹ️ Feriados descontados: {calculation.holidaysSkipped.join(', ')}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoogleCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all hover:bg-white/10 border border-white/15"
              title="Abrir evento en Google Calendar"
            >
              <Calendar size={13} className="text-[#4285F4]" />
              Google Calendar
            </button>
            <button
              onClick={handleDownloadICS}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all hover:bg-white/10 border border-white/15"
              title="Descargar archivo para Outlook y Apple Calendar"
            >
              <Download size={13} />
              Archivo .ICS
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-light transition-all border border-white/10 text-white/70 hover:text-white"
            >
              {copiedSuccess ? <><Check size={12} className="text-green-400" /> Copiado</> : <><Copy size={12} /> Copiar</>}
            </button>
            <button
              onClick={handleSaveLocal}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{ background: '#c9a84c', color: '#111111' }}
            >
              {savedSuccess ? <><Check size={12} /> Guardado</> : <><Star size={12} /> Guardar</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}



export default function Chat() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const agent = getAgent(agentId || '')

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [activeMode, setActiveMode] = useState<string | null>(null)

  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [speechSupported, setSpeechSupported] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const [audioRepliesEnabled, setAudioRepliesEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bufete_auto_speak') === 'true'
    } catch {
      return false
    }
  })
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null)
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null)
  const [isVoiceMessage, setIsVoiceMessage] = useState(false)
  const [deadlineModal, setDeadlineModal] = useState<{ isOpen: boolean; deadlineText?: string }>({ isOpen: false })
  const [scannerOpen, setScannerOpen] = useState(false)
  const [docGenModal, setDocGenModal] = useState<{ isOpen: boolean; docType: DocType }>({
    isOpen: false,
    docType: 'carta_notarial',
  })
  const [calcModal, setCalcModal] = useState<{ isOpen: boolean; tab: 'liquidacion' | 'alimentos' | 'prescripcion' }>({
    isOpen: false,
    tab: 'liquidacion',
  })
  const [whereToGoOpen, setWhereToGoOpen] = useState(false)
  const [liveCallOpen, setLiveCallOpen] = useState(false)
  const [spijModalOpen, setSpijModalOpen] = useState(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const [usage, setUsage] = useState<{ plan: string; questionsUsed: number; limit: number | null; isAdmin: boolean } | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [searchParams] = useSearchParams()
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const templatesRef = useRef<HTMLDivElement>(null)

  const [convSearch, setConvSearch] = useState('')
  const [convTagFilter, setConvTagFilter] = useState<'all' | 'cliente' | 'expediente'>('all')
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingConvId(conv.id)
    setEditingTitle(conv.title)
  }

  const handleSaveRename = async (id: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!editingTitle.trim()) {
      setEditingConvId(null)
      return
    }
    try {
      const updated = await api.conversations.updateTitle(id, editingTitle.trim())
      setConversations((prev) => prev.map((c) => c.id === id ? { ...c, title: updated.title } : c))
    } catch (err) {
      console.error('Error updating title:', err)
    } finally {
      setEditingConvId(null)
    }
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrolledUpRef = useRef<boolean>(false)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const liveTranscriptRef = useRef<string>('')
  const baseInputRef = useRef<string>('')
  const hasSpokenRef = useRef<boolean>(false)
  const isRecordingRef = useRef<boolean>(false)
  const finalTranscriptRef = useRef<string>('')

  useEffect(() => {
    if (!agent) navigate('/dashboard')
  }, [agent, navigate])

  // Reset conversation state when the agent changes, but preserve transferMessage if present
  useEffect(() => {
    setMessages([])
    setConversationId(undefined)
    setActiveMode(null)
    setIsVoiceMessage(false)
    stopSpeaking()
    cancelVoiceInput()
    loadConversations()
    setSidebarOpen(false)

    const state = location.state as { transferMessage?: string } | null
    if (state?.transferMessage) {
      setInput(state.transferMessage)
      setTimeout(autoResize, 80)
      window.history.replaceState({}, document.title)
    } else {
      try {
        const savedDraft = localStorage.getItem(`hardman_draft_${agentId || 'general'}_new`)
        if (savedDraft) {
          setInput(savedDraft)
          setTimeout(autoResize, 80)
        } else {
          setInput('')
        }
      } catch {
        setInput('')
      }
    }
  }, [agentId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-guardado de borrador (Draft Saving)
  useEffect(() => {
    try {
      const key = `hardman_draft_${agentId || 'general'}_${conversationId || 'new'}`
      if (input && input.trim()) {
        localStorage.setItem(key, input)
      } else {
        localStorage.removeItem(key)
      }
    } catch {
      // Ignorar errores de storage restringido
    }
  }, [input, agentId, conversationId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  useEffect(() => {
    api.account.usage().then(setUsage).catch(() => {})
  }, [])

  useEffect(() => {
    const convId = searchParams.get('conv')
    if (convId) loadConversation(convId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!templatesOpen) return
    const handler = (e: MouseEvent) => {
      if (!templatesRef.current?.contains(e.target as Node)) setTemplatesOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [templatesOpen])

  useEffect(() => {
    const speechApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const mediaSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    setSpeechSupported(Boolean(speechApi || mediaSupported))

    return () => {
      cancelVoiceInput()
      stopSpeaking()
    }
  }, [])

  const cleanTextForSpeech = (text: string) => {
    let t = text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/[>#*_~|═━─•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (t.length > 1200) {
      const sub = t.slice(0, 1200)
      const lastPunc = Math.max(
        sub.lastIndexOf('. '),
        sub.lastIndexOf('? '),
        sub.lastIndexOf('! '),
        sub.lastIndexOf('.\n')
      )
      if (lastPunc > 300) {
        t = sub.slice(0, lastPunc + 1)
      } else {
        t = sub
      }
    }
    return t.trim()
  }

  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setSpeakingMessageId(null)
    setAudioLoadingId(null)
  }

  // Garantizar precarga de voces del navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices()
      }
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
      }
    }
  }, [])

  const FEMALE_AGENTS = new Set(['valentina', 'camila', 'fernanda', 'adriana'])

  const isFemaleVoice = (v: SpeechSynthesisVoice): boolean => {
    const name = (v.name + ' ' + (v.voiceURI || '')).toLowerCase()
    const femaleKeywords = [
      'sabina', 'helena', 'laura', 'monica', 'mónica', 'paulina', 'camila', 'dalia',
      'salome', 'salomé', 'elvira', 'victoria', 'paloma', 'carmen', 'lupe', 'sofia',
      'sofía', 'lucia', 'lucía', 'elena', 'mia', 'mía', 'penelope', 'penélope',
      'francisca', 'jimena', 'alba', 'conchita', 'rosa', 'marta', 'hilda', 'catalina',
      'female', 'mujer', 'woman', 'girl'
    ]
    const maleKeywords = [
      'raul', 'raúl', 'pablo', 'jorge', 'gonzalo', 'alvaro', 'álvaro', 'alex',
      'david', 'carlos', 'mateo', 'alonso', 'enrique', 'manuel', 'andres', 'andrés',
      'diego', 'rodrigo', 'sebastian', 'sebastián', 'marco', 'marcos', 'julio',
      'male', 'hombre', 'man'
    ]
    const hasFemale = femaleKeywords.some((k) => name.includes(k))
    const hasMale = maleKeywords.some((k) => name.includes(k))
    if (hasFemale && !hasMale) return true
    if (hasMale && !hasFemale) return false
    if (name.includes('google') && name.includes('español') && !name.includes('estados unidos')) return true
    return false
  }

  const isMaleVoice = (v: SpeechSynthesisVoice): boolean => {
    const name = (v.name + ' ' + (v.voiceURI || '')).toLowerCase()
    const maleKeywords = [
      'raul', 'raúl', 'pablo', 'jorge', 'gonzalo', 'alvaro', 'álvaro', 'alex',
      'david', 'carlos', 'mateo', 'alonso', 'enrique', 'manuel', 'andres', 'andrés',
      'diego', 'rodrigo', 'sebastian', 'sebastián', 'marco', 'marcos', 'julio',
      'male', 'hombre', 'man'
    ]
    const femaleKeywords = [
      'sabina', 'helena', 'laura', 'monica', 'mónica', 'paulina', 'camila', 'dalia',
      'salome', 'salomé', 'elvira', 'victoria', 'paloma', 'carmen', 'lupe', 'sofia',
      'sofía', 'lucia', 'lucía', 'elena', 'mia', 'mía', 'penelope', 'penélope',
      'francisca', 'jimena', 'alba', 'conchita', 'rosa', 'marta', 'female', 'mujer'
    ]
    const hasMale = maleKeywords.some((k) => name.includes(k))
    const hasFemale = femaleKeywords.some((k) => name.includes(k))
    if (hasMale && !hasFemale) return true
    if (hasFemale && !hasMale) return false
    return false
  }

  const findBestVoice = (targetAgentId: string): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window)) return null
    const voices = window.speechSynthesis.getVoices()
    if (!voices || voices.length === 0) return null

    const wantFemale = FEMALE_AGENTS.has(targetAgentId.toLowerCase().trim())
    const esVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('es'))
    const pool = esVoices.length > 0 ? esVoices : voices

    if (wantFemale) {
      if (targetAgentId === 'adriana') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('elvira') || n.includes('helena') || n.includes('laura') || n.includes('sabina')
        })
        if (m) return m
      }
      if (targetAgentId === 'camila') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('camila') || n.includes('dalia') || n.includes('paulina') || n.includes('sabina')
        })
        if (m) return m
      }
      if (targetAgentId === 'valentina') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('camila') || n.includes('sabina') || n.includes('helena')
        })
        if (m) return m
      }
      if (targetAgentId === 'fernanda') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('salome') || n.includes('salomé') || n.includes('sabina') || n.includes('helena')
        })
        if (m) return m
      }
      const female = pool.find((v) => isFemaleVoice(v))
      if (female) return female
      const nonMale = pool.find((v) => !isMaleVoice(v))
      if (nonMale) return nonMale
      return pool[0]
    } else {
      if (targetAgentId === 'sebastian') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('alex') || n.includes('raul') || n.includes('raúl') || n.includes('jorge')
        })
        if (m) return m
      }
      if (targetAgentId === 'diego') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('jorge') || n.includes('raul') || n.includes('raúl') || n.includes('pablo')
        })
        if (m) return m
      }
      if (targetAgentId === 'rodrigo') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('gonzalo') || n.includes('pablo') || n.includes('alvaro') || n.includes('raul')
        })
        if (m) return m
      }
      if (targetAgentId === 'marco') {
        const m = pool.find((v) => {
          const n = v.name.toLowerCase()
          return n.includes('alvaro') || n.includes('álvaro') || n.includes('pablo') || n.includes('raul')
        })
        if (m) return m
      }
      const male = pool.find((v) => isMaleVoice(v))
      if (male) return male
      const nonFemale = pool.find((v) => !isFemaleVoice(v))
      if (nonFemale) return nonFemale
      return pool[0]
    }
  }

  const fallbackBrowserSpeech = (clean: string, messageId: string, currentAgentId?: string) => {
    if (!('speechSynthesis' in window)) {
      setSpeakingMessageId(null)
      return
    }
    window.speechSynthesis.cancel()

    const targetId = (currentAgentId || agent?.id || '').toLowerCase().trim()
    const wantFemale = FEMALE_AGENTS.has(targetId)

    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'es-PE'

    const voice = findBestVoice(targetId)
    if (voice) {
      utterance.voice = voice
      const voiceIsFemale = isFemaleVoice(voice)
      const voiceIsMale = isMaleVoice(voice)

      if (wantFemale) {
        utterance.pitch = voiceIsMale ? 1.35 : 1.10
        utterance.rate = 0.98
      } else {
        utterance.pitch = voiceIsFemale ? 0.75 : 0.88
        utterance.rate = 0.95
      }
    } else {
      utterance.pitch = wantFemale ? 1.25 : 0.85
      utterance.rate = 0.96
    }

    utterance.onstart = () => setSpeakingMessageId(messageId)
    utterance.onend = () => setSpeakingMessageId(null)
    utterance.onerror = () => setSpeakingMessageId(null)
    window.speechSynthesis.speak(utterance)
  }

  const speakAssistantMessage = async (text: string, messageId: string) => {
    stopSpeaking()
    const clean = cleanTextForSpeech(text)
    if (!clean) return

    setSpeakingMessageId(messageId)
    setAudioLoadingId(messageId)

    const targetAgentId = (agent?.id || '').toLowerCase().trim()
    const isFemale = FEMALE_AGENTS.has(targetAgentId)
    const effectiveAgentId = targetAgentId || (isFemale ? 'valentina' : 'sebastian')

    const abortCtrl = new AbortController()
    const timer = setTimeout(() => {
      try { abortCtrl.abort() } catch {}
    }, 12000)

    try {
      // 1. Try realistic Edge / ElevenLabs neural audio from backend
      const blob = await api.chat.tts({ text: clean, agentId: effectiveAgentId }, abortCtrl.signal)
      clearTimeout(timer)
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      currentAudioRef.current = audio
      setAudioLoadingId(null)

      audio.onended = () => {
        setSpeakingMessageId(null)
        currentAudioRef.current = null
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setAudioLoadingId(null)
        fallbackBrowserSpeech(clean, messageId, effectiveAgentId)
      }
      await audio.play()
    } catch (err) {
      clearTimeout(timer)
      console.warn('TTS backend failed, using refined browser speech:', err)
      setAudioLoadingId(null)
      fallbackBrowserSpeech(clean, messageId, effectiveAgentId)
    }
  }

  const stopAllMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }

  const cancelVoiceInput = () => {
    isRecordingRef.current = false
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onresult = null
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    mediaRecorderRef.current = null
    audioChunksRef.current = []
    stopAllMediaTracks()
    setIsRecording(false)
    setIsTranscribing(false)
    if (baseInputRef.current !== undefined) {
      setInput(baseInputRef.current)
    }
    setLiveTranscript('')
    liveTranscriptRef.current = ''
    finalTranscriptRef.current = ''
  }

  const startVoiceInput = async () => {
    cancelVoiceInput()
    setVoiceError(null)
    setMicPermissionDenied(false)
    setLiveTranscript('')
    liveTranscriptRef.current = ''
    finalTranscriptRef.current = ''
    hasSpokenRef.current = false
    baseInputRef.current = input
    isRecordingRef.current = true

    let stream: MediaStream | null = null
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador no soporta captura de audio')
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
    } catch (err: any) {
      console.warn('Mic permission error:', err)
      isRecordingRef.current = false
      setMicPermissionDenied(true)
      setVoiceError('Permiso de micrófono no concedido. Habilita el acceso en tu navegador.')
      return
    }

    setIsRecording(true)
    setRecordingSeconds(0)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((s) => s + 1)
    }, 1000)

    // Iniciar MediaRecorder para capturar audio como respaldo 100% garantizado
    if (stream) {
      try {
        const mime = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''
        const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
        mediaRecorderRef.current = recorder
        audioChunksRef.current = []
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data)
          }
        }
        recorder.start(250)
      } catch (recErr) {
        console.warn('MediaRecorder error:', recErr)
      }
    }

    // Reconocimiento de voz en tiempo real con Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition()
        const userLang = (navigator.language || '').toLowerCase()
        rec.lang = userLang.startsWith('es') ? navigator.language : 'es-PE'
        rec.continuous = true
        rec.interimResults = true
        rec.maxAlternatives = 1

        rec.onresult = (event: any) => {
          let interim = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i]
            if (res && res[0]) {
              if (res.isFinal) {
                finalTranscriptRef.current += res[0].transcript + ' '
              } else {
                interim += res[0].transcript
              }
            }
          }
          const full = (finalTranscriptRef.current + interim).trim()
          if (full) {
            hasSpokenRef.current = true
            setIsVoiceMessage(true)
            const base = baseInputRef.current ? baseInputRef.current.trim() : ''
            setInput(base ? `${base} ${full}` : full)
            setTimeout(autoResize, 10)
          }
        }

        rec.onend = () => {
          // Auto-reiniciar si el usuario sigue grabando (evita que el navegador corte tras 1 seg de silencio)
          if (isRecordingRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch {}
          }
        }

        rec.onerror = (e: any) => {
          if (e?.error === 'not-allowed') {
            setMicPermissionDenied(true)
            setVoiceError('Permiso de micrófono no concedido.')
          }
        }

        recognitionRef.current = rec
        rec.start()
      } catch (speechErr) {
        console.warn('SpeechRecognition start failed:', speechErr)
      }
    }
  }

  const stopVoiceInput = async () => {
    isRecordingRef.current = false
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null
        recognitionRef.current.onerror = null
        recognitionRef.current.stop()
      } catch {}
      recognitionRef.current = null
    }

    setIsRecording(false)

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      const recorder = mediaRecorderRef.current
      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve()
        try { recorder.stop() } catch { resolve() }
      })
    }
    mediaRecorderRef.current = null
    stopAllMediaTracks()

    setLiveTranscript('')
    liveTranscriptRef.current = ''

    // Si Web Speech API ya escribió texto en el input, terminamos de inmediato
    if (hasSpokenRef.current) {
      setIsVoiceMessage(true)
      setTimeout(() => {
        autoResize()
        textareaRef.current?.focus()
      }, 30)
      return
    }

    // Si Web Speech API no capturó texto (bloqueado/sin soporte en el navegador), transcribir audio grabado con el backend
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      if (audioBlob.size > 500) {
        setIsTranscribing(true)
        try {
          const res = await api.chat.stt(audioBlob)
          if (res?.text && res.text.trim()) {
            setIsVoiceMessage(true)
            const transcribed = res.text.trim()
            const base = baseInputRef.current ? baseInputRef.current.trim() : ''
            setInput(base ? `${base} ${transcribed}` : transcribed)
            setTimeout(() => {
              autoResize()
              textareaRef.current?.focus()
            }, 30)
          }
        } catch (sttErr) {
          console.warn('STT API error:', sttErr)
        } finally {
          setIsTranscribing(false)
        }
      }
    }

    setIsVoiceMessage(true)
    setTimeout(() => {
      autoResize()
      textareaRef.current?.focus()
    }, 30)
  }

  const toggleVoiceInput = () => {
    if (isRecording) {
      stopVoiceInput()
    } else {
      startVoiceInput()
    }
  }

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const isUp = distanceFromBottom > 100
    isUserScrolledUpRef.current = isUp
    setShowScrollBottom(isUp)
  }, [])

  const scrollToBottom = useCallback((force = false) => {
    if (!force && isUserScrolledUpRef.current) {
      return
    }
    if (force) {
      isUserScrolledUpRef.current = false
      setShowScrollBottom(false)
    }
    const el = scrollContainerRef.current
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: force ? 'smooth' : 'auto',
      })
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: force ? 'smooth' : 'auto' })
    }
  }, [])

  const cancelConsultation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
  }, [])

  const loadConversations = async () => {
    setLoadingConvs(true)
    try {
      const all = await api.conversations.list()
      setConversations(all.filter((c) => c.agentId === agentId))
    } catch {
    } finally {
      setLoadingConvs(false)
    }
  }

  const loadConversation = async (id: string) => {
    try {
      const conv = await api.conversations.get(id)
      setMessages((conv.messages || []) as Message[])
      setConversationId(id)
      setSidebarOpen(false)
      stopSpeaking()
      try {
        const savedDraft = localStorage.getItem(`hardman_draft_${agentId || 'general'}_${id}`)
        if (savedDraft) {
          setInput(savedDraft)
          setTimeout(autoResize, 80)
        } else {
          setInput('')
        }
      } catch {
        setInput('')
      }
    } catch {
    }
  }

  const newConversation = () => {
    cancelConsultation()
    setMessages([])
    setConversationId(undefined)
    isUserScrolledUpRef.current = false
    setShowScrollBottom(false)
    try {
      const savedDraft = localStorage.getItem(`hardman_draft_${agentId || 'general'}_new`)
      if (savedDraft) {
        setInput(savedDraft)
        setTimeout(autoResize, 80)
      } else {
        setInput('')
      }
    } catch {
      setInput('')
    }
    setActiveMode(null)
    setSidebarOpen(false)
    clearAttachment()
    stopSpeaking()
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.focus()
    }
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.conversations.delete(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (conversationId === id) newConversation()
    } catch {
    }
  }

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }

  const handleFileSelect = async (file: File) => {
    const MAX_MB = 25
    if (file.size > MAX_MB * 1024 * 1024) {
      setAttachedFile(file)
      setExtractError(`El archivo supera el límite de ${MAX_MB}MB. Se recomienda comprimir el PDF o subirlo por cuadernos procesales.`)
      setExtractedText(null)
      setExtracting(false)
      return
    }
    setAttachedFile(file)
    setExtractError(null)
    setPageCount(null)
    setExtracting(true)
    try {
      const result = await api.files.extract(file)
      setExtractedText(result.text)
      setPageCount(result.pageCount ?? null)
    } catch (err: any) {
      setExtractError(err.message || 'Error al procesar el archivo')
      setExtractedText(null)
    } finally {
      setExtracting(false)
    }
  }

  const clearAttachment = () => {
    setAttachedFile(null)
    setExtractedText(null)
    setExtractError(null)
    setExtracting(false)
    setPageCount(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if ((!trimmed && !extractedText) || loading || !agent) return

    let fullContent = trimmed
    const wasVoice = isVoiceMessage
    if (extractedText) {
      const fileLabel = attachedFile ? `[Archivo adjunto: ${attachedFile.name}]\n` : ''
      const contextBlock = `${fileLabel}--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---\n${extractedText}\n--- FIN DEL DOCUMENTO ---\n\n`
      fullContent = contextBlock + (trimmed || 'Analiza este documento y proporciona tu opinión legal.')
    }

    const userMessage: Message = {
      role: 'user',
      content: fullContent,
      timestamp: new Date().toISOString(),
      isVoice: wasVoice,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    try {
      localStorage.removeItem(`hardman_draft_${agent?.id || 'general'}_${conversationId || 'new'}`)
    } catch {}
    setIsVoiceMessage(false)
    clearAttachment()
    setLoading(true)
    requestPushPermission()

    // Reset user scroll lock and force scroll down to user's question
    isUserScrolledUpRef.current = false
    setShowScrollBottom(false)
    setTimeout(() => scrollToBottom(true), 40)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    let firstChunkReceived = false
    let accumulatedText = ''
    const msgTimestamp = new Date().toISOString()

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      await api.chat.sendStream(
        {
          agentId: agent.id,
          messages: newMessages,
          conversationId,
          letterhead: getSavedLetterhead(),
        },
        {
          onChunk: (chunk: string) => {
            accumulatedText += chunk
            if (!firstChunkReceived) {
              firstChunkReceived = true
              const assistantMsg: Message = {
                role: 'assistant',
                content: accumulatedText,
                timestamp: msgTimestamp,
              }
              setMessages([...newMessages, assistantMsg])
            } else {
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], content: accumulatedText }
                }
                return updated
              })
            }
          },
          onDone: (result) => {
            abortControllerRef.current = null
            if (result.conversationId && !conversationId) {
              setConversationId(result.conversationId)
            }
            if (result.transferTo) {
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = { ...updated[lastIdx], transferTo: result.transferTo }
                }
                return updated
              })
            }
            loadConversations()

            if (audioRepliesEnabled && accumulatedText) {
              speakAssistantMessage(accumulatedText, msgTimestamp)
            }
            sendPushNotification(agent.name)

            if (usage && usage.limit !== null) {
              setUsage((prev) => prev ? { ...prev, questionsUsed: prev.questionsUsed + 1 } : null)
            }
            setLoading(false)
          },
          onError: (err: any) => {
            abortControllerRef.current = null
            if (err?.name === 'AbortError' || controller.signal.aborted) {
              setLoading(false)
              return
            }
            const errorMsg = err.message || 'Hubo un error al procesar tu consulta. Por favor intenta de nuevo.'
            if (!firstChunkReceived) {
              setMessages([
                ...newMessages,
                {
                  role: 'assistant',
                  content: errorMsg,
                  timestamp: msgTimestamp,
                  isError: true,
                  lastUserPrompt: fullContent,
                },
              ])
            } else {
              setMessages((prev) => {
                const updated = [...prev]
                const lastIdx = updated.length - 1
                if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: accumulatedText || errorMsg,
                    isError: true,
                    lastUserPrompt: fullContent,
                  }
                }
                return updated
              })
            }
            setLoading(false)
          },
        },
        controller.signal
      )
    } catch (err: any) {
      abortControllerRef.current = null
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        setLoading(false)
        return
      }
      const errorMsg = err.message || 'Hubo un error al procesar tu consulta. Por favor intenta de nuevo.'
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: errorMsg,
          timestamp: msgTimestamp,
          isError: true,
          lastUserPrompt: fullContent,
        },
      ])
      setLoading(false)
    }
  }, [input, loading, agent, messages, conversationId, agentId, extractedText, attachedFile, usage, audioRepliesEnabled, isVoiceMessage, scrollToBottom])

  const handleRetryPrompt = (promptToRetry: string) => {
    if (!promptToRetry) return
    setInput(promptToRetry)
    if (textareaRef.current) {
      textareaRef.current.focus()
      setTimeout(autoResize, 60)
    }
  }

  const handleContinueWriting = () => {
    setInput('Por favor continúa con la redacción legal exactamente desde el último punto donde te quedaste, respetando el formato procesal y la numeración.')
    if (textareaRef.current) {
      textareaRef.current.focus()
      setTimeout(autoResize, 60)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleShare = async () => {
    if (!conversationId) return
    setShareLoading(true)
    try {
      const { token } = await api.conversations.share(conversationId)
      const url = `${window.location.origin}/shared/${token}`
      await navigator.clipboard.writeText(url)
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 3000)
    } catch {
    } finally {
      setShareLoading(false)
    }
  }

  const insertSuggestion = (text: string) => {
    setInput(text)
    textareaRef.current?.focus()
    setTimeout(autoResize, 50)
  }

  const applyMode = (mode: typeof PROMPT_MODES[0]) => {
    if (activeMode === mode.id) {
      setActiveMode(null)
      return
    }
    setActiveMode(mode.id)
    if (!input.trim()) {
      setInput(mode.promptPrefix)
    } else {
      setInput(`${mode.promptPrefix}${input.replace(/^Por favor emite.*?: |^Elabora un resumen.*?: |^Estructura la estrategia.*?: |^Redacta las cláusulas.*?: /, '')}`)
    }
    textareaRef.current?.focus()
    setTimeout(autoResize, 50)
  }

  if (!agent) return null

  const userInitials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const isLimited = usage && usage.limit !== null && !usage.isAdmin
  const limitReached = isLimited && usage!.questionsUsed >= usage!.limit!

  return (
    <div className="flex flex-col overflow-hidden" style={{ background: '#111111', height: '100dvh', minHeight: '100vh' }}>
      {/* NAVBAR */}
      <header
        className="h-14 flex-shrink-0 flex items-center justify-between gap-2 px-3 md:px-4 border-b z-30"
        style={{ background: '#111111', borderColor: '#2a2a2a' }}
      >
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="md:hidden w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ border: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.75)' }}
            aria-label="Abrir historial"
          >
            <Menu size={16} />
          </button>
          <div className="hidden sm:block">
            <JurisClaudeLogo size="sm" />
          </div>
        </div>

        {/* Center: agent info */}
        <div className="flex items-center justify-center gap-2 min-w-0 flex-1 sm:flex-none">
          <button
            onClick={() => navigate('/dashboard')}
            className="hidden sm:flex items-center gap-1 text-[11px] font-light transition-colors flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)' }}
          >
            <ChevronLeft size={14} />
            <span className="hidden md:inline">Especialistas</span>
          </button>
          <div className="hidden sm:block w-px h-4 flex-shrink-0" style={{ background: '#2a2a2a' }} />
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: '1.5px solid rgba(201,168,76,0.25)' }}
            >
              <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
            </div>
            <div className="min-w-0">
              <span className="text-[12px] md:text-[13px] font-normal text-white truncate block">{agent.name}</span>
              <p className="text-[10px] font-light hidden md:block" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {agent.role} · En línea 24/7
              </p>
            </div>
            <span className="w-[6px] h-[6px] rounded-full dot-online flex-shrink-0" style={{ background: '#34d17a' }} />
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-1.5 md:gap-3 justify-end flex-shrink-0">
          <UsageCounterBadge />

          {messages.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('¿Deseas cancelar la consulta actual y comenzar una nueva?')) {
                  newConversation()
                }
              }}
              className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-medium hover:opacity-90 active:scale-95"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
              }}
              title="Cancelar la consulta actual y reiniciar el chat"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline font-normal">Cancelar consulta</span>
            </button>
          )}

          <a
            href="https://wa.me/51929725274?text=Hola%20Hardman%20IA%2C%20requiero%20soporte%20con%20mi%20consulta%20legal."
            target="_blank"
            rel="noreferrer"
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-medium hover:opacity-90 active:scale-95"
            style={{
              background: 'rgba(37,211,102,0.12)',
              border: '1px solid rgba(37,211,102,0.30)',
              color: '#25D366',
            }}
            title="Soporte directo por WhatsApp (929 725 274)"
          >
            <MessageCircle size={14} className="fill-[#25D366]" />
            <span className="hidden sm:inline font-semibold">WhatsApp</span>
          </a>

          {conversationId && (
            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
              style={{ border: '1px solid #2a2a2a', color: shareCopied ? '#34d17a' : 'rgba(255,255,255,0.45)' }}
              title={shareCopied ? '¡Enlace copiado!' : 'Compartir conversación'}
            >
              {shareCopied ? <Check size={14} /> : <Share2 size={14} />}
            </button>
          )}

          <button
            onClick={() => {
              if (audioRepliesEnabled) stopSpeaking()
              const next = !audioRepliesEnabled
              setAudioRepliesEnabled(next)
              try {
                localStorage.setItem('bufete_auto_speak', String(next))
              } catch {}
            }}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
            style={{
              border: `1px solid ${audioRepliesEnabled ? 'rgba(201,168,76,0.35)' : '#2a2a2a'}`,
              background: audioRepliesEnabled ? 'rgba(201,168,76,0.08)' : 'transparent',
              color: audioRepliesEnabled ? '#c9a84c' : 'rgba(255,255,255,0.45)',
            }}
            title={
              audioRepliesEnabled
                ? 'Voz automática activada: El abogado habla al responder (clic para silenciar)'
                : 'Voz automática desactivada: El abogado solo hablará si pulsas "Escuchar" en su mensaje'
            }
          >
            {audioRepliesEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>

          <button onClick={() => navigate('/account')}>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold"
              style={{
                background: 'rgba(201,168,76,0.10)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: '#c9a84c',
              }}
            >
              {userInitials}
            </div>
          </button>
          <button
            onClick={() => { logout(); navigate('/login') }}
            className="hidden md:block text-[11px] font-light transition-colors"
            style={{ color: 'rgba(255,255,255,0.30)' }}
          >
            Salir →
          </button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <button
            className="md:hidden fixed inset-0 z-30 bg-black/45"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar historial"
          />
        )}

        {/* Sidebar history */}
        <aside
          className={`fixed md:static top-14 bottom-0 left-0 z-40 md:z-auto w-[84vw] max-w-[280px] md:w-[220px] flex-shrink-0 flex flex-col overflow-hidden h-[calc(100vh-56px)] md:h-full border-r transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#2a2a2a' }}>
            <span
              className="text-[7px] font-bold uppercase"
              style={{ letterSpacing: '3px', color: 'rgba(255,255,255,0.30)' }}
            >
              HISTORIAL
            </span>
            <button
              onClick={newConversation}
              className="px-2.5 py-1 rounded-md text-[9px] font-semibold transition-all"
              style={{
                color: '#c9a84c',
                border: '1px solid rgba(201,168,76,0.25)',
                background: 'rgba(201,168,76,0.08)',
              }}
            >
              + Nueva
            </button>
          </div>

          {/* Quick Search & Tag Filters */}
          <div className="px-3 py-2 border-b" style={{ borderColor: '#262626' }}>
            <div className="relative mb-2">
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30" />
              <input
                type="text"
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                placeholder="Buscar (cliente, exp)..."
                className="w-full h-7 pl-7 pr-2 rounded text-[10px] bg-[#141414] border border-[#2a2a2a] text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setConvTagFilter('all')}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
                  convTagFilter === 'all'
                    ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setConvTagFilter('cliente')}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
                  convTagFilter === 'cliente'
                    ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
                title="Filtrar por Cliente"
              >
                👤 Clientes
              </button>
              <button
                type="button"
                onClick={() => setConvTagFilter('expediente')}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-all ${
                  convTagFilter === 'expediente'
                    ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40'
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
                title="Filtrar por Expediente"
              >
                📂 Expedientes
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
            {loadingConvs ? (
              <div className="space-y-2 px-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                  style={{ background: '#222222', border: '1px solid #2a2a2a' }}
                >
                  <MessageSquare size={16} style={{ color: 'rgba(255,255,255,0.30)' }} />
                </div>
                <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  Sin consultas previas<br />con {agent.name}
                </p>
              </div>
            ) : (
              conversations
                .filter((c) => {
                  const title = (c.title || '').toLowerCase()
                  const matchesSearch = !convSearch || title.includes(convSearch.toLowerCase())
                  if (!matchesSearch) return false
                  if (convTagFilter === 'cliente') {
                    return title.includes('cliente') || title.includes('caso') || title.includes('defensa')
                  }
                  if (convTagFilter === 'expediente') {
                    return title.includes('exp') || title.includes('carpeta') || title.includes('diligencia') || title.includes('0') || title.includes('202')
                  }
                  return true
                })
                .map((conv) => {
                const isCurrent = conversationId === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className="group flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all gap-2"
                    style={{
                      background: isCurrent ? 'rgba(201,168,76,0.12)' : 'transparent',
                      border: isCurrent ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: isCurrent ? '#c9a84c' : 'rgba(255,255,255,0.30)' }}
                        />
                        <span className="text-[8px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: isCurrent ? '#c9a84c' : 'rgba(255,255,255,0.50)' }}>
                          {agent.badge}
                        </span>
                      </div>

                      {editingConvId === conv.id ? (
                        <div className="flex items-center gap-1 mt-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id, e)
                              if (e.key === 'Escape') setEditingConvId(null)
                            }}
                            autoFocus
                            className="px-1.5 py-0.5 rounded bg-[#111] border border-[#c9a84c] text-white text-[11px] w-full focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleSaveRename(conv.id, e)}
                            className="p-1 rounded bg-[#c9a84c] text-black hover:bg-[#dfbc5e]"
                            title="Guardar"
                          >
                            <Check size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setEditingConvId(null) }}
                            className="p-1 rounded text-white/50 hover:text-white"
                            title="Cancelar"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <p
                            className="text-[11px] leading-tight line-clamp-2 flex-1"
                            style={{
                              fontWeight: isCurrent ? 500 : 300,
                              color: isCurrent ? '#ffffff' : 'rgba(255,255,255,0.70)',
                            }}
                            title={conv.title}
                          >
                            {conv.title}
                          </p>
                          <button
                            onClick={(e) => handleStartRename(conv, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-[#c9a84c] text-white/30 transition-opacity"
                            title="Renombrar (ej: Cliente Pérez / Exp. 042-2026)"
                          >
                            <Edit2 size={10} />
                          </button>
                        </div>
                      )}

                      <p className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        {formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all flex-shrink-0 mt-1"
                      style={{ color: 'rgba(255,255,255,0.30)' }}
                      title="Eliminar consulta"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Limit reached banner */}
          {limitReached && (
            <div
              className="flex items-center gap-3 px-6 py-3 border-b"
              style={{ background: 'rgba(255,100,100,0.08)', borderColor: 'rgba(255,100,100,0.15)' }}
            >
              <AlertTriangle size={15} style={{ color: '#ff6464' }} />
              <p className="text-[11px] font-light" style={{ color: '#ff6464' }}>
                Has alcanzado el límite de {usage!.limit} consultas gratuitas. Suscríbete para consultas ilimitadas.
              </p>
            </div>
          )}

          {/* Messages */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 md:py-6 space-y-5 md:space-y-6"
          >
            {messages.length === 0 ? (
              <WelcomeScreen
                agent={agent}
                onSuggestion={insertSuggestion}
              />
            ) : (
              <>
                {messages.map((msg, i) => (
                  <MessageBubble
                    key={i}
                    message={msg}
                    agent={agent}
                    userInitials={userInitials}
                    speakingMessageId={speakingMessageId}
                    audioLoadingId={audioLoadingId}
                    onSpeak={(text, id) => speakAssistantMessage(text, id)}
                    onStopSpeak={stopSpeaking}
                    onOpenDeadline={(text) => setDeadlineModal({ isOpen: true, deadlineText: text })}
                    onRetry={handleRetryPrompt}
                    onContinue={handleContinueWriting}
                    lastUserMessage={
                      messages
                        .slice(0, i)
                        .reverse()
                        .find((m) => m.role === 'user')?.content
                    }
                  />
                ))}
                {loading && (
                  <ThinkingIndicator
                    agent={agent}
                    lastUserMessage={messages.filter((m) => m.role === 'user').slice(-1)[0]?.content}
                    onCancel={cancelConsultation}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll Bottom Button */}
          <AnimatePresence>
            {showScrollBottom && (
              <motion.button
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => scrollToBottom(true)}
                className="absolute right-4 md:right-8 bottom-24 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md transition-all border group"
                style={{
                  background: 'rgba(20, 20, 20, 0.94)',
                  borderColor: 'rgba(201, 168, 76, 0.35)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                }}
                title="Bajar al último mensaje"
              >
                {loading ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#c9a84c] animate-ping" />
                    <span className="text-[11px] font-medium text-white/90">Respuesta en curso</span>
                    <ChevronDown size={14} className="text-[#c9a84c] group-hover:translate-y-0.5 transition-transform" />
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-medium text-white/90">Bajar al final</span>
                    <ChevronDown size={14} className="text-[#c9a84c] group-hover:translate-y-0.5 transition-transform" />
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Input area */}
          <div className="flex-shrink-0 p-3 sm:p-4 md:px-8 md:pb-6 relative z-20">
            <div className="max-w-4xl mx-auto space-y-2">

              {/* Voice message indicator in input */}
              {isVoiceMessage && input.trim() && !isRecording && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'rgba(201,168,76,0.08)' }}>
                  <Mic size={10} style={{ color: '#c9a84c' }} />
                  <span className="text-[9px] font-light" style={{ color: 'rgba(201,168,76,0.8)' }}>Mensaje de voz — puedes editar antes de enviar</span>
                </div>
              )}

              {/* Attached file preview */}
              {attachedFile && (
                <div
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: extractError ? 'rgba(255,100,100,0.10)' : 'rgba(201,168,76,0.10)',
                      border: `1px solid ${extractError ? 'rgba(255,100,100,0.20)' : 'rgba(201,168,76,0.20)'}`,
                    }}
                  >
                    {extracting ? (
                      <Loader2 size={14} className="animate-spin" style={{ color: '#c9a84c' }} />
                    ) : extractError ? (
                      <AlertTriangle size={14} style={{ color: '#ff6464' }} />
                    ) : (
                      <FileText size={14} style={{ color: '#c9a84c' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-normal text-white truncate">{attachedFile.name}</p>
                    <p className="text-[9px] font-light" style={{ color: extractError ? '#ff6464' : 'rgba(255,255,255,0.40)' }}>
                      {extracting
                        ? `Procesando${attachedFile.size > 5 * 1024 * 1024 ? ' archivo grande...' : '...'}`
                        : extractError
                        ? extractError
                        : (() => {
                            const sizeMB = attachedFile.size / (1024 * 1024)
                            const sizeStr = sizeMB >= 1 ? `${sizeMB.toFixed(1)} MB` : `${(attachedFile.size / 1024).toFixed(0)} KB`
                            const pageStr = pageCount ? ` · ${pageCount} pág.` : ''
                            const recNotice = sizeMB > 15 ? ' · (Se recomienda <15MB para máxima agilidad)' : ''
                            return `${sizeStr}${pageStr} · Listo${recNotice}`
                          })()}
                    </p>
                  </div>
                  <button
                    onClick={clearAttachment}
                    className="p-1 rounded transition-colors flex-shrink-0"
                    style={{ color: 'rgba(255,255,255,0.30)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept={FILE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />
              <input
                ref={imageInputRef}
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
              />

              {/* Microphone permission alert banner */}
              <AnimatePresence>
                {micPermissionDenied && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="mb-2 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5' }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle size={15} className="flex-shrink-0 text-red-400" />
                      <span className="truncate sm:whitespace-normal">
                        <strong>Micrófono bloqueado:</strong> Haz clic en el candado 🔒 de tu navegador y permite el <strong>Micrófono</strong>.
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={startVoiceInput}
                        className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] font-medium transition-colors"
                      >
                        Reintentar
                      </button>
                      <button
                        onClick={() => setMicPermissionDenied(false)}
                        className="p-1 rounded text-white/50 hover:text-white"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Live Dictation Active Indicator */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-2 px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 text-xs overflow-hidden"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.30)', color: '#fca5a5' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      <span className="text-[11px] font-medium text-white/90">
                        Escuchando... habla y tu voz se escribirá directamente aquí en tiempo real
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopVoiceInput}
                      className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-white text-[10px] font-medium transition-colors"
                    >
                      Listo
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input container */}
              <div
                className="rounded-[14px] p-2.5 sm:p-3 transition-all duration-300"
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #333333',
                  opacity: limitReached ? 0.5 : 1,
                  pointerEvents: limitReached ? 'none' : 'auto',
                }}
                onFocus={(e) => {
                  const container = e.currentTarget
                  container.style.borderColor = '#c9a84c'
                  container.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.08)'
                }}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    const container = e.currentTarget
                    container.style.borderColor = '#333333'
                    container.style.boxShadow = 'none'
                  }
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(); if (isVoiceMessage) setIsVoiceMessage(false) }}
                  onKeyDown={handleKeyDown}
                  placeholder={`Escribe o usa el micrófono para ${agent.name}...`}
                  rows={1}
                  className="w-full bg-transparent outline-none resize-none text-[13px] font-light leading-relaxed px-1"
                  style={{
                    minHeight: '26px',
                    maxHeight: '120px',
                    caretColor: '#c9a84c',
                    color: '#ffffff',
                  }}
                />

                <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Left actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-light transition-colors"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#c9a84c' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      title="Adjuntar PDF o Word (Máx. 25MB · Recomendado hasta 15MB para máxima agilidad)"
                    >
                      <Paperclip size={12} />
                      <span className="hidden sm:inline">PDF / WORD</span>
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-light transition-colors"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#c9a84c' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      title="Adjuntar imagen"
                    >
                      <ImageIcon size={12} />
                      <span className="hidden sm:inline">IMAGEN</span>
                    </button>

                    {/* SPIJ & Acuerdos Plenarios quick button */}
                    <button
                      type="button"
                      onClick={() => setSpijModalOpen(true)}
                      className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-light transition-colors px-2 py-1 rounded-md"
                      style={{
                        color: spijModalOpen ? '#c9a84c' : 'rgba(201,168,76,0.85)',
                        background: spijModalOpen ? 'rgba(201,168,76,0.12)' : 'transparent',
                      }}
                      title="Consultar o insertar Acuerdos Plenarios de la Corte Suprema y Leyes SPIJ"
                    >
                      <Scale size={12} className="text-[#c9a84c]" />
                      <span className="font-medium">SPIJ / PLENOS</span>
                    </button>

                    {/* Specialist Document Templates (Desktop & Mobile) */}
                    <div ref={templatesRef} className="relative">
                      <button
                        onClick={() => setTemplatesOpen((o) => !o)}
                        className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-[10px] font-light transition-colors px-2 py-1 rounded-md"
                        style={{
                          color: templatesOpen ? '#c9a84c' : 'rgba(255,255,255,0.40)',
                          background: templatesOpen ? 'rgba(201,168,76,0.10)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#c9a84c' }}
                        onMouseLeave={(e) => { if (!templatesOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.40)' }}
                        title={`Plantillas legales de ${agent.name} (${agent.badge})`}
                      >
                        <BookOpen size={12} />
                        <span>PLANTILLAS</span>
                      </button>
                      {templatesOpen && (
                        <div
                          className="absolute bottom-full left-0 mb-2 rounded-xl overflow-hidden z-50 w-72 sm:w-84"
                          style={{ background: '#1c1c1c', border: '1px solid #333333', boxShadow: '0 12px 40px rgba(0,0,0,0.80)' }}
                        >
                          <div className="px-3.5 py-2.5 border-b flex items-center justify-between" style={{ borderColor: '#2a2a2a', background: '#181818' }}>
                            <div>
                              <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#c9a84c' }}>
                                PLANTILLAS · {agent.role.toUpperCase()}
                              </p>
                              <p className="text-[9px] text-white/40">Modelos de {agent.name}</p>
                            </div>
                            <span className="text-[8px] px-1.5 py-0.5 rounded uppercase font-bold" style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.25)' }}>
                              {agent.badge}
                            </span>
                          </div>
                          <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                            {(SPECIALIST_TEMPLATES[agentId || ''] || SPECIALIST_TEMPLATES.valentina).map((tpl) => {
                              const TplIcon = tpl.icon
                              return (
                                <button
                                  key={tpl.label}
                                  onClick={() => {
                                    setInput(tpl.prompt)
                                    setTemplatesOpen(false)
                                    textareaRef.current?.focus()
                                    setTimeout(autoResize, 50)
                                  }}
                                  className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors group hover:bg-white/[0.04]"
                                >
                                  <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <TplIcon size={13} style={{ color: tpl.badgeColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] font-medium text-white/80 group-hover:text-[#c9a84c] transition-colors leading-snug">
                                      {tpl.label}
                                    </p>
                                    <p className="text-[9px] text-white/30 truncate mt-0.5">
                                      {tpl.prompt.slice(0, 50)}...
                                    </p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2">
                    {input.length > 0 && (
                      <span className="text-[9px] hidden lg:inline" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        Enter · Shift+Enter
                      </span>
                    )}

                    {/* Microphone button */}
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      disabled={isTranscribing}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={
                        isRecording
                          ? { background: 'rgba(239,68,68,0.20)', border: '1.5px solid rgba(239,68,68,0.70)', color: '#ef4444', boxShadow: '0 0 10px rgba(239,68,68,0.3)' }
                          : isTranscribing
                          ? { background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#c9a84c' }
                          : { background: 'rgba(255,255,255,0.07)', border: '1px solid #333333', color: 'rgba(255,255,255,0.60)' }
                      }
                      title={isRecording ? 'Detener grabación' : isTranscribing ? 'Transcribiendo audio...' : 'Hablar por micrófono (dictado por voz)'}
                    >
                      {isTranscribing ? (
                        <Loader2 size={13} className="animate-spin text-[#c9a84c]" />
                      ) : isRecording ? (
                        <Square size={11} fill="#ef4444" />
                      ) : (
                        <Mic size={14} />
                      )}
                    </button>

                    {/* Send / Cancel button */}
                    {loading ? (
                      <motion.button
                        type="button"
                        onClick={cancelConsultation}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 transition-all duration-200 text-[11px] font-medium shadow-md"
                        style={{
                          background: 'rgba(239, 68, 68, 0.18)',
                          border: '1px solid rgba(239, 68, 68, 0.45)',
                          color: '#f87171',
                        }}
                        title="Cancelar consulta en curso"
                      >
                        <Square size={11} fill="currentColor" />
                        <span>Cancelar</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={sendMessage}
                        disabled={(!input.trim() && !extractedText) || extracting || isRecording || isTranscribing}
                        whileHover={{ scale: (input.trim() || extractedText) ? 1.05 : 1 }}
                        whileTap={{ scale: (input.trim() || extractedText) ? 0.95 : 1 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                        style={{
                          background: (input.trim() || extractedText) && !extracting ? '#c9a84c' : 'rgba(255,255,255,0.07)',
                          color: (input.trim() || extractedText) && !extracting ? '#111111' : 'rgba(255,255,255,0.25)',
                          cursor: (!input.trim() && !extractedText) || extracting ? 'not-allowed' : 'pointer',
                        }}
                        title="Enviar consulta al abogado"
                      >
                        <ArrowUp size={15} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}

      <DeadlineModal
        isOpen={deadlineModal.isOpen}
        onClose={() => setDeadlineModal({ isOpen: false })}
        agentName={agent.name}
        initialDeadlineText={deadlineModal.deadlineText}
      />

      <DocumentScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
      />

      <CitizenDocumentGeneratorModal
        isOpen={docGenModal.isOpen}
        onClose={() => setDocGenModal((p) => ({ ...p, isOpen: false }))}
        initialDocType={docGenModal.docType}
      />

      <CitizenCalculatorsModal
        isOpen={calcModal.isOpen}
        onClose={() => setCalcModal((p) => ({ ...p, isOpen: false }))}
        initialTab={calcModal.tab}
      />

      <WhereToGoModal
        isOpen={whereToGoOpen}
        onClose={() => setWhereToGoOpen(false)}
      />

      <Suspense fallback={null}>
        {spijModalOpen && (
          <SpijModal
            isOpen={spijModalOpen}
            onClose={() => setSpijModalOpen(false)}
            currentAgentId={agent.id}
            lockSpecialist={true}
            onInsertPrompt={(promptText) => {
              setInput((prev) => {
                const space = prev && !prev.endsWith('\n') ? '\n\n' : ''
                return prev + space + promptText
              })
              if (textareaRef.current) {
                textareaRef.current.focus()
              }
            }}
          />
        )}
      </Suspense>
    </div>
  )
}

function WelcomeScreen({
  agent,
  onSuggestion,
}: {
  agent: NonNullable<ReturnType<typeof getAgent>>
  onSuggestion: (text: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-full py-12 text-center px-4 max-w-2xl mx-auto"
    >
      <div className="relative mb-5">
        <div
          className="w-20 h-20 rounded-full overflow-hidden"
          style={{
            border: '1.5px solid rgba(201,168,76,0.25)',
            boxShadow: '0 0 25px rgba(201,168,76,0.10)',
          }}
        >
          <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
        </div>
        <span
          className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full dot-online"
          style={{ background: '#34d17a', border: '2px solid #111111' }}
        />
      </div>

      <h2 className="text-[22px] font-extralight text-white mb-1 tracking-wide">
        {agent.name}
      </h2>
      <p
        className="text-[9px] font-semibold uppercase mb-4"
        style={{ letterSpacing: '3px', color: '#c9a84c' }}
      >
        {agent.role}
      </p>

      <div
        className="p-5 rounded-xl max-w-lg mb-8 text-left"
        style={{
          background: '#1a1a1a',
          border: '1px solid #2a2a2a',
        }}
      >
        <p className="text-[13px] font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.60)' }}>
          {agent.welcomeMessage}
        </p>
      </div>

      <p
        className="text-[8px] font-bold uppercase mb-3"
        style={{ letterSpacing: '3px', color: 'rgba(255,255,255,0.25)' }}
      >
        CONSULTAS FRECUENTES
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
        {agent.suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s)}
            className="p-3 rounded-[10px] text-[11px] font-light text-left transition-all duration-200 flex items-center justify-between group"
            style={{
              background: '#1a1a1a',
              border: '1px solid #333333',
              color: 'rgba(255,255,255,0.60)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)'
              e.currentTarget.style.borderColor = 'rgba(201,168,76,0.20)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.borderColor = '#333333'
            }}
          >
            <span>{s}</span>
            <CornerDownLeft size={12} className="text-[rgba(255,255,255,0.20)] group-hover:text-[#c9a84c] transition-colors flex-shrink-0 ml-2" />
          </button>
        ))}
      </div>
    </motion.div>
  )
}

function AudioWave() {
  return (
    <div className="audio-wave">
      <span /><span /><span /><span /><span />
    </div>
  )
}

function TransferCard({
  agentId,
  userContext,
  fromAgentName,
}: {
  agentId: string
  userContext?: string
  fromAgentName: string
}) {
  const navigate = useNavigate()
  const destAgent = AGENTS.find((a) => a.id === agentId)
  if (!destAgent) return null

  const handleTransfer = () => {
    // Strip document attachment markers if any, but preserve the full legal consultation text
    const clean = (userContext || '')
      .replace(/--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---[\s\S]*?--- FIN DEL DOCUMENTO ---\n\n/, '')
      .trim()

    navigate(`/chat/${destAgent.id}`, {
      state: clean ? { transferMessage: clean } : undefined,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl overflow-hidden"
      style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.20)' }}
    >
      <div className="flex items-center gap-3 p-3 sm:p-4">
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: '1.5px solid rgba(201,168,76,0.30)' }}
        >
          <img src={destAgent.image} alt={destAgent.name} className="w-full h-full object-cover object-top" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] sm:text-[13px] font-semibold text-white">{destAgent.name}</p>
          <p className="text-[10px] sm:text-[11px] font-light" style={{ color: 'rgba(201,168,76,0.80)' }}>{destAgent.role}</p>
          <p className="text-[9px] font-light mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Tu consulta se transferirá automáticamente
          </p>
        </div>
        <motion.button
          onClick={handleTransfer}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-[12px] font-semibold transition-all flex-shrink-0"
          style={{ background: '#c9a84c', color: '#111111' }}
        >
          <span className="hidden sm:inline">Ir con {destAgent.name}</span>
          <span className="sm:hidden">Ir</span>
          <ArrowRight size={13} />
        </motion.button>
      </div>
    </motion.div>
  )
}

function MessageBubble({
  message,
  agent,
  userInitials,
  speakingMessageId,
  audioLoadingId,
  onSpeak,
  onStopSpeak,
  onOpenDeadline,
  lastUserMessage,
  onRetry,
  onContinue,
}: {
  message: Message
  agent: NonNullable<ReturnType<typeof getAgent>>
  userInitials: string
  speakingMessageId: string | null
  audioLoadingId: string | null
  onSpeak: (text: string, id: string) => void
  onStopSpeak: () => void
  onOpenDeadline: (text: string) => void
  lastUserMessage?: string
  onRetry?: (prompt: string) => void
  onContinue?: () => void
}) {
  const navigate = useNavigate()
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [saved, setSaved] = useState(false)
  const [savingMsg, setSavingMsg] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const isSpeaking = speakingMessageId === message.timestamp
  const isLoadingAudio = audioLoadingId === message.timestamp
  const deadlines = !isUser ? detectDeadlines(message.content) : []

  const { conversationalText, document: extractedDoc } = !isUser
    ? extractDocumentFromMessage(message.content)
    : { conversationalText: message.content, document: null }

  const cleanTextForSpeech = (text: string) =>
    text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/[>#*_~|]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (saved || savingMsg) return
    setSavingMsg(true)
    try {
      await api.saved.save({ agentId: agent.id, agentName: agent.name, content: message.content })
      setSaved(true)
    } catch { /* ignore */ } finally {
      setSavingMsg(false)
    }
  }



  const displayContent = isUser
    ? message.content.replace(/--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---[\s\S]*?--- FIN DEL DOCUMENTO ---\n\n/, '')
    : message.content

  const hasAttachment = isUser && message.content.includes('[Archivo adjunto:')
  const attachmentName = hasAttachment
    ? message.content.match(/\[Archivo adjunto: (.+?)\]/)?.[1]
    : null
  const isVoice = (message as any).isVoice === true

  return (
    <motion.div
      initial={{ opacity: 0, y: isUser ? 8 : -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 sm:gap-3 w-full max-w-4xl mx-auto`}
    >
      {!isUser && (
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 mt-1"
          style={{ border: '1px solid rgba(201,168,76,0.20)' }}
        >
          <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[88%] sm:max-w-[85%]`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[11px] sm:text-[12px] font-normal text-white">{agent.name}</span>
            {isSpeaking && <AudioWave />}
            {!isSpeaking && (
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                • {formatTime(message.timestamp)}
              </span>
            )}
          </div>
        )}

        {/* Badges for user messages */}
        <div className="flex items-center gap-1.5 mb-0">
          {attachmentName && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-t-lg text-[9px] font-medium"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
            >
              <FileText size={10} />
              {attachmentName}
            </div>
          )}
          {isVoice && !attachmentName && (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-t-lg text-[9px] font-medium"
              style={{ background: 'rgba(201,168,76,0.10)', color: 'rgba(201,168,76,0.80)' }}
            >
              <Mic size={9} />
              Audio
            </div>
          )}
        </div>

        <div
          className="px-5 py-4 text-[13px] font-light leading-relaxed"
          style={
            isUser
              ? {
                  background: 'rgba(201,168,76,0.10)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: attachmentName ? '0 14px 14px 14px' : '14px 4px 14px 14px',
                  color: '#ffffff',
                }
              : {
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: '4px 14px 14px 14px',
                  color: 'rgba(255,255,255,0.60)',
                }
          }
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          ) : (
            <div className="space-y-3">
              {conversationalText && (
                <div className="prose-chat">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ href, children }) => {
                        if (href?.startsWith('/chat/')) {
                          return (
                            <button
                              onClick={() => navigate(href)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium mt-1"
                              style={{
                                background: 'rgba(201,168,76,0.12)',
                                color: '#c9a84c',
                                border: '1px solid rgba(201,168,76,0.30)',
                              }}
                            >
                              {children} <ArrowRight size={13} />
                            </button>
                          )
                        }
                        return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                      },
                    }}
                  >
                    {conversationalText}
                  </ReactMarkdown>
                </div>
              )}

              {/* 🗎 ADJUNTO DE DOCUMENTO LEGAL OFICIAL GENERADO POR LA IA */}
              {extractedDoc && (
                <div
                  className="rounded-xl overflow-hidden border transition-all mt-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(26,32,44,0.98) 0%, rgba(17,24,39,0.98) 100%)',
                    borderColor: 'rgba(96,165,250,0.35)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* File Header */}
                  <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                          border: '1px solid rgba(147,197,253,0.3)',
                          boxShadow: '0 4px 12px rgba(30,58,138,0.4)',
                        }}
                      >
                        <FileText size={20} className="text-blue-200" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="text-[9px] uppercase font-bold px-2 py-0.5 rounded tracking-wider"
                            style={{ background: 'rgba(96,165,250,0.15)', color: '#93c5fd', border: '1px solid rgba(96,165,250,0.3)' }}
                          >
                            {extractedDoc.type || 'DOCUMENTO OFICIAL'}
                          </span>
                          <span className="text-[10px] text-white/40 hidden sm:inline">Formato Oficial A4</span>
                        </div>
                        <h4 className="text-[13px] font-semibold text-white truncate max-w-xs sm:max-w-md" title={extractedDoc.title}>
                          {extractedDoc.title}.docx
                        </h4>
                      </div>
                    </div>

                    {/* Action Buttons in Header */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={async () => {
                          await downloadWordDoc(extractedDoc.title, extractedDoc.content, extractedDoc.title)
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                        style={{
                          background: '#2563eb',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(37,99,235,0.35)',
                        }}
                        title="Descargar archivo editable Microsoft Word (.docx)"
                      >
                        <FileDown size={13} />
                        <span className="hidden sm:inline">Descargar Word (.docx)</span>
                        <span className="sm:hidden">Word</span>
                      </button>

                      <button
                        onClick={async () => {
                          await downloadPdfDoc(extractedDoc.title, extractedDoc.content, extractedDoc.title)
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                        style={{
                          background: '#dc2626',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(220,38,38,0.35)',
                        }}
                        title="Descargar directamente como documento PDF oficial A4 listo para Mesa de Partes Virtual"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Descargar PDF (.pdf)</span>
                        <span className="sm:hidden">PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          printDocument(extractedDoc.title, extractedDoc.content)
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                        style={{
                          background: 'rgba(201,168,76,0.15)',
                          border: '1px solid rgba(201,168,76,0.35)',
                          color: '#c9a84c',
                        }}
                        title="Abrir vista de impresión y guardado A4 con alta fidelidad"
                      >
                        <Printer size={13} />
                        <span className="hidden sm:inline">Imprimir</span>
                      </button>

                      <button
                        onClick={() => setPreviewOpen(!previewOpen)}
                        className="p-1.5 rounded-lg text-[11px] transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
                        title={previewOpen ? 'Ocultar vista previa' : 'Ver documento completo'}
                      >
                        {previewOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Document Preview with Legal Sheet Styling */}
                  <AnimatePresence>
                    {previewOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-4 sm:p-6 overflow-hidden"
                        style={{ background: '#0a0d14' }}
                      >
                        <div
                          className="p-6 sm:p-10 rounded-lg shadow-2xl border text-black font-serif text-[12px] sm:text-[13px] leading-[1.6] max-w-2xl mx-auto select-text doc-preview-sheet"
                          style={{
                            background: '#ffffff',
                            borderColor: '#d1d5db',
                            fontFamily: '"Times New Roman", Times, "Liberation Serif", serif',
                            color: '#111111',
                          }}
                          dangerouslySetInnerHTML={{ __html: renderDocHtmlBody(extractedDoc.content) }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {/* Resiliencia ante error / streaming interrumpido */}
              {!isUser && message.isError && (
                <div
                  className="mt-3 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2.5 border select-none"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    borderColor: 'rgba(239, 68, 68, 0.25)',
                  }}
                >
                  <div className="flex items-center gap-2 text-[11px] text-red-300">
                    <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                    <span>La respuesta se interrumpió o experimentó un problema de conexión.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onRetry && (message.lastUserPrompt || lastUserMessage) && (
                      <button
                        onClick={() => onRetry(message.lastUserPrompt || lastUserMessage || '')}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition hover:opacity-90"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                      >
                        <RefreshCw size={11} /> Reintentar consulta
                      </button>
                    )}
                    {onContinue && (
                      <button
                        onClick={onContinue}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition hover:opacity-90"
                        style={{ background: 'rgba(201, 168, 76, 0.2)', color: '#e5c96a', border: '1px solid rgba(201, 168, 76, 0.4)' }}
                      >
                        <ArrowRight size={11} /> Continuar redacción
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-1.5 mt-2 px-1 flex-wrap">
            {/* TTS play/pause button on demand */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  onStopSpeak()
                } else {
                  onSpeak(cleanTextForSpeech(message.content), message.timestamp)
                }
              }}
              disabled={isLoadingAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: isSpeaking ? 'rgba(201,168,76,0.18)' : '#191919',
                border: `1px solid ${isSpeaking ? 'rgba(201,168,76,0.40)' : 'rgba(255,255,255,0.10)'}`,
                color: isSpeaking ? '#c9a84c' : 'rgba(255,255,255,0.70)',
              }}
              title={isSpeaking ? 'Pausar audio de la respuesta' : 'Escuchar esta respuesta con la voz de tu asesor legal'}
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 size={12} className="animate-spin text-[#c9a84c]" />
                  <span>Sintetizando voz...</span>
                </>
              ) : isSpeaking ? (
                <>
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-[#c9a84c] rounded-full wave-bar" style={{ animationDelay: '0s' }} />
                    <span className="w-0.5 bg-[#c9a84c] rounded-full wave-bar" style={{ animationDelay: '0.2s' }} />
                    <span className="w-0.5 bg-[#c9a84c] rounded-full wave-bar" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <Pause size={12} fill="currentColor" />
                  <span className="font-semibold">Detener</span>
                </>
              ) : (
                <>
                  <Play size={12} fill="currentColor" />
                  <span>Escuchar</span>
                </>
              )}
            </button>

            {/* Direct Word (.docx) download */}
            <button
              onClick={async () => {
                const docToDownload = extractedDoc ? extractedDoc.content : message.content
                const docTitle = extractedDoc ? extractedDoc.title : `Escrito_${agent.name}_${new Date().toISOString().slice(0, 10)}`
                await downloadWordDoc(docTitle, docToDownload, docTitle)
                setDownloaded(true)
                setTimeout(() => setDownloaded(false), 2500)
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: 'rgba(96,165,250,0.08)',
                border: '1px solid rgba(96,165,250,0.25)',
                color: '#60a5fa',
              }}
              title="Descargar documento editable oficial para Microsoft Word (.docx)"
            >
              <FileDown size={12} />
              <span>Word (.docx)</span>
            </button>

            {/* Direct Print / PDF */}
            <button
              onClick={() => {
                const docToPrint = extractedDoc ? extractedDoc.content : message.content
                const docTitle = extractedDoc ? extractedDoc.title : `Respuesta Legal — ${agent.name} (${agent.role})`
                printDocument(docTitle, docToPrint)
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: 'rgba(201,168,76,0.08)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: '#c9a84c',
              }}
              title="Imprimir o guardar como PDF oficial"
            >
              <Printer size={12} />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-light transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.50)' }}
            >
              {copied ? <><Check size={11} style={{ color: '#34d17a' }} /> Copiado</> : <><Copy size={11} /> Copiar</>}
            </button>

            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className="p-1.5 rounded-lg transition-all"
              style={{
                background: feedback === 'up' ? 'rgba(201,168,76,0.10)' : '#1a1a1a',
                border: `1px solid ${feedback === 'up' ? 'rgba(201,168,76,0.25)' : '#2a2a2a'}`,
                color: feedback === 'up' ? '#c9a84c' : 'rgba(255,255,255,0.30)',
              }}
            >
              <ThumbsUp size={11} />
            </button>

            <button
              onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
              className="p-1.5 rounded-lg transition-all"
              style={{
                background: feedback === 'down' ? 'rgba(255,100,100,0.08)' : '#1a1a1a',
                border: `1px solid ${feedback === 'down' ? 'rgba(255,100,100,0.20)' : '#2a2a2a'}`,
                color: feedback === 'down' ? '#ff6464' : 'rgba(255,255,255,0.30)',
              }}
            >
              <ThumbsDown size={11} />
            </button>

            {/* Save / Guardados */}
            <button
              onClick={handleSave}
              disabled={savingMsg}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-light transition-all"
              style={{
                background: saved ? 'rgba(201,168,76,0.10)' : '#1a1a1a',
                border: `1px solid ${saved ? 'rgba(201,168,76,0.30)' : '#2a2a2a'}`,
                color: saved ? '#c9a84c' : 'rgba(255,255,255,0.30)',
              }}
              title={saved ? 'Guardado en Habilidades' : 'Guardar en Habilidades'}
            >
              <Star size={11} fill={saved ? 'currentColor' : 'none'} />
              <span>{saved ? 'Guardado' : 'Guardar'}</span>
            </button>
          </div>
        )}

        {/* Transfer card */}
        {!isUser && message.transferTo && (
          <TransferCard
            agentId={message.transferTo}
            userContext={lastUserMessage}
            fromAgentName={agent.name}
          />
        )}

        {isUser && (
          <p className="text-[9px] mt-1 px-1" style={{ color: 'rgba(255,255,255,0.20)' }}>
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>

      {isUser && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1"
          style={{
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.30)',
            color: '#c9a84c',
          }}
        >
          {userInitials}
        </div>
      )}
    </motion.div>
  )
}

function ThinkingIndicator({
  agent,
  onCancel,
}: {
  agent: NonNullable<ReturnType<typeof getAgent>>
  lastUserMessage?: string
  onCancel?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-wrap items-center justify-between gap-2 w-full max-w-4xl mx-auto py-1"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: '1px solid rgba(201,168,76,0.30)', boxShadow: '0 0 10px rgba(201,168,76,0.15)' }}
        >
          <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
        </div>

        <div
          className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
          style={{
            background: 'rgba(26,26,26,0.95)',
            border: '1px solid rgba(201,168,76,0.25)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          }}
        >
          <RefreshCw size={13} className="animate-spin text-[#c9a84c]" />
          <span className="text-[12px] font-light text-white/95 tracking-wide">
            Analizando caso con {agent.name}...
          </span>
        </div>
      </div>

      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm"
          style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.35)',
            color: '#f87171',
          }}
          title="Cancelar consulta en curso"
        >
          <Square size={10} fill="currentColor" />
          <span>Cancelar consulta</span>
        </button>
      )}
    </motion.div>
  )
}
