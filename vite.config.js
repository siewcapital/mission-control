import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    strictPort: true,
    fs: {
      // Allow serving files from parent directory (Siew's Capital)
      allow: ['..']
    }
  },
  build: {
    rollupOptions: {
      // Copy agent_positions.json to dist after build
      output: {
        manualChunks: undefined
      }
    }
  }
})
