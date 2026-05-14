/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8edf3',
          100: '#c5d1e2',
          200: '#9eb3cf',
          300: '#7795bc',
          400: '#5a7ead',
          500: '#3d679f',
          600: '#2f5285',
          700: '#1e3a5f',
          800: '#142742',
          900: '#0a1424',
        },
      },
    },
  },
  plugins: [],
}
