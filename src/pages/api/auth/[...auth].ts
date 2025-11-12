import type { NextApiRequest, NextApiResponse } from "next"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { User } from "../../../models/User"
import { connectToDatabase } from "../../../utils/database"
import { errorHandler } from "../../../middleware/errorHandler"
import { ValidationError, AuthenticationError } from "../../../types/errors"
import { getRateLimiter, setRateLimitHeaders, RateLimitError } from '@/src/middleware/rateLimit.v2'
import { getAuthService } from '@/src/middleware/auth.v2'
import { getCSRFService } from '@/src/middleware/csrf'
import { UserRepository } from '@/src/repositories/UserRepository'
import { emailService } from '@/src/services/email'
import { sendSuccess } from '@/src/utils/apiResponse'
import { errorHandler as errorHandlerV2 } from '@/src/middleware/errorHandler.v2'
import { ConflictError, AuthenticationError as AuthenticationErrorV2, ValidationError as ValidationErrorV2 } from '@/src/interfaces/seams'
import logger from '@/src/utils/logger'

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  throw new Error("JWT_SECRET is not set in environment variables")
})()

const authService = getAuthService()
const csrfService = getCSRFService()
const userRepo = new UserRepository()
const rateLimiter = getRateLimiter()

/**
 * Get identifier for rate limiting (IP address)
 */
function getIdentifier(req: NextApiRequest): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase()

  const { auth } = req.query

  // Support GET requests
  if (req.method === "GET") {
    if (auth?.[0] === "verify") {
      return handleVerify(req, res)
    }
    if (auth?.[0] === "csrf") {
      const csrfToken = await csrfService.generateToken(req, res)
      return sendSuccess(res, { csrfToken })
    }
  }

  // Support POST requests with CSRF validation
  if (req.method === "POST") {
    // Validate CSRF token for all POST endpoints
    await csrfService.validateToken(req)

    switch (auth?.[0]) {
      case "login":
        return handleLogin(req, res)
      case "register":
        return handleRegister(req, res)
      case "logout":
        return handleLogout(req, res)
      default:
        return res.status(404).json({ error: "Endpoint not found" })
    }
  }

  res.status(405).json({ error: "Method not allowed" })
}

async function handleVerify(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  const identifier = getIdentifier(req)
  const rateLimitResult = await rateLimiter.checkLimit(identifier, 'auth:verify')
  setRateLimitHeaders(res, rateLimitResult)

  if (!rateLimitResult.allowed) {
    throw new RateLimitError(
      `Too many verification requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
      rateLimitResult.retryAfter
    )
  }

  // Use authService to verify cookie and get userId
  const userId = await authService.verifyToken(req)

  if (!userId) {
    return sendSuccess(res, {
      authenticated: false,
      user: null
    })
  }

  // Fetch user data
  const user = await userRepo.findById(userId)
  if (!user) {
    return sendSuccess(res, {
      authenticated: false,
      user: null
    })
  }

  return sendSuccess(res, {
    authenticated: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}

async function handleRegister(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  const identifier = getIdentifier(req)
  const rateLimitResult = await rateLimiter.checkLimit(identifier, 'auth:register')
  setRateLimitHeaders(res, rateLimitResult)

  if (!rateLimitResult.allowed) {
    throw new RateLimitError(
      `Too many registration attempts. Try again in ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutes.`,
      rateLimitResult.retryAfter
    )
  }

  const { username, email, password } = req.body

  // Validate inputs
  if (!username || !email || !password) {
    throw new ValidationErrorV2("All fields are required")
  }

  // Check if user already exists
  const existingUser = await userRepo.findByEmail(email.toLowerCase())
  if (existingUser) {
    throw new ConflictError("User with this email already exists")
  }

  const existingUsername = await userRepo.findByUsername(username)
  if (existingUsername) {
    throw new ConflictError("Username already taken")
  }

  // Create user using repository (password will be hashed by model pre-save hook)
  const user = await userRepo.create({
    username,
    email: email.toLowerCase(),
    password
  })

  // Set httpOnly cookie (V2!)
  await authService.setAuthCookie(res, String(user._id))

  // Send welcome email (non-blocking)
  emailService.sendWelcome(user.email, user.username).catch(err => {
    logger.error({ error: err, userId: user._id }, 'Failed to send welcome email')
  })

  // Return success (NO TOKEN in response body!)
  return sendSuccess(res, {
    message: "Registration successful",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  const identifier = getIdentifier(req)
  const rateLimitResult = await rateLimiter.checkLimit(identifier, 'auth:login')
  setRateLimitHeaders(res, rateLimitResult)

  if (!rateLimitResult.allowed) {
    throw new RateLimitError(
      `Too many login attempts. Try again in ${Math.ceil(rateLimitResult.retryAfter! / 60)} minutes.`,
      rateLimitResult.retryAfter
    )
  }

  const { email, password } = req.body

  // Validate inputs
  if (!email || !password) {
    throw new ValidationErrorV2("Email and password are required")
  }

  // Find user
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw new AuthenticationErrorV2("Invalid credentials")
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password)
  if (!isValid) {
    throw new AuthenticationErrorV2("Invalid credentials")
  }

  // Set httpOnly cookie (V2!)
  await authService.setAuthCookie(res, String(user._id))

  // Return success (NO TOKEN in response body!)
  return sendSuccess(res, {
    message: "Login successful",
    user: {
      id: user._id,
      username: user.username,
      email: user.email
    }
  })
}

async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  // Rate limiting
  const identifier = getIdentifier(req)
  const rateLimitResult = await rateLimiter.checkLimit(identifier, 'auth:logout')
  setRateLimitHeaders(res, rateLimitResult)

  if (!rateLimitResult.allowed) {
    throw new RateLimitError(
      `Too many logout requests. Try again in ${rateLimitResult.retryAfter} seconds.`,
      rateLimitResult.retryAfter
    )
  }

  // Clear the httpOnly cookie
  authService.clearAuthCookie(res)

  return sendSuccess(res, {
    message: "Logged out successfully"
  })
}

export default errorHandler(handler)

