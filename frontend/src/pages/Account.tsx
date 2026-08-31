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
            <div className="p-8 space-y-6 relative z-20">
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
                        background: 'rgba(201,168,76,0.10)',
                        border: '1px solid rgba(201,168,76,0.25)',
                        color: '#c9a84c',
                        letterSpacing: '1.5px',
                      }}
                    >
                      PRO
                    </span>
                  </div>
                  <h4 className="text-[15px] font-light text-white">Membresía Ilimitada</h4>
                  <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    Acceso total a los 8 especialistas en derecho peruano.
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

              {/* Perks */}
              <div className="space-y-2.5">
                <h5 className="text-[8px] font-bold uppercase" style={{ letterSpacing: '3px', color: 'rgba(255,255,255,0.25)' }}>
                  BENEFICIOS
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.60)' }}>
                  {[
                    '8 Áreas del Derecho Peruano',
                    'Respuesta inmediata 24/7',
                    'Exportación de dictámenes',
                    'Cifrado de secreto profesional',
                  ].map((perk) => (
                    <div key={perk} className="flex items-center gap-2">
                      <CheckCircle2 size={13} style={{ color: '#c9a84c' }} />
                      <span>{perk}</span>
                    </div>
                  ))}
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
