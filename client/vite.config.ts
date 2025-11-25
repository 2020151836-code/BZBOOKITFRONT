import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to the backend
      '/api': {
        target: 'http://localhost:3000', // Your main backend server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Add a new proxy rule for the notification service
      '/notify-api': {
        target: 'http://localhost:3001', // Your notification microservice
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/notify-api/, ''), // Remove the prefix
      },
    },
  },
})