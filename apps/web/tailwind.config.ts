// apps/web/tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Alice in Wonderland palette
        alice: {
          blue: '#7EC8E3',
          gold: '#D4AF37',
          pink: '#FFB6C1',
          purple: '#9B59B6',
          teal: '#008080',
        },
        // Psychedelic accents
        psyche: {
          pink: '#FF6B9D',
          purple: '#C471ED',
          blue: '#12C2E9',
          green: '#A8E6CF',
          orange: '#F38181',
        },
        // Cheshire colors
        cheshire: {
          pink: '#FF69B4',
          purple: '#8B008B',
          grin: '#FFD700',
        },
        wonderland: {
          bg: '#0D0D1A',
          card: '#1A1A2E',
          text: '#E8E8F0',
          muted: '#8888AA',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        whimsy: ['var(--font-whimsy)', 'cursive'],
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'color-shift': 'colorShift 10s ease infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'shrink': 'shrink 1.5s ease-in-out forwards',
        'fall': 'fall 2s ease-in forwards',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(126, 200, 227, 0.5)' },
          '100%': { boxShadow: '0 0 40px rgba(126, 200, 227, 0.8)' },
        },
        colorShift: {
          '0%, 100%': { filter: 'hue-rotate(0deg)' },
          '50%': { filter: 'hue-rotate(30deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shrink: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.1)' },
        },
        fall: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(100vh)', opacity: '1' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-psychedelic': 'linear-gradient(135deg, var(--psyche-pink), var(--psyche-purple), var(--psyche-blue))',
        'checkerboard': 'repeating-conic-gradient(#1A1A2E 0% 25%, #0D0D1A 0% 50%)',
      },
    },
  },
  plugins: [],
}

export default config
