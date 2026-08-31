import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        hm: {
          bg: '#111111',
          bg2: '#1a1a1a',
          bg3: '#222222',
          bg4: '#2a2a2a',
          border: '#2a2a2a',
          border2: '#333333',
          gold: '#c9a84c',
          'gold-d': 'rgba(201,168,76,0.10)',
          'gold-m': 'rgba(201,168,76,0.25)',
          white: '#ffffff',
          w60: 'rgba(255,255,255,0.60)',
          w30: 'rgba(255,255,255,0.30)',
          w10: 'rgba(255,255,255,0.07)',
          green: '#34d17a',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        xl: '14px',
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
      boxShadow: {
        'gold': '0 0 0 3px rgba(201,168,76,0.08)',
        'gold-glow': '0 0 25px rgba(201,168,76,0.15)',
        'card-hover': '0 20px 52px rgba(0,0,0,0.55)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-dot': 'pulse-dot 2s infinite',
        'gold-pulse': 'gold-pulse 3s infinite ease-in-out',
        'fadeUp': 'fadeUp 0.5s ease-out both',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(0.8)' },
        },
        'gold-pulse': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [animate],
}

export default config
