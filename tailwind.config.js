/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        // Primary brand palette — blues and greens, calm and hopeful.
        ink: {
          50: '#f4f6fb',
          100: '#e5e9f4',
          200: '#c6cfe6',
          300: '#98a7cf',
          400: '#6579b0',
          500: '#455a91',
          600: '#334477',
          700: '#293761',
          800: '#1c2745',
          900: '#12182e',
        },
        glow: {
          50: '#eff8ff',
          100: '#dbeefe',
          200: '#bfe2fe',
          300: '#93cffd',
          400: '#5fb5fa',
          500: '#3b9df0',
          600: '#237fd0',
          700: '#1e66aa',
          800: '#1f568c',
          900: '#1d4974',
        },
        calm: {
          50: '#eefbfa',
          100: '#d3f4f1',
          200: '#a9e8e3',
          300: '#75d6d0',
          400: '#3fbdb8',
          500: '#279e9c',
          600: '#1e7f7e',
          700: '#1e6564',
          800: '#1e5150',
          900: '#1c4443',
        },
        care: {
          50: '#eefbef',
          100: '#d5f5d8',
          200: '#aeeab4',
          300: '#7bd884',
          400: '#4cbf59',
          500: '#31a33d',
          600: '#25812f',
          700: '#216629',
          800: '#1f5124',
          900: '#1b4320',
        },
        warm: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#b7dbff',
          300: '#86c1ff',
          400: '#4f9fff',
          500: '#2a7dff',
          600: '#1660e0',
          700: '#124bb0',
          800: '#123f8e',
          900: '#133674',
        },
        cream: '#f5faf9',
        // Ember — the companion's warm light against the cool palette.
        ember: {
          50: '#fff8ec',
          100: '#ffedc7',
          200: '#ffd98a',
          300: '#ffc04d',
          400: '#ffa424',
          500: '#f9860b',
          600: '#dd6306',
          700: '#b74409',
          800: '#94350f',
          900: '#7a2d10',
        },
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #237fd0 0%, #3fbdb8 50%, #4cbf59 100%)',
        'brand-gradient-cool':
          'linear-gradient(135deg, #12182e 0%, #1e7f7e 55%, #3b9df0 100%)',
        'brand-gradient-deep':
          'linear-gradient(135deg, #12182e 0%, #1e5150 55%, #123f8e 100%)',
      },
      boxShadow: {
        'brand-glow': '0 20px 60px -20px rgba(59, 157, 240, 0.45)',
        'calm-glow': '0 20px 60px -20px rgba(39, 158, 156, 0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slow-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.55' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '45%': { opacity: '0.75' },
          '50%': { opacity: '0.9' },
          '55%': { opacity: '0.7' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.55' },
          '50%': { transform: 'scale(1.12)', opacity: '0.85' },
        },
        flame: {
          '0%, 100%': { transform: 'scaleY(1) translateY(0)' },
          '30%': { transform: 'scaleY(1.04) translateY(-1px)' },
          '60%': { transform: 'scaleY(0.97) translateY(0.5px)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
        'dot-pulse': {
          '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '40%': { opacity: '1', transform: 'translateY(-2px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'slow-pulse': 'slow-pulse 8s ease-in-out infinite',
        flicker: 'flicker 4s ease-in-out infinite',
        breathe: 'breathe 6s ease-in-out infinite',
        flame: 'flame 3.2s ease-in-out infinite',
        sway: 'sway 5s ease-in-out infinite',
        'dot-pulse': 'dot-pulse 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
