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
  Phone,
  AlertTriangle,
  Scale,
  MessageSquare,
  Award,
} from 'lucide-react'
import HardmanPnpNavbar from '@/components/brand/HardmanPnpNavbar'
import HardmanPnpLogo from '@/components/brand/HardmanPnpLogo'

export default function PnpLandingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'INTERVENCION' | 'REGISTRO' | 'DESCARGO' | 'CADUCIDAD'>('INTERVENCION')
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    try {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const documentPreviews = {
    INTERVENCION: {
      title: 'ACTA DE INTERVENCIÓN POLICIAL EN FLAGRANCIA (ART. 259 NCPP)',
      badge: 'Art. 259 NCPP • Flagrancia Delictiva',
      content: `POLICÍA NACIONAL DEL PERÚ
REGIÓN POLICIAL LIMA • DIVPOL SUR 1
COMISARÍA PNP DE SURQUILLO • SECCIÓN INVESTIGACIÓN DE DELITOS

ACTA DE INTERVENCIÓN POLICIAL EN FLAGRANCIA DELICTIVA
(CONFORME AL ARTÍCULO 259° DEL CÓDIGO PROCESAL PENAL)

En la ciudad de Lima, distrito de Surquillo, siendo las [HORA] horas del día [FECHA], los suscritos [GRADO Y NOMBRE DEL EFECTIVO], con CIP N° [XXXXXX], a bordo de la unidad móvil [PLACA], en servicio de patrullaje motorizado en el cuadrante asignado, dejamos constancia de lo siguiente:

I. LUGAR DE LA INTERVENCIÓN:
Inmediaciones de la Av. Angamos Este con Jr. San Agustín, Surquillo (Coord. Lat: -12.1124, Long: -77.0215).

II. CIRCUNSTANCIAS DE LA INTERVENCIÓN Y MOTIVO:
2.1. Desplazándose en patrullaje preventivo, se visualizó a una persona de sexo masculino en actitud sospechosa, quien al advertir la presencia del vehículo policial intentó darse a la fuga.
2.2. Configuración de flagrancia: Conforme al Art. 259°, inc. 3 del NCPP, el sujeto fue intervenido tras la sindicación directa de la agraviada [NOMBRE AGRAVIADA], quien solicitó auxilio vociferando haber sido despojada con violencia de su teléfono celular marca [MARCA].

III. IDENTIFICACIÓN DEL INTERVENIDO:
• Nombres y Apellidos: [NOMBRES DEL INTERVENIDO]   ·   DNI: [DOCUMENTO]
• Edad: [EDAD] años   ·   Domicilio: [DIRECCIÓN COMPLETA]

IV. REGISTRO PRELIMINAR Y ESPECIES INCAUTADAS:
A la altura de la pretina derecha se le halló el teléfono celular de la agraviada y un arma blanca de 20 cm.

V. LECTURA DE DERECHOS:
En el acto se procedió a la notificación y lectura de sus derechos consagrados en el Art. 71° del Código Procesal Penal.

Concluyó la diligencia a las [HORA FIN] horas, firmando los intervinientes.`,
    },
    REGISTRO: {
      title: 'ACTA DE REGISTRO PERSONAL, INCAUTACIÓN Y LACRADO (ART. 210 NCPP)',
      badge: 'Art. 210 NCPP • Cadena de Custodia',
      content: `POLICÍA NACIONAL DEL PERÚ
DIVISIÓN DE INVESTIGACIÓN CRIMINAL • DEPINCRI

ACTA DE REGISTRO PERSONAL, INCAUTACIÓN, COMISO Y LACRADO
(ARTÍCULOS 210°, 218° Y 220° DEL CÓDIGO PROCESAL PENAL)

En la sede de la dependencia policial, siendo las [HORA] horas del día [FECHA], ante la presencia del instructor policial que suscribe, se procede a practicar la diligencia de REGISTRO PERSONAL al ciudadano:

INTERVENIDO: [NOMBRES Y APELLIDOS]   ·   DNI N°: [XXXXXXX]

I. OBJETO DE LA DILIGENCIA:
Verificar la existencia de bienes, efectos del delito, armas o sustancias prohibidas vinculadas al hecho investigado.

II. RESULTADO DEL REGISTRO PERSONAL:
1. En el bolsillo delantero derecho: Se halló una bolsa de polietileno transparente conteniendo [CANTIDAD] envoltorios tipo "kete" con sustancia parduzca al parecer PBC.
2. En el cinto abdominal: Un arma de fuego tipo revólver, serie erradicada, abastecida con seis (06) cartuchos sin percutar.

III. MEDIDA DE ASEGURAMIENTO Y CADENA DE CUSTODIA:
Las especies descritas son INCAUTADAS Y COMISADAS formalmente, procediéndose en este acto a su rotulado y lacrado en sobre de seguridad con firma de los presentes, garantizando la debida Cadena de Custodia (Art. 220° NCPP).

Concluyó la diligencia a las [HORA] horas.`,
    },
    DESCARGO: {
      title: 'ESCRITO DE DESCARGO Y SOLICITUD DE ABSOLUCIÓN (LEY N° 30714)',
      badge: 'Ley N° 30714 • Eximentes Art. 21',
      content: `SEÑOR CORONEL PNP JEFE DE LA OFICINA DE DISCIPLINA DE INSPECTORÍA GENERAL PNP:

EXPEDIENTE: EXP. N° 024-2026-IGPNP/DIRINV-OD
SUMILLA: PRESENTA ESCRITO DE DESCARGO CONTRA AUTO DE INICIO POR PRESUNTA INFRACCIÓN G-24 Y SOLICITA ARCHIVO DEFINITIVO POR FUERZA MAYOR Y ATIPICIDAD.

S2 PNP [NOMBRES Y APELLIDOS], identificado con DNI N° [XXXXXXX], con CIP N° [XXXXXXX], prestando servicios en [UNIDAD], señalando domicilio procesal en [DIRECCIÓN], ante usted con respeto me presento y expongo:

I. PETITORIO:
Al amparo del Art. 139° incisos 3 y 14 de la Constitución, en concordancia con el Art. 64° de la Ley N° 30714, dentro del plazo legal presento formal INFORME DE DESCARGO, solicitando se declare NO HA LUGAR A SANCIÓN y se ordene el ARCHIVO DEFINITIVO del procedimiento disciplinario.

II. FUNDAMENTOS DE HECHO:
2.1. Niego categóricamente haber incurrido en falta voluntaria de abandono de puesto. Durante el rol de servicio presenté una severa descompensación médica de urgencia.
2.2. Procedí a dar cuenta verbal inmediata al Suboficial Brigadier de Permanencia y me trasladé al Hospital Central PNP «Luis N. Sáenz» con diagnóstico de cólico renal agudo.

III. FUNDAMENTOS DE DERECHO Y JURISPRUDENCIA DEL TDP:
3.1. CAUSAL EXIMENTE: El Art. 21° inc. 1 de la Ley N° 30714 exime de responsabilidad a quien actúa bajo caso fortuito o fuerza mayor debidamente comprobada.
3.2. PRECEDENTE VINCULANTE: Resolución N° 312-2024-IN/TDP que establece la atipicidad de la falta G-24 cuando se acredita atención médica de urgencia.

IV. MEDIOS PROBATORIOS:
1. Copia legalizada de la Ficha de Emergencia del Hospital Central PNP.
2. Descanso Médico expedido por médico del nosocomio institucional.

Lima, [FECHA].`,
    },
    CADUCIDAD: {
      title: 'DEDUCCIÓN DE CADUCIDAD DEL PROCEDIMIENTO DISCIPLINARIO (ART. 68)',
      badge: 'Art. 68 Ley 30714 • Plazo 9 Meses',
      content: `SEÑOR CORONEL PNP JEFE DE LA OFICINA DE DISCIPLINA DE INSPECTORÍA GENERAL:

EXPEDIENTE: EXP. N° 018-2025-IGPNP/DIRINV-OD
SUMILLA: DEDUCE LA CADUCIDAD DEL PROCEDIMIENTO ADMINISTRATIVO DISCIPLINARIO (PAD) Y SOLICITA EL ARCHIVO DEFINITIVO POR VENCIMIENTO DE PLAZO LEGAL.

[GRADO Y NOMBRE DEL EFECTIVO], con CIP N° [XXXXXX], en el procedimiento seguido en mi contra, expongo:

I. PETITORIO:
De conformidad con el Artículo 68° numeral 2 de la Ley N° 30714, deduzco formalmente la CADUCIDAD DEL PROCEDIMIENTO DISCIPLINARIO por haber transcurrido en exceso más de NUEVE (09) MESES CALENDARIO desde la notificación formal del Auto de Inicio sin haberse emitido ni notificado resolución sancionatoria o absolutoria de primera instancia.

II. CÓMPUTO DE PLAZOS INOBJETABLES:
• Notificación del Auto de Inicio de PAD: 12 de enero de 2025.
• Plazo máximo legal de 9 meses: Venció indefectiblemente el 12 de octubre de 2025.
• Fecha actual: El procedimiento se encuentra paralizado hace más de 12 meses.

III. EFECTOS JURÍDICOS VINCULANTES:
El Tribunal de Disciplina Policial (TDP) ha reiterado que el plazo de 9 meses es de CADUCIDAD PERENTORIA que extingue la potestad resolutiva de la administración policial de pleno derecho, no admitiendo prórroga tácita.

POR TANTO: Solicito declarar la CADUCIDAD del PAD y disponer el ARCHIVO DEFINITIVO con devolución de antecedentes limpios a mi legajo.`,
    },
  }

  const currentDoc = documentPreviews[activeTab]

  return (
    <div
      className="min-h-screen text-[#f4f1ea] font-sans selection:bg-[#c9a84c] selection:text-black overflow-x-hidden"
      style={{
        background: '#060f0d',
        fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      {/* Navbar Institucional Hardman PNP */}
      <HardmanPnpNavbar />

      <main id="top">
        {/* ─── HERO SECTION ─── */}
        <section
          className="relative pt-20 pb-24 overflow-hidden border-b"
          style={{
            borderColor: 'rgba(45, 175, 150, 0.18)',
            background:
              'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(20, 65, 55, 0.55), rgba(6, 15, 13, 0.95) 75%)',
          }}
        >
          {/* Subtle Ambient Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[340px] pointer-events-none blur-3xl opacity-25"
            style={{
              background: 'radial-gradient(circle, #c9a84c 0%, #1b554e 70%, transparent 100%)',
            }}
          />

          <div className="relative w-full mx-auto text-center px-6" style={{ maxWidth: '1060px' }}>
            {/* Pulsating Police Law Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full mb-6 transition-all hover:scale-[1.02]"
              style={{
                fontSize: '.82rem',
                fontWeight: 600,
                letterSpacing: '.03em',
                color: '#dfbe63',
                background: 'rgba(201, 168, 76, .08)',
                border: '1px solid rgba(201, 168, 76, .35)',
                padding: '6px 18px',
                boxShadow: '0 0 20px rgba(201, 168, 76, 0.15)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block animate-pulse"
                style={{
                  background: '#c9a84c',
                  boxShadow: '0 0 10px #c9a84c',
                }}
              />
              <span>Régimen Disciplinario PNP • Ley N° 30714, D.L. 1186, Ley 31012 y NCPP 2026</span>
            </div>

            {/* Power Headline */}
            <h1
              className="text-white font-bold leading-[1.12] mb-6 tracking-tight"
              style={{
                fontSize: 'clamp(2.35rem, 4.6vw, 3.85rem)',
              }}
            >
              Inteligencia Operativa y Defensa Jurídica para la{' '}
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #f3deb1, #dfbe63 45%, #c9a84c)',
                }}
              >
                Policía Nacional del Perú
              </span>
            </h1>

            {/* Empathetic Dual-Role Police Lead Copy */}
            <p
              className="leading-relaxed font-light mx-auto mb-9 text-base sm:text-lg"
              style={{
                color: 'rgba(244, 241, 234, .75)',
                maxWidth: '68ch',
              }}
            >
              <strong className="text-white font-medium">Menos papeleo en comisaría tras 24 horas de turno. Cero zozobra por tu legajo ante Inspectoría.</strong>{' '}
              Redacta actas de intervención en flagrancia (Art. 259 NCPP), registros y oficios a Fiscalía en 20 segundos sin un solo vicio formal. Y defiéndete frente a denuncias civiles o cédulas de la Ley 30714 con descargos blindados bajo jurisprudencia del TDP.
            </p>

            {/* Dual Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <button
                onClick={() => navigate('/pnp/login')}
                className="w-full sm:w-auto inline-flex items-center justify-center font-bold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95"
                style={{
                  padding: '14px 34px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                  color: '#061e19',
                  fontSize: '.9rem',
                  boxShadow: '0 4px 22px rgba(201, 168, 76, .35)',
                }}
              >
                <span>Ingresar al Despacho PNP</span>
                <ArrowRight size={16} className="ml-2" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('demostracion')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center font-semibold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer"
                style={{
                  padding: '14px 30px',
                  borderRadius: '8px',
                  border: '1px solid rgba(45, 175, 150, 0.35)',
                  background: 'rgba(10, 42, 36, 0.45)',
                  color: '#f4f1ea',
                  fontSize: '.85rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#c9a84c'
                  e.currentTarget.style.color = '#dfbe63'
                  e.currentTarget.style.background = 'rgba(18, 76, 64, 0.65)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.35)'
                  e.currentTarget.style.color = '#f4f1ea'
                  e.currentTarget.style.background = 'rgba(10, 42, 36, 0.45)'
                }}
              >
                Ver Demostración en Vivo ↓
              </button>
            </div>

            {/* Metrics Proof Bar */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl border text-left"
              style={{
                background: 'rgba(9, 28, 24, 0.75)',
                borderColor: 'rgba(45, 175, 150, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                  <Clock size={18} style={{ color: '#dfbe63' }} />
                  <span>20 seg</span>
                </div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
                  Redacción de Acta u Oficio
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                  <Shield size={18} style={{ color: '#dfbe63' }} />
                  <span>0 Vicios</span>
                </div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
                  Blindaje ante Fiscalías y TDP
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                  <FileText size={18} style={{ color: '#dfbe63' }} />
                  <span>Word A4</span>
                </div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
                  Membrete PNP listo para firma
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                  <Award size={18} style={{ color: '#dfbe63' }} />
                  <span>24 / 7</span>
                </div>
                <div className="text-xs font-light mt-1" style={{ color: 'rgba(244, 241, 234, 0.6)' }}>
                  Dictado por voz en patrullero
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── EMPATHY COMPARISON SECTION ─── */}
        <section
          className="py-20 px-6 border-b"
          style={{
            borderColor: 'rgba(45, 175, 150, 0.18)',
            background: '#071412',
          }}
        >
          <div className="w-full mx-auto" style={{ maxWidth: '1060px' }}>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#dfbe63' }}
              >
                La Realidad del Servicio Policial
              </span>
              <h2 className="text-white font-bold leading-tight text-2xl sm:text-3xl">
                ¿Por Qué los Policías Necesitan una Herramienta Distinta a los Abogados?
              </h2>
              <p className="mt-3 text-sm font-light" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                El policía no litiga en un escritorio: arriesga su libertad, su sueldo y su carrera en la calle y en la guardia.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Card Tradicional (El Dolor Policial) */}
              <div
                className="p-7 rounded-2xl border"
                style={{
                  background: 'rgba(20, 15, 15, 0.65)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-5 text-red-400 font-semibold text-sm">
                  <AlertTriangle size={18} />
                  <span>El Servicio Policial Tradicional (Agotador y Riesgoso)</span>
                </div>

                <ul className="space-y-4 text-xs sm:text-sm font-light text-stone-300">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>4 AM tras 24 horas de turno:</strong> Rebuscando plantillas antiguas de Word rotas para redactar un acta de flagrancia exhausto.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Miedo a la Fiscalía:</strong> Si omites la hora exacta o el motivo en el acta, el fiscal suelta al delincuente y te denuncia por omisión de funciones.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Zozobra ante Inspectoría:</strong> Una queja maliciosa de un intervenido te abre un PAD bajo la Ley 30714 que congela tu ascenso por años.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-400 font-bold">✕</span>
                    <span><strong>Cobros abusivos en la calle:</strong> Pagar entre S/ 150 y S/ 300 a tramitadores informales afuera de la Oficina de Disciplina por descargos mal hechos.</span>
                  </li>
                </ul>
              </div>

              {/* Card con Hardman PNP (La Solución) */}
              <div
                className="p-7 rounded-2xl border"
                style={{
                  background: 'rgba(9, 36, 30, 0.65)',
                  borderColor: 'rgba(45, 175, 150, 0.45)',
                  boxShadow: '0 4px 25px rgba(201, 168, 76, 0.1)',
                }}
              >
                <div className="flex items-center gap-2.5 mb-5 text-[#dfbe63] font-semibold text-sm">
                  <Shield size={18} />
                  <span>Tu Servicio con Hardman PNP (Blindado y al Segundo)</span>
                </div>

                <ul className="space-y-4 text-xs sm:text-sm font-light text-stone-200">
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#34d17a] shrink-0 mt-0.5" />
                    <span><strong>Dictado por voz desde tu celular:</strong> Narra los hechos mientras estás en la móvil y obtén el acta con formalidad de ley al instante.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#34d17a] shrink-0 mt-0.5" />
                    <span><strong>Blindaje procesal inatacable:</strong> Actas de intervención (Art. 259), registros (Art. 210) y lectura de derechos (Art. 71) sin vacíos legales.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#34d17a] shrink-0 mt-0.5" />
                    <span><strong>Defensa inmediata ante Inspectoría:</strong> Descargos contundentes invocando eximentes de responsabilidad (Art. 21) y precedentes del TDP.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check size={16} className="text-[#34d17a] shrink-0 mt-0.5" />
                    <span><strong>Ahorro y tranquilidad total:</strong> Asistencia ilimitada las 24 horas del día por solo S/ 29/mes para defender tu legajo y tu sueldo.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── LIVE INTERACTIVE SHOWCASE ─── */}
        <section
          id="demostracion"
          className="py-20 px-6 border-b"
          style={{
            borderColor: 'rgba(45, 175, 150, 0.18)',
            background: '#060f0d',
          }}
        >
          <div className="w-full mx-auto" style={{ maxWidth: '1060px' }}>
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#dfbe63' }}
              >
                Demostración Interactiva
              </span>
              <h2 className="text-white font-bold leading-tight text-2xl sm:text-3xl">
                Elige la Diligencia Policial y Revisa el Documento Proyectado
              </h2>
              <p className="mt-3 text-sm font-light" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                Haz clic en cualquiera de las cuatro situaciones operativas más frecuentes de la labor policial:
              </p>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <button
                onClick={() => setActiveTab('INTERVENCION')}
                className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  background:
                    activeTab === 'INTERVENCION'
                      ? 'linear-gradient(135deg, #dfbe63, #c9a84c)'
                      : 'rgba(10, 42, 36, 0.65)',
                  color: activeTab === 'INTERVENCION' ? '#061e19' : 'rgba(244, 241, 234, 0.8)',
                  border: '1px solid ' + (activeTab === 'INTERVENCION' ? '#c9a84c' : 'rgba(45, 175, 150, 0.3)'),
                }}
              >
                <Scale size={13} />
                <span>Acta de Intervención (Art. 259)</span>
              </button>

              <button
                onClick={() => setActiveTab('REGISTRO')}
                className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  background:
                    activeTab === 'REGISTRO'
                      ? 'linear-gradient(135deg, #dfbe63, #c9a84c)'
                      : 'rgba(10, 42, 36, 0.65)',
                  color: activeTab === 'REGISTRO' ? '#061e19' : 'rgba(244, 241, 234, 0.8)',
                  border: '1px solid ' + (activeTab === 'REGISTRO' ? '#c9a84c' : 'rgba(45, 175, 150, 0.3)'),
                }}
              >
                <FileText size={13} />
                <span>Registro Personal (Art. 210)</span>
              </button>

              <button
                onClick={() => setActiveTab('DESCARGO')}
                className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  background:
                    activeTab === 'DESCARGO'
                      ? 'linear-gradient(135deg, #dfbe63, #c9a84c)'
                      : 'rgba(10, 42, 36, 0.65)',
                  color: activeTab === 'DESCARGO' ? '#061e19' : 'rgba(244, 241, 234, 0.8)',
                  border: '1px solid ' + (activeTab === 'DESCARGO' ? '#c9a84c' : 'rgba(45, 175, 150, 0.3)'),
                }}
              >
                <Shield size={13} />
                <span>Descargo Inspectoría (Ley 30714)</span>
              </button>

              <button
                onClick={() => setActiveTab('CADUCIDAD')}
                className="px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  background:
                    activeTab === 'CADUCIDAD'
                      ? 'linear-gradient(135deg, #dfbe63, #c9a84c)'
                      : 'rgba(10, 42, 36, 0.65)',
                  color: activeTab === 'CADUCIDAD' ? '#061e19' : 'rgba(244, 241, 234, 0.8)',
                  border: '1px solid ' + (activeTab === 'CADUCIDAD' ? '#c9a84c' : 'rgba(45, 175, 150, 0.3)'),
                }}
              >
                <Clock size={13} />
                <span>Caducidad de PAD (Art. 68)</span>
              </button>
            </div>

            {/* Document Card Viewer */}
            <div
              className="rounded-2xl border p-6 sm:p-8"
              style={{
                background: 'rgba(6, 26, 22, 0.85)',
                borderColor: 'rgba(45, 175, 150, 0.35)',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3" style={{ borderColor: 'rgba(45, 175, 150, 0.25)' }}>
                <div>
                  <span
                    className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded mr-2"
                    style={{
                      background: 'rgba(201, 168, 76, 0.15)',
                      color: '#dfbe63',
                      border: '1px solid rgba(201, 168, 76, 0.35)',
                    }}
                  >
                    {currentDoc.badge}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {currentDoc.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(currentDoc.content)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all"
                    style={{
                      background: 'rgba(10, 42, 36, 0.65)',
                      borderColor: 'rgba(45, 175, 150, 0.35)',
                      color: 'rgba(244, 241, 234, 0.85)',
                    }}
                  >
                    <Copy size={13} />
                    <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => navigate('/pnp/login')}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                    style={{
                      background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                      color: '#061e19',
                    }}
                  >
                    <span>Abrir en Despacho</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>

              {/* Code/Doc Body */}
              <div
                className="mt-5 p-5 rounded-xl font-mono text-xs leading-relaxed max-h-80 overflow-y-auto whitespace-pre-wrap select-all"
                style={{
                  background: '#040d0b',
                  border: '1px solid rgba(45, 175, 150, 0.2)',
                  color: 'rgba(244, 241, 234, 0.85)',
                }}
              >
                {currentDoc.content}
              </div>
            </div>
          </div>
        </section>

        {/* ─── DUAL SPECIALIST SUITE ─── */}
        <section
          id="especialistas"
          className="py-20 px-6 border-b"
          style={{
            borderColor: 'rgba(45, 175, 150, 0.18)',
            background: '#071412',
          }}
        >
          <div className="w-full mx-auto" style={{ maxWidth: '1160px' }}>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#dfbe63' }}
              >
                Módulos Especializados
              </span>
              <h2 className="text-white font-bold leading-tight text-2xl sm:text-3xl">
                Diseñado para Cada Rol Operativo de la PNP
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Box 1: Comisaría & Investigaciones */}
              <div
                className="p-8 rounded-2xl border flex flex-col justify-between"
                style={{
                  background: 'rgba(8, 28, 24, 0.65)',
                  borderColor: 'rgba(45, 175, 150, 0.35)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[2px] font-bold" style={{ color: '#dfbe63' }}>
                      Módulo Operativo de Turno
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                      Art. 259 NCPP
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mt-1">
                    Comisarías, DEPINCRI y Patrullaje
                  </h3>

                  <p className="mt-3 text-sm font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.7)' }}>
                    Para el instructor policial que debe entregar los actuados a la Fiscalía de Turno dentro del plazo de 48 horas sin errores de forma que liberen al detenido.
                  </p>

                  <div className="mt-6 space-y-3 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Actas de Intervención en Flagrancia:</strong> Con hora exacta, georreferenciación y sindicación para blindar la legalidad de la aprehensión.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Registro Personal e Incautación:</strong> Formalidad estricta para armas, drogas y especies con rótulo de cadena de custodia (Art. 220 NCPP).</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Lectura de Derechos al Imputado:</strong> Notificación inmediata del Art. 71 NCPP para neutralizar tutelas de derechos de abogados litigantes.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Informes Policiales Preliminares:</strong> Bajo la Ley 32130 que devuelve la investigación material del delito a la PNP.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(45, 175, 150, 0.25)' }}>
                  <button
                    onClick={() => navigate('/pnp/login')}
                    className="text-xs uppercase tracking-[2px] font-bold text-[#dfbe63] hover:text-[#f3deb1] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ingresar a Modo Documentación de Servicio</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Box 2: Inspectoría & Defensa del Efectivo */}
              <div
                className="p-8 rounded-2xl border flex flex-col justify-between"
                style={{
                  background: 'rgba(8, 28, 24, 0.65)',
                  borderColor: 'rgba(201, 168, 76, 0.35)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[2px] font-bold" style={{ color: '#dfbe63' }}>
                      Módulo Disciplinario y Defensa
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/40">
                      Ley N° 30714
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mt-1">
                    Inspectoría y Defensa Técnica Policial
                  </h3>

                  <p className="mt-3 text-sm font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.7)' }}>
                    Para el oficial o suboficial notificado por la Oficina de Disciplina o el Tribunal de Disciplina Policial (TDP), o instructores que resuelven expedientes con apego a la tipicidad.
                  </p>

                  <div className="mt-6 space-y-3 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Descargos con Eximentes (Art. 21):</strong> Invocación de caso fortuito, fuerza mayor, orden superior y cumplimiento del deber para archivo directo.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Auditoría de Caducidad y Prescripción:</strong> Alerta inmediata si el PAD superó los 9 meses improrrogables del Art. 68 de la Ley 30714.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Recursos de Apelación ante el TDP:</strong> Impugnación de pases a disponibilidad o al retiro con agravios al debido proceso.</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check size={15} className="text-[#dfbe63] shrink-0 mt-0.5" />
                      <span><strong>Uso Legítimo de la Fuerza (D.L. 1186):</strong> Blindaje técnico amparado en la Ley 31012 de Protección Policial tras intervenciones armadas.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(201, 168, 76, 0.25)' }}>
                  <button
                    onClick={() => navigate('/pnp/login')}
                    className="text-xs uppercase tracking-[2px] font-bold text-[#dfbe63] hover:text-[#f3deb1] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Ingresar a Modo Defensa Disciplinaria</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── PRICING PLANS ─── */}
        <section
          id="planes"
          className="py-20 px-6 border-b"
          style={{
            borderColor: 'rgba(45, 175, 150, 0.18)',
            background: '#060f0d',
          }}
        >
          <div className="w-full mx-auto" style={{ maxWidth: '960px' }}>
            <div className="text-center mb-14">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#dfbe63' }}
              >
                Precios Justos para el Policía
              </span>
              <h2 className="text-white font-bold leading-tight text-2xl sm:text-3xl">
                Acceso Ilimitado Sin Cobros Sorpresa
              </h2>
              <p className="mt-3 text-sm font-light" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                No vuelvas a pagar S/ 200 a tramitadores en la calle por un solo escrito.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Plan 1: Efectivo Individual */}
              <div
                className="p-8 rounded-2xl border flex flex-col justify-between"
                style={{
                  background: 'rgba(8, 28, 24, 0.65)',
                  borderColor: 'rgba(45, 175, 150, 0.3)',
                }}
              >
                <div>
                  <span className="text-[10px] uppercase tracking-[2px] font-bold text-stone-400">
                    Plan Efectivo Policial
                  </span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">S/ 29</span>
                    <span className="text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                      / mes
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                    Para suboficiales y oficiales que necesitan redactar actas de guardia, descargos ante Inspectoría y resolver consultas de servicio.
                  </p>

                  <div className="mt-6 space-y-3 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Actas de intervención en flagrancia (Art. 259)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Descargos por faltas Leves y Graves (Ley 30714)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Auditoría de caducidad (9 meses) y prescripción</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Dictado por voz desde el celular o patrullero</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Descarga directa en Word (.docx) procesal</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/pnp/login')}
                  className="mt-8 w-full py-3 rounded-xl text-xs uppercase tracking-[2px] font-bold transition-all cursor-pointer"
                  style={{
                    border: '1px solid rgba(45, 175, 150, 0.45)',
                    background: 'rgba(10, 42, 36, 0.65)',
                    color: '#f4f1ea',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#c9a84c'
                    e.currentTarget.style.color = '#dfbe63'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(45, 175, 150, 0.45)'
                    e.currentTarget.style.color = '#f4f1ea'
                  }}
                >
                  Comenzar Plan Efectivo
                </button>
              </div>

              {/* Plan 2: Despacho / Inspectoría */}
              <div
                className="p-8 rounded-2xl border flex flex-col justify-between relative"
                style={{
                  background: 'rgba(12, 42, 36, 0.85)',
                  borderColor: 'rgba(201, 168, 76, 0.55)',
                  boxShadow: '0 8px 30px rgba(201, 168, 76, 0.15)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[2px] font-bold text-[#dfbe63]">
                      Comisaría / Inspectoría OD
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-[1px] px-2 py-0.5 rounded font-bold"
                      style={{ background: 'rgba(201, 168, 76, 0.2)', color: '#dfbe63' }}
                    >
                      Recomendado OD / SIDPOL
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">S/ 79</span>
                    <span className="text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.5)' }}>
                      / mes
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-light" style={{ color: 'rgba(244, 241, 234, 0.65)' }}>
                    Para instructores, secretarios técnicos de Oficinas de Disciplina y comisarías con alto volumen de actas y expedientes disciplinarios.
                  </p>

                  <div className="mt-6 space-y-3 text-xs" style={{ color: 'rgba(244, 241, 234, 0.85)' }}>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Autos de Inicio de PAD y proyectos de resolución</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Informes Disciplinarios de Instrucción y Sanción</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Informes de Investigación Preliminar (Ley 32130)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Auditoría masiva de plazos de prescripción</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check size={14} className="text-[#dfbe63]" />
                      <span>Membrete institucional reglamentario de la PNP</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/pnp/login')}
                  className="mt-8 w-full py-3 rounded-xl text-xs uppercase tracking-[2px] font-bold transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #dfbe63, #c9a84c)',
                    color: '#061e19',
                  }}
                >
                  Habilitar Despacho Completo
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── REAL POLICE FAQS ─── */}
        <section
          id="faq"
          className="py-20 px-6"
          style={{
            background: '#071412',
          }}
        >
          <div className="w-full mx-auto" style={{ maxWidth: '860px' }}>
            <div className="text-center mb-14">
              <span
                className="text-xs uppercase tracking-[3px] font-bold block mb-2"
                style={{ color: '#dfbe63' }}
              >
                Preguntas Frecuentes Policiales
              </span>
              <h2 className="text-white font-bold leading-tight text-2xl sm:text-3xl">
                Dudas Clave de la Función Policial
              </h2>
            </div>

            <div className="space-y-4">
              <div
                className="p-6 rounded-2xl border"
                style={{ background: 'rgba(8, 28, 24, 0.65)', borderColor: 'rgba(45, 175, 150, 0.25)' }}
              >
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield size={16} className="text-[#dfbe63]" />
                  <span>¿Las actas de intervención cumplen con los requisitos del NCPP y de la Fiscalía?</span>
                </h4>
                <p className="mt-2 text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.7)' }}>
                  Sí. Hardman PNP redacta cada acta con estricto detalle de fecha, hora exacta, georreferenciación, descripción circunstanciada (quién, cómo, cuándo, dónde) y lectura de derechos conforme a los Arts. 71 y 259 del Código Procesal Penal, evitando que el fiscal o el juez declaren la detención ilegal.
                </p>
              </div>

              <div
                className="p-6 rounded-2xl border"
                style={{ background: 'rgba(8, 28, 24, 0.65)', borderColor: 'rgba(45, 175, 150, 0.25)' }}
              >
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield size={16} className="text-[#dfbe63]" />
                  <span>¿Es legalmente válido un descargo elaborado con Hardman PNP ante Inspectoría?</span>
                </h4>
                <p className="mt-2 text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.7)' }}>
                  Totalmente. El descargo se estructura conforme a la Ley N° 30714 y el D.S. N° 003-2020-IN, invocando causales eximentes de responsabilidad (Art. 21) y precedentes vinculantes del Tribunal de Disciplina Policial (TDP), listo para ser firmado por ti o tu abogado patrocinante.
                </p>
              </div>

              <div
                className="p-6 rounded-2xl border"
                style={{ background: 'rgba(8, 28, 24, 0.65)', borderColor: 'rgba(45, 175, 150, 0.25)' }}
              >
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield size={16} className="text-[#dfbe63]" />
                  <span>¿Mis consultas y datos policiales son confidenciales y anónimos?</span>
                </h4>
                <p className="mt-2 text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.7)' }}>
                  Garantizamos confidencialidad estricta con encriptación de extremo a extremo. Hardman no comparte tus consultas con ningún comando, Inspectoría ni entidad externa. Puedes consultar con total reserva.
                </p>
              </div>

              <div
                className="p-6 rounded-2xl border"
                style={{ background: 'rgba(8, 28, 24, 0.65)', borderColor: 'rgba(45, 175, 150, 0.25)' }}
              >
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield size={16} className="text-[#dfbe63]" />
                  <span>¿Puedo dictar por voz desde el celular mientras estoy de patrullaje?</span>
                </h4>
                <p className="mt-2 text-xs font-light leading-relaxed" style={{ color: 'rgba(244, 241, 234, 0.7)' }}>
                  Sí. Hardman PNP cuenta con integración de reconocimiento de voz de alta precisión en español para que puedas dictar los hechos de la intervención desde tu teléfono dentro del patrullero o la guardia sin tener que escribir a mano.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Oficial */}
      <footer
        className="py-12 px-6 border-t"
        style={{ borderColor: 'rgba(45, 175, 150, 0.2)', background: '#050c0a' }}
      >
        <div
          className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-light"
          style={{ maxWidth: '1160px', color: 'rgba(244, 241, 234, 0.5)' }}
        >
          <div className="flex items-center gap-3">
            <HardmanPnpLogo size="sm" onClick={() => navigate('/pnp')} />
            <span className="text-stone-600">•</span>
            <span>Inteligencia Operativa y Disciplinaria PNP · Ley N° 30714 &amp; NCPP 2026</span>
          </div>

          <div>© 2026 Hardman · Todos los derechos reservados para la Policía Nacional del Perú</div>
        </div>
      </footer>
    </div>
  )
}
