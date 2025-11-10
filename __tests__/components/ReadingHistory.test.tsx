import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import { ReadingHistory } from "../../src/components/ReadingHistory"
import { useApiRequest } from "../../src/hooks/useApiRequest"
import { jest } from "@jest/globals"

jest.mock("../../src/hooks/useApiRequest")

const mockUseApiRequest = useApiRequest as jest.MockedFunction<typeof useApiRequest>

describe("ReadingHistory Component", () => {
  const mockReadings = [
    {
      _id: "reading1",
      spreadName: "Three Card Spread",
      cards: ["The Fool", "The Magician", "The High Priestess"],
      interpretation: "First interpretation",
      rating: 5,
      createdAt: new Date("2024-01-15"),
      aiGenerated: true,
      userQuestion: "What should I do?",
    },
    {
      _id: "reading2",
      spreadName: "Celtic Cross",
      cards: ["The Empress", "The Emperor"],
      interpretation: "Second interpretation",
      rating: 4,
      createdAt: new Date("2024-01-10"),
      aiGenerated: false,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should render loading state initially", () => {
    const mockRequest = jest.fn()
    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: true,
      error: null,
    })

    render(<ReadingHistory />)

    expect(screen.getByText(/loading|Loading/i)).toBeInTheDocument()
  })

  test("should render list of readings after loading", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: mockReadings,
      page: 0,
      totalPages: 1,
      total: 2,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      expect(screen.getByText("Three Card Spread")).toBeInTheDocument()
      expect(screen.getByText("Celtic Cross")).toBeInTheDocument()
    })
  })

  test("should render empty state when no readings exist", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: [],
      page: 0,
      totalPages: 0,
      total: 0,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      expect(screen.getByText(/No readings yet|no readings/i)).toBeInTheDocument()
    })
  })

  test("should display reading metadata (date, spread name, rating)", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: mockReadings,
      page: 0,
      totalPages: 1,
      total: 2,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      // Check for spread names
      expect(screen.getByText("Three Card Spread")).toBeInTheDocument()
      expect(screen.getByText("Celtic Cross")).toBeInTheDocument()

      // Check for ratings
      expect(screen.getByText(/5|★/i)).toBeInTheDocument()
      expect(screen.getByText(/4|★/i)).toBeInTheDocument()
    })
  })

  test("should display AI badge when aiGenerated is true", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: mockReadings,
      page: 0,
      totalPages: 1,
      total: 2,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      // Only one reading has aiGenerated: true, so we should see one AI badge
      const aiBadges = screen.getAllByText(/AI|generated/i)
      expect(aiBadges.length).toBeGreaterThanOrEqual(1)
    })
  })

  test("should show pagination controls when there are more than 10 readings", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: mockReadings,
      page: 0,
      totalPages: 3,
      total: 25,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      // Check for pagination controls (could be "Next", "Previous", page numbers, etc.)
      const paginationElement = screen.getByText(/next|previous|page/i)
      expect(paginationElement).toBeInTheDocument()
    })
  })

  test("should not show pagination when there are 10 or fewer readings", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: mockReadings,
      page: 0,
      totalPages: 1,
      total: 2,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      expect(screen.queryByText(/next/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/previous/i)).not.toBeInTheDocument()
    })
  })

  test("should handle error state", async () => {
    const mockRequest = jest.fn()
    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: { message: "Failed to fetch readings", status: 500 } as any,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument()
    })
  })

  test("should expand reading to show details when clicked", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: mockReadings,
      page: 0,
      totalPages: 1,
      total: 2,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      const viewButton = screen.getAllByRole("button", { name: /view details|view|details/i })[0]
      fireEvent.click(viewButton)

      // After clicking, the full interpretation should be visible
      expect(screen.getByText("First interpretation")).toBeInTheDocument()
    })
  })

  test("should fetch readings on component mount", async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      readings: [],
      page: 0,
      totalPages: 0,
      total: 0,
    })

    mockUseApiRequest.mockReturnValue({
      request: mockRequest,
      loading: false,
      error: null,
    })

    render(<ReadingHistory />)

    await waitFor(() => {
      expect(mockRequest).toHaveBeenCalled()
    })
  })
})
