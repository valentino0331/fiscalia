import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Search, X, Shield, MessageSquare, Clock, FileText, Trash2, Star,
  Sparkles, Calculator, MapPin, ChevronRight,
  Edit2, Check, Scale
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AGENTS, getAgent } from '@/lib/agents'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Agent, Conversation } from '@/types'
import JurisClaudeLogo from '@/components/brand/JurisClaudeLogo'
import DocumentScannerModal from '@/components/citizen/DocumentScannerModal'
import CitizenCalculatorsModal from '@/components/citizen/CitizenCalculatorsModal'
import CitizenDocumentGeneratorModal, { type DocType } from '@/components/citizen/CitizenDocumentGeneratorModal'
import WhereToGoModal from '@/components/citizen/WhereToGoModal'
import UsageCounterBadge from '@/components/ui/UsageCounterBadge'
import WhatsAppSupportButton from '@/components/ui/WhatsAppSupportButton'

const SpijModal = lazy(() => import('@/components/legal/SpijModal'))

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'LABORAL', label: 'Laboral' },
  { id: 'PENAL', label: 'Penal' },
  { id: 'CIVIL', label: 'Civil' },
  { id: 'CORPORATIVO', label: 'Corporativo' },
  { id: 'MINERO', label: 'Minero' },
  { id: 'FAMILIA', label: 'Familia' },
  { id: 'TRIBUTARIO', label: 'Tributario' },
  { id: 'ADMINISTRATIVO', label: 'Administrativo' },
]

const SIDEBAR_MAIN = [
  { id: 'specialists', label: 'Especialistas', icon: Search },
  { id: 'consultations', label: 'Mis consultas', icon: MessageSquare },
  { id: 'history', label: 'Historial', icon: Clock },
  { id: 'habilidades', label: 'Guardados', icon: Star },
  { id: 'documents', label: 'Documentos', icon: FileText },
]

