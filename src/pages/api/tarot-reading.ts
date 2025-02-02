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

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  if (req.method === "POST") {
    const { spreadName } = req.body
    const spread = getSpreadByName(spreadName)

    if (!spread) {
      throw new ValidationError("Invalid spread name")
    }

    const reading = spread.getReading()
    const interpretation = spread.interpret(reading)

    try {
      const newReading = new Reading({
        userId: req.userId,
        spreadName,
        cards: reading.map((card) => card.name),
        interpretation,
      })
      await newReading.save()

      logger.info("New reading created", { userId: req.userId, spreadName })

      res.status(200).json({ reading, interpretation, readingId: newReading._id })
    } catch (error) {
      throw new DatabaseError("Failed to save reading")
    }
  } else if (req.method === "PUT") {
    const { readingId, rating } = req.body

    if (!readingId || typeof rating !== "number" || rating < 1 || rating > 5) {
      throw new ValidationError("Invalid rating data")
    }

    try {
      const updatedReading = await Reading.findOneAndUpdate(
        { _id: readingId, userId: req.userId },
        { rating },
        { new: true },
      )

      if (!updatedReading) {
        throw new ValidationError("Reading not found")
      }

      logger.info("Reading rated", { userId: req.userId, readingId, rating })

      res.status(200).json({ message: "Rating updated successfully", reading: updatedReading })
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error
      }
      throw new DatabaseError("Failed to update rating")
    }
  } else {
    res.status(405).json({ message: "Method not allowed" })
  }
}

export default rateLimitMiddleware(authMiddleware(requestLogger(errorHandler(handler))))

