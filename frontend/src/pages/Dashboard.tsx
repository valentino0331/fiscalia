import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Search, X, Shield, MessageSquare, Clock, FileText, Trash2, Star,
  Sparkles, Calculator, MapPin, ChevronRight,
  Edit2, Check, Scale, Plus, ArrowUp, Zap, Users, Menu
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { AGENTS, getAgent } from '@/lib/agents'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Agent, Conversation } from '@/types'
import HardmanLogo from '@/components/brand/HardmanLogo'
import DocumentScannerModal from '@/components/citizen/DocumentScannerModal'
import CitizenCalculatorsModal from '@/components/citizen/CitizenCalculatorsModal'
import CitizenDocumentGeneratorModal, { type DocType } from '@/components/citizen/CitizenDocumentGeneratorModal'
import WhereToGoModal from '@/components/citizen/WhereToGoModal'
import UsageCounterBadge from '@/components/ui/UsageCounterBadge'
import UpgradeModal from '@/components/ui/UpgradeModal'

const SpijModal = lazy(() => import('@/components/legal/SpijModal'))

export interface LawyerPanelItem {
  id: string
  title: string
  subtitle: string
  description: string
  ctaText: string
  tag: string
  tagColor: { text: string; border: string; bg: string }
  isSilhouette?: boolean
  silhouetteColor?: { bg: string; fill: string }
}

export const LAWYER_PANEL_DATA: LawyerPanelItem[] = [
  {
    id: 'valentina',
    title: 'Valentina',
    subtitle: 'DERECHO LABORAL',
    description: 'Despidos arbitrarios y nulos, beneficios sociales y defensa del trabajador.',
    ctaText: 'Despidos y contratos',
    tag: 'LABORAL',
    tagColor: { text: '#a5b4fc', border: 'rgba(99,102,241,0.35)', bg: 'rgba(99,102,241,0.12)' },
  },
  {
    id: 'sebastian',
    title: 'Sebastián',
    subtitle: 'DERECHO PENAL',
    description: 'Defensa técnica bajo el NCPP, prisión preventiva, cesación y tutela de derechos.',
    ctaText: 'Defensa penal',
    tag: 'PENAL',
    tagColor: { text: '#fca5a5', border: 'rgba(239,68,68,0.35)', bg: 'rgba(239,68,68,0.12)' },
  },
  {
    id: 'diego',
    title: 'Diego',
    subtitle: 'DERECHO CIVIL',
    description: 'Contratos patrimoniales, desalojo express (Ley 30933), derechos reales y garantías.',
    ctaText: 'Contratos e inmuebles',
    tag: 'CIVIL',
    tagColor: { text: '#67e8f9', border: 'rgba(6,182,212,0.35)', bg: 'rgba(6,182,212,0.12)' },
  },
  {
    id: 'adriana',
    title: 'Adriana',
    subtitle: 'CORPORATIVO Y SOCIETARIO',
    description: 'Estructuración societaria (LGS), M&A, contratos y compliance anticorrupción.',
    ctaText: 'M&A y compliance',
    tag: 'CORPORATIVO',
    tagColor: { text: '#c4b5fd', border: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.12)' },
  },
  {
    id: 'rodrigo',
    title: 'Derecho minero',
    subtitle: 'ESPECIALISTA',
    description: 'Concesiones y petitorios mineros, servidumbres, pequeña minería y fiscalización ambiental.',
    ctaText: 'Concesiones y formalización',
    tag: 'MINERO',
    tagColor: { text: '#fcd34d', border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.12)' },
    isSilhouette: true,
    silhouetteColor: {
      bg: 'radial-gradient(circle at 50% 60%, rgba(245,158,11,0.22) 0%, rgba(18,17,14,0.98) 75%)',
      fill: 'rgba(217,160,65,0.45)',
    },
  },
  {
    id: 'camila',
    title: 'Derecho de familia',
    subtitle: 'ESPECIALISTA',
    description: 'Alimentos, tenencia y régimen de visitas, divorcio, patria potestad y violencia familiar.',
    ctaText: 'Alimentos y familia',
    tag: 'FAMILIA',
    tagColor: { text: '#f9a8d4', border: 'rgba(236,72,153,0.35)', bg: 'rgba(236,72,153,0.12)' },
    isSilhouette: true,
    silhouetteColor: {
      bg: 'radial-gradient(circle at 50% 60%, rgba(236,72,153,0.22) 0%, rgba(22,14,20,0.98) 75%)',
      fill: 'rgba(215,115,165,0.45)',
    },
  },
  {
    id: 'fernanda',
    title: 'Derecho tributario',
    subtitle: 'ESPECIALISTA',
    description: 'Fiscalización SUNAT, reclamaciones, fraccionamiento de deudas, IGV y Renta.',
    ctaText: 'SUNAT y tributos',
    tag: 'TRIBUTARIO',
    tagColor: { text: '#6ee7b7', border: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.12)' },
    isSilhouette: true,
    silhouetteColor: {
      bg: 'radial-gradient(circle at 50% 60%, rgba(16,185,129,0.22) 0%, rgba(12,22,18,0.98) 75%)',
      fill: 'rgba(90,180,140,0.45)',
    },
  },
  {
    id: 'marco',
    title: 'Derecho administrativo',
    subtitle: 'ESPECIALISTA',
    description: 'Procedimiento administrativo, recursos impugnativos, contrataciones con el Estado y responsabilidad funcional.',
    ctaText: 'Procedimiento y Estado',
    tag: 'ADMINISTRATIVO',
    tagColor: { text: '#5eead4', border: 'rgba(13,148,136,0.35)', bg: 'rgba(13,148,136,0.12)' },
    isSilhouette: true,
    silhouetteColor: {
      bg: 'radial-gradient(circle at 50% 60%, rgba(59,130,246,0.22) 0%, rgba(14,18,26,0.98) 75%)',
      fill: 'rgba(100,145,200,0.45)',
    },
  },
]

