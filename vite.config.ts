import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves a project site from https://<user>.github.io/<repo>/, and this
// repo is literally named "-", so the built app lives under /-/ rather than the root.
// Dev/preview stay at "/" so local URLs remain plain.
const PROD_BASE = '/-/'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' ? PROD_BASE : '/'

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'icon.svg'],
        manifest: {
          name: 'ASWQPP - 영단어 학습',
          short_name: 'ASWQPP',
          description: '플래시카드와 간격 반복 복습으로 영단어를 암기하는 학습 앱',
          lang: 'ko',
          // Must sit inside `base`, or the installed app opens outside its own scope.
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f8fafc',
          theme_color: '#4f46e5',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          // The dictionary/translation APIs are best-effort and already degrade to
          // manual entry offline, so they are deliberately not cached here.
          navigateFallback: `${base}index.html`,
        },
        devOptions: {
          // Lets the service worker be exercised with `npm run dev`.
          enabled: true,
          type: 'module',
        },
      }),
    ],
  }
})
