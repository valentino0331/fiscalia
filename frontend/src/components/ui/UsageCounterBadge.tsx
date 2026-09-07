import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { Zap } from 'lucide-react'

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

  const isUnlimited = usage.limit === null
  const used = usage.questionsUsed
  const limit = usage.limit || 50

  let dotColor = '#34d17a'
  if (!isUnlimited) {
    const ratio = used / limit
    if (ratio >= 0.9) dotColor = '#ef4444'
    else if (ratio >= 0.7) dotColor = '#f59e0b'
  }

  if (isUnlimited) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border select-none transition-all ${className}`}
        style={{
          background: 'rgba(201,168,76,0.08)',
          borderColor: 'rgba(201,168,76,0.25)',
        }}
        title="Plan Senior: Consultas y análisis ilimitados"
      >
        <Zap size={11} className="text-[#c9a84c] flex-shrink-0" />
        <span className="text-[10px] sm:text-[11px] font-medium text-[#c9a84c] tracking-wide">
          {compact ? 'Ilimitado' : 'Consultas: Ilimitadas'}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border select-none transition-all ${className}`}
      style={{
        background: '#161616',
        borderColor: 'rgba(255,255,255,0.10)',
      }}
      title={`Plan Junior: ${used} consultas usadas de ${limit} permitidas en el mes`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: dotColor }}
      />
      <span className="text-[10px] sm:text-[11px] font-light text-white/70">
        <span className="text-white/40 hidden md:inline">Consultas: </span>
        <strong className="text-white font-medium">{used}</strong> / {limit}
      </span>
    </div>
  )
}
