/**
 * CSRF Protection Middleware
 * Implements ICSRFService interface using double-submit cookie pattern
 *
 * Features:
 * - Generates CSRF tokens for GET requests
 * - Validates tokens for POST/PUT/DELETE requests
 * - Uses double-submit cookie pattern (token in cookie + header)
 * - Cryptographically secure random token generation
 */

import type { NextApiRequest, NextApiResponse } from "next"
import { randomBytes, timingSafeEqual } from "crypto"
import { ICSRFService, CSRFError } from "@/src/interfaces/seams"

/**
 * Cookie name for CSRF token
 */
const CSRF_COOKIE_NAME = "csrf-token"

/**
 * Header name for CSRF token
 */
const CSRF_HEADER_NAME = "x-csrf-token"

/**
 * Token expiration time in seconds (1 hour)
 */
const TOKEN_EXPIRY_SECONDS = 3600

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
 * Generate cryptographically secure random token
 * @returns Hex-encoded random token
 */
function generateSecureToken(): string {
  // Generate 32 bytes of random data (64 hex characters)
  return randomBytes(32).toString("hex")
}

/**
 * Safely compare two strings in constant time to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns true if strings are equal
 */
function safeCompare(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) {
    return false
  }

  try {
    const bufferA = Buffer.from(a)
    const bufferB = Buffer.from(b)
    return timingSafeEqual(bufferA, bufferB)
  } catch (error) {
    return false
  }
}

/**
 * CSRFService implementation using double-submit cookie pattern
 * Implements ICSRFService interface from seams.ts
 */
export class CSRFService implements ICSRFService {
  /**
   * Generate CSRF token for GET requests
   * Sets token in both cookie and response header
   * @param req Next.js API request
   * @param res Next.js API response
   * @returns Generated CSRF token
   */
  async generateToken(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<string> {
    const token = generateSecureToken()

    // Set CSRF token in cookie
    const cookieValue = [
      `${CSRF_COOKIE_NAME}=${token}`,
      "HttpOnly",
      "SameSite=Strict",
      "Path=/",
      `Max-Age=${TOKEN_EXPIRY_SECONDS}`,
      // Secure flag enabled in production (HTTPS only)
      ...(process.env.NODE_ENV === "production" ? ["Secure"] : []),
    ].join("; ")

    res.setHeader("Set-Cookie", cookieValue)

    // Also set token in response header for client to read
    res.setHeader("X-CSRF-Token", token)

    return token
  }

  /**
   * Validate CSRF token for POST/PUT/DELETE requests
   * Compares token from header with token from cookie
   * @param req Next.js API request
   * @throws CSRFError if token is invalid or missing
   */
  async validateToken(req: NextApiRequest): Promise<void> {
    // Get token from header (case-insensitive)
    const headerToken =
      req.headers["x-csrf-token"] ||
      req.headers["X-CSRF-Token"] ||
      req.headers["X-Csrf-Token"]

    if (!headerToken || typeof headerToken !== "string" || !headerToken.trim()) {
      throw new CSRFError("CSRF token missing")
    }

    // Get token from cookie
    const cookieHeader = req.headers.cookie

    if (!cookieHeader) {
      throw new CSRFError("CSRF token missing")
    }

    const cookies = parseCookies(cookieHeader)
    const cookieToken = cookies[CSRF_COOKIE_NAME]

    if (!cookieToken || !cookieToken.trim()) {
      throw new CSRFError("CSRF token missing")
    }

    // Compare tokens using timing-safe comparison
    if (!safeCompare(headerToken, cookieToken)) {
      throw new CSRFError("Invalid CSRF token")
    }
  }
}

/**
 * Singleton instance for convenience
 */
let csrfServiceInstance: CSRFService | null = null

/**
 * Get or create CSRFService instance
 * @returns CSRFService instance
 */
export function getCSRFService(): CSRFService {
  if (!csrfServiceInstance) {
    csrfServiceInstance = new CSRFService()
  }
  return csrfServiceInstance
}
