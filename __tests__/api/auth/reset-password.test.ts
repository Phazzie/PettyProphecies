/**
 * Tests for reset-password API endpoint
 * Following TDD: These tests are written BEFORE implementation
 */

import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"
import { jest } from "@jest/globals"
import type { IUserRepository, IPasswordResetRepository } from "../../../src/interfaces/seams"
import type { IPasswordReset } from "../../../src/interfaces/seams"

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

// Import error handler
import { errorHandler } from "../../../src/middleware/errorHandler"

// Mock the handler function (will be implemented later)
let resetPasswordHandler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // The handler will be imported when it exists
    // Wrap with error handler to properly catch and format errors
    resetPasswordHandler = async (req: NextApiRequest, res: NextApiResponse) => {
      const { resetPasswordHandler: actualHandler } = await import("../../../src/pages/api/auth/reset-password")
      const wrappedHandler = errorHandler(async (req, res) => {
        return actualHandler(req, res, mockUserRepository, mockPasswordResetRepository)
      })
      return wrappedHandler(req, res)
    }
  })

  describe("Valid token and password", () => {
    it("should reset password with valid token", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-reset-token",
          password: "NewPassword123",
        },
      })

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: "user123",
        token: "valid-reset-token",
        expiresAt: new Date(Date.now() + 3600000), // Valid for 1 hour
        createdAt: new Date(),
      }

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockResolvedValue(undefined)
      mockPasswordResetRepository.invalidateUserTokens.mockResolvedValue(undefined)

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(200)
      expect(JSON.parse(res._getData())).toEqual({
        message: "Password reset successful. You can now login with your new password.",
      })
      expect(mockPasswordResetRepository.findValidToken).toHaveBeenCalledWith("valid-reset-token")
      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith("user123", "NewPassword123")
      expect(mockPasswordResetRepository.invalidateUserTokens).toHaveBeenCalledWith("user123")
    })
  })

  describe("Invalid or expired token", () => {
    it("should reject expired token", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "expired-token",
          password: "NewPassword123",
        },
      })

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: "user123",
        token: "expired-token",
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
      }

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
      expect(response.error.message).toContain("expired")
    })

    it("should reject invalid token", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "invalid-token",
          password: "NewPassword123",
        },
      })

      mockPasswordResetRepository.findValidToken.mockResolvedValue(null)

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
      expect(response.error.message).toContain("Invalid or expired")
    })

    it("should reject missing token", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          password: "NewPassword123",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
    })

    it("should reject empty token", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "",
          password: "NewPassword123",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe("Password validation", () => {
    it("should reject weak password (too short)", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "Weak1",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
      expect(response.error.message).toContain("Password")
    })

    it("should reject password without uppercase", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "password123",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBeDefined()
    })

    it("should reject password without lowercase", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "PASSWORD123",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
    })

    it("should reject password without number", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "PasswordOnly",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
    })

    it("should reject missing password", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
    })

    it("should reject empty password", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "",
        },
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe("HTTP methods", () => {
    it("should reject GET requests", async () => {
      const { req, res } = createMocks({
        method: "GET",
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(405)
    })

    it("should reject PUT requests", async () => {
      const { req, res } = createMocks({
        method: "PUT",
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(405)
    })

    it("should reject DELETE requests", async () => {
      const { req, res } = createMocks({
        method: "DELETE",
      })

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe("Error handling", () => {
    it("should handle database errors gracefully", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "NewPassword123",
        },
      })

      mockPasswordResetRepository.findValidToken.mockRejectedValue(new Error("Database connection failed"))

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(500)
    })

    it("should handle password update errors gracefully", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "NewPassword123",
        },
      })

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: "user123",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      }

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockRejectedValue(new Error("Failed to update password"))

      await resetPasswordHandler(req, res as any)

      expect(res._getStatusCode()).toBe(500)
    })
  })

  describe("Token invalidation", () => {
    it("should invalidate all user tokens after successful reset", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "NewPassword123",
        },
      })

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: "user123",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      }

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockResolvedValue(undefined)
      mockPasswordResetRepository.invalidateUserTokens.mockResolvedValue(undefined)

      await resetPasswordHandler(req, res as any)

      expect(mockPasswordResetRepository.invalidateUserTokens).toHaveBeenCalledWith("user123")
      expect(res._getStatusCode()).toBe(200)
    })

    it("should not invalidate tokens if password update fails", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "valid-token",
          password: "NewPassword123",
        },
      })

      const mockPasswordReset: IPasswordReset = {
        _id: "reset123",
        userId: "user123",
        token: "valid-token",
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      }

      mockPasswordResetRepository.findValidToken.mockResolvedValue(mockPasswordReset)
      mockUserRepository.updatePassword.mockRejectedValue(new Error("Update failed"))

      await resetPasswordHandler(req, res as any)

      expect(mockPasswordResetRepository.invalidateUserTokens).not.toHaveBeenCalled()
    })
  })
})
