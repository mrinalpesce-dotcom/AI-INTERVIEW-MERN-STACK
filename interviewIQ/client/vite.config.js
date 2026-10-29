import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function syncPublishDirs() {
  return {
    name: 'sync-publish-dirs',
    closeBundle() {
      const clientDist = path.resolve(__dirname, 'dist')
      const clientDotDist = path.resolve(__dirname, '.dist')
      const rootDist = path.resolve(__dirname, '../../dist')
      const rootDotDist = path.resolve(__dirname, '../../.dist')

      if (fs.existsSync(clientDist)) {
        try {
          fs.cpSync(clientDist, clientDotDist, { recursive: true, force: true })
        } catch (e) {
          console.warn('Could not copy to client .dist:', e)
        }
        try {
          fs.cpSync(clientDist, rootDist, { recursive: true, force: true })
        } catch (_) {}
        try {
          fs.cpSync(clientDist, rootDotDist, { recursive: true, force: true })
        } catch (_) {}
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), syncPublishDirs()],
  build: {
    chunkSizeWarningLimit: 1600
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // Forward cookies to/from the backend
        cookieDomainRewrite: 'localhost'
      }
    }
  }
})
