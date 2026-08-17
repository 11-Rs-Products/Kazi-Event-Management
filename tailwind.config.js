/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kaziranga: {
          50: '#F0FDF9',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#025A4D',
          800: '#013D34', // Brand Primary — Deep Kaziranga Teal
          900: '#0B2521',
          950: '#041311',
        },
        cream: {
          50: '#FEFDFB',
          100: '#FBF9F3',
          200: '#F5F0E8',
          300: '#F5F4DC', // Brand Warm Cream
          400: '#E8E4CC',
          500: '#D4CEB4',
        },
        rhino: {
          black: '#151515',
          red: '#C8102E',
          'red-light': '#E8334D',
          'red-dark': '#9A0C22',
        },
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#D4AF37', // Kaziranga Gold Accent
        },
        arena: {
          bg: '#F5F0E8',        // Page background
          surface: '#FEFDFB',    // Card surfaces
          'surface-alt': '#F5F4DC', // Alt card surface
          muted: '#E8E4CC',      // Muted backgrounds
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'kaziranga': '0 10px 30px -10px rgba(1, 61, 52, 0.25)',
        'kaziranga-lg': '0 20px 40px -15px rgba(1, 61, 52, 0.35)',
        'glow': '0 0 20px rgba(45, 212, 191, 0.25)',
        'glow-red': '0 0 20px rgba(200, 16, 46, 0.2)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.25)',
        'arena': '0 1px 3px rgba(1, 61, 52, 0.06), 0 4px 12px rgba(1, 61, 52, 0.04)',
        'arena-hover': '0 4px 16px rgba(1, 61, 52, 0.1), 0 8px 32px rgba(1, 61, 52, 0.06)',
        'arena-lg': '0 8px 30px rgba(1, 61, 52, 0.12), 0 16px 48px rgba(1, 61, 52, 0.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      keyframes: {
        'slide-up': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(200, 16, 46, 0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(200, 16, 46, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
