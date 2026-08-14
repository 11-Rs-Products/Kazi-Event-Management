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
          800: '#013D34', // Brand Primary
          900: '#0B2521',
          950: '#041311',
        },
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#D4AF37', // Kaziranga Gold Accent
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'kaziranga': '0 10px 30px -10px rgba(1, 61, 52, 0.25)',
        'kaziranga-lg': '0 20px 40px -15px rgba(1, 61, 52, 0.35)',
        'glow': '0 0 20px rgba(45, 212, 191, 0.25)',
      }
    },
  },
  plugins: [],
}
