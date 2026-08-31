interface HardmanLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function JurisClaudeSymbol() {
  return null
}

export default function JurisClaudeLogo({
  size = 'md',
  className = '',
}: HardmanLogoProps) {
  const fontSize = {
    sm: '14px',
    md: '16px',
    lg: '22px',
    xl: '28px',
  }

  return (
    <div className={`flex flex-col items-start ${className}`}>
      <span
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 200,
          fontSize: fontSize[size],
          letterSpacing: '7px',
          color: '#c8c0b0',
          textTransform: 'uppercase',
          lineHeight: 1.3,
        }}
      >
        HARDMAN
      </span>
      <div
        style={{
          width: '20px',
          height: '0.5px',
          background: '#6b5f4a',
          marginTop: '4px',
        }}
      />
    </div>
  )
}
