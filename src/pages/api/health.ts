import type { NextApiRequest, NextApiResponse } from 'next'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/src/lib/mongodb'
import { getRateLimiter } from '@/src/middleware/rateLimit.v2'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown' as string,
      redis: 'unknown' as string,
    },
    memory: process.memoryUsage(),
  }

  // Check MongoDB
  try {
    await connectToDatabase()
    if (mongoose.connection.readyState === 1) {
      health.services.database = 'connected'
    } else {
      health.services.database = 'disconnected'
      health.status = 'degraded'
    }
  } catch (error) {
    health.services.database = 'error'
    health.status = 'degraded'
  }

  // Check Redis
  try {
    const rateLimiter = getRateLimiter()
    const testResult = await rateLimiter.checkLimit('health-check', 'api:general')
    health.services.redis = testResult ? 'connected' : 'disconnected'
  } catch (error) {
    health.services.redis = 'error (falling back to memory)'
    // Don't mark as degraded - memory fallback works
  }

  const statusCode = health.status === 'ok' ? 200 : 503
  return res.status(statusCode).json(health)
}
