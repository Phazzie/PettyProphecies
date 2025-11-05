import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"
import { User } from "../../../models/User"
import { connectToDatabase } from "../../../utils/database"
import { errorHandler } from "../../../middleware/errorHandler"
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { ValidationError, AuthenticationError } from "../../../types/errors"

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error("JWT_SECRET is not set in environment variables")
})()

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  if (req.method === "POST") {
    if (req.query.auth === "register") {
      return handleRegister(req, res)
    } else if (req.query.auth === "login") {
      return handleLogin(req, res)
    }
  } else if (req.method === "GET" && req.query.auth === "logout") {
    return handleLogout(req, res)
  }

  res.status(405).json({ message: "Method not allowed" })
}

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    throw new ValidationError("Missing required fields")
  }

  try {
    const user = new User({ username, email, password })
    await user.save()
    res.status(201).json({ message: "User registered successfully" })
  } catch (error) {
    if (error instanceof Error) {
      const mongoError = error as Error & { code?: number }
      if (mongoError.code === 11000) {
        throw new ValidationError("Username or email already exists")
      }
    }
    throw error
  }
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body

  if (!email || !password) {
    throw new ValidationError("Missing email or password")
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new AuthenticationError("Invalid credentials")
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new AuthenticationError("Invalid credentials")
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" })
  res.status(200).json({ token })
}

function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: "Logged out successfully" })
}

export default rateLimitMiddleware(errorHandler(handler))

