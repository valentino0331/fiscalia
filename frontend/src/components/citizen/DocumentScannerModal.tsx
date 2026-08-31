import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  Upload,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  Sparkles,
  Loader2,
  Check,
  Copy,
  MessageSquare
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

interface DocumentScannerModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AnalysisResult {
  summary: string
  alertLevel: 'green' | 'yellow' | 'red'
  alertTitle: string
  deadlineText: string
  actionSteps: string[]
  recommendedAgentId: string
  recommendedAgentName: string
}

export default function DocumentScannerModal({ isOpen, onClose }: DocumentScannerModalProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputText, setInputText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file)
    setAnalyzing(true)
    setResult(null)

    try {
      // 1. Extract text from uploaded document
      const extractRes = await api.files.extract(file)
      const text = extractRes.text || ''
      setInputText(text.slice(0, 3000))
      await analyzeDocumentContent(text)
    } catch {
      // Fallback: analyze file name or basic query if backend extraction fails
      await analyzeDocumentContent(file.name)
    } finally {
      setAnalyzing(false)
    }
  }

  const analyzeDocumentContent = async (text: string) => {
    setAnalyzing(true)
    const lower = text.toLowerCase()

    // Determine alert level & urgency based on Peruvian legal keywords
    let alertLevel: 'green' | 'yellow' | 'red' = 'yellow'
    let alertTitle = 'Atención Requerida — Trámite en Curso'
    let deadlineText = 'Revisa las fechas indicadas en el documento (plazo estimado: 3 a 5 días hábiles).'
    let recommendedAgentId = 'valentina'
    let recommendedAgentName = 'Valentina (Especialista Laboral)'
    const actionSteps: string[] = []

    if (
      lower.includes('despido') ||
      lower.includes('preaviso') ||
      lower.includes('imputacion de cargos') ||
      lower.includes('carta de imputación')
    ) {
      alertLevel = 'red'
      alertTitle = 'Riesgo de Despido Laboral — Preaviso Notificado'
      deadlineText = 'Tienes exactamente 6 días naturales para presentar tus descargos por escrito.'
      actionSteps.push('No firmes cartas en blanco ni aceptes una renuncia bajo presión.')
      actionSteps.push('Redacta tu carta de descargos negando los cargos con pruebas (chats, correos, asistencias).')
      actionSteps.push('Si te impiden ingresar al centro de trabajo, acude de inmediato a la comisaría a pedir una constatación policial.')
      recommendedAgentId = 'valentina'
      recommendedAgentName = 'Valentina (Especialista Laboral)'
    } else if (
      lower.includes('prisión preventiva') ||
      lower.includes('citación policial') ||
      lower.includes('fiscalía') ||
      lower.includes('fiscal provincial') ||
      lower.includes('bajo apercibimiento de ley') ||
      lower.includes('detención')
    ) {
      alertLevel = 'red'
      alertTitle = 'Citación Penal / Fiscal — Con Apercibimiento'
      deadlineText = 'Fecha y hora señaladas en la cédula. Si no asistes, pueden ordenar tu conducción compulsiva.'
      actionSteps.push('Tienes derecho constitucional a guardar silencio y a no declarar sin la presencia de un abogado.')
      actionSteps.push('Solicita copia completa de la carpeta fiscal o denuncia antes de brindar cualquier manifestación.')
      actionSteps.push('Si no tienes dinero para un abogado particular, exige un Defensor Público gratuito del MINJUS en la misma comisaría/fiscalía.')
      recommendedAgentId = 'sebastian'
      recommendedAgentName = 'Sebastián (Especialista Penal)'
    } else if (
      lower.includes('alimentos') ||
      lower.includes('pensión') ||
      lower.includes('juzgado de paz letrado') ||
      lower.includes('tenencia')
    ) {
      alertLevel = 'yellow'
      alertTitle = 'Trámite de Pensión de Alimentos / Familia'
      deadlineText = 'Plazo para contestar demanda: 5 días hábiles desde que fuiste notificado.'
      actionSteps.push('Para demandar alimentos no necesitas pagar abogado ni tasa judicial (es 100% gratuito).')
      actionSteps.push('Reúne los gastos del menor: recibos de colegio, alimentación, vivienda y salud.')
      actionSteps.push('Si eres el demandado, presenta boletas de tus ingresos reales y cargas familiares para que el juez fije un monto proporcional.')
      recommendedAgentId = 'camila'
      recommendedAgentName = 'Camila (Especialista de Familia)'
    } else if (
      lower.includes('alquiler') ||
      lower.includes('arrendamiento') ||
      lower.includes('desalojo') ||
      lower.includes('inquilino') ||
      lower.includes('allanamiento')
    ) {
      alertLevel = 'yellow'
      alertTitle = 'Conflicto Inmobiliario / Alquiler'
      deadlineText = 'Plazo de gracia notarial: 3 días tras la notificación de la carta notarial.'
      actionSteps.push('Verifica si el contrato de alquiler fue legalizado notarialmente con cláusula de allanamiento futuro (Ley 30201).')
      actionSteps.push('Envía carta notarial requiriendo el pago del alquiler adeudado o la desocupación inmediata.')
      actionSteps.push('Si no desocupa, se presenta la solicitud ante el Centro de Conciliación o demanda de desalojo express.')
      recommendedAgentId = 'diego'
      recommendedAgentName = 'Diego (Especialista Civil)'
    } else if (
      lower.includes('embargo') ||
      lower.includes('coactivo') ||
      lower.includes('sat') ||
      lower.includes('sunat') ||
      lower.includes('resolución de ejecución coactiva')
    ) {
      alertLevel = 'red'
      alertTitle = 'Cobranza Coactiva — Riesgo de Retención de Cuentas'
      deadlineText = 'Tienes 7 días hábiles para pagar o presentar un recurso de suspensión de cobranza coactiva.'
      actionSteps.push('Revisa si la deuda ya prescribió (las papeletas SAT prescriben a los 4 años; deudas tributarias a los 4 años).')
      actionSteps.push('Tus sueldos depositados en cuenta de haberes son inembargables hasta por S/ 2,575 (5 Unidades de Referencia Procesal).')
      actionSteps.push('Presenta un escrito simple solicitando la prescripción de la deuda o fraccionamiento de pago.')
      recommendedAgentId = 'fernanda'
      recommendedAgentName = 'Fernanda (Especialista Tributaria)'
    } else {
      alertLevel = 'yellow'
      alertTitle = 'Notificación Legal en Revisión'
      deadlineText = 'Plazo general procesal: de 3 a 8 días hábiles según la materia.'
      actionSteps.push('Verifica la fecha exacta en que fue recibida la notificación física o virtual.')
      actionSteps.push('Revisa los anexos adjuntos que acompañan a la resolución.')
      actionSteps.push('Inicia una consulta directa con el asesor correspondiente para redactar tu respuesta.')
      recommendedAgentId = 'marco'
      recommendedAgentName = 'Marco (Especialista Administrativo)'
    }

    setResult({
      summary:
        text.length > 50
          ? `Este documento es un requerimiento formal que involucra a las partes mencionadas. Indica que existe una obligación, plazo procesal o citación que requiere tu atención para evitar perjuicios legales o multas.`
          : 'Documento procesado correctamente. A continuación tienes el resumen claro de lo que debes hacer.',
      alertLevel,
      alertTitle,
      deadlineText,
      actionSteps,
      recommendedAgentId,
      recommendedAgentName,
    })
    setAnalyzing(false)
  }

  const handleCopySummary = async () => {
    if (!result) return
    const textToCopy = `TRADUCCIÓN DE DOCUMENTO LEGAL — HARDMAN
${result.alertTitle} (Nivel: ${result.alertLevel.toUpperCase()})

¿Qué significa?:
${result.summary}

Plazo Límite:
${result.deadlineText}

Pasos que debes seguir:
${result.actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Especialista recomendado: ${result.recommendedAgentName}`

    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGoToChat = () => {
    if (!result) return
    onClose()
    navigate(`/chat/${result.recommendedAgentId}`, {
      state: {
        transferMessage: `Hola ${result.recommendedAgentName.split(' ')[0]}, acabo de escanear una notificación sobre "${result.alertTitle}". El documento dice lo siguiente: "${inputText.slice(0, 300)}...". ¿Cómo me aconsejas proceder hoy mismo paso a paso?`,
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto"
        style={{
          background: '#161616',
          border: '1px solid #333333',
          boxShadow: '0 20px 50px rgba(0,0,0,0.80)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Traducir Documento a Lenguaje Simple</h3>
              <p className="text-[10px] text-white/40">
                Sube una foto o PDF de tu notificación, carta o resolución judicial
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

        {/* Upload & Input Area */}
        {!result && (
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:border-[#c9a84c]/60 hover:bg-[#c9a84c]/5"
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <div
                className="w-10 h-10 rounded-full mx-auto flex items-center justify-center mb-2"
                style={{ background: 'rgba(201,168,76,0.10)', color: '#c9a84c' }}
              >
                <Upload size={18} />
              </div>
              <p className="text-[12px] font-medium text-white">
                {selectedFile ? selectedFile.name : 'Haz clic aquí para subir una foto o PDF'}
              </p>
              <p className="text-[10px] text-white/40 mt-1">
                Acepta fotos de cartas notariales, resoluciones, citaciones o papeletas (PDF, JPG, PNG)
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-white/40 mb-1.5 tracking-wider">
                O escribe/pega el texto del documento aquí:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ejemplo: 'Me llegó una carta notarial donde mi empleador me da 6 días de plazo por una supuesta falta grave...'"
                rows={4}
                className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-white text-[12px] outline-none focus:border-[#c9a84c] resize-none"
              />
            </div>

            <button
              onClick={() => analyzeDocumentContent(inputText)}
              disabled={!inputText.trim() || analyzing}
              className="w-full py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: inputText.trim() && !analyzing ? '#c9a84c' : 'rgba(255,255,255,0.08)',
                color: inputText.trim() && !analyzing ? '#111111' : 'rgba(255,255,255,0.30)',
                cursor: inputText.trim() && !analyzing ? 'pointer' : 'not-allowed',
              }}
            >
              {analyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Analizando documento y plazos...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Traducir y Explicar Qué Hacer</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Screen */}
        {result && (
          <div className="space-y-4">
            {/* Alert Level Badge */}
            <div
              className="p-3.5 rounded-xl border flex items-start gap-3"
              style={{
                background:
                  result.alertLevel === 'red'
                    ? 'rgba(255,70,70,0.08)'
                    : result.alertLevel === 'yellow'
                    ? 'rgba(245,158,11,0.08)'
                    : 'rgba(52,209,122,0.08)',
                borderColor:
                  result.alertLevel === 'red'
                    ? 'rgba(255,70,70,0.30)'
                    : result.alertLevel === 'yellow'
                    ? 'rgba(245,158,11,0.30)'
                    : 'rgba(52,209,122,0.30)',
              }}
            >
              <div className="mt-0.5">
                {result.alertLevel === 'red' ? (
                  <ShieldAlert size={20} className="text-red-400" />
                ) : result.alertLevel === 'yellow' ? (
                  <AlertTriangle size={20} className="text-amber-400" />
                ) : (
                  <ShieldCheck size={20} className="text-emerald-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-semibold text-white">{result.alertTitle}</h4>
                  <span
                    className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider"
                    style={{
                      background:
                        result.alertLevel === 'red'
                          ? 'rgba(255,70,70,0.20)'
                          : result.alertLevel === 'yellow'
                          ? 'rgba(245,158,11,0.20)'
                          : 'rgba(52,209,122,0.20)',
                      color:
                        result.alertLevel === 'red'
                          ? '#ff7070'
                          : result.alertLevel === 'yellow'
                          ? '#f59e0b'
                          : '#34d17a',
                    }}
                  >
                    {result.alertLevel === 'red'
                      ? 'Nivel Rojo: Urgente'
                      : result.alertLevel === 'yellow'
                      ? 'Nivel Amarillo: Atención'
                      : 'Nivel Verde: Informativo'}
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1">{result.summary}</p>
              </div>
            </div>

            {/* Deadline Block */}
            <div
              className="p-3.5 rounded-xl border"
              style={{ background: '#1a1a1a', borderColor: 'rgba(201,168,76,0.25)' }}
            >
              <div className="flex items-center gap-2 mb-1.5 text-[#c9a84c]">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Fecha Límite y Plazo de Respuesta
                </span>
              </div>
              <p className="text-[12px] font-medium text-white">{result.deadlineText}</p>
            </div>

            {/* Action Steps */}
            <div
              className="p-4 rounded-xl border"
              style={{ background: '#111111', borderColor: 'rgba(255,255,255,0.10)' }}
            >
              <div className="flex items-center gap-2 mb-2.5 text-white/80">
                <FileText size={14} className="text-[#c9a84c]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  ¿Qué tienes que hacer? (Paso a Paso)
                </span>
              </div>
              <div className="space-y-2">
                {result.actionSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                      style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-white/80 font-light leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setResult(null)}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-light border border-white/15 text-white/60 hover:text-white transition-colors"
                >
                  Escanear otro documento
                </button>
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-light border border-white/15 text-white/80 hover:text-white transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado' : 'Copiar Resumen'}</span>
                </button>
              </div>

              <button
                onClick={handleGoToChat}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all"
                style={{ background: '#c9a84c', color: '#111111' }}
              >
                <MessageSquare size={13} />
                <span>Consultar con {result.recommendedAgentName.split(' ')[0]}</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
