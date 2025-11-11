/**
 * Schema Validation Tests
 * Tests all Zod schemas with valid/invalid inputs and XSS prevention
 * Following TDD: Tests written FIRST
 */

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  tarotReadingSchema,
  rateReadingSchema,
} from "../../src/schemas"
import { sanitize, sanitizeObject } from "../../src/schemas"

describe("Register Schema", () => {
  describe("Valid inputs", () => {
    it("should accept valid registration data", () => {
      const validData = {
        username: "testuser",
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      const result = registerSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it("should accept username with underscores", () => {
      const data = {
        username: "test_user_123",
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).not.toThrow()
    })

    it("should accept minimum length username (3 chars)", () => {
      const data = {
        username: "abc",
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).not.toThrow()
    })

    it("should accept maximum length username (20 chars)", () => {
      const data = {
        username: "a".repeat(20),
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).not.toThrow()
    })

    it("should accept minimum length password (12 chars)", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "SecureP@ss12",
      }
      expect(() => registerSchema.parse(data)).not.toThrow()
    })
  })

  describe("Invalid inputs", () => {
    it("should reject username shorter than 3 characters", () => {
      const data = {
        username: "ab",
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject username longer than 20 characters", () => {
      const data = {
        username: "a".repeat(21),
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject username with special characters", () => {
      const data = {
        username: "test@user",
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject invalid email format", () => {
      const data = {
        username: "testuser",
        email: "invalid-email",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject password shorter than 12 characters", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "Short1!",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject password without uppercase letter", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "securep@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject password without lowercase letter", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "SECUREP@SSW0RD123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject password without number", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "SecureP@ssword",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject password without special character", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "SecurePassword123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject empty username", () => {
      const data = {
        username: "",
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject empty email", () => {
      const data = {
        username: "testuser",
        email: "",
        password: "SecureP@ssw0rd123",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })

    it("should reject empty password", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "",
      }
      expect(() => registerSchema.parse(data)).toThrow()
    })
  })
})

describe("Login Schema", () => {
  it("should accept valid login credentials", () => {
    const validData = {
      email: "test@example.com",
      password: "anypassword",
    }
    const result = loginSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it("should reject invalid email", () => {
    const data = {
      email: "invalid-email",
      password: "anypassword",
    }
    expect(() => loginSchema.parse(data)).toThrow()
  })

  it("should reject empty email", () => {
    const data = {
      email: "",
      password: "anypassword",
    }
    expect(() => loginSchema.parse(data)).toThrow()
  })

  it("should reject empty password", () => {
    const data = {
      email: "test@example.com",
      password: "",
    }
    expect(() => loginSchema.parse(data)).toThrow()
  })
})

describe("Forgot Password Schema", () => {
  it("should accept valid email", () => {
    const validData = {
      email: "test@example.com",
    }
    const result = forgotPasswordSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it("should reject invalid email format", () => {
    const data = {
      email: "not-an-email",
    }
    expect(() => forgotPasswordSchema.parse(data)).toThrow()
  })

  it("should reject empty email", () => {
    const data = {
      email: "",
    }
    expect(() => forgotPasswordSchema.parse(data)).toThrow()
  })
})

describe("Reset Password Schema", () => {
  it("should accept valid reset data", () => {
    const validData = {
      token: "valid-reset-token-123",
      newPassword: "NewSecureP@ss123",
    }
    const result = resetPasswordSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it("should reject empty token", () => {
    const data = {
      token: "",
      newPassword: "NewSecureP@ss123",
    }
    expect(() => resetPasswordSchema.parse(data)).toThrow()
  })

  it("should reject weak new password", () => {
    const data = {
      token: "valid-reset-token-123",
      newPassword: "weak",
    }
    expect(() => resetPasswordSchema.parse(data)).toThrow()
  })

  it("should reject new password without complexity", () => {
    const data = {
      token: "valid-reset-token-123",
      newPassword: "simplepassword123",
    }
    expect(() => resetPasswordSchema.parse(data)).toThrow()
  })
})

describe("Tarot Reading Schema", () => {
  it("should accept valid reading request", () => {
    const validData = {
      spreadType: "three-card",
      userQuestion: "What does my future hold?",
    }
    const result = tarotReadingSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it("should accept reading request without question", () => {
    const validData = {
      spreadType: "celtic-cross",
    }
    const result = tarotReadingSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it("should accept reading request with empty question", () => {
    const validData = {
      spreadType: "single-card",
      userQuestion: "",
    }
    expect(() => tarotReadingSchema.parse(validData)).not.toThrow()
  })

  it("should reject empty spreadType", () => {
    const data = {
      spreadType: "",
      userQuestion: "What does my future hold?",
    }
    expect(() => tarotReadingSchema.parse(data)).toThrow()
  })

  it("should reject question longer than 500 characters", () => {
    const data = {
      spreadType: "three-card",
      userQuestion: "a".repeat(501),
    }
    expect(() => tarotReadingSchema.parse(data)).toThrow()
  })

  it("should accept question with exactly 500 characters", () => {
    const data = {
      spreadType: "three-card",
      userQuestion: "a".repeat(500),
    }
    expect(() => tarotReadingSchema.parse(data)).not.toThrow()
  })
})

describe("Rate Reading Schema", () => {
  it("should accept valid rating", () => {
    const validData = {
      readingId: "507f1f77bcf86cd799439011",
      rating: 5,
    }
    const result = rateReadingSchema.parse(validData)
    expect(result).toEqual(validData)
  })

  it("should accept minimum rating (1)", () => {
    const data = {
      readingId: "507f1f77bcf86cd799439011",
      rating: 1,
    }
    expect(() => rateReadingSchema.parse(data)).not.toThrow()
  })

  it("should accept maximum rating (5)", () => {
    const data = {
      readingId: "507f1f77bcf86cd799439011",
      rating: 5,
    }
    expect(() => rateReadingSchema.parse(data)).not.toThrow()
  })

  it("should reject rating less than 1", () => {
    const data = {
      readingId: "507f1f77bcf86cd799439011",
      rating: 0,
    }
    expect(() => rateReadingSchema.parse(data)).toThrow()
  })

  it("should reject rating greater than 5", () => {
    const data = {
      readingId: "507f1f77bcf86cd799439011",
      rating: 6,
    }
    expect(() => rateReadingSchema.parse(data)).toThrow()
  })

  it("should reject empty readingId", () => {
    const data = {
      readingId: "",
      rating: 5,
    }
    expect(() => rateReadingSchema.parse(data)).toThrow()
  })

  it("should reject non-integer rating", () => {
    const data = {
      readingId: "507f1f77bcf86cd799439011",
      rating: 3.5,
    }
    expect(() => rateReadingSchema.parse(data)).toThrow()
  })
})

describe("XSS Sanitization", () => {
  describe("sanitize function", () => {
    it("should remove script tags", () => {
      const dirty = '<script>alert("xss")</script>Hello'
      const clean = sanitize(dirty)
      expect(clean).not.toContain("<script>")
      expect(clean).not.toContain("alert")
      expect(clean).toContain("Hello")
    })

    it("should remove img onerror event handlers", () => {
      const dirty = '<img src=x onerror=alert(1)>'
      const clean = sanitize(dirty)
      expect(clean).not.toContain("onerror")
      expect(clean).not.toContain("alert")
    })

    it("should remove javascript: protocol", () => {
      const dirty = '<a href="javascript:alert(1)">Click</a>'
      const clean = sanitize(dirty)
      expect(clean).not.toContain("javascript:")
      expect(clean).not.toContain("alert")
    })

    it("should remove onclick event handlers", () => {
      const dirty = '<button onclick="alert(1)">Click</button>'
      const clean = sanitize(dirty)
      expect(clean).not.toContain("onclick")
      expect(clean).not.toContain("alert")
    })

    it("should preserve safe HTML", () => {
      const safe = "<p>This is <strong>safe</strong> content</p>"
      const clean = sanitize(safe)
      expect(clean).toContain("<p>")
      expect(clean).toContain("<strong>")
      expect(clean).toContain("safe")
    })

    it("should handle plain text without modification", () => {
      const text = "Just plain text"
      const clean = sanitize(text)
      expect(clean).toBe(text)
    })

    it("should remove multiple XSS attempts", () => {
      const dirty = '<script>alert(1)</script><img src=x onerror=alert(2)><div onclick="alert(3)">Test</div>'
      const clean = sanitize(dirty)
      expect(clean).not.toContain("script")
      expect(clean).not.toContain("onerror")
      expect(clean).not.toContain("onclick")
      expect(clean).not.toContain("alert")
    })

    it("should handle empty string", () => {
      const clean = sanitize("")
      expect(clean).toBe("")
    })

    it("should handle null-like values", () => {
      expect(sanitize(null as any)).toBe("")
      expect(sanitize(undefined as any)).toBe("")
    })
  })

  describe("sanitizeObject function", () => {
    it("should sanitize all string values in object", () => {
      const dirty = {
        username: 'test<script>alert(1)</script>',
        email: "test@example.com",
        bio: '<img src=x onerror=alert(2)>',
      }
      const clean = sanitizeObject(dirty)
      expect(clean.username).not.toContain("<script>")
      expect(clean.email).toBe("test@example.com")
      expect(clean.bio).not.toContain("onerror")
    })

    it("should handle nested objects", () => {
      const dirty = {
        user: {
          name: 'test<script>alert(1)</script>',
          profile: {
            bio: '<img src=x onerror=alert(2)>',
          },
        },
      }
      const clean = sanitizeObject(dirty)
      expect(clean.user.name).not.toContain("<script>")
      expect(clean.user.profile.bio).not.toContain("onerror")
    })

    it("should handle arrays", () => {
      const dirty = {
        tags: ['tag1<script>alert(1)</script>', 'tag2', '<img src=x onerror=alert(2)>'],
      }
      const clean = sanitizeObject(dirty)
      expect(clean.tags[0]).not.toContain("<script>")
      expect(clean.tags[1]).toBe("tag2")
      expect(clean.tags[2]).not.toContain("onerror")
    })

    it("should preserve non-string values", () => {
      const dirty = {
        name: 'test<script>alert(1)</script>',
        age: 25,
        active: true,
        score: null,
      }
      const clean = sanitizeObject(dirty)
      expect(clean.age).toBe(25)
      expect(clean.active).toBe(true)
      expect(clean.score).toBe(null)
    })

    it("should handle empty object", () => {
      const clean = sanitizeObject({})
      expect(clean).toEqual({})
    })
  })

  describe("Schema integration with sanitization", () => {
    it("should sanitize username in register schema", () => {
      const data = {
        username: "testuser",
        email: "test@example.com",
        password: "SecureP@ssw0rd123",
      }
      const result = registerSchema.parse(data)
      // Username should be sanitized even though it's safe
      expect(result.username).toBe("testuser")
    })

    it("should sanitize userQuestion in tarot reading schema", () => {
      const data = {
        spreadType: "three-card",
        userQuestion: "What is my future?",
      }
      const result = tarotReadingSchema.parse(data)
      expect(result.userQuestion).toBe("What is my future?")
    })
  })
})

describe("Edge Cases", () => {
  describe("Type coercion", () => {
    it("should handle number strings in rating", () => {
      const data = {
        readingId: "507f1f77bcf86cd799439011",
        rating: "5" as any,
      }
      // Zod should coerce string to number
      const result = rateReadingSchema.parse(data)
      expect(result.rating).toBe(5)
      expect(typeof result.rating).toBe("number")
    })
  })

  describe("Whitespace handling", () => {
    it("should trim email in login schema", () => {
      const data = {
        email: "  test@example.com  ",
        password: "anypassword",
      }
      const result = loginSchema.parse(data)
      expect(result.email).toBe("test@example.com")
    })

    it("should trim email in register schema", () => {
      const data = {
        username: "testuser",
        email: "  test@example.com  ",
        password: "SecureP@ssw0rd123",
      }
      const result = registerSchema.parse(data)
      expect(result.email).toBe("test@example.com")
    })
  })

  describe("Case sensitivity", () => {
    it("should convert email to lowercase in register schema", () => {
      const data = {
        username: "testuser",
        email: "Test@EXAMPLE.COM",
        password: "SecureP@ssw0rd123",
      }
      const result = registerSchema.parse(data)
      expect(result.email).toBe("test@example.com")
    })

    it("should convert email to lowercase in login schema", () => {
      const data = {
        email: "Test@EXAMPLE.COM",
        password: "anypassword",
      }
      const result = loginSchema.parse(data)
      expect(result.email).toBe("test@example.com")
    })
  })
})
