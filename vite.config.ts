import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';
import { VitePWA } from 'vite-plugin-pwa';

/** Manter igual a HOMOLOGACAO_MIN_AGGREGATE_COUNT em aggregateCountDefaults.ts */
const HOMOLOGACAO_MIN_AGGREGATE_COUNT = 5;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const pkgJson = JSON.parse(
    readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'),
  ) as { version: string };
  const viteAppBuildId =
    env.VITE_APP_BUILD_ID ||
    (mode === 'development'
      ? `${pkgJson.version}-dev`
      : `${pkgJson.version}-${mode}-${Date.now()}`);
  const isHomologacao = env.VITE_ENV === 'homologacao';
  const isProducao = env.VITE_ENV === 'producao';
  const useInternalAuth = env.VITE_USE_INTERNAL_AUTH === 'true';
  const API_AUTH_URL = isHomologacao
    ? 'https://app.hml.saude.pa.gov.br/'
    : isProducao
      ? 'https://app.saude.pa.gov.br/'
      : useInternalAuth
        ? 'http://localhost:3000'
        : 'http://localhost:4000';
  const API_BACKEND_URL = isHomologacao
    ? 'https://app.hml.saude.pa.gov.br/'
    : isProducao
      ? 'https://app.saude.pa.gov.br/'
      : 'http://localhost:3000';

  console.log('🚀 Configuração Vite (mode=%s):', mode);
  console.log('📍', isHomologacao ? 'HOMOLOGAÇÃO' : isProducao ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');
  console.log('🔐 API Auth proxy:', API_AUTH_URL);
  console.log('⚡ API Backend proxy:', API_BACKEND_URL);
  console.log('🧩 Internal auth:', useInternalAuth ? 'ON' : 'OFF');
  const homologacaoMinAggregateCount =
    env.VITE_MIN_AGGREGATE_COUNT ||
    (mode === 'homologacao' ? String(HOMOLOGACAO_MIN_AGGREGATE_COUNT) : '');
  if (mode === 'homologacao') {
    console.log(
      'VITE_MIN_AGGREGATE_COUNT efetivo:',
      homologacaoMinAggregateCount || '(unset)',
    );
  }
  const APP_ORIGIN_REGEX = /^https:\/\/app(?:\.hml)?\.saude\.pa\.gov\.br\/.*$/i;
  const API_ORIGIN_REGEX = /^https:\/\/app-api(?:\.hml)?\.saude\.pa\.gov\.br\/.*$/i;

  return {
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'masked-icon.svg',
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
        
        // Evita 404 em homologação: não temos os PNGs no `public/`.
        // Mantém um ícone mínimo via SVG (fallback).
        icons: [{ src: 'vite.svg', sizes: 'any', type: 'image/svg+xml' }],
        
        shortcuts: [
          {
            name: 'Nova Notificação',
            short_name: 'Notificação',
            description: 'Criar nova notificação de saúde',
            url: '/private/comunicacao-de-caso/nova',
            icons: [{ src: 'vite.svg', sizes: 'any' }]
          },
          {
            name: 'Novo Paciente',
            short_name: 'Paciente',
            description: 'Cadastrar novo paciente',
            url: '/private/pacientes/nova',
            icons: [{ src: 'vite.svg', sizes: 'any' }]
          },
          {
            name: 'Dados Offline',
            short_name: 'Offline',
            description: 'Gerenciar dados offline',
            url: '/offline-management',
            icons: [{ src: 'vite.svg', sizes: 'any' }]
          }
        ]
      },
      
      strategies: 'generateSW',
      // Já registramos manualmente em `src/registerSW.ts` (chamado em `src/main.tsx`).
      // Evita script injetado duplicado que pode quebrar em alguns ambientes (ex.: "Unexpected token 'export'").
      injectRegister: null,
      
      // Em dev, SW + CacheFirst em *.jpg pode guardar o index.html (fallback SPA) como "imagem"
      // quando o ficheiro ainda não existe em public — depois o browser mostra bandeira quebrada.
      devOptions: {
        enabled: false,
        type: 'module',
        navigateFallback: 'index.html',
      },
      
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        skipWaiting: false,
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
          // Bandeiras e outros estáticos em public (quando existirem no dist)
          '**/*.{jpg,jpeg}',
          // Fonts se existirem
          '**/*.{woff,woff2,ttf}',
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
            urlPattern: /^https:\/\/app-api(?:\.hml)?\.saude\.pa\.gov\.br\/api\/paciente\/check-cpf\/\d{11}.*$/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'check-cpf-network-only'
            }
          },
          
          // === APIs (HML + PRODUÇÃO) ===
          {
            urlPattern: /^https:\/\/app-api(?:\.hml)?\.saude\.pa\.gov\.br\/api\/(tipo-|componentes|estabelecimentos).*$/i,
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
          
          // Comunicação DAE: nunca cachear — listagem deve refletir salvamentos imediatamente
          {
            urlPattern: /^https:\/\/app-api(?:\.hml)?\.saude\.pa\.gov\.br\/api\/comunicacao-dae.*$/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'comunicacao-dae-api-network-only',
            },
          },
          {
            urlPattern: /^https:\/\/app(?:\.hml)?\.saude\.pa\.gov\.br\/api\/comunicacao-dae.*$/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'comunicacao-dae-app-network-only',
            },
          },

          {
            // essa rota genérica de paciente continua existindo, mas o check-cpf já foi "capturado" acima
            urlPattern: /^https:\/\/app-api(?:\.hml)?\.saude\.pa\.gov\.br\/api\/(notificacao|paciente).*$/i,
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
            urlPattern: API_ORIGIN_REGEX,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-origin-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              networkTimeoutSeconds: 5
            }
          },
          
          {
            urlPattern: APP_ORIGIN_REGEX,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-origin-cache',
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
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              plugins: [
                {
                  cacheWillUpdate: async ({ response }: { response: Response }) => {
                    const ct = response.headers.get('content-type') || '';
                    if (response.status === 200 && /^image\//i.test(ct)) {
                      return response;
                    }
                    return null;
                  },
                },
              ],
            },
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
          /^\/(?!api(?:\/|$)|_).+/,
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
        rewrite: (p) =>
          p
            .replace(/^\/api-auth\/auth\//, '/api/auth/')
            .replace(/^\/api-auth\/protected\/profile$/, '/api/auth/profile')
            .replace(/^\/api-auth\/admin\//, '/api/auth/admin/'),
        configure: (proxy) => {
          proxy.on('error', (err: any, _req: any, res: any) => {
            // Evitar que erro de proxy derrube o dev server.
            const code = err?.code || 'PROXY_ERROR';
            const msg = err?.message || String(err);
            console.log('❌ Proxy error (/api-auth):', code, msg);
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy error', code, message: msg }));
            }
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
          proxy.on('error', (err: any, _req: any, res: any) => {
            const code = err?.code || 'PROXY_ERROR';
            const msg = err?.message || String(err);
            console.log('❌ API Proxy error (/api):', code, msg);
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Proxy error', code, message: msg }));
            }
          });
        }
      }
    },
  },
  
  preview: {
    port: 4173,
    host: true,
    // 🧪 IMPORTANTE: o Playwright usa `vite preview` (4173).
    // Precisamos do mesmo proxy do `server` para autenticação/API local funcionar.
    proxy: {
      '/api-auth': {
        target: API_AUTH_URL,
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        rewrite: (p) =>
          p
            .replace(/^\/api-auth\/auth\//, '/api/auth/')
            .replace(/^\/api-auth\/protected\/profile$/, '/api/auth/profile')
            .replace(/^\/api-auth\/admin\//, '/api/auth/admin/'),
      },
      '/api': {
        target: API_BACKEND_URL,
        changeOrigin: true,
        secure: false,
        timeout: 10000,
      },
    },
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
    __PWA_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    'import.meta.env.VITE_APP_BUILD_ID': JSON.stringify(viteAppBuildId),
    ...(homologacaoMinAggregateCount
      ? {
          'import.meta.env.VITE_MIN_AGGREGATE_COUNT': JSON.stringify(
            homologacaoMinAggregateCount,
          ),
        }
      : {}),
  },
  };
});