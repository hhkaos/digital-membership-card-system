import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/issuer/',
  plugins: [react()],
  server: {
    port: 5174,
  },
  test: {
    environment: 'node',
  },
})
