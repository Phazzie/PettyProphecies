/**
 * Zod Schema Definitions
 * Defines validation schemas for all API inputs with XSS sanitization
 */

import { z } from "zod"
import xss from "xss"

/**
 * Sanitize a string to prevent XSS attacks
 * Removes malicious HTML/JavaScript while preserving safe content
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitize(input: string | null | undefined): string {
  if (!input) return ""

  return xss(input, {
    whiteList: {
      // Allow only safe HTML tags
      p: [],
      br: [],
      strong: [],
      em: [],
      u: [],
      b: [],
      i: [],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ["script", "style"],
  })
}

/**
 * Recursively sanitize all string values in an object
 * Handles nested objects and arrays
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj
  }

  const sanitized: any = Array.isArray(obj) ? [] : {}

  for (const key in obj) {
    const value = obj[key]

    if (typeof value === "string") {
      sanitized[key] = sanitize(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" ? sanitize(item) : sanitizeObject(item)
      )
    } else if (value !== null && typeof value === "object") {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Password validation regex:
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/

/**
 * Username validation regex:
 * - Alphanumeric characters and underscores only
 * - 3-20 characters
 */
const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/

/**
 * Register Schema
 * Validates user registration data
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(usernameRegex, "Username can only contain letters, numbers, and underscores")
      .transform(sanitize),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .transform(sanitize),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters")
      .regex(passwordRegex, "Password must contain uppercase, lowercase, number, and special character"),
  })

/**
 * Login Schema
 * Validates user login credentials
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .toLowerCase()
    .email("Invalid email format")
    .transform(sanitize),
  password: z
    .string()
    .min(1, "Password is required"),
})

/**
 * Forgot Password Schema
 * Validates password reset request
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .trim()
    .toLowerCase()
    .email("Invalid email format")
    .transform(sanitize),
})

/**
 * Reset Password Schema
 * Validates password reset with token
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(passwordRegex, "Password must contain uppercase, lowercase, number, and special character"),
})

/**
 * Tarot Reading Schema
 * Validates tarot reading request
 */
export const tarotReadingSchema = z.object({
  spreadType: z
    .string()
    .min(1, "Spread type is required")
    .transform(sanitize),
  userQuestion: z
    .string()
    .max(500, "Question must be at most 500 characters")
    .optional()
    .transform((val) => (val ? sanitize(val) : val)),
})

/**
 * Rate Reading Schema
 * Validates reading rating submission
 */
export const rateReadingSchema = z.object({
  readingId: z
    .string()
    .min(1, "Reading ID is required"),
  rating: z
    .number()
    .int("Rating must be an integer")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .or(z.string().transform(Number))
    .pipe(z.number().int().min(1).max(5)),
})

/**
 * Schema map for easy lookup by schema name
 */
export const schemas = {
  register: registerSchema,
  login: loginSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  tarotReading: tarotReadingSchema,
  rateReading: rateReadingSchema,
} as const

export type SchemaName = keyof typeof schemas
