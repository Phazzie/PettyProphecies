/**
 * Welcome Email Template
 *
 * Styled HTML email template for welcoming new users.
 * Features:
 * - Warm (but sarcastic) welcome message
 * - Quick start guide
 * - Passive-aggressive tone (brand consistency)
 * - Mobile-responsive design
 * - Call-to-action to start first reading
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

interface WelcomeEmailProps {
  username: string
}

/**
 * WelcomeEmail component
 *
 * Renders a styled welcome email with passive-aggressive flair.
 *
 * @param username - User's display name
 */
export function WelcomeEmail({ username }: WelcomeEmailProps) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={title}>🔮 Petty Prophecies</Text>
            <Text style={subtitle}>
              Where the cards don't hold back, and neither do we
            </Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Welcome, {username}!</Text>

            <Text style={paragraph}>
              Welcome to Petty Prophecies. Let's see how long you last.
            </Text>

            <Text style={paragraph}>
              We're not your typical tarot app. We don't do sugar-coating, and
              we certainly don't do hand-holding. Our readings are brutally
              honest, passive-aggressive, and somehow still eerily accurate.
            </Text>

            <Text style={sectionTitle}>🎴 What You Can Do:</Text>

            <Section style={featureList}>
              <Text style={featureItem}>
                <strong>Get Your First Reading:</strong> Choose from multiple
                spreads and let the cards tell you what you probably already
                know (but don't want to admit)
              </Text>
              <Text style={featureItem}>
                <strong>AI-Powered Interpretations:</strong> Our AI doesn't pull
                punches. Expect straight talk with a side of sass
              </Text>
              <Text style={featureItem}>
                <strong>Track Your Journey:</strong> Save your readings and
                watch the patterns emerge. Or ignore them. Your call
              </Text>
            </Section>

            {/* CTA Button */}
            <Section style={buttonContainer}>
              <Button href={`${appUrl}/reading`} style={button}>
                Get Started
              </Button>
            </Section>

            <Hr style={divider} />

            {/* Quick Tips */}
            <Text style={sectionTitle}>💡 Pro Tips:</Text>

            <Section style={tipsList}>
              <Text style={tipItem}>
                • Be specific with your questions. Vague questions get vague
                answers
              </Text>
              <Text style={tipItem}>
                • Don't take it personally. The cards are honest, not mean
                (usually)
              </Text>
              <Text style={tipItem}>
                • Rate your readings. It helps us get better at being brutally
                honest
              </Text>
            </Section>

            <Hr style={divider} />

            <Text style={paragraph}>
              Ready to face the truth? We thought so.
            </Text>

            <Text style={footer}>
              The cards are waiting,
              <br />
              <strong>Petty Prophecies Team</strong>
            </Text>

            <Text style={footerLinks}>
              <Link href={`${appUrl}`} style={linkStyle}>
                Visit Website
              </Link>
              {" | "}
              <Link href={`${appUrl}/about`} style={linkStyle}>
                About Us
              </Link>
              {" | "}
              <Link href={`${appUrl}/help`} style={linkStyle}>
                Get Help
              </Link>
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
  fontSize: "32px",
  fontWeight: "bold",
  color: "#ffffff",
}

const subtitle = {
  margin: "8px 0 0 0",
  fontSize: "14px",
  color: "#e9d5ff",
  fontStyle: "italic",
}

const content = {
  padding: "0 48px",
}

const greeting = {
  fontSize: "24px",
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

const sectionTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#1f2937",
  margin: "24px 0 12px 0",
}

const featureList = {
  margin: "16px 0",
}

const featureItem = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "12px 0",
  paddingLeft: "16px",
}

const tipsList = {
  margin: "16px 0",
}

const tipItem = {
  fontSize: "15px",
  lineHeight: "1.6",
  color: "#4b5563",
  margin: "8px 0",
  paddingLeft: "8px",
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
  padding: "14px 40px",
}

const divider = {
  borderColor: "#e5e7eb",
  margin: "32px 0",
}

const footer = {
  fontSize: "14px",
  lineHeight: "1.6",
  color: "#6b7280",
  marginTop: "32px",
  marginBottom: "16px",
}

const footerLinks = {
  fontSize: "13px",
  textAlign: "center" as const,
  color: "#9ca3af",
  margin: "16px 0",
}

const linkStyle = {
  color: "#7c3aed",
  textDecoration: "none",
}