export const CANONICAL_RECENT_QUERIES = [
  { id: 'rec-1', title: 'Cálculo de CTS y vacaciones tru...', agentId: 'valentina' },
  { id: 'rec-2', title: 'Prisión preventiva: plazo y cesac...', agentId: 'sebastian' },
  { id: 'rec-3', title: 'Desalojo express · Ley 30933', agentId: 'diego' },
  { id: 'rec-4', title: 'Constitución de S.A.C. paso a pa...', agentId: 'adriana' },
  { id: 'rec-5', title: 'Liquidación de pensión de alime...', agentId: 'camila' },
]

const SIDEBAR_MAIN = [
  { id: 'specialists', label: 'Especialistas', icon: Users },
  { id: 'consultations', label: 'Mis consultas', icon: MessageSquare },
  { id: 'history', label: 'Historial', icon: Clock },
  { id: 'habilidades', label: 'Guardados', icon: Star },
  { id: 'documents', label: 'Documentos', icon: FileText },
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
  const [userPlan, setUserPlan] = useState<'junior' | 'senior' | 'demo'>('junior')
  const [demoUsage, setDemoUsage] = useState<{ questionsUsed: number; limit: number } | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  useEffect(() => {
    api.account.usage()
      .then((data) => {
        if (data.plan === 'demo' || (data as any).isDemo || user?.isDemo) {
          setUserPlan('demo')
          setDemoUsage({ questionsUsed: data.questionsUsed, limit: data.limit || 1 })
        } else if (data.plan === 'senior' || data.plan === 'pro' || data.limit === null) {
          setUserPlan('senior')
        } else {
          setUserPlan('junior')
        }
      })
      .catch(() => {})
  }, [user])

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

  const [promptCase, setPromptCase] = useState('')
  const [plusMenuOpen, setPlusMenuOpen] = useState(false)
  const plusMenuRef = useRef<HTMLDivElement>(null)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target as Node)) {
        setPlusMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleStartPrompt = (targetAgentId?: string) => {
    const text = promptCase.trim()
    if (!text) return
    let agentId = targetAgentId || 'diego'
    const lower = text.toLowerCase()
    if (lower.includes('despido') || lower.includes('trabajador') || lower.includes('cts') || lower.includes('laboral') || lower.includes('sunafil')) {
      agentId = 'valentina'
    } else if (lower.includes('penal') || lower.includes('prisión') || lower.includes('fiscalía') || lower.includes('delito') || lower.includes('ncpp')) {
      agentId = 'sebastian'
    } else if (lower.includes('empresa') || lower.includes('sac') || lower.includes('societario') || lower.includes('compliance') || lower.includes('fusión')) {
      agentId = 'adriana'
    } else if (lower.includes('mina') || lower.includes('minero') || lower.includes('ingemmet') || lower.includes('oefa') || lower.includes('reinfo')) {
      agentId = 'rodrigo'
    } else if (lower.includes('alimento') || lower.includes('tenencia') || lower.includes('divorcio') || lower.includes('familia')) {
      agentId = 'camila'
    } else if (lower.includes('sunat') || lower.includes('tributo') || lower.includes('renta') || lower.includes('igv') || lower.includes('fiscalización')) {
      agentId = 'fernanda'
    } else if (lower.includes('administrativo') || lower.includes('oece') || lower.includes('osce') || lower.includes('apelación')) {
      agentId = 'marco'
    }
    navigate(`/chat/${agentId}`, { state: { transferMessage: text } })
  }

  const handleNewConsulta = () => {
    setActiveSideItem('specialists')
    setPromptCase('')
    const el = document.getElementById('dashboard-case-textarea')
    if (el) el.focus()
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AP'

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white" style={{ background: '#0a0a0c' }}>
      {/* MOBILE BACKDROP */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-30 w-[230px] flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 border-r ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0d0e12', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        {/* LOGO */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex flex-col">
            <span className="font-extrabold tracking-[0.22em] text-[15px] text-white">HARDMAN</span>
            <span className="w-8 h-[2px] bg-[#c9a84c] mt-0.5 rounded-full" />
          </div>
        </div>

        {/* NUEVA CONSULTA BUTTON */}
        <div className="px-4 mb-4">
          <button
            onClick={() => {
              handleNewConsulta()
              setMobileSidebarOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all text-white/90 hover:text-white"
            style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid rgba(201,168,76,0.28)',
            }}
          >
            <Plus size={14} className="text-[#c9a84c]" />
            <span>Nueva consulta</span>
          </button>
        </div>

        {/* SECCIÓN PRINCIPAL */}
        <div className="px-4 pb-2">
          <p className="text-[8px] font-bold uppercase mb-2 tracking-[2px] text-white/30">
            PRINCIPAL
          </p>
          <div className="space-y-0.5">
            {SIDEBAR_MAIN.map((item) => {
              const isActive = activeSideItem === item.id
              const Icon = item.icon
              const count = item.id === 'specialists' ? 8
                : item.id === 'consultations' ? (convCount || 26)
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
                    setMobileSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-[#c9a84c]' : 'text-white/40'} />
                  <span className="text-[12px] flex-1">{item.label}</span>
                  {count !== undefined && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.06] text-white/40 font-mono">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* SECCIÓN RECIENTES */}
        <div className="px-4 pt-4 pb-2 flex-1 overflow-y-auto">
          <p className="text-[8px] font-bold uppercase mb-2 tracking-[2px] text-white/30">
            RECIENTES
          </p>
          <div className="space-y-1">
            {(conversations.length > 0 ? conversations.slice(0, 5) : CANONICAL_RECENT_QUERIES).map((item, idx) => {
              const title = item.title
              const isReal = 'id' in item && typeof item.id === 'string' && !item.id.startsWith('rec-')
              return (
                <button
                  key={'id' in item ? item.id : idx}
                  onClick={() => {
                    setMobileSidebarOpen(false)
                    if (isReal) {
                      navigate(`/chat/${item.agentId}?conv=${item.id}`)
                    } else {
                      navigate(`/chat/${item.agentId}`, { state: { transferMessage: title } })
                    }
                  }}
                  className="w-full text-left px-2 py-1.5 rounded text-[11px] text-white/50 hover:text-white/90 hover:bg-white/[0.03] transition-colors truncate block"
                  title={title}
                >
                  {title}
                </button>
              )
            })}
          </div>
        </div>

        {/* FOOTER SIDEBAR: PANEL ADMIN & BRAND */}
        <div className="p-4 border-t mt-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {user?.isAdmin && (
            <button
              onClick={() => navigate('/portal-interno')}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[11px] font-medium text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/20 hover:bg-[#c9a84c]/20 transition-all mb-3"
            >
              <Shield size={13} />
              <span>Panel Admin</span>
            </button>
          )}
          <p className="text-[10px] text-white/30 tracking-wider">
            Hardman · Perú
          </p>
        </div>
      </aside>

      {/* MAIN RIGHT COLUMN */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* TOP HEADER */}
        <header
          className="h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 border-b z-20"
          style={{ background: '#0a0a0c', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-white/10 text-white/70"
            >
              <Menu size={18} />
            </button>
            <span className="font-extrabold tracking-[0.2em] text-[13px] text-white">HARDMAN</span>
          </div>

          <div className="hidden md:block"></div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Pill Consultas Restantes */}
            <div
              onClick={() => setUpgradeModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-medium transition-all cursor-pointer hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5"
              style={{
                background: '#131418',
                borderColor: 'rgba(255,255,255,0.08)'
              }}
              title="Consultas disponibles"
            >
              <Zap size={12} className="text-[#c9a84c] fill-[#c9a84c]" />
              <span className="text-white/70">
                Consultas <strong className="text-[#dfbe63] font-semibold">{demoUsage ? Math.max(0, (demoUsage.limit || 1) - demoUsage.questionsUsed) : (userPlan === 'senior' ? 250 : 50)}</strong> restantes
              </span>
            </div>

            {/* User Badge */}
            <button
              onClick={() => navigate('/account')}
              className="flex items-center gap-2.5 pl-1.5 pr-2 py-1 rounded-full hover:bg-white/5 transition-all text-left"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.4)',
                  color: '#dfbe63'
                }}
              >
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-medium text-white leading-tight">
                  {user?.name || 'Administrador'}
                </p>
                <p className="text-[8px] font-bold uppercase tracking-wider text-[#c9a84c]">
                  {userPlan === 'senior' ? 'PLAN SENIOR' : userPlan === 'demo' ? 'MODO DEMO' : 'PLAN JUNIOR'}
                </p>
              </div>
            </button>
          </div>
        </header>

        {/* SCROLLABLE BODY */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <AnimatePresence mode="wait">
            {activeSideItem === 'specialists' && (
              <motion.div
                key="specialists"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-6xl mx-auto"
              >
                {/* Title */}
                <div className="text-center pt-6 pb-6">
                  <h1 className="text-3xl sm:text-4xl md:text-[44px] font-light text-white tracking-tight">
                    ¿En qué puedo <span className="font-serif italic text-[#dfbe63]">ayudarte?</span>
                  </h1>
                </div>

                {/* Input Box Card */}
                <div className="max-w-2xl mx-auto mb-10 px-2 sm:px-0">
                  <div
                    className="rounded-2xl p-4 transition-all duration-300 relative focus-within:border-[#c9a84c]/45"
                    style={{
                      background: '#121316',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.6)'
                    }}
                  >
                    <textarea
                      id="dashboard-case-textarea"
                      value={promptCase}
                      onChange={(e) => setPromptCase(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleStartPrompt()
                        }
                      }}
                      placeholder="Describe tu caso: hechos, fechas y qué necesitas lograr..."
                      rows={2}
                      className="w-full bg-transparent text-[13.5px] text-white placeholder-white/40 resize-none outline-none leading-relaxed"
                    />

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.05]">
                      {/* + Button with Tools Dropdown */}
                      <div className="relative" ref={plusMenuRef}>
                        <button
                          type="button"
                          onClick={() => setPlusMenuOpen(!plusMenuOpen)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                            plusMenuOpen
                              ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#dfbe63]'
                              : 'border-white/10 hover:border-[#c9a84c]/40 hover:bg-white/5 text-white/60 hover:text-white'
                          }`}
                          title="Herramientas y opciones"
                        >
                          <Plus size={15} />
                        </button>

                        {/* Popover Menu with the 4 options user asked to put here */}
                        <AnimatePresence>
                          {plusMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.96 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.96 }}
                              transition={{ duration: 0.15 }}
                              className="absolute left-0 bottom-9 mb-1.5 w-56 rounded-xl p-1.5 z-50 shadow-2xl backdrop-blur-xl"
                              style={{
                                background: 'rgba(18, 19, 23, 0.98)',
                                border: '1px solid rgba(201, 168, 76, 0.35)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 25px rgba(201,168,76,0.12)'
                              }}
                            >
                              <div className="text-[9px] uppercase font-bold text-[#c9a84c] px-3 py-1 tracking-wider border-b border-white/5">
                                Acciones Rápidas
                              </div>
                              <button
                                type="button"
                                onClick={() => { setPlusMenuOpen(false); setDocGenModal({ isOpen: true, docType: 'carta_notarial' }) }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <FileText size={13} className="text-[#c9a84c]" />
                                <span>Generar documentos</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPlusMenuOpen(false); setScannerOpen(true) }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <Sparkles size={13} className="text-[#a5b4fc]" />
                                <span>Escanear cédula / PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPlusMenuOpen(false); setCalcModal({ isOpen: true, tab: 'liquidacion' }) }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <Calculator size={13} className="text-[#34d17a]" />
                                <span>Calculadoras S/</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setPlusMenuOpen(false); setWhereToGoOpen(true) }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                              >
                                <MapPin size={13} className="text-[#f59e0b]" />
                                <span>A dónde acudir</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Up Arrow Send Button */}
                      <button
                        type="button"
                        onClick={() => handleStartPrompt()}
                        disabled={!promptCase.trim()}
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                          color: '#111111'
                        }}
                        title="Enviar consulta"
                      >
                        <ArrowUp size={14} strokeWidth={2.8} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Specialists Section Header */}
                <div className="flex items-center gap-2.5 mb-5 px-1 max-w-5xl mx-auto">
                  <h2 className="text-[11px] font-bold uppercase tracking-[2px] text-white/50">
                    ESPECIALISTAS
                  </h2>
                  <span className="text-white/20">•</span>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/50 font-normal">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span>8 en línea · respuesta inmediata</span>
                  </div>
                </div>

                {/* 4x2 Grid of Lawyers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {LAWYER_PANEL_DATA.map((item, index) => (
                    <LawyerCard key={item.id} item={item} index={index} />
                  ))}
                </div>

                {/* Footer Disclaimer */}
                <div className="text-center pt-10 pb-6 text-[11px] text-white/35 font-light">
                  Tus chats no se utilizan para entrenar nuestros modelos. Hardman es una IA y puede cometer errores.
                </div>
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

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        usage={{
          plan: 'demo',
          questionsUsed: demoUsage?.questionsUsed || 0,
          limit: 1,
          isDemo: true,
        }}
      />
    </div>
  )
}

function LawyerCard({ item, index }: { item: LawyerPanelItem; index: number }) {
  const navigate = useNavigate()
  const agent = getAgent(item.id)
  const [isHovered, setIsHovered] = useState(false)

  const imageSrc = agent?.image || `/agents/${item.id}.jpg`

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/chat/${item.id}`)}
      className="group cursor-pointer rounded-[20px] overflow-hidden flex flex-col justify-between transition-all duration-300 relative select-none"
      style={{
        background: isHovered
          ? 'linear-gradient(180deg, #1b1d22 0%, #121316 100%)'
          : 'linear-gradient(180deg, #17181c 0%, #0f1012 100%)',
        border: `1px solid ${isHovered ? 'rgba(201,168,76,0.38)' : 'rgba(255,255,255,0.07)'}`,
        boxShadow: isHovered
          ? '0 16px 36px rgba(0,0,0,0.65), 0 0 20px rgba(201,168,76,0.08)'
          : '0 4px 18px rgba(0,0,0,0.40)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
      }}
    >
      <div>
        {/* Visual / Image container */}
        <div className="relative w-full aspect-[4/3.2] overflow-hidden rounded-t-[19px]">
          {/* Top Tag & Green Status Dot */}
          <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between pointer-events-none">
            <span
              className="px-2.5 py-0.5 rounded-md text-[8.5px] font-bold uppercase tracking-[1.4px]"
              style={{
                color: item.tagColor.text,
                background: item.tagColor.bg,
                border: `1px solid ${item.tagColor.border}`,
                backdropFilter: 'blur(8px)',
              }}
            >
              {item.tag}
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] ring-4 ring-[#10b981]/20 shadow-[0_0_8px_#10b981]" />
          </div>

          {item.isSilhouette ? (
            <div
              className="w-full h-full flex items-end justify-center pb-2 relative"
              style={{
                background: item.silhouetteColor?.bg || '#15171c',
              }}
            >
              <svg
                viewBox="0 0 100 100"
                className="w-28 h-28 opacity-85 transition-transform duration-500 group-hover:scale-105"
                fill={item.silhouetteColor?.fill || 'rgba(200,200,200,0.4)'}
              >
                <circle cx="50" cy="35" r="17" />
                <path d="M 23 88 C 23 68 35 60 50 60 C 65 60 77 68 77 88 Z" />
              </svg>
              {/* Bottom fade */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, #17181c 0%, transparent 60%)',
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full relative overflow-hidden">
              <img
                src={imageSrc}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                style={{ objectPosition: 'center 20%' }}
              />
              {/* Bottom fade into card body */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, #17181c 0%, rgba(23,24,28,0.3) 45%, transparent 80%)',
                }}
              />
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-4 pt-2">
          <h3 className="text-[17px] font-medium text-white leading-tight tracking-tight">
            {item.title}
          </h3>
          <p
            className="text-[9.5px] font-bold uppercase tracking-[1.4px] mt-1"
            style={{ color: item.tagColor.text }}
          >
            {item.subtitle}
          </p>
          <p className="text-[11.5px] text-white/60 font-light leading-relaxed mt-2 line-clamp-2 min-h-[34px]">
            {item.description}
          </p>
        </div>
      </div>

      {/* Bottom CTA Row */}
      <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
        <span
          className="px-3 py-1.5 rounded-full text-[10.5px] text-white/70 font-light truncate max-w-[78%] transition-colors duration-200"
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {item.ctaText}
        </span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
          style={{
            border: isHovered ? '1px solid rgba(201,168,76,0.6)' : '1px solid rgba(255,255,255,0.12)',
            background: isHovered ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.02)',
            color: isHovered ? '#dfbe63' : 'rgba(255,255,255,0.6)',
          }}
        >
          <ArrowRight size={13} strokeWidth={1.8} />
        </div>
      </div>
    </motion.div>
  )
}

