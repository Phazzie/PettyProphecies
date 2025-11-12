/**
 * SEAM INTERFACES - Contract Definitions
 *
 * These interfaces define the boundaries between system components.
 * Each seam represents a testing boundary and dependency injection point.
 *
 * Following Test-Driven Development:
 * 1. Tests are written against these interfaces
 * 2. Implementations must satisfy these contracts
 * 3. Mocks/stubs implement these interfaces for testing
 */

import type { NextApiRequest, NextApiResponse } from "next"
import type { TarotCard } from "@/src/data/tarotCards"
import type { TarotSpread } from "@/src/data/tarotSpreads"

// ============================================================================
// SEAM 1: Authentication Service
// ============================================================================

export interface IAuthService {
  /**
   * Verify JWT token from httpOnly cookie
   * @returns User ID if valid, null if invalid
   */
  verifyToken(req: NextApiRequest): Promise<string | null>

  /**
   * Generate JWT token and set httpOnly cookie
   */
  setAuthCookie(res: NextApiResponse, userId: string): Promise<void>

  /**
   * Clear authentication cookie
   */
  clearAuthCookie(res: NextApiResponse): void

  /**
   * Extract user ID from authenticated request
   * @throws AuthenticationError if not authenticated
   */
  requireAuth(req: NextApiRequest): Promise<string>
}

export interface ICSRFService {
  /**
   * Generate CSRF token for GET requests
   */
  generateToken(req: NextApiRequest, res: NextApiResponse): Promise<string>

  /**
   * Validate CSRF token for POST/PUT/DELETE requests
   * @throws CSRFError if invalid
   */
  validateToken(req: NextApiRequest): Promise<void>
}

export interface IRateLimiter {
  /**
   * Check if request should be rate limited
   * @returns true if allowed, false if rate limited
   */
  checkLimit(identifier: string, action: RateLimitAction): Promise<RateLimitResult>
}

export type RateLimitAction =
  | "auth:login"
  | "auth:register"
  | "auth:password-reset"
  | "auth:verify"
  | "auth:logout"
  | "tarot:reading"
  | "api:general"
  // Legacy actions (for backward compatibility)
  | "auth"
  | "general"
  | "reading"
  | "api"

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: Date
  retryAfter?: number // Seconds until the user can retry
}

// ============================================================================
// SEAM 2: Validation Service
// ============================================================================

export interface IValidationService {
  /**
   * Validate request body against schema
   * @throws ValidationError if invalid
   */
  validateRequest<T>(data: unknown, schema: ValidationSchema): Promise<T>

  /**
   * Sanitize user input to prevent XSS
   */
  sanitize(input: string): string

  /**
   * Validate and sanitize object recursively
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T
}

export type ValidationSchema =
  | "register"
  | "login"
  | "forgotPassword"
  | "resetPassword"
  | "tarotReading"
  | "rateReading"
  | "userQuery"

// ============================================================================
// SEAM 3: AI Service
// ============================================================================

export interface IAIService {
  /**
   * Generate AI-powered tarot reading
   * @returns Reading text or falls back to template
   */
  generateReading(options: AIReadingOptions): Promise<string>

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean

  /**
   * Get AI model information
   */
  getModelInfo(): AIModelInfo
}

export interface AIReadingOptions {
  cards: TarotCard[]
  spread: TarotSpread
  userQuestion?: string
  isReversed?: boolean[]
}

export interface AIModelInfo {
  available: boolean
  model: string
  provider: string
}

// ============================================================================
// SEAM 4: Repository Pattern
// ============================================================================

export interface IRepository<T> {
  findById(id: string): Promise<T | null>
  findOne(query: Record<string, any>): Promise<T | null>
  findMany(query: Record<string, any>, options?: QueryOptions): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T | null>
  delete(id: string): Promise<boolean>
}

export interface QueryOptions {
  limit?: number
  skip?: number
  sort?: Record<string, 1 | -1>
}

export interface IUserRepository extends IRepository<IUser> {
  findByEmail(email: string): Promise<IUser | null>
  findByUsername(username: string): Promise<IUser | null>
  verifyPassword(userId: string, password: string): Promise<boolean>
  updatePassword(userId: string, newPassword: string): Promise<void>
}

export interface IReadingRepository extends IRepository<IReading> {
  findByUserId(userId: string, options?: QueryOptions): Promise<IReading[]>
  rateReading(readingId: string, rating: number): Promise<IReading | null>
}

export interface IPasswordResetRepository extends IRepository<IPasswordReset> {
  findValidToken(token: string): Promise<IPasswordReset | null>
  createResetRequest(userId: string): Promise<{ token: string; expiresAt: Date }>
  invalidateUserTokens(userId: string): Promise<void>
}

// ============================================================================
// SEAM 5: Email Service
// ============================================================================

export interface IEmailService {
  /**
   * Send password reset email
   */
  sendPasswordReset(email: string, resetToken: string, username: string): Promise<void>

  /**
   * Send welcome email
   */
  sendWelcome(email: string, username: string): Promise<void>

  /**
   * Send generic email
   */
  send(options: EmailOptions): Promise<void>
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

// ============================================================================
// SEAM 6: API Response
// ============================================================================

export interface IAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  timestamp: string
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
  field?: string
}

export type APIErrorCode =
  | "VALIDATION_ERROR"
  | "AUTHENTICATION_ERROR"
  | "AUTHORIZATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR"
  | "CSRF_ERROR"
  | "DATABASE_ERROR"

// ============================================================================
// Domain Models (referenced by repositories)
// ============================================================================

export interface IUser {
  _id: string
  username: string
  email: string
  password: string // hashed
  createdAt: Date
  updatedAt: Date
}

export interface IReading {
  _id: string
  userId: string
  spreadName: string
  cards: string[]
  interpretation: string
  rating?: number
  aiGenerated?: boolean
  createdAt: Date
}

export interface IPasswordReset {
  _id: string
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

// ============================================================================
// Middleware Types
// ============================================================================

export type NextApiHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void

export type MiddlewareWrapper = (handler: NextApiHandler) => NextApiHandler

// ============================================================================
// Custom Error Classes (to be implemented)
// ============================================================================

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = "ValidationError"
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required") {
    super(message)
    this.name = "AuthenticationError"
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = "Not authorized") {
    super(message)
    this.name = "AuthorizationError"
  }
}

export class NotFoundError extends Error {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConflictError"
  }
}

export class RateLimitError extends Error {
  public resetAt?: Date
  public retryAfter?: number

  constructor(
    message: string = "Too many requests",
    resetAtOrRetryAfter?: Date | number
  ) {
    super(message)
    this.name = "RateLimitError"

    // Smart parameter handling: second param can be either Date or number
    if (resetAtOrRetryAfter instanceof Date) {
      this.resetAt = resetAtOrRetryAfter
    } else if (typeof resetAtOrRetryAfter === "number") {
      this.retryAfter = resetAtOrRetryAfter
    }
  }
}

export class CSRFError extends Error {
  constructor(message: string = "Invalid CSRF token") {
    super(message)
    this.name = "CSRFError"
  }
}

export class DatabaseError extends Error {
  constructor(message: string = "Database operation failed") {
    super(message)
    this.name = "DatabaseError"
  }
}
