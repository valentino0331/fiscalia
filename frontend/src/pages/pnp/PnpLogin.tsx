import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import HardmanPnpLogo from '@/components/brand/HardmanPnpLogo'

export default function PnpLogin() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(() => searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const sanitizePnpUser = (u: any) => {
    const name = u?.name || ''
    if (!name || name.toLowerCase().includes('abogado')) {
      return { ...u, name: 'Valentino Marca' }
    }
    return u
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login({ email, password })
      login(res.token, sanitizePnpUser(res.user))
      navigate('/pnp/despacho')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoAccess = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.demoLogin()
      login(res.token, sanitizePnpUser(res.user))
      navigate('/pnp/despacho')
    } catch {
      const dummyUser = {
        id: 'pnp-demo-user',
        email: 'valentino.pnp@hardman.lat',
        name: 'Valentino Marca',
        isAdmin: false,
      }
      login('pnp-demo-token-' + Date.now(), dummyUser)
      navigate('/pnp/despacho')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="w-screen h-screen flex items-center justify-center relative overflow-hidden select-none p-4"
      style={{
        background: 'radial-gradient(ellipse at 50% 20%, #0d3830 0%, #082620 50%, #041713 100%)',
      }}
    >
      {/* Ambient subtle police glow */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] rounded-full blur-3xl opacity-20"
        style={{
          background: 'radial-gradient(circle, #2daf96 0%, #c9a84c 50%, transparent 100%)',
        }}
      />

      {/* Ambient subtle institutional watermark texts */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute -left-16 top-1/3 text-[11px] tracking-[6px] uppercase"
          style={{
            color: 'rgba(45, 175, 150, 0.12)',
            transform: 'rotate(-90deg)',
            transformOrigin: 'left center',
            fontWeight: 400,
            letterSpacing: '8px',
          }}
        >
          INTELIGENCIA JURÍDICA
        </span>
        <span
          className="absolute -right-12 top-1/2 text-[11px] tracking-[6px] uppercase"
          style={{
            color: 'rgba(45, 175, 150, 0.12)',
            transform: 'rotate(90deg)',
            transformOrigin: 'right center',
            fontWeight: 400,
            letterSpacing: '8px',
          }}
        >
          POLICÍA NACIONAL DEL PERÚ
        </span>
      </div>

      {/* Glassmorphic Login Card with Chat Emerald Palette */}
      <div
        className="w-full max-w-[420px] p-8 sm:p-10 rounded-2xl flex flex-col items-center relative z-10"
        style={{
          background: 'rgba(8, 38, 32, 0.85)',
          border: '1px solid rgba(45, 175, 150, 0.35)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 35px rgba(45, 175, 150, 0.12)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Logo */}
        <HardmanPnpLogo size="lg" className="mb-6" color="#f4f1ea" />

        {/* Separator with gold-emerald accent */}
        <div
          className="w-[240px] h-px mb-6"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(201, 168, 76, 0.5), transparent)',
          }}
        />

        {/* Title */}
        <div className="mb-6 text-center">
          <span
            className="text-xs uppercase tracking-[3px] font-semibold block"
            style={{ color: '#ffffff' }}
          >
            Acceso al Despacho PNP
          </span>
          <span className="text-[11px] font-light mt-1 block" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
            Documentación Operativa y Defensa Policial
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1 font-medium" style={{ color: '#dfbe63' }}>
              Correo Electrónico
            </label>
            <input
              placeholder="nombre@hardman.pe"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full rounded-xl px-3.5 py-2.5 text-xs font-light transition-all outline-none"
              style={{
                background: 'rgba(6, 30, 25, 0.9)',
                border: '1px solid rgba(45, 175, 150, 0.35)',
                color: '#ffffff',
                caretColor: '#dfbe63',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#c9a84c'
                e.currentTarget.style.boxShadow = '0 0 12px rgba(201, 168, 76, 0.2)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.35)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider mb-1 font-medium" style={{ color: '#dfbe63' }}>
              Contraseña
            </label>
            <div className="relative">
              <input
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-3.5 py-2.5 text-xs font-light transition-all outline-none pr-10"
                style={{
                  background: 'rgba(6, 30, 25, 0.9)',
                  border: '1px solid rgba(45, 175, 150, 0.35)',
                  color: '#ffffff',
                  caretColor: '#dfbe63',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#c9a84c'
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(201, 168, 76, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.35)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 transition-colors cursor-pointer"
                style={{ color: 'rgba(244, 241, 234, 0.45)' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] px-3 py-2 rounded-lg"
              style={{
                color: '#ff6b6b',
                background: 'rgba(255,107,107,0.12)',
                border: '1px solid rgba(255,107,107,0.25)',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Submit button: Gold gradient */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-xs uppercase tracking-[2px] font-bold transition-all shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-40 cursor-pointer flex items-center justify-center gap-2 mt-2"
            style={{
              background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
              color: '#061e19',
              boxShadow: '0 4px 18px rgba(201, 168, 76, 0.25)',
            }}
          >
            {loading ? (
              <span className="text-[11px] tracking-widest text-[#061e19]">ACCEDIENDO...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Ingresar al Despacho
                <ArrowRight size={14} />
              </span>
            )}
          </button>
        </form>

        {/* Demo Fast Access Link */}
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-xs text-[#dfbe63] hover:text-[#f3deb1] transition-colors tracking-wide font-medium cursor-pointer"
          >
            <span>Acceso directo de prueba (Demo Cármenes)</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <a
            href="/pnp"
            className="text-[10px] text-white/45 hover:text-white/80 transition-colors uppercase tracking-widest"
          >
            &larr; Volver a Hardman PNP
          </a>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center" style={{ fontSize: '10px', color: 'rgba(244, 241, 234, 0.35)' }}>
          © 2026 Hardman · Policía Nacional del Perú
        </div>
      </div>
    </div>
  )
}
