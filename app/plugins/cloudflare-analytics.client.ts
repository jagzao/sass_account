export default defineNuxtPlugin(() => {
  // Cloudflare Web Analytics
  // Add your beacon token from Cloudflare Dashboard
  const analyticsToken = 'YOUR_ANALYTICS_TOKEN'

  if (analyticsToken && analyticsToken !== 'YOUR_ANALYTICS_TOKEN') {
    const script = document.createElement('script')
    script.defer = true
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
    script.setAttribute('data-cf-beacon', JSON.stringify({ token: analyticsToken }))
    document.head.appendChild(script)
  }

  // Custom event tracking
  const trackEvent = (eventName: string, data?: Record<string, any>) => {
    if (import.meta.client && (window as any).cloudflare) {
      try {
        (window as any).cloudflare.trackEvent(eventName, data)
      } catch (error) {
        console.warn('Failed to track event:', error)
      }
    }
  }

  return {
    provide: {
      analytics: {
        trackEvent,
      },
    },
  }
})
