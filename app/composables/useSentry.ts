import * as Sentry from '@sentry/nuxt'

export const useSentry = () => {
  const captureException = (error: Error, context?: Record<string, any>) => {
    if (context) {
      Sentry.setContext('additional', context)
    }
    Sentry.captureException(error)
  }

  const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level)
  }

  const setUser = (user: { id: string; email?: string; username?: string }) => {
    Sentry.setUser(user)
  }

  const clearUser = () => {
    Sentry.setUser(null)
  }

  const addBreadcrumb = (breadcrumb: Sentry.Breadcrumb) => {
    Sentry.addBreadcrumb(breadcrumb)
  }

  const setTag = (key: string, value: string) => {
    Sentry.setTag(key, value)
  }

  const setContext = (name: string, context: Record<string, any>) => {
    Sentry.setContext(name, context)
  }

  return {
    captureException,
    captureMessage,
    setUser,
    clearUser,
    addBreadcrumb,
    setTag,
    setContext,
  }
}
