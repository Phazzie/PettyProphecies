import type { NextApiRequest, NextApiResponse } from "next"
import { authMiddleware } from "../../middleware/auth"
import { errorHandler } from "../../middleware/errorHandler"
import { Reading } from "../../models/Reading"
import { connectToDatabase } from "../../utils/database"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  await connectToDatabase()

  const page = parseInt(req.query.page as string) || 0
  const limit = 10
  const skip = page * limit

  const readings = await Reading.find({ userId: req.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean()

  const total = await Reading.countDocuments({ userId: req.userId })

  res.status(200).json({
    readings,
    page,
    totalPages: Math.ceil(total / limit),
    total,
  })
}

export default authMiddleware(errorHandler(handler))
