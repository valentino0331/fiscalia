import { useState, useEffect } from 'react'
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

  useEffect(() => {
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

  if (!usage) return null

  const isSenior = usage.plan === 'senior' || usage.plan === 'pro'
  const used = usage.questionsUsed
  const limit = usage.limit || (isSenior ? 250 : 50)

  let dotColor = '#34d17a'
  const ratio = used / limit
  if (ratio >= 0.9) dotColor = '#ef4444'
  else if (ratio >= 0.7) dotColor = '#f59e0b'

  return (
    <>
      {isSenior ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border select-none transition-all hover:scale-[1.02] cursor-pointer ${className}`}
          style={{
            background: 'rgba(201,168,76,0.08)',
            borderColor: 'rgba(201,168,76,0.30)',
          }}
          title={`Plan Senior: ${used}/${limit} consultas mensuales. Soporte VIP por WhatsApp.`}
        >
          <Zap size={11} className="text-[#c9a84c] flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] font-medium text-[#c9a84c] tracking-wide">
            <span className="sm:hidden">{used}/{limit}</span>
            <span className="hidden sm:inline">Consultas: <strong className="text-white font-bold">{used}</strong> / {limit}</span>
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
          title={`Plan Junior: ${used}/${limit} consultas. Haz clic para subir a Senior (250 consultas).`}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: dotColor }}
          />
          <span className="text-[10px] sm:text-[11px] font-light text-white/70">
            <span className="text-white/40 hidden md:inline">Consultas: </span>
            <strong className="text-white font-medium">{used}</strong> / {limit}
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
