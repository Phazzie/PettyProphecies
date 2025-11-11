import mongoose from 'mongoose'
import logger from './logger'

let isMonitoring = false

export function enableQueryMonitoring() {
  if (isMonitoring) return

  // Only in production or when explicitly enabled
  if (process.env.NODE_ENV !== 'production' && !process.env.ENABLE_QUERY_MONITORING) {
    return
  }

  mongoose.set('debug', function(collectionName, methodName, ...methodArgs) {
    const start = Date.now()

    // This is called synchronously, so we wrap in setImmediate
    setImmediate(() => {
      const duration = Date.now() - start

      // Log slow queries (> 100ms)
      if (duration > 100) {
        logger.warn({
          type: 'slow_query',
          collection: collectionName,
          method: methodName,
          duration,
          args: methodArgs.map(arg =>
            typeof arg === 'object' ? JSON.stringify(arg) : arg
          ),
        }, 'Slow query detected')
      } else {
        logger.debug({
          type: 'database_query',
          collection: collectionName,
          method: methodName,
          duration,
        }, 'Database query')
      }
    })
  })

  isMonitoring = true
  logger.info('Query monitoring enabled')
}

// Call in API handlers that need monitoring
export function withQueryMonitoring<T>(
  fn: () => Promise<T>
): Promise<T> {
  enableQueryMonitoring()
  return fn()
}
