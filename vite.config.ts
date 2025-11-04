import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno del directorio actual
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    // Define un objeto global para reemplazar `import.meta.env`
    // Esto inyecta las variables de entorno de forma más explícita durante la compilación
    define: {
      'importMetaEnv': JSON.stringify(env)
    }
  }
});
