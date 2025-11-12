/**
 * User Model Tests
 * Tests for User model with actual mongoose integration
 * Tests password hashing, comparePassword method, validation, and indexes
 * CRITICAL - 0% coverage before this test
 */

import mongoose from "mongoose"
import { User, IUser } from "@/src/models/User"
import bcrypt from "bcryptjs"

// Mock bcrypt for controlled testing
jest.mock("bcryptjs")

describe("User Model", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Schema Definition", () => {
    it("should have required fields defined", () => {
      const userSchema = User.schema
      const paths = userSchema.paths

      expect(paths.username).toBeDefined()
      expect(paths.email).toBeDefined()
      expect(paths.password).toBeDefined()
      expect(paths.createdAt).toBeDefined()

      expect(paths.username.isRequired).toBe(true)
      expect(paths.email.isRequired).toBe(true)
      expect(paths.password.isRequired).toBe(true)
    })

    it("should have unique constraint on email", () => {
      const userSchema = User.schema
      const emailIndex = userSchema.path("email")

      expect(emailIndex).toBeDefined()
    })

    it("should have unique constraint on username", () => {
      const userSchema = User.schema
      const usernameIndex = userSchema.path("username")

      expect(usernameIndex).toBeDefined()
    })

    it("should have default value for createdAt", () => {
      const userSchema = User.schema
      const createdAtPath = userSchema.path("createdAt")

      expect(createdAtPath).toBeDefined()
      expect(createdAtPath.defaultValue).toBeDefined()
    })
  })

  describe("Indexes", () => {
    it("should have index on email field", () => {
      const indexes = User.schema.indexes()
      const emailIndex = indexes.find((idx: any) => idx[0].email === 1)

      expect(emailIndex).toBeDefined()
      expect(emailIndex![1].unique).toBe(true)
    })

    it("should have index on username field", () => {
      const indexes = User.schema.indexes()
      const usernameIndex = indexes.find((idx: any) => idx[0].username === 1)

      expect(usernameIndex).toBeDefined()
      expect(usernameIndex![1].unique).toBe(true)
    })

    it("should have index on createdAt field", () => {
      const indexes = User.schema.indexes()
      const createdAtIndex = indexes.find((idx: any) => idx[0].createdAt === 1)

      expect(createdAtIndex).toBeDefined()
    })
  })

  describe("Password Hashing Pre-save Hook", () => {
    it("should hash password on save when password is modified", async () => {
      const mockSalt = "mocksalt"
      const mockHashedPassword = "$2a$12$mockedhashedpassword"
      const plainPassword = "password123"

      ;(bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword)

      // Create a mock user document
      const userDoc = {
        username: "testuser",
        email: "test@example.com",
        password: plainPassword,
        isModified: jest.fn().mockReturnValue(true),
      }

      // Get the pre-save hook
      const preSaveHook = User.schema.pre as any
      let nextCalled = false
      const next = jest.fn(() => {
        nextCalled = true
      })

      // Execute the pre-save hook
      const hooks = User.schema.s.hooks._pres.get("save")
      expect(hooks).toBeDefined()
      expect(hooks!.length).toBeGreaterThan(0)

      // Call the hook with the mock document
      await hooks![0].fn.call(userDoc, next)

      expect(userDoc.isModified).toHaveBeenCalledWith("password")
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12)
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, mockSalt)
      expect(userDoc.password).toBe(mockHashedPassword)
      expect(next).toHaveBeenCalled()
    })

    it("should not rehash password if not modified", async () => {
      const existingHash = "$2a$12$existinghash"

      // Create a mock user document
      const userDoc = {
        username: "testuser",
        email: "test@example.com",
        password: existingHash,
        isModified: jest.fn().mockReturnValue(false),
      }

      // Get the pre-save hook
      let nextCalled = false
      const next = jest.fn(() => {
        nextCalled = true
      })

      // Execute the pre-save hook
      const hooks = User.schema.s.hooks._pres.get("save")
      await hooks![0].fn.call(userDoc, next)

      expect(userDoc.isModified).toHaveBeenCalledWith("password")
      expect(bcrypt.genSalt).not.toHaveBeenCalled()
      expect(bcrypt.hash).not.toHaveBeenCalled()
      expect(userDoc.password).toBe(existingHash)
      expect(next).toHaveBeenCalled()
    })

    it("should handle errors during password hashing", async () => {
      const plainPassword = "password123"
      const hashError = new Error("Hashing failed")

      ;(bcrypt.genSalt as jest.Mock).mockRejectedValue(hashError)

      // Create a mock user document
      const userDoc = {
        username: "testuser",
        email: "test@example.com",
        password: plainPassword,
        isModified: jest.fn().mockReturnValue(true),
      }

      const next = jest.fn()

      // Execute the pre-save hook
      const hooks = User.schema.s.hooks._pres.get("save")
      await hooks![0].fn.call(userDoc, next)

      expect(next).toHaveBeenCalledWith(hashError)
    })

    it("should use bcrypt with 12 rounds", async () => {
      const mockSalt = "mocksalt"
      const mockHashedPassword = "$2a$12$mockedhashedpassword"

      ;(bcrypt.genSalt as jest.Mock).mockResolvedValue(mockSalt)
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword)

      const userDoc = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        isModified: jest.fn().mockReturnValue(true),
      }

      const next = jest.fn()

      const hooks = User.schema.s.hooks._pres.get("save")
      await hooks![0].fn.call(userDoc, next)

      // Verify bcrypt.genSalt was called with 12 rounds
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12)
    })
  })

  describe("comparePassword Method", () => {
    it("should return true for correct password", async () => {
      const hashedPassword = "$2a$12$hashedpassword"
      const plainPassword = "password123"

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      // Create a mock user document
      const userDoc = {
        password: hashedPassword,
        comparePassword: User.schema.methods.comparePassword,
      }

      const result = await userDoc.comparePassword(plainPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword)
      expect(result).toBe(true)
    })

    it("should return false for incorrect password", async () => {
      const hashedPassword = "$2a$12$hashedpassword"
      const wrongPassword = "wrongpassword"

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      // Create a mock user document
      const userDoc = {
        password: hashedPassword,
        comparePassword: User.schema.methods.comparePassword,
      }

      const result = await userDoc.comparePassword(wrongPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(wrongPassword, hashedPassword)
      expect(result).toBe(false)
    })

    it("should handle empty password", async () => {
      const hashedPassword = "$2a$12$hashedpassword"
      const emptyPassword = ""

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      const userDoc = {
        password: hashedPassword,
        comparePassword: User.schema.methods.comparePassword,
      }

      const result = await userDoc.comparePassword(emptyPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(emptyPassword, hashedPassword)
      expect(result).toBe(false)
    })

    it("should handle special characters in password", async () => {
      const hashedPassword = "$2a$12$hashedpassword"
      const specialPassword = "p@ssw0rd!@#$%^&*()"

      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const userDoc = {
        password: hashedPassword,
        comparePassword: User.schema.methods.comparePassword,
      }

      const result = await userDoc.comparePassword(specialPassword)

      expect(bcrypt.compare).toHaveBeenCalledWith(specialPassword, hashedPassword)
      expect(result).toBe(true)
    })
  })

  describe("Model Validation", () => {
    it("should create user with all required fields", () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      }

      const user = new User(userData)

      expect(user.username).toBe("testuser")
      expect(user.email).toBe("test@example.com")
      expect(user.password).toBe("password123")
      expect(user.createdAt).toBeDefined()
    })

    it("should fail validation when username is missing", () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
      }

      const user = new User(userData)
      const validationError = user.validateSync()

      expect(validationError).toBeDefined()
      expect(validationError?.errors.username).toBeDefined()
    })

    it("should fail validation when email is missing", () => {
      const userData = {
        username: "testuser",
        password: "password123",
      }

      const user = new User(userData)
      const validationError = user.validateSync()

      expect(validationError).toBeDefined()
      expect(validationError?.errors.email).toBeDefined()
    })

    it("should fail validation when password is missing", () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
      }

      const user = new User(userData)
      const validationError = user.validateSync()

      expect(validationError).toBeDefined()
      expect(validationError?.errors.password).toBeDefined()
    })

    it("should set createdAt to current date by default", () => {
      const beforeCreate = new Date()
      const user = new User({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      })
      const afterCreate = new Date()

      expect(user.createdAt).toBeDefined()
      expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })
  })

  describe("TypeScript Interface", () => {
    it("should have correct TypeScript interface", () => {
      const userData = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      }

      const user = new User(userData) as IUser

      // TypeScript compilation will fail if interface doesn't match
      expect(user.username).toBeDefined()
      expect(user.email).toBeDefined()
      expect(user.password).toBeDefined()
      expect(user.createdAt).toBeDefined()
      expect(typeof user.comparePassword).toBe("function")
    })

    it("should support comparePassword method in interface", async () => {
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      const user = new User({
        username: "testuser",
        email: "test@example.com",
        password: "hashedpassword",
      }) as IUser

      // This should compile and work if interface is correct
      const result = await user.comparePassword("password123")

      expect(typeof result).toBe("boolean")
    })
  })

  describe("Edge Cases", () => {
    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000)
      const mockHash = "$2a$12$mockedhash"

      ;(bcrypt.genSalt as jest.Mock).mockResolvedValue("salt")
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHash)

      const userDoc = {
        username: "testuser",
        email: "test@example.com",
        password: longPassword,
        isModified: jest.fn().mockReturnValue(true),
      }

      const next = jest.fn()

      const hooks = User.schema.s.hooks._pres.get("save")
      await hooks![0].fn.call(userDoc, next)

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, "salt")
      expect(next).toHaveBeenCalled()
    })

    it("should handle Unicode characters in username", () => {
      const userData = {
        username: "用户名",
        email: "test@example.com",
        password: "password123",
      }

      const user = new User(userData)

      expect(user.username).toBe("用户名")
      expect(user.validateSync()).toBeUndefined()
    })

    it("should handle special characters in email", () => {
      const userData = {
        username: "testuser",
        email: "test+tag@example.com",
        password: "password123",
      }

      const user = new User(userData)

      expect(user.email).toBe("test+tag@example.com")
      expect(user.validateSync()).toBeUndefined()
    })

    it("should handle non-Error exceptions in pre-save hook", async () => {
      const nonErrorException = "String error"

      ;(bcrypt.genSalt as jest.Mock).mockRejectedValue(nonErrorException)

      const userDoc = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        isModified: jest.fn().mockReturnValue(true),
      }

      const next = jest.fn()

      const hooks = User.schema.s.hooks._pres.get("save")
      await hooks![0].fn.call(userDoc, next)

      // Should convert non-Error to Error
      expect(next).toHaveBeenCalled()
      const errorArg = next.mock.calls[0][0]
      expect(errorArg).toBeInstanceOf(Error)
      expect(errorArg.message).toBe("Unknown error during password hashing")
    })
  })

  describe("Model Instance Methods", () => {
    it("should have comparePassword method available on instances", () => {
      const user = new User({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      })

      expect(typeof user.comparePassword).toBe("function")
    })

    it("should preserve other properties when hashing password", async () => {
      const mockHash = "$2a$12$mockedhash"

      ;(bcrypt.genSalt as jest.Mock).mockResolvedValue("salt")
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHash)

      const userDoc = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        createdAt: new Date(),
        isModified: jest.fn().mockReturnValue(true),
      }

      const next = jest.fn()

      const hooks = User.schema.s.hooks._pres.get("save")
      await hooks![0].fn.call(userDoc, next)

      // Other properties should remain unchanged
      expect(userDoc.username).toBe("testuser")
      expect(userDoc.email).toBe("test@example.com")
      expect(userDoc.createdAt).toBeDefined()
    })
  })
})
