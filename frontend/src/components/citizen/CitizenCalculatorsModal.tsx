import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Calculator,
  Briefcase,
  Baby,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CitizenCalculatorsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'liquidacion' | 'alimentos' | 'prescripcion'
}

export default function CitizenCalculatorsModal({
  isOpen,
  onClose,
  initialTab = 'liquidacion',
}: CitizenCalculatorsModalProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'liquidacion' | 'alimentos' | 'prescripcion'>(initialTab)
  const [copied, setCopied] = useState(false)

  // Liquidación State
  const [sueldo, setSueldo] = useState('2000')
  const [tieneHijos, setTieneHijos] = useState(false)
  const [regimen, setRegimen] = useState<'general' | 'pequena' | 'micro'>('general')
  const [fechaInicio, setFechaInicio] = useState('2024-01-01')
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10))
  const [motivoCese, setMotivoCese] = useState<'renuncia' | 'despido' | 'termino'>('despido')

  // Alimentos State
  const [ingresoDemandado, setIngresoDemandado] = useState('2500')
  const [numHijos, setNumHijos] = useState('1')
  const [gastosColegioSalud, setGastosColegioSalud] = useState('900')

  // Prescripción State
  const [tipoDeuda, setTipoDeuda] = useState<'sat' | 'tributario' | 'banco' | 'pagare'>('sat')
  const [fechaUltimoPago, setFechaUltimoPago] = useState('2020-01-15')

  if (!isOpen) return null

  // Liquidación Calculation Logic
  const calcularLiquidacion = () => {
    const sueldoNum = Math.max(0, parseFloat(sueldo) || 0)
    const asigFam = tieneHijos ? 113 : 0
    const remComputable = sueldoNum + asigFam

    const start = new Date(fechaInicio)
    const end = new Date(fechaFin)
    const diffTime = Math.max(0, end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const totalMeses = Math.floor(diffDays / 30)
    const totalAnios = diffDays / 365

    // Regimen factor: General (1.0), Pequeña (0.5), Micro (0)
    const factorRegimen = regimen === 'general' ? 1.0 : regimen === 'pequena' ? 0.5 : 0.0

    // CTS trunca (rem computable + 1/6 gratificación)
    const baseCTS = remComputable + remComputable / 6
    const cts = factorRegimen > 0 ? (baseCTS / 12) * Math.min(6, totalMeses % 6 || 6) * factorRegimen : 0

    // Gratificación trunca + Bonificación 9% Essalud
    const gratificacion = factorRegimen > 0 ? (remComputable / 6) * Math.min(6, totalMeses % 6 || 6) * factorRegimen : 0
    const bonifEssalud = gratificacion * 0.09

    // Vacaciones truncas
    const vacaciones = factorRegimen > 0 ? (remComputable / 12) * Math.min(12, totalMeses % 12 || 12) * factorRegimen : (remComputable / 24) * Math.min(12, totalMeses % 12 || 12)

    // Indemnización por despido arbitrario (1.5 sueldos por año trabajado en general, 20 días en pequeña, 10 días en micro, tope 12 sueldos)
    let indemnizacion = 0
    if (motivoCese === 'despido') {
      if (regimen === 'general') {
        indemnizacion = Math.min(remComputable * 12, remComputable * 1.5 * totalAnios)
      } else if (regimen === 'pequena') {
        indemnizacion = Math.min(remComputable * 4, (remComputable / 30) * 20 * totalAnios)
      } else {
        indemnizacion = Math.min(remComputable * 3, (remComputable / 30) * 10 * totalAnios)
      }
    }

    const totalLiquidacion = cts + gratificacion + bonifEssalud + vacaciones + indemnizacion

    return {
      remComputable,
      diffDays,
      totalAnios: totalAnios.toFixed(1),
      cts: Math.round(cts),
      gratificacion: Math.round(gratificacion),
      bonifEssalud: Math.round(bonifEssalud),
      vacaciones: Math.round(vacaciones),
      indemnizacion: Math.round(indemnizacion),
      totalLiquidacion: Math.round(totalLiquidacion),
    }
  }

  // Alimentos Calculation Logic
  const calcularAlimentos = () => {
    const ingreso = Math.max(0, parseFloat(ingresoDemandado) || 0)
    const hijos = Math.max(1, parseInt(numHijos, 10) || 1)

    // Porcentajes típicos fijados por Juzgados de Paz Letrado del Perú (Art. 648 CPC):
    // 1 hijo: 20% a 30%
    // 2 hijos: 35% a 45%
    // 3 o más hijos: 50% a 60% (tope legal máximo: 60%)
    let pctMin = 0.2
    let pctMax = 0.3
    if (hijos === 2) {
      pctMin = 0.35
      pctMax = 0.45
    } else if (hijos >= 3) {
      pctMin = 0.5
      pctMax = 0.6
    }

    const montoMin = Math.round(ingreso * pctMin)
    const montoMax = Math.round(ingreso * pctMax)

    return {
      pctMin: Math.round(pctMin * 100),
      pctMax: Math.round(pctMax * 100),
      montoMin,
      montoMax,
      hijos,
    }
  }

  // Prescripción Calculation Logic
  const calcularPrescripcion = () => {
    const start = new Date(fechaUltimoPago)
    const now = new Date()
    const diffAnios = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    let aniosLimite = 4
    let nombreNorma = 'Ley General de Transporte y Tránsito Terrestre (Ley 27181)'
    let explicacion = 'Las papeletas de tránsito prescriben a los 4 años desde que fueron impuestas si no hubo cobranza coactiva válida.'

    if (tipoDeuda === 'tributario') {
      aniosLimite = 4
      nombreNorma = 'Artículo 43° del Código Tributario Peruano'
      explicacion = 'El impuesto predial, arbitrios y deudas tributarias prescriben a los 4 años (o 6 si no presentaste declaración jurada).'
    } else if (tipoDeuda === 'banco') {
      aniosLimite = 10
      nombreNorma = 'Artículo 2001° inciso 1 del Código Civil Peruano'
      explicacion = 'Las deudas personales y tarjetas de crédito prescriben a los 10 años para la acción personal de cobro judicial.'
    } else if (tipoDeuda === 'pagare') {
      aniosLimite = 3
      nombreNorma = 'Ley de Títulos Valores (Ley 27287)'
      explicacion = 'La acción cambiaria directa en pagarés y letras de cambio prescribe a los 3 años del vencimiento.'
    }

    const estaPrescrita = diffAnios >= aniosLimite

    return {
      diffAnios: diffAnios.toFixed(1),
      aniosLimite,
      estaPrescrita,
      nombreNorma,
      explicacion,
    }
  }

  const resLiq = calcularLiquidacion()
  const resAli = calcularAlimentos()
  const resPres = calcularPrescripcion()

  const handleCopy = async () => {
    let summaryText = ''
    if (tab === 'liquidacion') {
      summaryText = `CÁLCULO DE LIQUIDACIÓN LABORAL ESTIMADA (PERÚ)
Remuneración Computable: S/ ${resLiq.remComputable}
Tiempo laborado: ${resLiq.totalAnios} años (${resLiq.diffDays} días)
CTS Trunca: S/ ${resLiq.cts}
Gratificación Trunca + Bonificación: S/ ${resLiq.gratificacion + resLiq.bonifEssalud}
Vacaciones Truncas: S/ ${resLiq.vacaciones}
${resLiq.indemnizacion > 0 ? `Indemnización por Despido Arbitrario: S/ ${resLiq.indemnizacion}\n` : ''}
TOTAL ESTIMADO A RECIBIR: S/ ${resLiq.totalLiquidacion}`
    } else if (tab === 'alimentos') {
      summaryText = `CÁLCULO ESTIMADO DE PENSIÓN DE ALIMENTOS (PERÚ)
Ingreso del Demandado: S/ ${ingresoDemandado}
Número de Hijos: ${resAli.hijos}
Rango legal estimado por Juez (20% a 60%):
Entre S/ ${resAli.montoMin} y S/ ${resAli.montoMax} Soles mensuales (${resAli.pctMin}% - ${resAli.pctMax}%)`
    } else {
      summaryText = `VERIFICACIÓN DE PRESCRIPCIÓN DE DEUDA (PERÚ)
Tipo de Deuda: ${tipoDeuda.toUpperCase()}
Años transcurridos: ${resPres.diffAnios} años (Límite legal: ${resPres.aniosLimite} años)
Estado: ${resPres.estaPrescrita ? 'PRESCRITA (Legalmente ya no te la pueden exigir judicialmente)' : 'VIGENTE'}
Base legal: ${resPres.nombreNorma}`
    }

    await navigator.clipboard.writeText(summaryText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConsultSpecialist = () => {
    onClose()
    if (tab === 'liquidacion') {
      navigate('/chat/valentina', {
        state: {
          transferMessage: `Hola Valentina, acabo de calcular mi liquidación: ganaba S/ ${sueldo}, trabajé ${resLiq.totalAnios} años y me corresponde un estimado de S/ ${resLiq.totalLiquidacion}. El motivo fue ${motivoCese}. ¿Cómo me ayudas a exigir mi pago ante SUNAFIL o mi empleador?`,
        },
      })
    } else if (tab === 'alimentos') {
      navigate('/chat/camila', {
        state: {
          transferMessage: `Hola Camila, calculé la pensión para mis ${resAli.hijos} hijo(s) y el demandado gana aprox S/ ${ingresoDemandado}. Corresponde un estimado entre S/ ${resAli.montoMin} y S/ ${resAli.montoMax}. ¿Cómo redactamos la demanda gratuita de alimentos?`,
        },
      })
    } else {
      navigate('/chat/diego', {
        state: {
          transferMessage: `Hola Diego, tengo una deuda de tipo ${tipoDeuda} con fecha ${fechaUltimoPago} (${resPres.diffAnios} años). El verificador indica que ${resPres.estaPrescrita ? 'ya prescribió' : 'está vigente'}. ¿Cómo redacto mi solicitud de prescripción para que no me cobren?`,
        },
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-2xl p-6 relative max-h-[92vh] flex flex-col"
        style={{
          background: '#161616',
          border: '1px solid #333333',
          boxShadow: '0 20px 50px rgba(0,0,0,0.80)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
            >
              <Calculator size={16} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Calculadoras Legales en Soles</h3>
              <p className="text-[10px] text-white/40">
                Montos y plazos exactos calculados bajo la legislación peruana vigente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selection — Responsive Mobile Scroll & Desktop Grid */}
        <div className="flex gap-2 mb-4 flex-shrink-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-3">
          <button
            onClick={() => setTab('liquidacion')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[160px] sm:min-w-0 flex-1 ${
              tab === 'liquidacion'
                ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
            }`}
          >
            <Briefcase size={16} className={tab === 'liquidacion' ? 'text-[#c9a84c]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Liquidación Laboral</span>
              <span className="block text-[8.5px] opacity-70">CTS, Grati y Despido</span>
            </div>
          </button>

          <button
            onClick={() => setTab('alimentos')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[160px] sm:min-w-0 flex-1 ${
              tab === 'alimentos'
                ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
            }`}
          >
            <Baby size={16} className={tab === 'alimentos' ? 'text-[#34d17a]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Pensión Alimentos</span>
              <span className="block text-[8.5px] opacity-70">Rango y % Judicial</span>
            </div>
          </button>

          <button
            onClick={() => setTab('prescripcion')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[160px] sm:min-w-0 flex-1 ${
              tab === 'prescripcion'
                ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
            }`}
          >
            <CreditCard size={16} className={tab === 'prescripcion' ? 'text-[#60a5fa]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Prescripción Deudas</span>
              <span className="block text-[8.5px] opacity-70">SAT, Bancos y Multas</span>
            </div>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-[11px]">
          {/* TAB 1: LIQUIDACION */}
          {tab === 'liquidacion' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-[#111111] p-3.5 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Sueldo Mensual Bruto (S/)
                  </label>
                  <input
                    type="number"
                    value={sueldo}
                    onChange={(e) => setSueldo(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#c9a84c]"
                  />
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-[#161616] border border-white/5">
                  <span className="text-[10px] text-white/70">¿Tienes hijos menores? (+S/ 113 Asignación)</span>
                  <input
                    type="checkbox"
                    checked={tieneHijos}
                    onChange={(e) => setTieneHijos(e.target.checked)}
                    className="accent-[#c9a84c] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">Fecha de Ingreso</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] outline-none focus:border-[#c9a84c]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">Fecha de Cese</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 rounded-lg px-2 py-1 text-white text-[10px] outline-none focus:border-[#c9a84c]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">Motivo de Salida</label>
                  <select
                    value={motivoCese}
                    onChange={(e) => setMotivoCese(e.target.value as any)}
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-[#c9a84c]"
                  >
                    <option value="despido">Despido Arbitrario / Sin Causa (Con Indemnización)</option>
                    <option value="renuncia">Renuncia Voluntaria</option>
                    <option value="termino">Término / No Renovación de Contrato</option>
                  </select>
                </div>
              </div>

              {/* Resultado Liquidación */}
              <div className="p-4 rounded-xl border flex flex-col justify-between" style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.25)' }}>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#c9a84c] tracking-wider block mb-1">
                    Monto Total Estimado a Cobrar
                  </span>
                  <div className="text-2xl font-bold text-white mb-2">
                    S/ {resLiq.totalLiquidacion.toLocaleString()} <span className="text-xs font-normal text-white/40">Soles</span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/10 text-[10px]">
                    <div className="flex justify-between text-white/70">
                      <span>CTS Trunca:</span>
                      <span className="font-mono text-white">S/ {resLiq.cts}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Gratificación Trunca + Bonif. 9%:</span>
                      <span className="font-mono text-white">S/ {resLiq.gratificacion + resLiq.bonifEssalud}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Vacaciones Truncas:</span>
                      <span className="font-mono text-white">S/ {resLiq.vacaciones}</span>
                    </div>
                    {resLiq.indemnizacion > 0 && (
                      <div className="flex justify-between text-[#c9a84c] font-semibold pt-1 border-t border-white/5">
                        <span>Indemnización por Despido:</span>
                        <span className="font-mono">S/ {resLiq.indemnizacion}</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[9px] text-white/40 mt-3 pt-2 border-t border-white/5">
                  ⚖️ Tu empleador tiene un <strong>plazo fatal de 48 horas</strong> tras tu cese para pagarte la liquidación. Si no te pagan, procede denuncia ante SUNAFIL.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: ALIMENTOS */}
          {tab === 'alimentos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-[#111111] p-3.5 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Ingreso Mensual del Demandado (Aprox S/)
                  </label>
                  <input
                    type="number"
                    value={ingresoDemandado}
                    onChange={(e) => setIngresoDemandado(e.target.value)}
                    placeholder="2500"
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#c9a84c]"
                  />
                  <span className="text-[8px] text-white/30 block mt-1">Si no tiene sueldo fijo, el juez calcula sobre la Remuneración Mínima Vital (S/ 1,130).</span>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Número de Hijos Menores o Dependientes
                  </label>
                  <select
                    value={numHijos}
                    onChange={(e) => setNumHijos(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-[#c9a84c]"
                  >
                    <option value="1">1 Hijo (20% - 30%)</option>
                    <option value="2">2 Hijos (35% - 45%)</option>
                    <option value="3">3 o más Hijos (50% - 60% Tope Legal)</option>
                  </select>
                </div>
              </div>

              {/* Resultado Alimentos */}
              <div className="p-4 rounded-xl border flex flex-col justify-between" style={{ background: 'rgba(52,209,122,0.06)', borderColor: 'rgba(52,209,122,0.25)' }}>
                <div>
                  <span className="text-[9px] uppercase font-bold text-[#34d17a] tracking-wider block mb-1">
                    Pensión Mensual Estimada que Fijará el Juez
                  </span>
                  <div className="text-xl font-bold text-white mb-2">
                    S/ {resAli.montoMin} — S/ {resAli.montoMax} <span className="text-xs font-normal text-white/40">Soles/mes</span>
                  </div>

                  <p className="text-[10px] text-white/70 leading-relaxed">
                    Corresponde a un <strong>{resAli.pctMin}% al {resAli.pctMax}%</strong> de los ingresos totales del demandado (incluyendo gratificaciones de julio y diciembre).
                  </p>
                </div>

                <p className="text-[9px] text-white/40 mt-3 pt-2 border-t border-white/5">
                  👶 Recuerda: La demanda de alimentos es <strong>100% gratuita</strong> y el juez puede ordenar la retención judicial directa por planilla en el trabajo del demandado.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: PRESCRIPCION */}
          {tab === 'prescripcion' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-[#111111] p-3.5 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Tipo de Deuda o Multa
                  </label>
                  <select
                    value={tipoDeuda}
                    onChange={(e) => setTipoDeuda(e.target.value as any)}
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-[#c9a84c]"
                  >
                    <option value="sat">Papeleta de Tránsito SAT / MTC (4 años)</option>
                    <option value="tributario">Impuesto Predial / Arbitrios Municipales (4 años)</option>
                    <option value="banco">Tarjeta de Crédito / Préstamo Bancario (10 años)</option>
                    <option value="pagare">Letra de Cambio / Pagaré (3 años)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Fecha del Último Pago o Notificación
                  </label>
                  <input
                    type="date"
                    value={fechaUltimoPago}
                    onChange={(e) => setFechaUltimoPago(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#c9a84c]"
                  />
                </div>
              </div>

              {/* Resultado Prescripción */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  background: resPres.estaPrescrita ? 'rgba(52,209,122,0.06)' : 'rgba(245,158,11,0.06)',
                  borderColor: resPres.estaPrescrita ? 'rgba(52,209,122,0.30)' : 'rgba(245,158,11,0.30)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {resPres.estaPrescrita ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <AlertCircle size={16} className="text-amber-400" />
                    )}
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: resPres.estaPrescrita ? '#34d17a' : '#f59e0b' }}
                    >
                      {resPres.estaPrescrita ? 'DEUDA PRESCRITA' : 'DEUDA AÚN VIGENTE'}
                    </span>
                  </div>

                  <p className="text-[11px] text-white/80 font-medium mt-1">
                    Han transcurrido <strong>{resPres.diffAnios} años</strong> (el plazo legal es de {resPres.aniosLimite} años).
                  </p>
                  <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed">
                    {resPres.explicacion}
                  </p>
                </div>

                <div className="text-[9px] text-white/40 mt-3 pt-2 border-t border-white/5">
                  🛡️ Protección al sueldo: En el Perú, las cuentas de sueldo son <strong>inembargables hasta por S/ 2,575</strong> (5 URP).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 mt-4 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-light border border-white/15 text-white/80 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Cálculo copiado' : 'Copiar Resultado'}</span>
          </button>

          <button
            onClick={handleConsultSpecialist}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[11px] font-semibold transition-all"
            style={{ background: '#c9a84c', color: '#111111' }}
          >
            <MessageSquare size={13} />
            <span>Consultar este caso con un asesor</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </motion.div>
    </div>
  )
}
