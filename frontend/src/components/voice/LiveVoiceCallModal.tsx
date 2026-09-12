import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageSquare,
  Sparkles,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { getAgent } from '@/lib/agents'
import type { Message } from '@/types'

interface LiveVoiceCallModalProps {
  isOpen: boolean
  onClose: () => void
  agent: NonNullable<ReturnType<typeof getAgent>>
  conversationId: string | null
  onSaveVoiceTurn: (userText: string, assistantText: string) => void
}

type CallStatus = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'muted'

export default function LiveVoiceCallModal({
  isOpen,
  onClose,
  agent,
  conversationId,
  onSaveVoiceTurn,
}: LiveVoiceCallModalProps) {
  const [status, setStatus] = useState<CallStatus>('connecting')
  const [callDuration, setCallDuration] = useState(0)
  const [userLiveTranscript, setUserLiveTranscript] = useState('')
  const [lastAssistantText, setLastAssistantText] = useState('')
  const [isMuted, setIsMuted] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [showSubtitles, setShowSubtitles] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const recognitionRef = useRef<any>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  const conversationHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([])
  const isComponentMounted = useRef(true)
  const currentConvIdRef = useRef<string | null>(conversationId || null)

  // Sync currentConvIdRef when conversationId or isOpen changes
  useEffect(() => {
    currentConvIdRef.current = conversationId || null
  }, [conversationId, isOpen])

  // Initialize Speech Recognition
  useEffect(() => {
    isComponentMounted.current = true
    if (!isOpen) {
      cleanupCall()
      return
    }

    setCallDuration(0)
    setErrorMessage(null)
    setUserLiveTranscript('')
    setLastAssistantText('')
    conversationHistoryRef.current = []

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage(
        'Tu navegador no soporta reconocimiento de voz en vivo. Te recomendamos usar Google Chrome, Microsoft Edge o Safari.'
      )
      setStatus('listening')
      return
    }

    try {
      const rec = new SpeechRecognition()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = 'es-PE'

      rec.onstart = () => {
        setErrorMessage(null)
      }

      rec.onresult = (event: any) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const fullText = (finalTranscript + ' ' + interimTranscript).trim()
        if (fullText) {
          setUserLiveTranscript(fullText)

          // Reset silence timer for automatic voice activity detection
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
          silenceTimerRef.current = setTimeout(() => {
            if (fullText.trim().length > 2) {
              handleUserSpoke(fullText)
            }
          }, 1100)
        }
      }

      rec.onerror = (e: any) => {
        console.warn('SpeechRecognition error:', e.error)
        const isAppleDevice = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
        if (e.error === 'not-allowed') {
          if (isAppleDevice) {
            setErrorMessage('Micrófono bloqueado en iOS/Safari. Ve a Ajustes > Safari > Micrófono > Permitir, o toca el icono de ajustes en la barra.')
          } else {
            setErrorMessage('Acceso al micrófono denegado. Haz clic en el ícono de candado en tu navegador para permitir el micrófono.')
          }
        } else if (e.error === 'no-speech') {
          // No speech detected, silently keep listening
        }
      }

      rec.onend = () => {
        // Auto-restart if call is still active
        if (isComponentMounted.current && isOpen && !isMuted) {
          // Restart recognition if status is listening or connecting
          try {
            rec.start()
          } catch {
            // Already started or restarting
          }
        }
      }

      recognitionRef.current = rec

      // Request browser audio permission if needed and start recognition
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then((stream) => {
            // Keep permission active and release stream
            stream.getTracks().forEach(track => track.stop())
          })
          .catch(() => {
            const isAppleDevice = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))
            if (isAppleDevice) {
              setErrorMessage('Se requiere acceso al micrófono. En iPhone/iPad activa: Ajustes > Safari > Micrófono > Permitir.')
            } else {
              setErrorMessage('Por favor concede permiso de micrófono en tu navegador para hablar.')
            }
          })
      }

      // Simulate connection tone and play greeting
      const connectTimer = setTimeout(() => {
        playWelcomeGreeting()
      }, 700)

      return () => {
        clearTimeout(connectTimer)
        cleanupCall()
      }
    } catch (err) {
      console.error('Recognition init failed:', err)
      setStatus('listening')
    }
  }, [isOpen])

  // Call timer ticker
  useEffect(() => {
    if (!isOpen) return
    const timer = setInterval(() => {
      setCallDuration((d) => d + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [isOpen])

  const cleanupCall = () => {
    isComponentMounted.current = false
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
      recognitionRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current)
      currentAudioUrlRef.current = null
    }
  }

  const startListening = () => {
    if (isMuted) return
    setStatus('listening')
    setUserLiveTranscript('')
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch {
        // Already running
      }
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return
    try {
      recognitionRef.current.stop()
    } catch {
      // ignore
    }
  }

  // Play Lawyer initial voice greeting when call starts
  const playWelcomeGreeting = async () => {
    setStatus('speaking')
    const agentRoleClean = agent.role.replace(/^Especialista en\s+/i, '')
    const isMale = ['sebastian', 'diego', 'rodrigo', 'marco'].includes(agent.id)
    const titlePrefix = isMale ? 'el abogado' : 'la abogada'
    const welcome = `Estimado usuario, le saluda ${titlePrefix} ${agent.name}, especialista en ${agentRoleClean} del bufete Hardman. Le escucho atentamente, ¿cuál es su consulta o patrocinio legal a evaluar?`
    setLastAssistantText(welcome)
    conversationHistoryRef.current.push({ role: 'assistant', content: welcome })

    await playAssistantSpeech(welcome)
  }

  // Process user speech and send to lawyer backend
  const handleUserSpoke = async (spokenText: string) => {
    if (!spokenText.trim() || status === 'thinking') return

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    stopListening()
    setStatus('thinking')

    const userText = spokenText.trim()
    conversationHistoryRef.current.push({ role: 'user', content: userText })

    try {
      const now = new Date().toISOString()
      const messagesPayload = [
        ...conversationHistoryRef.current.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: now,
        })),
      ]

      const res = await api.chat.send({
        agentId: agent.id,
        messages: messagesPayload,
        conversationId: currentConvIdRef.current || undefined,
      })

      if (res?.conversationId && !currentConvIdRef.current) {
        currentConvIdRef.current = res.conversationId
      }

      const assistantReply = typeof res.message === 'string' ? res.message : (res.message as any)?.content || 'Comprendo la situación fáctica planteada. Permítame exponerle el análisis de fondo y la vía procesal correspondiente.'
      conversationHistoryRef.current.push({ role: 'assistant', content: assistantReply })
      setLastAssistantText(assistantReply)

      // Notify parent to save in chat transcript
      onSaveVoiceTurn(userText, assistantReply)

      // Synthesize and speak response
      await playAssistantSpeech(assistantReply)
    } catch (err: any) {
      console.error('Call AI error:', err)
      const fallbackReply = 'He tomado nota de los antecedentes expuestos. Por favor, reitéreme el punto medular para brindarle la precisión normativa exacta.'
      setLastAssistantText(fallbackReply)
      await playAssistantSpeech(fallbackReply)
    }
  }

  // Synthesize neural speech and play aloud
  const playAssistantSpeech = async (text: string) => {
    setStatus('speaking')
    setUserLiveTranscript('')

    try {
      // Clean markdown tags for natural speech
      const cleanText = text
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/[>#*_~|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const audioBlob = await api.chat.tts({ text: cleanText, agentId: agent.id })

      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
      }

      const audioUrl = URL.createObjectURL(audioBlob)
      currentAudioUrlRef.current = audioUrl

      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.muted = isAudioMuted

      audio.onended = () => {
        if (!isComponentMounted.current) return
        startListening()
      }

      audio.onerror = () => {
        if (!isComponentMounted.current) return
        startListening()
      }

      await audio.play()
    } catch (error) {
      console.error('Voice playback error:', error)
      // If TTS fails, wait a short moment and resume listening
      setTimeout(() => {
        if (isComponentMounted.current) startListening()
      }, 2000)
    }
  }

  const toggleMuteMic = () => {
    if (isMuted) {
      setIsMuted(false)
      startListening()
    } else {
      setIsMuted(true)
      stopListening()
      setStatus('muted')
    }
  }

  const toggleMuteSpeaker = () => {
    const next = !isAudioMuted
    setIsAudioMuted(next)
    if (audioRef.current) {
      audioRef.current.muted = next
    }
  }

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      >
        {/* Background Ambient Glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            background:
              status === 'speaking'
                ? 'radial-gradient(circle at 50% 40%, rgba(201,168,76,0.35) 0%, transparent 65%)'
                : status === 'listening'
                ? 'radial-gradient(circle at 50% 40%, rgba(52,209,122,0.30) 0%, transparent 65%)'
                : 'radial-gradient(circle at 50% 40%, rgba(96,165,250,0.25) 0%, transparent 65%)',
          }}
        />

        <div
          className="relative w-full max-w-lg rounded-3xl overflow-hidden flex flex-col items-center justify-between p-6 sm:p-8 min-h-[580px] shadow-2xl border"
          style={{
            background: 'linear-gradient(180deg, #16181e 0%, #0d0e12 100%)',
            borderColor: 'rgba(255,255,255,0.10)',
          }}
        >
          {/* Header Bar */}
          <div className="w-full flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#c9a84c]">
                Consulta por Voz en Vivo
              </span>
            </div>
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 font-mono text-[11px]">
              {formatDuration(callDuration)}
            </div>
          </div>

          {/* Center: Animated Lawyer Avatar & Sound Wave Ripples */}
          <div className="relative flex flex-col items-center justify-center my-auto py-6 z-10">
            {/* Pulsing Ripple Rings when speaking or listening */}
            {(status === 'speaking' || status === 'listening') && (
              <>
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.6 }}
                  animate={{ scale: [1, 1.4, 1.6], opacity: [0.6, 0.2, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute w-44 h-44 rounded-full"
                  style={{
                    background:
                      status === 'speaking'
                        ? 'radial-gradient(circle, rgba(201,168,76,0.35) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(52,209,122,0.35) 0%, transparent 70%)',
                  }}
                />
                <motion.div
                  initial={{ scale: 0.9, opacity: 0.7 }}
                  animate={{ scale: [1, 1.25, 1.4], opacity: [0.7, 0.3, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                  className="absolute w-44 h-44 rounded-full"
                  style={{
                    background:
                      status === 'speaking'
                        ? 'radial-gradient(circle, rgba(201,168,76,0.4) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(52,209,122,0.4) 0%, transparent 70%)',
                  }}
                />
              </>
            )}

            {/* Avatar */}
            <div
              className="w-36 h-36 sm:w-40 sm:h-40 rounded-full overflow-hidden relative shadow-2xl transition-all duration-500"
              style={{
                border:
                  status === 'speaking'
                    ? '3px solid #c9a84c'
                    : status === 'listening'
                    ? '3px solid #34d17a'
                    : status === 'thinking'
                    ? '3px solid #60a5fa'
                    : '3px solid rgba(255,255,255,0.2)',
                boxShadow:
                  status === 'speaking'
                    ? '0 0 35px rgba(201,168,76,0.45)'
                    : status === 'listening'
                    ? '0 0 35px rgba(52,209,122,0.40)'
                    : '0 0 20px rgba(0,0,0,0.5)',
              }}
            >
              <img
                src={agent.image}
                alt={agent.name}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* Lawyer Name & Status Pill */}
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-white tracking-wide">{agent.name}</h3>
              <p className="text-[11px] text-[#c9a84c] font-light mb-3">{agent.role}</p>

              {/* Status Indicator */}
              <div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-medium transition-all"
                style={{
                  background:
                    status === 'speaking'
                      ? 'rgba(201,168,76,0.15)'
                      : status === 'listening'
                      ? 'rgba(52,209,122,0.15)'
                      : status === 'thinking'
                      ? 'rgba(96,165,250,0.15)'
                      : 'rgba(255,255,255,0.08)',
                  border:
                    status === 'speaking'
                      ? '1px solid rgba(201,168,76,0.35)'
                      : status === 'listening'
                      ? '1px solid rgba(52,209,122,0.35)'
                      : status === 'thinking'
                      ? '1px solid rgba(96,165,250,0.35)'
                      : '1px solid rgba(255,255,255,0.15)',
                  color:
                    status === 'speaking'
                      ? '#c9a84c'
                      : status === 'listening'
                      ? '#34d17a'
                      : status === 'thinking'
                      ? '#93c5fd'
                      : 'rgba(255,255,255,0.6)',
                }}
              >
                {status === 'speaking' && (
                  <>
                    <div className="flex items-end gap-0.5 h-3">
                      <span className="w-0.5 bg-[#c9a84c] rounded-full wave-bar" style={{ animationDelay: '0s' }} />
                      <span className="w-0.5 bg-[#c9a84c] rounded-full wave-bar" style={{ animationDelay: '0.2s' }} />
                      <span className="w-0.5 bg-[#c9a84c] rounded-full wave-bar" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span>{agent.name} está hablando...</span>
                  </>
                )}

                {status === 'listening' && (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Te escucho... habla libremente</span>
                  </>
                )}

                {status === 'thinking' && (
                  <>
                    <RefreshCw size={12} className="animate-spin text-blue-400" />
                    <span>Analizando caso legal...</span>
                  </>
                )}

                {status === 'muted' && <span>Micrófono en silencio</span>}
                {status === 'connecting' && <span>Conectando voz encriptada...</span>}
              </div>
            </div>
          </div>

          {/* Live Subtitles & Transcript Box */}
          {showSubtitles && (
            <div
              className="w-full p-3.5 rounded-2xl border text-center mb-6 max-h-28 overflow-y-auto z-10 transition-all"
              style={{
                background: 'rgba(0,0,0,0.40)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              {errorMessage ? (
                <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-light">
                  <AlertTriangle size={14} />
                  <span>{errorMessage}</span>
                </div>
              ) : userLiveTranscript ? (
                <p className="text-xs text-white/90 font-light italic">
                  "{userLiveTranscript}"
                </p>
              ) : lastAssistantText ? (
                <p className="text-xs text-white/70 font-light line-clamp-3">
                  {lastAssistantText}
                </p>
              ) : (
                <p className="text-[11px] text-white/30 font-light">
                  Habla por tu micrófono para consultar con tu abogado...
                </p>
              )}
            </div>
          )}

          {/* Action Control Buttons Bar */}
          <div className="w-full flex items-center justify-center gap-4 sm:gap-6 z-10">
            {/* Mute Mic */}
            <button
              onClick={toggleMuteMic}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all border"
              style={{
                background: isMuted ? 'rgba(255,100,100,0.2)' : 'rgba(255,255,255,0.08)',
                borderColor: isMuted ? 'rgba(255,100,100,0.4)' : 'rgba(255,255,255,0.15)',
                color: isMuted ? '#ff6464' : '#ffffff',
              }}
              title={isMuted ? 'Activar micrófono' : 'Silenciar micrófono'}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Speaker Sound */}
            <button
              onClick={toggleMuteSpeaker}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all border"
              style={{
                background: isAudioMuted ? 'rgba(255,100,100,0.2)' : 'rgba(255,255,255,0.08)',
                borderColor: isAudioMuted ? 'rgba(255,100,100,0.4)' : 'rgba(255,255,255,0.15)',
                color: isAudioMuted ? '#ff6464' : '#ffffff',
              }}
              title={isAudioMuted ? 'Activar audio' : 'Silenciar audio del asesor'}
            >
              {isAudioMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {/* Subtitles Toggle */}
            <button
              onClick={() => setShowSubtitles(!showSubtitles)}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all border"
              style={{
                background: showSubtitles ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.08)',
                borderColor: showSubtitles ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.15)',
                color: showSubtitles ? '#c9a84c' : 'rgba(255,255,255,0.6)',
              }}
              title="Mostrar u ocultar subtítulos"
            >
              <MessageSquare size={18} />
            </button>

            {/* End Call (Red Button) */}
            <button
              onClick={onClose}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 18px rgba(239,68,68,0.45)',
              }}
              title="Finalizar consulta por voz"
            >
              <PhoneOff size={22} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
