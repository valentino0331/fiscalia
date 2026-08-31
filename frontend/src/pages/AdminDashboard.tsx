import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity, Users, MessageSquare, CreditCard, LogOut, ChevronLeft,
  Shield, TrendingUp, RefreshCw, BarChart3
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { AGENTS } from '@/lib/agents'
import type { AdminStats } from '@/types'
import JurisClaudeLogo from '@/components/brand/JurisClaudeLogo'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const res = await api.admin.stats()
      setStats(res)
      setError('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard administrativo')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const maxRegistrations = useMemo(() => {
    if (!stats || stats.registrations.length === 0) return 1
    return Math.max(...stats.registrations.map((p) => p.total), 1)
  }, [stats])

  const maxMessages = useMemo(() => {
    if (!stats || stats.agentPerformance.length === 0) return 1
    return Math.max(...stats.agentPerformance.map((a) => a.messages), 1)
  }, [stats])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#111111' }}>
      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-6 md:px-12 sticky top-0 z-40 border-b"
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
            Volver
          </button>
          <div className="w-px h-4" style={{ background: '#2a2a2a' }} />
          <JurisClaudeLogo size="sm" />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="p-2 rounded-lg transition-all"
            style={{ color: refreshing ? '#c9a84c' : 'rgba(255,255,255,0.30)' }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <div className="w-px h-4" style={{ background: '#2a2a2a' }} />
          <p className="text-[11px] font-light hidden sm:block" style={{ color: 'rgba(255,255,255,0.30)' }}>
            {user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-light transition-all"
            style={{ color: 'rgba(255,255,255,0.40)', border: '1px solid #2a2a2a' }}
          >
            <LogOut size={13} />
            Salir
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-[9px] font-semibold uppercase mb-3"
              style={{
                background: 'rgba(201,168,76,0.10)',
                border: '1px solid rgba(201,168,76,0.25)',
                color: '#c9a84c',
                letterSpacing: '2px',
              }}
            >
              <Shield size={11} />
              Panel Operativo
            </div>
            <h1 className="text-2xl font-light text-white tracking-wide">
              Métricas & Rendimiento
            </h1>
            <p className="text-[11px] font-light mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>
              Monitoreo en tiempo real de consultas legales y usuarios activos.
            </p>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-light self-start md:self-auto"
            style={{ border: '1px solid #2a2a2a', color: 'rgba(255,255,255,0.40)' }}
          >
            <span className="w-[6px] h-[6px] rounded-full dot-online" style={{ background: '#c9a84c' }} />
            Actualización en vivo
          </div>
        </div>

        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <div
            className="p-4 rounded-xl text-[12px] mb-6 flex items-center justify-between"
            style={{
              background: 'rgba(255,100,100,0.08)',
              border: '1px solid rgba(255,100,100,0.15)',
              color: '#ff6464',
            }}
          >
            <span>{error}</span>
            <button onClick={fetchStats} className="underline font-medium">Reintentar</button>
          </div>
        )}

        {stats && !loading && (
          <>
            {/* Health & AI KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <AdminCard
                title="Usuarios"
                value={stats.overview.totalUsers.toLocaleString()}
                hint="Registrados en base de datos"
                icon={<Users size={18} style={{ color: '#c9a84c' }} />}
                trend={`${stats.aiMetrics?.paidUsers ?? 0} suscripciones`}
              />
              <AdminCard
                title="En Vivo"
                value={stats.overview.connectedNow.toLocaleString()}
                hint="Usuarios activos (5 min)"
                icon={<MessageSquare size={18} style={{ color: '#34d17a' }} />}
                trend="Tiempo real"
              />
              <AdminCard
                title="Salud Backend"
                value={stats.systemHealth ? `${stats.systemHealth.dbLatencyMs}ms` : 'Operativo'}
                hint="Latencia de BD (Neon Postgres)"
                icon={<Activity size={18} style={{ color: '#34d17a' }} />}
                trend="Estado 200 OK"
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
              <div className="p-6 rounded-xl mb-6" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="text-[14px] font-light text-white">Monitoreo de Motores de IA & Límites</h3>
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
                      ElevenLabs Voz: {stats.aiMetrics.hasElevenLabsKey ? 'Voz HD' : 'Voz Web'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[11px]">
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-[#2a2a2a]">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Modelo Principal</span>
                    <span className="font-mono text-[#c9a84c] text-[12px]">{stats.aiMetrics.geminiModel}</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-[#2a2a2a]">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Límite Gratuito</span>
                    <span className="text-white text-[12px] font-medium">{stats.aiMetrics.freeLimit} preguntas / usuario</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-[#2a2a2a]">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Usuarios en Prueba</span>
                    <span className="text-white text-[12px] font-medium">{stats.aiMetrics.trialUsers} activos</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-[#2a2a2a]">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 block mb-1">Tiempo Promedio</span>
                    <span className="text-white text-[12px] font-medium">{stats.aiMetrics.avgDurationMs} ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Logs Table */}
            <div className="p-6 rounded-xl mb-6" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-[14px] font-light text-white">Registro de Fallas y Errores Recientes</h3>
                  <p className="text-[10px] font-light text-white/40">
                    Captura automática de fallas de IA, límites excedidos o excepciones del backend
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
                <div className="py-8 text-center border border-dashed border-[#2a2a2a] rounded-lg">
                  <p className="text-[11px] text-white/40">
                    ✅ Todo en orden. No hay fallas registradas en el backend ni en las llamadas de IA.
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Agent performance */}
              <div className="p-6 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-[14px] font-light text-white">Demanda por Especialidad</h3>
                    <p className="text-[10px] font-light" style={{ color: 'rgba(255,255,255,0.30)' }}>
                      Interacciones por especialista
                    </p>
                  </div>
                  <BarChart3 size={16} style={{ color: '#c9a84c' }} />
                </div>

                <div className="space-y-4">
                  {stats.agentPerformance.map((item) => {
                    const agentObj = AGENTS.find((a) => a.id === item.agentId)
                    const name = agentObj?.name || item.agentId
                    const percent = Math.round((item.messages / maxMessages) * 100)
                    return (
                      <div key={item.agentId} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            {agentObj && (
                              <img
                                src={agentObj.image}
                                alt={name}
                                className="w-5 h-5 rounded-full object-cover"
                                style={{ border: '1px solid rgba(201,168,76,0.20)' }}
                              />
                            )}
                            <span className="font-light text-white">{name}</span>
                            <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                              ({item.conversations} casos)
                            </span>
                          </div>
                          <span style={{ color: '#c9a84c' }}>{item.messages}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#222222' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
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

              {/* Registrations */}
              <div className="p-6 rounded-xl flex flex-col justify-between" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-[14px] font-light text-white">Adopción</h3>
                      <p className="text-[10px] font-light" style={{ color: 'rgba(255,255,255,0.30)' }}>
                        Crecimiento de usuarios
                      </p>
                    </div>
                    <TrendingUp size={16} style={{ color: '#34d17a' }} />
                  </div>

                  <div className="space-y-2.5">
                    {stats.registrations.slice(0, 5).map((point, i) => {
                      const percent = Math.round((point.total / maxRegistrations) * 100)
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 rounded-lg"
                          style={{ background: '#222222', border: '1px solid #2a2a2a' }}
                        >
                          <div>
                            <p className="text-[11px] font-light text-white">{point.day}</p>
                            <p className="text-[9px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                              {point.total} nuevos
                            </p>
                          </div>
                          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                            <div className="h-full rounded-full" style={{ width: `${percent}%`, background: '#c9a84c' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
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
      className="p-5 rounded-xl transition-all duration-300"
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
