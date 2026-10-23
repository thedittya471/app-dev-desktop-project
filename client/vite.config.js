import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // the packaged app loads dist/index.html from disk, so asset paths must be relative
  // Electron loads this exact URL, so fail instead of picking another port
  server: { port: 5173, strictPort: true },
})
