import { useNavigate } from 'react-router-dom'

interface HardmanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  onClick?: () => void
}

export function HardmanSymbol() {
  return null
}
export const JurisClaudeSymbol = HardmanSymbol

export function HardmanLogo({
  size = 'md',
  className = '',
  onClick,
}: HardmanLogoProps) {
  const navigate = useNavigate()

  const fontSize = {
    sm: '13px',
    md: '16px',
    lg: '22px',
    xl: '28px',
  }

  const underlineWidth = {
    sm: '18px',
    md: '22px',
    lg: '28px',
    xl: '36px',
  }

  const underlineHeight = {
    sm: '1.5px',
    md: '1.5px',
    lg: '2px',
    xl: '2.5px',
  }

  const tracking = {
    sm: '5px',
    md: '6px',
    lg: '8px',
    xl: '10px',
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={`inline-flex flex-col items-center justify-center cursor-pointer select-none transition-opacity hover:opacity-85 ${className}`}
      aria-label="HARDMAN"
    >
      <span
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 300,
          fontSize: fontSize[size],
          letterSpacing: tracking[size],
          color: '#c8c0b0',
          textTransform: 'uppercase',
          lineHeight: 1.1,
          paddingLeft: tracking[size], // Compensates trailing letter-spacing to center D perfectly
        }}
      >
        HARDMAN
      </span>
      <div
        style={{
          width: underlineWidth[size],
          height: underlineHeight[size],
          background: '#6b5f4a',
          marginTop: '4px',
          borderRadius: '1px',
        }}
      />
    </div>
  )
}

export const JurisClaudeLogo = HardmanLogo
export default HardmanLogo

