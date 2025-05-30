import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Aplicação Saúde PA',
        short_name: 'Saúde PA',
        description: 'Aplicação para funcionar offline durante a COP30',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      strategies: 'generateSW',
      injectRegister: 'auto',
      devOptions: {
        enabled: true
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        // *** ADICIONEI OFFLINE FALLBACK E MELHOREI O CACHE ***
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // *** SUAS APIs EXISTENTES COM FALLBACK OFFLINE ***
          {
            urlPattern: /^https:\/\/app-api\.hml\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-hml-cache',
              expiration: {
                maxEntries: 200, // Aumentei para mais dados
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias para COP30
              },
              networkTimeoutSeconds: 5, // Reduzi timeout para detectar offline mais rápido
              // *** FALLBACK OFFLINE ***
              backgroundSync: {
                name: 'api-sync',
                options: {
                  maxRetentionTime: 24 * 60 // 24 horas
                }
              }
            }
          },
          {
            urlPattern: /^https:\/\/app\.hml\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-hml-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              },
              networkTimeoutSeconds: 5
            }
          },
          {
            urlPattern: /^https:\/\/app\.trn\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-trn-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              },
              networkTimeoutSeconds: 5
            }
          },
          // *** CACHE PARA LOCALHOST (DESENVOLVIMENTO) ***
          {
            urlPattern: /^http:\/\/localhost:\d+\/api\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-dev-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 dia no dev
              },
              networkTimeoutSeconds: 3
            }
          },
          // *** SEUS CACHES DE ASSETS EXISTENTES ***
          {
            urlPattern: /\.(js|css|png|jpg|jpeg|svg|ico)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache'
            }
          },
          {
            urlPattern: /\.(woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache'
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Todas as requisições que começarem com /api serão redirecionadas
      // para o backend em localhost:4000
      '/api-auth': {
        target: 'https://app.hml.saude.pa.gov.br/',
        changeOrigin: true,
        secure: false,
        // opcional: se quiser reescrever a rota, mas aqui não é preciso:
        // rewrite: path => path.replace(/^\/api/, '/api')
      },
    },
  },
});