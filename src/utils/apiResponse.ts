/**
 * API Response Helper Functions
 *
 * Standardized helper functions for sending API responses
 * conforming to the IAPIResponse interface.
 *
 * @module utils/apiResponse
 */

import type { NextApiResponse } from "next"
import type { IAPIResponse, APIError, APIErrorCode } from "../interfaces/seams"
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  CSRFError,
  DatabaseError,
} from "../interfaces/seams"

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
  if (error instanceof DatabaseError) return 500
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
  if (error instanceof DatabaseError) return "DATABASE_ERROR"
  return "INTERNAL_ERROR"
}

/**
 * Creates standardized API error object
 */
function createAPIError(error: Error): APIError {
  const code = getErrorCode(error)

  // Build base error object
  const apiError: APIError = {
    code,
    message: error.message,
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

  return apiError
}

/**
 * Sends a success response with standardized format
 *
 * @param res - Next.js API response object
 * @param data - Response data (can be any type)
 * @param statusCode - HTTP status code (default: 200)
 *
 * @example
 * ```typescript
 * sendSuccess(res, { userId: "123", username: "john" })
 * sendSuccess(res, { id: "new-id" }, 201)
 * ```
 */
export function sendSuccess<T = any>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200
): void {
  const response: IAPIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }

  res.status(statusCode).json(response)
}

/**
 * Sends an error response with standardized format
 *
 * @param res - Next.js API response object
 * @param error - Error instance
 * @param statusCode - HTTP status code (optional, will be inferred from error type)
 *
 * @example
 * ```typescript
 * sendError(res, new ValidationError("Invalid email", "email"))
 * sendError(res, new Error("Custom error"), 503)
 * ```
 */
export function sendError(
  res: NextApiResponse,
  error: Error,
  statusCode?: number
): void {
  const status = statusCode ?? getStatusCode(error)
  const apiError = createAPIError(error)

  const response: IAPIResponse = {
    success: false,
    error: apiError,
    timestamp: new Date().toISOString(),
  }

  res.status(status).json(response)
}

/**
 * Pagination metadata
 */
export interface PaginationMetadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Paginated response data
 */
export interface PaginatedData<T> {
  items: T[]
  pagination: PaginationMetadata
}

/**
 * Sends a paginated response with metadata
 *
 * @param res - Next.js API response object
 * @param data - Array of items for current page
 * @param total - Total number of items across all pages
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 *
 * @example
 * ```typescript
 * const readings = await getReadings(userId, { skip: 20, limit: 10 })
 * const total = await countReadings(userId)
 * sendPaginated(res, readings, total, 3, 10)
 * ```
 */
export function sendPaginated<T = any>(
  res: NextApiResponse,
  data: T[],
  total: number,
  page: number,
  limit: number
): void {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)

  const paginatedData: PaginatedData<T> = {
    items: data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  }

  sendSuccess(res, paginatedData, 200)
}
