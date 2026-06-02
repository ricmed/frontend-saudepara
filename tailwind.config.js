/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
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
