import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- Deep cosmic backgrounds ----------------------------------------
        void: {
          DEFAULT: '#000000',
          50: '#08081a',
          100: '#0e0e22',
          200: '#16162c',
          300: '#1e1e36',
        },
        // ---- Purple (primary UI accent) -------------------------------------
        nebula: {
          DEFAULT: '#ab9ff2',
          light: '#c4bbf7',
          dark: '#8b7fd4',
          dim: '#6b5faa',
          50: '#e0dbfa',
        },
        // ---- Moonlight colors (for moon animation only) ----------------------
        luna: {
          DEFAULT: '#f0e8c8',
          light: '#fff8e8',
          warm: '#ffe4b0',
          glow: '#fffdf4',
          dim: '#c8c0a0',
        },
        // ---- Cool teal accent -----------------------------------------------
        aurora: {
          DEFAULT: '#2a90b0',
          light: '#5ab4cc',
          dark: '#0a5c78',
        },
        // ---- Text colors ----------------------------------------------------
        star: {
          DEFAULT: '#f5f0ff',
          muted: '#908898',
          dim: '#4e4660',
        },
        // ---- Status ---------------------------------------------------------
        success: '#22aa7a',
        warning: '#d4a840',
        danger: '#c04860',
      },
      fontFamily: {
        display: ['Bangers', 'cursive'],
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
            filter: 'drop-shadow(0 0 15px rgba(255,248,232,0.30)) drop-shadow(0 0 30px rgba(240,232,200,0.15))',
          },
          '50%': {
            transform: 'translateY(-10px) rotate(3deg)',
            filter: 'drop-shadow(0 0 35px rgba(255,248,232,0.55)) drop-shadow(0 0 60px rgba(240,232,200,0.30))',
          },
        },
        'sparkle-twinkle': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.6)' },
          '50%': { opacity: '1', transform: 'scale(1.3)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-glow':
          'linear-gradient(135deg, rgba(171,159,242,0.12) 0%, rgba(139,127,212,0.06) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
