import React from 'react'

export interface HardmanPnpLogoProps {
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  showBadge?: boolean
  className?: string
  color?: string
}

export default function HardmanPnpLogo({
  size = 'md',
  onClick,
  showBadge = true,
  className = '',
  color = '#ffffff',
}: HardmanPnpLogoProps) {
  const fontSizes = {
    sm: '14px',
    md: '16px',
    lg: '22px',
  }
  const trackings = {
    sm: '4px',
    md: '5px',
    lg: '7px',
  }
  const badgeFontSizes = {
    sm: '9px',
    md: '10px',
    lg: '11px',
  }
  const badgePadding = {
    sm: '1.5px 6px',
    md: '2px 7px',
    lg: '3px 8px',
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center select-none group transition-opacity ${
        onClick ? 'cursor-pointer hover:opacity-90' : ''
      } ${className}`}
    >
      <span
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 200,
          fontSize: fontSizes[size],
          letterSpacing: trackings[size],
          color,
          textTransform: 'uppercase',
          display: 'inline-flex',
          alignItems: 'baseline',
          whiteSpace: 'nowrap',
        }}
      >
        HAR
        <span className="relative inline-block">
          D
          <span
            className="absolute left-0 w-full"
            style={{
              bottom: size === 'lg' ? '-4px' : '-3px',
              height: size === 'lg' ? '2px' : '1.5px',
              background: '#c9a84c',
              borderRadius: '1px',
            }}
          />
        </span>
        MAN
      </span>

      {showBadge && (
        <span
          style={{
            fontSize: badgeFontSizes[size],
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: '#dfbe63',
            background: 'rgba(201, 168, 76, 0.08)',
            border: '1px solid rgba(201, 168, 76, 0.55)',
            padding: badgePadding[size],
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            marginLeft: size === 'lg' ? '10px' : '8px',
            textTransform: 'uppercase',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          PNP
        </span>
      )}
    </div>
  )
}
