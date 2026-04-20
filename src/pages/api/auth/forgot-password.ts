import type { NextApiRequest, NextApiResponse } from "next"
import crypto from "crypto"
import { z } from "zod"
import { User } from "../../../models/User"
import { PasswordReset } from "../../../models/PasswordReset"
import { connectToDatabase } from "../../../utils/database"
import { errorHandler } from "../../../middleware/errorHandler"
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { sendPasswordResetEmail } from "../../../services/email"

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

// Generic success message to avoid revealing whether an account exists
const GENERIC_MESSAGE = "If that email exists in our system, you'll receive a password reset link shortly. How convenient."

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  await connectToDatabase()

  const result = ForgotPasswordSchema.safeParse(req.body)
  if (!result.success) {
    // Still return the generic message to prevent user enumeration
    return res.status(200).json({ message: GENERIC_MESSAGE })
  }

  const { email } = result.data

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(200).json({ message: GENERIC_MESSAGE })
    }

    // Delete any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: String(user._id) })

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await PasswordReset.create({
      userId: String(user._id),
      token,
      expiresAt,
    })

    await sendPasswordResetEmail(email, token)
  } catch {
    // Swallow errors to prevent leaking information about account existence
  }

  res.status(200).json({ message: GENERIC_MESSAGE })
}

export default rateLimitMiddleware(errorHandler(handler), "auth")
