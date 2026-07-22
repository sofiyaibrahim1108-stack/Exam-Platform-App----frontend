/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core design system colors from DESIGN.md
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
        background: '#f8f9fa',
        'on-background': '#191c1d',
        'on-surface': '#191c1d',
        'inverse-surface': '#2e3132',
        'inverse-on-surface': '#f0f1f2',
        outline: {
          DEFAULT: '#8a7171',
          variant: '#ddc0bf',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '0.25rem', // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.75rem', // 12px
        lg: '1rem', // 16px
        xl: '1.5rem', // 24px
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
        // ambient shadows tinted with primary Maroon
        'bento-active': '0 10px 30px -10px rgba(107, 15, 26, 0.15)',
      },
      backdropBlur: {
        bento: '20px',
      },
    },
  },
  plugins: [],
}
