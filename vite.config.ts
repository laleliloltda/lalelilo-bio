/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// Site estático publicado no GitHub Pages (bio.lalelilo.com.br): tudo servido a partir da raiz.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { port: 5180 },
  preview: { port: 4180 },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: false },
})
