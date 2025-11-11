/**
 * Tests for ResetPassword component
 * Following TDD: These tests are written BEFORE implementation
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ResetPassword } from "../../src/components/ResetPassword"
import { jest } from "@jest/globals"
import { useRouter } from "next/router"

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}))

// Mock the API request hook
const mockRequest = jest.fn()
jest.mock("../../src/hooks/useApiRequest", () => ({
  useApiRequest: () => ({
    request: mockRequest,
    loading: false,
    error: null,
  }),
}))

// Mock the toast notification
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe("ResetPassword Component", () => {
  const mockPush = jest.fn()
  const mockRouter = {
    query: { token: "test-reset-token" },
    push: mockPush,
    pathname: "/reset-password",
    route: "/reset-password",
    asPath: "/reset-password?token=test-reset-token",
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe("Rendering", () => {
    it("should render the form with all elements", () => {
      render(<ResetPassword />)

      expect(screen.getByRole("heading", { name: /reset password/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /reset password/i })).toBeInTheDocument()
    })

    it("should extract token from URL query params", () => {
      render(<ResetPassword />)

      // Token should be extracted and stored internally
      // We can't directly test state, but we can verify it's used in submission
      expect(useRouter).toHaveBeenCalled()
    })

    it("should show error when no token in URL", () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        ...mockRouter,
        query: {},
      })

      render(<ResetPassword />)

      expect(screen.getByText(/no reset token found/i)).toBeInTheDocument()
    })

    it("should have password inputs with correct attributes", () => {
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(newPasswordInput).toHaveAttribute("type", "password")
      expect(confirmPasswordInput).toHaveAttribute("type", "password")
      expect(newPasswordInput).toBeRequired()
      expect(confirmPasswordInput).toBeRequired()
    })
  })

  describe("Password strength indicator", () => {
    it("should show password strength meter", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      await user.type(newPasswordInput, "weak")

      // Should display some indication of password strength
      expect(screen.getByText(/password strength/i)).toBeInTheDocument()
    })

    it("should show weak strength for short password", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      await user.type(newPasswordInput, "weak")

      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument()
      })
    })

    it("should show strong strength for valid password", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      await user.type(newPasswordInput, "StrongPass123")

      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument()
      })
    })
  })

  describe("Form validation", () => {
    it("should validate password strength", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "weak")
      await user.type(confirmPasswordInput, "weak")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })
    })

    it("should validate password confirmation match", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "StrongPass123")
      await user.type(confirmPasswordInput, "DifferentPass456")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it("should require uppercase letter", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "lowercase123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/uppercase/i)).toBeInTheDocument()
      })
    })

    it("should require lowercase letter", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "UPPERCASE123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/lowercase/i)).toBeInTheDocument()
      })
    })

    it("should require number", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "NoNumbersHere")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/number/i)).toBeInTheDocument()
      })
    })
  })

  describe("Form submission", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup()
      mockRequest.mockResolvedValue({
        message: "Password reset successful",
      })

      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "NewSecurePass123")
      await user.type(confirmPasswordInput, "NewSecurePass123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith({
          url: "/api/auth/reset-password",
          method: "POST",
          body: {
            token: "test-reset-token",
            password: "NewSecurePass123",
          },
          onSuccess: expect.any(Function),
        })
      })
    })

    it("should redirect to login page after successful reset", async () => {
      const user = userEvent.setup()
      mockRequest.mockResolvedValue({
        message: "Password reset successful",
      })

      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "NewSecurePass123")
      await user.type(confirmPasswordInput, "NewSecurePass123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login")
      })
    })

    it("should disable submit button when loading", () => {
      jest.isolateModules(() => {
        jest.mock("../../src/hooks/useApiRequest", () => ({
          useApiRequest: () => ({
            request: jest.fn(),
            loading: true,
            error: null,
          }),
        }))
      })

      render(<ResetPassword />)

      const submitButton = screen.getByRole("button", { name: /reset password/i })
      expect(submitButton).toBeDisabled()
    })
  })

  describe("Error handling", () => {
    it("should display error for expired token", async () => {
      const user = userEvent.setup()
      mockRequest.mockRejectedValue({
        error: {
          message: "Reset token has expired",
        },
      })

      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "NewSecurePass123")
      await user.type(confirmPasswordInput, "NewSecurePass123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/expired/i)).toBeInTheDocument()
      })
    })

    it("should display error for invalid token", async () => {
      const user = userEvent.setup()
      mockRequest.mockRejectedValue({
        error: {
          message: "Invalid reset token",
        },
      })

      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "NewSecurePass123")
      await user.type(confirmPasswordInput, "NewSecurePass123")
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid/i)).toBeInTheDocument()
      })
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      expect(newPasswordInput).toHaveAttribute("aria-invalid", "false")
      expect(confirmPasswordInput).toHaveAttribute("aria-invalid", "false")
    })

    it("should set aria-invalid when validation fails", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "weak")
      await user.click(submitButton)

      await waitFor(() => {
        expect(newPasswordInput).toHaveAttribute("aria-invalid", "true")
      })
    })

    it("should associate error messages with inputs via aria-describedby", async () => {
      const user = userEvent.setup()
      render(<ResetPassword />)

      const newPasswordInput = screen.getByLabelText(/^new password$/i)
      const submitButton = screen.getByRole("button", { name: /reset password/i })

      await user.type(newPasswordInput, "weak")
      await user.click(submitButton)

      await waitFor(() => {
        const errorId = newPasswordInput.getAttribute("aria-describedby")
        expect(errorId).toBeTruthy()
        if (errorId) {
          expect(document.getElementById(errorId)).toBeInTheDocument()
        }
      })
    })
  })
})
