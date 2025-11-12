import pino from "pino"
import type { NextApiRequest } from "next"

const isProduction = process.env.NODE_ENV === "production"
const isTest = process.env.NODE_ENV === "test"
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug")

export const logger = pino({
  level: logLevel,
  enabled: !isTest, // Disable logger in test environment

  // Pretty print in development
  ...(!isProduction && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  }),

  // Structured JSON in production
  ...(isProduction && {
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        pid: bindings.pid,
        host: bindings.hostname,
      }),
    },
  }),

  // Redact sensitive fields
  redact: {
    paths: [
      "password",
      "token",
      "authorization",
      "cookie",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },
})

// Helper functions
export function logRequest(
  req: NextApiRequest,
  userId?: string,
  duration?: number
) {
  logger.info({
    type: "http_request",
    method: req.method,
    url: req.url,
    userId: userId || "anonymous",
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
    userAgent: req.headers["user-agent"],
    duration,
  })
}

export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    type: "error",
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...context,
  })
}

export function logAuth(
  action: "login" | "register" | "logout",
  userId: string,
  success: boolean,
  reason?: string
) {
  logger.info({
    type: "auth",
    action,
    userId,
    success,
    reason,
  })
}

export function logDatabase(
  operation: string,
  collection: string,
  duration: number,
  success: boolean
) {
  if (duration > 100) {
    logger.warn({
      type: "slow_query",
      operation,
      collection,
      duration,
    })
  } else {
    logger.debug({
      type: "database",
      operation,
      collection,
      duration,
      success,
    })
  }
}

export default logger

