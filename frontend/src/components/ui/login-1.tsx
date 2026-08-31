import * as React from 'react'
import { useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  placeholder?: string
  icon?: React.ReactNode
}

export const AppInput = (props: InputProps) => {
  const { label, placeholder, icon, ...rest } = props
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div className="w-full min-w-[200px] relative">
      {label && <label className="block mb-1 text-xs font-semibold text-[var(--color-text-primary)]">{label}</label>}
      <div className="relative w-full">
        <input
          type={props.type || 'text'}
          className="peer relative z-10 border-2 border-[var(--color-border)] h-11 w-full rounded-xl bg-[var(--color-surface)] px-4 font-normal text-[var(--color-heading)] outline-none drop-shadow-sm transition-all duration-200 ease-in-out focus:border-indigo-500 focus:bg-[var(--color-bg)] placeholder:text-[var(--color-text-secondary)] placeholder:font-normal text-sm"
          placeholder={placeholder}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          {...rest}
        />
        {isHovering && (
          <>
            <div
              className="absolute pointer-events-none top-0 left-0 right-0 h-[2px] z-20 rounded-t-xl overflow-hidden"
              style={{
                background: `radial-gradient(35px circle at ${mousePosition.x}px 0px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
            <div
              className="absolute pointer-events-none bottom-0 left-0 right-0 h-[2px] z-20 rounded-b-xl overflow-hidden"
              style={{
                background: `radial-gradient(35px circle at ${mousePosition.x}px 2px, var(--color-text-primary) 0%, transparent 70%)`,
              }}
            />
          </>
        )}
        {icon && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

interface Login1Props {
  onSubmit?: (e: React.FormEvent, data: { email: string; password: string }) => void
  error?: string
  loading?: boolean
  onToggleMode?: () => void
  isRegister?: boolean
}

export const Login1 = ({ onSubmit, error, loading, onToggleMode, isRegister }: Login1Props) => {
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const leftSection = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - leftSection.left,
      y: e.clientY - leftSection.top,
    })
  }

  const socialIcons = [
    {
      name: 'Instagram',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
        </svg>
      ),
      href: '#instagram',
      gradient: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
    },
    {
      name: 'TikTok',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.46V11.2a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-2-.63z" />
        </svg>
      ),
      href: '#tiktok',
      bg: 'bg-black',
    },
    {
      name: 'WhatsApp',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.59 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67ZM9.12 7.15C8.94 7.15 8.64 7.22 8.39 7.49C8.14 7.76 7.42 8.43 7.42 9.8C7.42 11.17 8.42 12.49 8.56 12.68C8.7 12.87 10.48 15.62 13.23 16.81C15.52 17.79 15.99 17.6 16.49 17.55C16.99 17.5 18.11 16.88 18.34 16.23C18.57 15.58 18.57 15.03 18.5 14.91C18.43 14.8 18.25 14.73 17.97 14.59C17.69 14.45 16.34 13.79 16.09 13.7C15.84 13.61 15.65 13.56 15.47 13.84C15.28 14.12 14.76 14.73 14.6 14.91C14.44 15.1 14.28 15.12 14 14.98C13.72 14.84 12.83 14.55 11.78 13.61C10.96 12.88 10.4 11.98 10.24 11.7C10.08 11.42 10.22 11.27 10.36 11.13C10.49 11 10.65 10.79 10.79 10.63C10.93 10.47 10.98 10.35 11.07 10.17C11.16 9.98 11.12 9.82 11.05 9.68C10.98 9.54 10.43 8.19 10.2 7.64C9.98 7.1 9.75 7.18 9.57 7.17C9.42 7.16 9.24 7.15 9.12 7.15Z" />
        </svg>
      ),
      href: '#whatsapp',
      bg: 'bg-[#25D366]',
    },
  ]

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(e, { email, password })
    }
  }

  return (
    <div className="w-screen h-screen min-h-screen flex flex-col lg:flex-row overflow-hidden bg-[var(--color-surface)] select-none">
      {/* Lado izquierdo con formulario interactivo 50% */}
      <div
        className="w-full lg:w-1/2 h-full flex flex-col justify-between px-6 sm:px-12 md:px-16 xl:px-24 py-6 relative overflow-hidden bg-[var(--color-surface)] border-r border-[var(--color-border)] z-10"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          className={`absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-pink-500/15 rounded-full blur-3xl transition-opacity duration-300 ${
            isHovering ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
            transition: 'transform 0.08s ease-out',
          }}
        />

        {/* Top Header */}
        <div className="flex items-center gap-3 relative z-10">
          <img
            src="/favicon.svg"
            alt="JurisClaude Logo"
            className="w-10 h-10 rounded-xl"
          />
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-heading)] block">
              JurisClaude
            </span>
            <span className="text-[10px] uppercase font-semibold text-[#D4AF37] tracking-widest">
              Inteligencia Jurídica
            </span>
          </div>
        </div>

        {/* Center Main Form */}
        <div className="form-container relative z-10 my-auto py-2 max-w-md w-full mx-auto">
          <form className="text-center grid gap-3.5 w-full" onSubmit={handleFormSubmit}>
            <div className="grid gap-1 mb-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--color-heading)] tracking-tight">
                {isRegister ? 'Crear Cuenta Jurídica' : 'Portal de Acceso'}
              </h1>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Inteligencia artificial y jurisprudencia especializada para el Perú
              </p>

              {/* Social icons: Instagram, TikTok, WhatsApp */}
              <div className="social-container mt-2.5">
                <div className="flex items-center justify-center">
                  <ul className="flex gap-3.5">
                    {socialIcons.map((social, index) => (
                      <li key={index} className="list-none">
                        <a
                          href={social.href}
                          title={social.name}
                          className="w-9 h-9 bg-[var(--color-muted-surface)] rounded-full flex justify-center items-center relative z-[1] border border-[var(--color-border)] overflow-hidden group transition-all duration-300 hover:scale-110 hover:border-[var(--color-text-primary)]"
                        >
                          <div
                            className={`absolute inset-0 w-full h-full ${
                              social.gradient || social.bg
                            } scale-y-0 origin-bottom transition-transform duration-500 ease-in-out group-hover:scale-y-100`}
                          />
                          <span className="text-[var(--color-text-primary)] transition-all duration-500 ease-in-out z-[2] group-hover:text-white group-hover:rotate-[360deg]">
                            {social.icon}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <span className="text-xs text-[var(--color-text-secondary)]">
              o accede con tus credenciales
            </span>

            <div className="grid gap-2.5 items-center text-left">
              <AppInput
                label="Correo Electrónico"
                placeholder="abogado@bufete.pe"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <AppInput
                label="Contraseña"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-md text-left">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center text-xs">
              <a href="#forgot" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <div className="flex gap-4 justify-center items-center mt-1">
              <button
                type="submit"
                disabled={loading}
                className="group/button relative w-full inline-flex justify-center items-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-in-out hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/30 cursor-pointer disabled:opacity-50"
              >
                <span className="relative z-10">
                  {loading ? 'Validando...' : isRegister ? 'Registrarse' : 'Ingresar al Bufete'}
                </span>
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-100%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(100%)]">
                  <div className="relative h-full w-12 bg-white/20" />
                </div>
              </button>
            </div>

            {onToggleMode && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {isRegister ? '¿Ya tienes una cuenta? ' : '¿Aún no eres miembro? '}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="text-[var(--color-text-primary)] hover:underline font-medium"
                >
                  {isRegister ? 'Inicia sesión' : 'Solicita tu acceso aquí'}
                </button>
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-[11px] text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border)]/60 flex justify-between items-center">
          <span>© {new Date().getFullYear()} Bufete IA • Perú</span>
          <span className="text-indigo-400 font-medium">Derecho & IA</span>
        </div>
      </div>

      {/* Lado derecho 50% exacto con fotografía cinematográfica Full-Bleed */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative overflow-hidden bg-slate-950">
        <img
          src="/law-firm-showcase.jpg"
          alt="Bufete de Abogados - Oficina ejecutiva y sala de juntas de alto nivel"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-75 hover:scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 flex flex-col justify-end p-10 xl:p-16 pointer-events-none">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0B2545]/90 backdrop-blur-md border border-[#D4AF37]/50 rounded-full text-xs font-bold text-white uppercase tracking-widest mb-4 shadow-xl">
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-white font-bold">Inteligencia Jurídica de Élite • Perú</span>
            </div>
            
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white mb-3 leading-tight tracking-tight drop-shadow-lg">
              El futuro de la práctica legal en tus manos.
            </h2>
            
            <p className="text-sm xl:text-base text-white leading-relaxed mb-6 font-normal drop-shadow">
              Eleva tu firma con 8 agentes entrenados en el marco jurídico peruano. Análisis de casos, dictámenes, jurisprudencia y precedentes en segundos.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/20 text-white text-xs sm:text-sm font-medium">
              <div className="flex items-center gap-2 text-white">
                <span className="text-[#D4AF37] text-base">⚖️</span>
                <span className="text-white">Jurisprudencia Vinculante</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="text-[#D4AF37] text-base">⚡</span>
                <span className="text-white">Redacción 10x más veloz</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="text-[#D4AF37] text-base">🔒</span>
                <span className="text-white">Secreto Profesional Cifrado</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <span className="text-[#D4AF37] text-base">🏛️</span>
                <span className="text-white">8 Especialidades del Derecho</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login1