const SIDEBAR_SPECS = [
  { label: 'Derecho Laboral', categoryId: 'LABORAL' },
  { label: 'Derecho Penal', categoryId: 'PENAL' },
  { label: 'Derecho Civil', categoryId: 'CIVIL' },
  { label: 'Derecho Corporativo', categoryId: 'CORPORATIVO' },
  { label: 'Derecho Minero', categoryId: 'MINERO' },
  { label: 'Derecho de Familia', categoryId: 'FAMILIA' },
  { label: 'Derecho Tributario', categoryId: 'TRIBUTARIO' },
  { label: 'Derecho Administrativo', categoryId: 'ADMINISTRATIVO' },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSideItem, setActiveSideItem] = useState('specialists')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [convCount, setConvCount] = useState(0)
  const [historySearch, setHistorySearch] = useState('')
  const [consultationsSearch, setConsultationsSearch] = useState('')
  const [convTagFilter, setConvTagFilter] = useState<'all' | 'cliente' | 'expediente'>('all')
  const [editingConvId, setEditingConvId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [savedMessages, setSavedMessages] = useState<{ id: string; agentId: string; agentName: string; content: string; createdAt: string }[]>([])
  const [savedLoading, setSavedLoading] = useState(false)

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

  // Citizen Modals State
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
  const [spijModalOpen, setSpijModalOpen] = useState(false)

  const handleSpijSelect = (promptText: string, specialistId: string) => {
    setSpijModalOpen(false)
    navigate(`/chat/${specialistId}`, {
      state: { transferMessage: promptText },
    })
  }

  useEffect(() => {
    api.conversations.list()
      .then((convs) => {
        setConversations(convs)
        setConvCount(convs.length)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeSideItem !== 'habilidades') return
    setSavedLoading(true)
    api.saved.list()
      .then(setSavedMessages)
      .catch(() => {})
      .finally(() => setSavedLoading(false))
  }, [activeSideItem])

  const filteredAgents = useMemo(() => {
    return AGENTS.filter((agent) => {
      const matchCat = selectedCategory === 'all' || agent.badge === selectedCategory
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.role.toLowerCase().includes(q) ||
        agent.specialty.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [selectedCategory, searchQuery])

  const handleRipple = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const rect = btn.getBoundingClientRect()
    const ripple = document.createElement('span')
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`
    ripple.className = 'ripple'
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }, [])

  const handleSpecClick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setActiveSideItem('specialists')
  }

  const deleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.saved.delete(id)
      setSavedMessages((prev) => prev.filter((s) => s.id !== id))
    } catch {}
  }

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.conversations.delete(id)
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id)
        setConvCount(updated.length)
        return updated
      })
    } catch {}
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="flex flex-col overflow-hidden w-full max-w-full" style={{ background: '#111111', height: '100dvh', minHeight: '100vh' }}>
      {/* NAVBAR */}
      <header
        className="h-14 flex-shrink-0 flex items-center justify-between gap-1.5 sm:gap-2 px-3 sm:px-4 border-b z-40 max-w-full overflow-hidden"
        style={{ background: '#111111', borderColor: '#2a2a2a' }}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <JurisClaudeLogo size="sm" />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 justify-end flex-shrink-0">
          <UsageCounterBadge />

          <button
            onClick={() => setSpijModalOpen(true)}
            className="h-8 px-2 sm:px-3 rounded-lg flex items-center gap-1.5 transition-all text-[11px] font-medium hover:opacity-90 active:scale-95 flex-shrink-0"
            style={{
              background: 'rgba(201,168,76,0.12)',
              border: '1px solid rgba(201,168,76,0.30)',
              color: '#c9a84c',
            }}
            title="Base Legal SPIJ (MINJUSDH) y Acuerdos Plenarios Vinculantes de la Corte Suprema"
          >
            <Scale size={13} className="text-[#c9a84c]" />
            <span className="hidden sm:inline font-semibold">SPIJ & Plenos</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#34d17a] animate-pulse" />
          </button>

          <button onClick={() => navigate('/account')} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div
              className="w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-semibold"
              style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}
            >
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-normal text-white max-w-[120px] truncate leading-tight">{user?.name || 'Mi Cuenta'}</p>
              <p className="text-[7px] uppercase tracking-[2px] font-semibold" style={{ color: '#c9a84c' }}>MIEMBRO PRO</p>
            </div>
          </button>

          <div className="hidden md:block w-px h-5" style={{ background: '#2a2a2a' }} />

          <button
            onClick={() => { logout(); navigate('/login') }}
            className="hidden md:flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-light transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.70)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)' }}
          >
            Salir <ArrowRight size={11} />
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden w-full max-w-full">
        {/* SIDEBAR */}
        <aside
          className="hidden md:flex w-[220px] flex-shrink-0 flex-col overflow-y-auto border-r"
          style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
        >
          <div className="px-4 pt-5 pb-2">
            <p
              className="text-[7px] font-bold uppercase mb-3"
              style={{ letterSpacing: '3px', color: 'rgba(255,255,255,0.30)' }}
            >
              PRINCIPAL
            </p>
            <div className="space-y-1">
              {SIDEBAR_MAIN.map((item) => {
                const isActive = activeSideItem === item.id
                const Icon = item.icon
                const count = item.id === 'specialists' ? 8
                  : item.id === 'consultations' ? convCount
                  : item.id === 'habilidades' ? savedMessages.length || undefined
                  : undefined
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'documents') {
                        setDocGenModal({ isOpen: true, docType: 'carta_notarial' })
                        return
                      }
                      setActiveSideItem(item.id)
                      if (item.id === 'specialists') setSelectedCategory('all')
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-left transition-all duration-200 group relative"
                    style={{
                      background: isActive ? 'rgba(201,168,76,0.10)' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                      e.currentTarget.style.transform = 'translateX(2px)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r"
                        style={{ background: '#c9a84c' }}
                      />
                    )}
                    <Icon
                      size={13}
                      style={{ color: isActive ? '#c9a84c' : 'rgba(255,255,255,0.40)' }}
                    />
                    <span
                      className="text-[12px] flex-1"
                      style={{
                        fontWeight: isActive ? 400 : 300,
                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.60)',
                      }}
                    >
                      {item.label}
                    </span>
                    {count !== undefined && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: isActive ? 'rgba(201,168,76,0.10)' : 'rgba(255,255,255,0.07)',
                          color: isActive ? '#c9a84c' : 'rgba(255,255,255,0.40)',
                          fontWeight: 500,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-4 pt-4 pb-6">
            <p
              className="text-[7px] font-bold uppercase mb-3"
              style={{ letterSpacing: '3px', color: 'rgba(255,255,255,0.30)' }}
            >
              ESPECIALIDADES
            </p>
            <div className="space-y-1">
              {SIDEBAR_SPECS.map((spec) => {
                const isActive = activeSideItem === 'specialists' && selectedCategory === spec.categoryId
                return (
                  <button
                    key={spec.categoryId}
                    onClick={() => handleSpecClick(spec.categoryId)}
                    className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-left transition-all duration-200"
                    style={{ background: isActive ? 'rgba(201,168,76,0.08)' : 'transparent' }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
                      e.currentTarget.style.transform = 'translateX(2px)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(201,168,76,0.08)' : 'transparent'
                      e.currentTarget.style.transform = 'translateX(0)'
                    }}
                  >
                    <span
                      className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                      style={{
                        background: isActive ? '#c9a84c' : '#34d17a',
                        boxShadow: isActive ? '0 0 6px rgba(201,168,76,0.6)' : '0 0 4px rgba(52,209,122,0.4)',
                      }}
                    />
                    <span
                      className="text-[12px] flex-1 truncate"
                      style={{
                        fontWeight: isActive ? 500 : 300,
                        color: isActive ? '#c9a84c' : 'rgba(255,255,255,0.70)',
                      }}
                    >
                      {spec.label}
                    </span>
                    <span
                      className="text-[8px] font-semibold uppercase px-1.5 py-0.5 rounded tracking-wider flex-shrink-0"
                      style={{
                        background: isActive ? 'rgba(201,168,76,0.15)' : 'rgba(52,209,122,0.10)',
                        color: isActive ? '#c9a84c' : '#34d17a',
                      }}
                    >
                      {isActive ? 'ACTIVO' : 'EN LÍNEA'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {user?.isAdmin && (
            <div className="px-4 pt-4">
              <button
                onClick={() => navigate('/portal-interno')}
                className="w-full flex items-center gap-2.5 px-3 py-[9px] rounded-lg text-left transition-all duration-200"
                style={{
                  background: 'rgba(201,168,76,0.08)',
                  border: '1px solid rgba(201,168,76,0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(201,168,76,0.15)'
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.30)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(201,168,76,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(201,168,76,0.15)'
                }}
              >
                <Shield size={14} style={{ color: '#c9a84c' }} />
                <span className="text-[11px] font-medium" style={{ color: '#c9a84c' }}>
                  Panel Admin
                </span>
              </button>
            </div>
          )}

          <div className="mt-auto px-4 py-4 border-t" style={{ borderColor: '#2a2a2a' }}>
            <p className="text-[10px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)', letterSpacing: '1px' }}>
              Hardman · Perú
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full px-3.5 sm:px-6 md:px-8 py-3.5 sm:py-4 md:py-6 pb-28 md:pb-8" style={{ overscrollBehavior: 'contain' }}>
          <AnimatePresence mode="wait">
            {activeSideItem === 'specialists' && (
              <motion.div
                key="specialists"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Citizen Hero & Problem Navigator */}
                <div className="mb-8 space-y-4">
                  <div className="p-5 sm:p-6 rounded-2xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(20,20,20,0.95) 70%)', border: '1px solid rgba(201,168,76,0.25)' }}>
                    <div className="max-w-2xl">
                      <span className="text-[9px] uppercase font-bold text-[#c9a84c] tracking-widest block mb-2">
                        PLATAFORMA LEGAL INTELIGENTE · PERÚ 2026
                      </span>
                      <h1 className="text-xl sm:text-2xl font-light text-white tracking-wide mb-2">
                        Hola {user?.name ? user.name.split(' ')[0] : ''}, ¿en qué consulta legal necesitas asistencia?
                      </h1>
                      <p className="text-[12px] text-white/70 font-light leading-relaxed mb-4">
                        Especialistas en 8 ramas del derecho, análisis normativo actualizado y documentos oficiales listos para usar.
                      </p>

                      {/* Quick Action Buttons Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                        <button
                          onClick={() => setDocGenModal({ isOpen: true, docType: 'carta_notarial' })}
                          className="flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-medium text-white transition-all bg-[#1a1a1a] hover:bg-white/10 border border-white/15"
                        >
                          <FileText size={15} className="text-[#c9a84c] flex-shrink-0" />
                          <span className="text-[11px] leading-tight text-left">Generar Documentos</span>
                        </button>
                        <button
                          onClick={() => setScannerOpen(true)}
                          className="flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-medium text-white transition-all bg-[#1a1a1a] hover:bg-white/10 border border-white/15"
                        >
                          <Sparkles size={15} className="text-[#c9a84c] flex-shrink-0" />
                          <span className="text-[11px] leading-tight text-left">Escanear Cédula/PDF</span>
                        </button>
                        <button
                          onClick={() => setCalcModal({ isOpen: true, tab: 'liquidacion' })}
                          className="flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-medium text-white transition-all bg-[#1a1a1a] hover:bg-white/10 border border-white/15"
                        >
                          <Calculator size={15} className="text-[#34d17a] flex-shrink-0" />
                          <span className="text-[11px] leading-tight text-left">Calculadoras S/</span>
                        </button>
                        <button
                          onClick={() => setWhereToGoOpen(true)}
                          className="flex items-center gap-2 p-2.5 rounded-xl text-[11px] font-medium text-white transition-all bg-[#1a1a1a] hover:bg-white/10 border border-white/15"
                        >
                          <MapPin size={15} className="text-[#f59e0b] flex-shrink-0" />
                          <span className="text-[11px] leading-tight text-left">A Dónde Acudir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 pt-2 border-t border-white/5">
                  <h2
                    className="text-[11px] font-bold uppercase"
                    style={{ letterSpacing: '3px', color: 'rgba(255,255,255,0.40)' }}
                  >
                    NUESTROS ESPECIALISTAS
                  </h2>
                  <div className="hidden sm:flex items-center gap-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    <span className="w-[7px] h-[7px] rounded-full dot-online" style={{ background: '#34d17a' }} />
                    <span className="font-light">8 en línea · Respuesta inmediata</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={(e) => {
                          setSelectedCategory(cat.id)
                          handleRipple(e)
                        }}
                        className="flex-shrink-0 whitespace-nowrap min-w-max px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-200"
                        style={{
                          background: isActive ? 'rgba(201,168,76,0.15)' : '#222222',
                          border: `1px solid ${isActive ? '#c9a84c' : '#333333'}`,
                          color: isActive ? '#c9a84c' : 'rgba(255,255,255,0.60)',
                          boxShadow: isActive ? '0 0 14px rgba(201,168,76,0.15)' : 'none',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) e.currentTarget.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)'
                        }}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>

                {filteredAgents.length === 0 ? (
                  <div
                    className="text-center py-16 rounded-xl max-w-md mx-auto p-8"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                  >
                    <h3 className="text-sm font-light text-white mb-1">No se encontraron especialistas</h3>
                    <p className="text-[11px] font-light mb-4" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      Intenta con otro término o selecciona otra materia.
                    </p>
                    <button
                      onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                      className="px-4 py-2 rounded-lg text-[11px] font-medium transition-all"
                      style={{ border: '1px solid #333333', color: '#c9a84c', background: 'rgba(201,168,76,0.10)' }}
                    >
                      Ver todos
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {filteredAgents.map((agent, i) => (
                      <AgentCard key={agent.id} agent={agent} index={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeSideItem === 'consultations' && (
              <motion.div
                key="consultations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-bold uppercase" style={{ letterSpacing: '3.5px', color: 'rgba(255,255,255,0.30)' }}>
                    MIS CONSULTAS
                  </h2>
                  <span className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    {conversations.length} consulta{conversations.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {conversations.length > 0 && (
                  <div className="relative mb-4">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.30)' }} />
                    <input
                      type="text"
                      value={consultationsSearch}
                      onChange={(e) => setConsultationsSearch(e.target.value)}
                      placeholder="Buscar consulta (ej: Cliente Pérez, Exp. 042-2026)..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg text-[11px] font-light outline-none"
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ffffff', caretColor: '#c9a84c' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.40)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a' }}
                    />
                    {consultationsSearch && (
                      <button onClick={() => setConsultationsSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )}

                {conversations.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                    <button
                      onClick={() => setConvTagFilter('all')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                        convTagFilter === 'all'
                          ? 'bg-[#c9a84c] text-black font-semibold'
                          : 'bg-[#181818] text-white/50 hover:text-white border border-white/10'
                      }`}
                    >
                      Todos ({conversations.length})
                    </button>
                    <button
                      onClick={() => setConvTagFilter('cliente')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                        convTagFilter === 'cliente'
                          ? 'bg-[#c9a84c] text-black font-semibold'
                          : 'bg-[#181818] text-white/50 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>👤 Clientes</span>
                      <span className="text-[9px] opacity-70">
                        ({conversations.filter(c => c.title.toLowerCase().includes('cliente')).length})
                      </span>
                    </button>
                    <button
                      onClick={() => setConvTagFilter('expediente')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                        convTagFilter === 'expediente'
                          ? 'bg-[#c9a84c] text-black font-semibold'
                          : 'bg-[#181818] text-white/50 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>📂 Expedientes</span>
                      <span className="text-[9px] opacity-70">
                        ({conversations.filter(c => c.title.toLowerCase().includes('exp') || c.title.toLowerCase().includes('carpeta')).length})
                      </span>
                    </button>
                  </div>
                )}

                {conversations.length === 0 ? (
                  <div className="text-center py-16 rounded-xl max-w-md mx-auto p-8" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#222222', border: '1px solid #2a2a2a' }}>
                      <MessageSquare size={20} style={{ color: 'rgba(255,255,255,0.30)' }} />
                    </div>
                    <h3 className="text-sm font-light text-white mb-1">Sin consultas aún</h3>
                    <p className="text-[11px] font-light mb-4" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      Selecciona un especialista para iniciar tu primera consulta.
                    </p>
                    <button
                      onClick={() => setActiveSideItem('specialists')}
                      className="px-4 py-2 rounded-lg text-[11px] font-medium transition-all"
                      style={{ border: '1px solid #333333', color: '#c9a84c', background: 'rgba(201,168,76,0.10)' }}
                    >
                      Ver especialistas
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversations
                      .filter((c) => {
                        const matchSearch = !consultationsSearch || c.title?.toLowerCase().includes(consultationsSearch.toLowerCase()) || getAgent(c.agentId)?.name.toLowerCase().includes(consultationsSearch.toLowerCase())
                        const matchTag = convTagFilter === 'all'
                          || (convTagFilter === 'cliente' && c.title?.toLowerCase().includes('cliente'))
                          || (convTagFilter === 'expediente' && (c.title?.toLowerCase().includes('exp') || c.title?.toLowerCase().includes('carpeta')))
                        return matchSearch && matchTag
                      })
                      .map((conv) => {
                      const agent = getAgent(conv.agentId)
                      return (
                        <div
                          key={conv.id}
                          onClick={() => navigate(`/chat/${conv.agentId}?conv=${conv.id}`)}
                          className="group flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200"
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'
                            e.currentTarget.style.transform = 'translateY(-1px)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#2a2a2a'
                            e.currentTarget.style.transform = 'translateY(0)'
                          }}
                        >
                          {agent && (
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1.5px solid rgba(201,168,76,0.25)' }}>
                              <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            {editingConvId === conv.id ? (
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename(conv.id, e)
                                    if (e.key === 'Escape') setEditingConvId(null)
                                  }}
                                  autoFocus
                                  className="px-2 py-1 rounded bg-[#222] border border-[#c9a84c] text-white text-xs w-full focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleSaveRename(conv.id, e)}
                                  className="p-1 rounded bg-[#c9a84c] text-black hover:bg-[#dfbc5e]"
                                  title="Guardar"
                                >
                                  <Check size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setEditingConvId(null) }}
                                  className="p-1 rounded text-white/50 hover:text-white"
                                  title="Cancelar"
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 group/title">
                                <p className="text-[13px] font-normal text-white truncate">{conv.title}</p>
                                <button
                                  onClick={(e) => handleStartRename(conv, e)}
                                  className="opacity-0 group-hover:opacity-100 hover:text-[#c9a84c] text-white/40 p-1 rounded transition-opacity"
                                  title="Renombrar (ej: Cliente Pérez / Exp. 042-2026)"
                                >
                                  <Edit2 size={12} />
                                </button>
                              </div>
                            )}
                            <p className="text-[10px] font-light mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                              {agent?.name} · {agent?.role} · {formatDate(conv.updatedAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className="px-2 py-0.5 rounded text-[8px] font-bold uppercase"
                              style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.20)', color: '#c9a84c', letterSpacing: '1px' }}
                            >
                              {agent?.badge}
                            </span>
                            <button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                              style={{ color: 'rgba(255,255,255,0.30)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6464'; e.currentTarget.style.background = 'rgba(255,100,100,0.10)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; e.currentTarget.style.background = 'transparent' }}
                            >
                              <Trash2 size={13} />
                            </button>
                            <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.20)' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeSideItem === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[11px] font-bold uppercase" style={{ letterSpacing: '3.5px', color: 'rgba(255,255,255,0.30)' }}>
                    HISTORIAL DE ACTIVIDAD
                  </h2>
                  <span className="text-[10px] font-light" style={{ color: 'rgba(255,255,255,0.30)' }}>
                    {conversations.length} registros
                  </span>
                </div>

                {conversations.length > 0 && (
                  <div className="relative mb-4">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.30)' }} />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Buscar en historial (cliente, expediente, especialista)..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg text-[11px] font-light outline-none"
                      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ffffff', caretColor: '#c9a84c' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.40)' }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#2a2a2a' }}
                    />
                    {historySearch && (
                      <button onClick={() => setHistorySearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        <X size={11} />
                      </button>
                    )}
                  </div>
                )}

                {conversations.length > 0 && (
                  <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                    <button
                      onClick={() => setConvTagFilter('all')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all ${
                        convTagFilter === 'all'
                          ? 'bg-[#c9a84c] text-black font-semibold'
                          : 'bg-[#181818] text-white/50 hover:text-white border border-white/10'
                      }`}
                    >
                      Todos ({conversations.length})
                    </button>
                    <button
                      onClick={() => setConvTagFilter('cliente')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                        convTagFilter === 'cliente'
                          ? 'bg-[#c9a84c] text-black font-semibold'
                          : 'bg-[#181818] text-white/50 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>👤 Por Clientes</span>
                      <span className="text-[9px] opacity-70">
                        ({conversations.filter(c => c.title.toLowerCase().includes('cliente')).length})
                      </span>
                    </button>
                    <button
                      onClick={() => setConvTagFilter('expediente')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition-all flex items-center gap-1 ${
                        convTagFilter === 'expediente'
                          ? 'bg-[#c9a84c] text-black font-semibold'
                          : 'bg-[#181818] text-white/50 hover:text-white border border-white/10'
                      }`}
                    >
                      <span>📂 Por Expedientes</span>
                      <span className="text-[9px] opacity-70">
                        ({conversations.filter(c => c.title.toLowerCase().includes('exp') || c.title.toLowerCase().includes('carpeta')).length})
                      </span>
                    </button>
                  </div>
                )}

                {conversations.length === 0 ? (
                  <div className="text-center py-16 rounded-xl max-w-md mx-auto p-8" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#222222', border: '1px solid #2a2a2a' }}>
                      <Clock size={20} style={{ color: 'rgba(255,255,255,0.30)' }} />
                    </div>
                    <h3 className="text-sm font-light text-white mb-1">Sin actividad reciente</h3>
                    <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      Tu historial de consultas aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {[...conversations]
                      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                      .filter((c) => {
                        const matchSearch = !historySearch || c.title?.toLowerCase().includes(historySearch.toLowerCase()) || getAgent(c.agentId)?.name.toLowerCase().includes(historySearch.toLowerCase())
                        const matchTag = convTagFilter === 'all'
                          || (convTagFilter === 'cliente' && c.title?.toLowerCase().includes('cliente'))
                          || (convTagFilter === 'expediente' && (c.title?.toLowerCase().includes('exp') || c.title?.toLowerCase().includes('carpeta')))
                        return matchSearch && matchTag
                      })
                      .map((conv) => {
                        const agent = getAgent(conv.agentId)
                        return (
                          <div
                            key={conv.id}
                            onClick={() => navigate(`/chat/${conv.agentId}?conv=${conv.id}`)}
                            className="group flex items-start gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 border border-white/5 bg-[#171717] hover:bg-[#1f1f1f] hover:border-[#c9a84c]/30"
                          >
                            {agent && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-0.5" style={{ border: '1px solid rgba(201,168,76,0.30)' }}>
                                <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded tracking-wider"
                                  style={{
                                    background: 'rgba(201,168,76,0.12)',
                                    color: '#c9a84c',
                                    border: '1px solid rgba(201,168,76,0.25)',
                                  }}
                                >
                                  {agent?.badge || 'CONSULTA'}
                                </span>
                                <span className="text-[10px] font-medium text-white/70">
                                  {agent?.name} · {agent?.role}
                                </span>
                                <span className="text-[9px] font-light text-white/30 ml-auto">
                                  {formatDate(conv.updatedAt)}
                                </span>
                              </div>
                              {editingConvId === conv.id ? (
                                <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveRename(conv.id, e)
                                      if (e.key === 'Escape') setEditingConvId(null)
                                    }}
                                    autoFocus
                                    className="px-2 py-1 rounded bg-[#222] border border-[#c9a84c] text-white text-xs w-full focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => handleSaveRename(conv.id, e)}
                                    className="p-1 rounded bg-[#c9a84c] text-black hover:bg-[#dfbc5e]"
                                    title="Guardar"
                                  >
                                    <Check size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setEditingConvId(null) }}
                                    className="p-1 rounded text-white/50 hover:text-white"
                                    title="Cancelar"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 group/title">
                                  <p className="text-[12px] font-light text-white line-clamp-2 leading-relaxed" title={conv.title}>
                                    {conv.title}
                                  </p>
                                  <button
                                    onClick={(e) => handleStartRename(conv, e)}
                                    className="opacity-0 group-hover:opacity-100 hover:text-[#c9a84c] text-white/40 p-1 rounded transition-opacity"
                                    title="Renombrar (ej: Cliente Pérez / Exp. 042-2026)"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={(e) => deleteConversation(conv.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                                style={{ color: 'rgba(255,255,255,0.30)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6464'; e.currentTarget.style.background = 'rgba(255,100,100,0.10)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; e.currentTarget.style.background = 'transparent' }}
                              >
                                <Trash2 size={13} />
                              </button>
                              <ArrowRight size={14} className="text-white/20 flex-shrink-0" />
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </motion.div>
            )}

            {activeSideItem === 'habilidades' && (
              <motion.div
                key="habilidades"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-[11px] font-bold uppercase" style={{ letterSpacing: '3.5px', color: 'rgba(255,255,255,0.30)' }}>
                      HABILIDADES / GUARDADOS
                    </h2>
                    <p className="text-[10px] font-light mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      Respuestas clave guardadas con ★
                    </p>
                  </div>
                  <span className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    {savedMessages.length} guardado{savedMessages.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {savedLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
                  </div>
                ) : savedMessages.length === 0 ? (
                  <div className="text-center py-16 rounded-xl max-w-md mx-auto p-8" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.20)' }}>
                      <Star size={20} style={{ color: '#c9a84c' }} />
                    </div>
                    <h3 className="text-sm font-light text-white mb-1">Sin respuestas guardadas</h3>
                    <p className="text-[11px] font-light mb-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.40)' }}>
                      En el chat, usa el botón ★ para guardar respuestas clave de los especialistas. Aparecerán aquí para referencia rápida.
                    </p>
                    <button
                      onClick={() => setActiveSideItem('specialists')}
                      className="px-4 py-2 rounded-lg text-[11px] font-medium transition-all"
                      style={{ border: '1px solid #333333', color: '#c9a84c', background: 'rgba(201,168,76,0.10)' }}
                    >
                      Ir a Especialistas
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedMessages.map((saved) => {
                      const agent = getAgent(saved.agentId)
                      const preview = saved.content.length > 280 ? saved.content.slice(0, 277) + '...' : saved.content
                      return (
                        <div
                          key={saved.id}
                          className="group p-4 rounded-xl transition-all duration-200"
                          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.20)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2a2a2a' }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              {agent && (
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(201,168,76,0.20)' }}>
                                  <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
                                </div>
                              )}
                              <div>
                                <p className="text-[11px] font-medium text-white">{saved.agentName}</p>
                                <p className="text-[9px] font-light" style={{ color: 'rgba(255,255,255,0.30)' }}>
                                  {new Date(saved.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => navigate(`/chat/${saved.agentId}`)}
                                className="px-2.5 py-1 rounded-lg text-[9px] font-medium transition-all"
                                style={{ border: '1px solid rgba(201,168,76,0.20)', color: '#c9a84c', background: 'rgba(201,168,76,0.08)' }}
                              >
                                Abrir
                              </button>
                              <button
                                onClick={(e) => deleteSaved(saved.id, e)}
                                className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                style={{ color: 'rgba(255,255,255,0.30)' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6464'; e.currentTarget.style.background = 'rgba(255,100,100,0.10)' }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; e.currentTarget.style.background = 'transparent' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)', whiteSpace: 'pre-wrap' }}>
                            {preview}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeSideItem === 'documents' && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-[11px] font-bold uppercase" style={{ letterSpacing: '3.5px', color: 'rgba(255,255,255,0.30)' }}>
                    DOCUMENTOS
                  </h2>
                </div>

                <div className="text-center py-16 rounded-xl max-w-lg mx-auto p-8" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.20)' }}>
                    <FileText size={24} style={{ color: '#c9a84c' }} />
                  </div>
                  <h3 className="text-sm font-light text-white mb-2">Análisis de Documentos</h3>
                  <p className="text-[11px] font-light mb-5 leading-relaxed max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    Sube archivos PDF, Word o imágenes directamente en el chat con cualquier especialista para obtener análisis legal detallado.
                  </p>
                  <button
                    onClick={() => setActiveSideItem('specialists')}
                    className="px-5 py-2.5 rounded-lg text-[10px] font-semibold uppercase transition-all"
                    style={{ letterSpacing: '2px', border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.10)', color: '#c9a84c' }}
                  >
                    Ir a Especialistas
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Single Unified Mobile bottom navigation ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 border-t flex items-center justify-around px-2 backdrop-blur-xl"
        style={{
          background: 'rgba(18, 18, 18, 0.95)',
          borderColor: '#282828',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -8px 24px rgba(0,0,0,0.60)',
        }}
      >
        <button
          onClick={() => {
            setActiveSideItem('specialists')
            setSelectedCategory('all')
          }}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors"
          style={{
            color: activeSideItem === 'specialists' ? '#c9a84c' : 'rgba(255,255,255,0.40)',
          }}
        >
          <Search size={18} strokeWidth={activeSideItem === 'specialists' ? 2.2 : 1.5} />
          <span className="text-[9px] font-medium">Inicio</span>
        </button>

        <button
          onClick={() => setActiveSideItem('consultations')}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors relative"
          style={{
            color: activeSideItem === 'consultations' ? '#c9a84c' : 'rgba(255,255,255,0.40)',
          }}
        >
          <MessageSquare size={18} strokeWidth={activeSideItem === 'consultations' ? 2.2 : 1.5} />
          <span className="text-[9px] font-medium">Consultas</span>
          {convCount > 0 && (
            <span
              className="absolute top-0 right-3 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center shadow"
              style={{ background: '#c9a84c', color: '#111' }}
            >
              {convCount}
            </span>
          )}
        </button>

        {/* Central Prominent Action Button: Generar Documentos */}
        <button
          onClick={() => setDocGenModal({ isOpen: true, docType: 'carta_notarial' })}
          className="flex flex-col items-center justify-center gap-1 flex-1 -mt-4 transition-transform active:scale-95"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-all"
            style={{
              background: 'linear-gradient(135deg, #e2be64 0%, #c9a84c 100%)',
              color: '#111',
              borderColor: '#f5d98a',
              boxShadow: '0 4px 20px rgba(201,168,76,0.45)',
            }}
          >
            <FileText size={20} strokeWidth={2.2} />
          </div>
          <span className="text-[9px] font-bold text-[#c9a84c]">Documentos</span>
        </button>

        <button
          onClick={() => setCalcModal({ isOpen: true, tab: 'liquidacion' })}
          className="flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          <Calculator size={18} strokeWidth={1.5} />
          <span className="text-[9px] font-medium">Cálculos</span>
        </button>

        {user?.isAdmin ? (
          <button
            onClick={() => navigate('/portal-interno')}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors"
            style={{ color: 'rgba(201,168,76,0.70)' }}
          >
            <Shield size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-medium">Admin</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/account')}
            className="flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
              style={{
                background: 'rgba(201,168,76,0.15)',
                border: '1px solid rgba(201,168,76,0.35)',
                color: '#c9a84c',
              }}
            >
              {initials}
            </div>
            <span className="text-[9px] font-medium">Cuenta</span>
          </button>
        )}
      </nav>

      {/* Citizen Modals */}
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
            onSelectPromptAndAgent={handleSpijSelect}
          />
        )}
      </Suspense>

      <WhatsAppSupportButton />
    </div>
  )
}

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  // Color coding per specialty area
  const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    LABORAL: { bg: 'rgba(99,102,241,0.15)', text: '#a5b4fc', border: 'rgba(99,102,241,0.30)' },
    PENAL: { bg: 'rgba(239,68,68,0.15)', text: '#fca5a5', border: 'rgba(239,68,68,0.30)' },
    CIVIL: { bg: 'rgba(6,182,212,0.15)', text: '#67e8f9', border: 'rgba(6,182,212,0.30)' },
    CORPORATIVO: { bg: 'rgba(139,92,246,0.15)', text: '#c4b5fd', border: 'rgba(139,92,246,0.30)' },
    MINERO: { bg: 'rgba(245,158,11,0.15)', text: '#fcd34d', border: 'rgba(245,158,11,0.30)' },
    FAMILIA: { bg: 'rgba(236,72,153,0.15)', text: '#f9a8d4', border: 'rgba(236,72,153,0.30)' },
    TRIBUTARIO: { bg: 'rgba(16,185,129,0.15)', text: '#6ee7b7', border: 'rgba(16,185,129,0.30)' },
    ADMINISTRATIVO: { bg: 'rgba(13,148,136,0.15)', text: '#5eead4', border: 'rgba(13,148,136,0.30)' },
  }
  const badgeColor = BADGE_COLORS[agent.badge] || { bg: 'rgba(201,168,76,0.15)', text: '#c9a84c', border: 'rgba(201,168,76,0.30)' }

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -6, y: x * 6 })
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setTilt({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(`/chat/${agent.id}`)}
      className="group cursor-pointer rounded-[16px] overflow-hidden flex flex-col transition-all duration-300"
      style={{
        background: isHovered ? '#1e1e1e' : '#1a1a1a',
        border: `1px solid ${isHovered ? 'rgba(201,168,76,0.30)' : '#2a2a2a'}`,
        transform: isHovered
          ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px) scale(1.02)`
          : 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)',
        boxShadow: isHovered ? '0 24px 60px rgba(0,0,0,0.60), 0 0 0 1px rgba(201,168,76,0.10)' : 'none',
        willChange: 'transform',
      }}
    >
      {/* Photo area */}
      <div className="relative overflow-hidden w-full aspect-[4/3] sm:aspect-[3/4] sm:max-h-[300px]">
        <img
          src={agent.image}
          alt={agent.name}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          style={{ objectPosition: 'top center' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(17,17,17,0.70) 0%, rgba(17,17,17,0.10) 50%, transparent 100%)' }} />

        {/* Specialty badge — color coded */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[7px] font-bold uppercase"
          style={{ letterSpacing: '1.5px', color: badgeColor.text, background: badgeColor.bg, border: `1px solid ${badgeColor.border}`, backdropFilter: 'blur(10px)' }}
        >
          {agent.badge}
        </div>

        {/* Online indicator */}
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-medium"
          style={{ background: 'rgba(17,17,17,0.88)', backdropFilter: 'blur(10px)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <span className="w-[6px] h-[6px] rounded-full dot-online" style={{ background: '#34d17a' }} />
          EN LÍNEA
        </div>

        {/* Hover CTA overlay */}
        <div
          className="absolute inset-0 flex items-end justify-center pb-4 transition-opacity duration-300"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <div
            className="px-5 py-2 rounded-full text-[11px] font-semibold flex items-center gap-2"
            style={{ background: '#c9a84c', color: '#111111', boxShadow: '0 4px 20px rgba(201,168,76,0.40)' }}
          >
            Consultar ahora <ArrowRight size={13} />
          </div>
        </div>
      </div>

      {/* Info area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-[17px] font-normal text-white leading-tight">{agent.name}</h3>
              <p className="text-[10px] font-semibold tracking-wider uppercase mt-1" style={{ color: badgeColor.text }}>
                {agent.role}
              </p>
            </div>
          </div>
          <p className="text-[11px] font-light leading-relaxed mt-2 line-clamp-2 text-white/60">
            {agent.description}
          </p>
        </div>

        {/* Specialty pills */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {(agent.specialty || '').split(',').slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="text-[9px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/50 border border-white/10"
            >
              {s.trim()}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
