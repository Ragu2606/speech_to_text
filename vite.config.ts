import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Allow external connections
      port: 5173,
      strictPort: true,
    },
    define: {
      // Make environment variables available to the app
      // Ollama runs locally, no API keys needed
    }
  }
})
