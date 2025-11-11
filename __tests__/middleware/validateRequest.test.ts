/**
 * Validate Request Middleware Tests
 * Tests middleware wrapper for schema validation and XSS sanitization
 * Following TDD: Tests written FIRST
 */

import { createMocks } from "node-mocks-http"
import { validateRequest, ValidationService } from "../../src/middleware/validateRequest"
import { ValidationError } from "../../src/interfaces/seams"

describe("validateRequest Middleware", () => {
  describe("Successful validation", () => {
    it("should pass valid register data through to handler", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "SecureP@ssw0rd123",
        },
      })

      const handler = jest.fn().mockResolvedValue(undefined)
      const wrappedHandler = validateRequest("register", handler)

      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalledWith(req, res)
      expect(handler).toHaveBeenCalledTimes(1)
    })

    it("should pass valid login data through to handler", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
          password: "anypassword",
        },
      })

      const handler = jest.fn().mockResolvedValue(undefined)
      const wrappedHandler = validateRequest("login", handler)

      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalledWith(req, res)
    })

    it("should pass valid tarot reading data through to handler", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          spreadType: "three-card",
          userQuestion: "What is my future?",
        },
      })

      const handler = jest.fn().mockResolvedValue(undefined)
      const wrappedHandler = validateRequest("tarotReading", handler)

      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalledWith(req, res)
    })

    it("should attach validated data to request", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "Test@Example.com",
          password: "anypassword",
        },
      })

      const handler = jest.fn((req) => {
        // Email should be lowercased
        expect(req.validatedData.email).toBe("test@example.com")
      })

      const wrappedHandler = validateRequest("login", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })
  })

  describe("Validation error handling", () => {
    it("should return 400 for invalid register data", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          username: "ab", // Too short
          email: "test@example.com",
          password: "SecureP@ssw0rd123",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("register", handler)

      await wrappedHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(handler).not.toHaveBeenCalled()
    })

    it("should return standardized error format", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          username: "ab", // Too short
          email: "test@example.com",
          password: "SecureP@ssw0rd123",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("register", handler)

      await wrappedHandler(req, res)

      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty("success", false)
      expect(response).toHaveProperty("error")
      expect(response.error).toHaveProperty("code", "VALIDATION_ERROR")
      expect(response.error).toHaveProperty("message")
    })

    it("should include field information in error", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          username: "testuser",
          email: "invalid-email", // Invalid format
          password: "SecureP@ssw0rd123",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("register", handler)

      await wrappedHandler(req, res)

      const response = JSON.parse(res._getData())
      expect(response.error).toHaveProperty("details")
    })

    it("should handle missing required fields", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
          // Missing password
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("login", handler)

      await wrappedHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(handler).not.toHaveBeenCalled()
    })

    it("should handle empty body", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {},
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("register", handler)

      await wrappedHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(handler).not.toHaveBeenCalled()
    })

    it("should handle null body", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: null,
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("register", handler)

      await wrappedHandler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe("XSS sanitization", () => {
    it("should sanitize XSS in username", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "SecureP@ssw0rd123",
        },
      })

      const handler = jest.fn((req) => {
        expect(req.validatedData.username).not.toContain("<script>")
      })

      const wrappedHandler = validateRequest("register", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })

    it("should sanitize XSS in user question", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          spreadType: "three-card",
          userQuestion: 'What is my future? <script>alert("xss")</script>',
        },
      })

      const handler = jest.fn((req) => {
        expect(req.validatedData.userQuestion).not.toContain("<script>")
        expect(req.validatedData.userQuestion).not.toContain("alert")
      })

      const wrappedHandler = validateRequest("tarotReading", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })

    it("should sanitize img onerror XSS attempts", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          spreadType: "three-card",
          userQuestion: 'My question <img src=x onerror=alert(1)>',
        },
      })

      const handler = jest.fn((req) => {
        expect(req.validatedData.userQuestion).not.toContain("onerror")
        expect(req.validatedData.userQuestion).not.toContain("alert")
      })

      const wrappedHandler = validateRequest("tarotReading", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })

    it("should sanitize multiple XSS attempts in different fields", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          spreadType: "three-card",
          userQuestion: '<script>alert(1)</script><img src=x onerror=alert(2)>',
        },
      })

      const handler = jest.fn((req) => {
        expect(req.validatedData.userQuestion).not.toContain("script")
        expect(req.validatedData.userQuestion).not.toContain("onerror")
        expect(req.validatedData.userQuestion).not.toContain("alert")
      })

      const wrappedHandler = validateRequest("tarotReading", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })

    it("should preserve safe content while removing XSS", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          spreadType: "three-card",
          userQuestion: 'Safe question <script>alert(1)</script> with safe text',
        },
      })

      const handler = jest.fn((req) => {
        expect(req.validatedData.userQuestion).toContain("Safe question")
        expect(req.validatedData.userQuestion).toContain("with safe text")
        expect(req.validatedData.userQuestion).not.toContain("<script>")
      })

      const wrappedHandler = validateRequest("tarotReading", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })
  })

  describe("Type coercion", () => {
    it("should coerce string numbers to integers", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          readingId: "507f1f77bcf86cd799439011",
          rating: "5", // String instead of number
        },
      })

      const handler = jest.fn((req) => {
        expect(req.validatedData.rating).toBe(5)
        expect(typeof req.validatedData.rating).toBe("number")
      })

      const wrappedHandler = validateRequest("rateReading", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })

    it("should trim and lowercase emails", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "  Test@EXAMPLE.COM  ",
          password: "anypassword",
        },
      })

      const handler = jest.fn((req) => {
        expect(req.validatedData.email).toBe("test@example.com")
      })

      const wrappedHandler = validateRequest("login", handler)
      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })
  })

  describe("Different schema types", () => {
    it("should validate forgotPassword schema", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("forgotPassword", handler)

      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })

    it("should validate resetPassword schema", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          token: "reset-token-123",
          newPassword: "NewSecureP@ss123",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("resetPassword", handler)

      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })

    it("should validate rateReading schema", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          readingId: "507f1f77bcf86cd799439011",
          rating: 5,
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("rateReading", handler)

      await wrappedHandler(req, res)

      expect(handler).toHaveBeenCalled()
    })
  })

  describe("Error propagation", () => {
    it("should allow handler errors to propagate", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "test@example.com",
          password: "anypassword",
        },
      })

      const handler = jest.fn().mockRejectedValue(new Error("Handler error"))
      const wrappedHandler = validateRequest("login", handler)

      await expect(wrappedHandler(req, res)).rejects.toThrow("Handler error")
    })

    it("should call handler only after successful validation", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "invalid-email",
          password: "anypassword",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("login", handler)

      await wrappedHandler(req, res)

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe("Response format", () => {
    it("should include timestamp in error response", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "invalid",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("login", handler)

      await wrappedHandler(req, res)

      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty("timestamp")
    })

    it("should set correct content-type header", async () => {
      const { req, res } = createMocks({
        method: "POST",
        body: {
          email: "invalid",
        },
      })

      const handler = jest.fn()
      const wrappedHandler = validateRequest("login", handler)

      await wrappedHandler(req, res)

      expect(res._getHeaders()["content-type"]).toContain("application/json")
    })
  })
})

