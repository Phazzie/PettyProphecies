import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../middleware/auth.v2"
import { errorHandler } from "../../middleware/errorHandler"
import { requestLogger } from "../../middleware/requestLogger"
import { getRateLimiter, setRateLimitHeaders, RateLimitError } from "../../middleware/rateLimit.v2"
import { getCSRFService } from "../../middleware/csrf"
import { getSpreadByName } from "../../data/tarotSpreads"
import { connectToDatabase } from "../../utils/database"
import { ReadingRepository } from "../../repositories/ReadingRepository"
import logger from "../../utils/logger"
import { ValidationError, DatabaseError } from "../../interfaces/seams"
import { generateAIReading, isAIAvailable, getAIModelInfo } from "../../services/aiTarot"
import { sendSuccess, sendError } from "../../utils/apiResponse"

const rateLimiter = getRateLimiter()

/**
 * Get identifier for rate limiting (IP address or user ID)
 */
function getIdentifier(req: NextApiRequest): string {
  return (
    req.userId ||
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()
  const readingRepository = new ReadingRepository()

  // Rate limiting
  const identifier = getIdentifier(req)
  const rateLimitResult = await rateLimiter.checkLimit(identifier, 'tarot:reading')
  setRateLimitHeaders(res, rateLimitResult)

  if (!rateLimitResult.allowed) {
    throw new RateLimitError(
      `Too many reading requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
      rateLimitResult.retryAfter
    )
  }

  // Validate CSRF token for POST and PUT requests
  if (req.method === "POST" || req.method === "PUT") {
    const csrfService = getCSRFService()
    await csrfService.validateToken(req)
  }

  if (req.method === "POST") {
    const { spreadName, useAI } = req.body
    const spread = getSpreadByName(spreadName)

    if (!spread) {
      throw new ValidationError("Invalid spread name", "spreadName")
    }

    const reading = spread.getReading()

    /**
     * Generate interpretation using AI or template
     * - Uses AI if useAI=true and AI service is available
     * - Falls back to template if AI unavailable or useAI=false
     * - Default: useAI=true when AI is available
     */
    const shouldUseAI = useAI !== false && isAIAvailable()
    let interpretation: string
    let aiGenerated = false

    if (shouldUseAI) {
      try {
        logger.info({ userId: req.userId, spreadName }, "Generating AI reading")
        interpretation = await generateAIReading({
          cards: reading,
          spread,
        })
        aiGenerated = true
        logger.info({ userId: req.userId, spreadName }, "AI reading generated successfully")
      } catch (error) {
        logger.warn({
          userId: req.userId,
          spreadName,
          error: error instanceof Error ? error.message : "Unknown error"
        }, "AI reading failed, falling back to template")
        interpretation = spread.interpret(reading)
        aiGenerated = false
      }
    } else {
      interpretation = spread.interpret(reading)
    }

    try {
      const newReading = await readingRepository.create({
        userId: req.userId,
        spreadName,
        cards: reading.map((card) => card.name),
        interpretation,
        aiGenerated,
      })

      logger.info({
        userId: req.userId,
        spreadName,
        aiGenerated
      }, "New reading created")

      const modelInfo = aiGenerated ? getAIModelInfo() : undefined

      return sendSuccess(res, {
        reading,
        interpretation,
        readingId: newReading._id,
        aiGenerated,
        modelInfo,
      })
    } catch (error) {
      throw new DatabaseError("Failed to save reading")
    }
  } else if (req.method === "PUT") {
    const { readingId, rating } = req.body

    if (!readingId || typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new ValidationError("Invalid rating data", "rating")
    }

    try {
      // First verify the reading belongs to the user
      const existingReading = await readingRepository.findOne({
        _id: readingId,
        userId: req.userId
      })

      if (!existingReading) {
        throw new ValidationError("Reading not found", "readingId")
      }

      const updatedReading = await readingRepository.rateReading(readingId, rating)

      if (!updatedReading) {
        throw new DatabaseError("Failed to update rating")
      }

      logger.info({ userId: req.userId, readingId, rating }, "Reading rated")

      return sendSuccess(res, {
        message: "Rating updated successfully",
        reading: updatedReading
      })
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError("Failed to update rating")
    }
  } else {
    return sendError(res, new ValidationError("Method not allowed", "method"), 405)
  }
}

export default withAuth(requestLogger(errorHandler(handler)))

