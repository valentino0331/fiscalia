import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  MessageSquare,
  Scale,
  Building2,
  FileCode2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'

export interface AnalysisResult {
  summary: string
  alertLevel: 'green' | 'yellow' | 'red'
  alertTitle: string
  expedienteNumber?: string | null
  authority?: string | null
  materia?: string
  deadlineText: string
  actionSteps: string[]
  recommendedAgentId: string
  recommendedAgentName: string
  extractedText?: string
  fileName?: string
  pageCount?: number | null
}

interface DocumentScannerModalProps {
  isOpen: boolean
  onClose: () => void
  currentAgentId?: string
  onApplyToChat?: (result: AnalysisResult, text: string) => void
}

export default function DocumentScannerModal({
  isOpen,
  onClose,
  currentAgentId,
  onApplyToChat,
}: DocumentScannerModalProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [inputText, setInputText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzingStep, setAnalyzingStep] = useState<string>('Iniciando...')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showOcrText, setShowOcrText] = useState(false)

  if (!isOpen) return null

  const handleFileUpload = async (file: File) => {
    setSelectedFile(file)
    setAnalyzing(true)
    setErrorMessage(null)
    setResult(null)
    setAnalyzingStep('1/3 Subiendo archivo y preparando lectura OCR...')

    try {
      setAnalyzingStep('2/3 Extrayendo sellos, resoluciones y considerandos...')
      const scannerRes = await api.files.analyzeScanner({ file })

      setAnalyzingStep('3/3 Sintetizando plazos procesales y estrategia legal...')
      setInputText(scannerRes.extractedText ? scannerRes.extractedText.slice(0, 3000) : '')
      setResult(scannerRes)
    } catch (err: any) {
      console.warn('[Scanner] analyzeScanner con archivo falló, intentando extracción base:', err);
      try {
        // Fallback: intentar extracción directa de texto
        setAnalyzingStep('Reintentando lectura digital con motor secundario...')
        const extractRes = await api.files.extract(file)
        const text = extractRes.text || ''
        if (text.trim().length > 20) {
          setInputText(text.slice(0, 3000))
          setAnalyzingStep('Analizando plazos y fundamentación jurídica...')
          const aiRes = await api.files.analyzeScanner({ text, fileName: file.name })
          setResult(aiRes)
        } else {
          throw new Error('No se pudo extraer texto legible del documento.')
        }
      } catch (fallbackErr: any) {
        setErrorMessage(
          err?.message ||
          fallbackErr?.message ||
          'No se pudo leer el expediente. Asegúrate de que sea un PDF o imagen nítida (.pdf, .jpg, .png) o pega el texto directamente.'
        )
      }
    } finally {
      setAnalyzing(false)
      setAnalyzingStep('')
    }
  }

  const handleTextAnalyze = async () => {
    if (!inputText.trim() || analyzing) return
    setAnalyzing(true)
    setErrorMessage(null)
    setResult(null)
    setAnalyzingStep('Analizando términos legales, plazos y fundamentación...')

    try {
      const scannerRes = await api.files.analyzeScanner({
        text: inputText.trim(),
        fileName: 'Texto digitado',
      })
      setResult(scannerRes)
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Error al analizar el texto procesal. Por favor verifica tu conexión o intenta nuevamente.'
      )
    } finally {
      setAnalyzing(false)
      setAnalyzingStep('')
    }
  }

  const handleCopySummary = async () => {
    if (!result) return
    const textToCopy = `TRADUCCIÓN DE EXPEDIENTE / DOCUMENTO LEGAL — HARDMAN
${result.alertTitle} (Nivel: ${result.alertLevel.toUpperCase()})
${result.expedienteNumber ? `Expediente / Carpeta: ${result.expedienteNumber}\n` : ''}${result.authority ? `Autoridad: ${result.authority}\n` : ''}${result.materia ? `Materia: ${result.materia}\n` : ''}
¿Qué significa este documento?:
${result.summary}

Fecha Límite y Plazo de Respuesta:
${result.deadlineText}

Pasos que debes seguir hoy mismo:
${result.actionSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Especialista legal recomendado: ${result.recommendedAgentName}`

    await navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleConsultSpecialist = () => {
    if (!result) return

    const summaryContext = `[EXPEDIENTE ESCANEADO: "${result.alertTitle}"]
${result.expedienteNumber ? `Número de Expediente: ${result.expedienteNumber}\n` : ''}${result.authority ? `Autoridad / Juzgado / Fiscalía: ${result.authority}\n` : ''}${result.materia ? `Materia: ${result.materia}\n` : ''}Plazo identificado: ${result.deadlineText}

Resumen del documento:
${result.summary}

--- FRAGMENTO TRANSCRITO DEL DOCUMENTO ---
${(result.extractedText || inputText).slice(0, 3500)}
--- FIN DEL FRAGMENTO ---`

    const userPrompt = `Hola ${result.recommendedAgentName.split(' ')[0]}, acabo de escanear la resolución sobre "${result.alertTitle}"${result.expedienteNumber ? ` (${result.expedienteNumber})` : ''}. ¿Cómo me aconsejas proceder hoy mismo paso a paso frente a este plazo procesal?`

    if (onApplyToChat) {
      onApplyToChat(result, summaryContext)
      onClose()
      return
    }

    onClose()
    navigate(`/chat/${result.recommendedAgentId}`, {
      state: {
        transferMessage: `${summaryContext}\n\n${userPrompt}`,
        scannedExpediente: {
          title: result.alertTitle,
          expedienteNumber: result.expedienteNumber,
          authority: result.authority,
          deadlineText: result.deadlineText,
          extractedText: result.extractedText || inputText,
        },
      },
    })
  }

  const handleConsultCurrentChat = () => {
    if (!result || !currentAgentId) return

    const summaryContext = `[EXPEDIENTE ESCANEADO: "${result.alertTitle}"]
${result.expedienteNumber ? `Número de Expediente: ${result.expedienteNumber}\n` : ''}${result.authority ? `Autoridad: ${result.authority}\n` : ''}Plazo: ${result.deadlineText}

Resumen del documento:
${result.summary}

--- CONTENIDO EXTRAÍDO DEL EXPEDIENTE ---
${(result.extractedText || inputText).slice(0, 3500)}
--- FIN DEL EXPEDIENTE ---`

    if (onApplyToChat) {
      onApplyToChat(result, summaryContext)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto"
        style={{
          background: '#141414',
          border: '1px solid #2b2b2b',
          boxShadow: '0 25px 60px rgba(0,0,0,0.90)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                Escaneador de Expedientes & Cédulas
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25">
                  OCR IA 2026
                </span>
              </h3>
              <p className="text-[11px] text-white/50">
                Sube una foto o PDF de tu expediente, disposición fiscal, notificación judicial o carta notarial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-2.5 text-xs text-red-200">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span className="font-semibold text-white">No se pudo procesar: </span>
              {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-white/40 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        )}

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
              onClick={() => !analyzing && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                analyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#c9a84c]/60 hover:bg-[#c9a84c]/5'
              }`}
              style={{ borderColor: 'rgba(255,255,255,0.15)' }}
            >
              <div
                className="w-11 h-11 rounded-full mx-auto flex items-center justify-center mb-2.5"
                style={{ background: 'rgba(201,168,76,0.12)', color: '#c9a84c' }}
              >
                {analyzing ? (
                  <Loader2 size={20} className="animate-spin text-[#c9a84c]" />
                ) : (
                  <Upload size={20} />
                )}
              </div>
              <p className="text-xs font-semibold text-white">
                {analyzing
                  ? analyzingStep
                  : selectedFile
                  ? selectedFile.name
                  : 'Haz clic aquí para subir tu Expediente, Resolución o Notificación'}
              </p>
              <p className="text-[11px] text-white/45 mt-1 max-w-md mx-auto">
                Acepta expedientes completos en PDF (incluso escaneados o fotocopiados), fotos nítidas con celular (JPG, PNG) o escritos en Word (.docx).
              </p>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-semibold text-white/50 mb-1.5 tracking-wider">
                O escribe / pega el texto de la cédula o escrito aquí:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Pega aquí el contenido: 'Notifícase con la resolución N° 01 al demandado bajo apercibimiento de ley en el plazo de 5 días hábiles...'"
                rows={4}
                disabled={analyzing}
                className="w-full bg-[#111111] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-[#c9a84c] resize-none placeholder:text-white/30"
              />
            </div>

            <button
              onClick={handleTextAnalyze}
              disabled={!inputText.trim() || analyzing}
              className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
              style={{
                background: inputText.trim() && !analyzing ? '#c9a84c' : 'rgba(255,255,255,0.08)',
                color: inputText.trim() && !analyzing ? '#111111' : 'rgba(255,255,255,0.30)',
                cursor: inputText.trim() && !analyzing ? 'pointer' : 'not-allowed',
              }}
            >
              {analyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{analyzingStep || 'Analizando expediente y plazos con IA...'}</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Escanear y Traducir Expediente</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Results Screen */}
        {result && (
          <div className="space-y-4">
            {/* Alert Level Badge & Title */}
            <div
              className="p-4 rounded-xl border flex items-start gap-3.5"
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
              <div className="mt-0.5 flex-shrink-0">
                {result.alertLevel === 'red' ? (
                  <ShieldAlert size={22} className="text-red-400" />
                ) : result.alertLevel === 'yellow' ? (
                  <AlertTriangle size={22} className="text-amber-400" />
                ) : (
                  <ShieldCheck size={22} className="text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white leading-snug">{result.alertTitle}</h4>
                  <span
                    className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider flex-shrink-0"
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
                      ? 'Nivel Rojo: Urgente / Apercibimiento'
                      : result.alertLevel === 'yellow'
                      ? 'Nivel Amarillo: Plazo Procesal en Curso'
                      : 'Nivel Verde: Informativo'}
                  </span>
                </div>

                {/* Badges bar: Expediente, Autoridad, Materia */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {result.expedienteNumber && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/10 flex items-center gap-1">
                      <FileText size={11} className="text-[#c9a84c]" />
                      <span>{result.expedienteNumber}</span>
                    </span>
                  )}
                  {result.authority && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/10 flex items-center gap-1">
                      <Building2 size={11} className="text-[#34d17a]" />
                      <span className="truncate max-w-[220px]">{result.authority}</span>
                    </span>
                  )}
                  {result.materia && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/10 flex items-center gap-1">
                      <Scale size={11} className="text-[#f59e0b]" />
                      <span>{result.materia}</span>
                    </span>
                  )}
                </div>

                <p className="text-xs text-white/70 mt-2.5 leading-relaxed font-light">{result.summary}</p>
              </div>
            </div>

            {/* Deadline Block */}
            <div
              className="p-3.5 rounded-xl border flex items-start gap-2.5"
              style={{ background: '#191919', borderColor: 'rgba(201,168,76,0.30)' }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/15 text-[#c9a84c] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c] block">
                  Fecha Límite y Plazo Perentorio
                </span>
                <p className="text-xs font-semibold text-white mt-0.5 leading-snug">{result.deadlineText}</p>
              </div>
            </div>

            {/* Action Steps */}
            <div
              className="p-4 rounded-xl border"
              style={{ background: '#111111', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-2 mb-3 text-white/80">
                <FileText size={14} className="text-[#c9a84c]" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  ¿Qué tienes que hacer hoy mismo? (Plan Paso a Paso)
                </span>
              </div>
              <div className="space-y-2">
                {result.actionSteps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                      style={{ background: 'rgba(201,168,76,0.18)', color: '#c9a84c' }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-white/85 font-light leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* OCR Extracted Text Accordion */}
            {result.extractedText && (
              <div className="rounded-xl border border-white/10 bg-[#161616] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOcrText(!showOcrText)}
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-medium text-white/70 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileCode2 size={13} className="text-[#c9a84c]" />
                    <span>Texto transcrito íntegro por OCR ({result.extractedText.length.toLocaleString()} caracteres)</span>
                  </span>
                  {showOcrText ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                <AnimatePresence>
                  {showOcrText && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-3.5 pb-3.5"
                    >
                      <pre className="text-[11px] font-mono text-white/60 bg-[#0d0d0d] p-3 rounded-lg border border-white/5 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                        {result.extractedText}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setResult(null)
                    setSelectedFile(null)
                    setInputText('')
                    setShowOcrText(false)
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light border border-white/15 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <RefreshCw size={12} />
                  <span>Escanear otro</span>
                </button>
                <button
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light border border-white/15 text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado' : 'Copiar Resumen'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onApplyToChat && currentAgentId && (
                  <button
                    onClick={handleConsultCurrentChat}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-[#c9a84c]/40 text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-all"
                  >
                    <span>Adjuntar a esta consulta</span>
                  </button>
                )}
                <button
                  onClick={handleConsultSpecialist}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg"
                  style={{ background: '#c9a84c', color: '#111111' }}
                >
                  <MessageSquare size={13} />
                  <span>Consultar con {result.recommendedAgentName.split(' ')[0]}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
