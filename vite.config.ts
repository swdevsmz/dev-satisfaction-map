import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

function sitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap',
    apply: 'build',
    async closeBundle() {
      try {
        const { generateSitemap } = await import('./scripts/generate-sitemap')
        await generateSitemap()
      } catch (err) {
        console.warn('[sitemap] 生成をスキップしました:', err)
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), sitemapPlugin()],
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          recharts: ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['src/hooks/useCompanyFilter.test.ts'],
  },
})
