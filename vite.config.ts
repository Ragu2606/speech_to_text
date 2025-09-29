import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      // Make environment variables available to the app
      'process.env.VITE_CHATGPT_API_KEY': JSON.stringify(env.VITE_CHATGPT_API_KEY),
      'process.env.VITE_OPENAI_BASE_URL': JSON.stringify(env.VITE_OPENAI_BASE_URL),
      'process.env.VITE_CHATGPT_MODEL': JSON.stringify(env.VITE_CHATGPT_MODEL),
    }
  }
})
