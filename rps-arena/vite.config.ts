import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// `npm run dev` serves the client; /api (incl. WebSockets) is proxied to
// `npm run dev:worker` on :8787, which runs the Worker + room Durable Object.
export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8787', ws: true, changeOrigin: true },
    },
  },
});
