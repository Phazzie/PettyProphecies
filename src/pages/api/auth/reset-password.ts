import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { User } from "../../../models/User"
import { PasswordReset } from "../../../models/PasswordReset"
import { connectToDatabase } from "../../../utils/database"
import { errorHandler } from "../../../middleware/errorHandler"
import { rateLimitMiddleware } from "../../../middleware/rateLimit"
import { ValidationError } from "../../../types/errors"

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{12,}$/,
      "Password must be at least 12 characters with uppercase, lowercase, digit, and special character",
    ),
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  await connectToDatabase()

  const result = ResetPasswordSchema.safeParse(req.body)
  if (!result.success) {
    throw new ValidationError(result.error.errors[0]?.message ?? "Invalid input")
  }

  const { token, newPassword } = result.data

  const resetRecord = await PasswordReset.findOne({
    token,
    expiresAt: { $gt: new Date() },
  })

  if (!resetRecord) {
    return res.status(400).json({ message: "Invalid or expired reset token. Try requesting a new one." })
  }

  const user = await User.findById(resetRecord.userId)
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token. Try requesting a new one." })
  }

  user.password = newPassword
  await user.save()

  // Delete all reset tokens for this user
  await PasswordReset.deleteMany({ userId: String(user._id) })

  res.status(200).json({ message: "Password reset successfully. Try not to forget this one." })
}

export default rateLimitMiddleware(errorHandler(handler), "auth")
