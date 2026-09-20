import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BookOpen,
  Search,
  Check,
  Copy,
  ArrowRight,
  Sparkles,
  FileText,
} from 'lucide-react'
import { AGENTS, getAgent } from '@/lib/agents'
import { SPECIALIST_TEMPLATES, DocumentTemplateItem } from '@/lib/templates'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  currentAgentId?: string
  onInsertPrompt: (promptText: string) => void
}

export default function TemplatesModal({
  isOpen,
  onClose,
  currentAgentId,
  onInsertPrompt,
}: TemplatesModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(
    currentAgentId || 'valentina'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Sync selectedAgentId when currentAgentId changes or modal opens
  useEffect(() => {
    if (isOpen && currentAgentId) {
      setSelectedAgentId(currentAgentId)
      setSearchQuery('')
      setCopiedIndex(null)
    }
  }, [isOpen, currentAgentId])

  // ESC key to close
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const activeAgent = useMemo(() => {
    return getAgent(selectedAgentId) || AGENTS[0]
  }, [selectedAgentId])

  const rawTemplates = useMemo(() => {
    return SPECIALIST_TEMPLATES[selectedAgentId] || SPECIALIST_TEMPLATES.valentina || []
  }, [selectedAgentId])

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return rawTemplates
    const q = searchQuery.toLowerCase().trim()
    return rawTemplates.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        (t.category && t.category.toLowerCase().includes(q)) ||
        t.prompt.toLowerCase().includes(q)
    )
  }, [rawTemplates, searchQuery])

  const handleCopy = (text: string, index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 1800)
  }

  const handleSelect = (prompt: string) => {
    onInsertPrompt(prompt)
    onClose()
  }

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border"
        style={{
          background: '#161616',
          borderColor: 'rgba(201,168,76,0.35)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(201,168,76,0.10)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div
            className="px-5 py-4 border-b flex items-center justify-between flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.08)', background: '#131313' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(201,168,76,0.12)',
                  border: '1px solid rgba(201,168,76,0.25)',
                  color: '#c9a84c',
                }}
              >
                <BookOpen size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                    PLANTILLAS Y MODELOS LEGALES
                  </h2>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      background: 'rgba(201,168,76,0.15)',
                      color: '#c9a84c',
                      border: '1px solid rgba(201,168,76,0.30)',
                    }}
                  >
                    {activeAgent.badge}
                  </span>
                </div>
                <p className="text-[11px] text-white/50 mt-0.5">
                  Modelos procesales y contractuales oficiales de{' '}
                  <span className="text-white/80 font-medium">{activeAgent.name}</span> · {activeAgent.role}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              title="Cerrar (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Specialist Selector Tabs */}
          <div
            className="px-4 py-2.5 border-b overflow-x-auto flex items-center gap-1.5 flex-shrink-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#181818' }}
          >
            <span className="text-[10px] font-medium text-white/40 mr-1 flex-shrink-0 uppercase tracking-wider">
              Especialista:
            </span>
            {AGENTS.map((ag) => {
              const isSelected = ag.id === selectedAgentId
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    setSelectedAgentId(ag.id)
                    setSearchQuery('')
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex-shrink-0"
                  style={{
                    background: isSelected ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#c9a84c' : 'rgba(255,255,255,0.50)',
                    border: isSelected ? '1px solid rgba(201,168,76,0.35)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: isSelected ? '#c9a84c' : ag.color }}
                  />
                  <span>{ag.name}</span>
                  <span className="text-[9px] opacity-70">({ag.badge})</span>
                </button>
              )
            })}
          </div>

          {/* Search bar */}
          <div
            className="px-4 py-3 border-b flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.05)', background: '#161616' }}
          >
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{
                background: '#1d1d1d',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              <Search size={15} className="text-white/40 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Buscar plantillas de ${activeAgent.name} (ej. demanda, apelación, contrato, medida)...`}
                className="w-full bg-transparent text-xs text-white placeholder-white/35 outline-none font-light"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-white/40 hover:text-white text-xs px-1"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Templates list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText size={32} className="mx-auto text-white/20 mb-2" />
                <p className="text-sm font-medium text-white/60">No se encontraron plantillas</p>
                <p className="text-xs text-white/35 mt-1">
                  Prueba buscando con otro término o selecciona otro especialista.
                </p>
              </div>
            ) : (
              filteredTemplates.map((tpl, idx) => {
                const TplIcon = tpl.icon
                const isCopied = copiedIndex === idx
                return (
                  <div
                    key={tpl.label + idx}
                    onClick={() => handleSelect(tpl.prompt)}
                    className="group rounded-xl p-3.5 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border"
                    style={{
                      background: '#1c1c1c',
                      borderColor: 'rgba(255,255,255,0.06)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(201,168,76,0.40)'
                      e.currentTarget.style.background = 'rgba(201,168,76,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                      e.currentTarget.style.background = '#1c1c1c'
                    }}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <TplIcon size={16} style={{ color: tpl.badgeColor }} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-xs sm:text-[13px] font-semibold text-white/90 group-hover:text-[#c9a84c] transition-colors leading-snug">
                            {tpl.label}
                          </h3>
                          {tpl.category && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.55)',
                                border: '1px solid rgba(255,255,255,0.08)',
                              }}
                            >
                              {tpl.category}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/40 line-clamp-2 leading-relaxed">
                          {tpl.prompt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(tpl.prompt, idx, e)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5"
                        style={{
                          background: isCopied ? 'rgba(52,209,122,0.12)' : 'rgba(255,255,255,0.04)',
                          color: isCopied ? '#34d17a' : 'rgba(255,255,255,0.60)',
                          border: isCopied ? '1px solid rgba(52,209,122,0.30)' : '1px solid rgba(255,255,255,0.08)',
                        }}
                        title="Copiar prompt al portapapeles"
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelect(tpl.prompt)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 shadow-sm"
                        style={{
                          background: '#c9a84c',
                          color: '#111111',
                        }}
                      >
                        <Sparkles size={12} />
                        <span>Usar en chat</span>
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div
            className="px-5 py-2.5 border-t flex items-center justify-between text-[11px] flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#121212' }}
          >
            <span className="text-white/40">
              💡 Haz clic en cualquier modelo para cargarlo directamente en tu mensaje.
            </span>
            <span className="text-white/30 text-[10px]">
              {filteredTemplates.length} plantilla{filteredTemplates.length === 1 ? '' : 's'} disponible{filteredTemplates.length === 1 ? '' : 's'}
            </span>
          </div>
        </motion.div>
      </div>,
      document.body
    )
}
