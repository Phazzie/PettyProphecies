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
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { ValidationError } from "../../../types/errors"
import type { IUserRepository, IPasswordResetRepository, IEmailService } from "../../../interfaces/seams"
import logger from "../../../utils/logger"

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
      logger.info("Password reset requested for non-existent email", { email })
      return res.status(200).json(standardResponse)
    }

    // Create reset token
    const { token, expiresAt } = await passwordResetRepository.createResetRequest(user._id)

    // Send reset email
    try {
      await emailService.sendPasswordReset(email, token, user.username)
      logger.info("Password reset email sent", {
        userId: user._id,
        email,
        expiresAt
      })
    } catch (emailError) {
      // Log email error but still return success
      // We don't want to reveal if email was actually sent
      logger.error("Failed to send password reset email", {
        userId: user._id,
        email,
        error: emailError instanceof Error ? emailError.message : String(emailError),
      })
    }

    // Always return success
    return res.status(200).json(standardResponse)
  } catch (error) {
    // Log error and re-throw for error handler middleware
    logger.error("Error in forgot password handler", {
      email,
      error: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

/**
 * Main API handler with dependencies injected from real implementations
 */
async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  // Import dependencies
  // These will be provided by Agent 4 and Agent 5
  const { UserRepository } = await import("../../../repositories/UserRepository")
  const { PasswordResetRepository } = await import("../../../repositories/PasswordResetRepository")
  const { EmailService } = await import("../../../services/EmailService")

  const userRepository = new UserRepository()
  const passwordResetRepository = new PasswordResetRepository()
  const emailService = new EmailService()

  return forgotPasswordHandler(req, res, userRepository, passwordResetRepository, emailService)
}

// Export with middleware wrappers
export default rateLimitMiddleware(errorHandler(handler))
