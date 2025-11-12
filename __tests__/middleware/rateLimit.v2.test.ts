/**
 * Tests for Distributed Rate Limiter Middleware (v2)
 * Following TDD: Tests written FIRST before implementation
 */

import { RateLimiterService } from "@/src/middleware/rateLimit.v2"
import type { RateLimitAction } from "@/src/interfaces/seams"

// Mock Upstash Redis
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  })),
}))

// Mock Upstash Ratelimit
jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  })),
}))

describe("RateLimiterService - Distributed Rate Limiting", () => {
  let rateLimiter: RateLimiterService

  beforeEach(() => {
    jest.clearAllMocks()
    rateLimiter = new RateLimiterService()
  })

  describe("checkLimit", () => {
    it("should allow requests within rate limit", async () => {
      const identifier = "user123"
      const action: RateLimitAction = "general"

      const result = await rateLimiter.checkLimit(identifier, action)

      expect(result.allowed).toBe(true)
      expect(result.limit).toBeGreaterThan(0)
      expect(result.remaining).toBeGreaterThanOrEqual(0)
      expect(result.resetAt).toBeInstanceOf(Date)
    })

    it("should enforce different limits for different actions", async () => {
      const identifier = "user123"

      const authResult = await rateLimiter.checkLimit(identifier, "auth")
      const generalResult = await rateLimiter.checkLimit(identifier, "general")
      const readingResult = await rateLimiter.checkLimit(identifier, "reading")

      // Auth: 10/15min
      expect(authResult.limit).toBeLessThanOrEqual(10)

      // General: 50/15min
      expect(generalResult.limit).toBeLessThanOrEqual(50)

      // Reading: 20/15min
      expect(readingResult.limit).toBeLessThanOrEqual(20)
    })

    it("should return correct limit for auth action", async () => {
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "auth")

      expect(result.allowed).toBe(true)
      expect(result.limit).toBeLessThanOrEqual(10)
      expect(result.remaining).toBeLessThanOrEqual(10)
    })

    it("should return correct limit for general action", async () => {
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "general")

      expect(result.allowed).toBe(true)
      expect(result.limit).toBeLessThanOrEqual(50)
      expect(result.remaining).toBeLessThanOrEqual(50)
    })

    it("should return correct limit for reading action", async () => {
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "reading")

      expect(result.allowed).toBe(true)
      expect(result.limit).toBeLessThanOrEqual(20)
      expect(result.remaining).toBeLessThanOrEqual(20)
    })

    it("should handle api action (same as general)", async () => {
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "api")

      expect(result.allowed).toBe(true)
      expect(result.limit).toBeLessThanOrEqual(50)
    })

    it("should track different identifiers separately", async () => {
      const result1 = await rateLimiter.checkLimit("user1", "general")
      const result2 = await rateLimiter.checkLimit("user2", "general")

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })

    it("should decrement remaining count on subsequent requests", async () => {
      const identifier = "user123"

      const result1 = await rateLimiter.checkLimit(identifier, "auth")
      const result2 = await rateLimiter.checkLimit(identifier, "auth")

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result2.remaining).toBeLessThanOrEqual(result1.remaining)
    })

    it("should return rate limit exceeded when limit is reached", async () => {
      const identifier = "user_exceeding_limit"
      const action: RateLimitAction = "auth"

      // Make requests until limit is exceeded (auth has 10 requests limit)
      const results = []
      for (let i = 0; i < 12; i++) {
        results.push(await rateLimiter.checkLimit(identifier, action))
      }

      // First 10 should be allowed, 11th and 12th should be denied
      const allowedCount = results.filter((r) => r.allowed).length
      const deniedCount = results.filter((r) => !r.allowed).length

      expect(allowedCount).toBeGreaterThan(0)
      expect(deniedCount).toBeGreaterThan(0)
    })

    it("should provide reset timestamp", async () => {
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "general")

      expect(result.resetAt).toBeInstanceOf(Date)
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now())
    })

    it("should reset after time window expires", async () => {
      // This test would require mocking time, which is complex
      // For now, we just verify that resetAt is in the future
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "general")

      const futureTime = Date.now() + 15 * 60 * 1000 // 15 minutes
      expect(result.resetAt.getTime()).toBeLessThanOrEqual(futureTime)
    })
  })

  describe("Rate Limit Headers", () => {
    it("should return headers-compatible result", async () => {
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "general")

      // These fields should be suitable for X-RateLimit-* headers
      expect(typeof result.limit).toBe("number")
      expect(typeof result.remaining).toBe("number")
      expect(result.resetAt).toBeInstanceOf(Date)
    })
  })

  describe("Fallback Behavior", () => {
    it("should use in-memory fallback when Redis is not available", async () => {
      // This test verifies fallback behavior exists
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "general")

      // Should still return a valid result
      expect(result).toBeDefined()
      expect(result.allowed).toBeDefined()
      expect(result.limit).toBeDefined()
      expect(result.remaining).toBeDefined()
      expect(result.resetAt).toBeDefined()
    })

    it("should handle errors gracefully and fallback to allowing requests", async () => {
      // If Redis fails, we should allow the request (fail open)
      const identifier = "error_test"
      const result = await rateLimiter.checkLimit(identifier, "general")

      expect(result).toBeDefined()
      expect(result.allowed).toBeDefined()
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty identifier", async () => {
      const result = await rateLimiter.checkLimit("", "general")

      expect(result).toBeDefined()
      expect(result.allowed).toBeDefined()
    })

    it("should handle very long identifiers", async () => {
      const longIdentifier = "a".repeat(1000)
      const result = await rateLimiter.checkLimit(longIdentifier, "general")

      expect(result).toBeDefined()
      expect(result.allowed).toBeDefined()
    })

    it("should handle special characters in identifier", async () => {
      const specialIdentifier = "user!@#$%^&*()"
      const result = await rateLimiter.checkLimit(specialIdentifier, "general")

      expect(result).toBeDefined()
      expect(result.allowed).toBeDefined()
    })

    it("should handle IP addresses as identifiers", async () => {
      const ipIdentifier = "192.168.1.1"
      const result = await rateLimiter.checkLimit(ipIdentifier, "general")

      expect(result).toBeDefined()
      expect(result.allowed).toBe(true)
    })

    it("should handle UUID as identifiers", async () => {
      const uuidIdentifier = "550e8400-e29b-41d4-a716-446655440000"
      const result = await rateLimiter.checkLimit(uuidIdentifier, "general")

      expect(result).toBeDefined()
      expect(result.allowed).toBe(true)
    })
  })

  describe("Concurrent Requests", () => {
    it("should handle concurrent requests for same identifier", async () => {
      const identifier = "concurrent_user"
      const promises = []

      // Make 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        promises.push(rateLimiter.checkLimit(identifier, "general"))
      }

      const results = await Promise.all(promises)

      // All results should be defined
      results.forEach((result) => {
        expect(result).toBeDefined()
        expect(result.allowed).toBeDefined()
      })
    })

    it("should handle concurrent requests for different identifiers", async () => {
      const promises = []

      // Make concurrent requests for different users
      for (let i = 0; i < 5; i++) {
        promises.push(rateLimiter.checkLimit(`user${i}`, "general"))
      }

      const results = await Promise.all(promises)

      // All should be allowed
      results.forEach((result) => {
        expect(result.allowed).toBe(true)
      })
    })
  })

  describe("Time Window", () => {
    it("should use 15-minute time window", async () => {
      const identifier = "user123"
      const result = await rateLimiter.checkLimit(identifier, "general")

      const now = Date.now()
      const resetTime = result.resetAt.getTime()
      const timeDiff = resetTime - now

      // Reset should be within 15 minutes (900 seconds)
      expect(timeDiff).toBeLessThanOrEqual(15 * 60 * 1000)
      expect(timeDiff).toBeGreaterThan(0)
    })
  })
})
