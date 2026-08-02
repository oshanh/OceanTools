/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ocean: {
          950: '#020617',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        neon: {
          cyan: '#22d3ee',
          emerald: '#34d399',
          lime: '#a3e635',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(34, 211, 238, 0.5)',
        'glow-cyan-lg': '0 0 25px rgba(34, 211, 238, 0.6)',
        'glow-emerald': '0 0 15px rgba(52, 211, 153, 0.5)',
        'glow-emerald-lg': '0 0 25px rgba(52, 211, 153, 0.6)',
      },
      backgroundImage: {
        'ocean-gradient':
          'radial-gradient(ellipse at 20% 50%, rgba(34, 211, 238, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(52, 211, 153, 0.06) 0%, transparent 50%)',
        'hero-gradient':
          'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(52, 211, 153, 0.05) 50%, transparent 100%)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
