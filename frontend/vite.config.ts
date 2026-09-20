import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: false, // 🛡️ Anti-Robo de Código: Impide la descarga o inspección de archivos fuente TypeScript
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        banner: '/*! Hardman. PROPIEDAD INTELECTUAL Y SECRETO INDUSTRIAL PROTEGIDO (C) 2026. Prohibida la copia, ingeniería inversa o extracción no autorizada según Ley N° 30096 y D.L. 822. */',
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-framer': ['framer-motion'],
          'vendor-icons': ['lucide-react'],
          'vendor-docx': ['docx'],
          'vendor-jspdf': ['jspdf'],
        },
      },
    },
  },
})

