import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove cookies and auth headers
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
        delete event.request.headers['X-CSRF-Token']
      }
    }

    // Don't send certain errors
    const error = hint.originalException
    if (error instanceof Error) {
      // Ignore expected errors
      if (error.message.includes('CSRF') ||
          error.message.includes('Rate limit')) {
        return null
      }
    }

    return event
  },

  // Ignore certain transactions
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
})
