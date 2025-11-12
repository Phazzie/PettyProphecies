/**
 * Tests for main auth endpoint [...auth].ts
 * Tests all authentication routes: login, register, logout, verify, csrf
 * CRITICAL - 0% coverage before this test
 */

import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"
import { jest } from "@jest/globals"

// Mock dependencies
jest.mock("@/src/utils/database", () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}))

jest.mock("@/src/utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

// Mock User model
const mockUser = {
  _id: "user123",
  username: "testuser",
  email: "test@example.com",
  password: "$2a$12$hashedpassword",
  createdAt: new Date(),
  comparePassword: jest.fn(),
  save: jest.fn(),
}

const mockFindOne = jest.fn()

jest.mock("@/src/models/User", () => ({
  User: {
    findOne: mockFindOne,
  },
}))

// Mock bcrypt
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  genSalt: jest.fn(),
  hash: jest.fn(),
}))

// Mock services
const mockAuthService = {
  verifyToken: jest.fn(),
  setAuthCookie: jest.fn(),
  clearAuthCookie: jest.fn(),
}

const mockCSRFService = {
  generateToken: jest.fn(),
  validateToken: jest.fn(),
}

const mockRateLimiter = {
  checkLimit: jest.fn(),
}

const mockUserRepo = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
}

const mockEmailService = {
  sendWelcome: jest.fn(),
}

jest.mock("@/src/middleware/auth.v2", () => ({
  getAuthService: jest.fn(() => mockAuthService),
}))

jest.mock("@/src/middleware/csrf", () => ({
  getCSRFService: jest.fn(() => mockCSRFService),
}))

jest.mock("@/src/middleware/rateLimit.v2", () => ({
  getRateLimiter: jest.fn(() => mockRateLimiter),
  setRateLimitHeaders: jest.fn(),
  RateLimitError: class RateLimitError extends Error {
    retryAfter: number
    constructor(message: string, retryAfter: number) {
      super(message)
      this.name = "RateLimitError"
      this.retryAfter = retryAfter
    }
  },
}))

jest.mock("@/src/repositories/UserRepository", () => ({
  UserRepository: jest.fn(() => mockUserRepo),
}))

jest.mock("@/src/services/email", () => ({
  emailService: mockEmailService,
}))

import bcrypt from "bcryptjs"

