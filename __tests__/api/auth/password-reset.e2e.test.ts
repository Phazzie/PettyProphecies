/**
 * End-to-End Tests for Password Reset Flow
 *
 * Tests the complete password reset workflow:
 * 1. User requests password reset (forgot-password)
 * 2. System sends email with reset token
 * 3. User submits new password with token (reset-password)
 * 4. System updates password and invalidates tokens
 *
 * Following TDD: These tests are written to verify the complete flow
 */

import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"
import { jest } from "@jest/globals"
import type {
  IUserRepository,
  IPasswordResetRepository,
  IEmailService,
  IUser,
  IPasswordReset,
} from "../../../src/interfaces/seams"

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

// Import handlers
let forgotPasswordHandler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
let resetPasswordHandler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>

describe("Password Reset E2E Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Import handlers with error handling
    forgotPasswordHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { forgotPasswordHandler: actualHandler } = await import("../../../src/pages/api/auth/forgot-password")
      const wrappedHandler = errorHandler(async (req, res) => {
        return actualHandler(req, res, mockUserRepository, mockPasswordResetRepository, mockEmailService)
      })
      return wrappedHandler(req, res)
    }

    resetPasswordHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { resetPasswordHandler: actualHandler } = await import("../../../src/pages/api/auth/reset-password")
      const wrappedHandler = errorHandler(async (req, res) => {
        return actualHandler(req, res, mockUserRepository, mockPasswordResetRepository)
      })
      return wrappedHandler(req, res)
    }
  })

  describe("Complete successful flow", () => {
    it("should complete full password reset flow", async () => {
      const testEmail = "user@example.com"
      const testToken = "reset-token-abc123"
      const newPassword = "NewSecurePass123"

      const mockUser: IUser = {
        _id: "user123",
        username: "testuser",
        email: testEmail,
        password: "oldHashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Step 1: Request password reset
      const { req: forgotReq, res: forgotRes } = createMocks({
        method: "POST",
        body: { email: testEmail },
      })

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordResetRepository.createResetRequest.mockResolvedValue({
        token: testToken,
        expiresAt: new Date(Date.now() + 3600000),
      })
      mockEmailService.sendPasswordReset.mockResolvedValue(undefined)

      await forgotPasswordHandler(forgotReq, forgotRes as any)

      expect(forgotRes._getStatusCode()).toBe(200)
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledWith(testEmail, testToken, mockUser.username)

      // Step 2: Reset password with token
      const { req: resetReq, res: resetRes } = createMocks({
        method: "POST",
        body: {
          token: testToken,
          password: newPassword,
        },
      })

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: mockUser._id,
        token: testToken,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      }

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockResolvedValue(undefined)
      mockPasswordResetRepository.invalidateUserTokens.mockResolvedValue(undefined)

      await resetPasswordHandler(resetReq, resetRes as any)

      expect(resetRes._getStatusCode()).toBe(200)
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(mockUser._id, newPassword)
      expect(mockPasswordResetRepository.invalidateUserTokens).toHaveBeenCalledWith(mockUser._id)
    })
  })

  describe("Token expiry", () => {
    it("should reject expired token", async () => {
      const testToken = "expired-token"
      const now = Date.now()

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: "user123",
        token: testToken,
        expiresAt: new Date(now - 1000), // Expired 1 second ago
        createdAt: new Date(now - 3600000),
      }

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: testToken,
          password: "NewPassword123",
        },
      })

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error.message).toContain("expired")
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled()
    })

    it("should accept token that expires in the future", async () => {
      const testToken = "valid-token"
      const now = Date.now()

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: "user123",
        token: testToken,
        expiresAt: new Date(now + 3600000), // Valid for 1 hour
        createdAt: new Date(now),
      }

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: testToken,
          password: "NewPassword123",
        },
      })

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockResolvedValue(undefined)
      mockPasswordResetRepository.invalidateUserTokens.mockResolvedValue(undefined)

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(200)
      expect(mockUserRepository.updatePassword).toHaveBeenCalled()
    })
  })

  describe("Multiple reset attempts", () => {
    it("should allow multiple forgot password requests for same email", async () => {
      const testEmail = "user@example.com"
      const mockUser: IUser = {
        _id: "user123",
        username: "testuser",
        email: testEmail,
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordResetRepository.createResetRequest
        .mockResolvedValueOnce({
          token: "token1",
          expiresAt: new Date(Date.now() + 3600000),
        })
        .mockResolvedValueOnce({
          token: "token2",
          expiresAt: new Date(Date.now() + 3600000),
        })
      mockEmailService.sendPasswordReset.mockResolvedValue(undefined)

      // First request
      const { req: req1, res: res1 } = createMocks({
        method: "POST",
        body: { email: testEmail },
      })

      await forgotPasswordHandler(req1, res1 as any)
      expect(res1._getStatusCode()).toBe(200)

      // Second request
      const { req: req2, res: res2 } = createMocks({
        method: "POST",
        body: { email: testEmail },
      })

      await forgotPasswordHandler(req2, res2 as any)
      expect(res2._getStatusCode()).toBe(200)

      expect(mockPasswordResetRepository.createResetRequest).toHaveBeenCalledTimes(2)
      expect(mockEmailService.sendPasswordReset).toHaveBeenCalledTimes(2)
    })
  })

  describe("Token reuse prevention", () => {
    it("should invalidate all tokens after successful password reset", async () => {
      const testToken = "one-time-token"
      const userId = "user123"

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId,
        token: testToken,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      }

      // First use - should succeed
      const { req: req1, res: res1 } = createMocks({
        method: "POST",
        body: {
          token: testToken,
          password: "NewPassword123",
        },
      })

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockResolvedValue(undefined)
      mockPasswordResetRepository.invalidateUserTokens.mockResolvedValue(undefined)

      await resetPasswordHandler(req1, res1 as any)

      expect(res1._getStatusCode()).toBe(200)
      expect(mockPasswordResetRepository.invalidateUserTokens).toHaveBeenCalledWith(userId)

      // Second use - should fail (token invalidated)
      const { req: req2, res: res2 } = createMocks({
        method: "POST",
        body: {
          token: testToken,
          password: "AnotherPassword456",
        },
      })

      mockPasswordResetRepository.findValidToken.mockResolvedValue(null) // Token no longer valid

      await resetPasswordHandler(req2, res2 as any)

      expect(res2._getStatusCode()).toBe(400)
      const response = JSON.parse(res2._getData())
      expect(response.error.message).toContain("Invalid or expired")
    })

    it("should not invalidate tokens if password update fails", async () => {
      const testToken = "test-token"
      const userId = "user123"

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId,
        token: testToken,
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      }

      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: testToken,
          password: "NewPassword123",
        },
      })

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockRejectedValue(new Error("Database error"))

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(500)
      expect(mockPasswordResetRepository.invalidateUserTokens).not.toHaveBeenCalled()
    })
  })

  describe("Email delivery scenarios", () => {
    it("should handle email service failure gracefully", async () => {
      const testEmail = "user@example.com"
      const mockUser: IUser = {
        _id: "user123",
        username: "testuser",
        email: testEmail,
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const { req, res } = createMocks({
        method: "POST",
        body: { email: testEmail },
      })

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordResetRepository.createResetRequest.mockResolvedValue({
        token: "token123",
        expiresAt: new Date(Date.now() + 3600000),
      })
      mockEmailService.sendPasswordReset.mockRejectedValue(new Error("SMTP server unavailable"))

      await forgotPasswordHandler(req, res as any)

      // Should still return 200 to not reveal email status
      expect(res._getStatusCode()).toBe(200)
      expect(mockPasswordResetRepository.createResetRequest).toHaveBeenCalled()
    })
  })

  describe("Security: Email enumeration prevention", () => {
    it("should return same response for existing and non-existing emails", async () => {
      // Non-existing email
      const { req: req1, res: res1 } = createMocks({
        method: "POST",
        body: { email: "nonexistent@example.com" },
      })

      mockUserRepository.findByEmail.mockResolvedValue(null)

      await forgotPasswordHandler(req1, res1 as any)

      const response1 = JSON.parse(res1._getData())

      // Existing email
      const { req: req2, res: res2 } = createMocks({
        method: "POST",
        body: { email: "existing@example.com" },
      })

      const mockUser: IUser = {
        _id: "user123",
        username: "testuser",
        email: "existing@example.com",
        password: "hashedPassword",
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserRepository.findByEmail.mockResolvedValue(mockUser)
      mockPasswordResetRepository.createResetRequest.mockResolvedValue({
        token: "token123",
        expiresAt: new Date(Date.now() + 3600000),
      })
      mockEmailService.sendPasswordReset.mockResolvedValue(undefined)

      await forgotPasswordHandler(req2, res2 as any)

      const response2 = JSON.parse(res2._getData())

      // Both should return same message and status
      expect(res1._getStatusCode()).toBe(200)
      expect(res2._getStatusCode()).toBe(200)
      expect(response1.message).toBe(response2.message)
    })
  })
})
