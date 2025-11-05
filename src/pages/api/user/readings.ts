import type { NextApiRequest, NextApiResponse } from "next"
import { authMiddleware } from "../../../middleware/auth"
import { connectToDatabase } from "../../../utils/database"
import { Reading } from "../../../models/Reading"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  if (req.method === "GET") {
    try {
      const page = Number.parseInt(req.query.page as string) || 1
      const limit = 10
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

