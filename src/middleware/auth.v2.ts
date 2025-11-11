/**
 * Cookie-Based Authentication Middleware (v2)
 * Implements IAuthService interface with httpOnly cookies
 *
 * Features:
 * - JWT tokens stored in httpOnly cookies (not localStorage)
 * - Secure, SameSite=Strict cookie attributes
 * - 1 hour token expiration
 * - CSRF protection friendly (no authorization header)
 */

import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"
import { IAuthService, AuthenticationError } from "@/src/interfaces/seams"

/**
 * Cookie name for authentication token
 */
const AUTH_COOKIE_NAME = "auth-token"

/**
 * Token expiration time in seconds (1 hour)
 */
const TOKEN_EXPIRY_SECONDS = 3600

/**
 * JWT payload structure
 */
interface TokenPayload {
  userId: string
  iat?: number
  exp?: number
}

/**
 * Parse cookies from request header
 * @param cookieHeader Cookie header string
 * @returns Object with cookie key-value pairs
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  if (!cookieHeader) {
    return cookies
  }

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.trim().split("=")
    if (parts.length === 2) {
      cookies[parts[0]] = parts[1]
    }
  })

  return cookies
}

/**
 * AuthService implementation using httpOnly cookies
 * Implements IAuthService interface from seams.ts
 */
export class AuthService implements IAuthService {
  private jwtSecret: string

  constructor() {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error("JWT_SECRET not configured")
    }
    this.jwtSecret = secret
  }

  /**
   * Verify JWT token from httpOnly cookie
   * @param req Next.js API request
   * @returns User ID if valid, null if invalid
   */
  async verifyToken(req: NextApiRequest): Promise<string | null> {
    try {
      const cookieHeader = req.headers.cookie

      if (!cookieHeader) {
        return null
      }

      const cookies = parseCookies(cookieHeader)
      const token = cookies[AUTH_COOKIE_NAME]

      if (!token) {
        return null
      }

      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload

      if (!decoded.userId) {
        return null
      }

      return decoded.userId
    } catch (error) {
      // Token verification failed (invalid, expired, etc.)
      return null
    }
  }

  /**
   * Generate JWT token and set httpOnly cookie
   * @param res Next.js API response
   * @param userId User ID to encode in token
   */
  async setAuthCookie(res: NextApiResponse, userId: string): Promise<void> {
    const token = jwt.sign({ userId } as TokenPayload, this.jwtSecret, {
      expiresIn: TOKEN_EXPIRY_SECONDS,
    })

    // Set httpOnly cookie with security attributes
    const cookieValue = [
      `${AUTH_COOKIE_NAME}=${token}`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${TOKEN_EXPIRY_SECONDS}`,
    ].join("; ")

    res.setHeader("Set-Cookie", cookieValue)
  }

  /**
   * Clear authentication cookie
   * @param res Next.js API response
   */
  clearAuthCookie(res: NextApiResponse): void {
    // Set cookie with Max-Age=0 to clear it
    const cookieValue = [
      `${AUTH_COOKIE_NAME}=`,
      "HttpOnly",
      "Secure",
      "SameSite=Strict",
      "Path=/",
      "Max-Age=0",
    ].join("; ")

    res.setHeader("Set-Cookie", cookieValue)
  }

  /**
   * Extract user ID from authenticated request
   * @param req Next.js API request
   * @returns User ID
   * @throws AuthenticationError if not authenticated
   */
  async requireAuth(req: NextApiRequest): Promise<string> {
    const userId = await this.verifyToken(req)

    if (!userId) {
      throw new AuthenticationError("Authentication required")
    }

    return userId
  }
}

/**
 * Singleton instance for convenience
 */
let authServiceInstance: AuthService | null = null

/**
 * Get or create AuthService instance
 * @returns AuthService instance
 */
export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService()
  }
  return authServiceInstance
}

/**
 * Higher-order function to wrap API handlers with authentication
 * Automatically extracts userId from cookie and adds to req.userId
 * Rejects unauthenticated requests with 401 error
 *
 * @param handler - API handler function that requires authentication
 * @returns Wrapped handler with authentication check
 *
 * @example
 * ```typescript
 * async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   const userId = req.userId // Available after withAuth wrapping
 *   // ... handler logic
 * }
 *
 * export default withAuth(handler)
 * ```
 */
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authService = getAuthService()
      const userId = await authService.requireAuth(req)

      // Attach userId to request for handler to use
      ;(req as any).userId = userId

      await handler(req, res)
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({
          success: false,
          error: {
            code: "AUTHENTICATION_ERROR",
            message: error.message,
          },
          timestamp: new Date().toISOString(),
        })
      } else {
        throw error
      }
    }
  }
}
