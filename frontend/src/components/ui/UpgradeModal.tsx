import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, CheckCircle2, ArrowRight, MessageCircle } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  usage: {
    plan: string
    questionsUsed: number
    limit: number | null
  } | null
}

export default function UpgradeModal({ isOpen, onClose, usage }: UpgradeModalProps) {
  if (!isOpen) return null

  const isSenior = usage?.limit === null || usage?.plan === 'senior' || usage?.plan === 'pro'
  const used = usage?.questionsUsed || 0
  const limit = usage?.limit || 50
  const remaining = Math.max(0, limit - used)
  const percent = Math.min(100, Math.round((used / limit) * 100))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg rounded-2xl overflow-hidden border shadow-2xl relative"
          style={{ background: '#161616', borderColor: '#2e2e2e' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <X size={16} />
          </button>

          {isSenior ? (
            /* Senior status banner */
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#c9a84c]/10 border border-[#c9a84c]/30 text-[#c9a84c]">
                  <Zap size={24} />
                </div>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#c9a84c] block">
                    MEMBRESÍA ACTIVA
                  </span>
                  <h3 className="text-xl font-light text-white">Plan Senior Ilimitado</h3>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed font-light">
                Disfrutas de capacidad total sin restricciones: consultas ilimitadas a los 8 especialistas, generación de documentos Word (.docx) con membrete oficial de tu estudio y soporte prioritario directo.
              </p>

              <div className="p-4 rounded-xl border space-y-2.5" style={{ background: '#1c1c1c', borderColor: '#2e2e2e' }}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Beneficios VIP Activos
                </h4>
                <ul className="space-y-1.5 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Consultas y análisis normativo 100% ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Marca Blanca y membrete oficial en escritos Word y PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Soporte prioritario por WhatsApp: <strong>929 727 274</strong></span>
                  </li>
                </ul>
              </div>

              <a
                href="https://wa.me/51929727274?text=Hola%20Hardman%20IA,%20soy%20miembro%20Senior%20y%20necesito%20asistencia%20legal%20prioritaria."
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all bg-[#25D366] hover:bg-[#20ba59] text-white shadow-lg shadow-[#25D366]/20"
              >
                <MessageCircle size={16} />
                Contactar a mi Asesor Senior por WhatsApp
              </a>
            </div>
          ) : (
            /* Junior status & upgrade card */
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#34d17a] block mb-0.5">
                    ESTADO DE TU CUENTA JUNIOR
                  </span>
                  <h3 className="text-xl font-light text-white">Consumo de Consultas</h3>
                </div>
                <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Plan Junior
                </span>
              </div>

              {/* Progress bar */}
              <div className="p-4 rounded-xl border space-y-3" style={{ background: '#1b1b1b', borderColor: '#2c2c2c' }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/60">Consultas este mes:</span>
                  <span className="font-semibold text-white">
                    {used} / {limit} <span className="text-white/40 font-normal">({remaining} restantes)</span>
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      background: percent >= 80 ? '#ef4444' : percent >= 60 ? '#f59e0b' : '#34d17a',
                    }}
                  />
                </div>
                <p className="text-[10px] text-white/40 leading-snug">
                  * Las 50 consultas se renuevan automáticamente al inicio de tu periodo mensual.
                </p>
              </div>

              {/* Upgrade promotion banner */}
              <div
                className="p-5 rounded-xl border relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(22,22,22,0.95) 100%)',
                  borderColor: 'rgba(201,168,76,0.30)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9a84c]">
                    PASA AL PLAN SENIOR ILIMITADO
                  </span>
                  <span className="text-xs font-bold text-white">S/ 69 / mes</span>
                </div>
                <p className="text-xs text-white/80 font-light mb-3 leading-relaxed">
                  Por solo S/ 30 más al mes, elimina todo límite y litiga con respaldo completo para tu estudio jurídico.
                </p>
                <ul className="space-y-1.5 text-[11px] text-white/70 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                    <strong className="text-white">Consultas ilimitadas</strong> (nunca te quedes a mitad de un plazo)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Membrete de tu Estudio Jurídico en Word (.docx) y PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Soporte prioritario por WhatsApp directo (929 727 274)</span>
                  </li>
                </ul>

                <a
                  href="https://wa.me/51929727274?text=Hola%20Hardman%20IA,%20quiero%20actualizar%20mi%20cuenta%20al%20Plan%20Senior%20Ilimitado%20(S/%2069/mes)."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-black hover:opacity-90 shadow-md"
                  style={{ background: '#c9a84c' }}
                >
                  <Zap size={14} />
                  Actualizar a Plan Senior Ilimitado
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
