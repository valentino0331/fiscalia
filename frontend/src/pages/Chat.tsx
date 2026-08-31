import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ArrowUp, Trash2, MessageSquare,
  Copy, Check, ChevronDown, ChevronUp,
  ThumbsUp, ThumbsDown, CornerDownLeft, RefreshCw,
  Download, Paperclip, Image as ImageIcon,
  X, AlertTriangle, FileText, Loader2,
  Menu, Mic, Square, Volume2, VolumeX, Play, Pause, ArrowRight, Share2,
  Star, Calendar, BookOpen, Sparkles, Calculator, MapPin, Baby, Briefcase
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '@/context/AuthContext'
import { getAgent, AGENTS } from '@/lib/agents'
import { api } from '@/lib/api'
import { formatDate, formatTime } from '@/lib/utils'
import type { Message, Conversation } from '@/types'
import JurisClaudeLogo from '@/components/brand/JurisClaudeLogo'
import DocumentScannerModal from '@/components/citizen/DocumentScannerModal'
import CitizenCalculatorsModal from '@/components/citizen/CitizenCalculatorsModal'
import CitizenDocumentGeneratorModal, { type DocType } from '@/components/citizen/CitizenDocumentGeneratorModal'
import WhereToGoModal from '@/components/citizen/WhereToGoModal'
import { Home, MailCheck, ShieldAlert, FileSignature, ShoppingBag, type LucideIcon } from 'lucide-react'

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

