/**
 * Email Service Implementation using Resend
 *
 * Implements IEmailService for sending transactional emails.
 * Features:
 * - Password reset emails with expiring tokens
 * - Welcome emails for new users
 * - Generic email sending
 * - Graceful degradation when API key is missing
 * - Email validation
 * - Passive-aggressive tone (as per app theme)
 *
 * @see https://resend.com/docs
 */

import { Resend } from "resend"
import { render } from "@react-email/render"
import type { IEmailService, EmailOptions } from "@/src/interfaces/seams"
import { PasswordResetEmail } from "@/src/templates/email/PasswordResetEmail"
import { WelcomeEmail } from "@/src/templates/email/WelcomeEmail"

/**
 * EmailService class implementing IEmailService interface
 *
 * Uses Resend for reliable transactional email delivery.
 * Gracefully handles missing API keys in development environments.
 */
export class EmailService implements IEmailService {
  private resend: Resend | null = null
  private from = "Petty Prophecies <noreply@pettyprophecies.com>"
  private isConfigured: boolean

  constructor() {
    const apiKey = process.env.RESEND_API_KEY

    if (apiKey) {
      this.resend = new Resend(apiKey)
      this.isConfigured = true
    } else {
      this.isConfigured = false
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "⚠️  RESEND_API_KEY not configured. Emails will be logged instead of sent."
        )
      }
    }
  }

  /**
   * Send password reset email with expiring token
   *
   * @param email - Recipient email address
   * @param resetToken - Unique token for password reset
   * @param username - Username for personalization
   * @throws Error if email sending fails or validation fails
   */
  async sendPasswordReset(
    email: string,
    resetToken: string,
    username: string
  ): Promise<void> {
    this.validateEmail(email)

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`

    try {
      const html = render(
        PasswordResetEmail({ username, resetUrl })
      )

      await this.send({
        to: email,
        subject: "Password Reset Request - Petty Prophecies",
        html,
      })
    } catch (error) {
      console.error("Failed to send password reset email:", error)
      throw new Error("Failed to send password reset email")
    }
  }

  /**
   * Send welcome email to new users
   *
   * @param email - Recipient email address
   * @param username - Username for personalization
   * @throws Error if email sending fails or validation fails
   */
  async sendWelcome(email: string, username: string): Promise<void> {
    this.validateEmail(email)

    try {
      const html = render(WelcomeEmail({ username }))

      await this.send({
        to: email,
        subject: "Welcome to Petty Prophecies - Let's See How Long You Last",
        html,
      })
    } catch (error) {
      console.error("Failed to send welcome email:", error)
      throw new Error("Failed to send welcome email")
    }
  }

  /**
   * Send generic email
   *
   * @param options - Email options (to, subject, html, text)
   * @throws Error if email sending fails or validation fails
   */
  async send(options: EmailOptions): Promise<void> {
    // Validate required fields
    this.validateEmail(options.to)

    if (!options.subject || options.subject.trim() === "") {
      throw new Error("Subject is required")
    }

    if (!options.html || options.html.trim() === "") {
      throw new Error("HTML content is required")
    }

    // If not configured, log instead of sending (development mode)
    if (!this.isConfigured) {
      this.logEmail(options)
      return
    }

    try {
      const emailPayload: any = {
        from: this.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }

      // Add text content if provided
      if (options.text) {
        emailPayload.text = options.text
      }

      await this.resend!.emails.send(emailPayload)
    } catch (error: any) {
      console.error("Failed to send email:", error)

      // Provide more context for specific errors
      if (error?.statusCode === 429) {
        throw new Error("Failed to send email: Rate limit exceeded")
      } else if (error?.statusCode === 401) {
        throw new Error("Failed to send email: Invalid API key")
      } else {
        throw new Error("Failed to send email")
      }
    }
  }

  /**
   * Validate email address format
   *
   * @param email - Email address to validate
   * @throws Error if email is invalid
   */
  private validateEmail(email: string): void {
    if (!email || email.trim() === "") {
      throw new Error("Invalid email address")
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email address")
    }
  }

  /**
   * Log email details instead of sending (development fallback)
   *
   * @param options - Email options to log
   */
  private logEmail(options: EmailOptions): void {
    console.warn(
      "📧 RESEND_API_KEY not configured. Would send email:",
      {
        from: this.from,
        to: options.to,
        subject: options.subject,
        htmlPreview: options.html.substring(0, 100) + "...",
      }
    )

    if (process.env.NODE_ENV === "development") {
      console.log("Full email HTML:", options.html)
    }
  }
}

/**
 * Default email service instance
 *
 * Use this singleton for consistency across the application.
 */
export const emailService = new EmailService()
