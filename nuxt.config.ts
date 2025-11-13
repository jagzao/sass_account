// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/eslint',
    '@sentry/nuxt/module',
    '@vite-pwa/nuxt'
  ],

  // Cloudflare Pages preset
  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      ignore: ['/api']
    }
  },

  // TypeScript
  typescript: {
    strict: true,
    typeCheck: false // Disabled for development/testing performance
  },

  // Runtime config
  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || '',
    databaseId: process.env.DATABASE_ID || '',
    kvNamespace: process.env.KV_NAMESPACE || '',

    // Email configuration
    emailService: process.env.EMAIL_SERVICE || 'mailchannels',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    postmarkApiKey: process.env.POSTMARK_API_KEY || '',

    public: {
      appName: 'Plataforma Fiscal Colaborativa',
      appVersion: '1.0.0',
      sentry: {
        dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || ''
      },

      // Email public config
      emailFrom: process.env.EMAIL_FROM || 'noreply@plataforma-fiscal.com',
      emailFromName: process.env.EMAIL_FROM_NAME || 'Plataforma Fiscal',

      // WebAuthn / 2FA configuration
      rpId: process.env.NUXT_PUBLIC_RP_ID || 'localhost',
      rpName: process.env.NUXT_PUBLIC_RP_NAME || 'Plataforma Fiscal',
      rpOrigin: process.env.NUXT_PUBLIC_RP_ORIGIN || 'http://localhost:3000'
    }
  },

  // App config
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'Plataforma Fiscal Colaborativa',
      meta: [
        { name: 'description', content: 'Gestión colaborativa de declaraciones fiscales entre contadores y contribuyentes' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap' }
      ]
    }
  },

  // CSS
  css: [
    '~/assets/css/main.css'
  ],

  // UI Pro (Nuxt UI)
  ui: {
    icons: ['heroicons', 'lucide']
  },

  // Experimental features
  experimental: {
    payloadExtraction: false
  },

  // Route rules for ISR/SWR
  routeRules: {
    '/': { prerender: true },
    '/login': { prerender: true },
    '/dashboard/**': { ssr: false },
    '/api/**': { cors: true }
  },

  compatibilityDate: '2024-11-01',

  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Plataforma Fiscal Colaborativa',
      short_name: 'Fiscal Platform',
      description: 'Gestión colaborativa de declaraciones fiscales entre contadores y contribuyentes',
      theme_color: '#667eea',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/dashboard',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/dashboard',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            networkTimeoutSeconds: 10,
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5 // 5 minutes
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  }
})
