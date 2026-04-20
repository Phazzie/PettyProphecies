import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"
import xss from "xss"
import { z } from "zod"
import { User } from "../../../models/User"
import { connectToDatabase } from "../../../utils/database"
import { errorHandler } from "../../../middleware/errorHandler"
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { ValidationError, AuthenticationError } from "../../../types/errors"

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error("JWT_SECRET is not set in environment variables")
})()

const COOKIE_OPTIONS = [
  "HttpOnly",
  "Secure",
  "SameSite=Strict",
  "Path=/",
  "Max-Age=3600",
].join("; ")

const RegisterSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/)
    .transform((v) => xss(v)),
  email: z
    .string()
    .email()
    .max(255)
    .transform((v) => xss(v.toLowerCase())),
  password: z
    .string()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/),
})

const LoginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => xss(v)),
  password: z.string().min(1),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  const [action] = ([] as string[]).concat(req.query.auth ?? [])

  if (req.method === "POST") {
    if (action === "register") return handleRegister(req, res)
    if (action === "login") return handleLogin(req, res)
    if (action === "logout") return handleLogout(req, res)
  } else if (req.method === "GET") {
    if (action === "me") return handleMe(req, res)
  }

  res.status(405).json({ message: "Method not allowed" })
}

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  const result = RegisterSchema.safeParse(req.body)
  if (!result.success) {
    throw new ValidationError(result.error.errors[0]?.message ?? "Invalid input")
  }

  const { username, email, password } = result.data

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
  const result = LoginSchema.safeParse(req.body)
  if (!result.success) {
    throw new ValidationError("Missing email or password")
  }

  const { email, password } = result.data

  const user = await User.findOne({ email })
  if (!user) {
    throw new AuthenticationError("Invalid credentials")
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new AuthenticationError("Invalid credentials")
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" })
  res.setHeader("Set-Cookie", `token=${token}; ${COOKIE_OPTIONS}`)
  res.status(200).json({ message: "Login successful" })
}

function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader(
    "Set-Cookie",
    "token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
  )
  res.status(200).json({ message: "Logged out successfully" })
}

async function handleMe(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({ message: "Not authenticated" })
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
      return res.status(200).json({ userId: decoded.userId, isAuthenticated: true })
    }
    return res.status(401).json({ message: "Invalid token" })
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}

export default rateLimitMiddleware(errorHandler(handler), "auth")

