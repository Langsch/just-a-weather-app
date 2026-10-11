/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
  },
  test: {
    // Testes que dependem do fuso do "aparelho" rodam sempre no horário de Brasília.
    env: { TZ: 'America/Sao_Paulo' },
  },
})
