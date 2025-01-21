import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
      "@components": fileURLToPath(new URL('./src/components', import.meta.url)),
      "@pages": fileURLToPath(new URL('./src/pages', import.meta.url)),
      "@hooks": fileURLToPath(new URL('./src/hooks', import.meta.url)),
      "@contexts": fileURLToPath(new URL('./src/contexts', import.meta.url)),
      "@lib": fileURLToPath(new URL('./src/lib', import.meta.url)),
      "@styles": fileURLToPath(new URL('./src/styles', import.meta.url)),
      "./runtimeConfig": "./runtimeConfig.browser",
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
      ],
    },
  }
})
