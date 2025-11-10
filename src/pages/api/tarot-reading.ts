import type { NextApiRequest, NextApiResponse } from "next"
import { authMiddleware } from "../../middleware/auth"
import { errorHandler } from "../../middleware/errorHandler"
import { requestLogger } from "../../middleware/requestLogger"
import { rateLimitMiddleware } from "../../middleware/rateLimit"
import { getSpreadByName } from "../../data/tarotSpreads"
import { connectToDatabase } from "../../utils/database"
import { Reading } from "../../models/Reading"
import logger from "../../utils/logger"
import { ValidationError, DatabaseError } from "../../types/errors"
import { z } from "zod"
import { validateRequest, formatZodError } from "../../utils/schemas"

// Inline Zod schemas for tarot reading endpoints
const createReadingRequestSchema = z.object({
  spreadName: z.string().min(1, "Spread name is required").max(100, "Spread name is too long"),
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

      const reading = spread.getReading()
      const interpretation = spread.interpret(reading)

      try {
        const newReading = new Reading({
          userId: req.userId,
          spreadName: validatedData.spreadName,
          cards: reading.map((card) => card.name),
          interpretation,
        })
        await newReading.save()

        logger.info("New reading created", { userId: req.userId, spreadName: validatedData.spreadName })

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

