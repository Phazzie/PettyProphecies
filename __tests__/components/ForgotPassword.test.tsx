/**
 * Tests for ForgotPassword component
 * Following TDD: These tests are written BEFORE implementation
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// Mock the API request hook - must be before component import
const mockRequest = jest.fn()
const mockApiRequestReturn = {
  request: mockRequest,
  loading: false,
  error: null,
}
jest.mock("../../src/hooks/useApiRequest", () => ({
  useApiRequest: () => mockApiRequestReturn,
}))

// Mock the toast notification
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

import { ForgotPassword } from "../../src/components/ForgotPassword"

describe("ForgotPassword Component", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock state
    mockApiRequestReturn.loading = false
    mockApiRequestReturn.error = null
  })

  describe("Rendering", () => {
    it("should render the form with all elements", () => {
      render(<ForgotPassword />)

      expect(screen.getByRole("heading", { name: /forgot password/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument()
    })

    it("should have email input with correct attributes", () => {
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute("type", "email")
      expect(emailInput).toHaveAttribute("name", "email")
      expect(emailInput).toBeRequired()
    })

    it("should render form with proper accessibility", () => {
      render(<ForgotPassword />)

      const form = screen.getByRole("form")
      expect(form).toHaveAttribute("aria-labelledby")
    })
  })

  describe("Form submission", () => {
    it("should submit form with valid email", async () => {
      const user = userEvent.setup()
      mockRequest.mockResolvedValue({
        message: "If that email exists, we've sent reset instructions.",
      })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole("button", { name: /send reset link/i })

      await user.type(emailInput, "test@example.com")
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith({
          url: "/api/auth/forgot-password",
          method: "POST",
          body: { email: "test@example.com" },
          onSuccess: expect.any(Function),
        })
      })
    })

    it("should disable submit button when loading", () => {
      mockApiRequestReturn.loading = true

      render(<ForgotPassword />)

      // When loading, button text changes to spinner, so query without name
      const submitButton = screen.getByRole("button")
      expect(submitButton).toBeDisabled()
    })

    it("should show loading spinner when submitting", async () => {
      mockApiRequestReturn.loading = true

      render(<ForgotPassword />)

      // Should render LoadingSpinner component when loading
      expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true")
    })
  })

  describe("Validation", () => {
    it("should show validation error for invalid email format", async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole("button", { name: /send reset link/i })

      await user.type(emailInput, "not-an-email")
      await user.click(submitButton)

      await waitFor(() => {
        // Error appears in both ErrorAnnouncer and ErrorMessage, use getAllByText
        const errors = screen.getAllByText(/invalid email/i)
        expect(errors.length).toBeGreaterThan(0)
      })
    })

    it("should show validation error for empty email", async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const submitButton = screen.getByRole("button", { name: /send reset link/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Error appears in both ErrorAnnouncer and ErrorMessage, use getAllByText
        const errors = screen.getAllByText(/email is required/i)
        expect(errors.length).toBeGreaterThan(0)
      })
    })

    it("should clear validation errors when user starts typing", async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole("button", { name: /send reset link/i })

      // Trigger validation error
      await user.click(submitButton)
      await waitFor(() => {
        const errors = screen.getAllByText(/email is required/i)
        expect(errors.length).toBeGreaterThan(0)
      })

      // Start typing - error should clear
      await user.type(emailInput, "test@example.com")
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
      })
    })
  })

  describe("Success message", () => {
    it("should display success message after successful submission", async () => {
      const user = userEvent.setup()
      const responseData = {
        message: "If that email exists, we've sent reset instructions.",
      }
      mockRequest.mockImplementation(async (options: any) => {
        if (options.onSuccess) {
          options.onSuccess(responseData)
        }
        return responseData
      })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      const submitButton = screen.getByRole("button", { name: /send reset link/i })

      await user.type(emailInput, "test@example.com")
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(
            /If that email exists, we've sent reset instructions. Check your spam folder if you don't see it. We know you will./i
          )
        ).toBeInTheDocument()
      })
    })

    it("should show success message with proper role for screen readers", async () => {
      const user = userEvent.setup()
      const responseData = {
        message: "If that email exists, we've sent reset instructions.",
      }
      mockRequest.mockImplementation(async (options: any) => {
        if (options.onSuccess) {
          options.onSuccess(responseData)
        }
        return responseData
      })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, "test@example.com")
      await user.click(screen.getByRole("button", { name: /send reset link/i }))

      await waitFor(() => {
        // Multiple elements have role="status" (ErrorAnnouncer + success message)
        const statusElements = screen.getAllByRole("status")
        // Find the visible one with the success message
        const successMessage = statusElements.find(el =>
          el.textContent?.includes("If that email exists")
        )
        expect(successMessage).toBeDefined()
        expect(successMessage).toHaveAttribute("aria-live", "polite")
      })
    })

    it("should clear form after successful submission", async () => {
      const user = userEvent.setup()
      const responseData = {
        message: "If that email exists, we've sent reset instructions.",
      }
      mockRequest.mockImplementation(async (options: any) => {
        if (options.onSuccess) {
          options.onSuccess(responseData)
        }
        return responseData
      })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      await user.type(emailInput, "test@example.com")
      await user.click(screen.getByRole("button", { name: /send reset link/i }))

      await waitFor(() => {
        expect(emailInput.value).toBe("")
      })
    })
  })

  describe("Error handling", () => {
    it("should display error message on API failure", async () => {
      const user = userEvent.setup()
      mockRequest.mockRejectedValue({
        error: {
          message: "An error occurred",
        },
      })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, "test@example.com")
      await user.click(screen.getByRole("button", { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText(/an error occurred/i)).toBeInTheDocument()
      })
    })

    it("should handle rate limiting error", async () => {
      const user = userEvent.setup()
      mockRequest.mockRejectedValue({
        error: {
          message: "Too many requests",
          code: "RATE_LIMIT_EXCEEDED",
        },
      })

      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, "test@example.com")
      await user.click(screen.getByRole("button", { name: /send reset link/i }))

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument()
      })
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      render(<ForgotPassword />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute("aria-invalid", "false")
    })

    it("should set aria-invalid when validation fails", async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const submitButton = screen.getByRole("button", { name: /send reset link/i })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i)
        expect(emailInput).toHaveAttribute("aria-invalid", "true")
      })
    })

    it("should associate error messages with input via aria-describedby", async () => {
      const user = userEvent.setup()
      render(<ForgotPassword />)

      const submitButton = screen.getByRole("button", { name: /send reset link/i })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i)
        const errorId = emailInput.getAttribute("aria-describedby")
        expect(errorId).toBeTruthy()
        if (errorId) {
          expect(document.getElementById(errorId)).toBeInTheDocument()
        }
      })
    })
  })
})
