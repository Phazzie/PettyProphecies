import type { NextApiRequest, NextApiResponse } from "next"
import { authMiddleware } from "../../middleware/auth"
import { errorHandler } from "../../middleware/errorHandler"
import { requestLogger } from "../../middleware/requestLogger"
import { rateLimitMiddleware } from "../../middleware/rateLimit"
import { getSpreadByName } from "../../data/tarotSpreads"
import { connectToDatabase } from "../../utils/database"
import { Reading, type IReadingCard } from "../../models/Reading"
import logger from "../../utils/logger"
import { ValidationError, DatabaseError } from "../../types/errors"
import { z } from "zod"
import { validateRequest, formatZodError } from "../../utils/schemas"
import { generateAIReading } from "../../services/aiTarot"
import type { TarotCard } from "../../data/tarotCards"

// Inline Zod schemas for tarot reading endpoints
const createReadingRequestSchema = z.object({
  spreadName: z.string().min(1, "Spread name is required").max(100, "Spread name is too long"),
  userQuestion: z
    .string()
    .max(500, "Question must be 500 characters or less")
    .optional()
    .nullable()
    .transform((val) => (val?.trim() || null)),
})

const updateRatingRequestSchema = z.object({
  readingId: z.string().min(1, "Reading ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  if (req.method === "POST") {
    try {
      const validatedData = validateRequest(createReadingRequestSchema, req.body)
      const spread = getSpreadByName(validatedData.spreadName)

      if (!spread) {
        throw new ValidationError("Invalid spread name")
      }

      // Generate reading cards with reversal and position data
      const reading = spread.getReading()

      // Extract reversal state from DrawnCard objects
      const isReversed = reading.map((card) => card.isReversed)

      // Build full card data with reversal and position info
      const cardData: IReadingCard[] = reading.map((card) => ({
        name: card.name,
        number: card.number,
        isReversed: card.isReversed,
        position: card.position,
      }))

      let interpretation: string
      let aiGenerated = false

      try {
        // Attempt AI-generated reading with 10-second timeout
        const aiPromise = generateAIReading({
          cards: reading,
          spread,
          userQuestion: validatedData.userQuestion || undefined,
          isReversed,
        })

        const timeoutPromise = new Promise<string>((_, reject) => {
          setTimeout(() => reject(new Error("AI reading timeout")), 10000)
        })

        interpretation = await Promise.race([aiPromise, timeoutPromise])

        // Validate AI response
        if (!interpretation || interpretation.trim().length < 100) {
          logger.warn("AI response too short or empty, falling back to template", {
            responseLength: interpretation?.length || 0,
          })
          throw new Error("Invalid AI response")
        }

        aiGenerated = true
        logger.info("AI reading generated successfully", {
          userId: req.userId,
          spreadName: validatedData.spreadName,
        })
      } catch (error) {
        // Fallback to template interpretation on any AI failure
        logger.warn("AI reading failed, using template fallback", {
          error: error instanceof Error ? error.message : "Unknown error",
          userId: req.userId,
          spreadName: validatedData.spreadName,
        })
        interpretation = spread.interpret(reading)
        aiGenerated = false
      }

      try {
        const newReading = new Reading({
          userId: req.userId,
          spreadName: validatedData.spreadName,
          cards: cardData,
          interpretation,
          userQuestion: validatedData.userQuestion,
          aiGenerated,
        })
        await newReading.save()

        logger.info("New reading created", {
          userId: req.userId,
          spreadName: validatedData.spreadName,
          hasQuestion: !!validatedData.userQuestion,
          aiGenerated,
        })

        res.status(200).json({ reading, interpretation, readingId: newReading._id })
      } catch (error) {
        throw new DatabaseError("Failed to save reading")
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error)
        return res.status(400).json(formattedError)
      }
      throw error
    }
  } else if (req.method === "PUT") {
    try {
      const validatedData = validateRequest(updateRatingRequestSchema, req.body)

      try {
        const updatedReading = await Reading.findOneAndUpdate(
          { _id: validatedData.readingId, userId: req.userId },
          { rating: validatedData.rating },
          { new: true },
        )

        if (!updatedReading) {
          throw new ValidationError("Reading not found")
        }

        logger.info("Reading rated", {
          userId: req.userId,
          readingId: validatedData.readingId,
          rating: validatedData.rating,
        })

        res.status(200).json({ message: "Rating updated successfully", reading: updatedReading })
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        throw new DatabaseError("Failed to update rating")
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedError = formatZodError(error)
        return res.status(400).json(formattedError)
      }
      throw error
    }
  } else {
    res.status(405).json({ message: "Method not allowed" })
  }
}

export default rateLimitMiddleware(authMiddleware(requestLogger(errorHandler(handler))))

