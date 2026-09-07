import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  FileText,
  Copy,
  Check,
  Baby,
  MailCheck,
  ShoppingBag,
  Home,
  Printer,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Briefcase,
  Scale,
  Banknote,
  Eye,
  Download,
  Fingerprint,
  Stamp,
  Maximize2,
  Minimize2,
  FileDown,
  Sparkles,
} from 'lucide-react'
import { buildPrintHTML, downloadWordDoc, renderDocHtmlBody } from '@/lib/exportDoc'

interface CitizenDocumentGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  initialDocType?: DocType
}

export type DocType =
  | 'alimentos'
  | 'carta_notarial'
  | 'indecopi'
  | 'alquiler'
  | 'renuncia'
  | 'poder_simple'
  | 'mutuo'

interface DocMeta {
  id: DocType
  label: string
  sublabel: string
  icon: React.ReactNode
  free: boolean
  badgeColor: string
}

const DOC_TYPES: DocMeta[] = [
  {
    id: 'carta_notarial',
    label: 'Carta Notarial',
    sublabel: 'Requerimiento oficial (D. Leg. 1049)',
    icon: <MailCheck size={16} />,
    free: false,
    badgeColor: '#c9a84c',
  },
  {
    id: 'alimentos',
    label: 'Demanda de Alimentos',
    sublabel: 'Juzgado de Paz Letrado (Ley 28439)',
    icon: <Baby size={16} />,
    free: true,
    badgeColor: '#34d17a',
  },
  {
    id: 'alquiler',
    label: 'Contrato de Alquiler',
    sublabel: 'Desalojo Notarial Express (Ley 30933)',
    icon: <Home size={16} />,
    free: false,
    badgeColor: '#c9a84c',
  },
  {
    id: 'indecopi',
    label: 'Reclamo INDECOPI',
    sublabel: 'Libro de Reclamaciones (Ley 29571)',
    icon: <ShoppingBag size={16} />,
    free: true,
    badgeColor: '#60a5fa',
  },
  {
    id: 'renuncia',
    label: 'Carta de Renuncia',
    sublabel: 'Preaviso y liquidación (D.S. 003-97-TR)',
    icon: <Briefcase size={16} />,
    free: true,
    badgeColor: '#34d17a',
  },
  {
    id: 'poder_simple',
    label: 'Poder Simple',
    sublabel: 'Representación formal de trámite',
    icon: <Scale size={16} />,
    free: true,
    badgeColor: '#a78bfa',
  },
  {
    id: 'mutuo',
    label: 'Mutuo Dinerario',
    sublabel: 'Préstamo con mérito ejecutivo',
    icon: <Banknote size={16} />,
    free: false,
    badgeColor: '#f59e0b',
  },
]

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  type?: string
  hint?: string
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase font-medium mb-1.5 tracking-wider" style={{ color: 'rgba(255,255,255,0.60)' }}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-all"
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#ffffff',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#c9a84c'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.10)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {hint && <p className="mt-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{hint}</p>}
    </div>
  )
}

function FieldTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  required,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  required?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase font-medium mb-1.5 tracking-wider" style={{ color: 'rgba(255,255,255,0.60)' }}>
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-xl px-3.5 py-2.5 text-[13px] outline-none transition-all resize-none leading-relaxed"
        style={{
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#ffffff',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#c9a84c'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(201,168,76,0.10)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
      {hint && <p className="mt-1 text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{hint}</p>}
    </div>
  )
}

// ─── Formatos Oficiales Reglamentarios por Tipo de Documento (Perú 2026) ──────
// Fuente: D. Leg. 1049 (Notarial), CPC Art. 130 (Judicial), Ley 30933 (Arrendamiento),
//         Ley 29571 (Consumidor/INDECOPI), D.S. 003-97-TR (Laboral)
const DOC_FORMAT: Record<DocType, {
  fontFamily: string
  fontFamilyCss: string
  fontSizePt: number
  lineHeight: number
  marginTopCm: number
  marginBottomCm: number
  marginLeftCm: number
  marginRightCm: number
  note: string
}> = {
  // Carta Notarial → D. Leg. 1049: TNR 12pt, interlineado 1.5, márgenes protocolo notarial
  carta_notarial: {
    fontFamily: 'Times New Roman', fontFamilyCss: "'Times New Roman', Times, serif",
    fontSizePt: 12, lineHeight: 1.5,
    marginTopCm: 3.5, marginBottomCm: 2.5, marginLeftCm: 3.5, marginRightCm: 2.5,
    note: 'D. Leg. 1049 Art. 97 — Protocolo Notarial'
  },
  // Demanda de Alimentos → CPC Art. 130: TNR 12pt, interlineado 1.5, márgenes del Poder Judicial
  alimentos: {
    fontFamily: 'Times New Roman', fontFamilyCss: "'Times New Roman', Times, serif",
    fontSizePt: 12, lineHeight: 1.5,
    marginTopCm: 3.5, marginBottomCm: 2.5, marginLeftCm: 3.5, marginRightCm: 2.5,
    note: 'CPC Art. 130 — Poder Judicial del Perú'
  },
  // Contrato de Alquiler → Ley 30933 / D. Leg. 1177: Arial 11pt, interlineado 1.5, márgenes civiles
  alquiler: {
    fontFamily: 'Arial', fontFamilyCss: 'Arial, Helvetica, sans-serif',
    fontSizePt: 11, lineHeight: 1.5,
    marginTopCm: 3.0, marginBottomCm: 2.5, marginLeftCm: 3.0, marginRightCm: 2.5,
    note: 'Ley 30933 — Desalojo Notarial Express'
  },
  // Reclamo INDECOPI → Ley 29571 (Código de Consumo): Arial 12pt, interlineado 1.5
  indecopi: {
    fontFamily: 'Arial', fontFamilyCss: 'Arial, Helvetica, sans-serif',
    fontSizePt: 12, lineHeight: 1.5,
    marginTopCm: 3.0, marginBottomCm: 2.5, marginLeftCm: 3.0, marginRightCm: 2.5,
    note: 'Ley 29571 Art. 150 — INDECOPI'
  },
  // Carta de Renuncia → D.S. 003-97-TR: Arial 12pt, interlineado 1.5, márgenes laborales
  renuncia: {
    fontFamily: 'Arial', fontFamilyCss: 'Arial, Helvetica, sans-serif',
    fontSizePt: 12, lineHeight: 1.5,
    marginTopCm: 3.0, marginBottomCm: 2.5, marginLeftCm: 3.0, marginRightCm: 2.5,
    note: 'D.S. 003-97-TR Art. 18 — Ministerio de Trabajo'
  },
  // Poder Simple → Código Civil Art. 155: TNR 12pt, interlineado 1.5, protocolo notarial
  poder_simple: {
    fontFamily: 'Times New Roman', fontFamilyCss: "'Times New Roman', Times, serif",
    fontSizePt: 12, lineHeight: 1.5,
    marginTopCm: 3.5, marginBottomCm: 2.5, marginLeftCm: 3.5, marginRightCm: 2.5,
    note: 'Código Civil Art. 155 — Representación Voluntaria'
  },
  // Mutuo Dinerario → CC Art. 1648-1665: TNR 12pt, interlineado 1.5, legalización notarial
  mutuo: {
    fontFamily: 'Times New Roman', fontFamilyCss: "'Times New Roman', Times, serif",
    fontSizePt: 12, lineHeight: 1.5,
    marginTopCm: 3.5, marginBottomCm: 2.5, marginLeftCm: 3.5, marginRightCm: 2.5,
    note: 'CC Art. 1648 — Mutuo Dinerario con Mérito Ejecutivo'
  },
}

export default function CitizenDocumentGeneratorModal({
  isOpen,
  onClose,
  initialDocType = 'carta_notarial',
}: CitizenDocumentGeneratorModalProps) {
  const [docType, setDocType] = useState<DocType>(initialDocType)
  const [copied, setCopied] = useState(false)
  const [downloadedWord, setDownloadedWord] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [viewMode, setViewMode] = useState<'sheet' | 'text'>('sheet')
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  // Formato reglamentario automático según tipo de documento (no editable por el usuario)
  const fmt = DOC_FORMAT[docType]

  // ── Carta Notarial ───────────────────────────────────────────
  const [cartaCiudad, setCartaCiudad] = useState('Lima')
  const [cartaRemitente, setCartaRemitente] = useState('')
  const [cartaRemitenteDni, setCartaRemitenteDni] = useState('')
  const [cartaRemitenteDireccion, setCartaRemitenteDireccion] = useState('')
  const [cartaDestinatario, setCartaDestinatario] = useState('')
  const [cartaDestinatarioDniRuc, setCartaDestinatarioDniRuc] = useState('')
  const [cartaDestinatarioDireccion, setCartaDestinatarioDireccion] = useState('')
  const [cartaAsunto, setCartaAsunto] = useState('REQUERIMIENTO FORMAL DE PAGO DE BENEFICIOS SOCIALES Y LIQUIDACIÓN')
  const [cartaReferencia, setCartaReferencia] = useState('')
  const [cartaMotivo, setCartaMotivo] = useState('')
  const [cartaPlazo, setCartaPlazo] = useState('48')
  const [cartaApercibimiento, setCartaApercibimiento] = useState('SUNAFIL / Poder Judicial / Ministerio Público')

  // ── Alimentos ────────────────────────────────────────────────
  const [demandanteNombre, setDemandanteNombre] = useState('')
  const [demandanteDni, setDemandanteDni] = useState('')
  const [demandanteDireccion, setDemandanteDireccion] = useState('')
  const [demandanteCasilla, setDemandanteCasilla] = useState('')
  const [demandadoNombre, setDemandadoNombre] = useState('')
  const [demandadoDireccion, setDemandadoDireccion] = useState('')
  const [demandadoTrabajo, setDemandadoTrabajo] = useState('')
  const [hijoNombre, setHijoNombre] = useState('')
  const [hijoEdad, setHijoEdad] = useState('')
  const [montoSolicitado, setMontoSolicitado] = useState('800')
  const [gastosDetalle, setGastosDetalle] = useState('')
  const [juzgado, setJuzgado] = useState('')

  // ── INDECOPI ────────────────────────────────────────────────
  const [indNombreConsumidor, setIndNombreConsumidor] = useState('')
  const [indDniConsumidor, setIndDniConsumidor] = useState('')
  const [indTelefonoConsumidor, setIndTelefonoConsumidor] = useState('')
  const [indCorreoConsumidor, setIndCorreoConsumidor] = useState('')
  const [indDireccionConsumidor, setIndDireccionConsumidor] = useState('')
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [empresaRuc, setEmpresaRuc] = useState('')
  const [empresaDireccion, setEmpresaDireccion] = useState('')
  const [productoServicio, setProductoServicio] = useState('')
  const [reclamoDetalle, setReclamoDetalle] = useState('')
  const [montoReclamado, setMontoReclamado] = useState('')
  const [pedidoConcreto, setPedidoConcreto] = useState('')

  // ── Alquiler ────────────────────────────────────────────────
  const [arrendador, setArrendador] = useState('')
  const [arrendadorDni, setArrendadorDni] = useState('')
  const [arrendatario, setArrendatario] = useState('')
  const [arrendatarioDni, setArrendatarioDni] = useState('')
  const [inmuebleDireccion, setInmuebleDireccion] = useState('')
  const [rentaMensual, setRentaMensual] = useState('1200')
  const [garantiaMeses, setGarantiaMeses] = useState('1')
  const [diaPago, setDiaPago] = useState('5')
  const [cuentaBancaria, setCuentaBancaria] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [penalidad, setPenalidad] = useState('10')

  // ── Renuncia ────────────────────────────────────────────────
  const [renunciaNombre, setRenunciaNombre] = useState('')
  const [renunciaDni, setRenunciaDni] = useState('')
  const [renunciaEmpresa, setRenunciaEmpresa] = useState('')
  const [renunciaJefe, setRenunciaJefe] = useState('')
  const [renunciaCargo, setRenunciaCargo] = useState('')
  const [renunciaFechaEfecto, setRenunciaFechaEfecto] = useState('')
  const [renunciaMotivo, setRenunciaMotivo] = useState('')

  // ── Poder Simple ────────────────────────────────────────────
  const [poderOtorgante, setPoderOtorgante] = useState('')
  const [poderOtorganteDni, setPoderOtorganteDni] = useState('')
  const [poderApoderado, setPoderApoderado] = useState('')
  const [poderApoderadoDni, setPoderApoderadoDni] = useState('')
  const [poderFacultades, setPoderFacultades] = useState('')
  const [poderEntidad, setPoderEntidad] = useState('')
  const [poderVigencia, setPoderVigencia] = useState('')

  // ── Mutuo Dinerario ─────────────────────────────────────────
  const [mutuoPrestamista, setMutuoPrestamista] = useState('')
  const [mutuoPrestamistaDni, setMutuoPrestamistaDni] = useState('')
  const [mutooPrestatario, setMutooPrestatario] = useState('')
  const [mutooPrestatarioDni, setMutooPrestatarioDni] = useState('')
  const [mutuoMonto, setMutuoMonto] = useState('')
  const [mutuoPlazo, setMutuoPlazo] = useState('')
  const [mutuoInteres, setMutuoInteres] = useState('0')
  const [mutuoFechaDesembolso, setMutuoFechaDesembolso] = useState('')

  if (!isOpen) return null

  const today = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })

  // ─── Validaciones ──────────────────────────────────────────
  const validate = (): boolean => {
    const errs: string[] = []
    if (docType === 'carta_notarial') {
      if (!cartaRemitente.trim()) errs.push('Tu nombre completo (Remitente)')
      if (!cartaRemitenteDni.trim()) errs.push('Tu número de DNI')
      if (!cartaDestinatario.trim()) errs.push('Nombre del destinatario o razón social')
      if (!cartaDestinatarioDireccion.trim()) errs.push('Dirección de entrega notarial del destinatario')
      if (!cartaMotivo.trim()) errs.push('Antecedentes y motivo del requerimiento')
    } else if (docType === 'alimentos') {
      if (!demandanteNombre.trim()) errs.push('Nombre de la parte demandante')
      if (!demandanteDni.trim()) errs.push('DNI de la parte demandante')
      if (!demandadoNombre.trim()) errs.push('Nombre de la parte demandada')
      if (!hijoNombre.trim()) errs.push('Nombre del menor alimentista')
    } else if (docType === 'alquiler') {
      if (!arrendador.trim()) errs.push('Nombre del arrendador (propietario)')
      if (!arrendatario.trim()) errs.push('Nombre del arrendatario (inquilino)')
      if (!inmuebleDireccion.trim()) errs.push('Dirección exacta del inmueble')
    } else if (docType === 'indecopi') {
      if (!indNombreConsumidor.trim()) errs.push('Tu nombre completo (Consumidor)')
      if (!indDniConsumidor.trim()) errs.push('Tu número de DNI')
      if (!empresaNombre.trim()) errs.push('Nombre o razón social de la empresa')
    } else if (docType === 'renuncia') {
      if (!renunciaNombre.trim()) errs.push('Tu nombre completo')
      if (!renunciaEmpresa.trim()) errs.push('Nombre de la empresa empleadora')
      if (!renunciaFechaEfecto.trim()) errs.push('Fecha de efectividad del cese')
    } else if (docType === 'poder_simple') {
      if (!poderOtorgante.trim()) errs.push('Tu nombre completo (Otorgante)')
      if (!poderApoderado.trim()) errs.push('Nombre de la persona apoderada')
      if (!poderFacultades.trim()) errs.push('Detalle de las facultades conferidas')
    } else if (docType === 'mutuo') {
      if (!mutuoPrestamista.trim()) errs.push('Nombre del prestamista')
      if (!mutooPrestatario.trim()) errs.push('Nombre del prestatario')
      if (!mutuoMonto.trim()) errs.push('Monto total del préstamo')
    }
    setErrors(errs)
    return errs.length === 0
  }

  // ─── Generación de Contenido Jurídico Formal ───────────────
  const generateContent = (): { title: string; content: string } => {
    if (docType === 'carta_notarial') {
      const plazoTexto =
        cartaPlazo === '48'
          ? 'CUARENTA Y OCHO (48) HORAS'
          : cartaPlazo === '72'
          ? 'SETENTA Y DOS (72) HORAS'
          : `${cartaPlazo} DÍAS HÁBILES`

      return {
        title: `Carta_Notarial_${cartaRemitente.replace(/\s+/g, '_') || 'Requerimiento'}`,
        content: `                                                        EXP. NOTARIAL N°: ___________________
                                                        KARDEX NOTARIAL : ___________________

SEÑOR NOTARIO PÚBLICO DE LA CIUDAD DE ${(cartaCiudad || 'LIMA').toUpperCase()}:
Sírvase usted tramitar, notificar y diligenciar por conducto notarial la presente CARTA NOTARIAL, con arreglo a lo dispuesto en el artículo 100° y siguientes del Decreto Legislativo del Notariado N° 1049, a la persona y en el domicilio que se indica a continuación:

                                                        ${cartaCiudad || 'Lima'}, ${today}

SEÑOR(ES):
${cartaDestinatario || '[NOMBRE O RAZÓN SOCIAL DEL DESTINATARIO]'}
${cartaDestinatarioDniRuc ? `RUC / DNI N°: ${cartaDestinatarioDniRuc}` : '[RUC O DNI DEL DESTINATARIO]'}
DOMICILIO NOTARIAL: ${cartaDestinatarioDireccion || '[DIRECCIÓN EXACTA, DISTRITO Y PROVINCIA DE NOTIFICACIÓN]'}
PRESENTE.-

DE:
${cartaRemitente || '[NOMBRE Y APELLIDOS COMPLETOS DEL REMITENTE]'}
DNI N°: ${cartaRemitenteDni || '[N° DE DNI DEL REMITENTE]'}
DOMICILIO REAL: ${cartaRemitenteDireccion || '[DIRECCIÓN EXACTA DEL REMITENTE]'}

ASUNTO    : ${cartaAsunto || 'REQUERIMIENTO FORMAL DE PAGO Y CUMPLIMIENTO DE OBLIGACIÓN'}
${cartaReferencia ? `REFERENCIA: ${cartaReferencia}` : ''}

De mi mayor consideración:

Por medio del conducto notarial correspondiente, me dirijo a usted con el debido respeto a fin de exponer y requerir de manera formal y fehaciente lo siguiente:

PRIMERO: ANTECEDENTES Y RELACIÓN FÁCTICA.-
${cartaMotivo || '[DETALLAR AQUÍ LOS HECHOS CON PRECISIÓN: Fechas de inicio y cese de labores, cargos desempeñados, montos adeudados por beneficios sociales (CTS, gratificaciones, vacaciones), número de facturas impagas o incumplimiento de cláusulas contractuales.]'}

SEGUNDO: DEL REQUERIMIENTO FORMAL Y EXIGIBILIDAD.-
Por tanto, al amparo de la legislación peruana vigente y de conformidad con el artículo 1428° del Código Civil peruano, mediante la presente carta notarial le REQUIERO FORMALMENTE para que, en el plazo perentorio e improrrogable de ${plazoTexto}, contadas a partir de la recepción notarial de la presente, cumpla con:
— ${cartaAsunto.toLowerCase() || 'satisfacer íntegramente la obligación detallada en los antecedentes'}.

TERCERO: APERCIBIMIENTO LEGAL Y RESERVA DE ACCIONES.-
Hago de su expreso conocimiento que, en caso de renuencia o de no atender satisfactoriamente el presente requerimiento en el plazo señalado, procederé de inmediato y sin necesidad de nuevo aviso a interponer las acciones judiciales, laborales y/o penales correspondientes ante ${cartaApercibimiento}, demandando asimismo la indemnización por los daños y perjuicios ocasionados, así como el pago de los intereses legales devengados, costas y costos procesales que por su exclusiva culpa se originen.

Sin otro particular y a la espera de su inmediata atención, quedo de usted.

Atentamente,



_______________________________________________________
${cartaRemitente || 'FIRMA DEL REMITENTE'}
DNI N°: ${cartaRemitenteDni || '_______________'}
Domicilio: ${cartaRemitenteDireccion || '[DIRECCIÓN]'}

┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│                                                     │
│                                                     │
│                                                     │
│             [ HUELLA DACTILAR DIGITAL ]             │
│            DEDO ÍNDICE DERECHO REMITENTE            │
└─────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTANCIA DE DILIGENCIAMIENTO Y CERTIFICACIÓN NOTARIAL DE ENTREGA
(Para uso exclusivo del Notario Público conforme al Art. 100° del D. Leg. 1049)

Certifico que la presente carta notarial fue recepcionada en mi despacho notarial el día ____/____/202__ a las ____:____ horas.
Diligencia efectuada el día ____ de ________________ de 202__ a las ____:____ horas.
Dirección de entrega constatada: ________________________________________________________________
Persona con quien se entendió la diligencia:
Nombre y Apellidos: _____________________________________________ DNI N°: _____________________
Relación con el destinatario: __________________________________________________________________
Firma del receptor: _____________________________
[  ] Se negó a firmar / recibir        [  ] Inmueble cerrado / Notificación bajo puerta (Suministro: __________)

________________________________________________________
           SELLO Y FIRMA DEL NOTARIO PÚBLICO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      }
    }

    if (docType === 'alimentos') {
      return {
        title: `Demanda_Alimentos_${demandanteNombre.replace(/\s+/g, '_') || 'Demanda'}`,
        content: `SECRETARIO JUDICIAL : 
EXPEDIENTE         : 
CUADERNO           : PRINCIPAL
ESCRITO            : 01-${new Date().getFullYear()}
SUMILLA            : DEMANDA DE PENSIÓN DE ALIMENTOS

SEÑOR JUEZ DEL ${juzgado || 'JUZGADO DE PAZ LETRADO DE FAMILIA'} DE TURNO:

I. DATOS DE LA PARTE DEMANDANTE:
${demandanteNombre || '[NOMBRE Y APELLIDOS DE LA MADRE O PADRE DEMANDANTE]'}, identificada(o) con DNI N° ${demandanteDni || '[N° DE DNI]'}, con domicilio real en ${demandanteDireccion || '[DIRECCIÓN COMPLETA Y REFERENCIA]'}; señalando como domicilio procesal${demandanteCasilla ? ` la Casilla Electrónica N° ${demandanteCasilla} del Poder Judicial` : ' [CASILLA ELECTRÓNICA O DIRECCIÓN PROCESAL]'}; ante usted, con el debido respeto me presento y expongo:

II. DATOS DE LA PARTE DEMANDADA:
${demandadoNombre || '[NOMBRE Y APELLIDOS COMPLETOS DEL OBLIGADO]'}, con domicilio real en ${demandadoDireccion || '[DIRECCIÓN COMPLETA DEL DEMANDADO]'}${demandadoTrabajo ? `; centro laboral habitual: ${demandadoTrabajo}` : ''}; a quien deberá notificarse formalmente con arreglo a ley.

III. PETITORIO:
Interpongo DEMANDA DE ALIMENTOS en favor de mi menor hijo(a) ${hijoNombre || '[NOMBRE COMPLETO DEL HIJO/A]'}, de ${hijoEdad || '[EDAD]'} años de edad, a fin de que el demandado cumpla con acudir mensualmente con una PENSIÓN ALIMENTICIA ascendente a la suma de S/ ${parseFloat(montoSolicitado || '800').toLocaleString('es-PE', { minimumFractionDigits: 2 })} Soles mensuales (o el porcentaje equivalente no menor al 40% de sus ingresos remunerativos totales, incluyendo gratificaciones, bonificaciones y cualquier otro concepto remunerativo o no), la cual deberá ser depositada directamente en la cuenta de alimentos del Banco de la Nación.

IV. FUNDAMENTOS DE HECHO:
PRIMERO: Conforme se acredita con la Partida de Nacimiento que se adjunta como Anexo 1-B, el demandado es padre biológico del(la) menor alimentista, encontrándose plenamente acreditado el entroncamiento de filiación.

SEGUNDO: El(la) menor alimentista tiene necesidades primarias e indispensables para su desarrollo integral (alimentación, vivienda, vestimenta, educación, salud integral y recreación), las cuales vienen siendo solventadas de manera exclusiva por mi persona.
${gastosDetalle ? `\nDetalle de gastos mensuales indispensables:\n${gastosDetalle}\n` : ''}
TERCERO: El demandado goza de óptima salud física y mental, percibe ingresos regulares y cuenta con solvencia económica suficiente para atender la subsistencia de su menor descendiente, conforme manda el artículo 6° de la Constitución.

CUARTO: A la fecha de interposición de la presente demanda, el demandado ha hecho abandono voluntario e injustificado de sus deberes asistenciales, desentendiéndose de la alimentación de su hijo(a).

V. FUNDAMENTOS DE DERECHO:
- Artículos 4° y 6° de la Constitución Política del Perú.
- Artículos 472°, 481°, 482° y 483° del Código Civil.
- Artículos 92° y siguientes del Código de los Niños y Adolescentes (Ley N° 27337).
- Ley N° 28439 que simplifica las reglas del Proceso Único de Alimentos (NO requiere firma obligatoria de abogado).

VI. MEDIOS PROBATORIOS:
1. ANEXO 1-A: Copia simple de mi DNI (Demandante).
2. ANEXO 1-B: Partida certificada de Nacimiento de mi menor hijo(a).
3. ANEXO 1-C: Comprobantes de pago de matrícula escolar, útiles, vestimenta y medicinas.
4. ANEXO 1-D: Fotografías y constancias de gastos indispensables.

VII. VÍA PROCEDIMENTAL:
El presente proceso se tramita en la VÍA DEL PROCESO ÚNICO de Alimentos (Ley N° 28439). Trámite 100% gratuito sin pago de aranceles judiciales.

POR TANTO:
A usted, Señor Juez, pido admitir la presente demanda y oportunamente declararla FUNDADA con expresa condena de costas y costos.

                                                        ${today}


_______________________________________________________
${demandanteNombre || 'FIRMA DE LA PARTE DEMANDANTE'}
DNI N°: ${demandanteDni || '_______________'}

┌─────────────────────────────────────────────────────┐
│                                                     │
│             [ HUELLA DACTILAR DIGITAL ]             │
│            DEDO ÍNDICE DERECHO DEMANDANTE           │
└─────────────────────────────────────────────────────┘

NOTA DE LEY: Trámite gratuito — No requiere firma de abogado defensor (Ley N° 28439).`,
      }
    }

    if (docType === 'alquiler') {
      const garantiaTotal = (parseFloat(rentaMensual || '0') * parseFloat(garantiaMeses || '1')).toFixed(2)
      return {
        title: `Contrato_Arrendamiento_${arrendador.replace(/\s+/g, '_') || 'Inmueble'}`,
        content: `CONTRATO DE ARRENDAMIENTO DE INMUEBLE
CON CLÁUSULA DE ALLANAMIENTO A FUTURO Y SOMETIMIENTO A LA LEY N° 30933
(Documento Privado con Firmas Legalizadas Notarialmente)

Conste por el presente documento privado, el Contrato de Arrendamiento que celebran de una parte:

EL ARRENDADOR: ${arrendador || '[NOMBRE Y APELLIDOS DEL PROPIETARIO]'}, identificado(a) con DNI N° ${arrendadorDni || '[N° DNI]'}, domiciliado(a) en [DIRECCIÓN PROPIETARIO]; y de la otra parte:

EL ARRENDATARIO: ${arrendatario || '[NOMBRE Y APELLIDOS DEL INQUILINO]'}, identificado(a) con DNI N° ${arrendatarioDni || '[N° DNI]'}, domiciliado(a) para efectos del presente contrato en el inmueble arrendado; bajo los términos siguientes:

PRIMERA: OBJETO DEL CONTRATO.-
EL ARRENDADOR cede en arrendamiento a favor de EL ARRENDATARIO el inmueble ubicado en ${inmuebleDireccion || '[DIRECCIÓN EXACTA, DISTRITO Y PROVINCIA DEL INMUEBLE]'}, para destinarlo única y exclusivamente a uso de vivienda familiar.

SEGUNDA: PLAZO DEL CONTRATO.-
El plazo de vigencia del presente contrato es de UN (01) AÑO FORZOSO, que inicia el ${fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '[FECHA INICIO]'} y vence indefectiblemente el [FECHA DE VENCIMIENTO].

TERCERA: RENTA MENSUAL Y FORMA DE PAGO.-
La renta pactada de común acuerdo asciende a S/ ${parseFloat(rentaMensual || '0').toLocaleString('es-PE', { minimumFractionDigits: 2 })} Soles mensuales, que EL ARRENDATARIO pagará por adelantado los días ${diaPago || '5'} de cada mes.
${cuentaBancaria ? `Medio de pago autorizado: Abono en Cuenta Bancaria N° ${cuentaBancaria} de entidad financiera supervisada por la SBS.` : 'Medio de pago: Depósito en cuenta bancaria bancarizada conforme a la Ley 30933.'}
Penalidad por mora diaria: ${penalidad || '10'}% sobre la cuota impaga.

CUARTA: DEPÓSITO DE GARANTÍA.-
EL ARRENDATARIO entrega la suma de S/ ${parseFloat(garantiaTotal).toLocaleString('es-PE', { minimumFractionDigits: 2 })} Soles en calidad de depósito de garantía, para responder por eventuales deterioros en el inmueble o deudas de servicios públicos.

QUINTA: CLÁUSULA DE ALLANAMIENTO A FUTURO (ART. 594° CÓDIGO PROCESAL CIVIL).-
EL ARRENDATARIO SE ALLANA DE FORMA EXPRESA, IRREVOCABLE E INCONDICIONAL a la demanda de desalojo que EL ARRENDADOR interponga ante el Juzgado de Paz Letrado por las causales de:
a) Vencimiento del plazo contractual estipulado.
b) Falta de pago de la renta por el plazo de dos meses y quince días.

SEXTA: SOMETIMIENTO AL DESALOJO CON INTERVENCIÓN NOTARIAL (LEY N° 30933).-
Las partes convienen de forma expresa e irrevocable acogerse al Procedimiento Especial de Desalojo con Intervención Notarial regulado por la Ley N° 30933. En caso de configuración de las causales de vencimiento de contrato o falta de pago de rentas, el Notario Público constatará el incumplimiento y remitirá el expediente al Juez de Paz Letrado para la orden judicial de lanzamiento inmediato en un plazo máximo de tres (3) días hábiles.

SÉTIMA: LEGALIZACIÓN NOTARIAL DE FIRMAS.-
Las partes acuerdan legalizar sus firmas ante Notario Público, requisito obligatorio de validez y exigibilidad previsto en el artículo 4° de la Ley N° 30933.

En señal de plena conformidad, suscriben el presente contrato en duplicado ejemplar en la ciudad de Lima, a los ${today}.


__________________________________           __________________________________
${arrendador || 'EL ARRENDADOR'}             ${arrendatario || 'EL ARRENDATARIO'}
DNI N°: ${arrendadorDni || '_______________'}       DNI N°: ${arrendatarioDni || '_______________'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONSTANCIA DE LEGALIZACIÓN NOTARIAL DE FIRMAS
Doy fe de que las firmas que anteceden corresponden a las partes contratantes.
Registro Notarial N°: ______________________  Fecha: ____/____/202__
Sello y firma del Notario Público: __________________________________________`,
      }
    }

    if (docType === 'indecopi') {
      return {
        title: `Reclamo_INDECOPI_${indNombreConsumidor.replace(/\s+/g, '_') || 'Reclamo'}`,
        content: `FORMULARIO OFICIAL DE RECLAMO — LIBRO DE RECLAMACIONES VIRTUAL / INDECOPI
(Código de Protección y Defensa del Consumidor — Ley N° 29571)

Fecha del Reclamo: ${today}
Hoja de Reclamación N°: [PARA SER LLENADO POR EL PROVEEDOR]

I. DATOS DEL CONSUMIDOR RECLAMANTE:
Nombres y Apellidos : ${indNombreConsumidor || '[NOMBRE COMPLETO]'}
DNI / CE            : ${indDniConsumidor || '[N° DE DOCUMENTO]'}
Teléfono de contacto: ${indTelefonoConsumidor || '[N° DE TELÉFONO]'}
Correo Electrónico  : ${indCorreoConsumidor || '[CORREO ELECTRÓNICO]'}
Domicilio           : ${indDireccionConsumidor || '[DIRECCIÓN COMPLETA]'}

II. DATOS DEL PROVEEDOR / EMPRESA RECLAMADA:
Razón Social        : ${empresaNombre || '[NOMBRE O RAZÓN SOCIAL DE LA EMPRESA]'}
RUC                 : ${empresaRuc || '[N° DE RUC]'}
Establecimiento/Web : ${empresaDireccion || '[DIRECCIÓN DE LA TIENDA O DOMINIO WEB]'}

III. DETALLE DEL PRODUCTO O SERVICIO:
Bien / Servicio     : ${productoServicio || '[DESCRIPCIÓN DEL BIEN O SERVICIO ADQUIRIDO]'}
Monto Reclamado     : S/ ${parseFloat(montoReclamado || '0').toLocaleString('es-PE', { minimumFractionDigits: 2 })} Soles

IV. DETALLE DE LA RECLAMACIÓN:
${reclamoDetalle || '[DETALLAR CON PRECISIÓN: Fechas de compra, falla del producto o cobro indebido, respuesta negativa recibida por la empresa.]'}

V. PEDIDO CONCRETO DEL CONSUMIDOR:
${pedidoConcreto || 'Solicito la devolución íntegra del dinero pagado o la inmediata sustitución del bien por uno en perfecto estado de funcionamiento.'}

BASE LEGAL: Artículos 19°, 24° y 152° de la Ley N° 29571. Plazo improrrogable de 15 días hábiles para respuesta del proveedor.


_______________________________________________________
${indNombreConsumidor || 'FIRMA DEL CONSUMIDOR RECLAMANTE'}
DNI N°: ${indDniConsumidor || '_______________'}`,
      }
    }

    if (docType === 'renuncia') {
      return {
        title: `Carta_Renuncia_${renunciaNombre.replace(/\s+/g, '_') || 'Trabajador'}`,
        content: `CARTA DE RENUNCIA VOLUNTARIA Y PREAVISO DE LEY
(Artículo 18° del D.S. N° 003-97-TR — Ley de Productividad y Competitividad Laboral)

                                                        ${today}

Señor(a):
${renunciaJefe || '[NOMBRE DEL GERENTE GENERAL O JEFE DE RR.HH.]'}
${renunciaEmpresa || '[RAZÓN SOCIAL DE LA EMPRESA EMPLEADORA]'}
Presente.-

ASUNTO: RENUNCIA VOLUNTARIA AL PUESTO DE ${(renunciaCargo || '[CARGO]').toUpperCase()}

De mi mayor consideración:

Por medio de la presente, yo, ${renunciaNombre || '[NOMBRES Y APELLIDOS]'}, identificado(a) con DNI N° ${renunciaDni || '[N° DE DNI]'}, trabajador(a) de su institución en el cargo de ${renunciaCargo || '[CARGO DESEMPEÑADO]'}, me dirijo a usted con el debido respeto para comunicarle formalmente mi renuncia voluntaria e irrevocable a la relación laboral que mantengo con su empresa.

La presente decisión surtirá plenos efectos legales a partir del día ${renunciaFechaEfecto ? new Date(renunciaFechaEfecto).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : '[FECHA DE CESE EFECTIVO]'}, en estricto cumplimiento del plazo de preaviso de treinta (30) días de anticipación establecido en el artículo 18° del D.S. N° 003-97-TR.
${renunciaMotivo ? `\nMotivo particular de la renuncia: ${renunciaMotivo}\n` : ''}
Asimismo, solicito a usted se sirva ordenar a quien corresponda la elaboración y abono de mi correspondiente LIQUIDACIÓN DE BENEFICIOS SOCIALES (CTS proporcional, gratificación trunca, vacaciones truncas e indemnizaciones laborales devengadas) dentro del plazo improrrogable de 48 horas tras el cese de mis labores, así como la entrega de mi Certificado de Trabajo y la Carta de Liberación de CTS.

Agradeciendo las consideraciones brindadas durante mi tiempo de servicio, quedo de usted.

Atentamente,


_______________________________________________________
${renunciaNombre || 'FIRMA DEL TRABAJADOR'}
DNI N°: ${renunciaDni || '_______________'}

CARGO DE RECEPCIÓN POR EL EMPLEADOR:
Fecha: ____/____/202__   Hora: ____:____   Firma y Sello: _____________________`,
      }
    }

    if (docType === 'poder_simple') {
      return {
        title: `Poder_Simple_${poderOtorgante.replace(/\s+/g, '_') || 'Documento'}`,
        content: `CARTA PODER SIMPLE DE REPRESENTACIÓN
(Artículo 155° del Código Civil y Ley del Procedimiento Administrativo General N° 27444)

CONSTE POR EL PRESENTE DOCUMENTO QUE:

Yo, ${poderOtorgante || '[NOMBRES Y APELLIDOS DEL PODERDANTE]'}, identificado(a) con DNI N° ${poderOtorganteDni || '[N° DNI]'}, domiciliado(a) en [DIRECCIÓN DEL OTORGANTE]; en pleno ejercicio de mis derechos civiles, OTORGO PODER ESPECIAL a favor de:

${poderApoderado || '[NOMBRES Y APELLIDOS DEL APODERADO]'}, identificado(a) con DNI N° ${poderApoderadoDni || '[N° DNI]'}, domiciliado(a) en [DIRECCIÓN DEL APODERADO];

Para que en mi nombre y representación se apersone ante ${poderEntidad || '[ENTIDAD, BANCO O INSTITUCIÓN]'} y ejerza las siguientes facultades específicas:
${poderFacultades || '— Presentar escritos, solicitudes y formularios administrativos.\n— Recoger documentos, constancias, cheques no negociables o resoluciones.\n— Firmar actas y cargos de recepción vinculados al trámite encomendado.'}

${poderVigencia ? `Vigencia: El presente poder rige hasta el día ${new Date(poderVigencia).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}.` : 'Vigencia: El presente poder rige exclusivamente para la culminación del trámite encomendado.'}

En señal de conformidad, suscribo el presente documento en la ciudad de Lima, a los ${today}.


_______________________________________________________
${poderOtorgante || 'FIRMA DEL PODERDANTE'}
DNI N°: ${poderOtorganteDni || '_______________'}`,
      }
    }

    // Mutuo Dinerario
    return {
      title: `Mutuo_Dinerario_${mutuoPrestamista.replace(/\s+/g, '_') || 'Contrato'}`,
      content: `CONTRATO DE MUTUO DINERARIO CON RECONOCIMIENTO DE DEUDA
(Artículos 1648° al 1665° del Código Civil Peruano — Con Mérito Ejecutivo)

Conste por el presente documento privado, el Contrato de Mutuo que celebran de una parte:
EL MUTUANTE (PRESTAMISTA): ${mutuoPrestamista || '[NOMBRES Y APELLIDOS]'}, identificado(a) con DNI N° ${mutuoPrestamistaDni || '[N° DNI]'}; y de la otra parte:
EL MUTUATARIO (PRESTATARIO): ${mutooPrestatario || '[NOMBRES Y APELLIDOS]'}, identificado(a) con DNI N° ${mutooPrestatarioDni || '[N° DNI]'}; bajo las siguientes cláusulas:

PRIMERA: OBJETO DEL PRÉSTAMO.-
EL MUTUANTE entrega en calidad de mutuo dinerario a favor de EL MUTUATARIO la suma de S/ ${parseFloat(mutuoMonto || '0').toLocaleString('es-PE', { minimumFractionDigits: 2 })} Soles.
Tasa de interés pactada: ${parseFloat(mutuoInteres || '0') > 0 ? `${mutuoInteres}% mensual (dentro de los límites de la tasa legal fijada por el BCRP)` : 'Sin interés compensatorio (a título gratuito)'}.

SEGUNDA: PLAZO Y FORMA DE PAGO.-
EL MUTUATARIO se obliga a reintegrar la totalidad del capital prestado en el plazo perentorio de ${mutuoPlazo || '30 días calendario'}, contados desde la firma del presente instrumento.

TERCERA: RECONOCIMIENTO EXPRESO DE DEUDA Y MÉRITO EJECUTIVO.-
EL MUTUATARIO reconoce adeudar en forma líquida, cierta y exigible la suma pactada. En caso de incumplimiento, las partes confieren al presente instrumento mérito ejecutivo pleno al amparo del artículo 688° del Código Procesal Civil, procediéndose al embargo de bienes y cobro de costas y costos.

En señal de conformidad, las partes suscriben el presente contrato en duplicado ejemplar en Lima, a los ${today}.


__________________________________           __________________________________
${mutuoPrestamista || 'EL MUTUANTE'}         ${mutooPrestatario || 'EL MUTUATARIO'}
DNI N°: ${mutuoPrestamistaDni || '_______________'} DNI N°: ${mutooPrestatarioDni || '_______________'}

Constancia de legalización notarial de firmas para otorgar fecha cierta y mérito ejecutivo.`,
    }
  }

  const docData = generateContent()

  const handlePrint = () => {
    if (!validate()) return
    const html = buildPrintHTML(docData.title, docData.content, fmt)
    const win = window.open('', '_blank', 'width=950,height=750')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const handleDownloadWord = () => {
    if (!validate()) return
    downloadWordDoc(docData.title, docData.content, docData.title, fmt)
    setDownloadedWord(true)
    setTimeout(() => setDownloadedWord(false), 2500)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(docData.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentMeta = DOC_TYPES.find((d) => d.id === docType)!

  // ─── Renderizado del Formulario según Tipo de Documento ─────────
  const renderForm = () => {
    if (docType === 'carta_notarial') {
      return (
        <div className="space-y-4">
          <div
            className="p-3 rounded-xl border text-[11px] flex items-start gap-2.5"
            style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)', color: '#c9a84c' }}
          >
            <Stamp size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Formato Oficial de Diligenciamiento Notarial (D. Leg. 1049)</span>
              <p className="opacity-80 leading-relaxed">
                Este formato incorpora el encabezado obligatorio dirigido al Notario, cláusulas numeradas, plazos perentorios y recuadro para huella dactilar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput
              label="Ciudad del Trámite"
              value={cartaCiudad}
              onChange={setCartaCiudad}
              placeholder="Ej. Lima, Piura, Arequipa"
              required
            />
            <FieldInput
              label="Plazo de Respuesta Otorgado"
              value={cartaPlazo}
              onChange={setCartaPlazo}
              placeholder="48"
              hint="En horas o días (48h = beneficios laborales, 15d = contratos)"
              required
            />
          </div>

          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#c9a84c] block">
              1. Datos del Remitente (Quien envía la carta)
            </span>
            <FieldInput
              label="Nombre Completo del Remitente"
              value={cartaRemitente}
              onChange={setCartaRemitente}
              placeholder="Ej. Juan Carlos Pérez Quispe"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput
                label="DNI del Remitente"
                value={cartaRemitenteDni}
                onChange={setCartaRemitenteDni}
                placeholder="12345678"
                required
              />
              <FieldInput
                label="Domicilio Real Completo"
                value={cartaRemitenteDireccion}
                onChange={setCartaRemitenteDireccion}
                placeholder="Av. Javier Prado Este 1234, Dpto. 401, San Isidro"
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#c9a84c] block">
              2. Datos del Destinatario (A quién va dirigida)
            </span>
            <FieldInput
              label="Destinatario (Persona o Empresa)"
              value={cartaDestinatario}
              onChange={setCartaDestinatario}
              placeholder="Ej. Inversiones San Martín S.A.C. o Mario Gómez Ruiz"
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput
                label="RUC o DNI del Destinatario"
                value={cartaDestinatarioDniRuc}
                onChange={setCartaDestinatarioDniRuc}
                placeholder="20601234567"
                hint="Crucial para que el notario identifique la razón social"
              />
              <FieldInput
                label="Dirección Notarial de Entrega"
                value={cartaDestinatarioDireccion}
                onChange={setCartaDestinatarioDireccion}
                placeholder="Av. República de Panamá 3565, San Isidro, Lima"
                required
              />
            </div>
          </div>

          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#c9a84c] block">
              3. Asunto, Hechos y Apercibimiento Legal
            </span>
            <FieldInput
              label="Asunto Principal"
              value={cartaAsunto}
              onChange={setCartaAsunto}
              placeholder="REQUERIMIENTO DE PAGO DE BENEFICIOS SOCIALES Y LIQUIDACIÓN"
              required
            />
            <FieldInput
              label="Referencia (opcional)"
              value={cartaReferencia}
              onChange={setCartaReferencia}
              placeholder="Ej. Contrato de trabajo suscrito el 15/01/2024 / Factura E001-45"
            />
            <FieldTextarea
              label="Hechos que motivan el requerimiento"
              value={cartaMotivo}
              onChange={setCartaMotivo}
              rows={4}
              placeholder="Ej. Presté servicios como asistente contable desde el 01/01/2024 hasta el 31/07/2026 con un sueldo de S/ 2,500. A la fecha han transcurrido más de 48 horas sin que la empresa me abone mi liquidación..."
              required
            />
            <FieldInput
              label="Apercibimiento Legal (autoridades a recurrir)"
              value={cartaApercibimiento}
              onChange={setCartaApercibimiento}
              placeholder="SUNAFIL / Poder Judicial / Ministerio Público"
            />
          </div>
        </div>
      )
    }

    if (docType === 'alimentos') {
      return (
        <div className="space-y-4">
          <div
            className="p-3 rounded-xl border text-[11px] flex items-start gap-2.5"
            style={{ background: 'rgba(52,209,122,0.08)', borderColor: 'rgba(52,209,122,0.25)', color: '#34d17a' }}
          >
            <Baby size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Trámite Gratuito — Sin abogado obligatorio (Ley N° 28439)</span>
              <p className="opacity-80 leading-relaxed">
                Este formato formal se presenta directamente ante la Mesa de Partes del Juzgado de Paz Letrado de Familia.
              </p>
            </div>
          </div>
          <FieldInput
            label="Tu Nombre Completo (Demandante)"
            value={demandanteNombre}
            onChange={setDemandanteNombre}
            placeholder="María Elena Quispe Flores"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput
              label="Tu DNI"
              value={demandanteDni}
              onChange={setDemandanteDni}
              placeholder="12345678"
              required
            />
            <FieldInput
              label="Casilla Electrónica PJ (si tiene)"
              value={demandanteCasilla}
              onChange={setDemandanteCasilla}
              placeholder="98765"
              hint="Opcional — si no tiene, déjelo en blanco"
            />
          </div>
          <FieldInput
            label="Tu Dirección Completa"
            value={demandanteDireccion}
            onChange={setDemandanteDireccion}
            placeholder="Jr. Las Flores 123, Miraflores, Lima"
            required
          />
          <FieldInput
            label="Nombre Completo del Demandado"
            value={demandadoNombre}
            onChange={setDemandadoNombre}
            placeholder="José Carlos Rodríguez Pérez"
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput
              label="Dirección del Demandado"
              value={demandadoDireccion}
              onChange={setDemandadoDireccion}
              placeholder="Av. Los Andes 456, San Juan de Lurigancho"
            />
            <FieldInput
              label="Centro de Trabajo del Demandado"
              value={demandadoTrabajo}
              onChange={setDemandadoTrabajo}
              placeholder="Empresa SAC, Av. Industrial 789"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FieldInput
                label="Nombre del Hijo/a"
                value={hijoNombre}
                onChange={setHijoNombre}
                placeholder="Diego Alejandro Rodríguez Quispe"
                required
              />
            </div>
            <FieldInput
              label="Edad"
              value={hijoEdad}
              onChange={setHijoEdad}
              placeholder="6"
              type="number"
              required
            />
          </div>
          <FieldInput
            label="Pensión Solicitada Mensual (S/)"
            value={montoSolicitado}
            onChange={setMontoSolicitado}
            placeholder="800"
            type="number"
          />
          <FieldTextarea
            label="Detalle de Gastos Mensuales del Menor"
            value={gastosDetalle}
            onChange={setGastosDetalle}
            rows={3}
            placeholder="Alimentación: S/ 350&#10;Colegio y útiles: S/ 250&#10;Salud y medicinas: S/ 100&#10;Vestimenta: S/ 100"
          />
        </div>
      )
    }

    if (docType === 'alquiler') {
      return (
        <div className="space-y-4">
          <div
            className="p-3 rounded-xl border text-[11px] flex items-start gap-2.5"
            style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)', color: '#c9a84c' }}
          >
            <Home size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Cláusula de Allanamiento y Desalojo Notarial Express</span>
              <p className="opacity-80 leading-relaxed">
                Este contrato incorpora las cláusulas de la Ley N° 30933 y el Art. 594° del Código Procesal Civil para desalojar en semanas y no en años.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput label="Propietario (Arrendador)" value={arrendador} onChange={setArrendador} placeholder="Carlos Alberto Mendoza Rojas" required />
            <FieldInput label="DNI del Propietario" value={arrendadorDni} onChange={setArrendadorDni} placeholder="12345678" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput label="Inquilino (Arrendatario)" value={arrendatario} onChange={setArrendatario} placeholder="Rosa María Huanca López" required />
            <FieldInput label="DNI del Inquilino" value={arrendatarioDni} onChange={setArrendatarioDni} placeholder="87654321" />
          </div>
          <FieldInput label="Dirección Exacta del Inmueble" value={inmuebleDireccion} onChange={setInmuebleDireccion} placeholder="Jr. Los Pinos 234, Dpto. 3B, San Miguel, Lima" required />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FieldInput label="Renta Mensual (S/)" value={rentaMensual} onChange={setRentaMensual} placeholder="1200" type="number" />
            <FieldInput label="Meses de Garantía" value={garantiaMeses} onChange={setGarantiaMeses} placeholder="1" type="number" />
            <FieldInput label="Día de Pago (cada mes)" value={diaPago} onChange={setDiaPago} placeholder="5" type="number" />
          </div>
          <FieldInput label="Cuenta Bancaria para Depósito (Ley 30933)" value={cuentaBancaria} onChange={setCuentaBancaria} placeholder="BCP Soles 191-12345678-0-01" hint="Debe ser cuenta bancarizada" />
          <FieldInput label="Fecha de Inicio de Contrato" value={fechaInicio} onChange={setFechaInicio} type="date" />
        </div>
      )
    }

    if (docType === 'indecopi') {
      return (
        <div className="space-y-4">
          <FieldInput label="Tu Nombre Completo (Consumidor)" value={indNombreConsumidor} onChange={setIndNombreConsumidor} placeholder="Pedro Alonso Mamani Quispe" required />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <FieldInput label="Tu DNI" value={indDniConsumidor} onChange={setIndDniConsumidor} placeholder="12345678" required />
            <FieldInput label="Teléfono" value={indTelefonoConsumidor} onChange={setIndTelefonoConsumidor} placeholder="987654321" />
            <FieldInput label="Correo" value={indCorreoConsumidor} onChange={setIndCorreoConsumidor} placeholder="correo@ejemplo.pe" />
          </div>
          <FieldInput label="Nombre de la Empresa Reclamada" value={empresaNombre} onChange={setEmpresaNombre} placeholder="Tienda ABC S.A.C." required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput label="RUC de la Empresa" value={empresaRuc} onChange={setEmpresaRuc} placeholder="20123456789" />
            <FieldInput label="Monto Reclamado (S/)" value={montoReclamado} onChange={setMontoReclamado} placeholder="350.00" type="number" />
          </div>
          <FieldInput label="Producto o Servicio Comprado" value={productoServicio} onChange={setProductoServicio} placeholder="Celular Samsung Galaxy A55" required />
          <FieldTextarea label="Detalle de los Hechos" value={reclamoDetalle} onChange={setReclamoDetalle} rows={3} placeholder="Describa el defecto, incumplimiento de garantía o cobro no autorizado..." />
          <FieldInput label="Solución Concreta Exigida" value={pedidoConcreto} onChange={setPedidoConcreto} placeholder="Devolución íntegra del dinero / sustitución por un producto nuevo" />
        </div>
      )
    }

    if (docType === 'renuncia') {
      return (
        <div className="space-y-4">
          <FieldInput label="Tu Nombre Completo" value={renunciaNombre} onChange={setRenunciaNombre} placeholder="Luis Alberto García Torres" required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput label="Tu DNI" value={renunciaDni} onChange={setRenunciaDni} placeholder="12345678" />
            <FieldInput label="Cargo que desempeñas" value={renunciaCargo} onChange={setRenunciaCargo} placeholder="Asistente Administrativo" />
          </div>
          <FieldInput label="Nombre de la Empresa" value={renunciaEmpresa} onChange={setRenunciaEmpresa} placeholder="Empresa Peruana S.A.C." required />
          <FieldInput label="Nombre de tu Jefe / Representante" value={renunciaJefe} onChange={setRenunciaJefe} placeholder="Ing. Patricia López Ruiz — Gerente General" />
          <FieldInput label="Fecha de Efectividad (Último día de trabajo)" value={renunciaFechaEfecto} onChange={setRenunciaFechaEfecto} type="date" required hint="30 días de anticipación de ley" />
          <FieldTextarea label="Motivo (opcional)" value={renunciaMotivo} onChange={setRenunciaMotivo} rows={2} placeholder="Por motivos de desarrollo profesional personal / razones familiares..." />
        </div>
      )
    }

    if (docType === 'poder_simple') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput label="Poderdante (Quien otorga el poder)" value={poderOtorgante} onChange={setPoderOtorgante} placeholder="Andrea Patricia Soto Vásquez" required />
            <FieldInput label="DNI del Poderdante" value={poderOtorganteDni} onChange={setPoderOtorganteDni} placeholder="12345678" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput label="Apoderado (Quien representará)" value={poderApoderado} onChange={setPoderApoderado} placeholder="Ricardo Martín Flores Chávez" required />
            <FieldInput label="DNI del Apoderado" value={poderApoderadoDni} onChange={setPoderApoderadoDni} placeholder="87654321" />
          </div>
          <FieldInput label="Entidad o Trámite Destinado" value={poderEntidad} onChange={setPoderEntidad} placeholder="SUNAT / Banco BCP / SEDAPAL / Municipalidad" />
          <FieldTextarea label="Facultades Concretas Concedidas" value={poderFacultades} onChange={setPoderFacultades} rows={3} placeholder="— Presentar solicitudes y reclamos.&#10;— Recoger documentos oficiales y cheques.&#10;— Suscribir actas." required />
          <FieldInput label="Fecha de Caducidad del Poder" value={poderVigencia} onChange={setPoderVigencia} type="date" hint="Opcional — si se omite, rige para el trámite indicado" />
        </div>
      )
    }

    // Mutuo Dinerario
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldInput label="Prestamista (Mutuante)" value={mutuoPrestamista} onChange={setMutuoPrestamista} placeholder="Carlos Augusto Vega Torres" required />
          <FieldInput label="DNI Prestamista" value={mutuoPrestamistaDni} onChange={setMutuoPrestamistaDni} placeholder="12345678" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldInput label="Prestatario (Mutuatario)" value={mutooPrestatario} onChange={setMutooPrestatario} placeholder="Diana Lucía Huamán Ramos" required />
          <FieldInput label="DNI Prestatario" value={mutooPrestatarioDni} onChange={setMutooPrestatarioDni} placeholder="87654321" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FieldInput label="Monto del Préstamo (S/)" value={mutuoMonto} onChange={setMutuoMonto} placeholder="2500" type="number" required />
          <FieldInput label="Interés Mensual (%)" value={mutuoInteres} onChange={setMutuoInteres} placeholder="0" type="number" hint="0 = sin intereses" />
          <FieldInput label="Plazo de Devolución" value={mutuoPlazo} onChange={setMutuoPlazo} placeholder="60 días" />
        </div>
        <FieldInput label="Fecha de Desembolso" value={mutuoFechaDesembolso} onChange={setMutuoFechaDesembolso} type="date" />
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="w-full sm:max-w-5xl rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: '#161616',
          border: '1px solid #333333',
          boxShadow: '0 25px 70px rgba(0,0,0,0.85)',
          height: '94dvh',
          maxHeight: '94dvh',
        }}
      >
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b flex-shrink-0" style={{ borderColor: '#262626' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.30)' }}
            >
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-white">Generador de Documentos Oficiales</h3>
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}>
                  Perú 2026
                </span>
              </div>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Estructura notarial y judicial oficial lista para imprimir o descargar en Word
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)' }}
            aria-label="Cerrar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* SELECTOR DE DOCUMENTOS — SCROLL HORIZONTAL FLUIDO */}
        <div className="px-3 sm:px-6 py-2.5 border-b flex-shrink-0 overflow-x-auto" style={{ borderColor: '#262626' }}>
          <div className="flex gap-2 min-w-max">
            {DOC_TYPES.map((dt) => {
              const isSelected = docType === dt.id
              return (
                <button
                  key={dt.id}
                  onClick={() => {
                    setDocType(dt.id)
                    setErrors([])
                    setShowMobilePreview(false)
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all whitespace-nowrap"
                  style={
                    isSelected
                      ? {
                          borderColor: '#c9a84c',
                          background: 'rgba(201,168,76,0.14)',
                          color: '#ffffff',
                          boxShadow: '0 2px 10px rgba(201,168,76,0.15)',
                        }
                      : {
                          borderColor: 'rgba(255,255,255,0.08)',
                          background: 'rgba(255,255,255,0.03)',
                          color: 'rgba(255,255,255,0.55)',
                        }
                  }
                >
                  <span style={{ color: isSelected ? '#c9a84c' : 'rgba(255,255,255,0.40)' }}>{dt.icon}</span>
                  <span>{dt.label}</span>
                  {dt.free ? (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold" style={{ background: 'rgba(52,209,122,0.15)', color: '#34d17a' }}>
                      GRATIS
                    </span>
                  ) : (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-md font-bold" style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}>
                      NOTARIAL
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* MOBILE VIEW TOGGLE TABS (ONLY VISIBLE ON PHONES < lg) */}
        <div className="lg:hidden flex items-center border-b px-4 py-2 bg-[#121212] justify-between flex-shrink-0" style={{ borderColor: '#262626' }}>
          <div className="flex rounded-xl p-1 bg-[#1c1c1c] border border-white/10 w-full">
            <button
              onClick={() => setShowMobilePreview(false)}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                !showMobilePreview ? 'bg-[#c9a84c] text-black font-semibold shadow-sm' : 'text-white/60'
              }`}
            >
              <FileText size={13} />
              <span>1. Llenar Datos</span>
            </button>
            <button
              onClick={() => setShowMobilePreview(true)}
              className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                showMobilePreview ? 'bg-[#c9a84c] text-black font-semibold shadow-sm' : 'text-white/60'
              }`}
            >
              <Eye size={13} />
              <span>2. Ver Documento A4</span>
            </button>
          </div>
        </div>

        {/* BODY CONTAINER */}
        <div className="flex flex-1 overflow-hidden">
          {/* COLUMNA IZQUIERDA: FORMULARIO */}
          <div
            className={`flex-1 overflow-y-auto px-4 sm:px-6 py-4 ${
              showMobilePreview ? 'hidden lg:block' : 'block'
            }`}
            style={{ minWidth: '320px' }}
          >
            <div className="max-w-xl mx-auto space-y-4">
              {errors.length > 0 && (
                <div
                  className="p-3.5 rounded-xl border text-[12px] space-y-1.5"
                  style={{ background: 'rgba(255,80,80,0.10)', borderColor: 'rgba(255,80,80,0.30)', color: '#ff9090' }}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle size={15} />
                    <span>Por favor completa los siguientes campos obligatorios:</span>
                  </div>
                  {errors.map((e, idx) => (
                    <p key={idx} className="pl-6 text-[11px]">
                      • {e}
                    </p>
                  ))}
                </div>
              )}

              {renderForm()}
            </div>
          </div>

          {/* COLUMNA DERECHA: VISTA PREVIA HOJA A4 OFICIAL (PERÚ) */}
          <div
            className={`lg:w-[56%] border-l flex flex-col overflow-hidden bg-[#1e2025] ${
              showMobilePreview ? 'block w-full' : 'hidden lg:flex'
            }`}
            style={{ borderColor: '#2a2a2a' }}
          >
            {/* BARRA DE INFO DE FORMATO — SOLO LECTURA (no editable) */}
            <div className="px-3 sm:px-4 py-2 border-b flex items-center justify-between flex-wrap gap-2 flex-shrink-0 bg-[#17191e]" style={{ borderColor: '#2a2a2a' }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] flex items-center gap-1.5">
                  <Eye size={12} />
                  Hoja Legal A4 — Perú
                </span>
              </div>

              {/* Formato reglamentario (solo informativo, no editable) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[9.5px] bg-[#22252c] text-white/60 border border-white/10 font-mono">
                  {fmt.fontFamily} {fmt.fontSizePt}pt
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9.5px] bg-[#22252c] text-white/60 border border-white/10 font-mono">
                  Interlineado {fmt.lineHeight}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9.5px] bg-[#22252c] text-white/60 border border-white/10 font-mono">
                  {fmt.marginLeftCm}cm ↔ {fmt.marginRightCm}cm
                </span>

                {/* Alternar Vista Texto / Hoja */}
                <button
                  onClick={() => setViewMode((m) => (m === 'sheet' ? 'text' : 'sheet'))}
                  className="px-2 py-1 rounded-md text-[10px] font-medium border transition-colors border-white/10 bg-white/5 text-white/60 hover:text-white"
                >
                  {viewMode === 'sheet' ? 'Vista Texto' : 'Vista A4'}
                </button>
              </div>
            </div>

            {/* Norma aplicada */}
            <div className="px-3 sm:px-4 py-1.5 flex-shrink-0 bg-[#13151a]" style={{ borderBottom: '1px solid #222' }}>
              <p className="text-[9px] text-white/30 font-mono">
                📋 {fmt.note}
              </p>
            </div>

            {/* ÁREA DE VISUALIZACIÓN — fondo gris tipo Acrobat, hoja blanca continua */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 flex flex-col items-center bg-[#2b2e35]"
              style={{ gap: 0 }}
            >
              {viewMode === 'sheet' ? (
                <div
                  className="bg-white rounded-none w-full"
                  style={{
                    maxWidth: zoomLevel === 85 ? '580px' : zoomLevel === 115 ? '760px' : '660px',
                    /* Margen visual proporcional según el formato reglamentario del documento */
                    padding: `${fmt.marginTopCm * 37.8}px ${fmt.marginRightCm * 37.8}px ${fmt.marginBottomCm * 37.8}px ${fmt.marginLeftCm * 37.8}px`,
                    fontFamily: fmt.fontFamilyCss,
                    fontSize: `${fmt.fontSizePt}pt`,
                    lineHeight: `${fmt.lineHeight}`,
                    color: '#111111',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.40)',
                    border: '1px solid #c8c8c8',
                    minHeight: '800px',
                  }}
                >
                  {/* Texto del documento — sin membrete publicitario, justificado y con tipografía oficial */}
                  <div
                    className="doc-preview-sheet"
                    style={{
                      fontFamily: fmt.fontFamilyCss,
                      fontSize: `${fmt.fontSizePt}pt`,
                      lineHeight: `${fmt.lineHeight}`,
                      color: '#111111',
                    }}
                    dangerouslySetInnerHTML={{ __html: renderDocHtmlBody(docData.content) }}
                  />
                </div>
              ) : (
                <pre
                  className="w-full p-4 rounded-xl text-[11px] font-mono leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: '#111111',
                    color: 'rgba(255,255,255,0.75)',
                    border: '1px solid #2a2a2a',
                  }}
                >
                  {docData.content}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER ACCIONES — MOBILE: botones grandes táctiles; DESKTOP: fila compacta */}

        {/* MOBILE FOOTER (< lg): 2 filas de botones grandes */}
        <div className="lg:hidden flex-shrink-0 border-t bg-[#141414]" style={{ borderColor: '#262626', paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}>
          {/* Fila 1: Imprimir/PDF — el más importante */}
          <motion.button
            onClick={handlePrint}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-2.5 py-4 text-[14px] font-bold transition-all"
            style={{ background: '#c9a84c', color: '#111111' }}
          >
            <Printer size={18} />
            Imprimir / Guardar PDF Oficial
          </motion.button>

          {/* Fila 2: acciones secundarias */}
          <div className="grid grid-cols-2 gap-0 border-t" style={{ borderColor: '#262626' }}>
            <button
              onClick={handleDownloadWord}
              className="flex items-center justify-center gap-2 py-3.5 text-[12px] font-semibold border-r transition-all active:bg-white/5"
              style={{ borderColor: '#262626', color: '#60a5fa', background: 'rgba(96,165,250,0.06)' }}
            >
              {downloadedWord ? (
                <><Check size={15} className="text-blue-400" /><span>¡Descargado!</span></>
              ) : (
                <><FileDown size={15} /><span>Word (.docx)</span></>
              )}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3.5 text-[12px] font-semibold transition-all active:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.70)', background: 'transparent' }}
            >
              {copied ? (
                <><Check size={15} className="text-green-400" /><span>¡Copiado!</span></>
              ) : (
                <><Copy size={15} /><span>Copiar Texto</span></>
              )}
            </button>
          </div>
        </div>

        {/* DESKTOP FOOTER (≥ lg): fila compacta */}
        <div className="hidden lg:flex items-center justify-between px-6 py-3 border-t flex-shrink-0 bg-[#141414] gap-2" style={{ borderColor: '#262626' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all"
              style={{ borderColor: '#333333', color: 'rgba(255,255,255,0.70)', background: '#1c1c1c' }}
            >
              {copied ? (
                <><Check size={14} className="text-green-400" /><span>¡Copiado!</span></>
              ) : (
                <><Copy size={14} /><span>Copiar Texto</span></>
              )}
            </button>

            <button
              onClick={handleDownloadWord}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all"
              style={{ borderColor: 'rgba(96,165,250,0.30)', color: '#60a5fa', background: 'rgba(96,165,250,0.08)' }}
              title="Descargar archivo editable oficial para Microsoft Word o Google Docs (.docx)"
            >
              {downloadedWord ? (
                <><Check size={14} className="text-blue-400" /><span>¡Descargado!</span></>
              ) : (
                <><FileDown size={14} /><span>Word (.docx)</span></>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={handlePrint}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all shadow-lg"
              style={{ background: '#c9a84c', color: '#111111' }}
            >
              <Printer size={15} />
              <span>Imprimir / PDF</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
