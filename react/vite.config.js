import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward API calls to the Express backend during development,
    // so the frontend can use same-origin relative URLs.
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
})
