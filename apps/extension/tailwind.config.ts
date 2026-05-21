import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Deep cosmic backgrounds ----------------------------------------
        void: {
          DEFAULT: '#000000',
          50: '#09090b',  // zinc-950
          100: '#18181b', // zinc-900
          200: '#27272a', // zinc-800
          300: '#3f3f46', // zinc-700
        },
        // ---- Moon Surface (primary UI accent) -------------------------------
        moon: {
          DEFAULT: '#d4d4d8', // zinc-300
          light: '#f4f4f5',   // zinc-100
          dark: '#71717a',    // zinc-500
          dim: '#52525b',     // zinc-600
          50: '#a1a1aa',      // zinc-400
        },
        // ---- Text colors ----------------------------------------------------
        star: {
          DEFAULT: '#ffffff',
          muted: '#a1a1aa',   // zinc-400
          dim: '#71717a',     // zinc-500
        },
        // ---- Status ---------------------------------------------------------
        success: '#22aa7a',
        warning: '#d4a840',
        danger: '#c04860',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'moon-breathe': 'moon-breathe 4.5s ease-in-out infinite',
        'sparkle-twinkle': 'sparkle-twinkle 2.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
        'moon-breathe': {
          '0%, 100%': {
            transform: 'translateY(0px) rotate(0deg)',
            filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.15)) drop-shadow(0 0 20px rgba(212,212,216,0.10))',
          },
          '50%': {
            transform: 'translateY(-8px) rotate(2deg)',
            filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.25)) drop-shadow(0 0 40px rgba(212,212,216,0.15))',
          },
        },
        'sparkle-twinkle': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.6)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
