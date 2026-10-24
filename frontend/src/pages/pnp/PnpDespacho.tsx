import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowUp,
  Mic,
  MicOff,
  Paperclip,
  Download,
  Copy,
  Check,
  Building2,
  Shield,
  FileText,
  Clock,
  RefreshCw,
  LogOut,
  Plus,
  Trash2,
  MessageSquare,
  Menu,
  X,
  ArrowRight,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  Search,
  SquarePen,
  Scale,
  Sparkles,
  MoreHorizontal,
  Pencil,
  Pin,
  Share2,
  Archive,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { downloadPnpWordDoc } from '@/lib/pnpDocGenerator'
import { generatePnpStandardResponse } from '@/lib/pnpEngine'
import { api } from '@/lib/api'
import HardmanPnpLogo from '@/components/brand/HardmanPnpLogo'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  docTitle?: string
  docContent?: string
  mode?: 'INSPECTORIA' | 'DEFENSA'
}

interface PnpCaseItem {
  id: string
  title: string
  date: string
  mode: 'INSPECTORIA' | 'DEFENSA'
  isPinned?: boolean
  messages: ChatMessage[]
}

const INITIAL_DEMO_CASES: PnpCaseItem[] = [
  {
    id: 'demo-case-1',
    title: 'Auto de Inicio PAD Falta G-24',
    date: 'Hoy',
    mode: 'INSPECTORIA',
    isPinned: true,
    messages: [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Genera Auto de Inicio de PAD por presunta infracción Grave G-24 por ausencia injustificada al servicio de guardia.',
        timestamp: '10:14',
        mode: 'INSPECTORIA',
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'He redactado el Auto de Inicio de Procedimiento Administrativo Disciplinario conforme a la Ley N° 30714 y debida motivación de tipicidad. Puedes descargarlo en Word con membrete oficial:',
        timestamp: '10:14',
        docTitle: 'AUTO DE INICIO DE PROCEDIMIENTO ADMINISTRATIVO DISCIPLINARIO (G-24)',
        docContent: `POLICÍA NACIONAL DEL PERÚ\nINSPECTORÍA GENERAL • OFICINA DE DISCIPLINA\n\nAUTO DE INICIO DE PROCEDIMIENTO ADMINISTRATIVO DISCIPLINARIO\nEXP. N° 024-2026-IGPNP/DIRINV-OD\n\nI. VISTOS: El Informe Policial N° 045-2026 dando cuenta de la presunta falta al servicio nocturno.\nII. HECHOS IMPUTADOS: Ausencia injustificada del efectivo en servicio de guardia.\nIII. SUBSUNCIÓN: Infracción Grave G-24 (Ley 30714). Sanción: 1 a 6 meses de pase a disponibilidad.\nIV. DISPOSICIÓN: Conceder diez (10) días hábiles para informe de descargo.`,
        mode: 'INSPECTORIA',
      },
    ],
  },
  {
    id: 'demo-case-2',
    title: 'Descargo Falta Leve L-14',
    date: 'Ayer',
    mode: 'DEFENSA',
    isPinned: false,
    messages: [
      {
        id: 'msg-3',
        role: 'user',
        content: 'Redacta mi descargo por imputación de falta leve L-14 por presunto descuido en uniforme, demostrando subsanación inmediata.',
        timestamp: '14:22',
        mode: 'DEFENSA',
      },
      {
        id: 'msg-4',
        role: 'assistant',
        content: 'He redactado tu escrito de descargo fundamentado en el principio de razonabilidad y proporcionalidad de la Ley N° 30714 solicitando amonestación sin afectación de legajo.',
        timestamp: '14:22',
        docTitle: 'ESCRITO DE DESCARGO POR INFRACCIÓN LEVE L-14',
        docContent: `SEÑOR JEFE DE UNIDAD PNP:\n\nSUMILLA: PRESENTA ESCRITO DE DESCARGO FRENTE A PAPELETA POR INFRACCIÓN L-14 Y SOLICITA AMONESTACIÓN.\n\nS2 PNP Juan Pérez Rojas expongo: Que habiendo procedido a la subsanación inmediata del uniforme reglamentario y no existiendo reincidencia, solicito tener por justificada la conducta.`,
        mode: 'DEFENSA',
      },
    ],
  },
  {
    id: 'demo-case-3',
    title: 'Auditoría de Prescripción Art. 68',
    date: '18 oct',
    mode: 'INSPECTORIA',
    isPinned: false,
    messages: [
      {
        id: 'msg-5',
        role: 'user',
        content: '¿Cuáles son los plazos exactos de prescripción y caducidad según la Ley 30714?',
        timestamp: '09:05',
        mode: 'INSPECTORIA',
      },
      {
        id: 'msg-6',
        role: 'assistant',
        content: 'Conforme al Art. 68 de la Ley N° 30714: Infracciones Leves prescriben a los 3 meses; Graves a los 2 años; Muy Graves a los 3 años. La caducidad del PAD opera a los 9 meses calendario de iniciado.',
        timestamp: '09:05',
        mode: 'INSPECTORIA',
      },
    ],
  },
]

