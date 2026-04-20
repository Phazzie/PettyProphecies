import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error("FATAL: JWT_SECRET environment variable is not set")
})()

export function authMiddleware(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = req.cookies?.token
      if (!token) {
        return res.status(401).json({ message: "Authentication required" })
      }
      const decoded = jwt.verify(token, JWT_SECRET)
      if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
        req.userId = decoded.userId as string
        return handler(req, res)
      }
      return res.status(401).json({ message: "Invalid token payload" })
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" })
    }
  }
}

