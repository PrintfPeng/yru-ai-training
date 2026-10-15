import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev-only: proxy /api to the deployed backend so `npm run dev` can hit
  // real data without needing a local Node server. Points at the current
  // CloudPanel-hosted production (https://aicenter.yru.ac.th). Override with
  // VITE_DEV_API_PROXY in .env.local if you run a local backend or want to
  // target a different environment.
  const apiTarget = env.VITE_DEV_API_PROXY || 'https://aicenter.yru.ac.th'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,   // rewrites Host → target
          secure: false,
          // Browsers attach `Origin: http://localhost:5173` on writes (POST/
          // PATCH/DELETE) and on CORS preflights. The backend CORS whitelist
          // only knows the prod origin and THROWS (→ HTTP 500) on an unknown
          // one. The `headers` option alone doesn't reliably override an Origin
          // the browser already set, so force it on every proxied request
          // (incl. the OPTIONS preflight) via proxyReq. Dev-only.
          headers: { Origin: apiTarget },
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('origin', apiTarget);
            });
          },
        },
      },
    },
  }
})
