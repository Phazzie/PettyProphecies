/**
 * Email Template Tests
 *
 * Tests for React Email templates used in the application.
 * Tests rendering, content, and styling of email templates.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { PasswordResetEmail } from "@/src/templates/email/PasswordResetEmail"
import { WelcomeEmail } from "@/src/templates/email/WelcomeEmail"

describe("PasswordResetEmail", () => {
  const defaultProps = {
    username: "TestUser",
    resetUrl: "http://localhost:3000/reset-password?token=abc123",
  }

  it("should render password reset email template", () => {
    render(<PasswordResetEmail {...defaultProps} />)

    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
  })

  it("should display username in greeting", () => {
    render(<PasswordResetEmail {...defaultProps} />)

    expect(screen.getByText(/TestUser/i)).toBeInTheDocument()
  })

  it("should include reset link with correct URL", () => {
    render(<PasswordResetEmail {...defaultProps} />)

    const resetLink = screen.getByRole("link", { name: /reset password/i })
    expect(resetLink).toHaveAttribute(
      "href",
      "http://localhost:3000/reset-password?token=abc123"
    )
  })

  it("should include expiry warning", () => {
    render(<PasswordResetEmail {...defaultProps} />)

    expect(screen.getByText(/1 hour/i)).toBeInTheDocument()
    expect(screen.getByText(/expire/i)).toBeInTheDocument()
  })

  it("should display passive-aggressive tone", () => {
    render(<PasswordResetEmail {...defaultProps} />)

    // Check for passive-aggressive messaging
    const text = screen.getByText(/forgot your password again/i)
    expect(text).toBeInTheDocument()
  })

  it("should include security warning about not requesting reset", () => {
    render(<PasswordResetEmail {...defaultProps} />)

    expect(
      screen.getByText(/if you didn't request/i)
    ).toBeInTheDocument()
  })

  it("should render with different usernames", () => {
    const { rerender } = render(
      <PasswordResetEmail {...defaultProps} username="Alice" />
    )
    expect(screen.getByText(/Alice/i)).toBeInTheDocument()

    rerender(<PasswordResetEmail {...defaultProps} username="Bob123" />)
    expect(screen.getByText(/Bob123/i)).toBeInTheDocument()
  })

  it("should render with different reset URLs", () => {
    const customUrl = "https://example.com/reset?token=xyz789"
    render(<PasswordResetEmail {...defaultProps} resetUrl={customUrl} />)

    const resetLink = screen.getByRole("link", { name: /reset password/i })
    expect(resetLink).toHaveAttribute("href", customUrl)
  })

  it("should have proper email structure with HTML elements", () => {
    const { container } = render(<PasswordResetEmail {...defaultProps} />)

    // Check for proper HTML structure
    expect(container.querySelector("html")).toBeInTheDocument()
    expect(container.querySelector("body")).toBeInTheDocument()
    expect(container.querySelector("a[href]")).toBeInTheDocument()
  })
})

describe("WelcomeEmail", () => {
  const defaultProps = {
    username: "NewUser",
  }

  it("should render welcome email template", () => {
    render(<WelcomeEmail {...defaultProps} />)

    expect(screen.getAllByText(/welcome/i).length).toBeGreaterThan(0)
  })

  it("should display username in greeting", () => {
    render(<WelcomeEmail {...defaultProps} />)

    expect(screen.getByText(/NewUser/i)).toBeInTheDocument()
  })

  it("should include Petty Prophecies branding", () => {
    render(<WelcomeEmail {...defaultProps} />)

    expect(screen.getAllByText(/petty prophecies/i).length).toBeGreaterThan(0)
  })

  it("should display passive-aggressive tone", () => {
    render(<WelcomeEmail {...defaultProps} />)

    // Check for passive-aggressive welcome message
    const text = screen.getByText(/let's see how long you last/i)
    expect(text).toBeInTheDocument()
  })

  it("should include quick start guide or next steps", () => {
    render(<WelcomeEmail {...defaultProps} />)

    expect(
      screen.getByText(/get started/i) ||
        screen.getByText(/first reading/i) ||
        screen.getByText(/next steps/i)
    ).toBeInTheDocument()
  })

  it("should include link to application", () => {
    render(<WelcomeEmail {...defaultProps} />)

    const appLink = screen.getByRole("link", { name: /get started/i })
    expect(appLink).toHaveAttribute("href")
    expect(appLink.getAttribute("href")).toContain("http")
  })

  it("should render with different usernames", () => {
    const { rerender } = render(
      <WelcomeEmail {...defaultProps} username="Alice" />
    )
    expect(screen.getByText(/Alice/i)).toBeInTheDocument()

    rerender(<WelcomeEmail {...defaultProps} username="BobTheBuilder" />)
    expect(screen.getByText(/BobTheBuilder/i)).toBeInTheDocument()
  })

  it("should have proper email structure with HTML elements", () => {
    const { container } = render(<WelcomeEmail {...defaultProps} />)

    // Check for proper HTML structure
    expect(container.querySelector("html")).toBeInTheDocument()
    expect(container.querySelector("body")).toBeInTheDocument()
  })

  it("should include information about tarot readings", () => {
    render(<WelcomeEmail {...defaultProps} />)

    expect(
      screen.getByText(/tarot/i) || screen.getByText(/reading/i)
    ).toBeInTheDocument()
  })

  it("should mention passive-aggressive feature", () => {
    render(<WelcomeEmail {...defaultProps} />)

    const textContent = screen.getAllByText(/brutally honest/i)
    expect(textContent.length).toBeGreaterThan(0)
  })
})

describe("Email Template Links", () => {
  it("should format PasswordResetEmail links correctly", () => {
    const resetUrl = "https://pettyprophecies.com/reset?token=test123"
    render(<PasswordResetEmail username="User" resetUrl={resetUrl} />)

    const link = screen.getByRole("link", { name: /reset password/i })
    expect(link).toHaveAttribute("href", resetUrl)
    // Links should be clickable
    expect(link.tagName).toBe("A")
  })

  it("should format WelcomeEmail links correctly", () => {
    render(<WelcomeEmail username="User" />)

    const link = screen.getByRole("link", { name: /get started/i })
    expect(link).toHaveAttribute("href")
    expect(link.tagName).toBe("A")
    // Should be a valid URL
    const href = link.getAttribute("href")
    expect(href).toMatch(/^https?:\/\//)
  })
})

describe("Email Template Styling", () => {
  it("should have inline styles for PasswordResetEmail", () => {
    const { container } = render(
      <PasswordResetEmail
        username="User"
        resetUrl="http://localhost:3000/reset"
      />
    )

    // Check that button/link has styling
    const link = screen.getByRole("link", { name: /reset password/i })
    expect(link).toHaveAttribute("style")
  })

  it("should have inline styles for WelcomeEmail", () => {
    const { container } = render(<WelcomeEmail username="User" />)

    // Check for styled elements
    const link = screen.getByRole("link", { name: /get started/i })
    expect(link).toHaveAttribute("style")
  })

  it("should use consistent branding colors", () => {
    const { container: resetContainer } = render(
      <PasswordResetEmail
        username="User"
        resetUrl="http://localhost:3000/reset"
      />
    )
    const { container: welcomeContainer } = render(
      <WelcomeEmail username="User" />
    )

    // Both templates should have consistent styling
    const resetLink = resetContainer.querySelector("a[href]")
    const welcomeLink = welcomeContainer.querySelector("a[href]")

    expect(resetLink).toHaveAttribute("style")
    expect(welcomeLink).toHaveAttribute("style")
  })
})
