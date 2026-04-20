import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Sends a password reset email to the user.
 * @param email - Recipient email address
 * @param token - One-time reset token (raw, not hashed)
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const resetUrl = `${appUrl}/reset-password?token=${token}`

  await resend.emails.send({
    from: "Passive-Aggressive Tarot <noreply@petty-prophecies.com>",
    to: email,
    subject: "Password Reset (Since You Forgot Again)",
    html: `
      <p>Someone requested a password reset for this account.
         If that someone is you, click the link below:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 1 hour. Try not to forget your new password immediately.</p>
      <p>If you didn't request this, feel free to ignore it.
         Your account is safe — for now.</p>
    `,
  })
}
