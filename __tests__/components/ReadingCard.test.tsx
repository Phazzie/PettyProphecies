import { render, screen, fireEvent } from "@testing-library/react"
import { ReadingCard } from "../../src/components/ReadingCard"
import { jest } from "@jest/globals"

describe("ReadingCard Component", () => {
  const mockReading = {
    _id: "reading123",
    spreadName: "Three Card Spread",
    cards: ["The Fool", "The Magician", "The High Priestess"],
    interpretation: "This is a very long interpretation that should be truncated when displayed in the card view to keep the UI clean and readable for users.",
    rating: 4,
    createdAt: new Date("2024-01-15T10:30:00Z"),
    aiGenerated: true,
    userQuestion: "What should I do next?",
  }

  const mockOnClick = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should display spread name", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)
    expect(screen.getByText("Three Card Spread")).toBeInTheDocument()
  })

  test("should display formatted date", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)
    // The date should be formatted (e.g., "January 15, 2024" or relative time like "2 months ago")
    // We check for the presence of date-related text
    const dateElement = screen.getByText(/Jan|2024|ago|days?|months?|years?/i)
    expect(dateElement).toBeInTheDocument()
  })

  test("should display rating stars when rated", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)
    // Check for rating display - should have 4 filled stars and 1 empty star
    const stars = screen.getAllByText("★")
    expect(stars).toHaveLength(5)
    // Also check for the rating number
    expect(screen.getByText("(4/5)")).toBeInTheDocument()
  })

  test("should display card count", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)
    expect(screen.getByText(/3 cards?/i)).toBeInTheDocument()
  })

  test("should display truncated interpretation", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)

    // The interpretation should be visible but potentially truncated
    const interpretationElement = screen.getByText(/This is a very long interpretation/i)
    expect(interpretationElement).toBeInTheDocument()
  })

  test("should call onClick when View Details button is clicked", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)

    const button = screen.getByRole("button", { name: /view details|view|details|expand/i })
    fireEvent.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  test("should display AI badge when aiGenerated is true", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)
    expect(screen.getByTestId("ai-badge")).toBeInTheDocument()
    expect(screen.getByText("AI Generated")).toBeInTheDocument()
  })

  test("should not display AI badge when aiGenerated is false", () => {
    const nonAiReading = {
      ...mockReading,
      aiGenerated: false,
    }

    render(<ReadingCard reading={nonAiReading} onClick={mockOnClick} />)
    expect(screen.queryByTestId("ai-badge")).not.toBeInTheDocument()
  })

  test("should handle reading without rating", () => {
    const unratedReading = {
      ...mockReading,
      rating: undefined,
    }

    render(<ReadingCard reading={unratedReading} onClick={mockOnClick} />)
    // Should still render without errors
    expect(screen.getByText("Three Card Spread")).toBeInTheDocument()
  })

  test("should display user question if provided", () => {
    render(<ReadingCard reading={mockReading} onClick={mockOnClick} />)
    expect(screen.getByText(/What should I do next?/i)).toBeInTheDocument()
  })
})
