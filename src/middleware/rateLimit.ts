import type { NextApiRequest, NextApiResponse } from "next"

// Simple in-memory rate limiter for Next.js API routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export type RateLimitTier = 'auth' | 'api' | 'general'

const RATE_LIMITS: Record<RateLimitTier, { windowMs: number; maxRequests: number }> = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },      // 10 per 15 min for auth
  api: { windowMs: 15 * 60 * 1000, maxRequests: 50 },       // 50 per 15 min for API
  general: { windowMs: 15 * 60 * 1000, maxRequests: 100 },  // 100 per 15 min general
}

// Cleanup expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanupExpiredEntries() {
  const now = Date.now()
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  })
}

// Start cleanup interval (only once)
let cleanupStarted = false
function startCleanup() {
  if (!cleanupStarted) {
    cleanupStarted = true
    setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL)
  }
}

function getIP(req: NextApiRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  )
}

function checkRateLimit(ip: string, tier: RateLimitTier = 'general'): { allowed: boolean; remaining: number; resetTime: number; maxRequests: number } {
  const now = Date.now()
  const { windowMs, maxRequests } = RATE_LIMITS[tier]
  const key = `${ip}:${tier}`
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    // New window or expired window
    const resetTime = now + windowMs
    rateLimitMap.set(key, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime, maxRequests }
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime, maxRequests }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime, maxRequests }
}

// Create a wrapper function to use the rate limiter with Next.js API routes
export function rateLimitMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  tier: RateLimitTier = 'general'
) {
  // Start cleanup on first use
  startCleanup()

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getIP(req)
    const { allowed, remaining, resetTime, maxRequests } = checkRateLimit(ip, tier)

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", maxRequests.toString())
    res.setHeader("X-RateLimit-Remaining", remaining.toString())
    res.setHeader("X-RateLimit-Reset", new Date(resetTime).toISOString())

    if (!allowed) {
      return res.status(429).json({
        error: "Too many requests from this IP, please try again later. The universe isn't ready for your enthusiasm.",
      })
    }

    return handler(req, res)
  }
}

