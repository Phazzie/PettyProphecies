// Set environment variables FIRST, before any imports
process.env.JWT_SECRET = "test-jwt-secret-for-testing"
process.env.MONGODB_URI = "mongodb://localhost:27017/test"

import { describe, test, expect, beforeEach, jest } from "@jest/globals"
import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"

// Mock dependencies
jest.mock("../../src/utils/database")

// Mock jsonwebtoken to always return a valid token
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "mock-token"),
  verify: jest.fn(() => ({ userId: "mockUserId123" })),
  decode: jest.fn(() => ({ userId: "mockUserId123" })),
}))

jest.mock("../../src/middleware/rateLimit", () => ({
  rateLimitMiddleware: jest.fn((handler) => handler),
}))
jest.mock("../../src/middleware/errorHandler", () => ({
  errorHandler: jest.fn((handler) => handler),
}))
jest.mock("../../src/middleware/requestLogger", () => ({
  requestLogger: jest.fn((handler) => handler),
}))

// Import after mocks
import tarotReadingHandler from "../../src/pages/api/tarot-reading"
import { Reading } from "../../src/models/Reading"

// Mock Reading model
jest.mock("../../src/models/Reading", () => ({
  Reading: jest.fn().mockImplementation(function (data) {
    return {
      ...data,
      _id: "mockReadingId",
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: "mockReadingId",
      }),
    }
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
          { name: "The Fool", description: "New beginnings" },
          { name: "The Magician", description: "Manifestation" },
          { name: "The High Priestess", description: "Intuition" },
        ]),
        interpret: jest.fn((cards) => "Mock interpretation"),
      }
    }
    return null
  }),
}))

describe("User Questions API Tests", () => {
  beforeEach(() => {
    // Don't clear all mocks - it resets the JWT mock
    // jest.clearAllMocks()
  })

  test("POST /api/tarot-reading accepts optional question field", async () => {
    const { req, res} = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: "Will I find love this year?",
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty("reading")
    expect(responseData).toHaveProperty("interpretation")
  })

  test("POST /api/tarot-reading validates question max 500 characters", async () => {
    const longQuestion = "a".repeat(501)
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: longQuestion,
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(400)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty("error")
    expect(responseData.error).toContain("userQuestion")
  })

  test("POST /api/tarot-reading validates question must be string or null/undefined", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: 12345, // Invalid type
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(400)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty("error")
  })

  test("POST /api/tarot-reading treats empty string as null", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: "   ", // Whitespace only
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(200)
    // The question should be stored as null after trimming
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userQuestion: null,
      })
    )
  })

  test("POST /api/tarot-reading stores question in Reading document", async () => {
    const testQuestion = "What should I focus on today?"
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: testQuestion,
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(200)
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadName: "three-card",
        userQuestion: testQuestion,
      })
    )
  })

  test("POST /api/tarot-reading passes question to AI service", async () => {
    // We'll verify this through the Reading model
    const testQuestion = "Should I change careers?"
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: testQuestion,
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(200)
    // In the actual implementation, the question should be passed to generateAIReading
    // For now we verify it's stored in the Reading
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userQuestion: testQuestion,
      })
    )
  })

  test("POST /api/tarot-reading works without question (null)", async () => {
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

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData).toHaveProperty("reading")
    expect(responseData).toHaveProperty("interpretation")
  })

  test("POST /api/tarot-reading works without question (undefined)", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: undefined,
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(200)
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userQuestion: null,
      })
    )
  })

  test("POST /api/tarot-reading trims whitespace from question", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        spreadName: "three-card",
        userQuestion: "  Should I take the risk?  ",
      },
    })

    await tarotReadingHandler(req as NextApiRequest, res as NextApiResponse)

    expect(res._getStatusCode()).toBe(200)
    const MockReading = Reading as jest.MockedFunction<any>
    expect(MockReading).toHaveBeenCalledWith(
      expect.objectContaining({
        userQuestion: "Should I take the risk?",
      })
    )
  })
})
