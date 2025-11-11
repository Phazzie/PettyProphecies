/**
 * PasswordResetRepository Tests
 *
 * Tests for PasswordResetRepository implementation
 * Following TDD - tests written BEFORE implementation
 * Uses mocked mongoose models
 */

// Mock crypto before imports
jest.mock("crypto")

// Mock setup
const mockFindById = jest.fn()
const mockFind = jest.fn()
const mockFindOne = jest.fn()
const mockFindByIdAndUpdate = jest.fn()
const mockFindByIdAndDelete = jest.fn()
const mockDeleteMany = jest.fn()

jest.mock("@/src/models/PasswordReset", () => ({
  PasswordReset: jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: "reset123" }),
  })),
}))

const { PasswordReset } = require("@/src/models/PasswordReset")

PasswordReset.findById = mockFindById
PasswordReset.find = mockFind
PasswordReset.findOne = mockFindOne
PasswordReset.findByIdAndUpdate = mockFindByIdAndUpdate
PasswordReset.findByIdAndDelete = mockFindByIdAndDelete
PasswordReset.deleteMany = mockDeleteMany

import { PasswordResetRepository } from "@/src/repositories/PasswordResetRepository"
import crypto from "crypto"

describe("PasswordResetRepository", () => {
  let passwordResetRepository: PasswordResetRepository
  let mockPasswordReset: any

  beforeEach(() => {
    passwordResetRepository = new PasswordResetRepository()
    jest.clearAllMocks()

    mockPasswordReset = {
      _id: "reset123",
      userId: "user123",
      token: "secure-random-token-abc123",
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(),
    }
  })

  describe("createResetRequest", () => {
    it("should create password reset request with secure token", async () => {
      const mockToken = "cryptographically-secure-token-123"

      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(mockToken),
      })

      const mockSave = jest.fn().mockResolvedValue({
        userId: "user123",
        token: mockToken,
        expiresAt: expect.any(Date),
      })
      PasswordReset.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      const result = await passwordResetRepository.createResetRequest("user123")

      expect(crypto.randomBytes).toHaveBeenCalledWith(32)
      expect(result.token).toBe(mockToken)
      expect(result.expiresAt).toBeDefined()
      expect(mockSave).toHaveBeenCalled()
    })

    it("should set expiry to 1 hour from now", async () => {
      const mockToken = "token123"
      const beforeCreate = Date.now()

      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(mockToken),
      })

      const mockSave = jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this)
      })
      PasswordReset.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      const result = await passwordResetRepository.createResetRequest("user123")

      const afterCreate = Date.now()
      const expectedMinExpiry = beforeCreate + 3600000
      const expectedMaxExpiry = afterCreate + 3600000

      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry)
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMaxExpiry)
    })

    it("should use 32 bytes for token generation", async () => {
      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue("token"),
      })

      const mockSave = jest.fn().mockResolvedValue({})
      PasswordReset.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      await passwordResetRepository.createResetRequest("user123")

      expect(crypto.randomBytes).toHaveBeenCalledWith(32)
    })

    it("should convert token to hex string", async () => {
      const mockToString = jest.fn().mockReturnValue("hextoken")
      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: mockToString,
      })

      const mockSave = jest.fn().mockResolvedValue({})
      PasswordReset.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      await passwordResetRepository.createResetRequest("user123")

      expect(mockToString).toHaveBeenCalledWith("hex")
    })
  })

  describe("findValidToken", () => {
    it("should find valid (non-expired) token", async () => {
      const futureDate = new Date(Date.now() + 3600000)
      const validReset = { ...mockPasswordReset, expiresAt: futureDate }

      mockFindOne.mockResolvedValue(validReset)

      const result = await passwordResetRepository.findValidToken("valid-token")

      expect(mockFindOne).toHaveBeenCalledWith({
        token: "valid-token",
        expiresAt: { $gt: expect.any(Date) },
      })
      expect(result).toEqual(validReset)
    })

    it("should return null for expired token", async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await passwordResetRepository.findValidToken("expired-token")

      expect(result).toBeNull()
    })

    it("should return null for non-existent token", async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await passwordResetRepository.findValidToken("nonexistent-token")

      expect(result).toBeNull()
    })

    it("should query with current time for expiry check", async () => {
      const beforeQuery = Date.now()

      mockFindOne.mockResolvedValue(mockPasswordReset)

      await passwordResetRepository.findValidToken("token")

      const afterQuery = Date.now()

      const callArgs = mockFindOne.mock.calls[0][0]
      const expiryCheckTime = callArgs.expiresAt.$gt.getTime()

      expect(expiryCheckTime).toBeGreaterThanOrEqual(beforeQuery)
      expect(expiryCheckTime).toBeLessThanOrEqual(afterQuery)
    })
  })

  describe("invalidateUserTokens", () => {
    it("should delete all reset tokens for a user", async () => {
      mockDeleteMany.mockResolvedValue({ deletedCount: 2 })

      await passwordResetRepository.invalidateUserTokens("user123")

      expect(mockDeleteMany).toHaveBeenCalledWith({ userId: "user123" })
    })

    it("should handle case when user has no tokens", async () => {
      mockDeleteMany.mockResolvedValue({ deletedCount: 0 })

      await passwordResetRepository.invalidateUserTokens("user456")

      expect(mockDeleteMany).toHaveBeenCalledWith({ userId: "user456" })
    })

    it("should handle database errors", async () => {
      mockDeleteMany.mockRejectedValue(new Error("Database error"))

      await expect(passwordResetRepository.invalidateUserTokens("user123")).rejects.toThrow(
        "Database error"
      )
    })
  })

  describe("findById", () => {
    it("should find password reset by id", async () => {
      mockFindById.mockResolvedValue(mockPasswordReset)

      const result = await passwordResetRepository.findById("reset123")

      expect(mockFindById).toHaveBeenCalledWith("reset123")
      expect(result).toEqual(mockPasswordReset)
    })

    it("should return null if not found", async () => {
      mockFindById.mockResolvedValue(null)

      const result = await passwordResetRepository.findById("nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("findOne", () => {
    it("should find password reset with custom query", async () => {
      mockFindOne.mockResolvedValue(mockPasswordReset)

      const result = await passwordResetRepository.findOne({ userId: "user123" })

      expect(mockFindOne).toHaveBeenCalledWith({ userId: "user123" })
      expect(result).toEqual(mockPasswordReset)
    })
  })

  describe("findMany", () => {
    it("should find multiple password resets", async () => {
      const mockResets = [mockPasswordReset, { ...mockPasswordReset, _id: "reset456" }]
      const mockQuery = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockResets),
      }
      mockFind.mockReturnValue(mockQuery)

      const result = await passwordResetRepository.findMany(
        { userId: "user123" },
        { limit: 10, skip: 0, sort: { createdAt: -1 } }
      )

      expect(mockFind).toHaveBeenCalledWith({ userId: "user123" })
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(mockQuery.skip).toHaveBeenCalledWith(0)
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toEqual(mockResets)
    })
  })

  describe("create", () => {
    it("should create password reset", async () => {
      const resetData = {
        userId: "user123",
        token: "token123",
        expiresAt: new Date(Date.now() + 3600000),
      }

      const mockSave = jest.fn().mockResolvedValue({ ...resetData, _id: "reset123" })
      PasswordReset.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      const result = await passwordResetRepository.create(resetData)

      expect(mockSave).toHaveBeenCalled()
    })
  })

  describe("update", () => {
    it("should update password reset", async () => {
      const updateData = { expiresAt: new Date(Date.now() + 7200000) }

      mockFindByIdAndUpdate.mockResolvedValue({
        ...mockPasswordReset,
        ...updateData,
      })

      const result = await passwordResetRepository.update("reset123", updateData)

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("reset123", updateData, { new: true })
      expect(result).toBeDefined()
    })

    it("should return null if not found", async () => {
      mockFindByIdAndUpdate.mockResolvedValue(null)

      const result = await passwordResetRepository.update("nonexistent", {})

      expect(result).toBeNull()
    })
  })

  describe("delete", () => {
    it("should delete password reset and return true", async () => {
      mockFindByIdAndDelete.mockResolvedValue(mockPasswordReset)

      const result = await passwordResetRepository.delete("reset123")

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith("reset123")
      expect(result).toBe(true)
    })

    it("should return false if not found", async () => {
      mockFindByIdAndDelete.mockResolvedValue(null)

      const result = await passwordResetRepository.delete("nonexistent")

      expect(result).toBe(false)
    })
  })

  describe("Security Tests", () => {
    it("should generate cryptographically secure tokens", async () => {
      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue("secure-token"),
      })

      const mockSave = jest.fn().mockResolvedValue({})
      PasswordReset.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      await passwordResetRepository.createResetRequest("user123")

      expect(crypto.randomBytes).toHaveBeenCalled()
    })

    it("should generate sufficiently long tokens (32 bytes = 64 hex chars)", async () => {
      const longToken = "a".repeat(64)

      ;(crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: jest.fn().mockReturnValue(longToken),
      })

      const mockSave = jest.fn().mockResolvedValue({})
      PasswordReset.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      const result = await passwordResetRepository.createResetRequest("user123")

      expect(result.token.length).toBeGreaterThanOrEqual(32)
    })
  })
})
