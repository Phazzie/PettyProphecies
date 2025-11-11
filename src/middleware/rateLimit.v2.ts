/**
 * Distributed Rate Limiter Middleware (v2)
 * Implements IRateLimiter interface using Upstash Redis
 *
 * Features:
 * - Different rate limits for different actions
 * - Distributed rate limiting using Redis
 * - In-memory fallback when Redis is not available
 * - Returns X-RateLimit-* header compatible data
 */

import type {
  IRateLimiter,
  RateLimitAction,
  RateLimitResult,
} from "@/src/interfaces/seams"

/**
 * In-memory rate limiter for fallback/dev mode
 * Uses sliding window algorithm
 */
class InMemoryRateLimiter {
  private requests: Map<string, { timestamps: number[]; limit: number }> = new Map()

  /**
   * Check rate limit for identifier
   * @param identifier Unique identifier (user ID, IP, etc.)
   * @param limit Maximum requests allowed
   * @param windowMs Time window in milliseconds
   * @returns Rate limit result
   */
  checkLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): RateLimitResult {
    const now = Date.now()
    const windowStart = now - windowMs

    // Get or create request history for this identifier
    let record = this.requests.get(identifier)
    if (!record) {
      record = { timestamps: [], limit }
      this.requests.set(identifier, record)
    }

    // Remove timestamps outside the window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart)

    // Check if limit is exceeded
    const allowed = record.timestamps.length < limit

    if (allowed) {
      // Add current timestamp
      record.timestamps.push(now)
    }

    return {
      allowed,
      limit,
      remaining: Math.max(0, limit - record.timestamps.length),
      resetAt: new Date(now + windowMs),
    }
  }

  /**
   * Clean up old entries (optional, for memory management)
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 15 * 60 * 1000 // 15 minutes

    for (const [identifier, record] of this.requests.entries()) {
      const oldestTimestamp = Math.min(...record.timestamps)
      if (now - oldestTimestamp > maxAge) {
        this.requests.delete(identifier)
      }
    }
  }
}

/**
 * Rate limit configuration for different actions
 */
const RATE_LIMITS: Record<RateLimitAction, { limit: number; windowMs: number }> = {
  auth: {
    limit: 10,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  general: {
    limit: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  reading: {
    limit: 20,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    limit: 50,
    windowMs: 15 * 60 * 1000, // 15 minutes (same as general)
  },
}

/**
 * RateLimiterService implementation
 * Implements IRateLimiter interface from seams.ts
 */
export class RateLimiterService implements IRateLimiter {
  private inMemoryLimiter: InMemoryRateLimiter
  private useRedis: boolean = false
  private redisRateLimiter: any = null

  constructor() {
    this.inMemoryLimiter = new InMemoryRateLimiter()

    // Try to initialize Redis rate limiter
    try {
      // Check if Redis credentials are available
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

      if (redisUrl && redisToken) {
        // Dynamic import to avoid errors when packages are not installed
        this.initializeRedisRateLimiter(redisUrl, redisToken)
      } else {
        console.warn(
          "Upstash Redis credentials not found. Using in-memory rate limiter."
        )
      }
    } catch (error) {
      console.warn(
        "Failed to initialize Redis rate limiter. Using in-memory fallback.",
        error
      )
    }
  }

  /**
   * Initialize Redis-based rate limiter
   * @param redisUrl Upstash Redis REST URL
   * @param redisToken Upstash Redis REST token
   */
  private async initializeRedisRateLimiter(
    redisUrl: string,
    redisToken: string
  ): Promise<void> {
    try {
      // Import Upstash packages
      const { Redis } = await import("@upstash/redis")
      const { Ratelimit } = await import("@upstash/ratelimit")

      const redis = new Redis({
        url: redisUrl,
        token: redisToken,
      })

      // Create rate limiters for each action
      this.redisRateLimiter = {
        auth: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            RATE_LIMITS.auth.limit,
            `${RATE_LIMITS.auth.windowMs / 1000} s`
          ),
          analytics: true,
          prefix: "ratelimit:auth",
        }),
        general: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            RATE_LIMITS.general.limit,
            `${RATE_LIMITS.general.windowMs / 1000} s`
          ),
          analytics: true,
          prefix: "ratelimit:general",
        }),
        reading: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            RATE_LIMITS.reading.limit,
            `${RATE_LIMITS.reading.windowMs / 1000} s`
          ),
          analytics: true,
          prefix: "ratelimit:reading",
        }),
        api: new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            RATE_LIMITS.api.limit,
            `${RATE_LIMITS.api.windowMs / 1000} s`
          ),
          analytics: true,
          prefix: "ratelimit:api",
        }),
      }

      this.useRedis = true
      console.log("Redis rate limiter initialized successfully")
    } catch (error) {
      console.warn("Failed to initialize Redis rate limiter:", error)
      this.useRedis = false
    }
  }

  /**
   * Check if request should be rate limited
   * @param identifier Unique identifier (user ID, IP address, etc.)
   * @param action Action type to rate limit
   * @returns Rate limit result
   */
  async checkLimit(
    identifier: string,
    action: RateLimitAction
  ): Promise<RateLimitResult> {
    const config = RATE_LIMITS[action]

    // Use Redis rate limiter if available
    if (this.useRedis && this.redisRateLimiter) {
      try {
        const limiter = this.redisRateLimiter[action]
        const result = await limiter.limit(identifier)

        return {
          allowed: result.success,
          limit: result.limit,
          remaining: result.remaining,
          resetAt: new Date(result.reset),
        }
      } catch (error) {
        console.error("Redis rate limiter error, falling back to in-memory:", error)
        // Fall through to in-memory limiter
      }
    }

    // Use in-memory rate limiter as fallback
    return this.inMemoryLimiter.checkLimit(
      `${action}:${identifier}`,
      config.limit,
      config.windowMs
    )
  }
}

/**
 * Singleton instance for convenience
 */
let rateLimiterInstance: RateLimiterService | null = null

/**
 * Get or create RateLimiterService instance
 * @returns RateLimiterService instance
 */
export function getRateLimiter(): RateLimiterService {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiterService()
  }
  return rateLimiterInstance
}
