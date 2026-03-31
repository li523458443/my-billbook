import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788', // Pages Functions 默认本地端口
        changeOrigin: true,
      },
    },
  },
})