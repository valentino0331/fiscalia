import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Zap } from 'lucide-react'
import UpgradeModal from './UpgradeModal'

const USAGE_CACHE_KEY = 'hardman_cached_usage'

interface CachedUsage {
  plan: string
  questionsUsed: number
  limit: number | null
}

function readCachedUsage(): CachedUsage | null {
  try {
    const raw = localStorage.getItem(USAGE_CACHE_KEY) || sessionStorage.getItem(USAGE_CACHE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function writeCachedUsage(data: CachedUsage) {
  try {
    const serialized = JSON.stringify(data)
    localStorage.setItem(USAGE_CACHE_KEY, serialized)
    sessionStorage.setItem(USAGE_CACHE_KEY, serialized)
  } catch {}
}

interface UsageCounterBadgeProps {
  className?: string
  compact?: boolean
}

export default function UsageCounterBadge({
  className = '',
  compact = false,
}: UsageCounterBadgeProps) {
  const [usage, setUsage] = useState<CachedUsage | null>(readCachedUsage)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchUsage = useCallback(() => {
    api.account.usage()
      .then((data) => {
        const fresh: CachedUsage = {
          plan: data.plan,
          questionsUsed: data.questionsUsed,
          limit: data.limit,
        }
        setUsage(fresh)
        writeCachedUsage(fresh)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // 1. Fetch immediately on mount
    fetchUsage()

    // 2. Listen to custom in-app usage updates
    const handleUsageUpdate = (e?: Event) => {
      const customEvt = e as CustomEvent<{ optimisticDecrement?: boolean; increment?: number }>
      if (customEvt?.detail?.optimisticDecrement || customEvt?.detail?.increment) {
        const inc = customEvt?.detail?.increment ?? 1
        setUsage((prev) => {
          if (!prev) return prev
          const updated = { ...prev, questionsUsed: prev.questionsUsed + inc }
          writeCachedUsage(updated)
          return updated
        })
      }
      setTimeout(fetchUsage, 350)
    }

    // 3. Multi-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === USAGE_CACHE_KEY && e.newValue) {
        try {
          setUsage(JSON.parse(e.newValue))
        } catch {}
      }
    }

    // 4. Focus & visibility sync
    const handleVisibilityChange = () => {
      if (!document.hidden) fetchUsage()
    }

    window.addEventListener('hardman:usage-updated', handleUsageUpdate)
    window.addEventListener('focus', fetchUsage)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('hardman:usage-updated', handleUsageUpdate)
      window.removeEventListener('focus', fetchUsage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchUsage])

  if (!usage) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-medium opacity-60 select-none ${className}`}
        style={{
          background: '#131418',
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Zap size={12} className="text-[#c9a84c] fill-[#c9a84c] animate-pulse flex-shrink-0" />
        <span className="text-white/60 tracking-wide">Consultas...</span>
      </div>
    )
  }

  const isDemo = usage.plan === 'demo'
  const isSenior = usage.plan === 'senior' || usage.plan === 'pro'
  const used = usage.questionsUsed
  const limit = usage.limit ?? (isDemo ? 1 : isSenior ? 250 : 50)
  const remaining = Math.max(0, limit - used)

  return (
    <>
      {isDemo ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-medium transition-all select-none hover:scale-[1.02] active:scale-95 cursor-pointer ${
            remaining > 0
              ? 'hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5'
              : 'hover:border-red-500/40 hover:bg-red-500/5'
          } ${className}`}
          style={{
            background: remaining > 0 ? '#131418' : 'rgba(239,68,68,0.12)',
            borderColor: remaining > 0 ? 'rgba(201,168,76,0.30)' : 'rgba(239,68,68,0.40)',
          }}
          title={remaining > 0 ? 'Modo Demo: 1 consulta de prueba disponible.' : 'Modo Demo finalizado. Haz clic para activar tu plan.'}
        >
          <Zap size={12} className={remaining > 0 ? 'text-[#c9a84c] fill-[#c9a84c] flex-shrink-0' : 'text-red-400 fill-red-400 flex-shrink-0'} />
          <span className="text-white/70 tracking-wide">
            {remaining > 0 ? (
              <>Demo: <strong className="text-[#dfbe63] font-semibold">1</strong> restante</>
            ) : (
              <span className="text-red-400 font-semibold">Demo agotada • Activar Plan</span>
            )}
          </span>
        </button>
      ) : isSenior ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-medium transition-all select-none hover:scale-[1.02] active:scale-95 cursor-pointer hover:border-[#c9a84c]/40 hover:bg-[#c9a84c]/5 ${className}`}
          style={{
            background: '#131418',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
          title={`Plan Senior/Pro: ${remaining} de ${limit} consultas disponibles este mes.`}
        >
          <Zap size={12} className="text-[#c9a84c] fill-[#c9a84c] flex-shrink-0" />
          <span className="text-white/70 tracking-wide">
            <span className="sm:hidden text-white/80">
              <strong className="text-[#dfbe63] font-semibold">{remaining}</strong>/{limit}
            </span>
            <span className="hidden sm:inline">
              Consultas <strong className="text-[#dfbe63] font-semibold">{remaining}</strong> restantes
            </span>
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] font-medium transition-all select-none hover:scale-[1.02] active:scale-95 cursor-pointer hover:border-[#34d17a]/40 hover:bg-[#34d17a]/5 ${className}`}
          style={{
            background: '#131418',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
          title={`Plan Junior: ${remaining} de ${limit} consultas disponibles este mes. Haz clic para subir a Senior (250 consultas).`}
        >
          <Zap size={12} className="text-[#34d17a] fill-[#34d17a] flex-shrink-0" />
          <span className="text-white/70 tracking-wide">
            <span className="sm:hidden text-white/80">
              <strong className="text-[#34d17a] font-semibold">{remaining}</strong>/{limit}
            </span>
            <span className="hidden sm:inline">
              Consultas <strong className="text-[#34d17a] font-semibold">{remaining}</strong> restantes
            </span>
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
