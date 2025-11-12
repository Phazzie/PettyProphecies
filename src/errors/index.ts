/**
 * Error Classes Export
 *
 * Re-exports all custom error classes from seams.ts for convenient importing.
 * Error classes are defined in seams.ts as part of the SEAM interface contracts.
 *
 * @module errors
 *
 * @example
 * ```typescript
 * import { ValidationError, NotFoundError } from '@/src/errors'
 *
 * throw new ValidationError("Email is required", "email")
 * throw new NotFoundError("User")
 * ```
 */

export {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  CSRFError,
} from "../interfaces/seams"

// Re-export types for convenience
export type { APIError, APIErrorCode } from "../interfaces/seams"