export default function PnpDespacho() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  // Sidebar expandido / colapsado
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024
    }
    return true
  })

  // Búsqueda de casos
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Historial de casos (ChatGPT style)
  const [cases, setCases] = useState<PnpCaseItem[]>(() => {
    try {
      const saved = localStorage.getItem('hardman_pnp_cases')
      if (saved) return JSON.parse(saved)
    } catch {}
    return INITIAL_DEMO_CASES
  })

  // Caso actualmente seleccionado
  const [activeCaseId, setActiveCaseId] = useState<string>(() => {
    return INITIAL_DEMO_CASES[0]?.id || 'demo-case-1'
  })

  // Modo operativo: Inspectoría vs Defensa
  const [mode, setMode] = useState<'INSPECTORIA' | 'DEFENSA'>(() => {
    return (localStorage.getItem('pnp_preferred_role') as 'INSPECTORIA' | 'DEFENSA') || 'INSPECTORIA'
  })

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const current = cases.find((c) => c.id === activeCaseId)
    return current ? current.messages : []
  })

  const activeCase = cases.find((c) => c.id === activeCaseId)

  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null)

  // Menú contextual estilo ChatGPT (•••): Guarda ID y coordenadas para abrir a la DERECHA
  const [openMenuCaseId, setOpenMenuCaseId] = useState<string | null>(null)
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(null)

  // Modal moderno de confirmación de eliminación (estilo ChatGPT)
  const [caseToDelete, setCaseToDelete] = useState<PnpCaseItem | null>(null)

  // Renombrado inline de casos
  const [renamingCaseId, setRenamingCaseId] = useState<string | null>(null)
  const [renamingTitle, setRenamingTitle] = useState('')

  // Toast flotante de feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Dictado por voz nativo
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Nombre de usuario para el saludo estilo ChatGPT (NUNCA dice "Abogado")
  const rawName = user?.name || ''
  const firstName =
    !rawName || rawName.toLowerCase().includes('abogado')
      ? 'Valentino'
      : rawName.trim().split(/\s+/)[0]

  const userFullName =
    !rawName || rawName.toLowerCase().includes('abogado')
      ? 'Valentino Marca'
      : rawName

  // Iniciales para el avatar del mini-rail
  const getInitials = (name?: string | null) => {
    if (!name || name.toLowerCase().includes('abogado')) return 'VM'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  // Filtrado de casos
  const filteredCases = cases.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pinnedCases = filteredCases.filter((c) => c.isPinned)
  const recentCases = filteredCases.filter((c) => !c.isPinned)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 2500)
  }

  // Cerrar menú contextual si se hace click fuera o se scrollea
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuCaseId) {
        setOpenMenuCaseId(null)
        setMenuCoords(null)
      }
    }
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('scroll', handleClickOutside, true)
    return () => {
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('scroll', handleClickOutside, true)
    }
  }, [openMenuCaseId])

  // Guardar casos en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hardman_pnp_cases', JSON.stringify(cases))
    } catch {}
  }, [cases])

  // Cambiar caso activo (mantiene sidebar abierto en desktop)
  const handleSelectCase = (caseItem: PnpCaseItem) => {
    setActiveCaseId(caseItem.id)
    setMessages(caseItem.messages)
    setMode(caseItem.mode)
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  // Crear nuevo caso sin salir del despacho
  const handleNewCase = () => {
    const newCaseId = 'case_' + Date.now()
    const newCase: PnpCaseItem = {
      id: newCaseId,
      title: 'Nuevo Caso Disciplinario',
      date: 'Hoy',
      mode,
      messages: [],
    }
    setCases((prev) => [newCase, ...prev])
    setActiveCaseId(newCaseId)
    setMessages([])
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
    setTimeout(() => textareaRef.current?.focus(), 80)
  }

  // Iniciar renombrado
  const handleStartRename = (caseItem: PnpCaseItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuCaseId(null)
    setMenuCoords(null)
    setRenamingCaseId(caseItem.id)
    setRenamingTitle(caseItem.title)
  }

  // Guardar renombrado
  const handleSaveRename = (id: string) => {
    if (renamingTitle.trim()) {
      setCases((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: renamingTitle.trim() } : c))
      )
      showToast('Caso renombrado correctamente')
    }
    setRenamingCaseId(null)
  }

  // Alternar fijado
  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuCaseId(null)
    setMenuCoords(null)
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    )
    showToast('Preferencia de fijado actualizada')
  }

  // Compartir caso
  const handleShareCase = (caseItem: PnpCaseItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuCaseId(null)
    setMenuCoords(null)
    try {
      navigator.clipboard.writeText(`${window.location.origin}/pnp/despacho#${caseItem.id}`)
      showToast('Enlace de consulta copiado al portapapeles')
    } catch {
      showToast('No fue posible copiar el enlace')
    }
  }

  // Abrir modal de confirmación de eliminación (NO window.confirm)
  const handleOpenDeleteModal = (caseItem: PnpCaseItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenMenuCaseId(null)
    setMenuCoords(null)
    setCaseToDelete(caseItem)
  }

  // Confirmar eliminación desde el modal
  const handleConfirmDelete = () => {
    if (!caseToDelete) return
    const id = caseToDelete.id
    const updated = cases.filter((c) => c.id !== id)
    setCases(updated)
    setCaseToDelete(null)
    showToast('Caso eliminado del registro')

    if (activeCaseId === id) {
      if (updated.length > 0) {
        setActiveCaseId(updated[0].id)
        setMessages(updated[0].messages)
      } else {
        handleNewCase()
      }
    }
  }

  const handleModeChange = (newMode: 'INSPECTORIA' | 'DEFENSA') => {
    setMode(newMode)
    localStorage.setItem('pnp_preferred_role', newMode)
  }

  // Inicializar Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) {
      setSpeechSupported(true)
      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'es-PE'

      recognition.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript
        }
        if (transcript) {
          setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript))
        }
      }

      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognitionRef.current = recognition
    }
  }, [])

  const toggleVoiceDictation = () => {
    if (!speechSupported || !recognitionRef.current) {
      alert('El dictado por voz requiere Google Chrome o Microsoft Edge.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        console.warn('Error voz:', err)
      }
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Enviar mensaje
  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputValue).trim()
    if (!textToSend && !attachedFileName) return

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: attachedFileName
        ? `[Archivo adjunto: ${attachedFileName}]\n\n${textToSend}`
        : textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      mode,
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInputValue('')
    setAttachedFileName(null)
    setIsTyping(true)

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }

    // Actualizar título del caso si es el primer mensaje
    if (messages.length === 0) {
      const summaryTitle = textToSend.slice(0, 32) + (textToSend.length > 32 ? '...' : '')
      setCases((prev) =>
        prev.map((c) => (c.id === activeCaseId ? { ...c, title: summaryTitle } : c))
      )
    }

    try {
      let aiResponseText = ''
      let docTitle: string | undefined
      let docContent: string | undefined

      try {
        const res = await api.chat.send({
          agentId: 'marco',
          messages: [
            {
              role: 'system',
              content: `Eres Hardman PNP, la IA experta en Régimen Disciplinario de la Policía Nacional del Perú (Ley N° 30714, D.S. 003-2020-IN y precedentes del Tribunal de Disciplina Policial TDP). Estás interactuando con Valentino Marca. Estás actuando en modo: ${
                mode === 'INSPECTORIA'
                  ? 'DESPACHO DE INSPECTORÍA / OD (redactar autos de inicio, informes disciplinarios y resoluciones)'
                  : 'DEFENSA TÉCNICA DEL EFECTIVO (redactar descargos, apelaciones y excepciones de prescripción)'
              }. Mantén un estilo sobrio, formal, institucional y riguroso.`,
              timestamp: new Date().toISOString(),
            },
            ...newMessages.map((m) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date().toISOString(),
            })),
          ],
        })
        aiResponseText = res.message
      } catch {
        const local = generatePnpStandardResponse(mode, textToSend)
        aiResponseText = local.response
        docTitle = local.docTitle
        docContent = local.docContent
      }

      if (
        !docContent &&
        (aiResponseText.includes('VISTOS:') ||
          aiResponseText.includes('SUMILLA:') ||
          aiResponseText.includes('EXPEDIENTE:'))
      ) {
        docTitle =
          mode === 'INSPECTORIA'
            ? 'DOCUMENTO OFICIAL DE INSPECTORÍA'
            : 'ESCRITO DE DESCARGO DISCIPLINARIO'
        docContent = aiResponseText
      }

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        docTitle,
        docContent,
        mode,
      }

      const finalMessages = [...newMessages, botMsg]
      setMessages(finalMessages)

      // Guardar mensajes en el caso activo
      setCases((prev) =>
        prev.map((c) => (c.id === activeCaseId ? { ...c, messages: finalMessages } : c))
      )
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: 'No fue posible completar la solicitud. Por favor reintenta en unos instantes.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleDownloadWord = async (msg: ChatMessage) => {
    if (!msg.docContent && !msg.content) return
    setDownloadingDoc(msg.id)
    try {
      await downloadPnpWordDoc({
        title: msg.docTitle || (mode === 'INSPECTORIA' ? 'INFORME DISCIPLINARIO' : 'ESCRITO DE DESCARGO'),
        content: msg.docContent || msg.content,
        mode: msg.mode || mode,
        officerName: userFullName,
      })
    } catch {
      alert('Error al generar archivo Word')
    } finally {
      setDownloadingDoc(null)
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    showToast('Copiado al portapapeles')
  }

  // Renderizador de cada item del historial de casos en el sidebar
  const renderCaseItem = (caseItem: PnpCaseItem) => {
    const isActive = caseItem.id === activeCaseId
    const isMenuOpen = openMenuCaseId === caseItem.id
    const isRenaming = renamingCaseId === caseItem.id

    return (
      <div
        key={caseItem.id}
        onClick={() => !isRenaming && handleSelectCase(caseItem)}
        className="group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-light cursor-pointer transition-all"
        style={{
          background: isActive ? '#124c40' : isMenuOpen ? '#0d3830' : 'transparent',
          color: isActive ? '#ffffff' : 'rgba(244, 241, 234, 0.82)',
          borderLeft: isActive ? '3px solid #dfbe63' : '3px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!isActive && !isMenuOpen) e.currentTarget.style.background = '#0d3830'
        }}
        onMouseLeave={(e) => {
          if (!isActive && !isMenuOpen) e.currentTarget.style.background = 'transparent'
        }}
      >
        {isRenaming ? (
          <div
            className="flex items-center gap-1.5 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              type="text"
              value={renamingTitle}
              onChange={(e) => setRenamingTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename(caseItem.id)
                if (e.key === 'Escape') setRenamingCaseId(null)
              }}
              className="w-full bg-[#061e19] border border-[#c9a84c] rounded px-2 py-1 text-xs text-white outline-none"
            />
            <button
              onClick={() => handleSaveRename(caseItem.id)}
              className="p-1 hover:text-green-400 text-white cursor-pointer"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => setRenamingCaseId(null)}
              className="p-1 hover:text-red-400 text-gray-400 cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2.5 truncate pr-1">
              {caseItem.isPinned ? (
                <Pin size={12} className="text-[#dfbe63] shrink-0 rotate-45" />
              ) : (
                <MessageSquare
                  size={13}
                  style={{
                    color: isActive ? '#dfbe63' : 'rgba(244, 241, 234, 0.45)',
                    flexShrink: 0,
                  }}
                />
              )}
              <span className="truncate">{caseItem.title}</span>
            </div>

            {/* Botón de 3 puntos estilo ChatGPT (•••) */}
            <div className="relative shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isMenuOpen) {
                    setOpenMenuCaseId(null)
                    setMenuCoords(null)
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect()
                    // Abre a la DERECHA del botón hacia el área principal de trabajo
                    setMenuCoords({
                      top: Math.min(rect.top - 6, window.innerHeight - 220),
                      left: rect.right + 8,
                    })
                    setOpenMenuCaseId(caseItem.id)
                  }
                }}
                title="Opciones del caso"
                className={`p-1.5 rounded-md hover:bg-[#16564a] transition-all cursor-pointer ${
                  isMenuOpen
                    ? 'opacity-100 text-white bg-[#16564a]'
                    : 'opacity-0 group-hover:opacity-100 text-[#f4f1ea]/60 hover:text-white'
                }`}
              >
                <MoreHorizontal size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // Componente unificado del Input Pill Flotante estilo ChatGPT
  const renderFloatingInputPill = (isCentered = false) => (
    <div className="w-full">
      {/* Expediente Adjunto */}
      {attachedFileName && (
        <div
          className="mb-2.5 flex items-center justify-between px-3.5 py-1.5 rounded-xl text-xs border shadow-sm"
          style={{
            background: '#0d3d34',
            borderColor: 'rgba(45, 175, 150, 0.55)',
            color: '#dfbe63',
          }}
        >
          <span className="flex items-center gap-2 truncate">
            <Paperclip size={13} />
            <span>Expediente adjunto: <strong>{attachedFileName}</strong></span>
          </span>
          <button
            onClick={() => setAttachedFileName(null)}
            className="p-1 hover:text-white cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Alerta de Dictado por Voz */}
      {isListening && (
        <div
          className="mb-2.5 flex items-center justify-between px-3.5 py-1.5 rounded-xl text-xs border shadow-sm"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            borderColor: 'rgba(239, 68, 68, 0.4)',
            color: '#f87171',
          }}
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span>Dictado policial activo... habla con claridad</span>
          </span>
          <button
            onClick={toggleVoiceDictation}
            className="text-xs underline font-medium cursor-pointer hover:text-white"
          >
            Detener
          </button>
        </div>
      )}

      {/* Floating Rounded Pill Card (ChatGPT Style) */}
      <div
        className="relative flex flex-col p-3.5 rounded-[26px] border transition-all duration-200 shadow-[0_18px_50px_rgba(0,0,0,0.55)] backdrop-blur-2xl focus-within:border-[#c9a84c] focus-within:shadow-[0_0_32px_rgba(201,168,76,0.25)]"
        style={{
          background: 'rgba(9, 39, 33, 0.94)',
          borderColor: 'rgba(50, 175, 145, 0.5)',
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) setAttachedFileName(file.name)
          }}
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          className="hidden"
        />

        {/* Textarea Area */}
        <textarea
          ref={textareaRef}
          rows={isCentered ? 2 : 1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={
            mode === 'INSPECTORIA'
              ? 'Preguntar a Hardman PNP o redactar auto de inicio (Falta G-24, L-14, MG-39)...'
              : 'Preguntar a Hardman PNP o redactar escrito de descargo para la falta imputada...'
          }
          className="w-full bg-transparent border-0 text-sm sm:text-base text-white outline-none resize-none px-2 pt-1 pb-2 max-h-36 font-light placeholder:text-[#a3cfc6]/45"
          style={{ caretColor: '#dfbe63' }}
        />

        {/* Controls Row (ChatGPT Pill Footer) */}
        <div className="flex items-center justify-between pt-1 border-t border-[rgba(45,175,150,0.25)]">
          {/* Left Controls: Plus/Attach + Mode Pill */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar cédula de notificación, informe o acta policial"
              className="p-1.5 rounded-full hover:bg-[#124c40] transition-colors cursor-pointer text-[#a3cfc6] hover:text-white"
            >
              <Plus size={18} />
            </button>

            {/* Quick Mode Toggle Pill inside input */}
            <button
              type="button"
              onClick={() => handleModeChange(mode === 'INSPECTORIA' ? 'DEFENSA' : 'INSPECTORIA')}
              title="Alternar entre Inspectoría y Defensa Técnica"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border shadow-sm"
              style={{
                background: 'rgba(6, 30, 25, 0.85)',
                borderColor: 'rgba(201, 168, 76, 0.45)',
                color: '#dfbe63',
              }}
            >
              {mode === 'INSPECTORIA' ? (
                <>
                  <Building2 size={11} />
                  <span>Inspectoría / OD</span>
                </>
              ) : (
                <>
                  <Shield size={11} />
                  <span>Defensa Policial</span>
                </>
              )}
            </button>
          </div>

          {/* Right Controls: Dictation Mic + Circular Send Button ↑ */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceDictation}
              title={isListening ? 'Detener dictado' : 'Dictado por voz'}
              className="p-1.5 rounded-full transition-colors cursor-pointer"
              style={{
                color: isListening ? '#f87171' : 'rgba(244, 241, 234, 0.65)',
              }}
              onMouseEnter={(e) => {
                if (!isListening) e.currentTarget.style.color = '#dfbe63'
              }}
              onMouseLeave={(e) => {
                if (!isListening) e.currentTarget.style.color = 'rgba(244, 241, 234, 0.65)'
              }}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            {/* Circular Gold Send Button with ArrowUp (ChatGPT style) */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={(!inputValue.trim() && !attachedFileName) || isTyping}
              title="Enviar mensaje (Enter)"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                color: '#061e19',
              }}
            >
              <ArrowUp size={16} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      className="flex h-screen text-[#f4f1ea] font-sans selection:bg-[#c9a84c] selection:text-black overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, #0d3830 0%, #082620 50%, #041713 100%)',
      }}
    >
      {/* ─── TOAST NOTIFICATION FLOTANTE ─── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2 rounded-full border text-xs font-medium shadow-2xl flex items-center gap-2 backdrop-blur-xl"
            style={{
              background: 'rgba(13, 56, 48, 0.95)',
              borderColor: '#c9a84c',
              color: '#dfbe63',
            }}
          >
            <Check size={14} className="text-[#10b981]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MENÚ CONTEXTUAL FLOTANTE (ABRE HACIA LA DERECHA) ─── */}
      <AnimatePresence>
        {openMenuCaseId && menuCoords && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.94, x: -8 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: menuCoords.top,
              left: menuCoords.left,
              zIndex: 9999,
              background: 'rgba(9, 36, 30, 0.98)',
              borderColor: 'rgba(45, 175, 150, 0.45)',
            }}
            className="w-48 rounded-xl border shadow-[0_20px_50px_rgba(0,0,0,0.65)] py-1.5 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const targetCase = cases.find((c) => c.id === openMenuCaseId)
              if (!targetCase) return null
              return (
                <>
                  <button
                    onClick={(e) => handleStartRename(targetCase, e)}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#f4f1ea] hover:bg-[#124c40] flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Pencil size={13} className="text-[#a3cfc6]" />
                    <span>Renombrar</span>
                  </button>

                  <button
                    onClick={(e) => handleTogglePin(targetCase.id, e)}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#f4f1ea] hover:bg-[#124c40] flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Pin size={13} className="text-[#a3cfc6]" />
                    <span>{targetCase.isPinned ? 'Desfijar' : 'Fijar'}</span>
                  </button>

                  <div className="my-1 border-t border-[rgba(45,175,150,0.2)]" />

                  <button
                    onClick={(e) => handleShareCase(targetCase, e)}
                    className="w-full px-3.5 py-2 text-left text-xs text-[#f4f1ea] hover:bg-[#124c40] flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Share2 size={13} className="text-[#a3cfc6]" />
                    <span>Compartir</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenDeleteModal(targetCase, e)}
                    className="w-full px-3.5 py-2 text-left text-xs text-red-400 hover:bg-red-500/15 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Eliminar</span>
                  </button>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL PROFESIONAL DE CONFIRMACIÓN DE ELIMINACIÓN (ESTILO CHATGPT) ─── */}
      <AnimatePresence>
        {caseToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md p-6 rounded-2xl border shadow-2xl"
              style={{
                background: '#0a2e26',
                borderColor: 'rgba(45, 175, 150, 0.45)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setCaseToDelete(null)}
                className="absolute top-4 right-4 p-1 rounded-lg text-[#a3cfc6]/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="text-base sm:text-lg font-medium text-white pr-6">
                ¿Eliminar chat?
              </h3>

              <p className="mt-2.5 text-xs sm:text-sm text-[#a3cfc6]/80 leading-relaxed font-light">
                Esto eliminará <strong className="text-white font-medium">«{caseToDelete.title}»</strong> de forma permanente. No se puede deshacer.
              </p>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setCaseToDelete(null)}
                  className="px-4 py-2 rounded-full border border-white/20 text-white text-xs font-medium hover:bg-white/10 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-full bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold transition cursor-pointer shadow-lg active:scale-95"
                >
                  Eliminar chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MINI-RAIL CHATGPT STYLE (VISIBLE CUANDO LA BARRA ESTÁ COLAPSADA EN DESKTOP) ─── */}
      {!sidebarOpen && (
        <aside
          className="hidden md:flex w-[58px] flex-col items-center justify-between py-3.5 border-r shrink-0 z-30 transition-all duration-200"
          style={{
            background: '#082821',
            borderColor: 'rgba(45, 175, 150, 0.28)',
          }}
        >
          {/* Top Actions: Toggle / Expand, New Case, Search */}
          <div className="flex flex-col items-center gap-3">
            {/* Open Sidebar Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              title="Mostrar barra lateral"
              className="p-2 rounded-lg transition-all hover:bg-[#0d3d34] cursor-pointer"
              style={{ color: '#dfbe63' }}
            >
              <PanelLeft size={18} />
            </button>

            {/* New Case Button */}
            <button
              onClick={handleNewCase}
              title="Nuevo caso disciplinario"
              className="p-2 rounded-lg transition-all hover:bg-[#0d3d34] cursor-pointer text-[#f4f1ea]/80 hover:text-white"
            >
              <SquarePen size={18} />
            </button>

            {/* Search Cases Button */}
            <button
              onClick={() => {
                setSidebarOpen(true)
                setTimeout(() => searchInputRef.current?.focus(), 100)
              }}
              title="Buscar casos en historial"
              className="p-2 rounded-lg transition-all hover:bg-[#0d3d34] cursor-pointer text-[#f4f1ea]/60 hover:text-white"
            >
              <Search size={18} />
            </button>
          </div>

          {/* Middle: Active Role Badge */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleModeChange(mode === 'INSPECTORIA' ? 'DEFENSA' : 'INSPECTORIA')}
              title={
                mode === 'INSPECTORIA'
                  ? 'Modo Inspectoría / OD (Click para alternar)'
                  : 'Modo Defensa Policial (Click para alternar)'
              }
              className="p-2 rounded-xl transition-all hover:bg-[#0d3d34] cursor-pointer"
              style={{
                color: '#dfbe63',
                background: 'rgba(201, 168, 76, 0.1)',
                border: '1px solid rgba(201, 168, 76, 0.3)',
              }}
            >
              {mode === 'INSPECTORIA' ? <Building2 size={16} /> : <Shield size={16} />}
            </button>
          </div>

          {/* Bottom: User Avatar Circle (ChatGPT style) */}
          <div className="flex flex-col items-center gap-2">
            <div
              title={`Usuario: ${userFullName}`}
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs cursor-pointer shadow-md transition-transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #124c40, #082821)',
                border: '1.5px solid #dfbe63',
                color: '#dfbe63',
              }}
            >
              {getInitials(userFullName)}
            </div>
          </div>
        </aside>
      )}

      {/* ─── SIDEBAR COMPLETO EXPANDIDO (CHATGPT STYLE EN VERDE AZULINO) ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r transition-all duration-200 md:static ${
          sidebarOpen
            ? 'w-64 translate-x-0 opacity-100'
            : 'w-0 -translate-x-full md:hidden opacity-0 overflow-hidden border-r-0'
        }`}
        style={{
          background: '#082821',
          borderColor: 'rgba(45, 175, 150, 0.28)',
        }}
      >
        {/* Sidebar Header: Logo Hardman PNP CENTRADO armoniosamente sobre el display de búsqueda */}
        <div
          className="relative p-3.5 border-b flex items-center justify-center shrink-0"
          style={{ borderColor: 'rgba(45, 175, 150, 0.28)' }}
        >
          <div title="Crear nuevo caso disciplinario" className="flex items-center justify-center">
            <HardmanPnpLogo size="sm" onClick={handleNewCase} />
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            title="Ocultar barra lateral"
            className="absolute right-3 p-1.5 rounded-lg hover:bg-[#0d3d34] transition-colors cursor-pointer text-[#f4f1ea]/60 hover:text-white"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        {/* New Chat Button & Search Filter */}
        <div className="p-3 pb-2 space-y-2 shrink-0">
          <button
            onClick={handleNewCase}
            className="w-full py-2.5 px-3 rounded-lg flex items-center gap-2.5 text-xs font-medium tracking-wide transition-all duration-200 cursor-pointer shadow-sm"
            style={{
              border: '1px solid rgba(45, 175, 150, 0.45)',
              background: '#0d3d34',
              color: 'rgba(244, 241, 234, 0.95)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c9a84c'
              e.currentTarget.style.color = '#dfbe63'
              e.currentTarget.style.background = '#124c40'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.45)'
              e.currentTarget.style.color = 'rgba(244, 241, 234, 0.95)'
              e.currentTarget.style.background = '#0d3d34'
            }}
          >
            <Plus size={14} style={{ color: '#dfbe63' }} />
            <span>Nuevo Caso Disciplinario</span>
          </button>

          {/* Search Input Filter */}
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs"
            style={{
              background: '#061e19',
              borderColor: 'rgba(45, 175, 150, 0.3)',
            }}
          >
            <Search size={13} style={{ color: 'rgba(244, 241, 234, 0.45)' }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar en historial..."
              className="w-full bg-transparent outline-none text-white text-xs placeholder:text-[#a3cfc6]/40"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-white">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2">
          {/* Seccion Fijados (si existen) */}
          {pinnedCases.length > 0 && (
            <div>
              <div
                className="px-2 pt-2 pb-1 text-[10px] uppercase font-bold tracking-[2px] flex items-center gap-1.5"
                style={{ color: 'rgba(201, 168, 76, 0.9)' }}
              >
                <Pin size={10} className="rotate-45" />
                <span>Casos Fijados</span>
              </div>
              <div className="space-y-1">
                {pinnedCases.map((c) => renderCaseItem(c))}
              </div>
            </div>
          )}

          {/* Seccion Recientes */}
          <div>
            <div
              className="px-2 pt-2 pb-1 text-[10px] uppercase font-bold tracking-[2px]"
              style={{ color: 'rgba(163, 207, 198, 0.55)' }}
            >
              Historial de Casos
            </div>
            {recentCases.length === 0 && pinnedCases.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#a3cfc6]/50">
                No se encontraron casos
              </div>
            ) : (
              <div className="space-y-1">
                {recentCases.map((c) => renderCaseItem(c))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Footer: Profile with Initials Avatar & Logout */}
        <div
          className="p-3 border-t shrink-0"
          style={{ borderColor: 'rgba(45, 175, 150, 0.28)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate pr-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #124c40, #082821)',
                  border: '1.5px solid #dfbe63',
                  color: '#dfbe63',
                }}
              >
                {getInitials(userFullName)}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-medium text-white truncate">
                  {userFullName}
                </span>
                <span className="text-[10px] font-light flex items-center gap-1.5" style={{ color: '#dfbe63' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span>Oficial PNP • Ley N° 30714</span>
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/pnp')
              }}
              title="Cerrar Sesión"
              className="p-1.5 rounded text-xs transition-colors hover:text-red-400 cursor-pointer text-[#f4f1ea]/50"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ─── MAIN CHAT AREA (RIGHT) ─── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Navbar - Clean Symmetrical Distribution */}
        <header
          className="h-14 px-4 sm:px-6 flex items-center justify-between border-b shrink-0 z-20"
          style={{
            background: '#082a23',
            borderColor: 'rgba(45, 175, 150, 0.28)',
          }}
        >
          {/* LEFT COLUMN: Sidebar Toggle (Mobile) + Logo (if sidebar closed) + Case Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              title={sidebarOpen ? 'Ocultar historial de casos' : 'Mostrar historial de casos'}
              className="md:hidden p-1.5 rounded-md transition-colors hover:bg-[#0d3d34] cursor-pointer"
              style={{
                border: '1px solid rgba(45, 175, 150, 0.45)',
                color: '#dfbe63',
                background: '#061e19',
              }}
            >
              <PanelLeft size={16} />
            </button>

            {!sidebarOpen && (
              <div title="Crear nuevo caso disciplinario" className="pl-1">
                <HardmanPnpLogo size="sm" onClick={handleNewCase} />
              </div>
            )}

            {/* Case Title / Section Context */}
            <div
              className={`flex items-center gap-2 ${!sidebarOpen ? 'pl-3 border-l' : ''}`}
              style={{ borderColor: 'rgba(45, 175, 150, 0.35)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0" />
              <span
                className="text-[11px] font-medium tracking-wide uppercase truncate max-w-[180px] sm:max-w-[280px]"
                style={{ color: 'rgba(244, 241, 234, 0.8)' }}
              >
                {activeCase?.title || 'Régimen Disciplinario'}
              </span>
            </div>
          </div>

          {/* CENTER COLUMN: Mode Switcher (Centered & Prominent) */}
          <div className="flex items-center justify-center">
            <div
              className="inline-flex items-center p-1 rounded-xl border shadow-inner"
              style={{
                background: '#061e19',
                borderColor: 'rgba(45, 175, 150, 0.45)',
              }}
            >
              <button
                onClick={() => handleModeChange('INSPECTORIA')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all flex items-center gap-1.5 cursor-pointer"
                style={{
                  background: mode === 'INSPECTORIA' ? '#124c40' : 'transparent',
                  color: mode === 'INSPECTORIA' ? '#ffffff' : 'rgba(244, 241, 234, 0.55)',
                  border:
                    mode === 'INSPECTORIA'
                      ? '1px solid rgba(201, 168, 76, 0.5)'
                      : '1px solid transparent',
                  boxShadow: mode === 'INSPECTORIA' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <Building2
                  size={13}
                  style={{ color: mode === 'INSPECTORIA' ? '#dfbe63' : 'currentColor' }}
                />
                <span>Inspectoría / OD (Cármenes)</span>
              </button>

              <button
                onClick={() => handleModeChange('DEFENSA')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all flex items-center gap-1.5 cursor-pointer"
                style={{
                  background: mode === 'DEFENSA' ? '#124c40' : 'transparent',
                  color: mode === 'DEFENSA' ? '#ffffff' : 'rgba(244, 241, 234, 0.55)',
                  border:
                    mode === 'DEFENSA'
                      ? '1px solid rgba(201, 168, 76, 0.5)'
                      : '1px solid transparent',
                  boxShadow: mode === 'DEFENSA' ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                <Shield
                  size={13}
                  style={{ color: mode === 'DEFENSA' ? '#dfbe63' : 'currentColor' }}
                />
                <span>Defensa del Efectivo</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Quick Action + Ley 30714 Badge + User Session */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewCase}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-sm"
              style={{
                background: 'rgba(201, 168, 76, 0.12)',
                border: '1px solid rgba(201, 168, 76, 0.45)',
                color: '#dfbe63',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201, 168, 76, 0.22)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(201, 168, 76, 0.12)'
              }}
            >
              <Plus size={13} />
              <span>Nuevo Caso</span>
            </button>

            <div
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold tracking-wider uppercase"
              style={{
                background: 'rgba(45, 175, 150, 0.25)',
                border: '1px solid rgba(45, 175, 150, 0.45)',
                color: '#dfbe63',
              }}
            >
              <span>Ley N° 30714</span>
            </div>

            <div
              className="flex items-center pl-2 border-l"
              style={{ borderColor: 'rgba(45, 175, 150, 0.35)' }}
            >
              <button
                onClick={() => {
                  logout()
                  navigate('/pnp')
                }}
                title="Cerrar Sesión"
                className="p-1.5 rounded-lg hover:text-red-400 transition-colors cursor-pointer text-[#f4f1ea]/55"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </header>

        {/* ─── CHAT CONTENT AREA ─── */}
        {messages.length === 0 ? (
          /* EMPTY CHAT: EXACT CHATGPT CENTERED HERO LAYOUT (¿En qué puedo ayudarte, Valentino?) */
          <div className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto w-full text-center py-6 overflow-y-auto">
            {/* Centered Greeting - Valentino */}
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-[32px] font-normal text-white/95 mb-8 tracking-tight drop-shadow-sm"
            >
              ¿En qué puedo ayudarte, {firstName}?
            </motion.h1>

            {/* Floating Input Pill in the Center */}
            <div className="w-full">
              {renderFloatingInputPill(true)}
            </div>

            {/* ChatGPT-style Quick Suggestion Chips */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-2xl px-2">
              {mode === 'INSPECTORIA' ? (
                <>
                  <button
                    onClick={() =>
                      handleSend(
                        'Genera Auto de Inicio de PAD por presunta infracción Grave G-24 por ausencia injustificada al servicio.'
                      )
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <Scale size={14} style={{ color: '#dfbe63' }} />
                    <span>Auto de Inicio PAD (Falta G-24)</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSend(
                        'Redacta un Informe Disciplinario de Instrucción concluyendo con debida motivación de tipicidad.'
                      )
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <FileText size={14} style={{ color: '#dfbe63' }} />
                    <span>Informe Disciplinario de Instrucción</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSend('Calcula los plazos de prescripción y caducidad según el Art. 68 de la Ley N° 30714.')
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <Clock size={14} style={{ color: '#dfbe63' }} />
                    <span>Auditoría de Prescripción (Art. 68)</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSend(
                        'Verifica si la notificación de apertura de PAD cumple con las formalidades y no tiene vicios de nulidad.'
                      )
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <Shield size={14} style={{ color: '#dfbe63' }} />
                    <span>Control de Nulidad Procesal</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() =>
                      handleSend(
                        'Redacta escrito de descargo fundamentado en causal eximente de responsabilidad Art. 21 de la Ley 30714.'
                      )
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <Shield size={14} style={{ color: '#dfbe63' }} />
                    <span>Escrito de Descargo (Causal Eximente)</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSend(
                        'Redacta un Recurso de Apelación ante el Tribunal de Disciplina Policial (TDP) por vulneración al debido proceso.'
                      )
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <Scale size={14} style={{ color: '#dfbe63' }} />
                    <span>Apelación ante el Tribunal (TDP)</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSend(
                        'Tengo citación para rendir manifestación ante Inspectoría por queja de un ciudadano. ¿Qué derechos tengo y qué debo responder?'
                      )
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <FileText size={14} style={{ color: '#dfbe63' }} />
                    <span>Guía para Rendir Manifestación</span>
                  </button>

                  <button
                    onClick={() =>
                      handleSend('¿Cómo verificar si mi sanción disciplinaria ya prescribió bajo la Ley N° 30714?')
                    }
                    className="px-4 py-2.5 rounded-full border text-xs font-normal transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-95"
                    style={{
                      background: 'rgba(10, 42, 36, 0.75)',
                      borderColor: 'rgba(45, 175, 150, 0.4)',
                      color: 'rgba(244, 241, 234, 0.9)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#c9a84c'
                      e.currentTarget.style.color = '#dfbe63'
                      e.currentTarget.style.background = '#124c40'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.4)'
                      e.currentTarget.style.color = 'rgba(244, 241, 234, 0.9)'
                      e.currentTarget.style.background = 'rgba(10, 42, 36, 0.75)'
                    }}
                  >
                    <Clock size={14} style={{ color: '#dfbe63' }} />
                    <span>Prescripción de la Sanción</span>
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ACTIVE CHAT: MESSAGES STREAM + FLOATING INPUT AT BOTTOM */
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 max-w-4xl mx-auto w-full pb-36">
            <div className="space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-5 border text-xs sm:text-sm leading-relaxed shadow-lg ${
                      msg.role === 'user'
                        ? 'text-white'
                        : 'text-[#f4f1ea]'
                    }`}
                    style={{
                      background: msg.role === 'user' ? '#124c40' : '#0a3129',
                      borderColor:
                        msg.role === 'user'
                          ? 'rgba(201, 168, 76, 0.45)'
                          : 'rgba(45, 175, 150, 0.35)',
                    }}
                  >
                    <div className="whitespace-pre-wrap font-light">{msg.content}</div>

                    {/* Official Document Box */}
                    {(msg.docContent || msg.docTitle) && (
                      <div
                        className="mt-5 pt-4 border-t p-4 rounded-xl"
                        style={{
                          background: '#061e19',
                          borderColor: 'rgba(45, 175, 150, 0.35)',
                          borderLeft: '3px solid #c9a84c',
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-xs font-medium text-white">
                            {msg.docTitle || 'DOCUMENTO OFICIAL GENERADO'}
                          </span>
                          <span
                            className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold"
                            style={{
                              background: 'rgba(201, 168, 76, 0.15)',
                              color: '#dfbe63',
                              border: '1px solid rgba(201, 168, 76, 0.4)',
                            }}
                          >
                            Ley N° 30714
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleDownloadWord(msg)}
                            disabled={downloadingDoc === msg.id}
                            className="px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                            style={{
                              background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                              color: '#061e19',
                            }}
                          >
                            <Download size={13} />
                            <span>
                              {downloadingDoc === msg.id ? 'Generando Word...' : 'Descargar en Word (.docx)'}
                            </span>
                          </button>

                          <button
                            onClick={() => handleCopy(msg.id, msg.docContent || msg.content)}
                            className="px-3 py-2 rounded-lg text-xs font-medium tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer"
                            style={{
                              border: '1px solid rgba(45, 175, 150, 0.45)',
                              background: '#0d3d34',
                              color: 'rgba(244, 241, 234, 0.85)',
                            }}
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check size={13} className="text-[#10b981]" />
                                <span>Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 text-[10px] text-right font-light" style={{ color: 'rgba(244, 241, 234, 0.4)' }}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 items-center text-xs font-light" style={{ color: '#dfbe63' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dfbe63] animate-pulse" />
                  <span>Estructurando escrito bajo la Ley N° 30714...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ─── FLOATING INPUT BAR AT BOTTOM (WHEN CHAT HAS MESSAGES) ─── */}
        {messages.length > 0 && (
          <div className="absolute inset-x-0 bottom-0 pointer-events-none p-4 pb-4 flex flex-col items-center bg-gradient-to-t from-[#041713] via-[#041713]/90 to-transparent pt-6 z-20">
            <div className="w-full max-w-2xl sm:max-w-3xl pointer-events-auto">
              {renderFloatingInputPill(false)}
              <p
                className="text-[10px] text-center mt-2 font-light"
                style={{ color: 'rgba(163, 207, 198, 0.65)' }}
              >
                Hardman PNP opera conforme a la Ley N° 30714 y precedentes TDP. Verifica siempre la motivación.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