const DOCUMENT_TEMPLATES: DocumentTemplateItem[] = [
  {
    label: 'Demanda de Alimentos (Formato PJ)',
    icon: Baby,
    badgeColor: '#34d17a',
    prompt: 'Ayúdame a redactar el Formato Único de Demanda de Alimentos para presentar ante el Juzgado de Paz Letrado sin abogado: [indica nombres, edades de los hijos, gastos aproximados e ingresos del obligado]',
  },
  {
    label: 'Carta Notarial de Requerimiento / Cobro',
    icon: MailCheck,
    badgeColor: '#c9a84c',
    prompt: 'Redacta una carta notarial con estructura oficial conforme a la Ley del Notariado (D. Leg. 1049) exigiendo el pago de mi liquidación de beneficios sociales dentro del plazo de 48 horas bajo apercibimiento de denuncia ante SUNAFIL: [empresa, sueldo, fechas de trabajo]',
  },
  {
    label: 'Contrato de Alquiler con Desalojo Rápido',
    icon: Home,
    badgeColor: '#c9a84c',
    prompt: 'Redacta un contrato de arrendamiento de vivienda con Cláusula de Allanamiento Futuro (Ley 30201 y Ley 30933) para desalojo express con intervención notarial: [arrendador, arrendatario, dirección del inmueble, monto de renta mensual]',
  },
  {
    label: 'Reclamo Formal en INDECOPI',
    icon: ShoppingBag,
    badgeColor: '#60a5fa',
    prompt: 'Redacta un reclamo formal para el Libro de Reclamaciones e INDECOPI por cobro indebido / estafa / producto defectuoso: [empresa, producto comprado, monto pagado, solución exigida]',
  },
  {
    label: 'Descargo ante Citación Policial / Fiscal',
    icon: ShieldAlert,
    badgeColor: '#f59e0b',
    prompt: 'Oriéntame cómo preparar mi manifestación y qué pruebas presentar ante esta citación policial / fiscal: [motivo de la citación, hechos]',
  },
]

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

  const [speechSupported, setSpeechSupported] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
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
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const [usage, setUsage] = useState<{ plan: string; questionsUsed: number; limit: number | null; isAdmin: boolean } | null>(null)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [searchParams] = useSearchParams()
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const templatesRef = useRef<HTMLDivElement>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!agent) navigate('/dashboard')
  }, [agent, navigate])

  useEffect(() => {
    // Reset all conversation state when the agent changes
    setMessages([])
    setConversationId(undefined)
    setInput('')
    setActiveMode(null)
    setIsVoiceMessage(false)
    stopSpeaking()
    loadConversations()
    setSidebarOpen(false)
  }, [agentId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  useEffect(() => {
    api.account.usage().then(setUsage).catch(() => {})
  }, [])

  // Load specific conversation if URL has ?conv=<id>
  useEffect(() => {
    const convId = searchParams.get('conv')
    if (convId) loadConversation(convId)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill input when arriving via agent transfer
  const location = useLocation()
  useEffect(() => {
    const state = location.state as { transferMessage?: string } | null
    if (state?.transferMessage) {
      setInput(state.transferMessage)
      setTimeout(autoResize, 80)
      // Clear route state so refresh doesn't re-fill
      window.history.replaceState({}, document.title)
    }
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
    setSpeechSupported(Boolean(speechApi))

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop()
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      stopSpeaking()
    }
  }, [])

  const cleanTextForSpeech = (text: string) =>
    text
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/[>#*_~|═━─•]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

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

  const fallbackBrowserSpeech = (clean: string, messageId: string) => {
    if (!('speechSynthesis' in window)) {
      setSpeakingMessageId(null)
      return
    }
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'es-PE'
    const femaleAgents = ['valentina', 'camila', 'fernanda', 'adriana']
    const wantFemale = femaleAgents.includes(agent?.id || '')
    utterance.pitch = wantFemale ? 1.05 : 0.90
    utterance.rate = 0.96

    const allVoices = window.speechSynthesis.getVoices()
    const esVoices = allVoices.filter((v) => v.lang.toLowerCase().startsWith('es'))
    if (esVoices.length > 0) {
      utterance.voice = esVoices[0]
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

    try {
      // 1. Try realistic ElevenLabs audio from backend
      const blob = await api.chat.tts({ text: clean, agentId: agent?.id || 'sebastian' })
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
        fallbackBrowserSpeech(clean, messageId)
      }
      await audio.play()
    } catch {
      // 2. Fallback smoothly to browser SpeechSynthesis
      setAudioLoadingId(null)
      fallbackBrowserSpeech(clean, messageId)
    }
  }

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'es-PE'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsRecording(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    }
    recognition.onend = () => {
      setIsRecording(false)
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
    }
    recognition.onerror = () => {
      setIsRecording(false)
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
    }
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim()

      if (!transcript) return
      setIsVoiceMessage(true)
      setInput((prev) => {
        if (!prev.trim()) return transcript
        return `${prev.trim()} ${transcript}`
      })
      setTimeout(autoResize, 30)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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
    } catch {
    }
  }

  const newConversation = () => {
    setMessages([])
    setConversationId(undefined)
    setInput('')
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
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) {
      setAttachedFile(file)
      setExtractError(`El archivo supera ${MAX_MB}MB. Comprime el PDF o divídelo en partes.`)
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
    setIsVoiceMessage(false)
    clearAttachment()
    setLoading(true)
    requestPushPermission()

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const res = await api.chat.send({
        agentId: agent.id,
        messages: newMessages,
        conversationId,
      })

      const assistantMsg: Message = {
        role: 'assistant',
        content: res.message,
        timestamp: new Date().toISOString(),
        transferTo: res.transferTo,
      }
      setMessages([...newMessages, assistantMsg])

      // Save the conversationId returned by backend (on first message)
      if (res.conversationId && !conversationId) {
        setConversationId(res.conversationId)
      }

      loadConversations()

      if (audioRepliesEnabled) {
        speakAssistantMessage(assistantMsg.content, assistantMsg.timestamp)
      }
      sendPushNotification(agent.name)

      if (usage && usage.limit !== null) {
        setUsage({ ...usage, questionsUsed: usage.questionsUsed + 1 })
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Hubo un error al procesar tu consulta. Por favor intenta de nuevo.'
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, agent, messages, conversationId, agentId, extractedText, attachedFile, usage, audioRepliesEnabled, isVoiceMessage])

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
          {isLimited && (
            <div
              className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg"
              style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}
            >
              {/* Bars — desktop only */}
              <div className="hidden sm:flex gap-0.5">
                {Array.from({ length: usage!.limit! }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-4 rounded-sm"
                    style={{
                      background: i < usage!.questionsUsed
                        ? (usage!.questionsUsed >= usage!.limit! ? '#ff6464' : '#c9a84c')
                        : 'rgba(255,255,255,0.10)',
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-semibold" style={{ color: usage!.questionsUsed >= usage!.limit! ? '#ff6464' : '#c9a84c' }}>
                {usage!.questionsUsed}/{usage!.limit!}
              </span>
            </div>
          )}

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
          <div className="flex items-center justify-between px-4 py-3.5 border-b" style={{ borderColor: '#2a2a2a' }}>
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
              conversations.map((conv) => {
                const isCurrent = conversationId === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className="group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: isCurrent ? 'rgba(201,168,76,0.10)' : 'transparent',
                      border: isCurrent ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p
                        className="text-[11px] truncate"
                        style={{
                          fontWeight: isCurrent ? 500 : 300,
                          color: isCurrent ? '#ffffff' : 'rgba(255,255,255,0.60)',
                        }}
                      >
                        {conv.title}
                      </p>
                      <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        {formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                      style={{ color: 'rgba(255,255,255,0.30)' }}
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
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 md:py-6 space-y-5 md:space-y-6">
            {messages.length === 0 ? (
              <WelcomeScreen agent={agent} onSuggestion={insertSuggestion} />
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
                    lastUserMessage={
                      messages
                        .slice(0, i)
                        .reverse()
                        .find((m) => m.role === 'user')?.content
                    }
                  />
                ))}
                {loading && <ThinkingIndicator agent={agent} />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 p-3 sm:p-4 md:px-8 md:pb-6 relative z-20">
            <div className="max-w-4xl mx-auto space-y-2">
              {/* Mode tags */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-[8px] uppercase font-bold mr-1 hidden sm:inline flex-shrink-0" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.25)' }}>
                  MODO
                </span>
                {PROMPT_MODES.map((mode) => {
                  const isSelected = activeMode === mode.id
                  const ModeIcon = mode.icon
                  return (
                    <button
                      key={mode.id}
                      onClick={() => applyMode(mode)}
                      className="whitespace-nowrap px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1.5 flex-shrink-0"
                      style={{
                        border: `1px solid ${isSelected ? 'rgba(201,168,76,0.40)' : '#2a2a2a'}`,
                        background: isSelected ? 'rgba(201,168,76,0.12)' : '#171717',
                        color: isSelected ? '#c9a84c' : 'rgba(255,255,255,0.60)',
                      }}
                    >
                      <ModeIcon size={12} style={{ color: isSelected ? '#c9a84c' : 'rgba(255,255,255,0.45)' }} />
                      <span>{mode.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Recording indicator — calm, no frantic animation */}
              {isRecording && (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,50,50,0.06)', border: '1px solid rgba(255,60,60,0.22)' }}
                >
                  {/* Slow pulsing dot */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: '#ff4444', animation: 'recording-dot-glow 2s ease-out infinite' }}
                  />
                  {/* Waveform bars */}
                  <div className="flex items-end gap-0.5 flex-shrink-0" style={{ height: '14px' }}>
                    {[4, 9, 6, 10, 5, 9, 4].map((h, i) => (
                      <span
                        key={i}
                        className="w-0.5 rounded-full"
                        style={{
                          background: 'rgba(255,100,100,0.55)',
                          height: `${h}px`,
                          transformOrigin: 'bottom',
                          animation: `rec-wave ${0.55 + i * 0.08}s ease-in-out infinite`,
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-light flex-1" style={{ color: '#ff9999' }}>
                    Grabando — habla con claridad
                  </span>
                  <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'rgba(255,150,150,0.65)' }}>
                    {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                  </span>
                  <button
                    onClick={toggleVoiceInput}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: '#ff4444', color: '#fff' }}
                    title="Detener grabación"
                  >
                    <Square size={10} fill="#fff" />
                  </button>
                </div>
              )}

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
                            return `${sizeStr}${pageStr} · Listo`
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
                  placeholder={isRecording ? 'Escuchando...' : `Escribe o usa el micrófono para ${agent.name}...`}
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
                      title="Adjuntar PDF o Word"
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

                    {/* Document templates — Desktop */}
                    <div ref={templatesRef} className="hidden sm:block relative">
                      <button
                        onClick={() => setTemplatesOpen((o) => !o)}
                        className="flex items-center gap-1.5 text-[10px] font-light transition-colors"
                        style={{ color: templatesOpen ? '#c9a84c' : 'rgba(255,255,255,0.25)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#c9a84c' }}
                        onMouseLeave={(e) => { if (!templatesOpen) e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                        title="Plantillas de documentos"
                      >
                        <BookOpen size={12} />
                        <span>PLANTILLAS</span>
                      </button>
                      {templatesOpen && (
                        <div
                          className="absolute bottom-full left-0 mb-2 rounded-xl overflow-hidden z-50"
                          style={{ background: '#1a1a1a', border: '1px solid #333333', minWidth: '220px', boxShadow: '0 8px 30px rgba(0,0,0,0.60)' }}
                        >
                          <div className="px-3 py-2" style={{ borderBottom: '1px solid #2a2a2a' }}>
                            <p className="text-[8px] font-bold uppercase" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.30)' }}>
                              PLANTILLAS LEGALES
                            </p>
                          </div>
                          {DOCUMENT_TEMPLATES.map((tpl) => {
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
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-light text-left transition-colors"
                                style={{ color: 'rgba(255,255,255,0.65)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.10)'; e.currentTarget.style.color = '#c9a84c' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                              >
                                <TplIcon size={13} style={{ color: tpl.badgeColor }} />
                                <span>{tpl.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* ── Desktop-only tools ──────────────────────────────── */}
                    {/* Escanear / Traducir Carta */}
                    <button
                      onClick={() => setScannerOpen(true)}
                      className="hidden sm:flex items-center gap-1.5 text-[10px] font-light transition-colors"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#c9a84c' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      title="Traducir documento legal a lenguaje sencillo"
                    >
                      <Sparkles size={12} />
                      <span>TRADUCIR</span>
                    </button>

                    {/* Calculadoras */}
                    <button
                      onClick={() => setCalcModal({ isOpen: true, tab: 'liquidacion' })}
                      className="hidden sm:flex items-center gap-1.5 text-[10px] font-light transition-colors"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#34d17a' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      title="Calculadoras en Soles (Liquidación, Alimentos, Prescripción)"
                    >
                      <Calculator size={12} />
                      <span>CALCULADORA</span>
                    </button>

                    {/* Dónde Ir */}
                    <button
                      onClick={() => setWhereToGoOpen(true)}
                      className="hidden sm:flex items-center gap-1.5 text-[10px] font-light transition-colors"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#f59e0b' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      title="Guía de trámites: A dónde ir y qué llevar"
                    >
                      <MapPin size={12} />
                      <span>DÓNDE IR</span>
                    </button>

                    {/* Calcular Plazo */}
                    <button
                      onClick={() => setDeadlineModal({ isOpen: true })}
                      className="hidden sm:flex items-center gap-1.5 text-[10px] font-light transition-colors"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#c9a84c' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      title="Calcular días hábiles y plazos judiciales peruanos"
                    >
                      <Calendar size={12} />
                      <span>PLAZOS</span>
                    </button>

                    {/* ── Mobile: unified "Más" menu ────────────────────── */}
                    <div className="sm:hidden relative">
                      <button
                        onClick={() => setTemplatesOpen((o) => !o)}
                        className="flex items-center gap-1 text-[9px] font-medium transition-all px-2 py-1 rounded-md"
                        style={{
                          color: templatesOpen ? '#c9a84c' : 'rgba(255,255,255,0.40)',
                          background: templatesOpen ? 'rgba(201,168,76,0.10)' : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${templatesOpen ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}`,
                        }}
                      >
                        <Sparkles size={11} />
                        Más
                      </button>
                      {templatesOpen && (
                        <div
                          className="absolute bottom-full left-0 mb-2 rounded-2xl overflow-hidden z-50 w-56"
                          style={{ background: '#1c1c1c', border: '1px solid #333333', boxShadow: '0 16px 50px rgba(0,0,0,0.75)' }}
                        >
                          <div className="px-3 py-2.5 border-b" style={{ borderColor: '#2a2a2a' }}>
                            <p className="text-[8px] font-bold uppercase" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.25)' }}>HERRAMIENTAS JURÍDICAS</p>
                          </div>
                          {[
                            { label: 'Traducir Notificación', icon: <Sparkles size={14} style={{ color: '#c9a84c' }} />, action: () => { setScannerOpen(true); setTemplatesOpen(false) } },
                            { label: 'Calculadoras en S/', icon: <Calculator size={14} style={{ color: '#34d17a' }} />, action: () => { setCalcModal({ isOpen: true, tab: 'liquidacion' }); setTemplatesOpen(false) } },
                            { label: 'A Dónde Ir y Qué Llevar', icon: <MapPin size={14} style={{ color: '#f59e0b' }} />, action: () => { setWhereToGoOpen(true); setTemplatesOpen(false) } },
                            { label: 'Calcular Plazos', icon: <Calendar size={14} style={{ color: '#c9a84c' }} />, action: () => { setDeadlineModal({ isOpen: true }); setTemplatesOpen(false) } },
                          ].map((item) => (
                            <button key={item.label} onClick={item.action}
                              className="w-full flex items-center gap-3 px-3 py-3 text-[12px] font-light text-left transition-colors"
                              style={{ color: 'rgba(255,255,255,0.75)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                            >
                              {item.icon} {item.label}
                            </button>
                          ))}
                          <div style={{ height: '1px', background: '#2a2a2a', margin: '2px 12px' }} />
                          <div className="px-3 py-1.5">
                            <p className="text-[8px] font-bold uppercase" style={{ letterSpacing: '1.5px', color: 'rgba(255,255,255,0.20)' }}>PLANTILLAS</p>
                          </div>
                          {DOCUMENT_TEMPLATES.slice(0, 4).map((tpl) => {
                            const TplIcon = tpl.icon
                            return (
                              <button
                                key={tpl.label}
                                onClick={() => { setInput(tpl.prompt); setTemplatesOpen(false); textareaRef.current?.focus(); setTimeout(autoResize, 50) }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[11px] font-light text-left transition-colors"
                                style={{ color: 'rgba(255,255,255,0.65)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.07)'; e.currentTarget.style.color = '#c9a84c' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                              >
                                <TplIcon size={14} style={{ color: tpl.badgeColor }} />
                                <span>{tpl.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] hidden lg:inline" style={{ color: 'rgba(255,255,255,0.20)' }}>
                      Enter · Shift+Enter
                    </span>

                    {/* Mic button — solid red when recording, no frantic animation */}
                    {speechSupported && (
                      <button
                        onClick={toggleVoiceInput}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                        style={isRecording
                          ? { background: 'rgba(255,50,50,0.15)', border: '1.5px solid rgba(255,70,70,0.50)', color: '#ff5555' }
                          : { background: 'rgba(255,255,255,0.07)', border: '1px solid #333333', color: 'rgba(255,255,255,0.45)' }}
                        title={isRecording ? 'Detener grabación' : 'Grabar mensaje de voz'}
                      >
                        {isRecording ? <Square size={11} fill="#ff5555" /> : <Mic size={14} />}
                      </button>
                    )}

                    {/* Send button */}
                    <motion.button
                      onClick={sendMessage}
                      disabled={(!input.trim() && !extractedText) || loading || extracting}
                      whileHover={{ scale: (input.trim() || extractedText) && !loading ? 1.05 : 1 }}
                      whileTap={{ scale: (input.trim() || extractedText) && !loading ? 0.95 : 1 }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{
                        background: (input.trim() || extractedText) && !loading && !extracting ? '#c9a84c' : 'rgba(255,255,255,0.07)',
                        color: (input.trim() || extractedText) && !loading && !extracting ? '#111111' : 'rgba(255,255,255,0.25)',
                        cursor: (!input.trim() && !extractedText) || loading || extracting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <ArrowUp size={15} />
                    </motion.button>
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
        className="text-[9px] font-semibold uppercase mb-5"
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
    // Strip document content from context to keep it concise
    const clean = (userContext || '')
      .replace(/--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---[\s\S]*?--- FIN DEL DOCUMENTO ---\n\n/, '')
      .trim()
    // Truncate if very long
    const transferMessage = clean.length > 400 ? clean.slice(0, 397) + '...' : clean

    navigate(`/chat/${destAgent.id}`, {
      state: transferMessage ? { transferMessage } : undefined,
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
}) {
  const navigate = useNavigate()
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [saved, setSaved] = useState(false)
  const [savingMsg, setSavingMsg] = useState(false)
  const isSpeaking = speakingMessageId === message.timestamp
  const isLoadingAudio = audioLoadingId === message.timestamp
  const exportRef = useRef<HTMLDivElement>(null)
  const deadlines = !isUser ? detectDeadlines(message.content) : []

  useEffect(() => {
    if (!exportOpen) return
    const handler = (e: MouseEvent) => {
      if (!exportRef.current?.contains(e.target as Node)) setExportOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [exportOpen])

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

  const stripInline = (s: string) =>
    s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
     .replace(/`(.+?)`/g, '$1').replace(/\[(.+?)\]\(.+?\)/g, '$1')

  const handleExportPDF = () => {
    setExportOpen(false)
    setDownloaded(true)
    try {
      const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
      // Convert markdown to HTML for proper UTF-8 rendering
      const toHtmlContent = (md: string) => {
        return md
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code>$1</code>')
          .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
          .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
          .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
          .replace(/\n\n+/g, '</p><p>')
          .replace(/\n/g, '<br>')
      }
      const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>HARDMAN — Respuesta Legal — ${agent.name}</title>
<style>
  @page { size: A4; margin: 2.5cm 3cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11.5pt; line-height: 1.75; color: #1a1a1a; background: #fff; }
  .brand-bar { border-top: 3pt solid #c9a84c; padding-top: 12pt; margin-bottom: 20pt; }
  .brand { font-family: Arial, sans-serif; font-size: 7pt; font-weight: 700; letter-spacing: 4pt; text-transform: uppercase; color: #c9a84c; }
  h1 { font-size: 20pt; font-weight: 300; color: #111; border-bottom: 1.5pt solid #c9a84c; padding-bottom: 6pt; margin: 16pt 0 10pt; }
  h2 { font-size: 13pt; font-weight: 600; color: #111; margin: 14pt 0 6pt; }
  h3 { font-size: 11pt; font-weight: 600; color: #333; margin: 10pt 0 4pt; }
  p { margin-bottom: 8pt; }
  ul { margin: 8pt 0 8pt 20pt; }
  li { margin-bottom: 3pt; }
  blockquote { border-left: 3pt solid #c9a84c; padding: 6pt 10pt; color: #555; font-style: italic; margin: 10pt 0; background: #faf8f4; }
  code { font-family: Consolas, monospace; font-size: 9pt; background: #f5f5f5; padding: 1pt 4pt; border-radius: 2pt; }
  strong { font-weight: 700; color: #111; }
  .meta { font-family: Arial, sans-serif; font-size: 8.5pt; color: #888; margin-bottom: 18pt; }
  .disclaimer { margin-top: 30pt; border-top: 0.5pt solid #ddd; padding-top: 8pt; font-family: Arial, sans-serif; font-size: 7pt; color: #aaa; }
  .btn-print { display: block; margin: 16px auto; padding: 12px 32px; background: #c9a84c; color: #fff; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; font-family: Arial, sans-serif; font-weight: 600; }
  @media print { .btn-print { display: none !important; } }
</style>
</head>
<body>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
<div class="brand-bar">
  <p class="brand">HARDMAN · Inteligencia Jurídica · Perú</p>
</div>
<h1>Respuesta Legal — ${agent.name}</h1>
<p class="meta">${agent.name} &nbsp;·&nbsp; ${agent.role} &nbsp;·&nbsp; ${fecha}</p>
<p>${toHtmlContent(message.content)}</p>
<div class="disclaimer">
  HARDMAN · Inteligencia Jurídica · Perú &nbsp;|&nbsp; ${fecha} &nbsp;|&nbsp; 
  Documento de asesoría informativa. No constituye dictamen legal formal. Se recomienda la revisión de un abogado colegiado para actos con consecuencias jurídicas definitivas.
</div>
<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
</body>
</html>`
      const win = window.open('', '_blank', 'width=900,height=700')
      if (win) {
        win.document.write(htmlContent)
        win.document.close()
      } else {
        alert('Tu navegador bloqueó la ventana emergente. Permítela para poder imprimir/exportar.')
        setDownloaded(false)
        return
      }
    } catch (err) {
      console.error('[HARDMAN] Export error:', err)
      setDownloaded(false)
    }
    setTimeout(() => setDownloaded(false), 2500)
  }

  const handleExportWord = () => {
    setExportOpen(false)
    const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })
    const toHtml = (md: string) => md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>').replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      .replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')
    const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="UTF-8">
<style>
body{font-family:Calibri,sans-serif;font-size:11pt;line-height:1.7;margin:2.5cm;color:#1a1a1a}
h1{font-size:20pt;font-weight:300;color:#111;border-bottom:1.5pt solid #c9a84c;padding-bottom:6pt;margin-bottom:12pt}
h2{font-size:13pt;font-weight:600;color:#111;margin-top:14pt}h3{font-size:11pt;font-weight:600;color:#333;margin-top:10pt}
p{margin-bottom:8pt}ul{margin-left:18pt;margin-bottom:8pt}li{margin-bottom:3pt}
blockquote{border-left:3pt solid #c9a84c;padding-left:10pt;color:#555;font-style:italic;margin:10pt 0}
code{font-family:Consolas,monospace;font-size:9pt;background:#f5f5f5;padding:1pt 4pt}
.brand{font-size:7pt;font-weight:700;letter-spacing:4pt;text-transform:uppercase;color:#c9a84c}
.footer{border-top:0.5pt solid #ddd;padding-top:6pt;font-size:7pt;color:#bbb;text-align:center;margin-top:30pt}
</style></head><body>
<p class="brand">HARDMAN · Inteligencia Jurídica · Perú</p>
<h1 style="border-bottom:2pt solid #c9a84c;font-size:22pt;padding-bottom:8pt">Dictamen Legal</h1>
<p style="font-size:8pt;color:#888;margin-bottom:20pt">${agent.name} · ${agent.role} · ${fecha}</p>
<p>${toHtml(message.content)}</p>
<div class="footer">HARDMAN · Inteligencia Jurídica · Perú | ${fecha} | Documento Confidencial</div>
</body></html>`
    const blob = new Blob([wordHtml], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `Hardman_${agent.name}_${new Date().toISOString().slice(0, 10)}.doc`
    a.click(); URL.revokeObjectURL(url)
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2500)
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
                {message.content}
              </ReactMarkdown>
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

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-light transition-all"
              style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.40)' }}
            >
              {copied ? <><Check size={11} style={{ color: '#34d17a' }} /> Copiado</> : <><Copy size={11} /> Copiar</>}
            </button>

            <div ref={exportRef} className="relative">
              <button
                onClick={() => setExportOpen((o) => !o)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-light transition-all"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: downloaded ? '#34d17a' : 'rgba(255,255,255,0.40)' }}
              >
                {downloaded ? <><Check size={11} /> Listo</> : <><Download size={11} /> Exportar</>}
              </button>
              {exportOpen && (
                <div
                  className="absolute bottom-full left-0 mb-1.5 rounded-xl overflow-hidden z-50"
                  style={{ background: '#1a1a1a', border: '1px solid #333333', minWidth: '168px', boxShadow: '0 8px 30px rgba(0,0,0,0.60)' }}
                >
                  <button
                    onClick={handleExportPDF}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-light text-left transition-colors"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.10)'; e.currentTarget.style.color = '#c9a84c' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                  >
                    <FileText size={11} /> PDF — descarga directa
                  </button>
                  <div style={{ height: '1px', background: '#2a2a2a', margin: '0 10px' }} />
                  <button
                    onClick={handleExportWord}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] font-light text-left transition-colors"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(201,168,76,0.10)'; e.currentTarget.style.color = '#c9a84c' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
                  >
                    <FileText size={11} /> Word (.doc)
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
              className="p-1 rounded-md transition-all"
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
              className="p-1 rounded-md transition-all"
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
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-light transition-all"
              style={{
                background: saved ? 'rgba(201,168,76,0.10)' : '#1a1a1a',
                border: `1px solid ${saved ? 'rgba(201,168,76,0.30)' : '#2a2a2a'}`,
                color: saved ? '#c9a84c' : 'rgba(255,255,255,0.30)',
              }}
              title={saved ? 'Guardado en Habilidades' : 'Guardar en Habilidades'}
            >
              <Star size={11} fill={saved ? '#c9a84c' : 'none'} />
              <span className="hidden sm:inline">{saved ? 'Guardado' : 'Guardar'}</span>
            </button>

            {/* Calendar export — opens interactive modal */}
            {deadlines.length > 0 && (
              <button
                onClick={() => onOpenDeadline(deadlines[0])}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition-all"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: '#c9a84c',
                }}
                title={`Abrir gestor y cómputo de plazo: ${deadlines[0]}`}
              >
                <Calendar size={11} />
                <span>Agregar plazo</span>
              </button>
            )}
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
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-[10px] font-semibold"
          style={{
            background: 'rgba(201,168,76,0.10)',
            border: '1px solid rgba(201,168,76,0.25)',
            color: '#c9a84c',
          }}
        >
          {userInitials}
        </div>
      )}
    </motion.div>
  )
}

function ThinkingIndicator({ agent }: { agent: NonNullable<ReturnType<typeof getAgent>> }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex items-start gap-3 w-full max-w-4xl mx-auto"
    >
      <div
        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1"
        style={{ border: '1px solid rgba(201,168,76,0.20)' }}
      >
        <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
      </div>

      <div
        className="flex-1 max-w-[85%] rounded-xl overflow-hidden"
        style={{ background: '#1a1a1a', border: '1px solid rgba(201,168,76,0.15)' }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-3 flex items-center justify-between transition-all text-left"
          style={{ background: 'rgba(201,168,76,0.05)' }}
        >
          <div className="flex items-center gap-2.5">
            <RefreshCw size={13} className="animate-spin" style={{ color: '#c9a84c' }} />
            <span className="text-[11px] font-light text-white">
              Analizando caso con {agent.name}...
            </span>
          </div>
          {expanded ? <ChevronUp size={13} style={{ color: '#c9a84c' }} /> : <ChevronDown size={13} style={{ color: '#c9a84c' }} />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 space-y-2 text-[11px] font-light"
              style={{ borderTop: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.40)' }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full dot-online" style={{ background: '#34d17a' }} />
                <span>Identificando pretensiones y marco normativo peruano</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full dot-online" style={{ background: '#c9a84c' }} />
                <span>Revisando jurisprudencia y casaciones aplicables ({agent.badge})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#333333' }} />
                <span>Estructurando dictamen y fundamentación legal</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
