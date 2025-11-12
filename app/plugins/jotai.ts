import { Provider } from 'jotai'

export default defineNuxtPlugin((nuxtApp) => {
  // Jotai Provider is automatically available in Vue components
  // This plugin can be used to initialize default values or perform setup

  if (import.meta.client) {
    // Client-side initialization
    console.log('Jotai initialized on client')
  }

  return {
    provide: {
      jotai: {
        Provider,
      },
    },
  }
})
