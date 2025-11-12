/**
 * Forgot Password API Endpoint
 *
 * Handles password reset requests by:
 * 1. Validating email format
 * 2. Checking if user exists (without revealing if they don't)
 * 3. Creating a reset token
 * 4. Sending reset email
 *
 * Security: Always returns 200 regardless of whether email exists
 * to prevent email enumeration attacks.
 */

import type { NextApiRequest, NextApiResponse } from "next"
import { errorHandler } from "../../../middleware/errorHandler"
import { ValidationError } from "../../../types/errors"
import { getRateLimiter, setRateLimitHeaders, RateLimitError } from '@/src/middleware/rateLimit.v2'
import type { IUserRepository, IPasswordResetRepository, IEmailService } from "../../../interfaces/seams"
import { getCSRFService } from "../../../middleware/csrf"
import logger from "../../../utils/logger"

const rateLimiter = getRateLimiter()

/**
 * Get identifier for rate limiting (IP address)
 */
function getIdentifier(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns true if valid email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Core handler function with dependency injection for testing
 * Note: CSRF and rate limiting are NOT in this function to allow testing
 * They are applied in the main handler function below
 */
export async function forgotPasswordHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  userRepository: IUserRepository,
  passwordResetRepository: IPasswordResetRepository,
  emailService: IEmailService
): Promise<void> {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: {
        message: "Method not allowed",
        code: "MethodNotAllowed",
      },
    })
  }

  const { email } = req.body

  // Validate email presence and format
  if (!email || typeof email !== "string" || email.trim() === "") {
    throw new ValidationError("Email is required")
  }

  if (!isValidEmail(email)) {
    throw new ValidationError("Invalid email format")
  }

  // Standard response message (same for all cases for security)
  const standardResponse = {
    message: "If that email exists, we've sent reset instructions. Check your spam folder if you don't see it. We know you will.",
  }

  try {
    // Check if user exists
    const user = await userRepository.findByEmail(email)

    if (!user) {
      // User doesn't exist, but return success to prevent email enumeration
      logger.info({ email }, "Password reset requested for non-existent email")
      return res.status(200).json(standardResponse)
    }

    // Create reset token
    const { token, expiresAt } = await passwordResetRepository.createResetRequest(user._id)

    // Send reset email
    try {
      await emailService.sendPasswordReset(email, token, user.username)
      logger.info({
        userId: user._id,
        email,
        expiresAt
      }, "Password reset email sent")
    } catch (emailError) {
      // Log email error but still return success
      // We don't want to reveal if email was actually sent
      logger.error({
        userId: user._id,
        email,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      }, "Failed to send password reset email")
    }

    // Always return success
    return res.status(200).json(standardResponse)
  } catch (error) {
    // Log error and re-throw for error handler middleware
    logger.error({
      email,
      error: error instanceof Error ? error.message : String(error),
    }, "Error in forgot password handler")
    throw error
  }
}

/**
 * Main API handler with dependencies injected from real implementations
 * This handler includes CSRF and rate limiting protection
 */
async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Rate limiting check
  const identifier = getIdentifier(req)
  const rateLimitResult = await rateLimiter.checkLimit(identifier, 'auth:password-reset')
  setRateLimitHeaders(res, rateLimitResult)

  if (!rateLimitResult.allowed) {
    throw new RateLimitError(
      `Too many password reset attempts. Try again in ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutes.`,
      rateLimitResult.retryAfter
    )
  }

  // CSRF token validation
  const csrfService = getCSRFService()
  await csrfService.validateToken(req)

  // Import dependencies
  // These will be provided by Agent 4 and Agent 5
  const { UserRepository } = await import("../../../repositories/UserRepository")
  const { PasswordResetRepository } = await import("../../../repositories/PasswordResetRepository")
  const { EmailService } = await import("../../../services/email")

  const userRepository = new UserRepository()
  const passwordResetRepository = new PasswordResetRepository()
  const emailService = new EmailService()

  return forgotPasswordHandler(req, res, userRepository, passwordResetRepository, emailService)
}

// Export with middleware wrappers
export default errorHandler(handler)
