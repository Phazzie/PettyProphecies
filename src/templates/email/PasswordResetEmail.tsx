/**
 * Password Reset Email Template
 *
 * Styled HTML email template for password reset requests.
 * Features:
 * - Prominent reset button with expiring link
 * - 1-hour expiry warning
 * - Passive-aggressive tone (brand consistency)
 * - Mobile-responsive design
 * - Security warning for unrequested resets
 */

import React from "react"
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Button,
  Hr,
} from "@react-email/components"

interface PasswordResetEmailProps {
  username: string
  resetUrl: string
}

/**
 * PasswordResetEmail component
 *
 * Renders a styled email for password reset with passive-aggressive flair.
 *
 * @param username - User's display name
 * @param resetUrl - Complete URL with reset token
 */
export function PasswordResetEmail({
  username,
  resetUrl,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={title}>🔮 Petty Prophecies</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hey {username},</Text>

            <Text style={paragraph}>
              Forgot your password again? We're not surprised. It happens to the
              best of us... and apparently to you too.
            </Text>

            <Text style={paragraph}>
              Click the button below to reset your password. You have{" "}
              <strong>1 hour</strong> before this link expires. No pressure.
            </Text>

            {/* Reset Button */}
            <Section style={buttonContainer}>
              <Button href={resetUrl} style={button}>
                Reset Password
              </Button>
            </Section>

            <Text style={caption}>
              Or copy and paste this URL into your browser:
            </Text>
            <Text style={link}>
              <Link href={resetUrl} style={linkStyle}>
                {resetUrl}
              </Link>
            </Text>

            <Hr style={divider} />

            {/* Security Warning */}
            <Text style={warningText}>
              If you didn't request a password reset, you can safely ignore this
              email. Someone probably just typed in the wrong email address.
              Classic.
            </Text>

            <Text style={footer}>
              The cards have spoken,
              <br />
              <strong>Petty Prophecies Team</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles - Inline for maximum email client compatibility
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
}

const header = {
  padding: "32px 48px",
  backgroundColor: "#7c3aed",
  textAlign: "center" as const,
}

const title = {
  margin: "0",
  fontSize: "28px",
  fontWeight: "bold",
  color: "#ffffff",
}

const content = {
  padding: "0 48px",
}

const greeting = {
  fontSize: "20px",
  lineHeight: "1.4",
  color: "#1f2937",
  fontWeight: "600",
  marginTop: "32px",
  marginBottom: "8px",
}

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "16px 0",
}

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
}

const button = {
  backgroundColor: "#7c3aed",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
}

const caption = {
  fontSize: "14px",
  lineHeight: "1.4",
  color: "#6b7280",
  margin: "8px 0",
}

const link = {
  fontSize: "14px",
  lineHeight: "1.4",
  margin: "8px 0",
  wordBreak: "break-all" as const,
}

const linkStyle = {
  color: "#7c3aed",
  textDecoration: "underline",
}

const divider = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
}

const warningText = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#6b7280",
  margin: "16px 0",
  fontStyle: "italic",
}

const footer = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#6b7280",
  marginTop: "32px",
}
