// Set environment variables FIRST, before any imports
process.env.JWT_SECRET = "test-jwt-secret-for-testing"
process.env.MONGODB_URI = "mongodb://localhost:27017/test"

import { describe, test, expect, beforeEach, jest } from "@jest/globals"
import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"

// Mock all dependencies before imports
jest.mock("../../src/utils/database")

// Mock jsonwebtoken to always return a valid token
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-token"),
  verify: jest.fn(() => ({ userId: "testUser123" })),
  decode: jest.fn(() => ({ userId: "testUser123" })),
}))
jest.mock("../../src/middleware/rateLimit", () => ({
  rateLimitMiddleware: jest.fn((handler) => handler),
}))
jest.mock("../../src/middleware/auth", () => ({
  authMiddleware: jest.fn((handler) => async (req: NextApiRequest, res: NextApiResponse) => {
    req.userId = "testUser123"
    return handler(req, res)
  }),
}))
jest.mock("../../src/middleware/errorHandler", () => ({
  errorHandler: jest.fn((handler) => handler),
}))
jest.mock("../../src/middleware/requestLogger", () => ({
  requestLogger: jest.fn((handler) => handler),
}))

// Track saved readings for verification
let savedReadings: any[] = []

// Mock Reading model
jest.mock("../../src/models/Reading", () => ({
  Reading: jest.fn().mockImplementation(function (data) {
    const readingDoc = {
      ...data,
      _id: "mockReadingId_" + Date.now(),
      save: jest.fn().mockImplementation(async function () {
        savedReadings.push(this)
        return this
      }),
    }
    return readingDoc
  }),
}))

// Mock tarot spreads
jest.mock("../../src/data/tarotSpreads", () => ({
  getSpreadByName: jest.fn((name: string) => {
    if (name === "three-card") {
      return {
        name: "Three Card Spread",
        description: "Past, Present, Future",
        positions: ["Past", "Present", "Future"],
        getReading: jest.fn(() => [
          { name: "The Fool", description: "New beginnings", upright: ["Fresh start"], reversed: ["Recklessness"] },
          { name: "The Magician", description: "Manifestation", upright: ["Power"], reversed: ["Manipulation"] },
          {
            name: "The High Priestess",
            description: "Intuition",
            upright: ["Mystery"],
            reversed: ["Secrets"],
          },
        ]),
        interpret: jest.fn((cards) => "Mock interpretation for the reading"),
      }
    }
    return null
  }),
}))

// Mock AI service
const mockGenerateAIReading = jest.fn()
jest.mock("../../src/services/aiTarot", () => ({
  generateAIReading: mockGenerateAIReading,
  isAIAvailable: jest.fn(() => true),
}))

// Import after all mocks are set up
import tarotReadingHandler from "../../src/pages/api/tarot-reading"
import { Reading } from "../../src/models/Reading"

describe("Question Flow Integration Tests", () => {
  beforeEach(() => {
    // Don't clear ALL mocks - it resets the JWT mock
    // jest.clearAllMocks()
    savedReadings = []
    mockGenerateAIReading.mockResolvedValue("AI generated reading with user question context")
  })

  test("Full flow: user enters question → API receives it → DB stores it", async () => {
    const userQuestion = "Should I pursue this new opportunity?"

    // Simulate user submitting question through API
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: userQuestion,
      },
    })

    // Call the API handler
    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    // Verify API response is successful
    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty("reading")
    expect(responseData).toHaveProperty("interpretation")

    // Verify Reading model was called with the question
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "testUser123",
        spreadName: "three-card",
        userQuestion: userQuestion,
        cards: expect.any(Array),
        interpretation: expect.any(String),
      })
    )

    // Verify the reading was saved to database
    expect(savedReadings.length).toBe(1)
    expect(savedReadings[0].userQuestion).toBe(userQuestion)
  })

  test("Full flow: user submits without question → API handles gracefully → DB stores null", async () => {
    // Simulate user submitting without a question
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        // No userQuestion field
      },
    })

    // Call the API handler
    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    // Verify API response is successful
    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty("reading")
    expect(responseData).toHaveProperty("interpretation")

    // Verify Reading model was called with null question
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "testUser123",
        spreadName: "three-card",
        userQuestion: null,
      })
    )

    // Verify the reading was saved to database with null question
    expect(savedReadings.length).toBe(1)
    expect(savedReadings[0].userQuestion).toBeNull()
  })

  test("Full flow: user submits whitespace-only question → API trims to null → DB stores null", async () => {
    // Simulate user submitting whitespace-only question
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: "   \n\t   ",
      },
    })

    // Call the API handler
    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    // Verify API response is successful
    expect(res._getStatusCode()).toBe(200)

    // Verify Reading model was called with null question (after trimming)
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userQuestion: null,
      })
    )

    // Verify the reading was saved to database with null question
    expect(savedReadings.length).toBe(1)
    expect(savedReadings[0].userQuestion).toBeNull()
  })

  test("Full flow: invalid question (too long) → API rejects → No DB save", async () => {
    const tooLongQuestion = "a".repeat(501)

    // Simulate user submitting too long question
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: tooLongQuestion,
      },
    })

    // Call the API handler
    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    // Verify API returns validation error
    expect(res._getStatusCode()).toBe(400)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty("error")

    // Verify no reading was saved
    expect(savedReadings.length).toBe(0)
  })
})
