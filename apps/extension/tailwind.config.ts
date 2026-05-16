import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ---- True-black backgrounds -----------------------------------------
        void: {
          DEFAULT: '#000000',
          50: '#05080c',
          100: '#090e15',
          200: '#0e1720',
        },
        // ---- Icy steel-blue (replaces warm purple) ---------------------------
        nebula: {
          DEFAULT: '#4a80a0',
          light: '#8ab8d4',
          dark: '#1e4a68',
          50: '#d4eaf6',
        },
        // ---- Cool arctic teal (replaces warm cyan) ---------------------------
        aurora: {
          DEFAULT: '#2a90b0',
          light: '#5ab4cc',
          dark: '#0a5c78',
        },
        // ---- Moonlight silvers -----------------------------------------------
        moon: {
          DEFAULT: '#c4d8ec',
          bright: '#dceefa',
          glow: '#eaf4ff',
          dim: '#7898b4',
        },
        // ---- Cool-white text ------------------------------------------------
        star: {
          DEFAULT: '#eef4fa',
          muted: '#687888',
          dim: '#2e3e50',
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
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-glow':
          'linear-gradient(135deg, rgba(74,128,160,0.12) 0%, rgba(42,144,176,0.08) 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
