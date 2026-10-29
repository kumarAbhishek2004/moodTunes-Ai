/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#060B10', // Deepest background
          900: '#0A1118', // Surface background
          850: '#0F1822', // Card background
          800: '#14202D', // Elevated surface
          700: '#1E2F42', // Borders & divider lines
          600: '#2A3F56', // Subtle inactive icons
        },
        cyan: {
          DEFAULT: '#00F2FE',
          glow: '#4FACFE',
          dim: '#00B4D8',
        },
        mint: {
          DEFAULT: '#10B981',
          glow: '#34D399',
          dim: '#059669',
        },
        amber: {
          DEFAULT: '#F59E0B',
          glow: '#FBBF24',
          analog: '#D97706',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -4px rgba(0, 242, 254, 0.35)',
        'glow-mint': '0 0 25px -4px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.35)',
        'glow-card': '0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'equalizer-1': 'equalizer 1.2s ease-in-out infinite alternate',
        'equalizer-2': 'equalizer 0.8s ease-in-out infinite alternate',
        'equalizer-3': 'equalizer 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        equalizer: {
          '0%': { height: '20%' },
          '100%': { height: '100%' },
        },
      },
    },
  },
  plugins: [],
}
