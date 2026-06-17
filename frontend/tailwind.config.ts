import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette — green-forward
        quillio: {
          950: '#0B3D2E',
          900: '#064E3B',
          800: '#065F46',
          700: '#047857',
          600: '#16A34A',
          500: '#10B981',
          400: '#34D399',
          300: '#6EE7B7',
          200: '#A7F3D0',
          100: '#D1FAE5',
          50:  '#ECFDF5',
          lime: '#A3E635',
          'lime-soft': '#D9F99D',
        },
        // Dark mode surfaces
        dark: {
          bg:      '#0A0F0D',
          surface: '#0F1A15',
          card:    '#142019',
          elevated:'#1A2B20',
          border:  'rgba(255,255,255,0.07)',
          'border-strong': 'rgba(255,255,255,0.14)',
        },
        // Light mode surfaces
        light: {
          bg:      '#F8FAF9',
          surface: '#FFFFFF',
          card:    '#F0FBF5',
          elevated:'#FFFFFF',
          border:  'rgba(0,0,0,0.07)',
          'border-strong': 'rgba(0,0,0,0.14)',
        },
        // Semantic — used in charts, tags, and icons
        income:     '#10B981',
        expense:    '#F87171',
        saving:     '#14B8A6',
        investment: '#F59E0B',
      },
      fontFamily: {
        display: ['Satoshi', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        // Display scale
        'display-2xl': ['4.5rem',  { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-xl':  ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg':  ['3rem',    { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'display-md':  ['2.25rem', { lineHeight: '1.2',  letterSpacing: '-0.01em' }],
        'display-sm':  ['1.875rem',{ lineHeight: '1.25' }],
      },
      backgroundImage: {
        'mesh-dark': `
          radial-gradient(ellipse at 0% 0%,   #0B3D2E 0%, transparent 55%),
          radial-gradient(ellipse at 100% 0%,  #064E3B 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, #10B981 0%, transparent 40%)
        `,
        'mesh-light': `
          radial-gradient(ellipse at 0% 0%,   #D1FAE5 0%, transparent 55%),
          radial-gradient(ellipse at 100% 0%,  #A7F3D0 0%, transparent 50%),
          radial-gradient(ellipse at 50% 100%, #6EE7B7 0%, transparent 40%)
        `,
        'glow-green': 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glass':      '0 4px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1)',
        'glass-sm':   '0 2px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)',
        'green-glow': '0 0 40px rgba(16,185,129,0.25), 0 0 80px rgba(16,185,129,0.1)',
        'green-sm':   '0 0 20px rgba(16,185,129,0.2)',
        'card':       '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      },
      animation: {
        'float':     'float 6s ease-in-out infinite',
        'fade-up':   'fade-up 0.5s ease-out both',
        'fade-in':   'fade-in 0.4s ease-out both',
        'scale-in':  'scale-in 0.3s ease-out both',
        'shimmer':   'shimmer 2s linear infinite',
        'mesh-drift':'mesh-drift 12s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-12px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'mesh-drift': {
          '0%':   { backgroundSize: '100% 100%' },
          '50%':  { backgroundSize: '110% 110%' },
          '100%': { backgroundSize: '105% 105%' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
