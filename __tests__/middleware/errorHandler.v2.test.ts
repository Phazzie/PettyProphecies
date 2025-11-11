/**
 * Error Handler v2 Tests
 * Following TDD approach - tests written first
 */
import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  CSRFError,
} from "../../src/interfaces/seams"
import type { IAPIResponse } from "../../src/interfaces/seams"
import logger from "../../src/utils/logger"

// Mock the logger
jest.mock("../../src/utils/logger", () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}))

// Import the handler AFTER mocking dependencies
import { errorHandler } from "../../src/middleware/errorHandler.v2"

describe("Error Handler v2 Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Set NODE_ENV to test to avoid production-specific behavior
    process.env.NODE_ENV = "test"
  })

  describe("Error Type Mapping to HTTP Status Codes", () => {
    it("should map ValidationError to 400 Bad Request", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new ValidationError("Invalid email format", "email")
      )

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(400)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("VALIDATION_ERROR")
      expect(responseData.error?.message).toBe("Invalid email format")
      expect(responseData.error?.field).toBe("email")
      expect(responseData.timestamp).toBeDefined()
    })

    it("should map AuthenticationError to 401 Unauthorized", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue(
        new AuthenticationError("Invalid token")
      )

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(401)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("AUTHENTICATION_ERROR")
      expect(responseData.error?.message).toBe("Invalid token")
      expect(responseData.timestamp).toBeDefined()
    })

    it("should map AuthorizationError to 403 Forbidden", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
      })

      const handler = jest.fn().mockRejectedValue(
        new AuthorizationError("Access denied")
      )

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("AUTHORIZATION_ERROR")
      expect(responseData.error?.message).toBe("Access denied")
    })

    it("should map NotFoundError to 404 Not Found", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue(new NotFoundError("User"))

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(404)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("NOT_FOUND")
      expect(responseData.error?.message).toBe("User not found")
    })

    it("should map ConflictError to 409 Conflict", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new ConflictError("Email already exists")
      )

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(409)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("CONFLICT")
      expect(responseData.error?.message).toBe("Email already exists")
    })

    it("should map RateLimitError to 429 Too Many Requests", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const resetAt = new Date(Date.now() + 60000)
      const handler = jest.fn().mockRejectedValue(
        new RateLimitError("Too many login attempts", resetAt)
      )

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(429)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("RATE_LIMIT_EXCEEDED")
      expect(responseData.error?.message).toBe("Too many login attempts")
      expect(responseData.error?.details?.resetAt).toBeDefined()
    })

    it("should map CSRFError to 403 Forbidden", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new CSRFError("Invalid CSRF token")
      )

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(403)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("CSRF_ERROR")
      expect(responseData.error?.message).toBe("Invalid CSRF token")
    })

    it("should map generic Error to 500 Internal Server Error", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue(
        new Error("Unexpected database error")
      )

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(500)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("INTERNAL_ERROR")
      expect(responseData.error?.message).toBe("Internal server error")
    })
  })

  describe("Response Format Consistency", () => {
    it("should always return IAPIResponse format with success=false for errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new ValidationError("Test error")
      )

      await errorHandler(handler)(req, res)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      // Verify all required fields
      expect(responseData).toHaveProperty("success")
      expect(responseData).toHaveProperty("error")
      expect(responseData).toHaveProperty("timestamp")
      expect(responseData.success).toBe(false)
      expect(responseData.error).toBeDefined()
      expect(responseData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it("should include error code, message, and timestamp", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new AuthenticationError("Token expired")
      )

      await errorHandler(handler)(req, res)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.error?.code).toBe("AUTHENTICATION_ERROR")
      expect(responseData.error?.message).toBe("Token expired")
      expect(new Date(responseData.timestamp).getTime()).toBeLessThanOrEqual(Date.now())
    })

    it("should include optional field information when present", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new ValidationError("Password too short", "password", {
          minLength: 8,
          provided: 4
        })
      )

      await errorHandler(handler)(req, res)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.error?.field).toBe("password")
      expect(responseData.error?.details).toEqual({
        minLength: 8,
        provided: 4
      })
    })
  })

  describe("Error Logging", () => {
    it("should log ValidationError at warn level", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new ValidationError("Invalid input")
      )

      await errorHandler(handler)(req, res)

      expect(logger.warn).toHaveBeenCalledWith(
        "Validation error",
        expect.objectContaining({
          error: "Invalid input",
          field: undefined,
        })
      )
    })

    it("should log AuthenticationError at warn level", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue(
        new AuthenticationError("Invalid credentials")
      )

      await errorHandler(handler)(req, res)

      expect(logger.warn).toHaveBeenCalledWith(
        "Authentication error",
        expect.objectContaining({
          error: "Invalid credentials",
        })
      )
    })

    it("should log generic errors at error level with full details", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const testError = new Error("Database connection failed")
      testError.stack = "Error: Database connection failed\n  at test.js:1:1"
      const handler = jest.fn().mockRejectedValue(testError)

      await errorHandler(handler)(req, res)

      expect(logger.error).toHaveBeenCalledWith(
        "Unhandled error",
        expect.objectContaining({
          error: "Database connection failed",
          stack: expect.stringContaining("Database connection failed"),
        })
      )
    })
  })

  describe("Production vs Development Behavior", () => {
    it("should hide internal error details in production", async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = "production"

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue(
        new Error("Internal database connection string exposed")
      )

      await errorHandler(handler)(req, res)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      // Should NOT expose internal error message in production
      expect(responseData.error?.message).toBe("Internal server error")
      expect(responseData.error?.message).not.toContain("database connection string")

      process.env.NODE_ENV = originalEnv
    })

    it("should show detailed error messages in development", async () => {
      process.env.NODE_ENV = "development"

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue(
        new Error("Specific internal error")
      )

      await errorHandler(handler)(req, res)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      // Should expose error message in development
      expect(responseData.error?.details?.originalMessage).toBe("Specific internal error")
    })
  })

  describe("Edge Cases", () => {
    it("should handle successful handler execution without errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockResolvedValue(undefined)

      await errorHandler(handler)(req, res)

      expect(handler).toHaveBeenCalledWith(req, res)
      expect(logger.error).not.toHaveBeenCalled()
      expect(logger.warn).not.toHaveBeenCalled()
    })

    it("should handle errors without message property", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue({ weird: "error object" })

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(500)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.error?.message).toBe("Internal server error")
    })

    it("should handle null/undefined errors gracefully", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      })

      const handler = jest.fn().mockRejectedValue(null)

      await errorHandler(handler)(req, res)

      expect(res._getStatusCode()).toBe(500)
      const responseData: IAPIResponse = JSON.parse(res._getData())
      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("INTERNAL_ERROR")
    })

    it("should include timestamp in ISO 8601 format", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const handler = jest.fn().mockRejectedValue(
        new ValidationError("Test")
      )

      await errorHandler(handler)(req, res)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      // Verify timestamp is valid ISO 8601
      const timestamp = new Date(responseData.timestamp)
      expect(timestamp.toISOString()).toBe(responseData.timestamp)
    })
  })

  describe("RateLimitError with resetAt metadata", () => {
    it("should include resetAt in error details", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const resetDate = new Date(Date.now() + 300000) // 5 minutes from now
      const handler = jest.fn().mockRejectedValue(
        new RateLimitError("Rate limit exceeded", resetDate)
      )

      await errorHandler(handler)(req, res)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.error?.details?.resetAt).toBe(resetDate.toISOString())
    })

    it("should set Retry-After header for rate limit errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      })

      const resetDate = new Date(Date.now() + 60000) // 1 minute from now
      const handler = jest.fn().mockRejectedValue(
        new RateLimitError("Too many requests", resetDate)
      )

      await errorHandler(handler)(req, res)

      // Check if Retry-After header is set (should be in seconds)
      const retryAfter = res._getHeaders()["retry-after"]
      expect(retryAfter).toBeDefined()
      expect(Number(retryAfter)).toBeGreaterThan(0)
      expect(Number(retryAfter)).toBeLessThanOrEqual(60)
    })
  })
})
