import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"
import { User } from "../../../models/User"
import { connectToDatabase } from "../../../utils/database"
import { errorHandler } from "../../../middleware/errorHandler"
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { ValidationError, AuthenticationError } from "../../../types/errors"
import { registerSchema, loginSchema, validateRequest, formatZodError } from "../../../utils/schemas"
import { z } from "zod"

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
  try {
    const validatedData = validateRequest(registerSchema, req.body)

    const user = new User({
      username: validatedData.username,
      email: validatedData.email,
      password: validatedData.password,
    })
    await user.save()
    res.status(201).json({ message: "User registered successfully" })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error)
      return res.status(400).json(formattedError)
    }
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
  try {
    const validatedData = validateRequest(loginSchema, req.body)

    const user = await User.findOne({ email: validatedData.email })
    if (!user) {
      throw new AuthenticationError("Invalid credentials")
    }

    const isMatch = await user.comparePassword(validatedData.password)
    if (!isMatch) {
      throw new AuthenticationError("Invalid credentials")
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" })
    res.status(200).json({ token })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedError = formatZodError(error)
      return res.status(400).json(formattedError)
    }
    throw error
  }
}

function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: "Logged out successfully" })
}

export default rateLimitMiddleware(errorHandler(handler))

