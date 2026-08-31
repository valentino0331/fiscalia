import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  MapPin,
  Baby,
  Briefcase,
  ShoppingBag,
  ShieldAlert,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Phone,
  FileCheck
} from 'lucide-react'

interface WhereToGoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WhereToGoModal({ isOpen, onClose }: WhereToGoModalProps) {
  const [selectedEntity, setSelectedEntity] = useState<'demuna' | 'sunafil' | 'indecopi' | 'minjus' | 'comisaria'>('demuna')

  if (!isOpen) return null

  const ENTITIES = [
    {
      id: 'demuna',
      name: 'DEMUNA',
      subtitle: 'Alimentos y Tenencia',
      tag: '100% Gratuito',
      icon: Baby,
      description: 'Defensoría Municipal del Niño y del Adolescente. Permite conciliar pensión de alimentos y régimen de visitas de forma rápida sin necesidad de juicio.',
      where: 'En la Municipalidad de tu distrito (Área de Desarrollo Social / DEMUNA).',
      hours: 'Lunes a Viernes de 8:00 a.m. a 5:00 p.m.',
      requirements: [
        'DNI original y copia de la madre o padre solicitante.',
        'Copia de la Partida de Nacimiento de los hijos menores.',
        'Dirección exacta y número de teléfono de la otra parte.',
        'Lista de gastos mensuales aproximados del menor.',
      ],
      tips: 'El acta de conciliación firmada en DEMUNA tiene valor de sentencia judicial obligatoria.',
    },
    {
      id: 'sunafil',
      name: 'SUNAFIL',
      subtitle: 'Despido y Liquidación',
      tag: '100% Gratuito',
      icon: Briefcase,
      description: 'Superintendencia Nacional de Fiscalización Laboral. Atiende denuncias por falta de pago de liquidación, despido arbitrario o trabajo informal sin contrato.',
      where: 'Presencial en sedes zonales de SUNAFIL o virtual en sunafil.gob.pe ("Denuncia Virtual").',
      hours: 'Atención virtual 24/7. Sedes presenciales: Lunes a Viernes 8:30 a.m. a 4:30 p.m.',
      requirements: [
        'DNI o Carné de Extranjería.',
        'RUC o nombre exacto de la empresa empleadora.',
        'Pruebas del vínculo laboral: boletas de pago, chats de WhatsApp, correos de trabajo o fotos del carné/fotocheck.',
        'Fecha exacta de inicio y cese de labores.',
      ],
      tips: 'Tu empleador tiene un plazo fatal de 48 horas tras tu cese para pagarte tu liquidación. Si no lo hace, ingresa tu denuncia en SUNAFIL de inmediato.',
    },
    {
      id: 'indecopi',
      name: 'INDECOPI',
      subtitle: 'Consumidor y Estafas',
      tag: '100% Gratuito',
      icon: ShoppingBag,
      description: 'Instituto Nacional de Defensa de la Competencia. Para reclamos por compras defectuosas, estafas en tiendas online, cobros abusivos de bancos o aerolíneas.',
      where: 'Portal web indecopi.gob.pe ("Reclama Virtual") o sedes presenciales.',
      hours: 'Reclama Virtual disponible las 24 horas del día.',
      requirements: [
        'DNI del comprador.',
        'Boleta de venta, factura o comprobante de transferencia bancaria / Yape.',
        'Captura de pantalla de la publicidad engañosa, chats con el vendedor o código de reclamo del Libro de Reclamaciones.',
        'Monto exacto solicitado como devolución o cambio.',
      ],
      tips: 'Toda empresa en Perú está obligada a responder tu queja en el Libro de Reclamaciones en un plazo máximo de 15 días hábiles.',
    },
    {
      id: 'minjus',
      name: 'Defensa Pública (MINJUS)',
      subtitle: 'Abogado Gratis del Estado',
      tag: '100% Gratuito',
      icon: ShieldAlert,
      description: 'Abogados gratuitos proporcionados por el Ministerio de Justicia para personas sin recursos que necesiten demandar alimentos o defenderse penalmente.',
      where: 'Centros ALEGRA del MINJUS en todo el Perú o llamando al Fono Alegra 1884.',
      hours: 'Línea gratuita 1884 de Lunes a Viernes de 8:00 a.m. a 4:30 p.m.',
      requirements: [
        'DNI físico.',
        'Copia simple de la denuncia, notificación o cédula que recibiste.',
        'Declaración jurada simple de no contar con recursos económicos suficientes para un abogado particular.',
      ],
      tips: 'La asesoría y patrocinio de la Defensa Pública del Estado es totalmente gratuita por ley.',
    },
    {
      id: 'comisaria',
      name: 'Comisaría PNP / Fiscalía',
      subtitle: 'Denuncias y Constatación',
      tag: '24 Horas',
      icon: Building2,
      description: 'Para denunciar delitos de estafa, violencia familiar, agresiones o solicitar constatación policial por retiro forzado del trabajo o vivienda.',
      where: 'En la Comisaría PNP de la jurisdicción donde ocurrieron los hechos.',
      hours: 'Atención de emergencias y denuncias: 24 horas al día, los 365 días del año.',
      requirements: [
        'DNI o documento de identidad.',
        'Relato claro y cronológico de los hechos con fecha, hora y nombres de los involucrados.',
        'Pruebas iniciales: audios, videos, chats, comprobantes de pago o certificados médicos si hubo agresión física.',
      ],
      tips: 'Nadie puede cobrarte por recibirte una denuncia policial. Es un servicio público gratuito e inmediato.',
    },
  ]

