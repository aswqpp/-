import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// Phase 1: only the art sheet page exists. The game entry (index.html) and the
// PWA plugin are added in Phase 2/3.
export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5190, strictPort: true },
  preview: { host: '127.0.0.1', port: 5191, strictPort: true },
  build: {
    rollupOptions: {
      input: { sheet: resolve(__dirname, 'dev/sheet.html') },
    },
  },
})
