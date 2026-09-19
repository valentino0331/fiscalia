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
import { buildPrintHTML, downloadWordDoc, downloadPdfDoc, renderDocHtmlBody } from '@/lib/exportDoc'

interface CitizenDocumentGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  initialDocType?: DocType
}

export type DocType =
  | 'denuncia_penal'
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
    id: 'denuncia_penal',
    label: 'Denuncia Penal',
    sublabel: 'Mesa de Partes Fiscalía (NCPP Art. 326-328)',
    icon: <Scale size={16} />,
    free: true,
    badgeColor: '#ef4444',
  },
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
  // Denuncia Penal → NCPP Art. 326-328 / MP-FN: TNR 12pt, interlineado 1.5, formato fiscal
  denuncia_penal: {
    fontFamily: 'Times New Roman', fontFamilyCss: "'Times New Roman', Times, serif",
    fontSizePt: 12, lineHeight: 1.5,
    marginTopCm: 3.5, marginBottomCm: 2.5, marginLeftCm: 3.5, marginRightCm: 2.5,
    note: 'NCPP Art. 326-328 — Ministerio Público del Perú'
  },
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
  // Contrato de Alquiler → Estándar Notarial Perú: Times New Roman 11pt, interlineado 1.15, márgenes notariales
  alquiler: {
    fontFamily: 'Times New Roman', fontFamilyCss: "'Times New Roman', Times, serif",
    fontSizePt: 11, lineHeight: 1.15,
    marginTopCm: 2.5, marginBottomCm: 2.5, marginLeftCm: 3.0, marginRightCm: 3.0,
    note: 'Estándar Notarial Perú — Ley 30933, Ley 32430 y Art. 594 CPC'
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

function numeroALetras(monto: number): string {
  const unidades = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
  const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
  const decenas = ['', 'diez', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

  const entero = Math.floor(Math.abs(monto))
  const centavos = Math.round((Math.abs(monto) - entero) * 100)
  const centavosStr = centavos.toString().padStart(2, '0') + '/100 soles'

  if (entero === 0) return `Cero y ${centavosStr}`
  if (entero === 100) return `Cien y ${centavosStr}`

  function convertirGrupo(n: number): string {
    let res = ''
    const c = Math.floor(n / 100)
    const d = Math.floor((n % 100) / 10)
    const u = n % 10

    if (c > 0) {
      if (c === 1 && d === 0 && u === 0) res += 'cien '
      else res += centenas[c] + ' '
    }

    if (d === 1) {
      res += especiales[u] + ' '
    } else if (d === 2) {
      if (u === 0) res += 'veinte '
      else res += 'veinti' + unidades[u] + ' '
    } else if (d > 2) {
      res += decenas[d] + ' '
      if (u > 0) res += 'y ' + unidades[u] + ' '
    } else if (u > 0) {
      res += unidades[u] + ' '
    }
    return res.trim()
  }

  let palabras = ''
  const miles = Math.floor(entero / 1000)
  const resto = entero % 1000

  if (miles === 1) {
    palabras += 'mil '
  } else if (miles > 1) {
    palabras += convertirGrupo(miles) + ' mil '
  }

  if (resto > 0) {
    palabras += convertirGrupo(resto) + ' '
  }

  palabras = palabras.trim()
  if (!palabras) palabras = 'Cero'
  palabras = palabras.charAt(0).toUpperCase() + palabras.slice(1)
  return `${palabras} y ${centavosStr}`
}

export default function CitizenDocumentGeneratorModal({
  isOpen,
  onClose,
  initialDocType = 'carta_notarial',
}: CitizenDocumentGeneratorModalProps) {
  const [docType, setDocType] = useState<DocType>(initialDocType)
  const [copied, setCopied] = useState(false)
  const [downloadedWord, setDownloadedWord] = useState(false)
  const [downloadedPdf, setDownloadedPdf] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [viewMode, setViewMode] = useState<'sheet' | 'text'>('sheet')
  const [zoomLevel, setZoomLevel] = useState<number>(100)
  // Formato reglamentario automático según tipo de documento (no editable por el usuario)
  const fmt = DOC_FORMAT[docType]

  // ── Denuncia Penal (Mesa de Partes Fiscalía — NCPP Art. 326-328) ──
  const [denunciaFiscalia, setDenunciaFiscalia] = useState('Fiscalía Provincial Penal Corporativa de Turno')
  const [denunciaCiudad, setDenunciaCiudad] = useState('Lima')
  const [denunciaDelito, setDenunciaDelito] = useState('Estafa Agravada (Art. 196-A del Código Penal)')
  const [denuncianteNombre, setDenuncianteNombre] = useState('')
  const [denuncianteDni, setDenuncianteDni] = useState('')
  const [denuncianteDireccion, setDenuncianteDireccion] = useState('')
  const [denuncianteTelefono, setDenuncianteTelefono] = useState('')
  const [denuncianteCorreo, setDenuncianteCorreo] = useState('')
  const [denuncianteCasilla, setDenuncianteCasilla] = useState('')
  const [denunciadoNombre, setDenunciadoNombre] = useState('')
  const [denunciadoDni, setDenunciadoDni] = useState('')
  const [denunciadoDireccion, setDenunciadoDireccion] = useState('')
  const [denunciaFechaHechos, setDenunciaFechaHechos] = useState('')
  const [denunciaLugarHechos, setDenunciaLugarHechos] = useState('')
  const [denunciaHechos, setDenunciaHechos] = useState('')
  const [denunciaElementosConviccion, setDenunciaElementosConviccion] = useState('')
  const [denunciaDiligenciasUrgentes, setDenunciaDiligenciasUrgentes] = useState('')

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

  // ── Alquiler (Estándar Notarial Perú 2026: Ley 30933, Ley 32430, DL 1529, Art. 594 CPC) ──
  const [arrendador, setArrendador] = useState('')
  const [arrendadorDni, setArrendadorDni] = useState('')
  const [arrendadorEstadoCivil, setArrendadorEstadoCivil] = useState('soltero(a)')
  const [arrendadorDomicilio, setArrendadorDomicilio] = useState('')
  const [arrendatario, setArrendatario] = useState('')
  const [arrendatarioDni, setArrendatarioDni] = useState('')
  const [arrendatarioEstadoCivil, setArrendatarioEstadoCivil] = useState('soltero(a)')
  const [arrendatarioDomicilio, setArrendatarioDomicilio] = useState('')
  const [inmuebleDireccion, setInmuebleDireccion] = useState('')
  const [inmueblePartida, setInmueblePartida] = useState('')
  const [inmuebleZonaRegistral, setInmuebleZonaRegistral] = useState('')
  const [inmuebleArea, setInmuebleArea] = useState('120')
  const [inmuebleDetalle, setInmuebleDetalle] = useState('3 dormitorios, 2 baños, sala-comedor, cocina y cochera')
  const [rentaMensual, setRentaMensual] = useState('2500')
  const [garantiaMeses, setGarantiaMeses] = useState('2')
  const [diaPago, setDiaPago] = useState('5')
  const [bancoNombre, setBancoNombre] = useState('BCP')
  const [cuentaBancaria, setCuentaBancaria] = useState('')
  const [cuentaCci, setCuentaCci] = useState('')
  const [plazoTexto, setPlazoTexto] = useState('un (01) año')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [ciudadContrato, setCiudadContrato] = useState('Lima')

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
    if (docType === 'denuncia_penal') {
      if (!denuncianteNombre.trim()) errs.push('Nombre completo del denunciante')
      if (!denuncianteDni.trim()) errs.push('DNI del denunciante')
      if (!denunciadoNombre.trim()) errs.push('Nombre del denunciado o "Los que resulten responsables"')
      if (!denunciaDelito.trim()) errs.push('Delito imputado')
      if (!denunciaHechos.trim()) errs.push('Narración circunstanciada de los hechos')
    } else if (docType === 'carta_notarial') {
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
    if (docType === 'denuncia_penal') {
      return {
        title: `Denuncia_Penal_${denuncianteNombre.replace(/\\s+/g, '_') || 'Denuncia'}`,
        content: `CARPETA FISCAL : (Por Asignar)
FISCAL RESPONSABLE : FISCAL PROVINCIAL PENAL CORPORATIVO
SUMILLA            : FORMULA DENUNCIA PENAL DE PARTE POR DELITO DE ${denunciaDelito.toUpperCase()}

SEÑOR FISCAL PROVINCIAL DE LA ${(denunciaFiscalia || 'FISCALÍA PROVINCIAL PENAL CORPORATIVA DE TURNO').toUpperCase()} DE ${(denunciaCiudad || 'LIMA').toUpperCase()}:

I. DATOS DE IDENTIFICACIÓN DEL DENUNCIANTE:
${denuncianteNombre || '[NOMBRES Y APELLIDOS COMPLETOS DEL DENUNCIANTE]'}, identificado(a) con DNI N° ${denuncianteDni || '[N° DE DNI]'}, con domicilio real en ${denuncianteDireccion || '[DIRECCIÓN EXACTA DEL DENUNCIANTE]'}; con teléfono de contacto ${denuncianteTelefono || '[NÚMERO TELEFÓNICO]'}, correo electrónico para notificaciones oficiales ${denuncianteCorreo || '[CORREO ELECTRÓNICO]'}${denuncianteCasilla ? ` y Casilla Electrónica SINOE N° ${denuncianteCasilla}` : ''}; ante su Despacho Fiscal, con el debido respeto me presento y expongo:

II. DATOS DE INDIVIDUALIZACIÓN DEL DENUNCIADO:
La presente denuncia penal de parte se dirige expresamente contra:
— ${denunciadoNombre || '[NOMBRE Y APELLIDOS DEL DENUNCIADO O PERSONA JURÍDICA / LOS QUE RESULTEN RESPONSABLES]'}${denunciadoDni ? `, con DNI/RUC N° ${denunciadoDni}` : ''}, a quien deberá notificarse en su domicilio sito en ${denunciadoDireccion || '[DIRECCIÓN DEL DENUNCIADO O INDICAR QUE ES DOMICILIO IGNORADO / A DETERMINAR POR PESQUISA POLICIAL]'}.

III. PETITORIO Y CALIFICACIÓN JURÍDICA PRELIMINAR:
Al amparo del artículo 159° inciso 4 y 5 de la Constitución Política del Perú, en concordancia con los artículos 11°, 94° inciso 2 de la Ley Orgánica del Ministerio Público (D. Leg. 052) y los artículos 326°, 328° y 330° del Código Procesal Penal (D. Leg. 957), FORMULO DENUNCIA PENAL DE PARTE contra el investigado antes individualizado, por la presunta comisión del ilícito penal tipificado como:
— ${denunciaDelito || '[TIPIFICACIÓN DEL DELITO SEGÚN CÓDIGO PENAL]'}.
A fin de que su Despacho Fiscal disponga el INICIO DE DILIGENCIAS PRELIMINARES EN SEDE FISCAL Y/O POLICIAL (conforme a las directivas vigentes, D. Leg. 1605 y Ley 32130), recabe los elementos de convicción y en su oportunidad formalice la respectiva Investigación Preparatoria.

IV. RELACIÓN CIRCUNSTANCIADA Y CRONOLÓGICA DE LOS HECHOS:
Conforme a la exigencia del artículo 328° numeral 1 del Código Procesal Penal:
${denunciaFechaHechos ? `Fecha / Periodo de los hechos: ${denunciaFechaHechos}\n` : ''}${denunciaLugarHechos ? `Lugar de comisión: ${denunciaLugarHechos}\n` : ''}
4.1. CIRCUNSTANCIAS PRECEDENTES:
Con anterioridad a los hechos incriminados, el suscrito mantenía contacto con el denunciado en el contexto de relaciones jurídicas/personales legítimas, donde se generaron las condiciones previas.

4.2. CIRCUNSTANCIAS CONCOMITANTES (RELATO FÁCTICO PRINCIPAL):
${denunciaHechos || '[DESCRIBIR DETALLADAMENTE LA CONDUCTA ANTIJURÍDICA Y TÍPICA: Modus operandi del denunciado, engaño o ardid desplegado, perjuicio económico ocasionado, actos materiales realizados, fechas y horas específicas.]'}

4.3. CIRCUNSTANCIAS POSTERIORES:
Consumado el ilícito penal, el denunciado evitó responder a las comunicaciones cursadas, no restituyó el perjuicio causado y ha evidenciado una conducta renuente a esclarecer lo sucedido, configurándose la consumación típica y la afectación al bien jurídico tutelado.

V. ELEMENTOS DE CONVICCIÓN Y MEDIOS PROBATORIOS OFRECIDOS:
Al amparo del artículo 328° numeral 1 del NCPP, ofrezco los siguientes elementos que acreditan la verosimilitud de la imputación:
${denunciaElementosConviccion || '1. Copia simple de documentos, contratos o comunicaciones que acreditan la relación y el perjuicio.\n2. Vouchers de depósitos bancarios / transferencias financieras que demuestran el desplazamiento patrimonial.\n3. Capturas de conversaciones certificadas notarialmente o mediante constatación policial.\n4. Declaración testimonial de los testigos presenciales de los hechos.'}

VI. ACTOS DE INVESTIGACIÓN Y DILIGENCIAS URGENTES SOLICITADAS:
Solicito al señor Fiscal que, al amparo del artículo 330° y 334° del NCPP, ordene con prontitud las siguientes diligencias:
${denunciaDiligenciasUrgentes || '1. Se reciba la declaración indagatoria del denunciado bajo apercibimiento de ley y conducción compulsiva.\n2. Se requiera a las entidades financieras y/o de telecomunicaciones el informe correspondiente para la acreditación del hecho punible.\n3. Se oficie a la Policía Nacional del Perú (PNP) para que practique las pesquisas especializadas urgentes.\n4. Se reciba la declaración ampliatoria y ratificación del suscrito denunciante.'}

VII. FUNDAMENTOS DE DERECHO:
— Artículos 2° inciso 20, 139° y 159° de la Constitución Política del Estado.
— Artículos 1°, 11°, 94° y 95° del Decreto Legislativo N° 052 (Ley Orgánica del Ministerio Público).
— Artículos 60°, 61°, 95°, 326°, 328°, 330° y 334° del Código Procesal Penal (D. Leg. 957).
— Tipificación penal específica prevista en el Código Penal Peruano.
— Acuerdo Plenario N° 02-2005/CJ-116 sobre garantías de certeza en las declaraciones y denuncias penales.

POR TANTO:
A usted, Señor Fiscal Provincial, solicito admitir a trámite la presente denuncia penal y ordenar de inmediato los actos de investigación que por ley corresponden.

PRIMER OTROSÍ DIGO: Señalo mi domicilio procesal y canales electrónicos indicados en el exordio para todas las notificaciones y providencias fiscales que emanen de la presente investigación.

                                                        ${denunciaCiudad || 'Lima'}, ${today}



_______________________________________________________
${denuncianteNombre || 'FIRMA DEL DENUNCIANTE'}
DNI N°: ${denuncianteDni || '_______________'}
Teléfono: ${denuncianteTelefono || '_______________'}

┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│                                                     │
│                                                     │
│             [ HUELLA DACTILAR DIGITAL ]             │
│            DEDO ÍNDICE DERECHO DENUNCIANTE          │
└─────────────────────────────────────────────────────┘`,
      }
    }

    if (docType === 'carta_notarial') {
      const plazoTexto =
        cartaPlazo === '48'
          ? 'CUARENTA Y OCHO (48) HORAS'
          : cartaPlazo === '72'
          ? 'SETENTA Y DOS (72) HORAS'
          : `${cartaPlazo} DÍAS HÁBILES`

      return {
        title: `Carta_Notarial_${cartaRemitente.replace(/\s+/g, '_') || 'Requerimiento'}`,
        content: `EXP. NOTARIAL N°: ___________________
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
      const rentaNum = parseFloat(rentaMensual || '0') || 0
      const garantiaMesesNum = parseFloat(garantiaMeses || '1') || 1
      const garantiaTotalNum = rentaNum * garantiaMesesNum
      const rentaFormatted = rentaNum.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      const garantiaFormatted = garantiaTotalNum.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      const rentaEnLetras = numeroALetras(rentaNum)
      const garantiaEnLetras = numeroALetras(garantiaTotalNum)

      const fInicioStr = fechaInicio
        ? new Date(fechaInicio + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
        : '1 de septiembre de 2026'
      const fFinStr = fechaFin
        ? new Date(fechaFin + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })
        : '31 de agosto de 2027'

      const ciudad = ciudadContrato.trim() || 'Lima'

      return {
        title: `Contrato_Arrendamiento_${(arrendador || 'Inmueble').replace(/\s+/g, '_')}`,
        content: `CONTRATO DE ARRENDAMIENTO DE INMUEBLE

Conste por el presente documento el contrato de arrendamiento que celebran, de una parte, don/doña ${arrendador || '[NOMBRE DEL ARRENDADOR]'}, identificado(a) con DNI N.º ${arrendadorDni || '[DNI ARRENDADOR]'}, de estado civil ${arrendadorEstadoCivil || 'soltero(a)'}, con domicilio en ${arrendadorDomicilio || '[DOMICILIO DEL ARRENDADOR]'}, a quien en adelante se denominará EL ARRENDADOR; y, de la otra parte, don/doña ${arrendatario || '[NOMBRE DEL ARRENDATARIO]'}, identificado(a) con DNI N.º ${arrendatarioDni || '[DNI ARRENDATARIO]'}, de estado civil ${arrendatarioEstadoCivil || 'soltero(a)'}, con domicilio en ${arrendatarioDomicilio || '[DOMICILIO DEL ARRENDATARIO]'}, a quien en adelante se denominará EL ARRENDATARIO; en los términos y condiciones siguientes:

PRIMERA.- DEL INMUEBLE
EL ARRENDADOR es propietario del inmueble ubicado en ${inmuebleDireccion || '[DIRECCIÓN EXACTA DEL INMUEBLE]'}, inscrito en la Partida Registral N.º ${inmueblePartida || '[PARTIDA REGISTRAL]'} del Registro de Predios de la Zona Registral N.º ${inmuebleZonaRegistral || '[SEDE / ZONA REGISTRAL]'} (SUNARP). El inmueble tiene un área aproximada de ${inmuebleArea || '120'} m² y consta de ${inmuebleDetalle || '3 dormitorios, 2 baños, sala-comedor, cocina y cochera'}. El estado de conservación del inmueble a la fecha de entrega consta en el Acta de Entrega que como Anexo 1 forma parte integrante del presente contrato, con el respectivo registro fotográfico.

SEGUNDA.- DESTINO
El inmueble será destinado exclusivamente a vivienda de EL ARRENDATARIO y su núcleo familiar directo. El uso del inmueble para un fin distinto al pactado constituye causal de resolución del contrato, conforme al artículo 1697°, inciso 2, del Código Civil.

TERCERA.- PLAZO
El plazo del presente contrato es de ${plazoTexto || 'un (01) año'}, plazo máximo permitido entre personas naturales conforme al artículo 1688° del Código Civil, contado desde el ${fInicioStr} hasta el ${fFinStr}. El contrato concluye de pleno derecho al vencimiento del plazo, sin necesidad de aviso previo, conforme al artículo 1699° del Código Civil. Si EL ARRENDATARIO permaneciera en el inmueble después del vencimiento sin oposición de EL ARRENDADOR, se entenderá continuado el arrendamiento bajo las mismas condiciones y por plazo indeterminado, pudiendo cualquiera de las partes ponerle fin cursando aviso con no menos de treinta (30) días calendario de anticipación mediante carta notarial, conforme al artículo 1700° del Código Civil.

CUARTA.- RENTA MENSUAL
La renta mensual asciende a S/ ${rentaFormatted} (${rentaEnLetras}), que EL ARRENDATARIO pagará por adelantado dentro de los primeros ${diaPago || '5'} días de cada mes, mediante transferencia o depósito bancario a la cuenta N.º ${cuentaBancaria || '[N° DE CUENTA]'} del Banco ${bancoNombre || 'BCP'}${cuentaCci ? ` (CCI: ${cuentaCci})` : ''}, a nombre de EL ARRENDADOR, en cumplimiento de lo dispuesto por la Ley N.º 28194 (Ley para la Lucha contra la Evasión y para la Formalización de la Economía), modificada por el Decreto Legislativo N.º 1529, que exige el uso de medios de pago para obligaciones iguales o superiores a S/ 2,000.00. El comprobante de la transferencia o depósito constituye el único medio válido de acreditación del pago.

QUINTA.- GARANTÍA
EL ARRENDATARIO entrega la suma de S/ ${garantiaFormatted} (${garantiaEnLetras}) como depósito en garantía del cumplimiento de sus obligaciones, incluyendo el pago de rentas pendientes, servicios impagos y daños al inmueble distintos del deterioro por uso ordinario. Dicha suma será devuelta a EL ARRENDATARIO dentro de los quince (15) días calendario siguientes a la devolución efectiva del inmueble, previa verificación de su estado de conservación, deduciéndose únicamente los conceptos antes señalados debidamente acreditados. La garantía no podrá ser aplicada por EL ARRENDATARIO como pago de la renta de los últimos meses de vigencia del contrato.

SEXTA.- SERVICIOS
Los servicios de agua, luz, gas e internet serán de cargo de EL ARRENDATARIO, quien se obliga a mantenerlos al día durante la vigencia del contrato y a acreditar dicho pago cuando le sea requerido, conforme al artículo 1681°, inciso 3, del Código Civil.

SÉPTIMA.- REPARACIONES
Las reparaciones locativas u ordinarias, derivadas del uso normal del inmueble, serán de cargo de EL ARRENDATARIO. Las reparaciones necesarias, estructurales o derivadas del desgaste natural del bien serán de cargo de EL ARRENDADOR, conforme al artículo 1678° del Código Civil, salvo que el deterioro sea imputable a dolo o culpa de EL ARRENDATARIO, en cuyo caso el costo será asumido por este último.

OCTAVA.- RESOLUCIÓN DEL CONTRATO
EL ARRENDADOR podrá solicitar la resolución del contrato en los siguientes casos, conforme al artículo 1697° del Código Civil: (a) falta de pago de la renta por un periodo de dos (2) meses y quince (15) días; (b) uso del inmueble para fin distinto al pactado en la Cláusula Segunda; (c) subarrendamiento o cesión del inmueble sin autorización escrita de EL ARRENDADOR; y (d) incumplimiento de cualquier otra obligación esencial establecida en el presente contrato, previo requerimiento escrito con un plazo de subsanación de cinco (5) días hábiles.

NOVENA.- PENALIDAD POR INCUMPLIMIENTO
En caso de resolución del contrato por causa imputable a EL ARRENDATARIO, este deberá pagar a EL ARRENDADOR una penalidad equivalente al triple de la renta mensual vigente a la fecha de resolución, sin perjuicio del pago de las rentas adeudadas y de la indemnización por los daños y perjuicios adicionales que EL ARRENDADOR acredite. La aplicación de esta penalidad no limita el derecho de EL ARRENDATARIO a cuestionarla o hacer valer sus derechos por la vía que corresponda.

DÉCIMA.- DEVOLUCIÓN DEL INMUEBLE
Al término del contrato, por vencimiento del plazo o por resolución, EL ARRENDATARIO devolverá el inmueble en el mismo estado de conservación en que lo recibió según el Acta de Entrega (Anexo 1), salvo el deterioro proveniente del uso ordinario y el transcurso del tiempo. Si EL ARRENDATARIO no devolviera el inmueble en la fecha correspondiente, pagará a EL ARRENDADOR una penalidad equivalente a la renta mensual vigente por cada mes o fracción de retraso, conforme al artículo 1704° del Código Civil, sin perjuicio de las acciones de desalojo a que hubiera lugar.

DÉCIMO PRIMERA.- PROHIBICIÓN DE SUBARRENDAMIENTO Y CESIÓN
EL ARRENDATARIO no podrá subarrendar el inmueble, ceder su posición contractual ni ceder el uso del bien a terceros, total o parcialmente, sin autorización previa y por escrito de EL ARRENDADOR, conforme al artículo 1692° del Código Civil. La contravención de esta cláusula constituye causal de resolución del contrato.

DÉCIMO SEGUNDA.- CLÁUSULA DE ALLANAMIENTO A FUTURO
EL ARRENDATARIO declara su allanamiento expreso a la futura demanda de desalojo que EL ARRENDADOR pudiera interponer por conclusión del contrato o por resolución derivada de la falta de pago de la renta, conforme al artículo 594° del Código Procesal Civil, modificado por la Ley N.º 30201. Las partes dejan constancia de que, para la validez de esta cláusula, sus firmas serán legalizadas notarialmente.

DÉCIMO TERCERA.- SOMETIMIENTO A LA LEY N.º 30933 (DESALOJO NOTARIAL EXPRESS)
Las partes se someten expresamente al procedimiento de desalojo notarial regulado por la Ley N.º 30933 y su reglamento, para el caso de vencimiento del contrato o falta de pago de la renta. Para dicho efecto, EL ARRENDADOR designa la cuenta bancaria señalada en la Cláusula Cuarta como cuenta para la acreditación de los pagos de renta.

DÉCIMO CUARTA.- RÉGIMEN TRIBUTARIO
Las partes dejan constancia de que la renta de primera categoría generada por el presente arrendamiento se imputará bajo el criterio de lo percibido, conforme a la Ley N.º 32430 (Ley de Arrendamiento Justo), vigente desde el 1 de enero de 2026, que modifica el artículo 57°, inciso b), del Texto Único Ordenado de la Ley del Impuesto a la Renta. EL ARRENDADOR declarará y pagará el Impuesto a la Renta correspondiente (5% de la renta) únicamente respecto de las rentas efectivamente percibidas, acreditadas mediante los comprobantes de transferencia o depósito bancario señalados en la Cláusula Cuarta.

DÉCIMO QUINTA.- JURISDICCIÓN
Para todos los efectos derivados del presente contrato, las partes se someten a la competencia de los jueces y tribunales del distrito judicial de ${ciudad}, renunciando al fuero de sus domicilios de ser este distinto.

Firmado en la ciudad de ${ciudad}, a los ${today}, en dos ejemplares de igual tenor y valor, con firmas legalizadas notarialmente conforme a lo señalado en la Cláusula Décimo Segunda.

Nota: el presente contrato, al tener como destino la vivienda, puede alternativamente celebrarse mediante el Formulario Único de Arrendamiento (FUA) previsto en el Decreto Legislativo N.º 1177, el cual facilita el acceso a los mecanismos de garantía y desalojo antes referidos.

_________________________________          _________________________________
EL ARRENDADOR                              EL ARRENDATARIO
${arrendador || 'EL ARRENDADOR'}           ${arrendatario || 'EL ARRENDATARIO'}
DNI N°: ${arrendadorDni || '_______________'}       DNI N°: ${arrendatarioDni || '_______________'}`,
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

  const handleDownloadPdf = async () => {
    if (!validate()) return
    await downloadPdfDoc(docData.title, docData.content, docData.title, fmt)
    setDownloadedPdf(true)
    setTimeout(() => setDownloadedPdf(false), 2500)
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(docData.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentMeta = DOC_TYPES.find((d) => d.id === docType)!

  // ─── Renderizado del Formulario según Tipo de Documento ─────────
  const renderForm = () => {
    if (docType === 'denuncia_penal') {
      return (
        <div className="space-y-4">
          <div
            className="p-3 rounded-xl border text-[11px] flex items-start gap-2.5"
            style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#f87171' }}
          >
            <Scale size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Estructura Oficial de Denuncia Penal ante el Ministerio Público (NCPP Art. 326-328)</span>
              <p className="opacity-80 leading-relaxed">
                Formato con sumilla fiscal, circunstancias precedentes, concomitantes y posteriores, elementos de convicción y diligencias urgentes para la Mesa de Partes del Ministerio Público.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput
              label="Fiscalía de Destino"
              value={denunciaFiscalia}
              onChange={setDenunciaFiscalia}
              placeholder="Fiscalía Provincial Penal Corporativa de Turno"
              required
            />
            <FieldInput
              label="Ciudad / Distrito Fiscal"
              value={denunciaCiudad}
              onChange={setDenunciaCiudad}
              placeholder="Lima / Arequipa / Trujillo"
              required
            />
          </div>

          <FieldInput
            label="Delito Imputado (Calificación Jurídica)"
            value={denunciaDelito}
            onChange={setDenunciaDelito}
            placeholder="Estafa Agravada (Art. 196-A CP) / Apropiación Ilícita (Art. 190 CP)"
            required
            hint="Indicar el nombre del delito y artículo del Código Penal si se conoce"
          />

          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] font-semibold text-[#c9a84c] block mb-2">1. Datos del Denunciante (Agraviado / Quien presenta la denuncia)</span>
            <div className="space-y-3">
              <FieldInput label="Tu Nombre Completo" value={denuncianteNombre} onChange={setDenuncianteNombre} placeholder="Juan Alberto Quispe Mendoza" required />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput label="Tu DNI" value={denuncianteDni} onChange={setDenuncianteDni} placeholder="45678912" required />
                <FieldInput label="Teléfono de Contacto" value={denuncianteTelefono} onChange={setDenuncianteTelefono} placeholder="987654321" required />
              </div>
              <FieldInput label="Domicilio Real Completo" value={denuncianteDireccion} onChange={setDenuncianteDireccion} placeholder="Av. Arequipa 1234, Dpto. 402, Miraflores, Lima" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput label="Correo Electrónico (Notificaciones)" value={denuncianteCorreo} onChange={setDenuncianteCorreo} placeholder="juan.quispe@gmail.com" />
                <FieldInput label="Casilla SINOE (Opcional)" value={denuncianteCasilla} onChange={setDenuncianteCasilla} placeholder="12345" hint="Si cuentas con casilla judicial/fiscal" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] font-semibold text-red-400 block mb-2">2. Datos del Denunciado (Imputado / Investigado)</span>
            <div className="space-y-3">
              <FieldInput
                label="Nombre del Denunciado o Denominación"
                value={denunciadoNombre}
                onChange={setDenunciadoNombre}
                placeholder="Carlos Manuel Silva Ramos (o 'Los que resulten responsables')"
                required
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput label="DNI o RUC del Denunciado (si se conoce)" value={denunciadoDni} onChange={setDenunciadoDni} placeholder="12345678" hint="Opcional si se desconoce" />
                <FieldInput label="Domicilio del Denunciado" value={denunciadoDireccion} onChange={setDenunciadoDireccion} placeholder="Calle Las Flores 456, San Isidro (o ignorado)" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <span className="text-[11px] font-semibold text-white/80 block mb-2">3. Circunstancias de los Hechos</span>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldInput label="Fecha o Periodo de los Hechos" value={denunciaFechaHechos} onChange={setDenunciaFechaHechos} placeholder="15 de enero de 2026 / Entre nov. 2025 y ene. 2026" />
                <FieldInput label="Lugar de Ocurrencia" value={denunciaLugarHechos} onChange={setDenunciaLugarHechos} placeholder="Lima Cercado / Distrito de Surco" />
              </div>
              <FieldTextarea
                label="Narración Circunstanciada de los Hechos"
                value={denunciaHechos}
                onChange={setDenunciaHechos}
                rows={5}
                placeholder="Describa de manera ordenada cómo ocurrieron los hechos: cuál fue el engaño o agresión, qué promesas se hicieron, qué perjuicio económico o físico sufrió, y qué pasó después..."
                required
                hint="Sea específico en montos, fechas, comunicaciones y personas intervinientes"
              />
              <FieldTextarea
                label="Elementos de Convicción / Pruebas a Adjuntar"
                value={denunciaElementosConviccion}
                onChange={setDenunciaElementosConviccion}
                rows={3}
                placeholder="1. Capturas de chats de WhatsApp.&#10;2. Vouchers bancarios o estados de cuenta.&#10;3. Copia simple de contratos o recibos."
                hint="Numere cada documento o prueba que adjuntará a la denuncia"
              />
              <FieldTextarea
                label="Diligencias Urgentes Solicitadas al Fiscal"
                value={denunciaDiligenciasUrgentes}
                onChange={setDenunciaDiligenciasUrgentes}
                rows={2}
                placeholder="— Citación del denunciado a rendir su instructiva.&#10;— Oficiar al banco BCP para informe financiero.&#10;— Inspección técnica policial."
                hint="Diligencias iniciales que solicita que la Fiscalía realice"
              />
            </div>
          </div>
        </div>
      )
    }

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
            className="p-3.5 rounded-xl border text-[11px] flex items-start gap-2.5"
            style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.25)', color: '#c9a84c' }}
          >
            <Home size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Contrato Notarial de Arrendamiento (15 Cláusulas — Estándar 2026)</span>
              <p className="opacity-80 leading-relaxed">
                Incluye Desalojo Notarial Express (Ley N° 30933), Allanamiento a Futuro (Art. 594 CPC), Arrendamiento Justo (Ley N° 32430 - IR 5% por lo percibido) y Bancarización (D. Leg. 1529).
              </p>
            </div>
          </div>

          {/* 1. Datos del Arrendador (Propietario) */}
          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">1. Datos del Arrendador (Propietario)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput label="Nombre Completo del Propietario" value={arrendador} onChange={setArrendador} placeholder="Jorge Luis Mendoza Ríos" required />
              <FieldInput label="DNI del Propietario" value={arrendadorDni} onChange={setArrendadorDni} placeholder="42857391" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput label="Estado Civil" value={arrendadorEstadoCivil} onChange={setArrendadorEstadoCivil} placeholder="soltero(a) / casado(a)" />
              <FieldInput label="Domicilio Real del Propietario" value={arrendadorDomicilio} onChange={setArrendadorDomicilio} placeholder="Calle Los Álamos 245, Urb. El Golf, Trujillo" />
            </div>
          </div>

          {/* 2. Datos del Arrendatario (Inquilino) */}
          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">2. Datos del Arrendatario (Inquilino)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput label="Nombre Completo del Inquilino" value={arrendatario} onChange={setArrendatario} placeholder="María Elena Castro Villanueva" required />
              <FieldInput label="DNI del Inquilino" value={arrendatarioDni} onChange={setArrendatarioDni} placeholder="70394528" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput label="Estado Civil" value={arrendatarioEstadoCivil} onChange={setArrendatarioEstadoCivil} placeholder="soltero(a) / casado(a)" />
              <FieldInput label="Domicilio Actual del Inquilino" value={arrendatarioDomicilio} onChange={setArrendatarioDomicilio} placeholder="Av. España 1420, Trujillo" />
            </div>
          </div>

          {/* 3. Inmueble y Registro SUNARP */}
          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">3. Inmueble y Registro SUNARP</h4>
            <FieldInput label="Dirección Exacta del Inmueble" value={inmuebleDireccion} onChange={setInmuebleDireccion} placeholder="Calle Las Begonias 312, Urb. Primavera, Víctor Larco, Trujillo" required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput label="Partida Registral (SUNARP)" value={inmueblePartida} onChange={setInmueblePartida} placeholder="11048293" hint="Registro de Predios" />
              <FieldInput label="Sede / Zona Registral" value={inmuebleZonaRegistral} onChange={setInmuebleZonaRegistral} placeholder="Zona Registral N.º V - Sede Trujillo" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldInput label="Área Aprox. (m²)" value={inmuebleArea} onChange={setInmuebleArea} placeholder="120" type="number" />
              <div className="sm:col-span-2">
                <FieldInput label="Distribución / Ambientes" value={inmuebleDetalle} onChange={setInmuebleDetalle} placeholder="3 dormitorios, 2 baños, sala-comedor, cocina y cochera" />
              </div>
            </div>
          </div>

          {/* 4. Renta, Depósito de Garantía y Bancarización */}
          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">4. Renta, Garantía y Bancarización (D. Leg. 1529)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldInput label="Renta Mensual (S/)" value={rentaMensual} onChange={setRentaMensual} placeholder="2500" type="number" required />
              <FieldInput label="Meses de Garantía" value={garantiaMeses} onChange={setGarantiaMeses} placeholder="2" type="number" />
              <FieldInput label="Día Límite de Pago" value={diaPago} onChange={setDiaPago} placeholder="5" type="number" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldInput label="Banco Receptor" value={bancoNombre} onChange={setBancoNombre} placeholder="BCP / BBVA / Interbank" />
              <FieldInput label="N° de Cuenta Bancaria" value={cuentaBancaria} onChange={setCuentaBancaria} placeholder="191-12345678-0-01" hint="Medio de pago bancarizado" />
              <FieldInput label="Código Interbancario (CCI)" value={cuentaCci} onChange={setCuentaCci} placeholder="002-191-001234567801-52" />
            </div>
          </div>

          {/* 5. Plazo, Fechas y Ciudad */}
          <div className="p-3.5 rounded-xl border space-y-3" style={{ background: '#141414', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400">5. Plazo, Vigencia y Ciudad</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput label="Plazo del Contrato" value={plazoTexto} onChange={setPlazoTexto} placeholder="un (01) año / diez (10) años" />
              <FieldInput label="Ciudad de Celebración" value={ciudadContrato} onChange={setCiudadContrato} placeholder="Trujillo / Lima" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldInput label="Fecha de Inicio" value={fechaInicio} onChange={setFechaInicio} type="date" />
              <FieldInput label="Fecha de Término" value={fechaFin} onChange={setFechaFin} type="date" />
            </div>
          </div>
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
        <div className="px-3 sm:px-6 py-2.5 border-b flex-shrink-0 overflow-x-auto scrollbar-thin" style={{ borderColor: '#262626' }}>
          <div className="flex gap-2 min-w-max pr-10 pb-0.5">
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
              className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6 flex flex-col items-center bg-[#2b2e35]"
              style={{ gap: 0 }}
            >
              {viewMode === 'sheet' ? (
                <div
                  className="bg-white rounded-sm w-full"
                  style={{
                    maxWidth: zoomLevel === 85 ? '560px' : zoomLevel === 115 ? '740px' : '640px',
                    boxSizing: 'border-box',
                    /* Margen visual limpio y equilibrado para pantalla (las medidas físicas cm rigen en la impresión/Word) */
                    padding: '36px 36px 48px 40px',
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
                    className="doc-preview-sheet w-full"
                    style={{
                      fontFamily: fmt.fontFamilyCss,
                      fontSize: `${fmt.fontSizePt}pt`,
                      lineHeight: `${fmt.lineHeight}`,
                      color: '#111111',
                      boxSizing: 'border-box',
                      maxWidth: '100%',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
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
          <div className="grid grid-cols-3 gap-0 border-t" style={{ borderColor: '#262626' }}>
            <button
              onClick={handleDownloadWord}
              className="flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-semibold border-r transition-all active:bg-white/5"
              style={{ borderColor: '#262626', color: '#60a5fa', background: 'rgba(96,165,250,0.06)' }}
            >
              {downloadedWord ? (
                <><Check size={14} className="text-blue-400" /><span>Word</span></>
              ) : (
                <><FileDown size={14} /><span>Word (.docx)</span></>
              )}
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-semibold border-r transition-all active:bg-white/5"
              style={{ borderColor: '#262626', color: '#f87171', background: 'rgba(248,113,113,0.06)' }}
            >
              {downloadedPdf ? (
                <><Check size={14} className="text-red-400" /><span>PDF</span></>
              ) : (
                <><Download size={14} /><span>PDF (.pdf)</span></>
              )}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-3.5 text-[11px] font-semibold transition-all active:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.70)', background: 'transparent' }}
            >
              {copied ? (
                <><Check size={14} className="text-green-400" /><span>Copiado</span></>
              ) : (
                <><Copy size={14} /><span>Copiar</span></>
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

            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium border transition-all"
              style={{ borderColor: 'rgba(248,113,113,0.30)', color: '#f87171', background: 'rgba(248,113,113,0.08)' }}
              title="Descargar directamente como documento PDF oficial A4 listo para Mesa de Partes Virtual"
            >
              {downloadedPdf ? (
                <><Check size={14} className="text-red-400" /><span>¡Descargado!</span></>
              ) : (
                <><Download size={14} /><span>PDF (.pdf)</span></>
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