  const active = ENTITIES.find((e) => e.id === selectedEntity) || ENTITIES[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-2xl p-6 relative max-h-[92vh] flex flex-col"
        style={{
          background: '#161616',
          border: '1px solid #333333',
          boxShadow: '0 20px 50px rgba(0,0,0,0.80)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }}
            >
              <MapPin size={16} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Guía de Trámites: A Dónde Ir y Qué Llevar</h3>
              <p className="text-[10px] text-white/40">
                Directorio oficial para realizar tus trámites legales gratuitos en Perú
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Entity Selector (Responsive Horizontal Scroll on Mobile & 5 cols on Desktop) */}
        <div className="flex gap-2 mb-4 flex-shrink-0 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-5">
          {ENTITIES.map((ent) => {
            const Icon = ent.icon
            const isSelected = selectedEntity === ent.id
            return (
              <button
                key={ent.id}
                onClick={() => setSelectedEntity(ent.id as any)}
                className={`p-2.5 rounded-xl border text-left transition-all min-w-[125px] sm:min-w-0 flex-1 ${
                  isSelected
                    ? 'border-[#c9a84c] bg-[#c9a84c]/14 text-[#ffffff] shadow-sm'
                    : 'border-white/10 bg-[#111111] text-white/50 hover:text-white'
                }`}
              >
                <Icon size={16} className={`mb-1.5 ${isSelected ? 'text-[#c9a84c]' : 'text-white/40'}`} />
                <span className="text-[11px] font-semibold block leading-tight">{ent.name}</span>
                <span className="text-[8.5px] opacity-70 block truncate mt-0.5">{ent.subtitle}</span>
              </button>
            )
          })}
        </div>

        {/* Entity Details Card */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-[11px]">
          {/* Overview */}
          <div className="p-4 rounded-xl bg-[#111111] border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">{active.name} — {active.subtitle}</h4>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {active.tag}
              </span>
            </div>
            <p className="text-white/70 leading-relaxed font-light">{active.description}</p>
          </div>

          {/* Location & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#111111] border border-white/5">
              <div className="flex items-center gap-1.5 text-[#c9a84c] mb-1">
                <MapPin size={13} />
                <span className="text-[9px] uppercase font-bold tracking-wider">¿Dónde queda?</span>
              </div>
              <p className="text-white/80 font-light text-[10px]">{active.where}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#111111] border border-white/5">
              <div className="flex items-center gap-1.5 text-[#c9a84c] mb-1">
                <Clock size={13} />
                <span className="text-[9px] uppercase font-bold tracking-wider">Horario de Atención</span>
              </div>
              <p className="text-white/80 font-light text-[10px]">{active.hours}</p>
            </div>
          </div>

          {/* Requirements in Hand */}
          <div className="p-4 rounded-xl bg-[#111111] border border-white/5">
            <div className="flex items-center gap-2 text-white mb-2.5">
              <FileCheck size={14} className="text-[#c9a84c]" />
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Requisitos indispensables que debes llevar en mano:
              </span>
            </div>
            <div className="space-y-1.5">
              {active.requirements.map((req, i) => (
                <div key={i} className="flex items-start gap-2 text-white/80">
                  <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="font-light">{req}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Tip */}
          <div
            className="p-3 rounded-xl border text-[10px]"
            style={{ background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.25)', color: '#c9a84c' }}
          >
            💡 <strong>Consejo Práctico:</strong> {active.tips}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 mt-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-[11px] font-semibold"
            style={{ background: '#c9a84c', color: '#111111' }}
          >
            Entendido
          </button>
        </div>
      </motion.div>
    </div>
  )
}
