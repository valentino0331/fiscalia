import React from 'react'
import { useNavigate } from 'react-router-dom'
import HardmanPnpLogo from './HardmanPnpLogo'

interface HardmanPnpNavbarProps {
  onPagarClick?: () => void
}

export default function HardmanPnpNavbar({ onPagarClick }: HardmanPnpNavbarProps) {
  const navigate = useNavigate()

  const handlePagar = () => {
    if (onPagarClick) {
      onPagarClick()
    } else {
      const el = document.getElementById('planes')
      if (el) {
        const top = el.getBoundingClientRect().top + window.pageYOffset - 84
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      } else {
        navigate('/pnp/login')
      }
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 w-full backdrop-blur-[14px]"
      style={{
        background: 'rgba(6, 23, 21, 0.96)',
        borderBottom: '1px solid rgba(27, 85, 78, 0.35)',
      }}
    >
      <div
        className="w-full mx-auto flex items-center justify-between"
        style={{
          height: '76px',
          padding: '0 42px',
          maxWidth: '1720px',
        }}
      >
        {/* Brand Logo: HARDMAN + BORDERED PNP BADGE with Line Under D */}
        <HardmanPnpLogo size="md" onClick={() => navigate('/pnp')} />

        {/* Center Nav Links */}
        <div className="hidden lg:flex items-center gap-[22px]">
          <a
            href="#especialistas"
            className="text-[0.74rem] font-semibold tracking-[0.08em] uppercase no-underline transition-colors hover:text-[#c9a84c]"
            style={{ color: 'rgba(244, 241, 234, 0.75)' }}
          >
            ESPECIALISTAS
          </a>
          <a
            href="#como"
            className="text-[0.74rem] font-semibold tracking-[0.08em] uppercase no-underline transition-colors hover:text-[#c9a84c]"
            style={{ color: 'rgba(244, 241, 234, 0.75)' }}
          >
            CÓMO FUNCIONA
          </a>
          <a
            href="#demostracion"
            className="text-[0.74rem] font-semibold tracking-[0.08em] uppercase no-underline transition-colors hover:text-[#c9a84c]"
            style={{ color: 'rgba(244, 241, 234, 0.75)' }}
          >
            DEMOSTRACIÓN
          </a>
          <a
            href="#planes"
            className="text-[0.74rem] font-semibold tracking-[0.08em] uppercase no-underline transition-colors hover:text-[#c9a84c]"
            style={{ color: 'rgba(244, 241, 234, 0.75)' }}
          >
            PLANES &amp; PRECIOS
          </a>
          <a
            href="#faq"
            className="text-[0.74rem] font-semibold tracking-[0.08em] uppercase no-underline transition-colors hover:text-[#c9a84c]"
            style={{ color: 'rgba(244, 241, 234, 0.75)' }}
          >
            PREGUNTAS
          </a>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Status Pill */}
          <div
            className="hidden sm:inline-flex items-center gap-2 rounded-full whitespace-nowrap select-none"
            style={{
              padding: '7px 16px',
              border: '1px solid rgba(201, 168, 76, 0.38)',
              background: 'rgba(10, 32, 29, 0.7)',
              color: '#dfbe63',
              fontSize: '0.74rem',
              fontWeight: 600,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
            }}
          >
            <span
              className="w-[7px] h-[7px] rounded-full inline-block"
              style={{
                background: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>PLATAFORMA ACTIVA 2026</span>
          </div>

          {/* Login Button with lock icon */}
          <button
            onClick={() => navigate('/pnp/login')}
            className="inline-flex items-center gap-[7px] rounded-lg uppercase tracking-[0.06em] font-semibold text-no-underline whitespace-nowrap transition-all duration-200 cursor-pointer"
            style={{
              padding: '9px 18px',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#f4f1ea',
              fontSize: '0.76rem',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(201, 168, 76, 0.12)'
              e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.45)'
              e.currentTarget.style.color = '#dfbe63'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)'
              e.currentTarget.style.color = '#f4f1ea'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '2px' }}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            INICIAR SESIÓN
          </button>

          {/* Gold CTA: PAGAR AHORA -> */}
          <button
            onClick={handlePagar}
            className="inline-flex items-center justify-center rounded-md font-bold uppercase tracking-[0.05em] whitespace-nowrap transition-all duration-200 select-none cursor-pointer"
            style={{
              padding: '10px 22px',
              background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
              color: '#0a0a0a',
              fontSize: '0.84rem',
              boxShadow: '0 4px 16px rgba(201, 168, 76, 0.26)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #f0d482, #d9b959)'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 168, 76, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dfbe63, #c9a84c)'
              e.currentTarget.style.transform = 'none'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(201, 168, 76, 0.26)'
            }}
          >
            PAGAR AHORA &rarr;
          </button>
        </div>
      </div>
    </nav>
  )
}
