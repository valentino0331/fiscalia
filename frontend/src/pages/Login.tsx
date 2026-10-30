import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function Login() {
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(() => searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.auth.login({ email, password })
      login(res.token, res.user)
      navigate(res.user.isAdmin ? '/portal-interno' : '/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="w-screen h-screen flex items-center justify-center relative overflow-hidden select-none"
      style={{ background: '#111111' }}
    >
      {/* Ambient rotated texts */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute -left-16 top-1/3 text-[11px] tracking-[6px] uppercase"
          style={{
            color: 'rgba(255,255,255,0.08)',
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
            color: 'rgba(255,255,255,0.08)',
            transform: 'rotate(90deg)',
            transformOrigin: 'right center',
            fontWeight: 300,
            letterSpacing: '8px',
          }}
        >
          DERECHO PERUANO
        </span>
      </div>

      <div className="w-full max-w-[380px] px-6 flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <span
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 200,
              fontSize: '22px',
              letterSpacing: '7px',
              color: '#c8c0b0',
              textTransform: 'uppercase',
            }}
          >
            HARDMAN
          </span>
          <div
            style={{
              width: '20px',
              height: '0.5px',
              background: '#6b5f4a',
              marginTop: '6px',
            }}
          />
        </div>

        {/* Separator */}
        <div
          className="w-[280px] h-px mb-8"
          style={{
            background: 'linear-gradient(90deg, transparent, #2a2a2a, transparent)',
          }}
        />

        {/* Title */}
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
          <LoginInput
            placeholder="CORREO ELECTRÓNICO"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />

          <div className="relative">
            <LoginInput
              placeholder="CONTRASEÑA"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-colors"
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

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="group w-full py-3 rounded-lg text-[9px] uppercase tracking-[3px] transition-all duration-300 relative overflow-hidden disabled:opacity-40"
            style={{
              border: '0.5px solid #2a2a2a',
              background: 'transparent',
              color: 'rgba(255,255,255,0.60)',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c9a84c'
              e.currentTarget.style.color = '#c9a84c'
              e.currentTarget.style.boxShadow = '0 0 20px rgba(201,168,76,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a2a'
              e.currentTarget.style.color = 'rgba(255,255,255,0.60)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {loading ? (
              <Spinner />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Acceder
                <ArrowRight size={13} />
              </span>
            )}
          </button>

          {/* Recovery assistance link */}
          <div className="pt-1 text-center">
            <a
              href="https://wa.me/51929725274?text=Hola%20Hardman,%20necesito%20restablecer%20la%20contrase%C3%B1a%20de%20mi%20cuenta"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-white/40 hover:text-[#c9a84c] transition-colors"
            >
              ¿Olvidaste tu contraseña? Solicitar restablecimiento por WhatsApp
            </a>
          </div>
        </form>



        {/* Link a Presentación / Landing Page Oficial */}
        <div className="mt-6 text-center">
          <a
            href="/info"
            className="inline-flex items-center gap-1.5 text-[11px] text-[#c9a84c]/80 hover:text-[#dfbe63] transition-colors tracking-wide font-light"
          >
            <span>Conocer los 8 abogados con IA de Hardman</span>
            <span aria-hidden="true">&rarr;</span>
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

function LoginInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-transparent outline-none pb-3 text-[13px] font-light transition-colors duration-300"
      style={{
        borderBottom: '0.5px solid #2a2a2a',
        color: '#ffffff',
        caretColor: '#c9a84c',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderBottomColor = '#c9a84c'
        if (props.onFocus) props.onFocus(e)
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderBottomColor = '#2a2a2a'
        if (props.onBlur) props.onBlur(e)
      }}
    />
  )
}

function Spinner() {
  return (
    <svg className="animate-spin mx-auto" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#c9a84c" strokeWidth="3" />
      <path className="opacity-75" fill="#c9a84c" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
