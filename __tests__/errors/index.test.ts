/**
 * Error Classes Tests
 *
 * Tests for custom error classes defined in seams.ts
 * Ensures proper construction, inheritance, and serialization
 */
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  CSRFError,
} from "../../src/interfaces/seams"

describe("Error Classes", () => {
  describe("ValidationError", () => {
    it("should construct with message only", () => {
      const error = new ValidationError("Invalid input")

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ValidationError)
      expect(error.message).toBe("Invalid input")
      expect(error.name).toBe("ValidationError")
      expect(error.field).toBeUndefined()
      expect(error.details).toBeUndefined()
    })

    it("should construct with message and field", () => {
      const error = new ValidationError("Invalid email format", "email")

      expect(error.message).toBe("Invalid email format")
      expect(error.field).toBe("email")
      expect(error.name).toBe("ValidationError")
    })

    it("should construct with message, field, and details", () => {
      const error = new ValidationError(
        "Password too short",
        "password",
        { minLength: 8, provided: 4 }
      )

      expect(error.message).toBe("Password too short")
      expect(error.field).toBe("password")
      expect(error.details).toEqual({ minLength: 8, provided: 4 })
      expect(error.name).toBe("ValidationError")
    })

    it("should have stack trace", () => {
      const error = new ValidationError("Test")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("ValidationError")
    })

    it("should be catchable as Error", () => {
      expect(() => {
        throw new ValidationError("Test")
      }).toThrow(Error)
    })

    it("should be catchable as ValidationError", () => {
      expect(() => {
        throw new ValidationError("Test")
      }).toThrow(ValidationError)
    })
  })

  describe("AuthenticationError", () => {
    it("should construct with default message", () => {
      const error = new AuthenticationError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AuthenticationError)
      expect(error.message).toBe("Authentication required")
      expect(error.name).toBe("AuthenticationError")
    })

    it("should construct with custom message", () => {
      const error = new AuthenticationError("Invalid token")

      expect(error.message).toBe("Invalid token")
      expect(error.name).toBe("AuthenticationError")
    })

    it("should have stack trace", () => {
      const error = new AuthenticationError("Test")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("AuthenticationError")
    })

    it("should be catchable as Error", () => {
      expect(() => {
        throw new AuthenticationError()
      }).toThrow(Error)
    })
  })

  describe("AuthorizationError", () => {
    it("should construct with default message", () => {
      const error = new AuthorizationError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(AuthorizationError)
      expect(error.message).toBe("Not authorized")
      expect(error.name).toBe("AuthorizationError")
    })

    it("should construct with custom message", () => {
      const error = new AuthorizationError("Access denied to admin panel")

      expect(error.message).toBe("Access denied to admin panel")
      expect(error.name).toBe("AuthorizationError")
    })

    it("should have stack trace", () => {
      const error = new AuthorizationError("Test")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("AuthorizationError")
    })
  })

  describe("NotFoundError", () => {
    it("should construct with default message", () => {
      const error = new NotFoundError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(NotFoundError)
      expect(error.message).toBe("Resource not found")
      expect(error.name).toBe("NotFoundError")
    })

    it("should construct with resource name", () => {
      const error = new NotFoundError("User")

      expect(error.message).toBe("User not found")
      expect(error.name).toBe("NotFoundError")
    })

    it("should handle custom resource names", () => {
      const error = new NotFoundError("Tarot Reading")

      expect(error.message).toBe("Tarot Reading not found")
    })

    it("should have stack trace", () => {
      const error = new NotFoundError("Test")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("NotFoundError")
    })
  })

  describe("ConflictError", () => {
    it("should construct with message", () => {
      const error = new ConflictError("Email already exists")

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ConflictError)
      expect(error.message).toBe("Email already exists")
      expect(error.name).toBe("ConflictError")
    })

    it("should have stack trace", () => {
      const error = new ConflictError("Test")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("ConflictError")
    })
  })

  describe("RateLimitError", () => {
    it("should construct with default message", () => {
      const error = new RateLimitError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(RateLimitError)
      expect(error.message).toBe("Too many requests")
      expect(error.name).toBe("RateLimitError")
      expect(error.resetAt).toBeUndefined()
    })

    it("should construct with custom message", () => {
      const error = new RateLimitError("Too many login attempts")

      expect(error.message).toBe("Too many login attempts")
      expect(error.name).toBe("RateLimitError")
    })

    it("should construct with message and resetAt", () => {
      const resetDate = new Date(Date.now() + 60000)
      const error = new RateLimitError("Rate limit exceeded", resetDate)

      expect(error.message).toBe("Rate limit exceeded")
      expect(error.resetAt).toBe(resetDate)
      expect(error.resetAt).toBeInstanceOf(Date)
    })

    it("should have stack trace", () => {
      const error = new RateLimitError("Test")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("RateLimitError")
    })
  })

  describe("CSRFError", () => {
    it("should construct with default message", () => {
      const error = new CSRFError()

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(CSRFError)
      expect(error.message).toBe("Invalid CSRF token")
      expect(error.name).toBe("CSRFError")
    })

    it("should construct with custom message", () => {
      const error = new CSRFError("CSRF token missing")

      expect(error.message).toBe("CSRF token missing")
      expect(error.name).toBe("CSRFError")
    })

    it("should have stack trace", () => {
      const error = new CSRFError("Test")

      expect(error.stack).toBeDefined()
      expect(error.stack).toContain("CSRFError")
    })
  })

  describe("Error Inheritance", () => {
    it("all custom errors should be instanceof Error", () => {
      const errors = [
        new ValidationError("test"),
        new AuthenticationError("test"),
        new AuthorizationError("test"),
        new NotFoundError("test"),
        new ConflictError("test"),
        new RateLimitError("test"),
        new CSRFError("test"),
      ]

      errors.forEach((error) => {
        expect(error).toBeInstanceOf(Error)
      })
    })

    it("errors should be distinguishable by instanceof", () => {
      const validationError = new ValidationError("test")
      const authError = new AuthenticationError("test")

      expect(validationError).toBeInstanceOf(ValidationError)
      expect(validationError).not.toBeInstanceOf(AuthenticationError)

      expect(authError).toBeInstanceOf(AuthenticationError)
      expect(authError).not.toBeInstanceOf(ValidationError)
    })

    it("errors should be distinguishable by name property", () => {
      const errors = [
        { error: new ValidationError("test"), name: "ValidationError" },
        { error: new AuthenticationError("test"), name: "AuthenticationError" },
        { error: new AuthorizationError("test"), name: "AuthorizationError" },
        { error: new NotFoundError("test"), name: "NotFoundError" },
        { error: new ConflictError("test"), name: "ConflictError" },
        { error: new RateLimitError("test"), name: "RateLimitError" },
        { error: new CSRFError("test"), name: "CSRFError" },
      ]

      errors.forEach(({ error, name }) => {
        expect(error.name).toBe(name)
      })
    })
  })

  describe("Error Serialization", () => {
    it("should serialize ValidationError to JSON", () => {
      const error = new ValidationError("Invalid email", "email", {
        pattern: "^[a-z]+@[a-z]+\\.[a-z]+$",
      })

      // Errors don't serialize well by default, so we need to manually extract properties
      const serialized = {
        name: error.name,
        message: error.message,
        field: error.field,
        details: error.details,
      }

      const json = JSON.stringify(serialized)
      const parsed = JSON.parse(json)

      expect(parsed.name).toBe("ValidationError")
      expect(parsed.message).toBe("Invalid email")
      expect(parsed.field).toBe("email")
      expect(parsed.details).toEqual({
        pattern: "^[a-z]+@[a-z]+\\.[a-z]+$",
      })
    })

    it("should serialize RateLimitError with Date to JSON", () => {
      const resetDate = new Date("2025-12-01T12:00:00.000Z")
      const error = new RateLimitError("Too many requests", resetDate)

      const serialized = {
        name: error.name,
        message: error.message,
        resetAt: error.resetAt?.toISOString(),
      }

      const json = JSON.stringify(serialized)
      const parsed = JSON.parse(json)

      expect(parsed.resetAt).toBe("2025-12-01T12:00:00.000Z")
    })

    it("should preserve error properties after JSON roundtrip", () => {
      const original = new ValidationError("Test", "field", { key: "value" })

      const serialized = {
        name: original.name,
        message: original.message,
        field: original.field,
        details: original.details,
      }

      const json = JSON.stringify(serialized)
      const parsed = JSON.parse(json)

      expect(parsed).toEqual({
        name: "ValidationError",
        message: "Test",
        field: "field",
        details: { key: "value" },
      })
    })
  })

  describe("Error Usage Patterns", () => {
    it("should work in try-catch blocks", () => {
      const thrower = () => {
        throw new ValidationError("Invalid")
      }

      let caughtError: Error | null = null

      try {
        thrower()
      } catch (error) {
        caughtError = error as Error
      }

      expect(caughtError).toBeInstanceOf(ValidationError)
      expect(caughtError?.message).toBe("Invalid")
    })

    it("should work with Promise rejection", async () => {
      const rejecter = () => {
        return Promise.reject(new AuthenticationError("Unauthorized"))
      }

      await expect(rejecter()).rejects.toThrow(AuthenticationError)
      await expect(rejecter()).rejects.toThrow("Unauthorized")
    })

    it("should support error chaining patterns", () => {
      const validateEmail = (email: string) => {
        if (!email.includes("@")) {
          throw new ValidationError("Invalid email format", "email")
        }
        return true
      }

      const processUser = (user: { email: string }) => {
        try {
          validateEmail(user.email)
        } catch (error) {
          if (error instanceof ValidationError) {
            throw new ValidationError(
              `User validation failed: ${error.message}`,
              error.field
            )
          }
          throw error
        }
      }

      expect(() => processUser({ email: "invalid" })).toThrow(ValidationError)
      expect(() => processUser({ email: "invalid" })).toThrow(
        "User validation failed: Invalid email format"
      )
    })
  })
})
