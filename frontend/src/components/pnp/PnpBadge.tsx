import React from 'react'

interface PnpBadgeProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  subtext?: string
}

export const PnpShieldIcon: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 115"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Outer Shield Border */}
    <path
      d="M50 4L92 20V58C92 84 74 104 50 112C26 104 8 84 8 58V20L50 4Z"
      fill="url(#pnpTealGrad)"
      stroke="url(#pnpGoldGrad)"
      strokeWidth="4"
    />
    {/* Inner Shield Line */}
    <path
      d="M50 12L84 25V56C84 78 69 95 50 102C31 95 16 78 16 56V25L50 12Z"
      stroke="#D4AF37"
      strokeWidth="1.5"
      strokeOpacity="0.6"
      fill="none"
    />
    {/* Laurel / Sun Rays behind */}
    <circle cx="50" cy="52" r="22" fill="#D4AF37" fillOpacity="0.12" />
    {/* Scales / Swords Symbolism */}
    <path
      d="M50 26V76M36 38H64M33 46L36 38L39 46M61 46L64 38L67 46"
      stroke="#F3E5AB"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="50" cy="26" r="3" fill="#D4AF37" />
    {/* Base Star / Insignia */}
    <path
      d="M50 64L52.5 70H59L53.8 73.5L55.8 79.5L50 75.8L44.2 79.5L46.2 73.5L41 70H47.5L50 64Z"
      fill="#D4AF37"
    />
    <defs>
      <linearGradient id="pnpTealGrad" x1="50" y1="4" x2="50" y2="112" gradientUnits="userSpaceOnUse">
        <stop stopColor="#134E4A" />
        <stop offset="0.6" stopColor="#0B2926" />
        <stop offset="1" stopColor="#051917" />
      </linearGradient>
      <linearGradient id="pnpGoldGrad" x1="8" y1="4" x2="92" y2="112" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F7DF94" />
        <stop offset="0.3" stopColor="#D4AF37" />
        <stop offset="0.7" stopColor="#AA820A" />
        <stop offset="1" stopColor="#E6C665" />
      </linearGradient>
    </defs>
  </svg>
)

export default function PnpBadge({
  className = '',
  size = 'md',
  showText = true,
  subtext = 'DIVISIÓN DISCIPLINARIA PNP',
}: PnpBadgeProps) {
  const sizeMap = {
    sm: { icon: 22, title: 'text-xs', sub: 'text-[9px]' },
    md: { icon: 30, title: 'text-sm', sub: 'text-[10px]' },
    lg: { icon: 40, title: 'text-base', sub: 'text-[11px]' },
    xl: { icon: 52, title: 'text-lg', sub: 'text-xs' },
  }

  const current = sizeMap[size]

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <PnpShieldIcon size={current.icon} />
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold tracking-wider text-white uppercase ${current.title}`}>
              HARDMAN <span className="text-[#D4AF37]">PNP</span>
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#134e4a]/60 text-[#86efac] border border-[#134e4a]">
              LEY 30714
            </span>
          </div>
          <span className={`tracking-widest uppercase text-[#9ca3af] font-medium ${current.sub}`}>
            {subtext}
          </span>
        </div>
      )}
    </div>
  )
}
