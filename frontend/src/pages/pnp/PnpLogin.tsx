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
      className="w-screen h-screen flex items-center justify-center relative overflow-hidden select-none"
      style={{ background: '#071715' }}
    >
      {/* Ambient rotated texts */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute -left-16 top-1/3 text-[11px] tracking-[6px] uppercase"
          style={{
            color: 'rgba(255,255,255,0.06)',
            transform: 'rotate(-90deg)',
            transformOrigin: 'left center',
            fontWeight: 300,
            letterSpacing: '8px',
          }}
        >
          INTELIGENCIA JURÍDICA
        </span>
        <span
          className="absolute -right-12 top-1/2 text-[11px] tracking-[6px] uppercase"
          style={{
            color: 'rgba(255,255,255,0.06)',
            transform: 'rotate(90deg)',
            transformOrigin: 'right center',
            fontWeight: 300,
            letterSpacing: '8px',
          }}
        >
          DERECHO POLICIAL PERUANO
        </span>
      </div>

      <div className="w-full max-w-[380px] px-6 flex flex-col items-center">
        {/* Logo - Montserrat thin 200 + Line under D + Bordered PNP badge */}
        <HardmanPnpLogo size="lg" className="mb-8" color="#f4f1ea" />

        {/* Separator */}
        <div
          className="w-[280px] h-px mb-8"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(27, 85, 78, 0.4), transparent)',
          }}
        />

        {/* Title: Exactly "INICIAR SESIÓN" */}
        <div className="mb-8">
          <span
            className="relative pb-2 text-[11px] uppercase tracking-[3px] font-medium"
            style={{ color: '#ffffff' }}
          >
            Iniciar Sesión
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: '0.5px', background: '#c9a84c' }}
            />
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <input
            placeholder="CORREO ELECTRÓNICO"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            className="w-full bg-transparent outline-none pb-3 text-[13px] font-light transition-colors duration-300"
            style={{
              borderBottom: '0.5px solid rgba(27, 85, 78, 0.6)',
              color: '#ffffff',
              caretColor: '#c9a84c',
            }}
            onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#c9a84c')}
            onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(27, 85, 78, 0.6)')}
          />

          <div className="relative">
            <input
              placeholder="CONTRASEÑA"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none pb-3 text-[13px] font-light transition-colors duration-300"
              style={{
                borderBottom: '0.5px solid rgba(27, 85, 78, 0.6)',
                color: '#ffffff',
                caretColor: '#c9a84c',
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = '#c9a84c')}
              onBlur={(e) => (e.currentTarget.style.borderBottomColor = 'rgba(27, 85, 78, 0.6)')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-colors cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] px-3 py-2 rounded-lg"
              style={{
                color: '#ff6b6b',
                background: 'rgba(255,107,107,0.08)',
                border: '1px solid rgba(255,107,107,0.15)',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Submit button: EXACTLY "ACCEDER ->" */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full py-3 rounded-lg text-[9px] uppercase tracking-[3px] transition-all duration-300 relative overflow-hidden disabled:opacity-40 cursor-pointer"
            style={{
              border: '0.5px solid rgba(27, 85, 78, 0.6)',
              background: 'transparent',
              color: 'rgba(255,255,255,0.70)',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c9a84c'
              e.currentTarget.style.color = '#c9a84c'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(201,168,76,0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(27, 85, 78, 0.6)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.70)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {loading ? (
              <span className="text-[10px] tracking-widest text-[#c9a84c]">ACCEDIENDO...</span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Acceder
                <ArrowRight size={13} />
              </span>
            )}
          </button>
        </form>

        {/* Demo Fast Access Link */}
        <div className="mt-7 text-center">
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            className="inline-flex items-center gap-1.5 text-[11px] text-[#c9a84c]/90 hover:text-[#dfbe63] transition-colors tracking-wide font-light cursor-pointer"
          >
            <span>Acceso directo de prueba (Demo Cármenes)</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-5 text-center">
          <a
            href="/pnp"
            className="text-[10px] text-white/35 hover:text-white/70 transition-colors uppercase tracking-widest"
          >
            &larr; Volver a Hardman PNP
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center" style={{ fontSize: '10px', color: 'rgba(255,255,255,0.20)' }}>
          © 2026 Hardman · Perú
        </div>
      </div>
    </div>
  )
}
