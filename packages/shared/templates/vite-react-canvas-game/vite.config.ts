import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['localhost', '.ngrok-free.dev', '.trycloudflare.com'],
    hmr: { overlay: false }
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
})