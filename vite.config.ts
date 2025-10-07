import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  // Check if SSL certificates exist
  const httpsConfig = fs.existsSync('./ssl/server.crt') && fs.existsSync('./ssl/server.key') ? {
    key: fs.readFileSync('./ssl/server.key'),
    cert: fs.readFileSync('./ssl/server.crt')
  } : false
  
  return {
    plugins: [react()],
    server: {
      host: '48.216.181.122', // Use VM public IP
      port: 5173,
      strictPort: true,
      https: httpsConfig, // Enable HTTPS if certificates exist
      cors: true,
      proxy: {
        // Proxy API requests to backend services
        '/api/whisper': {
          target: 'https://48.216.181.122:443',
          changeOrigin: true,
          secure: false, // Allow self-signed certificates
          rewrite: (path) => path.replace(/^\/api\/whisper/, '/api/whisper')
        },
        '/api/translation': {
          target: 'https://48.216.181.122:443',
          changeOrigin: true,
          secure: false, // Allow self-signed certificates
          rewrite: (path) => path.replace(/^\/api\/translation/, '/api/translation')
        }
      }
    },
    define: {
      // Make environment variables available to the app
      // Ollama runs locally, no API keys needed
      __HTTPS_ENABLED__: !!httpsConfig
    }
  }
})
