import type { NextApiRequest, NextApiResponse } from "next"
import { generateCsrfToken } from "../../../middleware/csrf"
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { errorHandler } from "../../../middleware/errorHandler"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const csrfToken = generateCsrfToken()
  res.setHeader("Cache-Control", "no-store")
  res.status(200).json({ csrfToken })
}

export default rateLimitMiddleware(errorHandler(handler))
