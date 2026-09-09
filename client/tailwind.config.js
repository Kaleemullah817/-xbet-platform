/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0e1621',
          card: '#182533',
          border: '#243648',
          accent: '#0088cc',
          neon: '#00e676',
          yellow: '#fbc02d',
          red: '#ff5252',
          textMuted: '#8b9baa',
          inputBg: '#131e2b'
        }
      }
    },
  },
  plugins: [],
}
