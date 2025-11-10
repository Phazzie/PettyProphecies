import { describe, test, expect, jest, beforeEach } from "@jest/globals"
import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"

// Mock all dependencies before importing handler
jest.mock("@/src/utils/database", () => ({
  connectToDatabase: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("@/src/middleware/auth", () => ({
  authMiddleware: jest.fn((handler) => (req: any, res: any) => {
    req.userId = "test-user-id"
    return handler(req, res)
  }),
}))

jest.mock("@/src/middleware/errorHandler", () => ({
  errorHandler: jest.fn((handler) => handler),
}))

jest.mock("@/src/middleware/requestLogger", () => ({
  requestLogger: jest.fn((handler) => handler),
}))

jest.mock("@/src/middleware/rateLimit", () => ({
  rateLimitMiddleware: jest.fn((handler) => handler),
}))

jest.mock("@/src/models/Reading", () => {
  const mockSave = jest.fn().mockResolvedValue({
    _id: "mock-reading-id",
    userId: "test-user-id",
    spreadName: "Test Spread",
    cards: [],
    interpretation: "Mock interpretation",
  })

  return {
    Reading: jest.fn().mockImplementation((data) => ({
      ...data,
      save: mockSave,
      _id: "mock-reading-id",
    })),
  }
})

// Mock AI service
const mockGenerateAIReading = jest.fn()
jest.mock("@/src/services/aiTarot", () => ({
  generateAIReading: mockGenerateAIReading,
  isAIAvailable: jest.fn().mockReturnValue(true),
}))

describe("Tarot Reading API Integration Tests", () => {
  let handler: any
  let Reading: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Reset module cache to get fresh imports
    jest.resetModules()

    // Re-require modules after mocks are set up
    handler = require("@/src/pages/api/tarot-reading").default
    Reading = require("@/src/models/Reading").Reading
  })

  test("POST /api/tarot-reading calls AI service with correct parameters", async () => {
    mockGenerateAIReading.mockResolvedValue("AI-generated snarky reading about your life choices")

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
        userQuestion: "Why am I still single?",
      },
    })

    // Set userId (normally done by auth middleware)
    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Verify AI service was called
    expect(mockGenerateAIReading).toHaveBeenCalledTimes(1)
    expect(mockGenerateAIReading).toHaveBeenCalledWith(
      expect.objectContaining({
        cards: expect.any(Array),
        spread: expect.any(Object),
        userQuestion: "Why am I still single?",
        isReversed: expect.any(Array),
      })
    )
  })

  test("POST /api/tarot-reading saves AI response with aiGenerated flag", async () => {
    const aiResponse = "Listen, The Fool in your past position? Not surprising. Let me guess, you made some questionable decisions that led you here?"

    mockGenerateAIReading.mockResolvedValue(aiResponse)

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Verify Reading model was instantiated with correct data
    expect(Reading).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "test-user-id",
        spreadName: "Maybe It's Not Them, It's You",
        interpretation: aiResponse,
        aiGenerated: true,
        cards: expect.any(Array),
      })
    )

    expect(res._getStatusCode()).toBe(200)
  })

  test("POST /api/tarot-reading saves card data including reversal state", async () => {
    mockGenerateAIReading.mockResolvedValue("AI reading with card details")

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Verify cards are saved with full details
    const readingData = Reading.mock.calls[0][0]
    expect(readingData.cards).toBeDefined()
    expect(readingData.cards.length).toBe(5) // "Maybe It's Not Them" spread has 5 positions

    readingData.cards.forEach((card: any) => {
      expect(card).toHaveProperty("name")
      expect(card).toHaveProperty("number")
      expect(card).toHaveProperty("isReversed")
      expect(card).toHaveProperty("position")
      expect(typeof card.isReversed).toBe("boolean")
    })
  })

  test("POST /api/tarot-reading falls back to template on AI failure", async () => {
    // Simulate AI failure
    mockGenerateAIReading.mockRejectedValue(new Error("API timeout"))

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Should still succeed with template interpretation
    expect(res._getStatusCode()).toBe(200)

    // Verify Reading was saved with aiGenerated: false
    expect(Reading).toHaveBeenCalledWith(
      expect.objectContaining({
        aiGenerated: false,
        interpretation: expect.any(String),
      })
    )
  })

  test("POST /api/tarot-reading handles timeout with graceful fallback", async () => {
    // Simulate a slow AI response that times out
    mockGenerateAIReading.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve("Too late!"), 15000) // 15 seconds (exceeds 10s timeout)
        })
    )

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Should complete successfully despite timeout
    expect(res._getStatusCode()).toBe(200)

    // Should have fallen back to template
    const readingData = Reading.mock.calls[0][0]
    expect(readingData.aiGenerated).toBe(false)
  }, 15000)

  test("POST /api/tarot-reading validates AI response is non-empty", async () => {
    // Return empty string from AI
    mockGenerateAIReading.mockResolvedValue("")

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Should fall back to template for empty response
    const readingData = Reading.mock.calls[0][0]
    expect(readingData.aiGenerated).toBe(false)
    expect(readingData.interpretation.length).toBeGreaterThan(0)
  })

  test("POST /api/tarot-reading validates AI response meets minimum length", async () => {
    // Return very short response (less than 100 chars)
    mockGenerateAIReading.mockResolvedValue("Too short")

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Should fall back to template for insufficient response
    const readingData = Reading.mock.calls[0][0]
    expect(readingData.aiGenerated).toBe(false)
  })

  test("POST /api/tarot-reading includes userQuestion when provided", async () => {
    mockGenerateAIReading.mockResolvedValue("Reading addressing your question")

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "Maybe It's Not Them, It's You",
        userQuestion: "Will I get promoted?",
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    // Verify userQuestion was passed to AI service
    expect(mockGenerateAIReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userQuestion: "Will I get promoted?",
      })
    )

    // Verify userQuestion was saved to database
    expect(Reading).toHaveBeenCalledWith(
      expect.objectContaining({
        userQuestion: "Will I get promoted?",
      })
    )
  })

  test("POST /api/tarot-reading returns error for invalid spread name", async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "POST",
      body: {
        spreadName: "NonExistentSpread",
      },
    })

    ;(req as any).userId = "test-user-id"

    // The error handler middleware will catch the ValidationError
    // In real scenarios, the errorHandler middleware would set the appropriate status
    // For this test, we expect the handler to throw
    await expect(handler(req, res)).rejects.toThrow("Invalid spread name")
  })

  test("PUT /api/tarot-reading still works for rating updates", async () => {
    const mockFindOneAndUpdate = jest.fn().mockResolvedValue({
      _id: "reading-id",
      rating: 5,
    })

    // Mock the Reading model's static method
    Reading.findOneAndUpdate = mockFindOneAndUpdate

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "PUT",
      body: {
        readingId: "reading-id",
        rating: 5,
      },
    })

    ;(req as any).userId = "test-user-id"

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: "reading-id", userId: "test-user-id" },
      { rating: 5 },
      { new: true }
    )
  })
})
