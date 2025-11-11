/**
 * Error Handler Middleware v2
 *
 * Global error handler that:
 * - Maps error types to HTTP status codes
 * - Returns standardized IAPIResponse format
 * - Logs errors appropriately
 * - Hides internal error details in production
 * - Includes timestamp and error code
 *
 * @module middleware/errorHandler.v2
 */

import type { NextApiRequest, NextApiResponse } from "next"
import type {
  IAPIResponse,
  APIError,
  APIErrorCode,
  NextApiHandler,
  MiddlewareWrapper,
} from "../interfaces/seams"
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  CSRFError,
} from "../interfaces/seams"
import logger from "../utils/logger"
import * as Sentry from "@sentry/nextjs"

/**
 * Maps error instances to HTTP status codes
 */
function getStatusCode(error: Error): number {
  if (error instanceof ValidationError) return 400
  if (error instanceof AuthenticationError) return 401
  if (error instanceof AuthorizationError) return 403
  if (error instanceof CSRFError) return 403
  if (error instanceof NotFoundError) return 404
  if (error instanceof ConflictError) return 409
  if (error instanceof RateLimitError) return 429
  return 500
}

/**
 * Maps error instances to API error codes
 */
function getErrorCode(error: Error): APIErrorCode {
  if (error instanceof ValidationError) return "VALIDATION_ERROR"
  if (error instanceof AuthenticationError) return "AUTHENTICATION_ERROR"
  if (error instanceof AuthorizationError) return "AUTHORIZATION_ERROR"
  if (error instanceof NotFoundError) return "NOT_FOUND"
  if (error instanceof ConflictError) return "CONFLICT"
  if (error instanceof RateLimitError) return "RATE_LIMIT_EXCEEDED"
  if (error instanceof CSRFError) return "CSRF_ERROR"
  return "INTERNAL_ERROR"
}

/**
 * Creates standardized API error object
 */
function createAPIError(error: Error): APIError {
  const code = getErrorCode(error)
  const isDevelopment = process.env.NODE_ENV === "development"
  const isInternalError = code === "INTERNAL_ERROR"

  // Build base error object
  const apiError: APIError = {
    code,
    message: error.message,
  }

  // Hide internal error details except in development
  if (isInternalError && !isDevelopment) {
    apiError.message = "Internal server error"
  }

  // Add field information for validation errors
  if (error instanceof ValidationError && error.field) {
    apiError.field = error.field
  }

  // Add details for validation errors
  if (error instanceof ValidationError && error.details) {
    apiError.details = error.details
  }

  // Add resetAt for rate limit errors
  if (error instanceof RateLimitError && error.resetAt) {
    apiError.details = {
      ...apiError.details,
      resetAt: error.resetAt.toISOString(),
    }
  }

  // Include original message in development for internal errors
  if (isInternalError && isDevelopment) {
    apiError.details = {
      ...apiError.details,
      originalMessage: error.message,
    }
  }

  return apiError
}

/**
 * Captures error to Sentry with context
 */
function captureToSentry(
  error: Error,
  req: NextApiRequest
): void {
  const errorCode = getErrorCode(error)

  // Don't send expected user errors to Sentry
  if (
    errorCode === "VALIDATION_ERROR" ||
    errorCode === "AUTHENTICATION_ERROR" ||
    errorCode === "CSRF_ERROR" ||
    errorCode === "RATE_LIMIT_EXCEEDED"
  ) {
    return
  }

  // Capture to Sentry with context
  Sentry.captureException(error, {
    tags: {
      endpoint: req.url || "unknown",
      method: req.method || "unknown",
      errorCode,
    },
    user: {
      id: (req as any).userId || "anonymous",
    },
    extra: {
      body: req.body,
      query: req.query,
    },
  })
}

/**
 * Logs error based on type and severity
 */
function logError(error: Error, req?: NextApiRequest): void {
  const errorCode = getErrorCode(error)

  // Log validation and authentication errors at warn level (expected user errors)
  if (errorCode === "VALIDATION_ERROR") {
    logger.warn({
      error: error.message,
      field: error instanceof ValidationError ? error.field : undefined,
    }, "Validation error")
    return
  }

  if (errorCode === "AUTHENTICATION_ERROR") {
    logger.warn({
      error: error.message,
    }, "Authentication error")
    return
  }

  if (errorCode === "AUTHORIZATION_ERROR") {
    logger.warn({
      error: error.message,
    }, "Authorization error")
    return
  }

  if (errorCode === "CSRF_ERROR") {
    logger.warn({
      error: error.message,
    }, "CSRF error")
    return
  }

  if (errorCode === "RATE_LIMIT_EXCEEDED") {
    logger.warn({
      error: error.message,
    }, "Rate limit exceeded")
    return
  }

  // Log all other errors (including NOT_FOUND, CONFLICT, INTERNAL_ERROR) at error level
  logger.error({
    error: error.message,
    stack: error.stack,
    name: error.name,
  }, "Unhandled error")

  // Capture to Sentry if request context is available
  if (req) {
    captureToSentry(error, req)
  }
}

/**
 * Sends standardized error response
 */
function sendErrorResponse(
  res: NextApiResponse,
  error: Error
): void {
  const statusCode = getStatusCode(error)
  const apiError = createAPIError(error)

  // Set Retry-After header for rate limit errors
  if (error instanceof RateLimitError && error.resetAt) {
    const retryAfterSeconds = Math.ceil(
      (error.resetAt.getTime() - Date.now()) / 1000
    )
    res.setHeader("Retry-After", Math.max(0, retryAfterSeconds).toString())
  }

  const response: IAPIResponse = {
    success: false,
    error: apiError,
    timestamp: new Date().toISOString(),
  }

  res.status(statusCode).json(response)
}

/**
 * Error handler middleware wrapper
 *
 * Wraps Next.js API route handlers to catch and standardize all errors
 *
 * @param handler - The Next.js API route handler
 * @returns Wrapped handler with error handling
 *
 * @example
 * ```typescript
 * async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   // Your API logic here
 *   if (!req.body.email) {
 *     throw new ValidationError("Email is required", "email")
 *   }
 * }
 *
 * export default errorHandler(handler)
 * ```
 */
export const errorHandler: MiddlewareWrapper = (handler: NextApiHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error) {
      // Handle all error types
      if (error instanceof Error) {
        logError(error, req)
        sendErrorResponse(res, error)
      } else {
        // Handle non-Error objects (rare case)
        const genericError = new Error("Internal server error")
        logError(genericError, req)
        sendErrorResponse(res, genericError)
      }
    }
  }
}
