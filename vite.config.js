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
        changeOrigin: true,
        // The rewrite rule was incorrect and has been removed.
        // This will now correctly forward /api/... to https://enka.network/api/...
      },
    },
  },
})