import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// react-quilljs' ESM build ships a runtime `require('quill')` that breaks
// production (Rollup) bundles with "require is not defined". Point the import
// at the CommonJS build via an absolute path (bypasses the package exports
// map); Vite's commonjs interop then transforms the require correctly.
const reactQuilljsCjs = fileURLToPath(
  new URL('./node_modules/react-quilljs/lib/index.js', import.meta.url)
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'react-quilljs': reactQuilljsCjs,
    },
  },
  server: {
    // Forward API calls to the Express backend during development,
    // so the frontend can use same-origin relative URLs.
    proxy: {
      '/api': 'http://localhost:5050',
    },
  },
})
