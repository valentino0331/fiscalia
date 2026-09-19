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
  MessageSquare,
  Landmark,
  Scale,
  ShieldAlert,
  Gavel
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface CitizenCalculatorsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'liquidacion' | 'alimentos' | 'prescripcion' | 'penal' | 'aranceles'
}

export default function CitizenCalculatorsModal({
  isOpen,
  onClose,
  initialTab = 'liquidacion',
}: CitizenCalculatorsModalProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'liquidacion' | 'alimentos' | 'prescripcion' | 'penal' | 'aranceles'>(initialTab)
  const [copied, setCopied] = useState(false)


  const [sueldo, setSueldo] = useState('2000')
  const [tieneHijos, setTieneHijos] = useState(false)
  const [regimen, setRegimen] = useState<'general' | 'pequena' | 'micro'>('general')
  const [fechaInicio, setFechaInicio] = useState('2024-01-01')
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().slice(0, 10))
  const [motivoCese, setMotivoCese] = useState<'renuncia' | 'despido' | 'termino'>('despido')

  const [ingresoDemandado, setIngresoDemandado] = useState('2500')
  const [numHijos, setNumHijos] = useState('1')
  const [gastosColegioSalud, setGastosColegioSalud] = useState('900')

  const [tipoDeuda, setTipoDeuda] = useState<'sat' | 'tributario' | 'banco' | 'pagare'>('sat')
  const [fechaUltimoPago, setFechaUltimoPago] = useState('2020-01-15')

  // Prescripción Penal & Plazos NCPP State
  const [delitoNombre, setDelitoNombre] = useState('Robo Agravado (Art. 189 CP)')
  const [penaMaxima, setPenaMaxima] = useState('12')
  const [fechaHechos, setFechaHechos] = useState('2019-03-15')
  const [esFuncionarioPublico, setEsFuncionarioPublico] = useState(false)
  const [complejidadPenal, setComplejidadPenal] = useState<'comun' | 'complejo' | 'crimen_organizado'>('comun')

  // Aranceles PJ 2026 State
  const [actoProcesal, setActoProcesal] = useState<string>('apelacion_auto')
  const [numCopias, setNumCopias] = useState<string>('10')

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

    // En la legislación laboral peruana (D.Leg 650, Ley 27735, D.Leg 713):
    // Se requiere haber laborado al menos un mes completo para tener derecho a beneficios truncos.
    const mesesSemestre = totalMeses < 1 ? 0 : (totalMeses % 6 === 0 ? 6 : totalMeses % 6)
    const mesesAnioVac = totalMeses < 1 ? 0 : (totalMeses % 12 === 0 ? 12 : totalMeses % 12)

    // CTS trunca (rem computable + 1/6 gratificación)
    const baseCTS = remComputable + remComputable / 6
    const cts = factorRegimen > 0 && totalMeses >= 1 ? (baseCTS / 12) * Math.min(6, mesesSemestre) * factorRegimen : 0

    // Gratificación trunca + Bonificación 9% Essalud
    const gratificacion = factorRegimen > 0 && totalMeses >= 1 ? (remComputable / 6) * Math.min(6, mesesSemestre) * factorRegimen : 0
    const bonifEssalud = gratificacion * 0.09

    // Vacaciones truncas
    const vacaciones = totalMeses >= 1
      ? (factorRegimen > 0 ? (remComputable / 12) * Math.min(12, mesesAnioVac) * factorRegimen : (remComputable / 24) * Math.min(12, mesesAnioVac))
      : 0

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

  // Aranceles PJ 2026 Logic
  const ARANCELES_PJ_2026: Record<string, { label: string; pctURP: number; desc: string }> = {
    apelacion_auto: { label: 'Apelación de Auto (Art. 278 NCPP / CPC)', pctURP: 0.10, desc: 'Apelación contra autos interlocutorios o resoluciones que no ponen fin al proceso.' },
    apelacion_sentencia: { label: 'Apelación de Sentencia (Art. 364 CPC / NCPP)', pctURP: 0.40, desc: 'Recurso de apelación contra sentencia definitiva de primera instancia.' },
    casacion: { label: 'Recurso de Casación Extraordinaria (Arts. 427 y 429 NCPP / CPC)', pctURP: 1.60, desc: 'Recurso extraordinario ante las Salas Supremas de la Corte Suprema de Justicia.' },
    cautelar: { label: 'Medida Cautelar / Embargo en Forma de Retención (Art. 657 CPC)', pctURP: 0.25, desc: 'Solicitud de medida cautelar para asegurar la eficacia de la sentencia.' },
    excepcion: { label: 'Excepción Previa / Improcedencia de Acción (Art. 6 NCPP / CPC)', pctURP: 0.10, desc: 'Deducción de excepciones de prescripción, atipicidad o incompetencia.' },
    nulidad: { label: 'Nulidad de Acto Procesal / Cuestión Probatoria', pctURP: 0.10, desc: 'Pedido de nulidad deducido contra resoluciones o actuaciones viciadas.' },
    pruebas: { label: 'Ofrecimiento de Medios Probatorios Extemporáneos', pctURP: 0.03, desc: 'Acreditación de nuevos medios probatorios en el proceso.' },
    copias: { label: 'Expedición de Copias Certificadas (por foja)', pctURP: 0.01, desc: 'Expedición de testimonios y copias autenticadas por el especialista legal.' },
  }

  const calcularAranceles = () => {
    const urp = 550 // URP 2026 = S/ 550.00 (10% UIT S/ 5,500)
    const item = ARANCELES_PJ_2026[actoProcesal] || ARANCELES_PJ_2026['apelacion_auto']
    let monto = Math.round(item.pctURP * urp)
    if (actoProcesal === 'copias') {
      const fojas = Math.max(1, parseInt(numCopias, 10) || 1)
      monto = Math.round(fojas * (0.01 * urp))
    }
    return {
      monto,
      urp,
      codigoTributo: '07153',
      label: item.label,
      desc: item.desc,
      pctURP: Math.round(item.pctURP * 100),
    }
  }

  const calcularPrescripcionPenal = () => {
    const penaMaxNum = Math.max(1, parseInt(penaMaxima, 10) || 1)
    let plazoOrdinario = Math.min(20, Math.max(3, penaMaxNum))
    if (esFuncionarioPublico) {
      plazoOrdinario = Math.min(40, plazoOrdinario * 2)
    }
    const plazoExtraordinario = Math.floor(plazoOrdinario * 1.5)

    const start = new Date(fechaHechos)
    const now = new Date()
    const diffTime = Math.max(0, now.getTime() - start.getTime())
    const diffAnios = (diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1)
    const aniosNum = parseFloat(diffAnios)

    const fechaOrdinaria = new Date(start)
    fechaOrdinaria.setFullYear(fechaOrdinaria.getFullYear() + plazoOrdinario)

    const fechaExtraordinaria = new Date(start)
    fechaExtraordinaria.setFullYear(fechaExtraordinaria.getFullYear() + plazoExtraordinario)

    const estaPrescritoOrdinario = aniosNum >= plazoOrdinario
    const estaPrescritoExtraordinario = aniosNum >= plazoExtraordinario

    const plazosNCPP = {
      diligenciasPreliminares: complejidadPenal === 'comun' ? '60 días (prorrogables a 120 días)' : complejidadPenal === 'complejo' ? '8 meses' : '36 meses',
      investigacionPreparatoria: complejidadPenal === 'comun' ? '120 días (prorrogable 60 días)' : complejidadPenal === 'complejo' ? '8 meses' : '36 meses',
      prisionPreventiva: complejidadPenal === 'comun' ? 'Hasta 9 meses (D. Leg. 1585)' : complejidadPenal === 'complejo' ? 'Hasta 18 meses' : 'Hasta 36 meses',
    }

    return {
      penaMaxNum,
      plazoOrdinario,
      plazoExtraordinario,
      diffAnios,
      aniosNum,
      fechaOrdinaria: fechaOrdinaria.toISOString().slice(0, 10),
      fechaExtraordinaria: fechaExtraordinaria.toISOString().slice(0, 10),
      estaPrescritoOrdinario,
      estaPrescritoExtraordinario,
      plazosNCPP,
    }
  }

  const resLiq = calcularLiquidacion()
  const resAli = calcularAlimentos()
  const resPres = calcularPrescripcion()
  const resPenal = calcularPrescripcionPenal()
  const resAran = calcularAranceles()

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
    } else if (tab === 'aranceles') {
      summaryText = `TASA ARANCEL JUDICIAL PODER JUDICIAL DEL PERÚ (2026)
Acto Procesal: ${resAran.label}
Monto oficial a pagar: S/ ${resAran.monto}.00 (${resAran.pctURP}% URP)
Valor URP 2026: S/ ${resAran.urp}.00 (10% UIT S/ 5,500)
Código de Tributo Banco de la Nación: ${resAran.codigoTributo} (Tasas Judiciales PJ)
Lugar de Pago: Págalo.pe / Agentes y ventanillas del Banco de la Nación
Requisito: Indicar DNI/RUC del presentante, número de expediente y juzgado.`
    } else if (tab === 'penal') {
      summaryText = `CÁLCULO DE PRESCRIPCIÓN PENAL Y PLAZOS NCPP (PERÚ)
Delito Imputado: ${delitoNombre} (Pena Máxima Abstracta: ${resPenal.penaMaxNum} años)
Fecha de los Hechos: ${fechaHechos} (${resPenal.diffAnios} años transcurridos)
${esFuncionarioPublico ? 'Duplicidad por Delito contra el Estado (Art. 41 Constitución): APLICADA\n' : ''}
Plazo Ordinario de Prescripción (Art. 80 CP): ${resPenal.plazoOrdinario} años (Vence: ${resPenal.fechaOrdinaria})
Plazo Extraordinario de Prescripción (Art. 83 CP + AP 5-2023): ${resPenal.plazoExtraordinario} años (Vence: ${resPenal.fechaExtraordinaria})
Estado de la Acción Penal: ${resPenal.estaPrescritoExtraordinario ? 'ACCIÓN PENAL EXTINGUIDA POR PRESCRIPCIÓN EXTRAORDINARIA' : resPenal.estaPrescritoOrdinario ? 'PLAZO ORDINARIO CUMPLIDO (Verificar interrupción/suspensión)' : 'ACCIÓN PENAL VIGENTE'}
Plazos NCPP aplicables (${complejidadPenal.toUpperCase()}):
- Diligencias Preliminares: ${resPenal.plazosNCPP.diligenciasPreliminares}
- Investigación Preparatoria: ${resPenal.plazosNCPP.investigacionPreparatoria}
- Prisión Preventiva: ${resPenal.plazosNCPP.prisionPreventiva}`
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
    } else if (tab === 'aranceles') {
      navigate('/chat/diego', {
        state: {
          transferMessage: `Hola Diego, voy a presentar un acto procesal de ${resAran.label} y el arancel judicial PJ (código 07153) es de S/ ${resAran.monto}.00. ¿Me ayudas a redactar el escrito con la fundamentación jurídica completa y los Otrosí Digo de rigor?`,
        },
      })
    } else if (tab === 'penal') {
      navigate('/chat/sebastian', {
        state: {
          transferMessage: `Hola Sebastián, verifiqué la prescripción penal del delito ${delitoNombre} (pena máxima ${resPenal.penaMaxNum} años). Han pasado ${resPenal.diffAnios} años. El plazo extraordinario con el Acuerdo Plenario 05-2023 es de ${resPenal.plazoExtraordinario} años y figura como ${resPenal.estaPrescritoExtraordinario ? 'PRESCRITO' : 'VIGENTE'}. ¿Cómo planteamos la excepción de prescripción o defensa procesal?`,
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
        <div className="flex gap-2 mb-4 flex-shrink-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-5">
          <button
            onClick={() => setTab('liquidacion')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[150px] sm:min-w-0 flex-1 ${tab === 'liquidacion'
                ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
              }`}
          >
            <Briefcase size={16} className={tab === 'liquidacion' ? 'text-[#c9a84c]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Liquidación</span>
              <span className="block text-[8.5px] opacity-70">Laboral CTS</span>
            </div>
          </button>

          <button
            onClick={() => setTab('alimentos')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[150px] sm:min-w-0 flex-1 ${tab === 'alimentos'
                ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
              }`}
          >
            <Baby size={16} className={tab === 'alimentos' ? 'text-[#c9a84c]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Alimentos</span>
              <span className="block text-[8.5px] opacity-70">Pensión Menor</span>
            </div>
          </button>

          <button
            onClick={() => setTab('prescripcion')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[150px] sm:min-w-0 flex-1 ${tab === 'prescripcion'
                ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
              }`}
          >
            <CreditCard size={16} className={tab === 'prescripcion' ? 'text-[#c9a84c]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Deudas SAT</span>
              <span className="block text-[8.5px] opacity-70">Civil/Bancos</span>
            </div>
          </button>

          <button
            onClick={() => setTab('penal')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[150px] sm:min-w-0 flex-1 ${tab === 'penal'
                ? 'border-[#ef4444] bg-[#ef4444]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
              }`}
          >
            <ShieldAlert size={16} className={tab === 'penal' ? 'text-[#ef4444]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Penal & NCPP</span>
              <span className="block text-[8.5px] opacity-70">Prescripción CP</span>
            </div>
          </button>

          <button
            onClick={() => setTab('aranceles')}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[11px] font-medium border transition-all text-left min-w-[150px] sm:min-w-0 flex-1 ${tab === 'aranceles'
                ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
              }`}
          >
            <Scale size={16} className={tab === 'aranceles' ? 'text-[#c9a84c]' : 'text-white/40'} />
            <div>
              <span className="font-semibold block">Aranceles PJ</span>
              <span className="block text-[8.5px] opacity-70">Tasas 2026</span>
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

                <div className="p-2.5 rounded-xl bg-black/40 border border-[#c9a84c]/20 mt-2.5 space-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5 text-[#c9a84c] font-semibold">
                    <Scale size={12} />
                    <span>Base Normativa SPIJ & Plenos Laborales:</span>
                  </div>
                  <div className="text-white/75 space-y-0.5 font-light">
                    <div>• <strong>CTS:</strong> D. Leg. 650 y D.S. 001-97-TR (Pago obligatorio dentro de 48h tras el cese).</div>
                    <div>• <strong>Gratificaciones:</strong> Ley 27735 y Ley 30334 (Exoneración 9% EsSalud permanente).</div>
                    <div>• <strong>Despido Arbitrario:</strong> Art. 38 LPCL y II Pleno Jurisdiccional Supremo Laboral.</div>
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

                <div className="p-2.5 rounded-xl bg-black/40 border border-[#34d17a]/20 mt-2.5 space-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5 text-[#34d17a] font-semibold">
                    <Scale size={12} />
                    <span>Base Normativa SPIJ & Tenencia Compartida:</span>
                  </div>
                  <div className="text-white/75 space-y-0.5 font-light">
                    <div>• <strong>Proporcionalidad:</strong> Arts. 472 y 481 del Código Civil según necesidad y capacidad.</div>
                    <div>• <strong>Tenencia Compartida:</strong> Ley N° 31590 y Pleno Nacional de Familia 2022.</div>
                    <div>• <strong>Celeridad Procesal:</strong> Ley N° 31464 (Proceso gratuito simplificado).</div>
                  </div>
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

                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 mt-2.5 space-y-1 text-[10px]">
                  <div className="flex items-center gap-1.5 text-[#c9a84c] font-semibold">
                    <Scale size={12} />
                    <span>Base Legal Oficial SPIJ:</span>
                  </div>
                  <div className="text-white/75 space-y-0.5 font-light">
                    <div>• <strong>Tributos y Papeletas SAT:</strong> Art. 43 Código Tributario (Prescribe a los 4 años).</div>
                    <div>• <strong>Deudas Bancarias y Contratos:</strong> Art. 2001 Inc. 1 Código Civil (10 años).</div>
                    <div>• <strong>Pagaré / Títulos Valores:</strong> Art. 96 Ley 27287 (Prescribe a los 3 años).</div>
                  </div>
                </div>

                <div className="text-[9px] text-white/40 mt-3 pt-2 border-t border-white/5">
                  🛡️ Protección al sueldo: En el Perú, las cuentas de sueldo son <strong>inembargables hasta por S/ 2,575</strong> (5 URP).
                </div>
              </div>
            </div>
          )}

          {/* TAB PENAL: PRESCRIPCIÓN PENAL & PLAZOS NCPP */}
          {tab === 'penal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-[#111111] p-3.5 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Delito Imputado (Código Penal)
                  </label>
                  <input
                    type="text"
                    value={delitoNombre}
                    onChange={(e) => setDelitoNombre(e.target.value)}
                    placeholder="Ej. Robo Agravado, Estafa, Apropiación Ilícita..."
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#ef4444] text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                      Pena Máx. (Años)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="35"
                      value={penaMaxima}
                      onChange={(e) => setPenaMaxima(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#ef4444] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                      Fecha de los Hechos
                    </label>
                    <input
                      type="date"
                      value={fechaHechos}
                      onChange={(e) => setFechaHechos(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-[#ef4444] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Complejidad del Caso (NCPP)
                  </label>
                  <select
                    value={complejidadPenal}
                    onChange={(e) => setComplejidadPenal(e.target.value as any)}
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2 py-1.5 text-white outline-none focus:border-[#ef4444] text-xs"
                  >
                    <option value="comun">Proceso Común (Investigación 120 días / PP 9 meses)</option>
                    <option value="complejo">Proceso Complejo (Investigación 8 meses / PP 18 meses)</option>
                    <option value="crimen_organizado">Crimen Organizado (Investigación 36 meses / PP 36 meses)</option>
                  </select>
                </div>

                <div className="pt-1 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-white/70">
                    <input
                      type="checkbox"
                      checked={esFuncionarioPublico}
                      onChange={(e) => setEsFuncionarioPublico(e.target.checked)}
                      className="rounded text-[#ef4444] focus:ring-0"
                    />
                    <span>¿Cometido por funcionario público contra el Estado? (Duplica plazo - Art. 41 Const.)</span>
                  </label>
                </div>
              </div>

              {/* Resultado Prescripción Penal */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  background: resPenal.estaPrescritoExtraordinario
                    ? 'rgba(52,209,122,0.06)'
                    : 'rgba(239,68,68,0.06)',
                  borderColor: resPenal.estaPrescritoExtraordinario
                    ? 'rgba(52,209,122,0.30)'
                    : 'rgba(239,68,68,0.30)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    {resPenal.estaPrescritoExtraordinario ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <ShieldAlert size={16} className="text-red-400" />
                    )}
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: resPenal.estaPrescritoExtraordinario ? '#34d17a' : '#ef4444' }}
                    >
                      {resPenal.estaPrescritoExtraordinario
                        ? 'ACCIÓN PENAL EXTINGUIDA (PRESCRITO)'
                        : 'ACCIÓN PENAL VIGENTE'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-white/85">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-white/60">Tiempo transcurrido:</span>
                      <strong className="text-white">{resPenal.diffAnios} años</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-white/60">Plazo Ordinario (Art. 80 CP):</span>
                      <strong className="text-white">{resPenal.plazoOrdinario} años ({resPenal.fechaOrdinaria})</strong>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-white/60">Plazo Extraordinario (Art. 83 CP + AP 5-2023):</span>
                      <strong className="text-[#c9a84c]">{resPenal.plazoExtraordinario} años ({resPenal.fechaExtraordinaria})</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 mt-2.5 space-y-1 text-[10px] text-white/65">
                    <span className="font-semibold text-white/90 block">Plazos Procesales NCPP:</span>
                    <div>• Diligencias Preliminares: <span className="text-white/90">{resPenal.plazosNCPP.diligenciasPreliminares}</span></div>
                    <div>• Inv. Preparatoria: <span className="text-white/90">{resPenal.plazosNCPP.investigacionPreparatoria}</span></div>
                    <div>• Prisión Preventiva: <span className="text-white/90">{resPenal.plazosNCPP.prisionPreventiva}</span></div>
                  </div>
                </div>

                <div className="text-[9px] text-white/40 mt-3 pt-2 border-t border-white/5">
                  ⚖️ Doctrina Vinculante: Conforme al <strong>Acuerdo Plenario N° 05-2023/CIJ-112</strong>, la Corte Suprema declaró inaplicable por control difuso el límite de 1 año de la Ley 31751 ("Ley Soto").
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ARANCELES JUDICIALES PJ 2026 */}
          {tab === 'aranceles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3 bg-[#111111] p-3.5 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                    Acto Procesal a Interponer
                  </label>
                  <select
                    value={actoProcesal}
                    onChange={(e) => setActoProcesal(e.target.value)}
                    className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-2 text-white outline-none focus:border-[#c9a84c] text-xs"
                  >
                    <option value="apelacion_auto">Apelación de Auto (10% URP — Art. 278 NCPP / CPC)</option>
                    <option value="apelacion_sentencia">Apelación de Sentencia (40% URP — Art. 364 CPC)</option>
                    <option value="casacion">Recurso de Casación (160% URP — Arts. 427 y 429 NCPP)</option>
                    <option value="cautelar">Medida Cautelar / Embargo (25% URP — Art. 657 CPC)</option>
                    <option value="excepcion">Excepción Previa / Improcedencia de Acción (10% URP)</option>
                    <option value="nulidad">Nulidad de Acto Procesal / Cuestión Probatoria (10% URP)</option>
                    <option value="pruebas">Ofrecimiento de Medios Probatorios (3% URP)</option>
                    <option value="copias">Expedición de Copias Certificadas (por foja)</option>
                  </select>
                  <p className="text-[10px] text-white/50 mt-1.5 leading-snug">
                    {resAran.desc}
                  </p>
                </div>

                {actoProcesal === 'copias' && (
                  <div>
                    <label className="block text-[9px] uppercase font-semibold text-white/40 mb-1">
                      Número de Fojas / Páginas
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={numCopias}
                      onChange={(e) => setNumCopias(e.target.value)}
                      className="w-full bg-[#161616] border border-white/10 rounded-lg px-2.5 py-1.5 text-white outline-none focus:border-[#c9a84c]"
                    />
                  </div>
                )}

                <div className="p-3 rounded-lg border border-white/5 bg-white/[0.02] space-y-1 text-[10px] text-white/60">
                  <div className="flex justify-between">
                    <span>Valor URP 2026:</span>
                    <strong className="text-white">S/ 550.00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor UIT 2026:</span>
                    <strong className="text-white">S/ 5,500.00</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Porcentaje URP aplicado:</span>
                    <strong className="text-[#c9a84c]">{resAran.pctURP}%</strong>
                  </div>
                </div>
              </div>

              {/* Resultado Aranceles */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  background: 'rgba(201,168,76,0.06)',
                  borderColor: 'rgba(201,168,76,0.30)',
                }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Landmark size={16} className="text-[#c9a84c]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">
                      TASA JUDICIAL PODER JUDICIAL
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-white my-2">
                    S/ {resAran.monto}.00 <span className="text-xs font-normal text-white/40">Soles</span>
                  </div>

                  <div className="space-y-1.5 text-[10px] text-white/80 mt-2">
                    <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                      <span className="text-white/60">Código Banco de la Nación:</span>
                      <strong className="text-[#34d17a] font-mono text-xs">07153</strong>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                      <span className="text-white/60">Nombre tributo:</span>
                      <strong className="text-white">Tasas Judiciales PJ</strong>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/50 mt-2.5 leading-relaxed">
                    💳 <strong>¿Dónde pagar?:</strong> En ventanilla del Banco de la Nación, agentes BN o en línea vía <strong>Págalo.pe</strong> consignando el DNI/RUC del litigante o abogado patrocinante.
                  </p>
                </div>

                <div className="text-[9px] text-white/40 mt-3 pt-2 border-t border-white/5">
                  📌 Al adjuntar el comprobante en mesa de partes SINOE o física, consigna el número de secuencia, fecha y código de operación del arancel.
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
