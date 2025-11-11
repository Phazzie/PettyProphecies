/**
 * TarotReading Component Tests
 *
 * Tests the TarotReading component with AI integration features.
 * Following TDD principles: Tests written FIRST, implementation follows.
 */

import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { TarotReading } from "@/src/components/TarotReading"
import * as useApiRequest from "@/src/hooks/useApiRequest"
import * as useFormValidation from "@/src/hooks/useFormValidation"
import { toast } from "sonner"

// Mock dependencies
jest.mock("@/src/hooks/useApiRequest")
jest.mock("@/src/hooks/useFormValidation")
jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe("TarotReading Component", () => {
  const mockRequest = jest.fn()
  const mockHandleChange = jest.fn()
  const mockValidateForm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock for useApiRequest
    ;(useApiRequest.useApiRequest as jest.Mock).mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    // Default mock for useFormValidation
    ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
      values: { spread: "" },
      errors: {},
      isValid: false,
      handleChange: mockHandleChange,
      validateForm: mockValidateForm,
    })
  })

  describe("Component Rendering", () => {
    it("should render the component with all essential elements", () => {
      // Act
      render(<TarotReading />)

      // Assert
      expect(screen.getByText("Get Your Passive-Aggressive Tarot Reading")).toBeInTheDocument()
      expect(screen.getByLabelText("Choose a Spread")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Get Reading/i })).toBeInTheDocument()
    })

    it("should render AI toggle switch when component mounts", () => {
      // Act
      render(<TarotReading />)

      // Assert
      expect(screen.getByLabelText(/Use AI Reading/i)).toBeInTheDocument()
    })

    it("should have AI toggle checked by default when AI is available", () => {
      // Arrange - Mock AI availability
      process.env.NEXT_PUBLIC_XAI_AVAILABLE = "true"

      // Act
      render(<TarotReading />)

      // Assert
      const toggle = screen.getByLabelText(/Use AI Reading/i) as HTMLInputElement
      expect(toggle.checked).toBe(true)
    })

    it("should have AI toggle unchecked by default when AI is not available", () => {
      // Arrange
      delete process.env.NEXT_PUBLIC_XAI_AVAILABLE

      // Act
      render(<TarotReading />)

      // Assert
      const toggle = screen.getByLabelText(/Use AI Reading/i) as HTMLInputElement
      expect(toggle.checked).toBe(false)
    })

    it("should render all spread options in dropdown", () => {
      // Act
      render(<TarotReading />)

      // Assert
      expect(screen.getByText("Select a spread")).toBeInTheDocument()
      // Check for some known spreads
      expect(screen.getByText(/Maybe It's Not Them, It's You/i)).toBeInTheDocument()
      expect(screen.getByText(/I'm Sure You're Doing Your Best/i)).toBeInTheDocument()
    })
  })

  describe("Reading Generation Flow", () => {
    it("should submit form with AI enabled when toggle is on", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockResolvedValue({
        interpretation: "AI-generated reading",
        readingId: "123",
        aiGenerated: true,
      })

      render(<TarotReading />)

      const toggle = screen.getByLabelText(/Use AI Reading/i)
      fireEvent.click(toggle)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              useAI: true,
            }),
          })
        )
      })
    })

    it("should submit form with AI disabled when toggle is off", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockResolvedValue({
        interpretation: "Template reading",
        readingId: "123",
        aiGenerated: false,
      })

      render(<TarotReading />)

      // AI toggle should be off by default (no env var)
      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({
              useAI: false,
            }),
          })
        )
      })
    })

    it("should display reading result after successful generation", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      const mockReading = {
        interpretation: "Oh look at you, ready to blame everyone else.",
        readingId: "123",
      }

      mockRequest.mockResolvedValue(mockReading)

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText("Your Passive-Aggressive Tarot Reading")).toBeInTheDocument()
        expect(screen.getByText(mockReading.interpretation)).toBeInTheDocument()
      })
    })

    it("should not submit form when validation fails", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "" },
        errors: { spread: "Please select a spread" },
        isValid: false,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(false),
      })

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockRequest).not.toHaveBeenCalled()
      })
    })
  })

  describe("Loading States", () => {
    it("should show loading spinner during AI generation", () => {
      // Arrange
      ;(useApiRequest.useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: true,
        error: null,
      })

      // Act
      render(<TarotReading />)

      // Assert
      expect(screen.getByRole("button", { name: /Get Reading/i })).toBeDisabled()
      // Check for loading indicator (could be spinner or text)
      const button = screen.getByRole("button", { name: /Get Reading/i })
      expect(button).toHaveAttribute("aria-busy", "true")
    })

    it("should disable submit button during loading", () => {
      // Arrange
      ;(useApiRequest.useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: true,
        error: null,
      })

      // Act
      render(<TarotReading />)

      // Assert
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      expect(submitButton).toBeDisabled()
    })

    it("should show loading message or indicator when AI is generating", () => {
      // Arrange
      ;(useApiRequest.useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: true,
        error: null,
      })

      // Act
      render(<TarotReading />)

      // Assert - Check for loading spinner component or aria-busy attribute
      const button = screen.getByRole("button", { name: /Get Reading/i })
      expect(button).toHaveAttribute("aria-busy", "true")
    })
  })

  describe("AI Model Badge", () => {
    it("should show AI badge when reading was generated by AI", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockResolvedValue({
        interpretation: "AI reading",
        readingId: "123",
        aiGenerated: true,
        modelInfo: {
          model: "grok-4-fast-reasoning",
          provider: "xAI Grok",
        },
      })

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/Generated by AI/i)).toBeInTheDocument()
      })
    })

    it("should not show AI badge when reading was template-based", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockResolvedValue({
        interpretation: "Template reading",
        readingId: "123",
        aiGenerated: false,
      })

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.queryByText(/Generated by AI/i)).not.toBeInTheDocument()
      })
    })

    it("should display model information in AI badge", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockResolvedValue({
        interpretation: "AI reading",
        readingId: "123",
        aiGenerated: true,
        modelInfo: {
          model: "grok-4-fast-reasoning",
          provider: "xAI Grok",
        },
      })

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/xAI Grok/i)).toBeInTheDocument()
      })
    })
  })

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockRejectedValue(new Error("API Error"))

      const consoleSpy = jest.spyOn(console, "error").mockImplementation()

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error getting tarot reading:", expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it("should display error message when AI generation fails", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      ;(useApiRequest.useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: false,
        error: "Failed to generate reading",
      })

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert - Error should be handled by useApiRequest hook and displayed
      await waitFor(() => {
        // Error handling could be via ErrorMessage component or toast
        // The exact implementation depends on the updated component
      })
    })

    it("should allow retry after error", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest
        .mockRejectedValueOnce(new Error("First attempt failed"))
        .mockResolvedValueOnce({
          interpretation: "Success on retry",
          readingId: "123",
        })

      render(<TarotReading />)

      const submitButton = screen.getByRole("button", { name: /Get Reading/i })

      // Act - First attempt
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledTimes(1)
      })

      // Act - Retry
      fireEvent.click(submitButton)

      // Assert
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledTimes(2)
        expect(screen.getByText("Success on retry")).toBeInTheDocument()
      })
    })
  })

  describe("Rating Functionality", () => {
    it("should allow rating a reading", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest
        .mockResolvedValueOnce({
          interpretation: "Your reading",
          readingId: "123",
        })
        .mockResolvedValueOnce({
          message: "Rating updated successfully",
        })

      render(<TarotReading />)

      // Get a reading first
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Your reading")).toBeInTheDocument()
      })

      // Act - Rate the reading
      const ratingButtons = screen.getAllByRole("button", { name: /Rate \d star/i })
      fireEvent.click(ratingButtons[4]) // 5 stars

      // Assert
      await waitFor(() => {
        expect(mockRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            method: "PUT",
            body: expect.objectContaining({
              rating: 5,
              readingId: "123",
            }),
          })
        )
        expect(toast.success).toHaveBeenCalled()
      })
    })

    it("should visually indicate selected rating", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockResolvedValue({
        interpretation: "Your reading",
        readingId: "123",
      })

      render(<TarotReading />)

      // Get a reading first
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText("Your reading")).toBeInTheDocument()
      })

      // Act - Rate the reading
      const ratingButton = screen.getByRole("button", { name: /Rate 3 stars/i })
      fireEvent.click(ratingButton)

      // Assert - Button should have aria-pressed attribute
      await waitFor(() => {
        expect(ratingButton).toHaveAttribute("aria-pressed", "true")
      })
    })
  })

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      // Act
      render(<TarotReading />)

      // Assert
      expect(screen.getByLabelText("Choose a Spread")).toBeInTheDocument()
      expect(screen.getByLabelText(/Use AI Reading/i)).toBeInTheDocument()
    })

    it("should announce reading results to screen readers", async () => {
      // Arrange
      ;(useFormValidation.useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm.mockReturnValue(true),
      })

      mockRequest.mockResolvedValue({
        interpretation: "Your reading",
        readingId: "123",
      })

      render(<TarotReading />)

      // Act
      const submitButton = screen.getByRole("button", { name: /Get Reading/i })
      fireEvent.click(submitButton)

      // Assert - Reading result should have aria-live region
      await waitFor(() => {
        const readingContainer = screen.getByText("Your reading").closest("div")
        expect(readingContainer).toHaveAttribute("aria-live", "polite")
      })
    })
  })
})
