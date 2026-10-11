import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Hardman IA | 8 Abogados con Inteligencia Artificial Especializados en Derecho Peruano'
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080808' }}>
      <iframe
        src="/info/index.html"
        title="Hardman IA - Plataforma Jurídica"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
          overflow: 'auto',
        }}
      />
    </div>
  )
}
