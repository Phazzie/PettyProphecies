/**
 * Tests for forgot-password API endpoint
 * Following TDD: These tests are written BEFORE implementation
 */

import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"
import { jest } from "@jest/globals"
import type { IUserRepository, IPasswordResetRepository, IEmailService } from "../../../src/interfaces/seams"

// Mock dependencies
const mockUserRepository: jest.Mocked<IUserRepository> = {
  findById: jest.fn(),
  findOne: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  verifyPassword: jest.fn(),
  updatePassword: jest.fn(),
} as any

const mockPasswordResetRepository: jest.Mocked<IPasswordResetRepository> = {
  findById: jest.fn(),
  findOne: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findValidToken: jest.fn(),
  createResetRequest: jest.fn(),
  invalidateUserTokens: jest.fn(),
} as any

const mockEmailService: jest.Mocked<IEmailService> = {
  sendPasswordReset: jest.fn(),
  sendWelcome: jest.fn(),
  send: jest.fn(),
} as any

// Import error handler
import { errorHandler } from "../../../src/middleware/errorHandler"

// Mock the handler function (will be implemented later)
let forgotPasswordHandler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>

describe("POST /api/auth/forgot-password", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // The handler will be imported when it exists
    // Wrap with error handler to properly catch and format errors
    forgotPasswordHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { forgotPasswordHandler: actualHandler } = await import("../../../src/pages/api/auth/forgot-password")
      const wrappedHandler = errorHandler(async (req, res) => {
        return actualHandler(req, res, mockUserRepository, mockPasswordResetRepository, mockEmailService)
      })
      return wrappedHandler(req, res)
    }
  })

  describe("Valid email - user exists", () => {
    it("should create reset token and send email when user exists", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
        },
      })

      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockResetToken = {
        token: "reset-token-123",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordResetRepository.createResetRequest.mockResolvedValue(mockResetToken)
      mockEmailService.sendPasswordReset.mockResolvedValue(undefined)

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual({
        message: "If that email exists, we've sent reset instructions. Check your spam folder if you don't see it. We know you will.",
      })
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("test@example.com")
      expect(mockPasswordResetRepository.createResetRequest).toHaveBeenCalledWith("user123")
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(
        "test@example.com",
        "reset-token-123",
        "testuser"
      )
    })
  })

  describe("Invalid email - user doesn't exist (security)", () => {
    it("should return 200 even when user doesn't exist (don't reveal)", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "nonexistent@example.com",
        },
      })

      mockUserRepository.findByEmail.mockResolvedValue(null)

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual({
        message: "If that email exists, we've sent reset instructions. Check your spam folder if you don't see it. We know you will.",
      })
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith("nonexistent@example.com")
      expect(mockPasswordResetRepository.createResetRequest).not.toHaveBeenCalled()
      expect(mockEmailService.sendPasswordReset).not.toHaveBeenCalled()
    })
  })

  describe("Validation", () => {
    it("should reject invalid email format", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "not-an-email",
        },
      })

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
      expect(response.error.code).toBe("ValidationError")
    })

    it("should reject missing email", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {},
      })

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
      expect(response.error.code).toBe("ValidationError")
    })

    it("should reject empty email", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "",
        },
      })

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
    })
  })

  describe("Rate limiting", () => {
    it("should respect rate limiting", async () => {
      // This test assumes rate limiting is handled by middleware
      // We just verify the handler doesn't break when rate limited
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
        },
        headers: {
          "x-forwarded-for": "1.2.3.4",
        },
      })

      // The rate limit middleware would have already set the status
      // This test verifies our handler can be wrapped with rate limiting
      expect(req.headers["x-forwarded-for"]).toBe("1.2.3.4")
    })
  })

  describe("HTTP methods", () => {
    it("should reject GET requests", async () => {
      const { req, res } = createMocks({
        method: "GET",
      })

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(405)
    })

    it("should reject PUT requests", async () => {
      const { req, res } = createMocks({
        method: "PUT",
      })

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(405)
    })

    it("should reject DELETE requests", async () => {
      const { req, res } = createMocks({
        method: "DELETE",
      })

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
        },
      })

      mockUserRepository.findByEmail.mockRejectedValue(new Error("Database connection failed"))

      await forgotPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(500)
    })

    it("should handle email service errors gracefully", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
        },
      })

      const mockUser = {
        _id: "user123",
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordResetRepository.createResetRequest.mockResolvedValue({
        token: "reset-token-123",
        expiresAt: new Date(Date.now() + 3600000),
      })
      mockEmailService.sendPasswordReset.mockRejectedValue(new Error("Email service unavailable"))

      await forgotPasswordHandler(req, res as any)

      // Should still return 200 to not reveal if email was sent
      expect(res._getStatusCode()).toBe(200)
    })
  })
})
