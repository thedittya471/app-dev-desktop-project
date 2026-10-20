import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Electron loads this exact URL, so fail instead of picking another port
  server: { port: 5173, strictPort: true },
})
