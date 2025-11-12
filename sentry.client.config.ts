import * as Sentry from '@sentry/nuxt'

Sentry.init({
  // If set up, you can use your runtime config here
  // dsn: useRuntimeConfig().public.sentry.dsn,
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN || '',

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Configure tags
  initialScope: {
    tags: {
      'runtime': 'client',
    },
  },
})
