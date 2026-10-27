import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, CheckCircle2, ArrowRight } from 'lucide-react'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  usage: {
    plan: string
    questionsUsed: number
    limit: number | null
    isDemo?: boolean
  } | null
  title?: string
  subtitle?: string
}

export default function UpgradeModal({ isOpen, onClose, usage, title, subtitle }: UpgradeModalProps) {
  if (!isOpen) return null

  const isDemo = usage?.plan === 'demo' || usage?.isDemo
  const isSenior = usage?.limit === null || usage?.plan === 'senior' || usage?.plan === 'pro'
  const used = usage?.questionsUsed || 0
  const limit = usage?.limit || (isDemo ? 1 : isSenior ? 250 : 50)
  const remaining = Math.max(0, limit - used)
  const percent = Math.min(100, Math.round((used / limit) * 100))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full ${isDemo ? 'max-w-2xl' : 'max-w-lg'} rounded-2xl overflow-hidden border shadow-2xl relative max-h-[92vh] overflow-y-auto`}
          style={{ background: '#141414', borderColor: '#2e2e2e' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all z-10"
          >
            <X size={16} />
          </button>

          {isDemo ? (
            /* Demo mode upgrade screen: Both Plans with Hotmart buttons */
            <div className="p-6 sm:p-8 space-y-6">
              <div className="text-center max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#dfbe63] bg-[#c9a84c]/10 border border-[#c9a84c]/30 mb-3">
                  <Zap size={12} className="text-[#c9a84c]" />
                  <span>Modo de Prueba Finalizado</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-light text-white mb-2">
                  {title || 'Para seguir usando Hardman debes adquirir uno de nuestros planes'}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed font-light">
                  {subtitle || 'Has utilizado tu consulta de prueba. Elige cualquiera de nuestros dos planes oficiales para redactar demandas, calcular beneficios y analizar expedientes sin límites:'}
                </p>
              </div>

              {/* 2 Plans Grid */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                {/* Plan Junior */}
                <div
                  className="p-5 rounded-xl border flex flex-col justify-between relative"
                  style={{ background: '#1a1a1a', borderColor: '#2e2e2e' }}
                >
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-white/60 block mb-1">
                      Plan Junior
                    </span>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-white">S/ 39</span>
                      <span className="text-xs text-white/40">/ mes</span>
                    </div>
                    <p className="text-[11px] text-white/60 font-light mb-4">
                      Ideal para abogados independientes y recién colegiados.
                    </p>
                    <ul className="space-y-2 text-xs text-white/75 mb-6">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#34d17a] mt-0.5 flex-shrink-0" />
                        <span><strong>50 consultas legales</strong> al mes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#34d17a] mt-0.5 flex-shrink-0" />
                        <span>Los 8 especialistas con IA habilitados</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#34d17a] mt-0.5 flex-shrink-0" />
                        <span>Generador de demandas en Word (.docx)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#34d17a] mt-0.5 flex-shrink-0" />
                        <span>Análisis de escritos y resoluciones PDF</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://pay.hotmart.com/M107246567H?off=hm1anfcw&bid=1791731581871"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-white border border-white/20 hover:border-[#dfbe63] hover:text-[#dfbe63] bg-white/5"
                  >
                    <span>Elegir Plan Junior</span>
                    <ArrowRight size={13} />
                  </a>
                </div>

                {/* Plan Senior (Recomendado) */}
                <div
                  className="p-5 rounded-xl border flex flex-col justify-between relative shadow-lg"
                  style={{
                    background: 'linear-gradient(180deg, #1f1b13 0%, #151515 100%)',
                    borderColor: 'rgba(201,168,76,0.5)',
                  }}
                >
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-black bg-[#c9a84c]">
                    El más elegido
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-[#c9a84c] block mb-1">
                      Plan Senior
                    </span>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-2xl sm:text-3xl font-bold text-white">S/ 69</span>
                      <span className="text-xs text-white/40">/ mes</span>
                    </div>
                    <p className="text-[11px] text-white/60 font-light mb-4">
                      Para litigantes y estudios jurídicos con alta carga procesal.
                    </p>
                    <ul className="space-y-2 text-xs text-white/75 mb-6">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                        <span><strong>250 consultas al mes</strong> (máxima potencia)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                        <span>Carpetas fiscales y expedientes (hasta 30 MB)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                        <span>Membrete y marca blanca de tu estudio</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-[#c9a84c] mt-0.5 flex-shrink-0" />
                        <span>Soporte prioritario por WhatsApp</span>
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://pay.hotmart.com/M107246567H?off=ayixxvun&bid=1791731521258"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-black hover:opacity-95 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #dfbe63, #c9a84c)' }}
                  >
                    <Zap size={14} />
                    <span>Elegir Plan Senior</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>

              {/* Botón secundario para ver en landing */}
              <div className="pt-2 text-center">
                <a
                  href="/info#planes"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-white/50 hover:text-[#dfbe63] transition-colors underline underline-offset-4"
                >
                  Ver comparativa detallada y métodos de pago en hardman.lat &rarr;
                </a>
              </div>
            </div>
          ) : isSenior ? (
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
                  <h3 className="text-xl font-light text-white">Plan Senior (250 Consultas)</h3>
                </div>
              </div>

              <p className="text-xs text-white/60 leading-relaxed font-light">
                Disfrutas de capacidad total para tu litigio activo: hasta 250 consultas mensuales a los 8 especialistas, generación de documentos Word (.docx) con membrete oficial de tu estudio y análisis normativo avanzado.
              </p>

              {/* Progress bar de consumo de 250 consultas */}
              <div className="p-4 rounded-xl border space-y-3" style={{ background: '#1c1c1c', borderColor: '#2e2e2e' }}>
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
                      background: percent >= 80 ? '#ef4444' : percent >= 60 ? '#f59e0b' : '#c9a84c',
                    }}
                  />
                </div>
                <p className="text-[10px] text-white/40 leading-snug">
                  * Las 250 consultas se renuevan automáticamente al inicio de tu periodo mensual.
                </p>
              </div>

              <div className="p-4 rounded-xl border space-y-2.5" style={{ background: '#1c1c1c', borderColor: '#2e2e2e' }}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  Beneficios VIP Activos
                </h4>
                <ul className="space-y-1.5 text-xs text-white/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Hasta 250 consultas y análisis normativo al mes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Marca Blanca y membrete oficial en escritos Word y PDF</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Subida de expedientes completos y carpetas fiscales (hasta 30 MB)</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center transition-all border border-white/10 hover:border-white/20 text-white/80 hover:text-white bg-white/5 hover:bg-white/10"
              >
                Cerrar
              </button>
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
                    PASA AL PLAN SENIOR (250 CONSULTAS)
                  </span>
                  <span className="text-xs font-bold text-white">S/ 69 / mes</span>
                </div>
                <p className="text-xs text-white/80 font-light mb-3 leading-relaxed">
                  Multiplica tu capacidad x5 por solo S/ 30 más al mes y litiga con máxima potencia para tu estudio jurídico.
                </p>
                <ul className="space-y-1.5 text-[11px] text-white/70 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                    <strong className="text-white">250 consultas mensuales</strong> (máxima capacidad para litigio activo)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Subida de expedientes completos y carpetas fiscales (hasta 30 MB)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Plenos casatorios y jurisprudencia vinculante de la Corte Suprema</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-[#c9a84c] flex-shrink-0" />
                    <span>Atención técnica y soporte preferencial para litigio activo</span>
                  </li>
                </ul>

                <a
                  href="https://pay.hotmart.com/M107246567H?off=ayixxvun&bid=1791731521258"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all text-black hover:opacity-90 shadow-md"
                  style={{ background: '#c9a84c' }}
                >
                  <Zap size={14} />
                  Actualizar a Plan Senior (S/ 69)
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
