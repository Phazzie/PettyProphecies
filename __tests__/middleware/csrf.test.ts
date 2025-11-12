/**
 * Tests for CSRF Protection Middleware
 * Following TDD: Tests written FIRST before implementation
 */

import { NextApiRequest, NextApiResponse } from "next"
import { createMocks } from "node-mocks-http"
import { CSRFService } from "@/src/middleware/csrf"
import { CSRFError } from "@/src/interfaces/seams"

describe("CSRFService - CSRF Protection", () => {
  let csrfService: CSRFService

  beforeEach(() => {
    csrfService = new CSRFService()
  })

  describe("generateToken", () => {
    it("should generate CSRF token for GET requests", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(req, res)

      // Token should be a non-empty string
      expect(token).toBeDefined()
      expect(typeof token).toBe("string")
      expect(token.length).toBeGreaterThan(0)

      // Token should be set in response header
      const csrfHeader = res.getHeader("X-CSRF-Token")
      expect(csrfHeader).toBe(token)
    })

    it("should generate different tokens for different requests", async () => {
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token1 = await csrfService.generateToken(req1, res1)
      const token2 = await csrfService.generateToken(req2, res2)

      // Tokens should be different (very high probability)
      expect(token1).not.toBe(token2)
    })

    it("should set CSRF token in cookie", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(req, res)

      const setCookieHeader = res.getHeader("Set-Cookie") as string[]
      expect(setCookieHeader).toBeDefined()

      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader

      // Cookie should contain CSRF token
      expect(cookieString).toContain("csrf-token=")
      expect(cookieString).toContain("HttpOnly")
      expect(cookieString).toContain("SameSite=Strict")
      expect(cookieString).toContain("Path=/")
    })

    it("should generate token with proper length", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(req, res)

      // Token should be at least 32 characters (hex string)
      expect(token.length).toBeGreaterThanOrEqual(32)
    })
  })

  describe("validateToken", () => {
    it("should validate correct CSRF token from header and cookie", async () => {
      // First generate a token
      const { req: getReq, res: getRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(getReq, getRes)

      // Extract cookie value
      const setCookieHeader = getRes.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader
      const cookieMatch = cookieString.match(/csrf-token=([^;]+)/)
      const cookieToken = cookieMatch![1]

      // Now validate with POST request
      const { req: postReq } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": token,
          cookie: `csrf-token=${cookieToken}`,
        },
      })

      await expect(csrfService.validateToken(postReq)).resolves.not.toThrow()
    })

    it("should throw CSRFError when header token is missing", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          cookie: "csrf-token=some-token",
        },
      })

      await expect(csrfService.validateToken(req)).rejects.toThrow(CSRFError)
      await expect(csrfService.validateToken(req)).rejects.toThrow(
        "CSRF token missing"
      )
    })

    it("should throw CSRFError when cookie token is missing", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": "some-token",
        },
      })

      await expect(csrfService.validateToken(req)).rejects.toThrow(CSRFError)
      await expect(csrfService.validateToken(req)).rejects.toThrow(
        "CSRF token missing"
      )
    })

    it("should throw CSRFError when tokens do not match", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": "token-from-header",
          cookie: "csrf-token=different-token-from-cookie",
        },
      })

      await expect(csrfService.validateToken(req)).rejects.toThrow(CSRFError)
      await expect(csrfService.validateToken(req)).rejects.toThrow(
        "Invalid CSRF token"
      )
    })

    it("should validate token from POST request", async () => {
      const { req: getReq, res: getRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(getReq, getRes)

      const setCookieHeader = getRes.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader
      const cookieMatch = cookieString.match(/csrf-token=([^;]+)/)
      const cookieToken = cookieMatch![1]

      const { req: postReq } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": token,
          cookie: `csrf-token=${cookieToken}`,
        },
      })

      await expect(csrfService.validateToken(postReq)).resolves.not.toThrow()
    })

    it("should validate token from PUT request", async () => {
      const { req: getReq, res: getRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(getReq, getRes)

      const setCookieHeader = getRes.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader
      const cookieMatch = cookieString.match(/csrf-token=([^;]+)/)
      const cookieToken = cookieMatch![1]

      const { req: putReq } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        headers: {
          "x-csrf-token": token,
          cookie: `csrf-token=${cookieToken}`,
        },
      })

      await expect(csrfService.validateToken(putReq)).resolves.not.toThrow()
    })

    it("should validate token from DELETE request", async () => {
      const { req: getReq, res: getRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(getReq, getRes)

      const setCookieHeader = getRes.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader
      const cookieMatch = cookieString.match(/csrf-token=([^;]+)/)
      const cookieToken = cookieMatch![1]

      const { req: deleteReq } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
        headers: {
          "x-csrf-token": token,
          cookie: `csrf-token=${cookieToken}`,
        },
      })

      await expect(csrfService.validateToken(deleteReq)).resolves.not.toThrow()
    })

    it("should throw CSRFError for tampered token", async () => {
      const { req: getReq, res: getRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(getReq, getRes)

      const setCookieHeader = getRes.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader
      const cookieMatch = cookieString.match(/csrf-token=([^;]+)/)
      const cookieToken = cookieMatch![1]

      // Tamper with the token
      const tamperedToken = token.substring(0, token.length - 1) + "x"

      const { req: postReq } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": tamperedToken,
          cookie: `csrf-token=${cookieToken}`,
        },
      })

      await expect(csrfService.validateToken(postReq)).rejects.toThrow(CSRFError)
    })
  })

  describe("Edge Cases", () => {
    it("should handle malformed cookie header gracefully", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": "some-token",
          cookie: "malformed-cookie-without-equals",
        },
      })

      await expect(csrfService.validateToken(req)).rejects.toThrow(CSRFError)
    })

    it("should handle multiple cookies and extract csrf-token", async () => {
      const { req: getReq, res: getRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(getReq, getRes)

      const setCookieHeader = getRes.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader
      const cookieMatch = cookieString.match(/csrf-token=([^;]+)/)
      const cookieToken = cookieMatch![1]

      const { req: postReq } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": token,
          cookie: `other-cookie=value; csrf-token=${cookieToken}; another=cookie`,
        },
      })

      await expect(csrfService.validateToken(postReq)).resolves.not.toThrow()
    })

    it("should handle case-insensitive header names", async () => {
      const { req: getReq, res: getRes } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const token = await csrfService.generateToken(getReq, getRes)

      const setCookieHeader = getRes.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader
      const cookieMatch = cookieString.match(/csrf-token=([^;]+)/)
      const cookieToken = cookieMatch![1]

      // Use uppercase header name
      const { req: postReq } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "X-CSRF-Token": token, // Uppercase
          cookie: `csrf-token=${cookieToken}`,
        },
      })

      await expect(csrfService.validateToken(postReq)).resolves.not.toThrow()
    })

    it("should reject empty token string", async () => {
      const { req } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        headers: {
          "x-csrf-token": "",
          cookie: "csrf-token=",
        },
      })

      await expect(csrfService.validateToken(req)).rejects.toThrow(CSRFError)
    })
  })

  describe("Token Expiration", () => {
    it("should generate token with expiration time in cookie", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      await csrfService.generateToken(req, res)

      const setCookieHeader = res.getHeader("Set-Cookie") as string[]
      const cookieString = Array.isArray(setCookieHeader)
        ? setCookieHeader[0]
        : setCookieHeader

      // Cookie should have Max-Age set (e.g., for 1 hour = 3600 seconds)
      expect(cookieString).toMatch(/Max-Age=\d+/)
    })
  })
})
