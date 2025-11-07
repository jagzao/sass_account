// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxt/eslint'
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
    typeCheck: true
  },

  // Runtime config
  runtimeConfig: {
    sessionSecret: process.env.NUXT_SESSION_SECRET || '',
    databaseId: process.env.DATABASE_ID || '',
    kvNamespace: process.env.KV_NAMESPACE || '',
    public: {
      appName: 'Plataforma Fiscal Colaborativa',
      appVersion: '1.0.0'
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

  compatibilityDate: '2024-11-01'
})
