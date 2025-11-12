/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        accent: '#38bdf8',
        accentMuted: '#0ea5e9',
      },
      boxShadow: {
        glow: '0 0 25px rgba(56, 189, 248, 0.35)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '60%': { transform: 'scale(1.05)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        pulseHighlight: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(56, 189, 248, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(56, 189, 248, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        pop: 'pop 180ms ease-out forwards',
        pulseHighlight: 'pulseHighlight 1.5s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
      },
    },
  },
  plugins: [],
}

