import type { Config } from 'tailwindcss';

// Colors are driven by CSS variables in src/styles/theme.css, so the whole
// look (light + night mode) can be re-skinned from one file.
const color = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        // Portrait phones. Keep in sync with PHONE_QUERY in src/hooks/useMediaQuery.ts
        phone: { raw: '(max-width: 639px) and (orientation: portrait)' },
      },
      colors: {
        base: color('base'),
        surface: color('surface'),
        panel: color('panel'),
        line: color('line'),
        ink: color('ink'),
        muted: color('muted'),
        brand: { DEFAULT: color('brand'), bright: color('brand-bright') },
        vacant: { DEFAULT: color('vacant'), bright: color('vacant-bright') },
        occupied: { DEFAULT: color('occupied'), bright: color('occupied-bright') },
        overdue: { DEFAULT: color('overdue'), bright: color('overdue-bright') },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // "Key-cap" look of the room buttons
        'key-vacant': '0 5px 0 #24432e, 0 10px 18px rgba(0,0,0,.28)',
        'key-occupied': '0 5px 0 #5a3a12, 0 10px 18px rgba(0,0,0,.28)',
        'key-overdue': '0 5px 0 #612420, 0 10px 18px rgba(0,0,0,.28)',
        'key-pressed': '0 1px 0 rgba(0,0,0,.3), 0 3px 8px rgba(0,0,0,.25)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(8px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        toast: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        rise: 'rise .22s cubic-bezier(.2,.7,.3,1) both',
        toast: 'toast .25s cubic-bezier(.2,.7,.3,1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
