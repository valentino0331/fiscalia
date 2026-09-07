import { useState, useEffect, useRef, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, LogOut, User, CheckCircle2,
  Shield, Zap, Award
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import JurisClaudeLogo from '@/components/brand/JurisClaudeLogo'

interface AccountData {
  user: { id: string; email: string; name: string | null; isAdmin: boolean }
  subscription: {
    status: string
    plan: string
    currentPeriodEnd: string | null
  } | null
}

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)

  const cardRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  useEffect(() => {
    api.account.get()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-light transition-colors"
            style={{ color: 'rgba(255,255,255,0.40)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)' }}
          >
            <ChevronLeft size={14} />
            Dashboard
          </button>
          <div className="w-px h-4" style={{ background: '#2a2a2a' }} />
          <JurisClaudeLogo size="sm" />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-light transition-all"
          style={{
            color: 'rgba(255,255,255,0.40)',
            border: '1px solid #2a2a2a',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,100,100,0.30)'
            e.currentTarget.style.color = '#ff6464'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2a2a'
            e.currentTarget.style.color = 'rgba(255,255,255,0.40)'
          }}
        >
          <LogOut size={13} />
          Cerrar sesión
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 relative z-10 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="rounded-[14px] overflow-hidden relative transition-all duration-300"
            style={{
              background: '#1a1a1a',
              border: `1px solid ${isHovered ? 'rgba(201,168,76,0.25)' : '#2a2a2a'}`,
              boxShadow: isHovered ? '0 15px 40px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {/* Glow */}
            <div
              className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
              style={{
                opacity: isHovered ? 1 : 0,
                background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(201,168,76,0.08), transparent 80%)`,
              }}
            />

            {/* Profile header */}
            <div className="p-8 pb-6 text-center border-b relative z-20" style={{ borderColor: '#2a2a2a' }}>
              <div className="relative inline-block mb-4">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-light"
                  style={{
                    background: 'rgba(201,168,76,0.10)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: '#c9a84c',
                  }}
                >
                  {initials}
                </div>
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: '#34d17a', border: '2px solid #1a1a1a' }}
                >
                  <CheckCircle2 size={11} className="text-white" />
                </span>
              </div>

              <h2 className="text-xl font-light text-white tracking-wide mb-1">
                {user?.name || 'Usuario'}
              </h2>
              <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {user?.email}
              </p>

              {user?.isAdmin && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-semibold uppercase mt-3"
                  style={{
                    background: 'rgba(201,168,76,0.10)',
                    border: '1px solid rgba(201,168,76,0.25)',
                    color: '#c9a84c',
                    letterSpacing: '2px',
                  }}
                >
                  <Award size={11} />
                  Administrador
                </div>
              )}
            </div>

            {/* Plan details */}
            <div className="p-6 sm:p-8 space-y-6 relative z-20">
              {/* Active Plan Banner */}
              <div
                className="p-5 rounded-xl flex items-center justify-between"
                style={{ background: '#222222', border: '1px solid #2a2a2a' }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.30)' }}>
                      Plan Activo
                    </span>
                    <span
                      className="px-2 py-0.5 rounded text-[8px] font-bold uppercase"
                      style={{
                        background: (data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal' ? 'rgba(52,209,122,0.15)' : 'rgba(201,168,76,0.15)'),
                        border: `1px solid ${data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal' ? 'rgba(52,209,122,0.35)' : 'rgba(201,168,76,0.35)'}`,
                        color: data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal' ? '#34d17a' : '#c9a84c',
                        letterSpacing: '1.5px',
                      }}
                    >
                      {data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal' ? 'PLAN JUNIOR' : 'PLAN SENIOR'}
                    </span>
                  </div>
                  <h4 className="text-[15px] font-light text-white">
                    {data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal' ? 'Membresía Junior (S/ 39/mes)' : 'Membresía Senior Ilimitada (S/ 69/mes)'}
                  </h4>
                  <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    {data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal'
                      ? '50 consultas mensuales con acceso a los 8 agentes especializados y subida de expedientes.'
                      : 'Consultas ilimitadas con acceso a los 8 agentes especializados y soporte WhatsApp prioritario.'}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'rgba(201,168,76,0.10)',
                    border: '1px solid rgba(201,168,76,0.20)',
                    color: '#c9a84c',
                  }}
                >
                  <Zap size={20} />
                </div>
              </div>

              {/* Plans Comparison Grid */}
              <div className="space-y-3">
                <h5 className="text-[9px] font-bold uppercase tracking-widest text-white/30">
                  ESTRUCTURA DE PLANES HARDMAN
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Plan Junior */}
                  <div
                    className="p-4 rounded-xl border space-y-3 relative"
                    style={{
                      background: '#161616',
                      borderColor: (data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal') ? '#34d17a' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#34d17a]">
                          PLAN JUNIOR
                        </span>
                        <div className="text-lg font-bold text-white mt-0.5">
                          S/ 39 <span className="text-[11px] font-normal text-white/50">/ mes</span>
                        </div>
                      </div>
                      {(data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal') && (
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold">
                      🎁 1er mes gratis para fundadores
                    </div>
                    <p className="text-[11px] text-white/50 leading-snug">
                      Ideal para litigantes individuales y bachilleres que necesitan soporte legal automatizado.
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-white/70">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#34d17a] flex-shrink-0" />
                        <span className="font-semibold text-white">50 consultas mensuales</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#34d17a] flex-shrink-0" />
                        <span>8 agentes especializados (acceso total)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#34d17a] flex-shrink-0" />
                        <span>Subida de documentos (PDF, expedientes)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#34d17a] flex-shrink-0" />
                        <span>Soporte por email</span>
                      </li>
                    </ul>
                  </div>

                  {/* Plan Senior */}
                  <div
                    className="p-4 rounded-xl border space-y-3 relative"
                    style={{
                      background: '#161616',
                      borderColor: (data?.subscription?.plan !== 'junior' && data?.subscription?.plan !== 'normal') ? '#c9a84c' : 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">
                          PLAN SENIOR
                        </span>
                        <div className="text-lg font-bold text-white mt-0.5">
                          S/ 69 <span className="text-[11px] font-normal text-white/50">/ mes</span>
                        </div>
                      </div>
                      {(data?.subscription?.plan !== 'junior' && data?.subscription?.plan !== 'normal') && (
                        <span className="text-[8px] bg-[#c9a84c]/20 text-[#c9a84c] font-bold px-2 py-0.5 rounded-full border border-[#c9a84c]/30">
                          ACTUAL
                        </span>
                      )}
                    </div>
                    <div className="inline-block px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20 text-[10px] text-gold-400 font-semibold">
                      🎁 1er mes gratis para fundadores
                    </div>
                    <p className="text-[11px] text-white/50 leading-snug">
                      Para abogados litigantes y estudios que exigen máxima capacidad y atención directa.
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-white/70">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span className="font-semibold text-white">Consultas ilimitadas</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span>8 agentes especializados (acceso total)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span>Subida de documentos (PDF, expedientes)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span className="font-semibold text-white">Soporte por WhatsApp prioritario (929 727 274)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span>Generación judicial en Word (.docx)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {user?.isAdmin && (
                <button
                  onClick={() => navigate('/portal-interno')}
                  className="w-full py-3 rounded-lg text-[10px] font-semibold uppercase flex items-center justify-center gap-2 transition-all"
                  style={{
                    letterSpacing: '2px',
                    border: '1px solid rgba(201,168,76,0.25)',
                    background: 'rgba(201,168,76,0.10)',
                    color: '#c9a84c',
                  }}
                >
                  <Shield size={14} />
                  Portal Interno de Administración
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
