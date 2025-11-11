import type { NextApiRequest, NextApiResponse } from "next"
import { ApiError } from "../types/errors"
import logger from "../utils/logger"

export function errorHandler(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res)
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        logger.error({
          url: req.url,
          method: req.method,
          name: error.name,
          message: error.message,
          statusCode: error.statusCode,
        }, "API Error")

        res.status(error.statusCode).json({
          error: {
            message: error.message,
            code: error.name,
          },
        })
      } else {
        logger.error({
          url: req.url,
          method: req.method,
          error: error instanceof Error ? error.message : String(error),
        }, "Unexpected Error")

        res.status(500).json({
          error: {
            message: "An unexpected error occurred",
            code: "InternalServerError",
          },
        })
      }
    }
  }
}

