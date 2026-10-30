import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, ArrowRight, KeyRound, CheckCircle2, ChevronLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'change-password'>('login')
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState(() => searchParams.get('email') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Estados para Cambiar Contraseña
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!email.trim()) {
      setError('Por favor ingresa tu correo electrónico')
      return
    }

    if (!currentPassword) {
      setError('Por favor ingresa tu contraseña actual')
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden')
      return
    }

    if (currentPassword === newPassword) {
      setError('La nueva contraseña debe ser diferente a la contraseña actual')
      return
    }

    setLoading(true)
    try {
      const res = await api.auth.changePassword({
        email: email.trim(),
        currentPassword,
        newPassword,
      })

      setSuccessMsg(res.message || '¡Contraseña actualizada con éxito! Ingresando al sistema...')
      if (res.token && res.user) {
        setTimeout(() => {
          login(res.token, res.user)
          navigate(res.user.isAdmin ? '/portal-interno' : '/dashboard')
        }, 1200)
      } else {
        setTimeout(() => {
          setMode('login')
          setPassword(newPassword)
          setSuccessMsg('')
        }, 2000)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña')
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
        <div className="mb-6 text-center">
          <span
            className="relative pb-2 text-[11px] uppercase tracking-[3px] font-medium inline-block"
            style={{ color: '#ffffff' }}
          >
            {mode === 'login' ? 'Iniciar Sesión' : 'Cambiar Contraseña'}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{ height: '0.5px', background: '#c9a84c' }}
            />
          </span>
          {mode === 'change-password' && (
            <p className="text-[11px] text-white/45 mt-3 leading-relaxed max-w-[320px]">
              Ingresa tu correo, tu contraseña actual (o asignada) y define tu nueva clave personal.
            </p>
          )}
        </div>

        {/* Formulario Iniciar Sesión */}
        {mode === 'login' ? (
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3 rounded-lg text-[9px] uppercase tracking-[3px] transition-all duration-300 relative overflow-hidden disabled:opacity-40 cursor-pointer"
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

            {/* Opciones de Contraseña */}
            <div className="pt-1 flex flex-col items-center gap-2.5 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('change-password')
                  setError('')
                  setSuccessMsg('')
                }}
                className="inline-flex items-center gap-1.5 text-[11px] text-[#c9a84c] hover:text-[#dfbe63] font-medium transition-colors cursor-pointer"
              >
                <KeyRound size={12} />
                <span>¿Deseas cambiar tu contraseña? Actualizar aquí</span>
              </button>

              <a
                href="https://wa.me/51929725274?text=Hola%20Hardman,%20necesito%20restablecer%20la%20contrase%C3%B1a%20de%20mi%20cuenta"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-white/35 hover:text-white/60 transition-colors"
              >
                ¿Olvidaste tu contraseña? Solicitar restablecimiento por WhatsApp
              </a>
            </div>
          </form>
        ) : (
          /* Formulario Cambiar Contraseña */
          <form onSubmit={handleChangePassword} className="w-full space-y-4">
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1">
                Correo Electrónico *
              </label>
              <LoginInput
                placeholder="TU CORREO REGISTRADO"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1">
                Contraseña Actual *
              </label>
              <div className="relative">
                <LoginInput
                  placeholder="CONTRASEÑA ACTUAL O ASIGNADA"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-colors cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1">
                Nueva Contraseña * (Mín. 6 caracteres)
              </label>
              <div className="relative">
                <LoginInput
                  placeholder="NUEVA CONTRASEÑA"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-colors cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider text-white/40 mb-1">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <LoginInput
                  placeholder="REPITE LA NUEVA CONTRASEÑA"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 transition-colors cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
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
                  background: 'rgba(255,107,107,0.08)',
                  border: '1px solid rgba(255,107,107,0.15)',
                }}
              >
                {error}
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5"
                style={{
                  color: '#34d17a',
                  background: 'rgba(52,209,122,0.10)',
                  border: '1px solid rgba(52,209,122,0.30)',
                }}
              >
                <CheckCircle2 size={13} className="text-[#34d17a] flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3 rounded-lg text-[9px] uppercase tracking-[3px] transition-all duration-300 relative overflow-hidden disabled:opacity-40 cursor-pointer mt-2"
              style={{
                border: '0.5px solid #c9a84c',
                background: 'rgba(201,168,76,0.12)',
                color: '#dfbe63',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#c9a84c'
                e.currentTarget.style.color = '#111111'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(201,168,76,0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(201,168,76,0.12)'
                e.currentTarget.style.color = '#dfbe63'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {loading ? (
                <Spinner />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Actualizar e Ingresar
                  <ArrowRight size={13} />
                </span>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login')
                  setError('')
                  setSuccessMsg('')
                }}
                className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft size={13} />
                <span>Volver a Iniciar Sesión</span>
              </button>
            </div>
          </form>
        )}



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
