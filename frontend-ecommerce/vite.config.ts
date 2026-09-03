import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const ecommerceProxyTarget = env.VITE_DEV_PROXY_ECOMMERCE_TARGET ?? 'http://localhost:3000'
  const adminProxyTarget = env.VITE_DEV_PROXY_ADMIN_TARGET ?? 'http://localhost:3001'
  const proxy = {
    '/api/v1/admin': {
      target: adminProxyTarget,
      changeOrigin: true,
      secure: false,
    },
    '/api/v1/checkout': {
      target: ecommerceProxyTarget,
      changeOrigin: true,
      secure: false,
    },
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: ['.ngrok-free.app', '.ngrok.app'],
      proxy,
    },
    preview: {
      proxy,
    },
    resolve: {
      alias: {
        '@domain': path.resolve(__dirname, 'src/domain'),
        '@application': path.resolve(__dirname, 'src/application'),
        '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
        '@presentation': path.resolve(__dirname, 'src/presentation'),
        '@shared': path.resolve(__dirname, 'src/shared'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/tests/setup.ts',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**', 'coverage/**'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/tests/**', 'src/main.tsx'],
      },
    },
  }
})
