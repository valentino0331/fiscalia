import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { getAgent } from '@/lib/agents'
import { SpijBadge, injectSpijBadges, SPIJ_VERIFIED_HREF } from '@/lib/spijBadge'
import HardmanLogo from '@/components/brand/HardmanLogo'

function safeTime(ts?: string): string {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function SharedConversation() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<{ id: string; agentId: string; title: string; messages: any[]; updatedAt: string } | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    api.conversations.getShared(token)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [token])

  const agent = data ? getAgent(data.agentId) : null

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
          <p className="text-[11px] font-light" style={{ color: 'rgba(255,255,255,0.40)' }}>Cargando consulta...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#111111' }}>
        <div className="text-center max-w-sm">
          <p className="text-white text-sm font-light mb-2">Enlace no válido</p>
          <p className="text-[11px] font-light mb-6" style={{ color: 'rgba(255,255,255,0.40)' }}>
            {error || 'Este enlace ha expirado o no existe.'}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg text-[11px] font-medium transition-all"
            style={{ border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.10)', color: '#c9a84c' }}
          >
            Ir a HARDMAN
          </button>
        </div>
      </div>
    )
  }

  const messages = (data.messages || []) as { role: string; content: string; timestamp: string }[]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#111111' }}>
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 md:px-8 border-b flex-shrink-0" style={{ background: '#111111', borderColor: '#2a2a2a' }}>
        <HardmanLogo size="sm" />
        <div className="flex items-center gap-3">
          {agent && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full overflow-hidden" style={{ border: '1.5px solid rgba(201,168,76,0.25)' }}>
                <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[12px] font-normal text-white leading-tight">{agent.name}</p>
                <p className="text-[9px] font-light" style={{ color: '#c9a84c' }}>{agent.role}</p>
              </div>
            </div>
          )}
          <div className="w-px h-4" style={{ background: '#2a2a2a' }} />
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
            style={{ border: '1px solid rgba(201,168,76,0.25)', background: 'rgba(201,168,76,0.08)', color: '#c9a84c' }}
          >
            Consultar gratis <ExternalLink size={11} />
          </button>
        </div>
      </header>

      {/* Conversation */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 md:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {/* Title */}
          <div className="mb-8">
            <p className="text-[8px] font-bold uppercase mb-2" style={{ letterSpacing: '3px', color: 'rgba(255,255,255,0.25)' }}>
              CONSULTA COMPARTIDA
            </p>
            <h1 className="text-xl font-light text-white">{data.title}</h1>
            {agent && (
              <p className="text-[11px] font-light mt-1" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {agent.name} · {agent.role}
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="space-y-5">
            {messages.map((msg, i) => {
              const isUser = msg.role === 'user'
              const displayContent = isUser
                ? msg.content.replace(/--- CONTENIDO EXTRAÍDO DEL DOCUMENTO ---[\s\S]*?--- FIN DEL DOCUMENTO ---\n\n/, '')
                : msg.content

              return (
                <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && agent && (
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1" style={{ border: '1px solid rgba(201,168,76,0.20)' }}>
                      <img src={agent.image} alt={agent.name} className="w-full h-full object-cover object-top" />
                    </div>
                  )}
                  <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
                    {!isUser && (
                      <p className="text-[11px] font-normal text-white mb-1.5 px-1">{agent?.name}</p>
                    )}
                    <div
                      className="px-5 py-4 text-[13px] font-light leading-relaxed"
                      style={isUser
                        ? { background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: '14px 4px 14px 14px', color: '#ffffff' }
                        : { background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '4px 14px 14px 14px', color: 'rgba(255,255,255,0.60)' }
                      }
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{displayContent}</p>
                      ) : (
                        <div className="prose-chat">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ href, children }) => {
                                if (href === SPIJ_VERIFIED_HREF) {
                                  return <SpijBadge />
                                }
                                return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                              },
                            }}
                          >
                            {injectSpijBadges(msg.content)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {msg.timestamp && (
                      <p className="text-[9px] mt-1 px-1" style={{ color: 'rgba(255,255,255,0.20)' }}>
                        {safeTime(msg.timestamp)}
                      </p>
                    )}
                  </div>
                  {isUser && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-[10px] font-semibold" style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}>
                      U
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA footer */}
          <div className="mt-12 py-8 border-t text-center" style={{ borderColor: '#2a2a2a' }}>
            <p className="text-[11px] font-light mb-4" style={{ color: 'rgba(255,255,255,0.40)' }}>
              ¿Tienes una consulta legal? Habla con uno de nuestros 8 especialistas.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[11px] font-semibold uppercase transition-all"
              style={{ letterSpacing: '2px', background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.25)', color: '#c9a84c' }}
            >
              Consultar gratis <ArrowRight size={13} />
            </button>
            <p className="text-[8px] mt-4 uppercase" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.20)' }}>
              HARDMAN · Inteligencia Jurídica · Perú
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
