import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../middleware/auth.v2"
import { errorHandler } from "../../middleware/errorHandler"
import { requestLogger } from "../../middleware/requestLogger"
import { rateLimitMiddleware } from "../../middleware/rateLimit"
import { getSpreadByName } from "../../data/tarotSpreads"
import { connectToDatabase } from "../../utils/database"
import { ReadingRepository } from "../../repositories/ReadingRepository"
import logger from "../../utils/logger"
import { ValidationError, DatabaseError } from "../../interfaces/seams"
import { generateAIReading, isAIAvailable, getAIModelInfo } from "../../services/aiTarot"
import { sendSuccess, sendError } from "../../utils/apiResponse"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()
  const readingRepository = new ReadingRepository()

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
        logger.info("Generating AI reading", { userId: req.userId, spreadName })
        interpretation = await generateAIReading({
          cards: reading,
          spread,
        })
        aiGenerated = true
        logger.info("AI reading generated successfully", { userId: req.userId, spreadName })
      } catch (error) {
        logger.warn("AI reading failed, falling back to template", {
          userId: req.userId,
          spreadName,
          error: error instanceof Error ? error.message : "Unknown error"
        })
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

      logger.info("New reading created", {
        userId: req.userId,
        spreadName,
        aiGenerated
      })

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

      logger.info("Reading rated", { userId: req.userId, readingId, rating })

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

export default rateLimitMiddleware(withAuth(requestLogger(errorHandler(handler))))

