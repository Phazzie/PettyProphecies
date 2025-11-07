/**
 * Common types used across all contracts
 *
 * IMMUTABLE: Once defined, these types should NEVER change.
 * Create new versions (v2, v3) if breaking changes needed.
 */

/**
 * Standard error structure for all services
 */
export interface ServiceError {
  /** Error message (user-friendly) */
  message: string

  /** Error code (for programmatic handling) */
  code: string

  /** Whether the operation can be retried */
  retryable: boolean

  /** Additional error details */
  details?: Record<string, unknown>
}

/**
 * Standard response wrapper for async operations
 *
 * Use this for all service responses to maintain consistency.
 *
 * @example
 * ```typescript
 * async function getUser(id: string): Promise<ServiceResponse<User>> {
 *   try {
 *     const user = await api.fetch(`/users/${id}`)
 *     return { success: true, data: user }
 *   } catch (error) {
 *     return {
 *       success: false,
 *       error: {
 *         code: 'USER_NOT_FOUND',
 *         message: 'User not found',
 *         retryable: false
 *       }
 *     }
 *   }
 * }
 * ```
 */
export interface ServiceResponse<T> {
  /** Whether the operation succeeded */
  success: boolean

  /** Response data (only present if success = true) */
  data?: T

  /** Error details (only present if success = false) */
  error?: ServiceError
}

/**
 * Validation error details for form/input validation
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string

  /** User-friendly error message */
  message: string

  /** Error code for programmatic handling */
  code: string
}

/**
 * API usage tracking for monitoring and billing
 */
export interface APIUsage {
  /** Number of input tokens consumed */
  inputTokens?: number

  /** Number of output tokens generated */
  outputTokens?: number

  /** Cost in USD */
  cost?: number

  /** Unique request identifier */
  requestId?: string

  /** ISO timestamp of the request */
  timestamp: string
}

/**
 * Pagination metadata for paginated responses
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number

  /** Number of items per page */
  pageSize: number

  /** Total number of items across all pages */
  total: number

  /** Whether there are more pages after this one */
  hasMore: boolean
}

/**
 * Async operation state wrapper
 *
 * Use this pattern for all async operations in UI components.
 *
 * @example
 * ```typescript
 * let userState: AsyncState<User> = { loading: true }
 *
 * async function loadUser() {
 *   userState = { loading: true }
 *   try {
 *     const response = await userService.getUser('123')
 *     if (response.success) {
 *       userState = {
 *         loading: false,
 *         data: response.data,
 *         lastFetch: new Date()
 *       }
 *     }
 *   } catch (error) {
 *     userState = {
 *       loading: false,
 *       error: error as Error
 *     }
 *   }
 * }
 * ```
 */
export interface AsyncState<T> {
  /** Whether data is currently being loaded */
  loading: boolean

  /** Loaded data (only present after successful load) */
  data?: T

  /** Error (only present if load failed) */
  error?: Error

  /** When data was last fetched */
  lastFetch?: Date
}
