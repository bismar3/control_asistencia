import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Backend Django al que el servidor de desarrollo reenvía /graphql/.
  // Se usa 127.0.0.1 (y no "localhost") porque runserver escucha solo en IPv4.
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  const proxy = {
    '/graphql': { target: backendUrl, changeOrigin: true },
    '/media': { target: backendUrl, changeOrigin: true },
  }

  return {
    plugins: [react()],

    css: {
      // Lightning CSS: anidamiento nativo, prefijos automáticos (backdrop-filter en Safari),
      // reducción de sintaxis moderna según los navegadores objetivo y CSS Modules.
      transformer: 'lightningcss',
      lightningcss: {
        targets: browserslistToTargets(browserslist('defaults')),
        cssModules: {
          pattern: '[local]_[hash]',
          // Los @keyframes viven en styles/animations.css y se comparten entre módulos.
          animation: false,
          grid: false,
          container: false,
        },
      },
      devSourcemap: true,
    },

    build: {
      cssMinify: 'lightningcss',
      chunkSizeWarningLimit: 800,
    },

    server: { port: 5173, proxy },
    preview: { port: 4173, proxy },
  }
})
