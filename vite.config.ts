import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// 🔧 DETECÇÃO AUTOMÁTICA DE AMBIENTE
const isHomologacao = process.env.NODE_ENV === 'production' && 
                      !process.env.VITE_DEV_MODE && // Flag para forçar dev
                      (process.env.VITE_ENV === 'homologacao' ||
                       process.cwd().includes('homol') ||
                       process.cwd().includes('hml'));

// 🌐 URLs baseadas no ambiente
const API_AUTH_URL = isHomologacao 
  ? 'https://app.hml.saude.pa.gov.br/'  // Homologação: usar app.hml (não api-app.hml)
  : 'http://localhost:4000';

const API_BACKEND_URL = isHomologacao 
  ? 'https://app.hml.saude.pa.gov.br/'  // Homologação: domínio unificado
  : 'http://localhost:3000';

console.log('🚀 Configuração Vite:');
console.log('📍 Ambiente:', isHomologacao ? 'HOMOLOGAÇÃO' : 'DESENVOLVIMENTO');
console.log('🔐 API Auth:', API_AUTH_URL);
console.log('⚡ API Backend:', API_BACKEND_URL);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'robots.txt'
      ],
      manifest: {
        name: 'Aplicação Saúde PA - Sistema Offline',
        short_name: 'Saúde PA',
        description: 'Sistema de Saúde com suporte offline completo para COP30',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['medical', 'productivity', 'utilities'],
        
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
        ],
        
        shortcuts: [
          {
            name: 'Nova Notificação',
            short_name: 'Notificação',
            description: 'Criar nova notificação de saúde',
            url: '/private/comunicacao-de-caso/nova',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Novo Paciente',
            short_name: 'Paciente',
            description: 'Cadastrar novo paciente',
            url: '/private/pacientes/nova',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Dados Offline',
            short_name: 'Offline',
            description: 'Gerenciar dados offline',
            url: '/offline-management',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      
      strategies: 'generateSW',
      injectRegister: 'auto',
      
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // skipWaiting: true, // REMOVIDO: Para permitir que o usuário decida quando atualizar (registerType: 'prompt')
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        
        // *** GLOB PATTERNS CORRIGIDOS PARA DEV E PROD ***
        globPatterns: [
          // Arquivos básicos que sempre existem
          'index.html',
          // JS e CSS gerados pelo Vite
          '**/*.{js,css}',
          // Assets que existem
          '**/*.{ico,png,svg,json}',
          // Fonts se existirem
          '**/*.{woff,woff2,ttf}'
        ],
        
        globIgnores: [
          '**/node_modules/**/*',
          '**/test-results/**/*',
          '**/coverage/**/*',
          'sw.js',
          'workbox-*.js',
          '**/*.map' // Source maps não precisam ser cached
        ],
          // *** CACHE RUNTIME OTIMIZADO ***
        runtimeCaching: [
          // 1) Trata /api/paciente/check-cpf/########### sempre como NetworkOnly
          {
            urlPattern: /^https:\/\/app-api\.hml\.saude\.pa\.gov\.br\/api\/paciente\/check-cpf\/\d{11}.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'check-cpf-network-only',
              networkTimeoutSeconds: 5
            }
          },
          
          // === APIs DE PRODUÇÃO ===
          {
            urlPattern: /^https:\/\/app-api\.hml\.saude\.pa\.gov\.br\/api\/(tipo-|componentes|estabelecimentos).*$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-tipos-cache',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          
          {
            // essa rota genérica de paciente continua existindo, mas o check-cpf já foi "capturado" acima
            urlPattern: /^https:\/\/app-api\.hml\.saude\.pa\.gov\.br\/api\/(notificacao|paciente).*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-dynamic-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7
              },
              networkTimeoutSeconds: 5,
              backgroundSync: {
                name: 'dynamic-api-sync',
                options: {
                  maxRetentionTime: 24 * 60
                }
              }
            }
          },
          
          {
            urlPattern: /^https:\/\/app-api\.hml\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-hml-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              networkTimeoutSeconds: 5
            }
          },
          
          {
            urlPattern: /^https:\/\/app\.hml\.saude\.pa\.gov\.br\/.*$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-hml-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              networkTimeoutSeconds: 5
            }
          },
          
          // === RECURSOS ESTÁTICOS ===
          {
            urlPattern: /\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-css-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          },
          
          {
            urlPattern: /\.(png|jpg|jpeg|svg|ico|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          
          {
            urlPattern: /\.(woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          },
          
          // === CDNs EXTERNOS ===
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              }
            }
          }
        ],
        
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [
          /^\/$/,
          /^\/dashboard/,
          /^\/dashboard-page/,
          /^\/private/,
          /^\/public/,
          /^\/comunicacao-de-caso/,
          /^\/estabelecimentos/,
          /^\/notificacoes/
        ],
        navigateFallbackDenylist: [
          /^\/_/,
          /\/[^/?]+\.[^/]+$/,
          /^\/api/,
          /^\/mnt/,
          /^\/src/,
          /^\/node_modules/
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
  
  build: {
    target: 'esnext',
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-toastify'],
          'data-vendor': ['axios', 'idb'],
          'offline-vendor': ['date-fns', 'lodash']
        }
      }
    },
    
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    }
  },
  
  server: {
    port: 5173,
    host: true,
    
    proxy: {
      // 🔐 PROXY PARA API DE AUTENTICAÇÃO
      '/api-auth': {
        target: API_AUTH_URL,
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('❌ Proxy error - usando fallback para produção:', (err as any).code || err.message);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('🔄 Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('✅ Response:', proxyRes.statusCode, req.url);
          });
        }
      },
      
      // ⚡ PROXY PARA API BACKEND PRINCIPAL  
      '/api': {
        target: API_BACKEND_URL,
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('❌ API Proxy error:', (err as any).code || err.message);
          });
        }
      }
    },
  },
  
  preview: {
    port: 4173,
    host: true
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      'react-router-dom',
      'axios',
      'idb',
      'react-toastify',
      'lucide-react'
    ]
  },
  
  define: {
    __OFFLINE_DEBUG__: process.env.NODE_ENV === 'development',
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
});