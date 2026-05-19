import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- True-black backgrounds -----------------------------------------
        void: {
          DEFAULT: '#000000',
          50: '#0a0a0f',
          100: '#111118',
          200: '#1a1a24',
          300: '#24242e',
        },
        // ---- Phantom-style purple -------------------------------------------
        nebula: {
          DEFAULT: '#ab9ff2',
          light: '#c4bbf7',
          dark: '#8b7fd4',
          dim: '#6b5faa',
          50: '#e0dbfa',
        },
        // ---- Cool teal accent -----------------------------------------------
        aurora: {
          DEFAULT: '#2a90b0',
          light: '#5ab4cc',
          dark: '#0a5c78',
        },
        // ---- Moonlight silvers -----------------------------------------------
        moon: {
          DEFAULT: '#e0e0e8',
          bright: '#f0f0f5',
          glow: '#ffffff',
          dim: '#6e6e80',
        },
        // ---- Text colors ----------------------------------------------------
        star: {
          DEFAULT: '#f0f0f5',
          muted: '#8888a0',
          dim: '#4a4a5e',
        },
        // ---- Status ---------------------------------------------------------
        success: '#22aa7a',
        warning: '#b89030',
        danger: '#c04860',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'moon-breathe': 'moon-breathe 4s ease-in-out infinite',
        'sparkle-twinkle': 'sparkle-twinkle 2.5s ease-in-out infinite',
        'orbit': 'orbit 8s linear infinite',
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
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        'moon-breathe': {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', filter: 'drop-shadow(0 0 20px rgba(171,159,242,0.3))' },
          '50%': { transform: 'translateY(-6px) scale(1.02)', filter: 'drop-shadow(0 0 40px rgba(171,159,242,0.6))' },
        },
        'sparkle-twinkle': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        'orbit': {
          '0%': { transform: 'rotate(0deg) translateX(40px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(40px) rotate(-360deg)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-glow':
          'linear-gradient(135deg, rgba(171,159,242,0.12) 0%, rgba(139,127,212,0.08) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
