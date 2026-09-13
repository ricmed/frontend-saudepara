/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Remapeia blue-* para tokens CSS — troca de paleta via data-palette
        blue: {
          50: 'rgb(var(--sp-blue-50) / <alpha-value>)',
          100: 'rgb(var(--sp-blue-100) / <alpha-value>)',
          200: 'rgb(var(--sp-blue-200) / <alpha-value>)',
          300: 'rgb(var(--sp-blue-300) / <alpha-value>)',
          400: 'rgb(var(--sp-blue-400) / <alpha-value>)',
          500: 'rgb(var(--sp-blue-500) / <alpha-value>)',
          600: 'rgb(var(--sp-blue-600) / <alpha-value>)',
          700: 'rgb(var(--sp-blue-700) / <alpha-value>)',
          800: 'rgb(var(--sp-blue-800) / <alpha-value>)',
          900: 'rgb(var(--sp-blue-900) / <alpha-value>)',
          950: 'rgb(var(--sp-blue-950) / <alpha-value>)',
        },
      },
      keyframes: {
        'form-tab-fade': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'form-tab-fade': 'form-tab-fade 240ms cubic-bezier(0.33, 1, 0.68, 1) forwards',
      },
    },
  },
  plugins: [],
}
