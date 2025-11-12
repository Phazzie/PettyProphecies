import type { NextApiRequest, NextApiResponse } from "next"
import { withAuth } from "../../../middleware/auth.v2"
import { connectToDatabase } from "../../../utils/database"
import { ReadingRepository } from "../../../repositories/ReadingRepository"
import { Reading } from "../../../models/Reading"
import { sendSuccess, sendError, sendPaginated } from "../../../utils/apiResponse"
import { DatabaseError, ValidationError } from "../../../interfaces/seams"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()
  const readingRepository = new ReadingRepository()

  if (req.method === "GET") {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = 10
      const skip = (page - 1) * limit

      const readings = await readingRepository.findByUserId(req.userId!, {
        skip,
        limit,
        sort: { createdAt: -1 }
      })

      // Count total readings for pagination (using model directly as repository doesn't have count method)
      const total = await Reading.countDocuments({ userId: req.userId })

      // Use sendPaginated helper for consistent paginated response format
      return sendPaginated(res, readings, total, page, limit)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return sendError(res, new DatabaseError(`Error fetching readings: ${errorMessage}`))
    }
  } else {
    return sendError(res, new ValidationError("Method not allowed", "method"), 405)
  }
}

export default withAuth(handler)

