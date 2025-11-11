/**
 * UserRepository Tests
 *
 * Tests for UserRepository implementation
 * Following TDD - tests written BEFORE implementation
 * Uses mocked mongoose models
 */

// Mock the User model BEFORE importing
const mockUser = {
  _id: "user123",
  username: "testuser",
  email: "test@example.com",
  password: "$2a$10$hashedpassword",
  createdAt: new Date(),
  updatedAt: new Date(),
  comparePassword: jest.fn(),
  save: jest.fn(),
}

const mockFindById = jest.fn()
const mockFindOne = jest.fn()
const mockFind = jest.fn()
const mockFindByIdAndUpdate = jest.fn()
const mockFindByIdAndDelete = jest.fn()

jest.mock("@/src/models/User", () => ({
  User: jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn(),
    comparePassword: jest.fn(),
  })),
}))

// Get mocked User after jest.mock
const { User } = require("@/src/models/User")

// Assign static methods after getting mocked User
User.findById = mockFindById
User.findOne = mockFindOne
User.find = mockFind
User.findByIdAndUpdate = mockFindByIdAndUpdate
User.findByIdAndDelete = mockFindByIdAndDelete

import { UserRepository } from "@/src/repositories/UserRepository"

describe("UserRepository", () => {
  let userRepository: UserRepository

  beforeEach(() => {
    userRepository = new UserRepository()
    jest.clearAllMocks()
  })

  describe("findById", () => {
    it("should find user by id", async () => {
      mockFindById.mockResolvedValue(mockUser)

      const result = await userRepository.findById("user123")

      expect(mockFindById).toHaveBeenCalledWith("user123")
      expect(result).toEqual(mockUser)
    })

    it("should return null if user not found", async () => {
      mockFindById.mockResolvedValue(null)

      const result = await userRepository.findById("nonexistent")

      expect(result).toBeNull()
    })

    it("should handle database errors", async () => {
      mockFindById.mockRejectedValue(new Error("Database error"))

      await expect(userRepository.findById("user123")).rejects.toThrow("Database error")
    })
  })

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      mockFindOne.mockResolvedValue(mockUser)

      const result = await userRepository.findByEmail("test@example.com")

      expect(mockFindOne).toHaveBeenCalledWith({ email: "test@example.com" })
      expect(result).toEqual(mockUser)
    })

    it("should return null if user not found by email", async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await userRepository.findByEmail("nonexistent@example.com")

      expect(result).toBeNull()
    })

    it("should handle case-insensitive email search", async () => {
      mockFindOne.mockResolvedValue(mockUser)

      await userRepository.findByEmail("TEST@EXAMPLE.COM")

      expect(mockFindOne).toHaveBeenCalledWith({ email: "test@example.com" })
    })
  })

  describe("findByUsername", () => {
    it("should find user by username", async () => {
      mockFindOne.mockResolvedValue(mockUser)

      const result = await userRepository.findByUsername("testuser")

      expect(mockFindOne).toHaveBeenCalledWith({ username: "testuser" })
      expect(result).toEqual(mockUser)
    })

    it("should return null if user not found by username", async () => {
      mockFindOne.mockResolvedValue(null)

      const result = await userRepository.findByUsername("nonexistent")

      expect(result).toBeNull()
    })

    it("should handle case-insensitive username search", async () => {
      mockFindOne.mockResolvedValue(mockUser)

      await userRepository.findByUsername("TESTUSER")

      expect(mockFindOne).toHaveBeenCalledWith({ username: "testuser" })
    })
  })

  describe("create", () => {
    it("should create a new user", async () => {
      const userData = {
        username: "newuser",
        email: "new@example.com",
        password: "password123",
      }

      const mockSave = jest.fn().mockResolvedValue({ ...userData, _id: "newid123" })
      User.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      const result = await userRepository.create(userData)

      expect(mockSave).toHaveBeenCalled()
    })

    it("should handle duplicate email error", async () => {
      const userData = {
        username: "newuser",
        email: "existing@example.com",
        password: "password123",
      }

      const duplicateError = new Error("E11000 duplicate key error") as any
      duplicateError.code = 11000
      duplicateError.keyPattern = { email: 1 }

      const mockSave = jest.fn().mockRejectedValue(duplicateError)
      User.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      await expect(userRepository.create(userData)).rejects.toThrow(
        "User with this email already exists"
      )
    })

    it("should handle duplicate username error", async () => {
      const userData = {
        username: "existinguser",
        email: "new@example.com",
        password: "password123",
      }

      const duplicateError = new Error("E11000 duplicate key error") as any
      duplicateError.code = 11000
      duplicateError.keyPattern = { username: 1 }

      const mockSave = jest.fn().mockRejectedValue(duplicateError)
      User.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      await expect(userRepository.create(userData)).rejects.toThrow(
        "User with this username already exists"
      )
    })

    it("should propagate other errors", async () => {
      const userData = {
        username: "newuser",
        email: "new@example.com",
        password: "password123",
      }

      const mockSave = jest.fn().mockRejectedValue(new Error("Database connection failed"))
      User.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      await expect(userRepository.create(userData)).rejects.toThrow("Database connection failed")
    })
  })

  describe("verifyPassword", () => {
    it("should return true for correct password", async () => {
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      }
      mockFindById.mockResolvedValue(userWithPassword)

      const result = await userRepository.verifyPassword("user123", "correctpassword")

      expect(result).toBe(true)
      expect(mockFindById).toHaveBeenCalledWith("user123")
      expect(userWithPassword.comparePassword).toHaveBeenCalledWith("correctpassword")
    })

    it("should return false for incorrect password", async () => {
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      }
      mockFindById.mockResolvedValue(userWithPassword)

      const result = await userRepository.verifyPassword("user123", "wrongpassword")

      expect(result).toBe(false)
    })

    it("should return false if user not found", async () => {
      mockFindById.mockResolvedValue(null)

      const result = await userRepository.verifyPassword("nonexistent", "password")

      expect(result).toBe(false)
    })

    it("should handle errors during password comparison", async () => {
      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockRejectedValue(new Error("Comparison error")),
      }
      mockFindById.mockResolvedValue(userWithPassword)

      await expect(userRepository.verifyPassword("user123", "password")).rejects.toThrow(
        "Comparison error"
      )
    })
  })

  describe("updatePassword", () => {
    it("should update user password", async () => {
      const userToUpdate = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(true),
      }
      mockFindById.mockResolvedValue(userToUpdate)

      await userRepository.updatePassword("user123", "newPassword123")

      expect(mockFindById).toHaveBeenCalledWith("user123")
      expect(userToUpdate.password).toBe("newPassword123")
      expect(userToUpdate.save).toHaveBeenCalled()
    })

    it("should throw error if user not found", async () => {
      mockFindById.mockResolvedValue(null)

      await expect(userRepository.updatePassword("nonexistent", "newPassword")).rejects.toThrow(
        "User not found"
      )
    })

    it("should hash password before saving (via pre-save hook)", async () => {
      const userToUpdate = {
        ...mockUser,
        save: jest.fn().mockResolvedValue(true),
      }
      mockFindById.mockResolvedValue(userToUpdate)

      await userRepository.updatePassword("user123", "plainPassword")

      expect(userToUpdate.password).toBe("plainPassword")
      expect(userToUpdate.save).toHaveBeenCalled()
    })
  })

  describe("update", () => {
    it("should update user fields", async () => {
      const updateData = {
        username: "updateduser",
      }

      mockFindByIdAndUpdate.mockResolvedValue({
        ...mockUser,
        ...updateData,
      })

      const result = await userRepository.update("user123", updateData)

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("user123", updateData, { new: true })
      expect(result?.username).toBe("updateduser")
    })

    it("should return null if user not found", async () => {
      mockFindByIdAndUpdate.mockResolvedValue(null)

      const result = await userRepository.update("nonexistent", { username: "test" })

      expect(result).toBeNull()
    })
  })

  describe("delete", () => {
    it("should delete user and return true", async () => {
      mockFindByIdAndDelete.mockResolvedValue(mockUser)

      const result = await userRepository.delete("user123")

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith("user123")
      expect(result).toBe(true)
    })

    it("should return false if user not found", async () => {
      mockFindByIdAndDelete.mockResolvedValue(null)

      const result = await userRepository.delete("nonexistent")

      expect(result).toBe(false)
    })
  })

  describe("findOne", () => {
    it("should find user with custom query", async () => {
      mockFindOne.mockResolvedValue(mockUser)

      const result = await userRepository.findOne({ email: "test@example.com" })

      expect(mockFindOne).toHaveBeenCalledWith({ email: "test@example.com" })
      expect(result).toEqual(mockUser)
    })
  })

  describe("findMany", () => {
    it("should find multiple users with query", async () => {
      const mockUsers = [mockUser, { ...mockUser, _id: "user456" }]
      const mockQuery = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockUsers),
      }
      mockFind.mockReturnValue(mockQuery)

      const result = await userRepository.findMany({}, { limit: 10, skip: 0, sort: { createdAt: -1 } })

      expect(mockFind).toHaveBeenCalledWith({})
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(mockQuery.skip).toHaveBeenCalledWith(0)
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toEqual(mockUsers)
    })
  })
})