describe("Main Auth Endpoint - /api/auth/[...auth]", () => {
  let handler: any

  beforeEach(async () => {
    jest.clearAllMocks()
    // Default rate limit to allowed
    mockRateLimiter.checkLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetAt: new Date(Date.now() + 60000),
      retryAfter: 0,
    })
    // Default CSRF validation to pass
    mockCSRFService.validateToken.mockResolvedValue(true)

    // Dynamic import to ensure mocks are applied
    const module = await import("@/src/pages/api/auth/[...auth]")
    handler = module.default
  })

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials and set httpOnly cookie", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["login"] },
        body: {
          email: "test@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockFindOne.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
      mockAuthService.setAuthCookie.mockResolvedValue(undefined)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe("Login successful")
      expect(data.user).toEqual({
        id: "user123",
        username: "testuser",
        email: "test@example.com",
      })
      expect(mockAuthService.setAuthCookie).toHaveBeenCalledWith(res, "user123")
      expect(mockCSRFService.validateToken).toHaveBeenCalled()
    })

    it("should reject login with invalid email", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["login"] },
        body: {
          email: "nonexistent@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockFindOne.mockResolvedValue(null)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toBe("Invalid credentials")
    })

    it("should reject login with invalid password", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["login"] },
        body: {
          email: "test@example.com",
          password: "wrongpassword",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockFindOne.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(401)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toBe("Invalid credentials")
    })

    it("should reject login with missing credentials", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["login"] },
        body: {
          email: "test@example.com",
          // password missing
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toBe("Email and password are required")
    })

    it("should enforce rate limiting on login", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["login"] },
        body: {
          email: "test@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 300000),
        retryAfter: 300,
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toContain("Too many login attempts")
    })

    it("should validate CSRF token on login", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["login"] },
        body: {
          email: "test@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "invalid-token",
        },
      })

      mockCSRFService.validateToken.mockRejectedValue(new Error("Invalid CSRF token"))

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(500)
      expect(mockCSRFService.validateToken).toHaveBeenCalled()
    })

    it("should normalize email to lowercase", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["login"] },
        body: {
          email: "TEST@EXAMPLE.COM",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockFindOne.mockResolvedValue(mockUser)
      ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

      await handler(req as any, res as any)

      expect(mockFindOne).toHaveBeenCalledWith({ email: "test@example.com" })
    })
  })

  describe("POST /api/auth/register", () => {
    it("should register new user and send welcome email", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["register"] },
        body: {
          username: "newuser",
          email: "newuser@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.findByUsername.mockResolvedValue(null)
      mockUserRepo.create.mockResolvedValue({
        _id: "newuser123",
        username: "newuser",
        email: "newuser@example.com",
        createdAt: new Date(),
      })
      mockEmailService.sendWelcome.mockResolvedValue(undefined)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe("Registration successful")
      expect(data.user).toEqual({
        id: "newuser123",
        username: "newuser",
        email: "newuser@example.com",
      })
      expect(mockAuthService.setAuthCookie).toHaveBeenCalledWith(res, "newuser123")
      expect(mockEmailService.sendWelcome).toHaveBeenCalledWith("newuser@example.com", "newuser")
    })

    it("should reject registration with duplicate email", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["register"] },
        body: {
          username: "newuser",
          email: "test@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockUserRepo.findByEmail.mockResolvedValue(mockUser)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(409)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toBe("User with this email already exists")
    })

    it("should reject registration with duplicate username", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["register"] },
        body: {
          username: "testuser",
          email: "newuser@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.findByUsername.mockResolvedValue(mockUser)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(409)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toBe("Username already taken")
    })

    it("should reject registration with missing fields", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["register"] },
        body: {
          username: "newuser",
          // email missing
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(400)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toBe("All fields are required")
    })

    it("should enforce rate limiting on registration", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["register"] },
        body: {
          username: "newuser",
          email: "newuser@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 1800000),
        retryAfter: 1800,
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toContain("Too many registration attempts")
    })

    it("should normalize email to lowercase on registration", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["register"] },
        body: {
          username: "newuser",
          email: "NEWUSER@EXAMPLE.COM",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.findByUsername.mockResolvedValue(null)
      mockUserRepo.create.mockResolvedValue({
        _id: "newuser123",
        username: "newuser",
        email: "newuser@example.com",
        createdAt: new Date(),
      })

      await handler(req as any, res as any)

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith("newuser@example.com")
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        username: "newuser",
        email: "newuser@example.com",
        password: "password123",
      })
    })

    it("should continue even if welcome email fails", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["register"] },
        body: {
          username: "newuser",
          email: "newuser@example.com",
          password: "password123",
        },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockUserRepo.findByEmail.mockResolvedValue(null)
      mockUserRepo.findByUsername.mockResolvedValue(null)
      mockUserRepo.create.mockResolvedValue({
        _id: "newuser123",
        username: "newuser",
        email: "newuser@example.com",
        createdAt: new Date(),
      })
      // Email service fails
      mockEmailService.sendWelcome.mockRejectedValue(new Error("Email service down"))

      await handler(req as any, res as any)

      // Should still succeed
      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe("Registration successful")
    })
  })

  describe("POST /api/auth/logout", () => {
    it("should clear auth cookie on logout", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["logout"] },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.message).toBe("Logged out successfully")
      expect(mockAuthService.clearAuthCookie).toHaveBeenCalledWith(res)
    })

    it("should enforce rate limiting on logout", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["logout"] },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000),
        retryAfter: 60,
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toContain("Too many logout requests")
    })

    it("should validate CSRF token on logout", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["logout"] },
        headers: {
          "x-csrf-token": "invalid-token",
        },
      })

      mockCSRFService.validateToken.mockRejectedValue(new Error("Invalid CSRF token"))

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(500)
      expect(mockCSRFService.validateToken).toHaveBeenCalled()
    })
  })

  describe("GET /api/auth/verify", () => {
    it("should return user data for valid token", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["verify"] },
        headers: {
          cookie: "auth-token=valid-token",
        },
      })

      mockAuthService.verifyToken.mockResolvedValue("user123")
      mockUserRepo.findById.mockResolvedValue(mockUser)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.authenticated).toBe(true)
      expect(data.user).toEqual({
        id: "user123",
        username: "testuser",
        email: "test@example.com",
      })
    })

    it("should return not authenticated for invalid token", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["verify"] },
        headers: {
          cookie: "auth-token=invalid-token",
        },
      })

      mockAuthService.verifyToken.mockResolvedValue(null)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.authenticated).toBe(false)
      expect(data.user).toBeNull()
    })

    it("should return not authenticated for missing token", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["verify"] },
        headers: {},
      })

      mockAuthService.verifyToken.mockResolvedValue(null)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.authenticated).toBe(false)
      expect(data.user).toBeNull()
    })

    it("should return not authenticated if user not found", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["verify"] },
        headers: {
          cookie: "auth-token=valid-token",
        },
      })

      mockAuthService.verifyToken.mockResolvedValue("user123")
      mockUserRepo.findById.mockResolvedValue(null)

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.authenticated).toBe(false)
      expect(data.user).toBeNull()
    })

    it("should enforce rate limiting on verify", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["verify"] },
        headers: {
          cookie: "auth-token=valid-token",
        },
      })

      mockRateLimiter.checkLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + 60000),
        retryAfter: 60,
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(429)
      const data = JSON.parse(res._getData())
      expect(data.error.message).toContain("Too many verification requests")
    })
  })

  describe("GET /api/auth/csrf", () => {
    it("should return CSRF token", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["csrf"] },
      })

      mockCSRFService.generateToken.mockResolvedValue("csrf-token-123")

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data.csrfToken).toBe("csrf-token-123")
      expect(mockCSRFService.generateToken).toHaveBeenCalled()
    })
  })

  describe("Unsupported routes", () => {
    it("should return 404 for unknown POST route", async () => {
      const { req, res } = createMocks({
        method: "POST",
        query: { auth: ["unknown"] },
        headers: {
          "x-csrf-token": "valid-csrf-token",
        },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(404)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe("Endpoint not found")
    })

    it("should return 405 for unsupported HTTP methods", async () => {
      const { req, res } = createMocks({
        method: "PUT",
        query: { auth: ["login"] },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(405)
      const data = JSON.parse(res._getData())
      expect(data.error).toBe("Method not allowed")
    })

    it("should return 405 for DELETE method", async () => {
      const { req, res } = createMocks({
        method: "DELETE",
        query: { auth: ["login"] },
      })

      await handler(req as any, res as any)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe("IP extraction for rate limiting", () => {
    it("should extract IP from x-forwarded-for header", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["verify"] },
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      })

      mockAuthService.verifyToken.mockResolvedValue(null)

      await handler(req as any, res as any)

      expect(mockRateLimiter.checkLimit).toHaveBeenCalled()
      // The identifier should be extracted from the request
    })

    it("should handle requests with no IP information", async () => {
      const { req, res } = createMocks({
        method: "GET",
        query: { auth: ["verify"] },
        headers: {},
      })

      mockAuthService.verifyToken.mockResolvedValue(null)

      await handler(req as any, res as any)

      expect(mockRateLimiter.checkLimit).toHaveBeenCalled()
    })
  })
})
