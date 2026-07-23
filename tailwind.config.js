/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── LEGACY DESIGN TOKENS (preserved for backward compatibility) ──
        primary: {
          DEFAULT: '#49000a',
          container: '#6b0f1a',
          on: '#ffffff',
          'on-container': '#f4777a',
          fixed: '#ffdad9',
          'fixed-dim': '#ffb3b2',
          'on-fixed': '#410008',
          'on-fixed-variant': '#84232a',
          inverse: '#ffb3b2',
        },
        secondary: {
          DEFAULT: '#735c00',
          container: '#fed65b',
          on: '#ffffff',
          'on-container': '#745c00',
          fixed: '#ffe088',
          'fixed-dim': '#e9c349',
          'on-fixed': '#241a00',
          'on-fixed-variant': '#574500',
        },
        tertiary: {
          DEFAULT: '#202020',
          container: '#353535',
          on: '#ffffff',
          'on-container': '#9f9d9d',
          fixed: '#e5e2e1',
          'fixed-dim': '#c8c6c5',
          'on-fixed': '#1c1b1b',
          'on-fixed-variant': '#474746',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          on: '#ffffff',
          'on-container': '#93000a',
        },
        surface: {
          DEFAULT: '#f8f9fa',
          dim: '#d9dadb',
          bright: '#f8f9fa',
          tint: '#a43a3f',
          variant: '#e1e3e4',
          'on-variant': '#564241',
          container: {
            lowest: '#ffffff',
            low: '#f3f4f5',
            DEFAULT: '#edeeef',
            high: '#e7e8e9',
            highest: '#e1e3e4',
          },
        },
        background: '#FAF8F7',
        'on-background': '#191c1d',
        'on-surface': '#191c1d',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        outline: {
          DEFAULT: '#8a7171',
          variant: '#ddc0bf',
        },

        // ── WINE PALETTE (Landing Page Design Language) ──────────────────
        wine: {
          DEFAULT: '#8B1E3F',
          dark:    '#6E1732',
          medium:  '#A62E52',
          rose:    '#C94F7C',
          light:   '#F2D0DA',
          50:      '#FDF0F4',
          100:     '#FAD9E3',
          200:     '#F2A8BF',
          300:     '#E87099',
          400:     '#D94977',
          500:     '#C94F7C',
          600:     '#A62E52',
          700:     '#8B1E3F',
          800:     '#6E1732',
          900:     '#4A0E21',
        },
        champagne: {
          DEFAULT: '#F7EFEA',
          warm:    '#FFFCFA',
          light:   '#FAF8F7',
        },
        'warm-white': '#FFFCFA',
        'light-bg':   '#FAF8F7',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['"Bricolage Grotesque"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        sm: '0.25rem',   // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem',   // 12px
        lg: '1rem',      // 16px
        xl: '1.5rem',    // 24px
        '2xl': '2rem',   // 32px
        '3xl': '2.5rem', // 40px
      },
      spacing: {
        base: '4px',
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '40px',
        xl: '64px',
        'container-max': '1440px',
        gutter: '24px',
      },
      boxShadow: {
        // Legacy
        'bento-active': '0 10px 30px -10px rgba(107,15,26,0.15)',
        // Wine shadows
        'wine-sm':    '0 2px 8px -2px rgba(139,30,63,0.12)',
        'wine-md':    '0 8px 24px -8px rgba(139,30,63,0.20)',
        'wine-lg':    '0 16px 48px -12px rgba(139,30,63,0.24)',
        'wine-glow':  '0 0 0 3px rgba(139,30,63,0.15), 0 8px 32px -8px rgba(139,30,63,0.28)',
        'card':       '0 1px 3px rgba(139,30,63,0.06), 0 8px 24px -8px rgba(139,30,63,0.10)',
        'card-hover': '0 4px 16px -4px rgba(139,30,63,0.18), 0 20px 48px -12px rgba(139,30,63,0.16)',
        'navbar':     '0 1px 0 rgba(139,30,63,0.08), 0 4px 24px -4px rgba(139,30,63,0.08)',
        'sidebar':    '4px 0 32px -4px rgba(139,30,63,0.12)',
        'float':      '0 8px 40px -8px rgba(139,30,63,0.20)',
        'modal':      '0 24px 80px -12px rgba(139,30,63,0.22)',
      },
      backdropBlur: {
        bento: '20px',
        xs: '4px',
        sm: '8px',
      },
      backgroundImage: {
        'wine-gradient':      'linear-gradient(135deg, #8B1E3F 0%, #6E1732 100%)',
        'wine-gradient-r':    'linear-gradient(135deg, #A62E52 0%, #8B1E3F 100%)',
        'rose-gradient':      'linear-gradient(135deg, #A62E52 0%, #C94F7C 100%)',
        'champagne-gradient': 'linear-gradient(135deg, #F7EFEA 0%, #FFFCFA 100%)',
        'admin-hero':         'radial-gradient(ellipse at top right, rgba(201,79,124,0.07) 0%, transparent 60%), radial-gradient(ellipse at bottom left, rgba(139,30,63,0.05) 0%, transparent 60%)',
        'sidebar-active':     'linear-gradient(90deg, rgba(139,30,63,0.12) 0%, rgba(139,30,63,0.06) 100%)',
        'shimmer':            'linear-gradient(90deg, transparent 0%, rgba(139,30,63,0.06) 50%, transparent 100%)',
      },
      animation: {
        'fade-in':       'fadeIn 0.4s ease-out',
        'slide-up':      'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'scale-in':      'scaleIn 0.25s ease-out',
        'glow-pulse':    'glowPulse 2.5s ease-in-out infinite',
        'shimmer':       'shimmer 1.8s infinite',
        'float':         'float 6s ease-in-out infinite',
        'counter':       'counter 1.5s ease-out',
        'spin-slow':     'spin 4s linear infinite',
      },
      keyframes: {
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:     { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-20px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:     { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(139,30,63,0.0)' },
          '50%':      { boxShadow: '0 0 20px 4px rgba(139,30,63,0.18)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        counter: {
          from: { opacity: 0, transform: 'scale(0.8)' },
          to:   { opacity: 1, transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
