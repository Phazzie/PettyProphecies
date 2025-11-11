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
import logger from "../utils/logger"

// Re-export RateLimitError for convenience
export { RateLimitError } from "@/src/interfaces/seams"

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
  // Granular auth actions
  "auth:login": {
    limit: 5,
    windowMs: 15 * 60 * 1000, // 5 per 15 minutes
  },
  "auth:register": {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 per hour
  },
  "auth:password-reset": {
    limit: 3,
    windowMs: 60 * 60 * 1000, // 3 per hour
  },
  "auth:verify": {
    limit: 60,
    windowMs: 60 * 1000, // 60 per minute (frequent checks)
  },
  "auth:logout": {
    limit: 10,
    windowMs: 60 * 1000, // 10 per minute
  },
  "tarot:reading": {
    limit: 10,
    windowMs: 60 * 1000, // 10 per minute
  },
  "api:general": {
    limit: 100,
    windowMs: 60 * 1000, // 100 per minute
  },
  // Legacy actions (for backward compatibility)
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
    windowMs: 15 * 60 * 1000, // 15 minutes
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
        logger.warn(
          "Upstash Redis credentials not found. Using in-memory rate limiter."
        )
      }
    } catch (error) {
      logger.warn(
        { error },
        "Failed to initialize Redis rate limiter. Using in-memory fallback."
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
      this.redisRateLimiter = {} as Record<RateLimitAction, any>

      // Initialize rate limiters for all actions
      for (const [action, config] of Object.entries(RATE_LIMITS)) {
        this.redisRateLimiter[action as RateLimitAction] = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(
            config.limit,
            `${config.windowMs / 1000} s`
          ),
          analytics: true,
          prefix: `ratelimit:${action}`,
        })
      }

      this.useRedis = true
      logger.info("Redis rate limiter initialized successfully")
    } catch (error) {
      logger.warn({ error }, "Failed to initialize Redis rate limiter")
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

        const resetAt = new Date(result.reset)
        const retryAfter = result.success ? undefined : Math.ceil((resetAt.getTime() - Date.now()) / 1000)

        return {
          allowed: result.success,
          limit: result.limit,
          remaining: result.remaining,
          resetAt,
          retryAfter,
        }
      } catch (error) {
        logger.error({ error }, "Redis rate limiter error, falling back to in-memory")
        // Fall through to in-memory limiter
      }
    }

    // Use in-memory rate limiter as fallback
    const result = this.inMemoryLimiter.checkLimit(
      `${action}:${identifier}`,
      config.limit,
      config.windowMs
    )

    // Add retryAfter for in-memory results
    const retryAfter = result.allowed ? undefined : Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)

    return {
      ...result,
      retryAfter,
    }
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

/**
 * Set rate limit headers on response
 * @param res NextApiResponse to set headers on
 * @param result Rate limit result
 */
export function setRateLimitHeaders(
  res: any,
  result: RateLimitResult
): void {
  res.setHeader("X-RateLimit-Limit", result.limit.toString())
  res.setHeader("X-RateLimit-Remaining", result.remaining.toString())
  res.setHeader("X-RateLimit-Reset", result.resetAt.toISOString())

  if (!result.allowed && result.retryAfter) {
    res.setHeader("Retry-After", result.retryAfter.toString())
  }
}
