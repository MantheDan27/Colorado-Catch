import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Electron loads files from disk, so assets must use relative paths
  base: process.env.ELECTRON ? './' : '/',
})
