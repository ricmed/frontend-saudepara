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
        // Configurações de cache
        runtimeCaching: [
          {
            // API de homologação
            urlPattern: /^https:\/\/app-api\.hml\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-hml-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // App de homologação
            urlPattern: /^https:\/\/app\.hml\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-hml-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // App de treinamento
            urlPattern: /^https:\/\/app\.trn\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-trn-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 semana
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Recursos estáticos
            urlPattern: /\.(js|css|png|jpg|jpeg|svg|ico)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assets-cache'
            }
          },
          {
            // Fontes
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
  }
});