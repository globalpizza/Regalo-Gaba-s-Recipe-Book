import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
// Fix: Import `process` to provide type definitions for the Node.js global.
import process from 'process'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Expose environment variables to the client.
      // This is crucial for Vercel deployment to access the API key.
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  }
})