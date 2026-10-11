import { useEffect } from 'react'

export default function LandingPage() {
  useEffect(() => {
    document.title = 'Hardman | Inteligencia Artificial Jurídica para Abogados en Perú'
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#080808' }}>
      <iframe
        src="/info/index.html"
        title="Hardman - Plataforma Jurídica con Inteligencia Artificial"
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
