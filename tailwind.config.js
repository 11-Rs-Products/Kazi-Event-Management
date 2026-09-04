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
        /* ─────────────────────────────────────────────
           Legacy brand scales — retained so pages that
           have not yet been migrated keep rendering.
           ───────────────────────────────────────────── */
        kaziranga: {
          50: '#F0FDF9',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#025A4D',
          800: '#013D34',
          900: '#0B2521',
          950: '#041311',
        },
        cream: {
          50: '#FEFDFB',
          100: '#FBF9F3',
          200: '#F5F0E8',
          300: '#F5F4DC',
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
          600: '#D4AF37',
        },
        arena: {
          bg: '#F5F0E8',
          surface: '#FEFDFB',
          'surface-alt': '#F5F4DC',
          muted: '#E8E4CC',
        },

        /* ─────────────────────────────────────────────
           Editorial system — semantic, theme-aware.
           Driven by the CSS variables in globals.css so
           a single token works in both light and dark.
           ───────────────────────────────────────────── */
        stage: {
          DEFAULT: '#050D0B',   // deepest dramatic ground
          900: '#08110F',
          800: '#0C1A16',
          700: '#12251F',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
          invert: 'rgb(var(--ink-invert) / <alpha-value>)',
        },
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
          overlay: 'rgb(var(--surface-overlay) / <alpha-value>)',
          tint: 'rgb(var(--surface-tint) / <alpha-value>)',
        },
        hairline: {
          DEFAULT: 'rgb(var(--hairline) / <alpha-value>)',
          strong: 'rgb(var(--hairline-strong) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          soft: 'rgb(var(--brand-soft) / <alpha-value>)',
          contrast: 'rgb(var(--brand-contrast) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          soft: 'rgb(var(--accent-soft) / <alpha-value>)',
          contrast: 'rgb(var(--accent-contrast) / <alpha-value>)',
        },
        signal: {
          live: 'rgb(var(--signal-live) / <alpha-value>)',
          warn: 'rgb(var(--signal-warn) / <alpha-value>)',
          danger: 'rgb(var(--signal-danger) / <alpha-value>)',
          info: 'rgb(var(--signal-info) / <alpha-value>)',
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-outfit)', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },

      /* Fluid editorial scale. Body never drops below 13px. */
      fontSize: {
        eyebrow: ['0.6875rem', { lineHeight: '1', letterSpacing: '0.2em', fontWeight: '700' }],
        micro: ['0.75rem', { lineHeight: '1.4' }],
        caption: ['0.8125rem', { lineHeight: '1.5' }],
        body: ['0.9375rem', { lineHeight: '1.65' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.7' }],
        'title-sm': ['1.0625rem', { lineHeight: '1.35', letterSpacing: '-0.01em' }],
        title: ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        'title-lg': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.5rem, 1.1rem + 1.6vw, 2rem)', { lineHeight: '1.15', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(1.875rem, 1.2rem + 2.8vw, 2.75rem)', { lineHeight: '1.08', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.25rem, 1.2rem + 4.4vw, 3.75rem)', { lineHeight: '1.02', letterSpacing: '-0.035em' }],
        'display-xl': ['clamp(2.75rem, 1rem + 7vw, 5.5rem)', { lineHeight: '0.96', letterSpacing: '-0.04em' }],
      },

      letterSpacing: {
        eyebrow: '0.2em',
        wider: '0.08em',
      },

      boxShadow: {
        kaziranga: '0 10px 30px -10px rgba(1, 61, 52, 0.25)',
        'kaziranga-lg': '0 20px 40px -15px rgba(1, 61, 52, 0.35)',
        glow: '0 0 20px rgba(45, 212, 191, 0.25)',
        'glow-red': '0 0 20px rgba(200, 16, 46, 0.2)',
        'glow-gold': '0 0 20px rgba(212, 175, 55, 0.25)',
        arena: '0 1px 3px rgba(1, 61, 52, 0.06), 0 4px 12px rgba(1, 61, 52, 0.04)',
        'arena-hover': '0 4px 16px rgba(1, 61, 52, 0.1), 0 8px 32px rgba(1, 61, 52, 0.06)',
        'arena-lg': '0 8px 30px rgba(1, 61, 52, 0.12), 0 16px 48px rgba(1, 61, 52, 0.06)',

        /* Editorial elevation — one coherent ramp */
        'e-1': 'var(--elev-1)',
        'e-2': 'var(--elev-2)',
        'e-3': 'var(--elev-3)',
        'e-4': 'var(--elev-4)',
        'inset-hairline': 'inset 0 0 0 1px rgb(var(--hairline))',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out-soft': 'cubic-bezier(0.65, 0, 0.35, 1)',
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
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'marquee-x': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'live-ping': {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '80%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },

      animation: {
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'marquee-x': 'marquee-x 38s linear infinite',
        'live-ping': 'live-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
}
