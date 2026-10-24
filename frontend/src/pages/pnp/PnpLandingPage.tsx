import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Shield,
  FileText,
  Clock,
  Check,
  Building2,
  ChevronRight,
  Download,
  Copy,
} from 'lucide-react'
import HardmanPnpNavbar from '@/components/brand/HardmanPnpNavbar'
import HardmanPnpLogo from '@/components/brand/HardmanPnpLogo'

export default function PnpLandingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'INSPECTORIA' | 'DEFENSA'>('INSPECTORIA')

  return (
    <div
      className="min-h-screen text-[#f4f1ea] font-sans selection:bg-[#c9a84c] selection:text-black"
      style={{
        background: '#061715',
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Exact Pixel-Perfect Hardman Navbar */}
      <HardmanPnpNavbar />

      {/* Hero Section */}
      <main id="top">
        <section
          className="hero"
          style={{
            padding: '72px 0 84px',
            border: 0,
            background: 'radial-gradient(ellipse at 50% 0%, rgba(27, 85, 78, .4), transparent 65%)',
          }}
        >
          <div
            className="w-full mx-auto text-center"
            style={{ maxWidth: '960px', padding: '0 24px' }}
          >
            {/* Gold Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full mb-6"
              style={{
                fontSize: '.82rem',
                fontWeight: 600,
                letterSpacing: '.03em',
                color: '#c9a84c',
                background: 'rgba(201, 168, 76, .08)',
                border: '1px solid rgba(201, 168, 76, .28)',
                padding: '5px 16px',
              }}
            >
              <span
                className="w-[7px] h-[7px] rounded-full inline-block"
                style={{
                  background: '#c9a84c',
                  boxShadow: '0 0 8px #c9a84c',
                }}
              />
              <span>Régimen Disciplinario PNP • Ley N° 30714 y D.S. N° 003-2020-IN</span>
            </div>

            <h1
              className="text-white font-bold leading-[1.14] mb-6"
              style={{
                fontSize: 'clamp(2.3rem, 4.5vw, 3.7rem)',
                letterSpacing: '-.02em',
              }}
            >
              Inteligencia Jurídica para la Función Policial y el Régimen Disciplinario
            </h1>

            <p
              className="leading-relaxed font-light mx-auto mb-8"
              style={{
                color: 'rgba(244, 241, 234, .64)',
                fontSize: '1.18rem',
                maxWidth: '62ch',
              }}
            >
              Desahogo procesal de expedientes para <strong className="text-white font-medium">Inspectoría y Oficinas de Disciplina</strong>{' '}
              bajo la Ley N° 30714, y defensa técnica de precisión para el <strong className="text-white font-medium">efectivo policial notificado</strong>.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
              <button
                onClick={() => navigate('/pnp/login')}
                className="inline-flex items-center justify-center font-bold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer"
                style={{
                  padding: '13px 32px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                  color: '#0a0a0a',
                  fontSize: '.9rem',
                  boxShadow: '0 4px 18px rgba(201, 168, 76, .35)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f0d482, #d9b959)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #dfbe63, #c9a84c)'
                  e.currentTarget.style.transform = 'none'
                }}
              >
                Activar Acceso Despacho &rarr;
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('demostracion')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="inline-flex items-center justify-center font-semibold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer"
                style={{
                  padding: '13px 28px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#f4f1ea',
                  fontSize: '.82rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.45)'
                  e.currentTarget.style.color = '#dfbe63'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)'
                  e.currentTarget.style.color = '#f4f1ea'
                }}
              >
                Ver Demostración en Vivo ↓
              </button>
            </div>

            {/* Metrics Grid */}
            <div
              className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-xl border text-left mt-14"
              style={{ background: '#111111', borderColor: '#222222' }}
            >
              <div>
                <div className="text-xl font-bold text-white">20 segundos</div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                  Redacción de Auto o Descargo
                </div>
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: '#c9a84c' }}>
                  Ley N° 30714
                </div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                  Subsunción de tipicidad estricta
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">Word y PDF</div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                  Formato oficial para firma
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-white">24 horas</div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                  Asistencia y dictado por voz
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Especialistas */}
        <section
          id="especialistas"
          style={{
            padding: '92px 0',
            borderTop: '1px solid #222222',
          }}
        >
          <div className="w-full mx-auto px-6" style={{ maxWidth: '1260px' }}>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#c9a84c' }}
              >
                Especialistas Disciplinarios
              </span>
              <h2
                className="text-white font-bold leading-tight"
                style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.55rem)' }}
              >
                Diseñado para Ambos Lados del Procedimiento
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Card 1: Inspectoría */}
              <div
                className="p-8 rounded-xl border flex flex-col justify-between"
                style={{ background: '#111111', borderColor: '#222222' }}
              >
                <div>
                  <span
                    className="text-[10px] uppercase tracking-[2px] font-semibold"
                    style={{ color: '#c9a84c' }}
                  >
                    Órgano Instructor
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    Inspectoría General, OD y Cármenes
                  </h3>
                  <p
                    className="mt-3 text-sm font-light leading-relaxed"
                    style={{ color: 'rgba(244, 241, 234, 0.65)' }}
                  >
                    Para instructores y secretarios técnicos con sobrecarga procesal. Genera proyectos de resolución,
                    autos de inicio e informes con estricto apego al principio de tipicidad.
                  </p>

                  <div className="mt-6 space-y-3.5 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Autos de Inicio de PAD:</strong> Imputación de faltas Leves, Graves y Muy Graves.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Informes Administrativos Disciplinarios:</strong> Vistos, Hechos, Tipicidad y Conclusiones.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Control de Prescripción:</strong> Alerta inmediata de caducidad según el Art. 68 de la Ley N° 30714.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Exportación Directa en Word:</strong> Márgenes y membrete listos para firma.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: '#1f1f1f' }}>
                  <button
                    onClick={() => navigate('/pnp/login')}
                    className="text-xs uppercase tracking-[2px] font-bold text-[#c9a84c] hover:text-[#dfbe63] flex items-center gap-1.5 transition-colors"
                  >
                    <span>Ingresar a Modo Despacho</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Card 2: Defensa */}
              <div
                className="p-8 rounded-xl border flex flex-col justify-between"
                style={{ background: '#111111', borderColor: '#222222' }}
              >
                <div>
                  <span
                    className="text-[10px] uppercase tracking-[2px] font-semibold"
                    style={{ color: '#c9a84c' }}
                  >
                    Efectivo Policial
                  </span>
                  <h3 className="text-2xl font-bold text-white mt-1">
                    Defensa Técnica y Descargos
                  </h3>
                  <p
                    className="mt-3 text-sm font-light leading-relaxed"
                    style={{ color: 'rgba(244, 241, 234, 0.65)' }}
                  >
                    Para el oficial o suboficial notificado con cédula de imputación. Obtén una defensa técnica fundamentada
                    sin pagar cobros abusivos de S/ 150 a S/ 200 en la calle.
                  </p>

                  <div className="mt-6 space-y-3.5 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Escritos de Descargo en Minutos:</strong> Argumentación jurídica y ofrecimiento de pruebas.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Detección de Nulidades:</strong> Vicios en la notificación y plazos vencidos de la acción.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Recursos de Apelación ante el TDP:</strong> Impugnación de pases al retiro o disponibilidad.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#c9a84c] shrink-0 mt-0.5" />
                      <span>
                        <strong>Dictado por Voz desde el Celular:</strong> Describe los hechos hablando durante tu servicio.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: '#1f1f1f' }}>
                  <button
                    onClick={() => navigate('/pnp/login')}
                    className="text-xs uppercase tracking-[2px] font-bold text-[#c9a84c] hover:text-[#dfbe63] flex items-center gap-1.5 transition-colors"
                  >
                    <span>Ingresar a Modo Defensa</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Demostración */}
        <section
          id="demostracion"
          style={{
            padding: '92px 0',
            borderTop: '1px solid #222222',
            background: '#0a0a0a',
          }}
        >
          <div className="w-full mx-auto px-6" style={{ maxWidth: '1060px' }}>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#c9a84c' }}
              >
                Demostración en Tiempo Real
              </span>
              <h2
                className="text-white font-bold leading-tight"
                style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.55rem)' }}
              >
                Documentos Proyectados Bajo la Ley 30714
              </h2>
            </div>

            {/* Toggle tabs */}
            <div className="flex justify-center mb-8">
              <div
                className="inline-flex p-1 rounded-lg border"
                style={{ background: '#111111', borderColor: '#262626' }}
              >
                <button
                  onClick={() => setActiveTab('INSPECTORIA')}
                  className="px-5 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all"
                  style={{
                    background: activeTab === 'INSPECTORIA' ? '#222222' : 'transparent',
                    color: activeTab === 'INSPECTORIA' ? '#ffffff' : 'rgba(244, 241, 234, 0.5)',
                  }}
                >
                  Auto de Inicio de PAD (Inspectoría)
                </button>
                <button
                  onClick={() => setActiveTab('DEFENSA')}
                  className="px-5 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all"
                  style={{
                    background: activeTab === 'DEFENSA' ? '#222222' : 'transparent',
                    color: activeTab === 'DEFENSA' ? '#ffffff' : 'rgba(244, 241, 234, 0.5)',
                  }}
                >
                  Escrito de Descargo (Efectivo)
                </button>
              </div>
            </div>

            {/* Document Sandbox Preview */}
            <div
              className="p-8 rounded-xl border"
              style={{ background: '#111111', borderColor: '#222222' }}
            >
              <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: '#222222' }}>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {activeTab === 'INSPECTORIA'
                    ? 'EXP. N° 024-2026-IGPNP/DIRINV-OD • INFRACCIÓN GRAVE G-24'
                    : 'ESCRITO DE DESCARGO • S2 PNP JUAN PÉREZ • SUMILLA: ATIPICIDAD'}
                </span>
                <button
                  onClick={() => navigate('/pnp/login')}
                  className="text-xs font-bold text-[#c9a84c] hover:underline"
                >
                  Probar con mi caso &rarr;
                </button>
              </div>

              <div
                className="mt-6 p-5 rounded-lg font-mono text-xs leading-relaxed max-h-72 overflow-y-auto"
                style={{
                  background: '#070707',
                  border: '1px solid #1a1a1a',
                  color: 'rgba(244, 241, 234, 0.8)',
                }}
              >
                {activeTab === 'INSPECTORIA' ? (
                  <div>
                    <p style={{ color: '#c9a84c', fontWeight: 'bold' }}>
                      POLICÍA NACIONAL DEL PERÚ — INSPECTORÍA GENERAL • OFICINA DE DISCIPLINA N° 01
                    </p>
                    <p className="mt-2">AUTO DE INICIO DE PROCEDIMIENTO ADMINISTRATIVO DISCIPLINARIO</p>
                    <p className="mt-3">
                      <strong>I. VISTOS:</strong> Informe Policial N° 045-2026-REGPOL-LIMA dando cuenta de la presunta
                      ausencia injustificada al servicio de guardia.
                    </p>
                    <p className="mt-2">
                      <strong>II. HECHOS IMPUTADOS:</strong> El investigado S2 PNP Juan Carlos Pérez no registró presencia en el
                      área de Investigaciones Comunes sin papeleta autorizada.
                    </p>
                    <p className="mt-2">
                      <strong>III. SUBSUNCIÓN:</strong> Presunta comisión de Infracción Grave G-24 de la Ley N° 30714. Sanción
                      conminada: Pase a disponibilidad de 1 a 6 meses.
                    </p>
                    <p className="mt-2">
                      <strong>IV. DISPOSICIÓN:</strong> Conceder diez (10) días hábiles para informe de descargo por escrito.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ color: '#c9a84c', fontWeight: 'bold' }}>
                      SEÑOR CORONEL PNP JEFE DE LA OFICINA DE DISCIPLINA / INSPECTORÍA GENERAL:
                    </p>
                    <p className="mt-2">
                      SUMILLA: PRESENTA ESCRITO DE DESCARGO Y SOLICITA ARCHIVO DEFINITIVO POR ATIPICIDAD Y FUERZA MAYOR
                      (ART. 21 LEY 30714)
                    </p>
                    <p className="mt-3">
                      <strong>I. PETITORIO:</strong> Solicito se declare NO HA LUGAR A SANCIÓN y se ordene el ARCHIVO DEFINITIVO.
                    </p>
                    <p className="mt-2">
                      <strong>II. HECHOS:</strong> Mi ausencia obedeció a una emergencia médica súbita atendida de urgencia en el
                      Hospital Central PNP «Luis N. Sáenz» con descanso médico oficial.
                    </p>
                    <p className="mt-2">
                      <strong>III. DERECHO:</strong> Precedente Vinculante TDP Res. N° 312-2024-IN/TDP sobre ausencia de dolo y
                      eximente de responsabilidad por emergencia de salud comprobada.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Cómo Funciona */}
        <section
          id="como"
          style={{
            padding: '92px 0',
            borderTop: '1px solid #222222',
          }}
        >
          <div className="w-full mx-auto px-6" style={{ maxWidth: '1060px' }}>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#c9a84c' }}
              >
                Flujo de Trabajo
              </span>
              <h2
                className="text-white font-bold leading-tight"
                style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.55rem)' }}
              >
                Celeridad Procesal en 3 Pasos
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <div
                className="p-6 rounded-xl border text-left"
                style={{ background: '#111111', borderColor: '#222222' }}
              >
                <div className="text-sm font-bold text-[#c9a84c] mb-2">PASO 01</div>
                <h3 className="text-base font-bold text-white mb-2">Ingresa el Documento</h3>
                <p className="text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
                  Sube la cédula de notificación, denuncia, parte policial en PDF o foto, o simplemente dicta el caso con el
                  micrófono.
                </p>
              </div>

              <div
                className="p-6 rounded-xl border text-left"
                style={{ background: '#111111', borderColor: '#222222' }}
              >
                <div className="text-sm font-bold text-[#c9a84c] mb-2">PASO 02</div>
                <h3 className="text-base font-bold text-white mb-2">Análisis de la Ley 30714</h3>
                <p className="text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
                  Hardman PNP coteja la tipicidad de la falta, calcula los plazos de prescripción y detecta vicios procesales.
                </p>
              </div>

              <div
                className="p-6 rounded-xl border text-left"
                style={{ background: '#111111', borderColor: '#222222' }}
              >
                <div className="text-sm font-bold text-[#c9a84c] mb-2">PASO 03</div>
                <h3 className="text-base font-bold text-white mb-2">Descarga Oficial en Word</h3>
                <p className="text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
                  Obtén el escrito o resolución con membrete reglamentario y márgenes procesales listo para imprimir y firmar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Planes & Precios */}
        <section
          id="planes"
          style={{
            padding: '92px 0',
            borderTop: '1px solid #222222',
            background: '#0a0a0a',
          }}
        >
          <div className="w-full mx-auto px-6" style={{ maxWidth: '960px' }}>
            <div className="text-center mb-16">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#c9a84c' }}
              >
                Planes &amp; Precios
              </span>
              <h2
                className="text-white font-bold leading-tight"
                style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.55rem)' }}
              >
                Acceso Transparente sin Letra Chica
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Plan 1 */}
              <div
                className="p-8 rounded-xl border flex flex-col justify-between"
                style={{ background: '#111111', borderColor: '#222222' }}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-[2px] font-semibold text-[#9ca3af]">
                    Plan Efectivo Individual
                  </span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">S/ 29</span>
                    <span className="text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                      / mes
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                    Para oficiales y suboficiales que necesitan redactar descargos, apelar sanciones y consultar dudas de
                    servicio.
                  </p>

                  <div className="mt-6 space-y-3 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Descargos para faltas Leves y Graves</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Detección de prescripción y nulidad</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Dictado por voz desde el celular</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Descarga en Word (.docx) procesal</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/pnp/login')}
                  className="mt-8 w-full py-3 rounded-lg text-xs uppercase tracking-[2px] font-bold transition-all"
                  style={{
                    border: '0.5px solid #2a2a2a',
                    background: '#141414',
                    color: '#ffffff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c9a84c'
                    e.currentTarget.style.color = '#c9a84c'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a2a'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                >
                  Comenzar Plan Individual
                </button>
              </div>

              {/* Plan 2 */}
              <div
                className="p-8 rounded-xl border flex flex-col justify-between relative"
                style={{
                  background: '#141414',
                  borderColor: 'rgba(201, 168, 76, 0.4)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[2px] font-bold text-[#c9a84c]">
                      Despacho / Inspectoría
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-[1px] px-2 py-0.5 rounded font-bold"
                      style={{ background: 'rgba(201, 168, 76, 0.15)', color: '#dfbe63' }}
                    >
                      Recomendado para OD
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">S/ 79</span>
                    <span className="text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                      / mes
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                    Para instructores, tramitadores y secretarios técnicos de Oficinas de Disciplina con alto volumen de casos.
                  </p>

                  <div className="mt-6 space-y-3 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Autos de Inicio de PAD ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Informes Administrativos Disciplinarios</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Control y auditoría de prescripciones</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#c9a84c]" />
                      <span>Membrete reglamentario institucional</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/pnp/login')}
                  className="mt-8 w-full py-3 rounded-lg text-xs uppercase tracking-[2px] font-bold transition-all cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                    color: '#080808',
                  }}
                >
                  Habilitar Despacho Completo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Preguntas (FAQ) */}
        <section
          id="faq"
          style={{
            padding: '92px 0',
            borderTop: '1px solid #222222',
          }}
        >
          <div className="w-full mx-auto px-6" style={{ maxWidth: '880px' }}>
            <div className="text-center mb-14">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#c9a84c' }}
              >
                Preguntas Frecuentes
              </span>
              <h2
                className="text-white font-bold leading-tight"
                style={{ fontSize: 'clamp(1.85rem, 3.4vw, 2.55rem)' }}
              >
                Resolución de Dudas
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-xl border" style={{ background: '#111111', borderColor: '#222222' }}>
                <h4 className="text-sm font-bold text-white">¿Los escritos generados cumplen con la Ley N° 30714?</h4>
                <p className="mt-2 text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                  Sí. Hardman PNP ha sido programado con la tabla completa de infracciones (Leves, Graves y Muy Graves), los
                  plazos del D.S. N° 003-2020-IN y los precedentes vinculantes del Tribunal de Disciplina Policial (TDP).
                </p>
              </div>

              <div className="p-6 rounded-xl border" style={{ background: '#111111', borderColor: '#222222' }}>
                <h4 className="text-sm font-bold text-white">¿Se puede exportar en formato Word para imprimir?</h4>
                <p className="mt-2 text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                  Absolutamente. Cada informe, auto de inicio o descargo cuenta con un botón directo para descargar en Word
                  (.docx) con márgenes oficiales (3cm / 2.5cm) y tipografía procesal para que solo firmes y entregues en mesa de
                  partes.
                </p>
              </div>

              <div className="p-6 rounded-xl border" style={{ background: '#111111', borderColor: '#222222' }}>
                <h4 className="text-sm font-bold text-white">¿Es seguro para la información de mi caso?</h4>
                <p className="mt-2 text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                  Toda consulta y documento se transmite con encriptación de grado bancario. No compartimos tus datos con
                  terceros ni entidades gubernamentales.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="py-12 px-6 border-t"
        style={{ borderColor: 'rgba(27, 85, 78, 0.35)', background: '#061715' }}
      >
        <div
          className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-light"
          style={{ maxWidth: '1260px', color: 'rgba(244, 241, 234, 0.4)' }}
        >
          <div className="flex items-center gap-3">
            <HardmanPnpLogo size="sm" onClick={() => navigate('/pnp')} />
            <span className="text-stone-600">•</span>
            <span>Régimen Disciplinario Ley N° 30714 · Perú</span>
          </div>

          <div>© 2026 Hardman · Todos los derechos reservados</div>
        </div>
      </footer>
    </div>
  )
}
