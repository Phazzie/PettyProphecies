import { render, screen } from "@testing-library/react"
import { jest } from "@jest/globals"
import { TarotReading } from "../../src/components/TarotReading"

// Mock dependencies
jest.mock("../../src/hooks/useApiRequest", () => ({
  useApiRequest: jest.fn(),
}))

jest.mock("../../src/hooks/useFormValidation", () => ({
  useFormValidation: jest.fn(),
}))

jest.mock("sonner", () => ({
  toast: {
    info: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Import mocked modules
import { useApiRequest } from "../../src/hooks/useApiRequest"
import { useFormValidation } from "../../src/hooks/useFormValidation"

describe("TarotReading Component", () => {
  const mockRequest = jest.fn()
  const mockHandleChange = jest.fn()
  const mockValidateForm = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useApiRequest as jest.Mock).mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })
    ;(useFormValidation as jest.Mock).mockReturnValue({
      values: { spread: "" },
      errors: {},
      isValid: false,
      handleChange: mockHandleChange,
      validateForm: mockValidateForm,
    })
  })

  describe("Initial Render", () => {
    it("should render the component with spread selection dropdown", () => {
      render(<TarotReading />)

      expect(screen.getByText("Get Your Passive-Aggressive Tarot Reading")).toBeInTheDocument()
      expect(screen.getByLabelText("Choose a Spread")).toBeInTheDocument()
    })

    it("should display all 6 spread options in the dropdown", () => {
      render(<TarotReading />)

      const dropdown = screen.getByLabelText("Choose a Spread") as HTMLSelectElement
      // Should have 6 spreads + 1 default option
      expect(dropdown.options.length).toBe(7)
    })

    it("should render the Get Reading button", () => {
      render(<TarotReading />)

      expect(screen.getByRole("button", { name: "Get Reading" })).toBeInTheDocument()
    })

    it("should render QuestionInput component", () => {
      render(<TarotReading />)

      expect(screen.getByLabelText(/question/i)).toBeInTheDocument()
    })
  })

  describe("Loading State", () => {
    it("should disable Get Reading button while loading", () => {
      ;(useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: true,
        error: null,
      })

      render(<TarotReading />)

      const button = screen.getByRole("button", { name: "Get Reading" })
      expect(button).toBeDisabled()
    })

    it("should show loading indicator on button", () => {
      ;(useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: true,
        error: null,
      })

      render(<TarotReading />)

      expect(screen.getByRole("button", { name: "Get Reading" })).toHaveAttribute("aria-busy", "true")
    })

    it("should display loading message when spread is selected", () => {
      ;(useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: true,
        error: null,
      })
      ;(useFormValidation as jest.Mock).mockReturnValue({
        values: { spread: "Maybe It's Not Them, It's You" },
        errors: {},
        isValid: true,
        handleChange: mockHandleChange,
        validateForm: mockValidateForm,
      })

      render(<TarotReading />)

      expect(screen.getByText(/drawing cards/i)).toBeInTheDocument()
    })
  })

  describe("Error Handling", () => {
    it("should display user-friendly error message", () => {
      ;(useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: false,
        error: new Error("Failed to fetch reading"),
      })

      render(<TarotReading />)

      expect(screen.getByText(/cards are being difficult/i)).toBeInTheDocument()
    })

    it("should show retry button on error", () => {
      ;(useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: false,
        error: new Error("Test error"),
      })

      render(<TarotReading />)

      expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument()
    })

    it("should have proper error role for accessibility", () => {
      ;(useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: false,
        error: new Error("Test error"),
      })

      render(<TarotReading />)

      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    it("should not display stack traces", () => {
      const errorWithStack = new Error("Test error")
      errorWithStack.stack = "Error: Test error\n    at test.js:1:1"

      ;(useApiRequest as jest.Mock).mockReturnValue({
        request: mockRequest,
        loading: false,
        error: errorWithStack,
      })

      const { container } = render(<TarotReading />)

      expect(container.textContent).not.toContain("at test.js")
    })
  })

  describe("Component Integration", () => {
    it("should integrate all components together", () => {
      render(<TarotReading />)

      // All components should be present
      expect(screen.getByLabelText(/question/i)).toBeInTheDocument()
      expect(screen.getByLabelText("Choose a Spread")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Get Reading" })).toBeInTheDocument()
    })

    it("should display spread options", () => {
      render(<TarotReading />)

      const options = screen.getAllByRole("option")
      expect(options.length).toBeGreaterThan(1)
    })
  })
})
