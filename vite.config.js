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
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
