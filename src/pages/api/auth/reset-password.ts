/**
 * Reset Password API Endpoint
 *
 * Handles password reset completion by:
 * 1. Validating reset token
 * 2. Checking token expiration
 * 3. Validating new password strength
 * 4. Updating user password
 * 5. Invalidating all reset tokens for the user
 *
 * Security: Tokens are single-use and expire after a set period
 */

import type { NextApiRequest, NextApiResponse } from "next"
import { errorHandler } from "../../../middleware/errorHandler"
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { ValidationError } from "../../../types/errors"
import type { IUserRepository, IPasswordResetRepository } from "../../../interfaces/seams"
import logger from "../../../utils/logger"

/**
 * Validates password strength
 * Requires: minimum 8 characters, at least one uppercase, one lowercase, and one number
 * @param password - Password to validate
 * @returns true if password meets requirements
 */
function isStrongPassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
  return passwordRegex.test(password)
}

/**
 * Core handler function with dependency injection for testing
 */
export async function resetPasswordHandler(
  req: NextApiRequest,
  res: NextApiResponse,
  userRepository: IUserRepository,
  passwordResetRepository: IPasswordResetRepository
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

  const { token, password } = req.body

  // Validate token presence
  if (!token || typeof token !== "string" || token.trim() === "") {
    throw new ValidationError("Reset token is required")
  }

  // Validate password presence
  if (!password || typeof password !== "string" || password.trim() === "") {
    throw new ValidationError("Password is required")
  }

  // Validate password strength
  if (!isStrongPassword(password)) {
    throw new ValidationError(
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number"
    )
  }

  try {
    // Find valid reset token
    const resetRequest = await passwordResetRepository.findValidToken(token)

    if (!resetRequest) {
      throw new ValidationError("Invalid or expired reset token")
    }

    // Check if token is expired
    if (new Date() > new Date(resetRequest.expiresAt)) {
      throw new ValidationError("Reset token has expired. Please request a new one.")
    }

    // Update user password
    await userRepository.updatePassword(resetRequest.userId, password)

    // Invalidate all reset tokens for this user (prevent reuse)
    await passwordResetRepository.invalidateUserTokens(resetRequest.userId)

    logger.info("Password reset successful", {
      userId: resetRequest.userId,
    })

    return res.status(200).json({
      message: "Password reset successful. You can now login with your new password.",
    })
  } catch (error) {
    // Log error and re-throw for error handler middleware
    logger.error("Error in reset password handler", {
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
  // These will be provided by Agent 4
  const { UserRepository } = await import("../../../repositories/UserRepository")
  const { PasswordResetRepository } = await import("../../../repositories/PasswordResetRepository")

  const userRepository = new UserRepository()
  const passwordResetRepository = new PasswordResetRepository()

  return resetPasswordHandler(req, res, userRepository, passwordResetRepository)
}

// Export with middleware wrappers
export default rateLimitMiddleware(errorHandler(handler))
