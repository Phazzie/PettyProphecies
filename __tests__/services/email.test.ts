/**
 * Email Service Tests
 *
 * TDD Tests for email service using Resend.
 * Tests email sending, template rendering, error handling, and fallback behavior.
 */

// Set environment variables BEFORE any imports
process.env.RESEND_API_KEY = "re_test_key_123456"
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"

import type { IEmailService } from "@/src/interfaces/seams"

// Create mock send function that we can spy on
const mockSend = jest.fn()

// Mock Resend SDK
jest.mock("resend", () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: mockSend,
      },
    })),
  }
})

// Mock email templates
jest.mock("@/src/templates/email/PasswordResetEmail", () => ({
  PasswordResetEmail: jest.fn(({ resetUrl, username }: any) =>
    `<html><body>Reset password for ${username}: ${resetUrl}</body></html>`
  ),
}))

jest.mock("@/src/templates/email/WelcomeEmail", () => ({
  WelcomeEmail: jest.fn(({ username }: any) =>
    `<html><body>Welcome ${username}!</body></html>`
  ),
}))

// Mock @react-email/render
jest.mock("@react-email/render", () => ({
  render: jest.fn((component: any) => component),
}))

// Mock logger to prevent setImmediate issues in Jest
jest.mock("@/src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

// Import AFTER mocks are set up
import { EmailService } from "@/src/services/email"

describe("EmailService", () => {
  let emailService: IEmailService

  beforeEach(() => {
    jest.clearAllMocks()
    mockSend.mockReset()

    // Create fresh instance for each test
    emailService = new EmailService()
  })

  describe("sendPasswordReset", () => {
    it("should send password reset email with correct parameters", async () => {
      mockSend.mockResolvedValueOnce({ id: "email-123" })

      await emailService.sendPasswordReset(
        "test@example.com",
        "reset-token-123",
        "TestUser"
      )

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({
        from: "Petty Prophecies <noreply@pettyprophecies.com>",
        to: "test@example.com",
        subject: "Password Reset Request - Petty Prophecies",
        html: expect.stringContaining("Reset password for TestUser"),
      })
    })

    it("should include reset URL with token in email", async () => {
      mockSend.mockResolvedValueOnce({ id: "email-123" })

      await emailService.sendPasswordReset(
        "test@example.com",
        "reset-token-xyz",
        "TestUser"
      )

      const callArgs = mockSend.mock.calls[0][0]
      expect(callArgs.html).toContain("http://localhost:3000/reset-password?token=reset-token-xyz")
    })

    it("should handle Resend API errors", async () => {
      mockSend.mockRejectedValueOnce(new Error("Resend API error"))

      await expect(
        emailService.sendPasswordReset("test@example.com", "token", "User")
      ).rejects.toThrow("Failed to send password reset email")
    })

    it("should validate email address format", async () => {
      await expect(
        emailService.sendPasswordReset("invalid-email", "token", "User")
      ).rejects.toThrow("Invalid email address")
    })

    it("should reject empty email addresses", async () => {
      await expect(
        emailService.sendPasswordReset("", "token", "User")
      ).rejects.toThrow("Invalid email address")
    })
  })

  describe("sendWelcome", () => {
    it("should send welcome email with correct parameters", async () => {
      mockSend.mockResolvedValueOnce({ id: "email-456" })

      await emailService.sendWelcome("newuser@example.com", "NewUser")

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({
        from: "Petty Prophecies <noreply@pettyprophecies.com>",
        to: "newuser@example.com",
        subject: "Welcome to Petty Prophecies - Let's See How Long You Last",
        html: expect.stringContaining("Welcome NewUser"),
      })
    })

    it("should handle Resend API errors", async () => {
      mockSend.mockRejectedValueOnce(new Error("Resend API error"))

      await expect(
        emailService.sendWelcome("test@example.com", "User")
      ).rejects.toThrow("Failed to send welcome email")
    })

    it("should validate email address format", async () => {
      await expect(
        emailService.sendWelcome("not-an-email", "User")
      ).rejects.toThrow("Invalid email address")
    })
  })

  describe("send (generic)", () => {
    it("should send generic email with provided options", async () => {
      mockSend.mockResolvedValueOnce({ id: "email-789" })

      await emailService.send({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML content</p>",
        text: "Test plain text content",
      })

      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith({
        from: "Petty Prophecies <noreply@pettyprophecies.com>",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>Test HTML content</p>",
        text: "Test plain text content",
      })
    })

    it("should send email without text content", async () => {
      mockSend.mockResolvedValueOnce({ id: "email-789" })

      await emailService.send({
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>HTML only</p>",
      })

      expect(mockSend).toHaveBeenCalledWith({
        from: "Petty Prophecies <noreply@pettyprophecies.com>",
        to: "recipient@example.com",
        subject: "Test Subject",
        html: "<p>HTML only</p>",
      })
    })

    it("should validate required fields", async () => {
      await expect(
        emailService.send({
          to: "",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Invalid email address")

      await expect(
        emailService.send({
          to: "test@example.com",
          subject: "",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Subject is required")

      await expect(
        emailService.send({
          to: "test@example.com",
          subject: "Test",
          html: "",
        })
      ).rejects.toThrow("HTML content is required")
    })

    it("should handle Resend API errors", async () => {
      mockSend.mockRejectedValueOnce(new Error("Network error"))

      await expect(
        emailService.send({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Failed to send email")
    })
  })

  describe("Graceful degradation (missing API key)", () => {
    beforeEach(() => {
      // Remove API key to test fallback behavior
      const originalKey = process.env.RESEND_API_KEY
      delete process.env.RESEND_API_KEY

      // Need to re-import to get new instance without API key
      jest.resetModules()
      const { EmailService: EmailServiceNoKey } = require("@/src/services/email")
      emailService = new EmailServiceNoKey()
    })

    it("should log warning instead of sending when API key is missing", async () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation()

      await emailService.sendPasswordReset("test@example.com", "token", "User")

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("RESEND_API_KEY not configured"),
        expect.any(Object)
      )
      expect(mockSend).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should not throw error when API key missing in development", async () => {
      process.env.NODE_ENV = "development"
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation()

      await expect(
        emailService.sendWelcome("test@example.com", "User")
      ).resolves.not.toThrow()

      consoleSpy.mockRestore()
    })

    it("should log email details when in development mode", async () => {
      process.env.NODE_ENV = "development"
      const consoleSpy = jest.spyOn(console, "log").mockImplementation()
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation()

      await emailService.send({
        to: "test@example.com",
        subject: "Test",
        html: "<p>Test</p>",
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Full email HTML:"),
        expect.any(String)
      )

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })
  })

  describe("Email validation", () => {
    it("should accept valid email addresses", async () => {
      mockSend.mockResolvedValue({ id: "email-123" })

      const validEmails = [
        "user@example.com",
        "test.user@example.co.uk",
        "user+tag@example.com",
        "123@example.com",
      ]

      for (const email of validEmails) {
        await expect(
          emailService.send({
            to: email,
            subject: "Test",
            html: "<p>Test</p>",
          })
        ).resolves.not.toThrow()
      }
    })

    it("should reject invalid email addresses", async () => {
      const invalidEmails = [
        "not-an-email",
        "@example.com",
        "user@",
        "user @example.com",
        "user@example",
      ]

      for (const email of invalidEmails) {
        await expect(
          emailService.send({
            to: email,
            subject: "Test",
            html: "<p>Test</p>",
          })
        ).rejects.toThrow("Invalid email address")
      }
    })
  })

  describe("Rate limiting and error recovery", () => {
    beforeEach(() => {
      // Restore API key for these tests
      process.env.RESEND_API_KEY = "re_test_key_123456"

      // Create new instance with API key configured
      jest.resetModules()
      const { EmailService: EmailServiceWithKey } = require("@/src/services/email")
      emailService = new EmailServiceWithKey()
    })

    it("should handle rate limit errors from Resend", async () => {
      const rateLimitError = new Error("Rate limit exceeded")
      ;(rateLimitError as any).statusCode = 429
      mockSend.mockRejectedValueOnce(rateLimitError)

      await expect(
        emailService.send({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Failed to send email")
    })

    it("should handle authentication errors from Resend", async () => {
      const authError = new Error("Invalid API key")
      ;(authError as any).statusCode = 401
      mockSend.mockRejectedValueOnce(authError)

      await expect(
        emailService.send({
          to: "test@example.com",
          subject: "Test",
          html: "<p>Test</p>",
        })
      ).rejects.toThrow("Failed to send email")
    })
  })
})
