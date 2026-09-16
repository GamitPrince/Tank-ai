/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        well: 'var(--color-well)',
        line: 'var(--color-line)',
        shadow: 'var(--color-shadow)',
        brand: { DEFAULT: '#F37121', bright: '#FF8526', deep: '#C66E16' },
        accent: { light: '#11E4F3', dark: '#01646A' },
        danger: '#D64343',
        success: '#4ECF27',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        handle: 'var(--color-handle)',
      },
      borderRadius: { '2xl': '24px' },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        'soft-lg': 'var(--shadow-soft-lg)',
        inset: 'var(--shadow-inset)',
      },
    },
  },
  plugins: [],
};
