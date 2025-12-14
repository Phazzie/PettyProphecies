import type { NextApiRequest, NextApiResponse } from "next"
import { authMiddleware } from "../../../middleware/auth"
import { connectToDatabase } from "../../../utils/database"
import { Reading } from "../../../models/Reading"

const MAX_PAGE = 10000
const MIN_PAGE = 1
const MAX_LIMIT = 100
const MIN_LIMIT = 1
const DEFAULT_LIMIT = 10

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  if (req.method === "GET") {
    try {
      const rawPage = Number.parseInt(req.query.page as string)
      const rawLimit = Number.parseInt(req.query.limit as string)

      // Validate and bound page
      const page = Number.isNaN(rawPage)
        ? MIN_PAGE
        : Math.min(Math.max(rawPage, MIN_PAGE), MAX_PAGE)

      // Validate and bound limit
      const limit = Number.isNaN(rawLimit)
        ? DEFAULT_LIMIT
        : Math.min(Math.max(rawLimit, MIN_LIMIT), MAX_LIMIT)

      const skip = (page - 1) * limit

      const readings = await Reading.find({ userId: req.userId })
        .select("spreadName interpretation rating createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()

      const total = await Reading.countDocuments({ userId: req.userId })

      res.status(200).json({
        readings,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalReadings: total,
      })
    } catch (error) {
      console.error("Error fetching readings:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      res.status(500).json({ message: "Error fetching readings", error: errorMessage })
    }
  } else {
    res.status(405).json({ message: "Method not allowed" })
  }
}

export default authMiddleware(handler)

