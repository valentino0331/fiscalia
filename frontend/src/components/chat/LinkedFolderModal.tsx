import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder, FolderCheck, X, FileText, CheckCircle2, AlertCircle, RefreshCw, Layers, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'

export interface LinkedDoc {
  name: string
  size: number
  type: string
  file: File
  extractedText?: string
  status: 'pending' | 'extracting' | 'ready' | 'error'
  error?: string
}

export interface LinkedFolderState {
  folderName: string
  docs: LinkedDoc[]
  linkedAt: string
}

interface LinkedFolderModalProps {
  isOpen: boolean
  onClose: () => void
  linkedFolder: LinkedFolderState | null
  onLinkFolder: (folderName: string, files: File[]) => void
  onUnlinkFolder: () => void
  onExtractDoc?: (doc: LinkedDoc) => Promise<void>
}

export default function LinkedFolderModal({
  isOpen,
  onClose,
  linkedFolder,
  onLinkFolder,
  onUnlinkFolder,
}: LinkedFolderModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const folderInputRef = React.useRef<HTMLInputElement>(null)
  const multiFileInputRef = React.useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handlePickMultiFiles = () => {
    multiFileInputRef.current?.click()
  }

  const handleMultiFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    const validFiles = files.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || ''
      return ['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg'].includes(ext)
    })
    if (validFiles.length > 0) {
      onLinkFolder(`Expediente (${validFiles.length} documentos)`, validFiles)
    } else {
      alert('No se encontraron documentos válidos (.pdf, .docx, .txt, .jpg).')
    }
    if (multiFileInputRef.current) multiFileInputRef.current.value = ''
  }

  const handlePickDirectoryNative = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' })
        const folderName = dirHandle.name || 'Carpeta Vinculada'
        const collectedFiles: File[] = []

        for await (const entry of (dirHandle as any).values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile()
            const ext = file.name.split('.').pop()?.toLowerCase() || ''
            if (['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg'].includes(ext)) {
              collectedFiles.push(file)
            }
          }
        }

        if (collectedFiles.length > 0) {
          onLinkFolder(folderName, collectedFiles)
        } else {
          alert('La carpeta seleccionada no contiene documentos compatibles (.pdf, .docx, .txt, .jpg).')
        }
      } else {
        folderInputRef.current?.click()
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        // Fallback a input estándar
        folderInputRef.current?.click()
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Infer folder name from webkitRelativePath
    const firstRel = (files[0] as any).webkitRelativePath || ''
    const folderName = firstRel ? firstRel.split('/')[0] : 'Carpeta Vinculada'

    const validFiles = files.filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || ''
      return ['pdf', 'docx', 'doc', 'txt', 'png', 'jpg', 'jpeg'].includes(ext)
    })

    if (validFiles.length > 0) {
      onLinkFolder(folderName, validFiles)
    } else {
      alert('No se encontraron documentos válidos (.pdf, .docx, .txt, .jpg) en la carpeta seleccionada.')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-[#141414] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#181818]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#c9a84c]/10 border border-[#c9a84c]/20 text-[#c9a84c]">
                <Folder size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  Vincular Carpeta (Modo Cowork)
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25">
                    Multi-Doc IA
                  </span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Conecta una carpeta local (expediente / carpeta fiscal) para consultas cruzadas instantáneas.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {linkedFolder ? (
              <div className="space-y-4">
                {/* Active Folder Card */}
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <FolderCheck size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-white truncate flex items-center gap-2">
                        {linkedFolder.folderName}
                        <span className="text-[10px] text-emerald-400 font-normal">● Vinculada</span>
                      </h4>
                      <p className="text-xs text-white/60 mt-0.5">
                        {linkedFolder.docs.length} documentos jurídicos cargados · Vinculada {linkedFolder.linkedAt}
                      </p>
                      <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
                        <Sparkles size={11} /> Sebastián y los 8 especialistas analizarán este expediente automáticamente.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handlePickDirectoryNative}
                      className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 text-xs font-medium transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      <span>Cambiar</span>
                    </button>
                    <button
                      onClick={onUnlinkFolder}
                      className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                      title="Desvincular carpeta"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Documents List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white/70">
                      Documentos en este expediente ({linkedFolder.docs.length})
                    </span>
                    <span className="text-[10px] text-white/40">
                      PDF, DOCX, TXT admisibles
                    </span>
                  </div>

                  <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden bg-[#181818] max-h-60 overflow-y-auto">
                    {linkedFolder.docs.map((doc, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={15} className="text-[#c9a84c] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-white/90 truncate">{doc.name}</p>
                            <p className="text-[10px] text-white/40">{formatBytes(doc.size)}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {doc.status === 'ready' ? (
                            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                              <CheckCircle2 size={10} /> Indexado
                            </span>
                          ) : doc.status === 'error' ? (
                            <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-500/20">
                              <AlertCircle size={10} /> Error
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                              Listo
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Not Linked State */
              <div className="space-y-4">
                <div
                  onClick={handlePickDirectoryNative}
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragActive(false)
                    handlePickDirectoryNative()
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${dragActive
                      ? 'border-[#c9a84c] bg-[#c9a84c]/10'
                      : 'border-white/15 bg-white/[0.02] hover:border-[#c9a84c]/50 hover:bg-white/[0.04]'
                    }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/25 flex items-center justify-center text-[#c9a84c] shadow-lg">
                    <Folder size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Haz clic para seleccionar una Carpeta Fiscal o Expediente
                    </p>
                    <p className="text-xs text-white/50 mt-1 max-w-sm">
                      Vincula una carpeta completa de tu computadora. Sebastián analizará todos los archivos (.pdf, .docx, .txt) como en Claude Cowork.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePickDirectoryNative()
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c9a84c] to-[#997828] text-black font-semibold text-xs transition-transform hover:scale-[1.02] shadow-md flex items-center gap-1.5"
                    >
                      <Folder size={14} />
                      <span>Seleccionar Carpeta Completa</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePickMultiFiles()
                      }}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/15 transition-transform hover:scale-[1.02] flex items-center gap-1.5"
                    >
                      <Layers size={14} className="text-[#c9a84c]" />
                      <span>O Seleccionar Varios Archivos Juntos</span>
                    </button>
                  </div>
                </div>

                {/* Benefits / Info */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <Layers size={14} className="text-[#c9a84c] mb-1.5" />
                    <h5 className="text-[11px] font-medium text-white">Análisis Multidocumento</h5>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">
                      Cruza denuncias, actas, peritajes y resoluciones simultáneamente.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <ShieldCheck size={14} className="text-[#c9a84c] mb-1.5" />
                    <h5 className="text-[11px] font-medium text-white">Privacidad Absoluta</h5>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">
                      Tus archivos locales no se alteran ni se comparten con terceros.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02]">
                    <Sparkles size={14} className="text-[#c9a84c] mb-1.5" />
                    <h5 className="text-[11px] font-medium text-white">Citas con Folios</h5>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">
                      Sebastián cita el nombre del escrito y número de foja en sus respuestas.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hidden directory input fallback */}
            <input
              ref={folderInputRef}
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleInputChange}
            />
            {/* Hidden multi-files input */}
            <input
              ref={multiFileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleMultiFilesChange}
            />
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 bg-[#181818] flex items-center justify-between">
            <span className="text-[11px] text-white/40">
              Compatible con Google Chrome, Microsoft Edge, Opera y Brave.
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
