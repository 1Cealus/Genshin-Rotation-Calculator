import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy requests from /api to enka.network
      '/api': {
        target: 'https://enka.network',
        changeOrigin: true, // Needed for virtual hosted sites
        rewrite: (path) => path.replace(/^\/api/, ''), // Rewrite the path, removing /api
      },
    },
  },
})