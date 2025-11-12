/**
 * Tests for Cookie-Based Authentication Middleware (v2)
 * Following TDD: Tests written FIRST before implementation
 */

import { NextApiRequest, NextApiResponse } from "next"
import { createMocks } from "node-mocks-http"
import jwt from "jsonwebtoken"
import { AuthService } from "@/src/middleware/auth.v2"
import { AuthenticationError } from "@/src/interfaces/seams"

// Mock environment variables
const JWT_SECRET = "test-secret-key-for-jwt-testing-only"
process.env.JWT_SECRET = JWT_SECRET

describe("AuthService - Cookie-Based Authentication", () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
  })

  describe("setAuthCookie", () => {
    it("should generate JWT token and set httpOnly cookie", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const userId = "user123"
      await authService.setAuthCookie(res, userId)

      // Check that cookie was set
      const setCookieHeader = res.getHeader("Set-Cookie") as string[]
      expect(setCookieHeader).toBeDefined()
      expect(setCookieHeader.length).toBeGreaterThan(0)

      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader

      // Verify cookie attributes
      expect(cookieString).toContain("auth-token=")
      expect(cookieString).toContain("HttpOnly")
      expect(cookieString).toContain("Secure")
      expect(cookieString).toContain("SameSite=Strict")
      expect(cookieString).toContain("Path=/")
      expect(cookieString).toContain("Max-Age=3600") // 1 hour in seconds
    })

    it("should generate valid JWT token with correct payload", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const userId = "user123"
      await authService.setAuthCookie(res, userId)

      const setCookieHeader = res.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader

      // Extract token from cookie string
      const tokenMatch = cookieString.match(/auth-token=([^;]+)/)
      expect(tokenMatch).toBeTruthy()

      const token = tokenMatch![1]
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload

      expect(decoded.userId).toBe(userId)
      expect(decoded.iat).toBeDefined()
      expect(decoded.exp).toBeDefined()
      expect(decoded.exp! - decoded.iat!).toBe(3600) // 1 hour
    })
  })

  describe("verifyToken", () => {
    it("should verify valid token from cookie and return userId", async () => {
      const userId = "user123"
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" })

      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: `auth-token=${token}`,
        },
      })

      const result = await authService.verifyToken(req)
      expect(result).toBe(userId)
    })

    it("should return null for missing cookie", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const result = await authService.verifyToken(req)
      expect(result).toBeNull()
    })

    it("should return null for invalid token", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: "auth-token=invalid.token.here",
        },
      })

      const result = await authService.verifyToken(req)
      expect(result).toBeNull()
    })

    it("should return null for expired token", async () => {
      const userId = "user123"
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "-1h" }) // Expired

      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: `auth-token=${token}`,
        },
      })

      const result = await authService.verifyToken(req)
      expect(result).toBeNull()
    })

    it("should return null for token with missing userId", async () => {
      const token = jwt.sign({ someOtherField: "value" }, JWT_SECRET, {
        expiresIn: "1h",
      })

      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: `auth-token=${token}`,
        },
      })

      const result = await authService.verifyToken(req)
      expect(result).toBeNull()
    })
  })

  describe("clearAuthCookie", () => {
    it("should clear authentication cookie", () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      authService.clearAuthCookie(res)

      const setCookieHeader = res.getHeader("Set-Cookie") as string[]
      expect(setCookieHeader).toBeDefined()

      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader

      // Cookie should be cleared with Max-Age=0 or expires in the past
      expect(cookieString).toContain("auth-token=")
      expect(cookieString).toMatch(/Max-Age=0|expires=/)
      expect(cookieString).toContain("HttpOnly")
      expect(cookieString).toContain("Secure")
      expect(cookieString).toContain("SameSite=Strict")
      expect(cookieString).toContain("Path=/")
    })
  })

  describe("requireAuth", () => {
    it("should return userId for authenticated request", async () => {
      const userId = "user123"
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" })

      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: `auth-token=${token}`,
        },
      })

      const result = await authService.requireAuth(req)
      expect(result).toBe(userId)
    })

    it("should throw AuthenticationError for missing token", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      await expect(authService.requireAuth(req)).rejects.toThrow(
        AuthenticationError
      )
      await expect(authService.requireAuth(req)).rejects.toThrow(
        "Authentication required"
      )
    })

    it("should throw AuthenticationError for invalid token", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: "auth-token=invalid.token.here",
        },
      })

      await expect(authService.requireAuth(req)).rejects.toThrow(
        AuthenticationError
      )
    })

    it("should throw AuthenticationError for expired token", async () => {
      const userId = "user123"
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "-1h" })

      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: `auth-token=${token}`,
        },
      })

      await expect(authService.requireAuth(req)).rejects.toThrow(
        AuthenticationError
      )
    })
  })

  describe("Edge Cases", () => {
    it("should handle malformed cookie header", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: "malformed-cookie-without-equals",
        },
      })

      const result = await authService.verifyToken(req)
      expect(result).toBeNull()
    })

    it("should handle multiple cookies and extract auth-token", async () => {
      const userId = "user123"
      const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "1h" })

      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: `other-cookie=value; auth-token=${token}; another=cookie`,
        },
      })

      const result = await authService.verifyToken(req)
      expect(result).toBe(userId)
    })

    it("should reject token signed with different secret", async () => {
      const userId = "user123"
      const token = jwt.sign({ userId }, "wrong-secret", { expiresIn: "1h" })

      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
        headers: {
          cookie: `auth-token=${token}`,
        },
      })

      const result = await authService.verifyToken(req)
      expect(result).toBeNull()
    })
  })

  describe("Environment Configuration", () => {
    it("should throw error if JWT_SECRET is not configured", () => {
      const originalSecret = process.env.JWT_SECRET
      delete process.env.JWT_SECRET

      expect(() => new AuthService()).toThrow("JWT_SECRET not configured")

      process.env.JWT_SECRET = originalSecret
    })
  })
})
