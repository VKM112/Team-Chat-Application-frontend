import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 10000,
    allowedHosts: [
      'team-chat-application-frontend.onrender.com',
      '.onrender.com'
    ]
  }
})
