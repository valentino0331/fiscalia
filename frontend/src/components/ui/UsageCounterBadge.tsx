import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Zap } from 'lucide-react'
import UpgradeModal from './UpgradeModal'

interface UsageCounterBadgeProps {
  className?: string
  compact?: boolean
}

export default function UsageCounterBadge({
  className = '',
  compact = false,
}: UsageCounterBadgeProps) {
  const [usage, setUsage] = useState<{
    plan: string
    questionsUsed: number
    limit: number | null
  } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchUsage = useCallback(() => {
    api.account.usage()
      .then((data) => {
        setUsage({
          plan: data.plan,
          questionsUsed: data.questionsUsed,
          limit: data.limit,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchUsage()

    const handleUsageUpdate = (e?: Event) => {
      const customEvt = e as CustomEvent<{ optimisticDecrement?: boolean; increment?: number }>
      if (customEvt?.detail?.optimisticDecrement || customEvt?.detail?.increment) {
        const inc = customEvt?.detail?.increment ?? 1
        setUsage((prev) => (prev ? { ...prev, questionsUsed: prev.questionsUsed + inc } : prev))
      }
      setTimeout(fetchUsage, 400)
    }

    window.addEventListener('hardman:usage-updated', handleUsageUpdate)
    window.addEventListener('focus', fetchUsage)

    return () => {
      window.removeEventListener('hardman:usage-updated', handleUsageUpdate)
      window.removeEventListener('focus', fetchUsage)
    }
  }, [fetchUsage])

  if (!usage) return null

  const isDemo = usage.plan === 'demo'
  const isSenior = usage.plan === 'senior' || usage.plan === 'pro'
  const used = usage.questionsUsed
  const limit = usage.limit ?? (isDemo ? 1 : isSenior ? 250 : 50)
  const remaining = Math.max(0, limit - used)

  let dotColor = '#34d17a'
  const ratio = limit > 0 ? used / limit : 1
  if (ratio >= 0.9) dotColor = '#ef4444'
  else if (ratio >= 0.7) dotColor = '#f59e0b'

  return (
    <>
      {isDemo ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border select-none transition-all hover:scale-[1.02] cursor-pointer ${className}`}
          style={{
            background: remaining > 0 ? 'rgba(201,168,76,0.12)' : 'rgba(239,68,68,0.12)',
            borderColor: remaining > 0 ? 'rgba(201,168,76,0.45)' : 'rgba(239,68,68,0.45)',
          }}
          title={remaining > 0 ? 'Modo Demo: 1 consulta de prueba disponible.' : 'Modo Demo: Consulta de prueba utilizada. Haz clic para activar un plan.'}
        >
          <Zap size={11} className={remaining > 0 ? 'text-[#c9a84c]' : 'text-red-400'} />
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-wide">
            {remaining > 0 ? (
              <span className="text-[#dfbe63]">Demo: <strong>1</strong> consulta de prueba</span>
            ) : (
              <span className="text-red-400">Demo finalizada • <strong>Activar Plan</strong></span>
            )}
          </span>
        </button>
      ) : isSenior ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border select-none transition-all hover:scale-[1.02] cursor-pointer ${className}`}
          style={{
            background: 'rgba(201,168,76,0.08)',
            borderColor: 'rgba(201,168,76,0.30)',
          }}
          title={`Plan Senior/Pro: ${remaining} de ${limit} consultas disponibles este mes. Soporte VIP por WhatsApp.`}
        >
          <Zap size={11} className="text-[#c9a84c] flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-medium text-[#c9a84c] tracking-wide">
            <span className="sm:hidden">{remaining}/{limit}</span>
            <span className="hidden sm:inline">
              Consultas: <strong className="text-white font-bold">{remaining}</strong> restantes
            </span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border select-none transition-all hover:border-[#c9a84c]/50 hover:bg-[#1f1f1f] cursor-pointer ${className}`}
          style={{
            background: '#161616',
            borderColor: 'rgba(255,255,255,0.12)',
          }}
          title={`Plan Junior: ${remaining} de ${limit} consultas disponibles. Haz clic para subir a Senior (250 consultas).`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: dotColor }}
          />
          <span className="text-[10px] sm:text-[11px] font-light text-white/70">
            <span className="text-white/40 hidden md:inline">Consultas: </span>
            <strong className="text-white font-medium">{remaining}</strong> restantes
          </span>
        </button>
      )}

      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        usage={usage}
      />
    </>
  )
}
