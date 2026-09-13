import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { api } from '@/lib/api'

export default function WhatsAppSupportButton() {
  const [isSenior, setIsSenior] = useState(false)

  useEffect(() => {
    api.account.usage()
      .then((data) => {
        if (data.limit === null || data.plan === 'senior' || data.plan === 'pro') {
          setIsSenior(true)
        }
      })
      .catch(() => {})
  }, [])

  const message = isSenior
    ? encodeURIComponent('Hola Hardman IA, soy miembro del Plan Senior y requiero soporte prioritario con mi consulta legal.')
    : encodeURIComponent('Hola Hardman IA, tengo una consulta sobre mi cuenta y los planes disponibles.')

  const whatsappUrl = `https://wa.me/51929725274?text=${message}`

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end group pointer-events-auto">
      {/* Tooltip on hover (arriba del botón) */}
      <div
        className="opacity-0 group-hover:opacity-100 pointer-events-none select-none transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 mb-2 hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] shadow-2xl whitespace-nowrap"
        style={{
          background: '#1a1a1a',
          borderColor: isSenior ? 'rgba(201,168,76,0.40)' : '#333333',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        }}
      >
        <span>Soporte WhatsApp {isSenior ? 'VIP' : ''} (929 725 274)</span>
        {isSenior && (
          <span className="text-[8px] bg-[#c9a84c]/20 text-[#c9a84c] px-1.5 py-0.5 rounded font-bold uppercase">
            VIP
          </span>
        )}
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95"
        style={{
          background: '#25D366',
          boxShadow: '0 4px 18px rgba(37,211,102,0.40)',
        }}
        title="Soporte directo por WhatsApp (929 725 274)"
      >
        <MessageCircle size={22} className="text-white fill-white" />
        {isSenior && (
          <span
            className="absolute -top-1 -right-1 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border shadow-sm"
            style={{
              background: '#c9a84c',
              borderColor: '#111111',
              color: '#111111',
              letterSpacing: '0.5px',
            }}
          >
            VIP
          </span>
        )}
      </a>
    </div>
  )
}
