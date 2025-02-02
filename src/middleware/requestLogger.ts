import type { NextApiRequest, NextApiResponse } from "next"
import logger from "../utils/logger"

export function requestLogger(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now()

    res.on("finish", () => {
      const duration = Date.now() - start
      logger.info("Request processed", {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
      })
    })

    await handler(req, res)
  }
}

