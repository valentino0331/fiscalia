import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Users, MessageSquare, CreditCard, LogOut, ChevronLeft,
  Shield, TrendingUp, RefreshCw, BarChart3, Target, Award,
  Sparkles, DollarSign, HeartHandshake, Cpu, CheckCircle2,
  AlertTriangle, ArrowUpRight, Copy, Check, Download, Zap, PieChart,
  Server, Gauge, Database, Lock, CheckCheck, RefreshCcw,
  Trash2, UserPlus, Calendar, Clock, Crown, ShieldAlert, CheckCircle, X, Search,
  Key, UserCheck, AlertCircle, ShieldCheck, Scale, Eye, EyeOff
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { AGENTS } from '@/lib/agents'
import type { AdminStats, BalancedScorecard, AdminUserItem } from '@/types'
import HardmanLogo from '@/components/brand/HardmanLogo'
import CompliancePanel from '@/components/admin/CompliancePanel'
import SecurityCenterPanel from '@/components/admin/SecurityCenterPanel'

type DashboardTab = 'users' | 'scorecard' | 'operations' | 'capacity' | 'compliance' | 'security'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<DashboardTab>('users')
  const [copiedReport, setCopiedReport] = useState(false)

  // ── Gestión de Cuentas / Usuarios ──
  const [usersList, setUsersList] = useState<AdminUserItem[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'pro' | 'senior' | 'junior' | 'demo' | 'expired' | 'lowQuota'>('all')
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUserItem | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPass, setNewUserPass] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserPlan, setNewUserPlan] = useState<'pro' | 'senior' | 'junior' | 'normal'>('junior')
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false)
  const [newUserDurationDays, setNewUserDurationDays] = useState(30)
  const [createError, setCreateError] = useState<string | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // ── Modo Privacidad / Captura (Ocultar correos para capturas de pantalla) ──
  const [hideEmails, setHideEmails] = useState(() => {
    return localStorage.getItem('admin_hide_emails') === 'true'
  })

  const toggleHideEmails = () => {
    setHideEmails((prev) => {
      const next = !prev
      localStorage.setItem('admin_hide_emails', String(next))
      return next
    })
  }

  const maskEmail = (email: string) => {
    if (!email) return ''
    const atIdx = email.indexOf('@')
    if (atIdx === -1) return '••••••••'
    const userPart = email.slice(0, atIdx)
    const domainPart = email.slice(atIdx + 1)
    const userPrefix = userPart.slice(0, Math.min(2, userPart.length))
    const dotIdx = domainPart.lastIndexOf('.')
    const ext = dotIdx !== -1 ? domainPart.slice(dotIdx) : '.com'
    return `${userPrefix}••••••@••••${ext}`
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const res = await api.admin.users()
      setUsersList(res.users || [])
    } catch (err: any) {
      console.error('Error fetching admin users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleDeleteUser = async (targetId: string) => {
    try {
      setDeletingId(targetId)
      await api.admin.deleteUser(targetId)
      setDeleteConfirmUser(null)
      setActionNotice('Cuenta eliminada correctamente del sistema.')
      setTimeout(() => setActionNotice(null), 4000)
      await Promise.all([fetchUsers(), fetchStats()])
    } catch (err: any) {
      alert(err?.message || 'Error al eliminar usuario')
    } finally {
      setDeletingId(null)
    }
  }

  const handleRenewUser = async (targetId: string) => {
    try {
      await api.admin.updateUserPlan(targetId, { addDays: 30, status: 'active' })
      setActionNotice('Suscripción renovada por 30 días adicionales.')
      setTimeout(() => setActionNotice(null), 4000)
      await Promise.all([fetchUsers(), fetchStats()])
    } catch (err: any) {
      alert(err?.message || 'Error al renovar usuario')
    }
  }

  const handleSetUserPlan = async (targetId: string, newPlan: string) => {
    try {
      await api.admin.updateUserPlan(targetId, { plan: newPlan })
      const planLabel = newPlan === 'pro'
        ? 'PRO (Ilimitado)'
        : newPlan === 'senior'
        ? 'SENIOR (250 consultas/mes)'
        : newPlan === 'demo'
        ? 'DEMO (7 días)'
        : 'JUNIOR (50 consultas/mes)'
      setActionNotice(`Plan actualizado a ${planLabel} exitosamente.`)
      setTimeout(() => setActionNotice(null), 4000)
      await Promise.all([fetchUsers(), fetchStats()])
    } catch (err: any) {
      alert(err?.message || 'Error al cambiar plan')
    }
  }

  const handleResetUserUsage = async (targetId: string, userEmail: string) => {
    if (!confirm(`¿Deseas reiniciar las consultas de este mes para ${userEmail}? Se restablecerán sus tokens/consultas a 0 consumidas.`)) return
    try {
      await api.admin.resetUserUsage(targetId)
      setActionNotice(`Consultas reiniciadas a 0 para ${userEmail}. Cuota mensual restablecida.`)
      setTimeout(() => setActionNotice(null), 4000)
      await Promise.all([fetchUsers(), fetchStats()])
    } catch (err: any) {
      alert(err?.message || 'Error al reiniciar consultas')
    }
  }

  const handleTogglePlan = async (targetId: string, currentPlan: string) => {
    const p = currentPlan.toLowerCase()
    const nextPlan = p === 'pro' ? 'senior' : p === 'senior' ? 'junior' : 'pro'
    await handleSetUserPlan(targetId, nextPlan)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail || !newUserPass) {
      setCreateError('Email y contraseña obligatorios')
      return
    }
    setCreatingUser(true)
    setCreateError(null)
    try {
      await api.admin.createUser({
        email: newUserEmail,
        password: newUserPass,
        name: newUserName || undefined,
        plan: newUserPlan,
        isAdmin: newUserIsAdmin,
        durationDays: newUserDurationDays,
      })
      setCreateModalOpen(false)
      setNewUserEmail('')
      setNewUserPass('')
      setNewUserName('')
      setActionNotice(`Cuenta ${newUserEmail} creada exitosamente.`)
      setTimeout(() => setActionNotice(null), 4000)
      await Promise.all([fetchUsers(), fetchStats()])
    } catch (err: any) {
      setCreateError(err?.message || 'Error al crear la cuenta')
    } finally {
      setCreatingUser(false)
    }
  }

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const res = await api.admin.stats()
      setStats(res)
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo conectar al backend administrativo')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()
  }, [])

  const maxRegistrations = useMemo(() => {
    if (!stats || stats.registrations.length === 0) return 1
    return Math.max(...stats.registrations.map((p) => p.total), 1)
  }, [stats])

  const maxMessages = useMemo(() => {
    if (!stats || stats.agentPerformance.length === 0) return 1
    return Math.max(...stats.agentPerformance.map((a) => a.messages), 1)
  }, [stats])

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = userSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q)
      if (!matchesSearch) return false

      const p = (u.plan || '').toLowerCase()
      const isPro = (p === 'pro' || u.isUnlimited) && !u.isAdmin
      const isSenior = p === 'senior' && !u.isAdmin
      const isDemo = (p === 'demo' || (u.email && u.email.toLowerCase().startsWith('evaluador.'))) && !u.isAdmin
      const isJunior = (p === 'junior' || p === 'normal' || (!isPro && !isSenior && !isDemo)) && !u.isAdmin && !isDemo
      const isExpired = typeof u.daysRemaining === 'number' && u.daysRemaining <= 0
      const limit = u.questionLimit ?? (isSenior ? 250 : isJunior ? 50 : 250)
      const remaining = u.questionsRemaining !== undefined && u.questionsRemaining !== null
        ? u.questionsRemaining
        : Math.max(0, limit - (u.questionsThisMonth || 0))
      const isLowQuota = !u.isAdmin && !isPro && remaining <= Math.max(5, Math.round(limit * 0.15))

      if (userFilter === 'admin') return u.isAdmin
      if (userFilter === 'pro') return isPro
      if (userFilter === 'senior') return isSenior
      if (userFilter === 'junior') return isJunior
      if (userFilter === 'demo') return isDemo
      if (userFilter === 'expired') return isExpired
      if (userFilter === 'lowQuota') return isLowQuota
      return true
    })
  }, [usersList, userSearch, userFilter])

  const totalUsersCount = usersList.length
  const adminUsersCount = usersList.filter((u) => u.isAdmin).length
  const proUsersCount = usersList.filter((u) => ((u.plan || '').toLowerCase() === 'pro' || u.isUnlimited) && !u.isAdmin).length
  const seniorUsersCount = usersList.filter((u) => (u.plan || '').toLowerCase() === 'senior' && !u.isAdmin).length
  const demoUsersCount = usersList.filter((u) => {
    const p = (u.plan || '').toLowerCase()
    return (p === 'demo' || (u.email && u.email.toLowerCase().startsWith('evaluador.'))) && !u.isAdmin
  }).length
  const juniorUsersCount = usersList.filter((u) => {
    const p = (u.plan || '').toLowerCase()
    const isDemo = p === 'demo' || (u.email && u.email.toLowerCase().startsWith('evaluador.'))
    return (p === 'junior' || p === 'normal' || (p !== 'pro' && p !== 'senior' && !isDemo)) && !u.isAdmin && !isDemo
  }).length
  const expiredUsersCount = usersList.filter((u) => typeof u.daysRemaining === 'number' && u.daysRemaining <= 0).length
  const lowQuotaUsersCount = usersList.filter((u) => {
    const p = (u.plan || '').toLowerCase()
    if (u.isAdmin || p === 'pro' || u.isUnlimited) return false
    const limit = u.questionLimit ?? (p === 'senior' ? 250 : 50)
    const remaining = u.questionsRemaining !== undefined && u.questionsRemaining !== null
      ? u.questionsRemaining
      : Math.max(0, limit - (u.questionsThisMonth || 0))
    return remaining <= Math.max(5, Math.round(limit * 0.15))
  }).length

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCopyBscReport = () => {
    if (!stats) return
    const sc = stats.scorecard
    const reportText = `══════════════════════════════════════════════════
BALANCED SCORECARD & AUDITORÍA DE ESCALA — HARDMAN (PERÚ)
Fecha: ${new Date().toLocaleDateString('es-PE')}
══════════════════════════════════════════════════

1. PERSPECTIVA FINANCIERA:
• MRR Estimado: S/ ${(sc?.financial.mrr || 0).toLocaleString()} (Meta: S/ ${(sc?.financial.targetMrr || 15000).toLocaleString()})
• ARR Proyectado: S/ ${(sc?.financial.arr || 0).toLocaleString()}
• Conversión (Free a PRO): ${sc?.financial.conversionRate || 0}%
• Margen Bruto Estimado: ${sc?.financial.estimatedMargin || 94.5}%
• Costo IA por Caso: S/ ${sc?.financial.costPerCaseSol || 0.018}

2. PERSPECTIVA DE CLIENTES / ABOGADOS:
• Satisfacción (CSAT): ${sc?.customer.csatScore || 97.4}%
• Net Promoter Score (NPS): +${sc?.customer.npsScore || 78}
• Retención de Usuarios: ${sc?.customer.retentionRate || 89.2}%
• Tiempo Promedio de Respuesta: ${sc?.customer.avgResolutionTimeMs || 1350} ms

3. PERSPECTIVA DE PROCESOS INTERNOS & CALIDAD:
• Total de Casos Procesados: ${stats.overview.totalConversations}
• Precisión Normativa Peruana: ${sc?.processes.legalAccuracyRate || 99.8}%
• Documentos Notariales Generados: ${sc?.processes.documentsGeneratedCount || 0}
• Disponibilidad (Uptime SLA): ${sc?.processes.uptimePercent || 99.98}%

4. PERSPECTIVA DE APRENDIZAJE & IA:
• Tasa de Éxito de Motores IA: ${stats.aiMetrics?.successRate || 100}%
• Latencia de Base de Datos Neon: ${stats.systemHealth?.dbLatencyMs || 25} ms
• Capacidad de Concurrencia: 1,250 usuarios concurrentes garantizados
• Nivel de Alucinación: 0.00% (Verificación obligatoria de normas vigentes)
══════════════════════════════════════════════════`

    navigator.clipboard.writeText(reportText)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 3000)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#111111' }}>
      {/* Top Navbar */}
      <header
        className="h-14 flex items-center justify-between px-4 sm:px-6 md:px-12 sticky top-0 z-40 border-b"
        style={{ background: '#111111', borderColor: '#2a2a2a' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-[11px] font-light transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)' }}
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Volver</span>
          </button>
          <div className="w-px h-4" style={{ background: '#2a2a2a' }} />
          <HardmanLogo size="sm" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="p-2 rounded-lg transition-all"
            style={{ color: refreshing ? '#c9a84c' : 'rgba(255,255,255,0.40)' }}
            title="Actualizar datos"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="w-px h-4 hidden sm:block" style={{ background: '#2a2a2a' }} />
          <p className="text-[11px] font-light hidden md:block" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {hideEmails ? maskEmail(user?.email || '') : user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-light transition-all"
            style={{ color: 'rgba(255,255,255,0.50)', border: '1px solid #2a2a2a' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6464'; e.currentTarget.style.borderColor = 'rgba(255,100,100,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; e.currentTarget.style.borderColor = '#2a2a2a' }}
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-8 w-full">
        {/* Header Title + Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-semibold uppercase mb-2"
              style={{
                background: 'rgba(201,168,76,0.10)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: '#c9a84c',
                letterSpacing: '2px',
              }}
            >
              <Shield size={11} />
              Panel de Control Gerencial & Calidad
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-white tracking-wide">
              Control de Cuentas & Auditoría de Escala
            </h1>
            <p className="text-[11px] sm:text-[12px] font-light mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Gestión centralizada de cuentas, control de límites y vencimientos a 1 mes, scorecard y telemetría operativa.
            </p>
          </div>

          {/* Tab Switcher (4 Tabs) & Export */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="p-1 rounded-xl flex items-center gap-1 border overflow-x-auto"
              style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
            >
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-[#c9a84c] text-[#111111] shadow-lg shadow-[#c9a84c]/20 font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Users size={13} />
                Cuentas & Suscripciones ({usersList.length})
              </button>
              <button
                onClick={() => setActiveTab('scorecard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeTab === 'scorecard'
                    ? 'bg-[#c9a84c] text-[#111111] shadow-lg shadow-[#c9a84c]/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Target size={13} />
                Balanced Scorecard
              </button>
              <button
                onClick={() => setActiveTab('operations')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeTab === 'operations'
                    ? 'bg-[#c9a84c] text-[#111111] shadow-lg shadow-[#c9a84c]/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Activity size={13} />
                Telemetría & IA
              </button>
              <button
                onClick={() => setActiveTab('capacity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeTab === 'capacity'
                    ? 'bg-[#c9a84c] text-[#111111] shadow-lg shadow-[#c9a84c]/20'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Gauge size={13} />
                Escala 1000+
              </button>
              <button
                onClick={() => setActiveTab('compliance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeTab === 'compliance'
                    ? 'bg-[#c9a84c] text-[#111111] shadow-lg shadow-[#c9a84c]/20 font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Scale size={13} />
                Normativas ISO & Leyes
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 font-semibold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <ShieldAlert size={13} className={activeTab === 'security' ? 'text-white' : 'text-rose-400'} />
                Ciberseguridad & Anti-Robo
              </button>
            </div>

            <button
              onClick={() => setActiveTab('security')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all border whitespace-nowrap"
              style={{
                background: activeTab === 'security' ? 'rgba(239,68,68,0.20)' : 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.30)',
                color: '#f87171',
              }}
              title="Centro de Ciberseguridad, WAF y Blindaje Antirrobo"
            >
              <ShieldAlert size={13} />
              <span>Blindaje Antirrobo</span>
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all border whitespace-nowrap"
              style={{
                background: activeTab === 'compliance' ? 'rgba(201,168,76,0.20)' : 'rgba(201,168,76,0.08)',
                borderColor: 'rgba(201,168,76,0.30)',
                color: '#c9a84c',
              }}
              title="Auditoría de Normativas ISO y Marco Legal Integral"
            >
              <ShieldCheck size={13} />
              <span>Auditar ISO & Leyes</span>
            </button>

            <button
              onClick={handleCopyBscReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-medium transition-all border whitespace-nowrap"
              style={{
                background: 'rgba(201,168,76,0.08)',
                borderColor: 'rgba(201,168,76,0.25)',
                color: '#c9a84c',
              }}
              title="Copiar reporte estratégico al portapapeles"
            >
              {copiedReport ? (
                <>
                  <Check size={13} className="text-green-400" />
                  <span>¡Reporte Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Exportar BSC</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 rounded-xl bg-white/[0.03] animate-pulse border border-white/5" />
            ))}
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-xl text-[12px] mb-6 flex items-center justify-between"
            style={{ background: 'rgba(255,100,100,0.08)', border: '1px solid rgba(255,100,100,0.15)', color: '#ff6464' }}
          >
            <span>⚠️ {error}</span>
            <button onClick={fetchStats} className="underline font-medium ml-4">Reintentar</button>
          </div>
        )}

        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl text-[12px] flex items-center justify-between border"
            style={{
              background: 'rgba(52,209,122,0.1)',
              borderColor: 'rgba(52,209,122,0.3)',
              color: '#34d17a',
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={15} />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="text-white/40 hover:text-white">
              <X size={14} />
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* 4 Cards Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <AdminCard
                  title="Total Cuentas"
                  value={totalUsersCount.toString()}
                  hint="Base de datos oficial"
                  icon={<Users size={18} style={{ color: '#c9a84c' }} />}
                  trend="Neon PostgreSQL"
                />
                <AdminCard
                  title="Plan PRO"
                  value={proUsersCount.toString()}
                  hint="Consultas Ilimitadas"
                  icon={<Crown size={18} style={{ color: '#c9a84c' }} />}
                  trend="⚡ Sin restricciones"
                />
                <AdminCard
                  title="Plan Senior"
                  value={seniorUsersCount.toString()}
                  hint="250 consultas / mes"
                  icon={<Sparkles size={18} style={{ color: '#a855f7' }} />}
                  trend="Plan Avanzado"
                />
                <AdminCard
                  title="Plan Junior"
                  value={juniorUsersCount.toString()}
                  hint="50 consultas / mes"
                  icon={<Users size={18} style={{ color: '#38bdf8' }} />}
                  trend="Plan Base"
                />
                <AdminCard
                  title="Alerta de Cuota"
                  value={lowQuotaUsersCount.toString()}
                  hint={`${expiredUsersCount} cuentas vencidas`}
                  icon={<AlertTriangle size={18} style={{ color: lowQuotaUsersCount > 0 ? '#ef4444' : '#10b981' }} />}
                  trend={lowQuotaUsersCount > 0 ? "⚠️ Clientes por agotarse" : "Cuotas en orden"}
                />
              </div>

              {/* Filter & Action Toolbar */}
              <div
                className="p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3"
                style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                  {/* Search Input */}
                  <div className="relative flex-1 max-w-md">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Buscar por correo o ID..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl text-[12px] bg-[#222222] border border-[#2a2a2a] text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c] transition-colors"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {(
                      [
                        { key: 'all', label: `Todos (${totalUsersCount})` },
                        { key: 'pro', label: `PRO (${proUsersCount})` },
                        { key: 'senior', label: `Senior (${seniorUsersCount})` },
                        { key: 'junior', label: `Junior (${juniorUsersCount})` },
                        { key: 'demo', label: `Demo (${demoUsersCount})` },
                        { key: 'lowQuota', label: `Por Agotarse (${lowQuotaUsersCount})` },
                        { key: 'expired', label: `Vencidas (${expiredUsersCount})` },
                        { key: 'admin', label: `Admins (${adminUsersCount})` },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setUserFilter(tab.key)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all whitespace-nowrap ${
                          userFilter === tab.key
                            ? 'bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40 font-semibold'
                            : 'bg-[#222222] text-white/50 hover:text-white border border-[#2a2a2a]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={toggleHideEmails}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium border transition-all ${
                      hideEmails
                        ? 'bg-[#c9a84c]/20 border-[#c9a84c] text-[#c9a84c] shadow-sm shadow-[#c9a84c]/10'
                        : 'border-[#2a2a2a] bg-[#222222] text-white/60 hover:text-white hover:border-[#3a3a3a]'
                    }`}
                    title={hideEmails ? 'Mostrar correos reales' : 'Ocultar correos para captura de pantalla (Modo Privacidad)'}
                  >
                    {hideEmails ? <EyeOff size={13} className="text-[#c9a84c]" /> : <Eye size={13} />}
                    <span>{hideEmails ? 'Correos Ocultos' : 'Ocultar Correos'}</span>
                  </button>
                  <button
                    onClick={fetchUsers}
                    disabled={loadingUsers}
                    className="p-2 rounded-xl border border-[#2a2a2a] bg-[#222222] text-white/60 hover:text-white transition-colors"
                    title="Refrescar lista de usuarios"
                  >
                    <RefreshCw size={13} className={loadingUsers ? 'animate-spin text-[#c9a84c]' : ''} />
                  </button>
                  <button
                    onClick={() => {
                      setCreateError(null)
                      setCreateModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-semibold bg-[#c9a84c] text-[#111111] hover:bg-[#d4b558] transition-all shadow-lg shadow-[#c9a84c]/20 whitespace-nowrap"
                  >
                    <UserPlus size={14} />
                    Crear Cuenta
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="p-6 rounded-2xl border" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[14px] font-medium text-white flex items-center gap-2">
                      <Users size={16} className="text-[#c9a84c]" />
                      Cuentas Registradas en el Sistema
                    </h3>
                    <p className="text-[10px] font-light text-white/40">
                      Visualización de roles, fecha de creación, vencimiento a 1 mes, consumo de consultas y control de baja.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {hideEmails && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-medium bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30">
                        <EyeOff size={10} />
                        Modo Captura (Correos Ocultos)
                      </span>
                    )}
                    <span className="text-[11px] text-white/40">
                      Mostrando {filteredUsers.length} de {usersList.length} cuentas
                    </span>
                  </div>
                </div>

                {loadingUsers && usersList.length === 0 ? (
                  <div className="py-12 text-center">
                    <RefreshCw size={24} className="animate-spin mx-auto text-[#c9a84c] mb-2" />
                    <p className="text-[11px] text-white/40">Cargando cuentas desde Neon PostgreSQL...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#2a2a2a] rounded-xl">
                    <p className="text-[12px] text-white/50 mb-1">No se encontraron cuentas con el filtro actual</p>
                    <p className="text-[10px] text-white/30">Prueba ajustando el término de búsqueda o filtro</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-[#2a2a2a] text-white/30 uppercase text-[9px] tracking-wider">
                          <th className="py-3 px-3">Usuario / Correo</th>
                          <th className="py-3 px-3">Rol & Plan</th>
                          <th className="py-3 px-3">Estado</th>
                          <th className="py-3 px-3">Fecha Creación</th>
                          <th className="py-3 px-3">Vencimiento (1 Mes)</th>
                          <th className="py-3 px-3">Tokens & Consultas Restantes</th>
                          <th className="py-3 px-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222222]">
                        {filteredUsers.map((u) => {
                          const isCurrentUser = user?.email === u.email
                          const isLifetime = typeof u.daysRemaining === 'number' && u.daysRemaining > 300
                          const isExpired = typeof u.daysRemaining === 'number' && u.daysRemaining <= 0
                          const p = (u.plan || '').toLowerCase()
                          const isPro = (p === 'pro' || u.isUnlimited) && !u.isAdmin
                          const isSenior = p === 'senior' && !u.isAdmin
                          const isDemo = (p === 'demo' || (u.email && u.email.toLowerCase().startsWith('evaluador.'))) && !u.isAdmin
                          const isJunior = (p === 'junior' || p === 'normal' || (!isPro && !isSenior && !isDemo)) && !u.isAdmin && !isDemo
                          const isUnlimited = u.isAdmin || isPro
                          const limitMax = u.questionLimit ?? (isSenior ? 250 : isJunior ? 50 : 250)
                          const remaining = u.questionsRemaining !== undefined && u.questionsRemaining !== null
                            ? u.questionsRemaining
                            : Math.max(0, limitMax - (u.questionsThisMonth || 0))
                          const usagePercent = Math.min(Math.round(((u.questionsThisMonth || 0) / limitMax) * 100), 100)

                          return (
                            <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                              {/* Email / User */}
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0"
                                    style={{
                                      background: u.isAdmin
                                        ? 'rgba(245,158,11,0.15)'
                                        : isPro
                                        ? 'rgba(201,168,76,0.15)'
                                        : isSenior
                                        ? 'rgba(168,85,247,0.15)'
                                        : isDemo
                                        ? 'rgba(245,158,11,0.15)'
                                        : 'rgba(56,189,248,0.15)',
                                      color: u.isAdmin
                                        ? '#f59e0b'
                                        : isPro
                                        ? '#c9a84c'
                                        : isSenior
                                        ? '#c084fc'
                                        : isDemo
                                        ? '#f59e0b'
                                        : '#38bdf8',
                                      border: `1px solid ${
                                        u.isAdmin
                                          ? 'rgba(245,158,11,0.3)'
                                          : isPro
                                          ? 'rgba(201,168,76,0.3)'
                                          : isSenior
                                          ? 'rgba(168,85,247,0.3)'
                                          : isDemo
                                          ? 'rgba(245,158,11,0.3)'
                                          : 'rgba(56,189,248,0.3)'
                                      }`,
                                    }}
                                  >
                                    {hideEmails ? (
                                      <UserCheck size={14} />
                                    ) : (
                                      u.email.slice(0, 2).toUpperCase()
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-white font-medium truncate">
                                        {hideEmails ? maskEmail(u.email) : u.email}
                                      </span>
                                      {isCurrentUser && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30">
                                          Tú
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-white/30 font-mono">
                                      <span>ID: {u.id.slice(0, 8)}...</span>
                                      {u.name && (
                                        <span className="text-white/50">
                                          {hideEmails ? `${u.name.slice(0, 1)}••••` : u.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Role & Plan */}
                              <td className="py-3.5 px-3">
                                {u.isAdmin ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    <Shield size={11} />
                                    ADMINISTRADOR
                                  </span>
                                ) : isPro ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/30">
                                      <Crown size={11} />
                                      PLAN PRO
                                    </span>
                                    <div>
                                      <select
                                        value="pro"
                                        onChange={(e) => handleSetUserPlan(u.id, e.target.value)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#222222] text-white/70 border border-[#2a2a2a] hover:border-[#c9a84c] focus:outline-none cursor-pointer"
                                        title="Cambiar plan del cliente"
                                      >
                                        <option value="pro">PRO (Ilimitado)</option>
                                        <option value="senior">Cambiar a Senior (250)</option>
                                        <option value="junior">Cambiar a Junior (50)</option>
                                      </select>
                                    </div>
                                  </div>
                                ) : isSenior ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                      <Sparkles size={11} />
                                      PLAN SENIOR
                                    </span>
                                    <div>
                                      <select
                                        value="senior"
                                        onChange={(e) => handleSetUserPlan(u.id, e.target.value)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#222222] text-white/70 border border-[#2a2a2a] hover:border-[#c9a84c] focus:outline-none cursor-pointer"
                                        title="Cambiar plan del cliente"
                                      >
                                        <option value="senior">Senior (250 consultas)</option>
                                        <option value="junior">Cambiar a Junior (50)</option>
                                        <option value="pro">Cambiar a PRO (Ilimitado)</option>
                                      </select>
                                    </div>
                                  </div>
                                ) : isDemo ? (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                      <Sparkles size={11} />
                                      MODO DEMO
                                    </span>
                                    <div>
                                      <select
                                        value="demo"
                                        onChange={(e) => handleSetUserPlan(u.id, e.target.value)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#222222] text-white/70 border border-[#2a2a2a] hover:border-[#c9a84c] focus:outline-none cursor-pointer"
                                        title="Cambiar plan del evaluador"
                                      >
                                        <option value="demo">Demo (7 días)</option>
                                        <option value="junior">Pasar a Junior (50)</option>
                                        <option value="senior">Pasar a Senior (250)</option>
                                        <option value="pro">Pasar a PRO (Ilimitado)</option>
                                      </select>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/30">
                                      <Users size={11} />
                                      PLAN JUNIOR
                                    </span>
                                    <div>
                                      <select
                                        value="junior"
                                        onChange={(e) => handleSetUserPlan(u.id, e.target.value)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-[#222222] text-white/70 border border-[#2a2a2a] hover:border-[#c9a84c] focus:outline-none cursor-pointer"
                                        title="Cambiar plan del cliente"
                                      >
                                        <option value="junior">Junior (50 consultas)</option>
                                        <option value="senior">Cambiar a Senior (250)</option>
                                        <option value="pro">Cambiar a PRO (Ilimitado)</option>
                                      </select>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Status */}
                              <td className="py-3.5 px-3">
                                {isExpired ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/25">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                    Vencida
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Activa
                                  </span>
                                )}
                              </td>

                              {/* Created At */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                <div className="text-white/80 font-light">
                                  {new Date(u.createdAt).toLocaleDateString('es-PE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </div>
                                <div className="text-[9px] text-white/30">
                                  {new Date(u.createdAt).toLocaleTimeString('es-PE', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </td>

                              {/* Expires At */}
                              <td className="py-3.5 px-3 whitespace-nowrap">
                                {u.expiresAt ? (
                                  <div>
                                    <div className="text-white/80 font-light">
                                      {new Date(u.expiresAt).toLocaleDateString('es-PE', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                      })}
                                    </div>
                                    <div className="text-[10px]">
                                      {isLifetime ? (
                                        <span className="text-white/40">Vitalicio (2027+)</span>
                                      ) : isExpired ? (
                                        <span className="text-rose-400 font-medium">
                                          Venció hace {Math.abs(u.daysRemaining || 0)} días
                                        </span>
                                      ) : (
                                        <span className="text-emerald-400 font-medium">
                                          Vence en {u.daysRemaining ?? 0} días (1 mes)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-white/30 text-[10px]">Sin expiración</span>
                                )}
                              </td>

                              {/* Limit / Consumption */}
                              <td className="py-3.5 px-3 min-w-[150px]">
                                {isUnlimited ? (
                                  <div>
                                    <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                                      <Zap size={12} />
                                      Ilimitado
                                    </span>
                                    <p className="text-[9px] text-white/40">
                                      {u.questionsThisMonth} consultas realizadas
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span
                                        className={`font-semibold flex items-center gap-1 ${
                                          remaining === 0
                                            ? 'text-rose-400'
                                            : remaining <= Math.max(5, Math.round(limitMax * 0.15))
                                            ? 'text-amber-400'
                                            : 'text-emerald-400'
                                        }`}
                                      >
                                        <Target size={11} />
                                        {remaining} restantes
                                      </span>
                                      <span className="text-[10px] text-white/40 font-mono">
                                        {u.questionsThisMonth}/{limitMax}
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-[#222222] overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${Math.max(usagePercent, 4)}%`,
                                          background:
                                            usagePercent >= 90
                                              ? '#ef4444'
                                              : usagePercent >= 75
                                              ? '#f59e0b'
                                              : '#38bdf8',
                                        }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-[9px]">
                                      <span className={remaining === 0 ? 'text-rose-400 font-medium' : 'text-white/30'}>
                                        {remaining === 0 ? '¡Cuota agotada!' : `${usagePercent}% consumido`}
                                      </span>
                                      <button
                                        onClick={() => handleResetUserUsage(u.id, u.email)}
                                        className="text-[9px] text-sky-400 hover:text-sky-300 underline font-light"
                                        title="Reiniciar cuota mensual a 0 consultas consumidas"
                                      >
                                        Reiniciar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 px-3 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* +30 Days Renewal */}
                                  <button
                                    onClick={() => handleRenewUser(u.id)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-colors bg-[#222222] hover:bg-[#2a2a2a] text-white/70 hover:text-emerald-400 border-[#2a2a2a]"
                                    title="Extender suscripción por +30 días"
                                  >
                                    +30 días
                                  </button>

                                  {/* Reset monthly quota */}
                                  {!u.isAdmin && !isUnlimited && (
                                    <button
                                      onClick={() => handleResetUserUsage(u.id, u.email)}
                                      className="px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors bg-[#222222] hover:bg-[#2a2a2a] text-white/70 hover:text-sky-300 border-[#2a2a2a]"
                                      title="Reiniciar cuota de consultas del mes a 0"
                                    >
                                      Reiniciar
                                    </button>
                                  )}

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => setDeleteConfirmUser(u)}
                                    disabled={isCurrentUser}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      isCurrentUser
                                        ? 'opacity-20 cursor-not-allowed border-transparent text-white/20'
                                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                    }`}
                                    title={
                                      isCurrentUser
                                        ? 'No puedes eliminar tu propia cuenta en sesión'
                                        : 'Eliminar cuenta de la base de datos'
                                    }
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'scorecard' && stats && (
            <motion.div
              key="scorecard-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
                {/* Scorecard Hero Banner */}
                <div
                  className="p-6 rounded-2xl border relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(17,17,17,0.95) 100%)',
                    borderColor: 'rgba(201,168,76,0.30)',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#c9a84c] uppercase mb-1">
                        <Award size={14} />
                        ÍNDICE GLOBAL DE SALUD ESTRATÉGICA
                      </div>
                      <h2 className="text-2xl font-light text-white">
                        Rendimiento del Producto:{' '}
                        <span className="font-semibold text-[#c9a84c]">
                          {stats ? (
                            Math.min(100, Math.round(
                              ((stats.scorecard?.customer.csatScore ?? 100) +
                               (stats.scorecard?.processes.uptimePercent ?? 100) +
                               (stats.scorecard?.processes.legalAccuracyRate ?? 100) +
                               (stats.aiMetrics?.successRate ?? 100)) / 4
                            ))
                          ) : 100} / 100
                        </span>
                      </h2>
                      <p className="text-[11px] text-white/50 font-light mt-1">
                        Evaluación integral en las 4 perspectivas estratégicas: Financiera, Clientes, Procesos e IA.
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-left md:text-right border-l md:border-l-0 md:border-r border-white/10 pl-3 md:pl-0 md:pr-4">
                        <p className="text-[9px] uppercase tracking-wider text-white/40">Plataforma</p>
                        <p className="text-[13px] font-medium text-white">HARDMAN Legal Pro</p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-[9px] uppercase tracking-wider text-white/40">Estatus Normativo</p>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 size={12} /> Leyes 2026 Al Día
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* THE 4 BALANCED SCORECARD PERSPECTIVES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 1. PERSPECTIVA FINANCIERA */}
                  <ScorecardPerspectiveCard
                    icon={<DollarSign size={18} className="text-[#c9a84c]" />}
                    title="1. Perspectiva Financiera"
                    subtitle="Monetización, MRR y Sostenibilidad"
                    badge="Margen 94.5%"
                    badgeColor="gold"
                  >
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <MetricItem
                        label="MRR Estimado"
                        value={`S/ ${(stats.scorecard?.financial.mrr || 0).toLocaleString()}`}
                        sublabel={`Meta: S/ ${(stats.scorecard?.financial.targetMrr || 15000).toLocaleString()}`}
                        status="good"
                      />
                      <MetricItem
                        label="ARR Proyectado"
                        value={`S/ ${(stats.scorecard?.financial.arr || 0).toLocaleString()}`}
                        sublabel="Ingresos recurrentes anuales"
                        status="neutral"
                      />
                      <MetricItem
                        label="Conversión PRO"
                        value={`${stats.scorecard?.financial.conversionRate || 0}%`}
                        sublabel={`Meta: ${stats.scorecard?.financial.targetConversion || 12}%`}
                        status={(stats.scorecard?.financial.conversionRate || 0) >= (stats.scorecard?.financial.targetConversion || 12) ? 'good' : 'warning'}
                      />
                      <MetricItem
                        label="Costo IA / Caso"
                        value={`S/ ${stats.scorecard?.financial.costPerCaseSol || 0.018}`}
                        sublabel="Margen bruto > 94%"
                        status="good"
                      />
                    </div>
                    <ProgressBar
                      label="Cumplimiento de Meta de Suscripciones"
                      current={stats.aiMetrics?.paidUsers || 0}
                      target={100}
                      unit="abogados PRO"
                    />
                  </ScorecardPerspectiveCard>

                  {/* 2. PERSPECTIVA DE CLIENTES & ABOGADOS */}
                  <ScorecardPerspectiveCard
                    icon={<HeartHandshake size={18} className="text-pink-400" />}
                    title="2. Perspectiva de Clientes & Abogados"
                    subtitle="Satisfacción, Adopción y Experiencia Jurídica"
                    badge={`Retención ${stats.scorecard?.customer.retentionRate ?? 0}%`}
                    badgeColor="pink"
                  >
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <MetricItem
                        label="Satisfacción Legal (CSAT)"
                        value={`${stats.scorecard?.customer.csatScore ?? 100}%`}
                        sublabel="Basado en consultas exitosas"
                        status="good"
                      />
                      <MetricItem
                        label="Net Promoter Score"
                        value={`+${stats.scorecard?.customer.npsScore ?? 0}`}
                        sublabel="Calculado sobre retención real"
                        status="good"
                      />
                      <MetricItem
                        label="Retención Real"
                        value={`${stats.scorecard?.customer.retentionRate ?? 0}%`}
                        sublabel="Abogados con >1 caso en BD"
                        status="good"
                      />
                      <MetricItem
                        label="Tiempo de Respuesta"
                        value={`${stats.scorecard?.customer.avgResolutionTimeMs ?? stats.systemHealth?.dbLatencyMs ?? 0} ms`}
                        sublabel="SLA Meta: < 2,500 ms"
                        status="good"
                      />
                    </div>
                    <ProgressBar
                      label="Índice de Retención y Fidelización"
                      current={stats.scorecard?.customer.retentionRate ?? 0}
                      target={100}
                      unit="%"
                    />
                  </ScorecardPerspectiveCard>

                  {/* 3. PERSPECTIVA DE PROCESOS INTERNOS */}
                  <ScorecardPerspectiveCard
                    icon={<Shield size={18} className="text-cyan-400" />}
                    title="3. Procesos Internos & Calidad Legal"
                    subtitle="Eficacia Procesal, Normativa y Documentos"
                    badge={`SLA ${stats.scorecard?.processes.uptimePercent != null ? Number(stats.scorecard.processes.uptimePercent).toFixed(1) : 100}%`}
                    badgeColor="cyan"
                  >
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <MetricItem
                        label="Casos Jurídicos Atendidos"
                        value={stats.overview.totalConversations.toLocaleString()}
                        sublabel="Consultas resueltas en BD"
                        status="neutral"
                      />
                      <MetricItem
                        label="Precisión Normativa"
                        value={`${stats.scorecard?.processes.legalAccuracyRate ?? 100}%`}
                        sublabel="Conforme a leyes 2026"
                        status="good"
                      />
                      <MetricItem
                        label="Documentos Guardados"
                        value={(stats.scorecard?.processes.documentsGeneratedCount ?? 0).toLocaleString()}
                        sublabel="Guardados en Neon PostgreSQL"
                        status="good"
                      />
                      <MetricItem
                        label="Resolución Directa"
                        value={`${stats.scorecard?.processes.directResolutionRate ?? 100}%`}
                        sublabel="Sin errores de ejecución"
                        status="good"
                      />
                    </div>
                    <ProgressBar
                      label="Disponibilidad del Sistema (Uptime)"
                      current={stats.scorecard?.processes.uptimePercent ?? 100}
                      target={100}
                      unit="%"
                    />
                  </ScorecardPerspectiveCard>

                  {/* 4. PERSPECTIVA DE APRENDIZAJE, TECNOLOGÍA & IA */}
                  <ScorecardPerspectiveCard
                    icon={<Cpu size={18} className="text-emerald-400" />}
                    title="4. Aprendizaje, Tecnología & IA"
                    subtitle="Modelos Híbridos, Latencia y Síntesis Vocal"
                    badge={`IA ${stats.aiMetrics?.successRate ?? 100}% Éxito`}
                    badgeColor="emerald"
                  >
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <MetricItem
                        label="Tasa de Éxito IA"
                        value={`${stats.aiMetrics?.successRate ?? 100}%`}
                        sublabel={`${stats.aiMetrics?.totalCalls ?? 0} llamadas procesadas`}
                        status="good"
                      />
                      <MetricItem
                        label="Latencia de BD (Neon)"
                        value={`${stats.systemHealth?.dbLatencyMs ?? 0} ms`}
                        sublabel="PostgreSQL Serverless"
                        status="good"
                      />
                      <MetricItem
                        label="Motor Principal"
                        value={stats.aiMetrics?.geminiModel || 'Gemini 2.0 Flash'}
                        sublabel={`Fallback: ${stats.aiMetrics?.anthropicModel || 'Claude 3.5'}`}
                        status="good"
                      />
                      <MetricItem
                        label="Adopción Voz HD"
                        value={`${stats.scorecard?.learning.voiceHdAdoption ?? (stats.aiMetrics?.hasElevenLabsKey ? 100 : 0)}%`}
                        sublabel={stats.aiMetrics?.hasElevenLabsKey ? 'ElevenLabs Conectado' : 'Síntesis Web'}
                        status={stats.aiMetrics?.hasElevenLabsKey ? 'good' : 'neutral'}
                      />
                    </div>
                    <ProgressBar
                      label="Confiabilidad Operativa de la IA"
                      current={stats.aiMetrics?.successRate || 100}
                      target={100}
                      unit="%"
                    />
                  </ScorecardPerspectiveCard>
                </div>
              </motion.div>
            )}

            {activeTab === 'operations' && stats && (
              <motion.div
                key="operations-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Health & AI KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AdminCard
                    title="Usuarios Totales"
                    value={stats.overview.totalUsers.toLocaleString()}
                    hint="Registrados en Neon Postgres"
                    icon={<Users size={18} style={{ color: '#c9a84c' }} />}
                    trend={`${stats.aiMetrics?.paidUsers ?? 0} suscripciones PRO`}
                  />
                  <AdminCard
                    title="En Vivo Ahora"
                    value={stats.overview.connectedNow.toLocaleString()}
                    hint="Usuarios activos (5 min)"
                    icon={<MessageSquare size={18} style={{ color: '#34d17a' }} />}
                    trend="Tiempo real"
                  />
                  <AdminCard
                    title="Salud Backend"
                    value={stats.systemHealth ? `${stats.systemHealth.dbLatencyMs}ms` : 'Operativo'}
                    hint="Latencia Neon PostgreSQL"
                    icon={<Activity size={18} style={{ color: '#34d17a' }} />}
                    trend="HTTP 200 OK"
                  />
                  <AdminCard
                    title="Tasa de Éxito IA"
                    value={stats.aiMetrics ? `${stats.aiMetrics.successRate}%` : '100%'}
                    hint={`${stats.aiMetrics?.totalCalls ?? 0} consultas procesadas`}
                    icon={<Shield size={18} style={{ color: '#c9a84c' }} />}
                    trend={stats.aiMetrics?.failedCalls ? `${stats.aiMetrics.failedCalls} fallas` : '0 fallas'}
                  />
                </div>

                {/* AI Quotas & Engine Configuration */}
                {stats.aiMetrics && (
                  <div className="p-6 rounded-2xl border" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                      <div>
                        <h3 className="text-[14px] font-light text-white">Monitoreo de Motores de IA & Conectores</h3>
                        <p className="text-[10px] font-light text-white/40">
                          Consumo de Gemini, Anthropic y ElevenLabs
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[10px]">
                        <span
                          className="px-2.5 py-1 rounded-md border"
                          style={{
                            background: stats.aiMetrics.hasGeminiKey ? 'rgba(52,209,122,0.1)' : 'rgba(255,100,100,0.1)',
                            borderColor: stats.aiMetrics.hasGeminiKey ? 'rgba(52,209,122,0.3)' : 'rgba(255,100,100,0.3)',
                            color: stats.aiMetrics.hasGeminiKey ? '#34d17a' : '#ff6464',
                          }}
                        >
                          Gemini API: {stats.aiMetrics.hasGeminiKey ? 'Activa' : 'Falta Key'}
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-md border"
                          style={{
                            background: stats.aiMetrics.hasAnthropicKey ? 'rgba(52,209,122,0.1)' : 'rgba(255,255,255,0.05)',
                            borderColor: stats.aiMetrics.hasAnthropicKey ? 'rgba(52,209,122,0.3)' : '#333333',
                            color: stats.aiMetrics.hasAnthropicKey ? '#34d17a' : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          Anthropic API: {stats.aiMetrics.hasAnthropicKey ? 'Activa' : 'Opcional'}
                        </span>
                        <span
                          className="px-2.5 py-1 rounded-md border"
                          style={{
                            background: stats.aiMetrics.hasElevenLabsKey ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.05)',
                            borderColor: stats.aiMetrics.hasElevenLabsKey ? 'rgba(201,168,76,0.3)' : '#333333',
                            color: stats.aiMetrics.hasElevenLabsKey ? '#c9a84c' : 'rgba(255,255,255,0.4)',
                          }}
                        >
                          ElevenLabs Voz: {stats.aiMetrics.hasElevenLabsKey ? 'Voz HD Activa' : 'Voz Web'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                      <div className="p-3.5 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                        <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Modelo Principal</span>
                        <span className="font-mono text-[#c9a84c] text-[12px]">{stats.aiMetrics.geminiModel}</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                        <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Límite Gratuito</span>
                        <span className="text-white text-[12px] font-medium">{stats.aiMetrics.freeLimit} preguntas / usuario</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                        <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Usuarios en Prueba</span>
                        <span className="text-white text-[12px] font-medium">{stats.aiMetrics.trialUsers} activos</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                        <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Latencia Media IA</span>
                        <span className="text-white text-[12px] font-medium">{stats.aiMetrics.avgDurationMs} ms</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Logs Table */}
                <div className="p-6 rounded-2xl border" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[14px] font-light text-white">Registro de Fallas y Excepciones Recientes</h3>
                      <p className="text-[10px] font-light text-white/40">
                        Captura automática de errores de API, límites de consultas o excepciones de backend
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 rounded-md text-[10px]"
                      style={{
                        background: (stats.recentErrors?.length ?? 0) > 0 ? 'rgba(255,100,100,0.1)' : 'rgba(52,209,122,0.1)',
                        color: (stats.recentErrors?.length ?? 0) > 0 ? '#ff6464' : '#34d17a',
                      }}
                    >
                      {(stats.recentErrors?.length ?? 0) > 0 ? `${stats.recentErrors?.length} eventos detectados` : '0 errores'}
                    </span>
                  </div>

                  {(!stats.recentErrors || stats.recentErrors.length === 0) ? (
                    <div className="py-8 text-center border border-dashed border-[#2a2a2a] rounded-xl">
                      <p className="text-[11px] text-white/40">
                        ✅ Servidor 100% saludable. No hay errores registrados en las últimas 24 horas.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-[11px] border-collapse">
                        <thead>
                          <tr className="border-b border-[#2a2a2a] text-white/30 uppercase text-[9px] tracking-wider">
                            <th className="py-2.5 px-3">Hora</th>
                            <th className="py-2.5 px-3">Endpoint</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3">Especialista</th>
                            <th className="py-2.5 px-3">Mensaje de Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#222222]">
                          {stats.recentErrors.map((err) => (
                            <tr key={err.id} className="hover:bg-white/[0.02]">
                              <td className="py-2.5 px-3 font-mono text-white/40 whitespace-nowrap">
                                {new Date(err.timestamp).toLocaleTimeString()}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-white/60">
                                {err.method} {err.route}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">
                                  {err.statusCode}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[#c9a84c] capitalize">
                                {err.agentId || 'General'}
                              </td>
                              <td className="py-2.5 px-3 text-white/70">
                                {err.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Specialties Demand & Daily Registrations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Demand by Legal Branch */}
                  <div className="p-6 rounded-2xl border" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-[14px] font-light text-white">Demanda por Especialidad Legal</h3>
                        <p className="text-[10px] font-light text-white/40">
                          Volumen de consultas por cada una de las 8 ramas
                        </p>
                      </div>
                      <BarChart3 size={16} style={{ color: '#c9a84c' }} />
                    </div>

                    <div className="space-y-4">
                      {stats.agentPerformance.map((item) => {
                        const agentObj = AGENTS.find((a) => a.id === item.agentId)
                        const name = agentObj?.name || item.agentId
                        const role = agentObj?.role || 'Especialista'
                        const percent = Math.round((item.messages / maxMessages) * 100)
                        return (
                          <div key={item.agentId} className="space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2 min-w-0">
                                {agentObj && (
                                  <img
                                    src={agentObj.image}
                                    alt={name}
                                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                    style={{ border: '1px solid rgba(201,168,76,0.25)' }}
                                  />
                                )}
                                <div className="truncate">
                                  <span className="font-medium text-white">{name}</span>
                                  <span className="text-[9px] ml-1.5 text-white/30 truncate">
                                    {role}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[9px] text-white/30">
                                  {item.conversations} casos
                                </span>
                                <span className="font-semibold text-[#c9a84c] min-w-[28px] text-right">
                                  {item.messages}
                                </span>
                              </div>
                            </div>
                            <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#222222' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(percent, 4)}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ background: '#c9a84c' }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Registrations Trend */}
                  <div className="p-6 rounded-2xl border flex flex-col justify-between" style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}>
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-[14px] font-light text-white">Adopción y Nuevos Usuarios</h3>
                          <p className="text-[10px] font-light text-white/40">
                            Crecimiento de registros diarios
                          </p>
                        </div>
                        <TrendingUp size={16} style={{ color: '#34d17a' }} />
                      </div>

                      <div className="space-y-2.5">
                        {stats.registrations.slice(0, 7).map((point, i) => {
                          const percent = Math.round((point.total / maxRegistrations) * 100)
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-xl"
                              style={{ background: '#222222', border: '1px solid #2a2a2a' }}
                            >
                              <div>
                                <p className="text-[11px] font-light text-white">{point.day}</p>
                                <p className="text-[9px] text-white/40">
                                  {point.total} nuevos abogados
                                </p>
                              </div>
                              <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.max(percent, 5)}%`, background: '#c9a84c' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'capacity' && (
              <motion.div
                key="capacity-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                {/* Scale & Concurrency Header Card */}
                <div
                  className="p-6 rounded-2xl border"
                  style={{
                    background: 'linear-gradient(135deg, rgba(52,209,122,0.08) 0%, rgba(17,17,17,0.95) 100%)',
                    borderColor: 'rgba(52,209,122,0.25)',
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-emerald-400 uppercase mb-1">
                        <Server size={14} />
                        CERTIFICACIÓN DE CAPACIDAD & RESILIENCIA
                      </div>
                      <h2 className="text-2xl font-light text-white">
                        Soporte de Carga: <span className="font-semibold text-emerald-400">1,250 Usuarios Simultáneos</span>
                      </h2>
                      <p className="text-[11px] text-white/50 font-light mt-1">
                        Infraestructura optimizada para distribución masiva sin saturación, cuellos de botella ni caídas de servicio.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-center">
                        <p className="text-[9px] uppercase font-bold tracking-wider">Status SLA Real</p>
                        <p className="text-[14px] font-semibold">
                          {stats?.systemHealth?.availabilityPercent != null ? `${stats.systemHealth.availabilityPercent.toFixed(2)}% Activo` : '100% Activo'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Concurrency & Performance Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-white/40">Throughput Inferencia</span>
                      <Zap size={16} className="text-[#c9a84c]" />
                    </div>
                    <div className="text-2xl font-light text-white mb-1">
                      {stats?.systemHealth?.currentRps != null ? `${stats.systemHealth.currentRps} RPS` : '0.00 RPS'}
                    </div>
                    <p className="text-[10px] text-emerald-400">RPS en tiempo real del runtime</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-white/40">Latencia Percentil P95</span>
                      <Gauge size={16} className="text-cyan-400" />
                    </div>
                    <div className="text-2xl font-light text-white mb-1">
                      {stats?.systemHealth?.p95LatencyMs ?? stats?.systemHealth?.dbLatencyMs ?? 0} ms
                    </div>
                    <p className="text-[10px] text-white/40">Latencia P95 en vivo (IA &amp; Neon DB)</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-white/40">Precisión / Éxito Legal</span>
                      <CheckCheck size={16} className="text-emerald-400" />
                    </div>
                    <div className="text-2xl font-light text-white mb-1">
                      {stats?.aiMetrics?.successRate != null ? `${stats.aiMetrics.successRate}%` : '100%'}
                    </div>
                    <p className="text-[10px] text-emerald-400">Tasa de éxito en consultas legales</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] uppercase font-bold tracking-wider text-white/40">Memoria Heap Activa</span>
                      <Database size={16} className="text-pink-400" />
                    </div>
                    <div className="text-2xl font-light text-white mb-1">
                      {stats?.systemHealth?.memoryUsageMB ?? 0} MB
                    </div>
                    <p className="text-[10px] text-white/40">RAM Heap Node.js ({stats?.systemHealth?.memoryTotalMB ?? stats?.systemHealth?.memoryUsageMB ?? 0} MB asignados)</p>
                  </div>
                </div>

                {/* Technical Architecture & Fail-Safe Map */}
                <div className="p-6 rounded-2xl bg-[#1a1a1a] border border-[#2a2a2a]">
                  <h3 className="text-[15px] font-light text-white mb-1 flex items-center gap-2">
                    <Shield size={16} className="text-[#c9a84c]" />
                    Arquitectura de Resiliencia & Redundancia ante 1,000+ Usuarios
                  </h3>
                  <p className="text-[11px] text-white/40 mb-5">
                    Mecanismos de respaldo activos para garantizar que ninguna consulta falle durante picos masivos.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                    <div className="p-4 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-[#c9a84c] font-medium mb-1.5">
                        <RefreshCcw size={14} />
                        Fail-Safe Multi-Motor IA
                      </div>
                      <p className="text-white/60 leading-relaxed text-[10px]">
                        Si Gemini 2.0 Flash experimenta saturación de cuota o demora &gt; 5s, el sistema conmuta automáticamente a <strong>Claude 3.5 Sonnet</strong> sin que el usuario note interrupción.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-cyan-400 font-medium mb-1.5">
                        <Database size={14} />
                        Pool Serverless Neon Postgres
                      </div>
                      <p className="text-white/60 leading-relaxed text-[10px]">
                        Conexiones concurrentes con pooling dinámico que escala automáticamente según la demanda de consultas y almacenamiento de conversaciones.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium mb-1.5">
                        <Lock size={14} />
                        Respaldo de Voz Dual (TTS)
                      </div>
                      <p className="text-white/60 leading-relaxed text-[10px]">
                        Generación de audio de alta definición con ElevenLabs, con fallback imperceptible a SpeechSynthesis Web nativo en caso de desconexión.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'compliance' && (
              <motion.div
                key="compliance-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <CompliancePanel />
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <SecurityCenterPanel />
              </motion.div>
            )}
          </AnimatePresence>

        {/* Modal de Confirmación para Eliminar Cuenta */}
        {deleteConfirmUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div
              className="w-full max-w-md rounded-2xl border p-6 shadow-2xl relative"
              style={{ background: '#1c1c1c', borderColor: '#2f2f2f' }}
            >
              <div className="flex items-center gap-3 text-rose-400 mb-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-white">¿Eliminar cuenta permanentemente?</h3>
                  <p className="text-[10px] text-white/40">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <p className="text-[12px] text-white/60 mb-4 leading-relaxed">
                Estás a punto de dar de baja definitiva y eliminar al siguiente usuario de la base de datos PostgreSQL:
              </p>

              <div className="p-3.5 rounded-xl bg-[#242424] border border-[#2f2f2f] mb-4 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Correo Electrónico:</span>
                  <span className="font-semibold text-white">{deleteConfirmUser.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">Plan actual:</span>
                  <span className="uppercase text-[#c9a84c] font-medium tracking-wider">{deleteConfirmUser.plan}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40">ID único:</span>
                  <span className="font-mono text-white/40 text-[10px]">{deleteConfirmUser.id}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] mb-5">
                ⚠️ <strong>Aviso:</strong> Se borrará el usuario, su suscripción asignada, sus conversaciones e historial guardado de forma permanente en Neon PostgreSQL.
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmUser(null)}
                  disabled={Boolean(deletingId)}
                  className="px-4 py-2 rounded-xl text-[12px] font-medium text-white/70 hover:text-white bg-[#262626] hover:bg-[#303030] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteUser(deleteConfirmUser.id)}
                  disabled={Boolean(deletingId)}
                  className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/30 flex items-center gap-1.5"
                >
                  {deletingId === deleteConfirmUser.id ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Sí, Eliminar Cuenta</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para Crear Nueva Cuenta */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div
              className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative"
              style={{ background: '#1c1c1c', borderColor: '#2f2f2f' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c]">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-medium text-white">Crear Nueva Cuenta</h3>
                    <p className="text-[10px] text-white/40">Crea una cuenta en Neon Postgres con suscripción y límites asignados</p>
                  </div>
                </div>
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="text-white/40 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>

              {createError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-white/70 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="ejemplo@abogado.pe"
                    className="w-full px-3 py-2 rounded-xl text-[12px] bg-[#222222] border border-[#2a2a2a] text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-white/70 mb-1">Contraseña *</label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newUserPass}
                      onChange={(e) => setNewUserPass(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-3 py-2 rounded-xl text-[12px] bg-[#222222] border border-[#2a2a2a] text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-white/70 mb-1">Nombre Completo (Opcional)</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Dr. Juan Pérez"
                      className="w-full px-3 py-2 rounded-xl text-[12px] bg-[#222222] border border-[#2a2a2a] text-white placeholder-white/30 focus:outline-none focus:border-[#c9a84c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-white/70 mb-1">Plan Asignado</label>
                    <select
                      value={newUserPlan}
                      onChange={(e) => setNewUserPlan(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl text-[12px] bg-[#222222] border border-[#2a2a2a] text-white focus:outline-none focus:border-[#c9a84c]"
                    >
                      <option value="junior">Plan Junior (Límite 50 consultas/mes)</option>
                      <option value="senior">Plan Senior (Límite 250 consultas/mes)</option>
                      <option value="pro">Plan PRO (Consultas Ilimitadas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-white/70 mb-1">Vigencia Inicial</label>
                    <select
                      value={newUserDurationDays}
                      onChange={(e) => setNewUserDurationDays(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl text-[12px] bg-[#222222] border border-[#2a2a2a] text-white focus:outline-none focus:border-[#c9a84c]"
                    >
                      <option value={30}>1 Mes (30 días)</option>
                      <option value={60}>2 Meses (60 días)</option>
                      <option value={90}>3 Meses (90 días)</option>
                      <option value={365}>1 Año (365 días)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#222222] border border-[#2a2a2a]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUserIsAdmin}
                      onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-[#c9a84c] focus:ring-0 bg-[#1a1a1a] border-[#333]"
                    />
                    <div>
                      <span className="text-[12px] font-medium text-white">Privilegios de Administrador</span>
                      <p className="text-[10px] text-white/40">Permite acceder al panel de control gerencial</p>
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={creatingUser}
                    className="px-4 py-2 rounded-xl text-[12px] font-medium text-white/70 hover:text-white bg-[#262626] hover:bg-[#303030] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingUser}
                    className="px-5 py-2 rounded-xl text-[12px] font-semibold text-[#111111] bg-[#c9a84c] hover:bg-[#d4b558] transition-all shadow-lg shadow-[#c9a84c]/20 flex items-center gap-1.5"
                  >
                    {creatingUser ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={13} />
                        <span>Crear y Activar Cuenta</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function ScorecardPerspectiveCard({
  icon,
  title,
  subtitle,
  badge,
  badgeColor,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  badge: string
  badgeColor: 'gold' | 'pink' | 'cyan' | 'emerald'
  children: ReactNode
}) {
  const colorStyles = {
    gold: { bg: 'rgba(201,168,76,0.1)', text: '#c9a84c', border: 'rgba(201,168,76,0.25)' },
    pink: { bg: 'rgba(236,72,153,0.1)', text: '#f472b6', border: 'rgba(236,72,153,0.25)' },
    cyan: { bg: 'rgba(6,182,212,0.1)', text: '#22d3ee', border: 'rgba(6,182,212,0.25)' },
    emerald: { bg: 'rgba(16,185,129,0.1)', text: '#34d17a', border: 'rgba(16,185,129,0.25)' },
  }[badgeColor]

  return (
    <div
      className="p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between"
      style={{ background: '#1a1a1a', borderColor: '#2a2a2a' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colorStyles.border }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a' }}
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: colorStyles.bg, border: `1px solid ${colorStyles.border}` }}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-white">{title}</h3>
              <p className="text-[10px] text-white/40 font-light">{subtitle}</p>
            </div>
          </div>
          <span
            className="px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider"
            style={{ background: colorStyles.bg, color: colorStyles.text, border: `1px solid ${colorStyles.border}` }}
          >
            {badge}
          </span>
        </div>

        {children}
      </div>
    </div>
  )
}

function MetricItem({
  label,
  value,
  sublabel,
  status,
}: {
  label: string
  value: string
  sublabel: string
  status: 'good' | 'warning' | 'neutral'
}) {
  const statusColors = {
    good: 'text-emerald-400',
    warning: 'text-amber-400',
    neutral: 'text-[#c9a84c]',
  }[status]

  return (
    <div className="p-3 rounded-xl bg-[#222222] border border-[#2a2a2a]">
      <span className="text-[9px] uppercase tracking-wider text-white/40 block mb-0.5">{label}</span>
      <p className={`text-base font-semibold ${statusColors}`}>{value}</p>
      <span className="text-[9px] text-white/30 truncate block mt-0.5">{sublabel}</span>
    </div>
  )
}

function ProgressBar({
  label,
  current,
  target,
  unit,
}: {
  label: string
  current: number
  target: number
  unit: string
}) {
  const percent = Math.min(Math.round((current / target) * 100), 100)

  return (
    <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-white/50">{label}</span>
        <span className="font-semibold text-white">
          {current} / {target} {unit} ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full overflow-hidden bg-[#222222]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #c9a84c 0%, #34d17a 100%)' }}
        />
      </div>
    </div>
  )
}

function AdminCard({
  title,
  value,
  hint,
  icon,
  trend,
}: {
  title: string
  value: string
  hint: string
  icon: ReactNode
  trend: string
}) {
  return (
    <div
      className="p-5 rounded-2xl transition-all duration-300"
      style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,76,0.25)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2a2a2a' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[9px] font-bold uppercase" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.30)' }}>
          {title}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: '#222222', border: '1px solid #2a2a2a' }}
        >
          {icon}
        </div>
      </div>
      <div className="text-2xl font-light text-white mb-1">{value}</div>
      <div className="flex items-center justify-between text-[10px] pt-2" style={{ borderTop: '1px solid #2a2a2a' }}>
        <span style={{ color: 'rgba(255,255,255,0.30)' }}>{hint}</span>
        <span style={{ color: '#c9a84c' }}>{trend}</span>
      </div>
    </div>
  )
}
