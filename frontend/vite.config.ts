import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    proxy: mode === 'development' ? {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    } : undefined,
  },
}))
