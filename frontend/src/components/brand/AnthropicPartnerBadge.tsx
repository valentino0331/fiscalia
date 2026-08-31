import React from 'react'

interface AnthropicPartnerBadgeProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function AnthropicPartnerBadge({
  size = 'md',
  className = '',
}: AnthropicPartnerBadgeProps) {
  const dimensions = {
    sm: 50,
    md: 70,
    lg: 96,
  }

  const dim = dimensions[size]

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full select-none ${className}`}
      style={{ width: dim, height: dim }}
      title="Powered by Claude • Anthropic Partner"
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-md hover:scale-105 transition-transform duration-300"
      >
        <defs>
          {/* Circular path for top arc text */}
          <path
            id="badgeTopTextPath"
            d="M 22 60 A 38 38 0 0 1 98 60"
            fill="none"
          />
          {/* Circular path for bottom arc text */}
          <path
            id="badgeBottomTextPath"
            d="M 98 60 A 38 38 0 0 1 22 60"
            fill="none"
          />

          {/* Platinum / Slate metallic gradient */}
          <radialGradient id="badgeRadial" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>

          {/* Golden edge ring gradient */}
          <linearGradient id="badgeRingGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAF3DC" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#8A6B1A" />
          </linearGradient>

          {/* Claude Purple Gradient */}
          <linearGradient id="claudePurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8E7DBE" />
            <stop offset="100%" stopColor="#524376" />
          </linearGradient>
        </defs>

        {/* Outer Shadow Ring */}
        <circle cx="60" cy="60" r="58" fill="url(#badgeRingGold)" opacity="0.4" />

        {/* Outer Metallic Body Circle */}
        <circle cx="60" cy="60" r="55" fill="url(#badgeRadial)" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="52" fill="none" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 2" />

        {/* Arc Text Top: POWERED BY CLAUDE */}
        <text
          fill="#0B2545"
          fontSize="8.5"
          fontWeight="800"
          letterSpacing="0.22em"
          fontFamily="Inter, sans-serif"
        >
          <textPath href="#badgeTopTextPath" startOffset="50%" textAnchor="middle">
            POWERED BY CLAUDE
          </textPath>
        </text>

        {/* Center Main Emblem & Text */}
        {/* Central Separator Lines */}
        <line x1="32" y1="52" x2="88" y2="52" stroke="#CBD5E1" strokeWidth="0.8" />
        <line x1="36" y1="69" x2="84" y2="69" stroke="#CBD5E1" strokeWidth="0.8" />

        {/* ANTHROPIC bold title */}
        <text
          x="60"
          y="62"
          textAnchor="middle"
          fill="#0B2545"
          fontSize="11"
          fontWeight="900"
          letterSpacing="0.08em"
          fontFamily="Inter, sans-serif"
        >
          ANTHROPIC
        </text>

        {/* PARTNER title */}
        <text
          x="60"
          y="77"
          textAnchor="middle"
          fill="#6B5B95"
          fontSize="7.5"
          fontWeight="800"
          letterSpacing="0.25em"
          fontFamily="Inter, sans-serif"
        >
          PARTNER
        </text>

        {/* Arc Text Bottom: ANTHROPIC PARTNER */}
        <text
          fill="#64748B"
          fontSize="7"
          fontWeight="700"
          letterSpacing="0.18em"
          fontFamily="Inter, sans-serif"
        >
          <textPath href="#badgeBottomTextPath" startOffset="50%" textAnchor="middle">
            ANTHROPIC PARTNER
          </textPath>
        </text>
      </svg>
    </div>
  )
}
