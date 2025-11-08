import type { NextApiRequest, NextApiResponse } from "next"

// Simple in-memory rate limiter for Next.js API routes
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 100 // Limit each IP to 100 requests per window

function getIP(req: NextApiRequest): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
    (req.headers["x-real-ip"] as string) ||
    req.socket.remoteAddress ||
    "unknown"
  )
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    // New window or expired window
    const resetTime = now + WINDOW_MS
    rateLimitMap.set(ip, { count: 1, resetTime })
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetTime }
  }

  if (record.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime }
  }

  record.count++
  return { allowed: true, remaining: MAX_REQUESTS - record.count, resetTime: record.resetTime }
}

// Create a wrapper function to use the rate limiter with Next.js API routes
export function rateLimitMiddleware(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getIP(req)
    const { allowed, remaining, resetTime } = checkRateLimit(ip)

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS.toString())
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