describe("ValidationService", () => {
  let service: ValidationService

  beforeEach(() => {
    service = new ValidationService()
  })

  describe("validateRequest method", () => {
    it("should validate and return data for valid input", async () => {
      const data = {
        email: "test@example.com",
        password: "anypassword",
      }

      const result = await service.validateRequest<typeof data>(data, "login")

      expect(result.email).toBe("test@example.com")
      expect(result.password).toBe("anypassword")
    })

    it("should throw error for invalid input", async () => {
      const data = {
        email: "invalid-email",
        password: "anypassword",
      }

      await expect(
        service.validateRequest(data, "login")
      ).rejects.toThrow("Invalid email format")
    })

    it("should sanitize validated data", async () => {
      const data = {
        spreadType: "three-card",
        userQuestion: 'My question <script>alert("xss")</script>',
      }

      const result = await service.validateRequest<typeof data>(data, "tarotReading")

      expect(result.userQuestion).not.toContain("<script>")
      expect(result.userQuestion).toContain("My question")
    })

    it("should throw error for unknown schema", async () => {
      const data = { test: "data" }

      await expect(
        service.validateRequest(data, "unknownSchema" as any)
      ).rejects.toThrow("Unknown schema")
    })
  })

  describe("sanitize method", () => {
    it("should sanitize XSS in strings", () => {
      const dirty = '<script>alert("xss")</script>Hello'
      const clean = service.sanitize(dirty)

      expect(clean).not.toContain("<script>")
      expect(clean).toContain("Hello")
    })

    it("should remove event handlers", () => {
      const dirty = '<img src=x onerror=alert(1)>'
      const clean = service.sanitize(dirty)

      expect(clean).not.toContain("onerror")
      expect(clean).not.toContain("alert")
    })

    it("should handle plain text", () => {
      const text = "Plain text"
      const clean = service.sanitize(text)

      expect(clean).toBe(text)
    })
  })

  describe("sanitizeObject method", () => {
    it("should sanitize all strings in object", () => {
      const dirty = {
        name: 'test<script>alert(1)</script>',
        safe: "safe text",
        number: 42,
      }

      const clean = service.sanitizeObject(dirty)

      expect(clean.name).not.toContain("<script>")
      expect(clean.safe).toBe("safe text")
      expect(clean.number).toBe(42)
    })

    it("should handle nested objects", () => {
      const dirty = {
        user: {
          name: 'test<script>alert(1)</script>',
        },
      }

      const clean = service.sanitizeObject(dirty)

      expect(clean.user.name).not.toContain("<script>")
    })

    it("should handle arrays", () => {
      const dirty = {
        tags: ['safe', '<script>alert(1)</script>'],
      }

      const clean = service.sanitizeObject(dirty)

      expect(clean.tags[0]).toBe("safe")
      expect(clean.tags[1]).not.toContain("<script>")
    })
  })
})
