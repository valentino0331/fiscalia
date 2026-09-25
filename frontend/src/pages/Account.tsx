import { useState, useEffect, useRef, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ChevronLeft, LogOut, User, CheckCircle2,
  Shield, Zap, Award, Building2, Check
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import HardmanLogo from '@/components/brand/HardmanLogo'

import { parseLetterheadDetails } from '@/lib/exportDoc'

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

  const [firmName, setFirmName] = useState('')
  const [attorneyName, setAttorneyName] = useState('')
  const [cal, setCal] = useState('')
  const [sinoe, setSinoe] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [attorneyInfo, setAttorneyInfo] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [savedLetterheadMsg, setSavedLetterheadMsg] = useState(false)

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

    try {
      const raw = localStorage.getItem('hardman_letterhead')
      if (raw) {
        const parsed = JSON.parse(raw)
        const details = parseLetterheadDetails(parsed)
        if (details.firmName) setFirmName(details.firmName)
        if (details.attorneyName) setAttorneyName(details.attorneyName)
        if (details.cal) setCal(details.cal)
        if (details.sinoe) setSinoe(details.sinoe)
        if (details.email) setEmail(details.email)
        if (details.phone) setPhone(details.phone)
        if (details.address) setAddress(details.address)
        if (parsed.attorneyInfo) setAttorneyInfo(parsed.attorneyInfo)
        if (parsed.contactInfo) setContactInfo(parsed.contactInfo)
      }
    } catch {
      // ignore
    }
  }, [])

  const handleSaveLetterhead = () => {
    const resolvedAttorney = attorneyName ? (cal ? `${attorneyName} — Reg. C.A.L. N° ${cal}` : attorneyName) : attorneyInfo
    const contactParts = []
    if (address) contactParts.push(address)
    if (phone) contactParts.push(`Cel. ${phone}`)
    if (sinoe) contactParts.push(`Casilla Electrónica SINOE N° ${sinoe}`)
    if (email) contactParts.push(email)
    const resolvedContact = contactParts.length > 0 ? contactParts.join(' | ') : contactInfo

    const payload = {
      firmName: firmName.trim(),
      attorneyName: attorneyName.trim(),
      cal: cal.trim(),
      colegiatura: cal.trim(),
      sinoe: sinoe.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
      attorneyInfo: resolvedAttorney.trim(),
      contactInfo: resolvedContact.trim(),
    }

    localStorage.setItem('hardman_letterhead', JSON.stringify(payload))
    setAttorneyInfo(resolvedAttorney)
    setContactInfo(resolvedContact)
    setSavedLetterheadMsg(true)
    setTimeout(() => setSavedLetterheadMsg(false), 3000)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden w-full max-w-full" style={{ background: '#111111' }}>
      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-3 sm:px-6 md:px-12 sticky top-0 z-40 border-b max-w-full overflow-hidden"
        style={{ background: '#111111', borderColor: '#2a2a2a' }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
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
          <HardmanLogo size="sm" />
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
                    {data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal' ? 'Membresía Junior (S/ 39/mes)' : 'Membresía Senior (S/ 69/mes)'}
                  </h4>
                  <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    {data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal'
                      ? '50 consultas mensuales con acceso a los 8 agentes especializados y subida de expedientes.'
                      : '250 consultas mensuales con acceso a los 8 agentes especializados, expedientes completos y soporte WhatsApp prioritario.'}
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
                    <p className="text-[11px] text-white/50 leading-snug">
                      Para abogados litigantes y estudios que exigen máxima capacidad y atención directa.
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-white/70">
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span className="font-semibold text-white">250 consultas mensuales (Máxima capacidad)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span>8 agentes especializados (acceso total)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span>Subida de expedientes completos (hasta 30 MB)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span className="font-semibold text-white">Soporte por WhatsApp prioritario (929 725 274)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                        <span>Generación judicial en Word (.docx) oficial</span>
                      </li>
                    </ul>

                    {(data?.subscription?.plan === 'junior' || data?.subscription?.plan === 'normal') && (
                      <a
                        href="https://pay.hotmart.com/M107246567H?off=ayixxvun"
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 w-full py-2 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-black hover:opacity-90 shadow-md"
                        style={{ background: '#c9a84c' }}
                      >
                        <Zap size={13} />
                        Actualizar a Plan Senior (S/ 69)
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Membrete de Estudio Jurídico / Marca Blanca */}
              <div
                className="p-5 rounded-xl border space-y-4"
                style={{ background: '#161616', borderColor: '#2a2a2a' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-[#c9a84c]" />
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-white">
                      Membrete de mi Estudio Jurídico (Marca Blanca)
                    </h5>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-[#c9a84c]/10 text-[#c9a84c] border border-[#c9a84c]/20 font-semibold">
                    Word (.docx) & PDF
                  </span>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Personaliza los escritos y recursos que exportes a Microsoft Word (.docx) o imprimas a PDF. Este membrete aparecerá automáticamente en la cabecera de tus documentos.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1 tracking-wider">
                      Nombre del Estudio Jurídico o Razón Social
                    </label>
                    <input
                      type="text"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="Ej: ESTUDIO JURÍDICO ORTEGA & ASOCIADOS"
                      className="w-full px-3 py-2 rounded-lg text-xs bg-[#222222] border border-[#333333] text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1 tracking-wider">
                        Nombre del Abogado(a) Patrocinante
                      </label>
                      <input
                        type="text"
                        value={attorneyName}
                        onChange={(e) => setAttorneyName(e.target.value)}
                        placeholder="Ej: Dr. Rafael Ortega"
                        className="w-full px-3 py-2 rounded-lg text-xs bg-[#222222] border border-[#333333] text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1 tracking-wider">
                        N° Registro Colegiatura (CAL / CAJ / otros)
                      </label>
                      <input
                        type="text"
                        value={cal}
                        onChange={(e) => setCal(e.target.value)}
                        placeholder="Ej: 87432"
                        className="w-full px-3 py-2 rounded-lg text-xs bg-[#222222] border border-[#333333] text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1 tracking-wider">
                        Casilla Electrónica SINOE
                      </label>
                      <input
                        type="text"
                        value={sinoe}
                        onChange={(e) => setSinoe(e.target.value)}
                        placeholder="Ej: 24891"
                        className="w-full px-3 py-2 rounded-lg text-xs bg-[#222222] border border-[#333333] text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1 tracking-wider">
                        Celular / Teléfono de Contacto
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej: 987 654 321"
                        className="w-full px-3 py-2 rounded-lg text-xs bg-[#222222] border border-[#333333] text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1 tracking-wider">
                        Correo Electrónico Procesal
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Ej: contacto@ortegalegal.pe"
                        className="w-full px-3 py-2 rounded-lg text-xs bg-[#222222] border border-[#333333] text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1 tracking-wider">
                        Domicilio Procesal / Dirección
                      </label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej: Av. Grau 450 Of. 302, Piura"
                        className="w-full px-3 py-2 rounded-lg text-xs bg-[#222222] border border-[#333333] text-white placeholder-white/20 focus:outline-none focus:border-[#c9a84c] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Visual preview notice */}
                  <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] space-y-1">
                    <p className="text-[#c9a84c] font-medium flex items-center gap-1.5">
                      <CheckCircle2 size={12} /> Reemplazo automático en documentos
                    </p>
                    <p className="text-white/50 text-[10px] leading-relaxed">
                      Estos datos reemplazarán automáticamente la cabecera, los campos en el cuerpo del escrito (como <code className="text-white/70">[NOMBRE DEL ABOGADO]</code>, <code className="text-white/70">[REGISTRO CAL]</code>, <code className="text-white/70">[CASILLA SINOE]</code>, <code className="text-white/70">[CORREO]</code>) y la sección de firmas al pie de página al exportar a Word (.docx) o imprimir a PDF.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-white/40">
                      {savedLetterheadMsg && (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <Check size={12} /> ¡Datos y membrete guardados con éxito!
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveLetterhead}
                      className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all hover:brightness-110 active:scale-95"
                      style={{
                        background: '#c9a84c',
                        color: '#111',
                      }}
                    >
                      <Check size={13} />
                      Guardar Datos del Estudio
                    </button>
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
