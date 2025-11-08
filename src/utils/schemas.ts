import { z } from "zod"

/**
 * Zod validation schemas for API routes
 * Replaces manual validation and improves security (SEC-004, SEC-007)
 */

// Strong password regex: min 8 chars, uppercase, lowercase, number, special char
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Username regex: 3-20 chars, alphanumeric and underscores only
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/

/**
 * Registration schema with strong password requirements
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(usernameRegex, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email format. Even the universe can see that."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long")
    .regex(
      strongPasswordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
    ),
})

/**
 * Login schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

/**
 * Reading creation schema
 */
export const createReadingSchema = z.object({
  spreadName: z.string().min(1, "Spread name is required"),
  cards: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      position: z.string(),
      isReversed: z.boolean(),
    })
  ),
  interpretation: z.string().optional(),
  question: z.string().optional(),
})

/**
 * Reading update schema
 */
export const updateReadingSchema = z.object({
  interpretation: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
})

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().min(1).max(1000)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .pipe(z.number().min(1).max(100)),
})

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email("Invalid email format"),
})

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      strongPasswordRegex,
      "Password must contain uppercase, lowercase, number, and special character"
    ),
})

/**
 * Helper function to validate and parse request body
 * Returns parsed data or throws validation error
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data)
}

/**
 * Helper function for safe validation (returns error instead of throwing)
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError) {
  return {
    message: "Validation failed. Maybe try following the rules?",
    errors: error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    })),
  }
}
