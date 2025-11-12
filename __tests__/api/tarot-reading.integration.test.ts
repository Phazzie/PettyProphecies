/**
 * Tarot Reading API Integration Tests
 *
 * Tests the tarot reading API endpoint with AI service integration.
 * Following TDD principles: Tests written FIRST, implementation follows.
 *
 * NOTE: These are simplified integration tests focusing on AI service integration.
 * Full end-to-end tests would require a test database setup.
 */

import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"

// Mock services and dependencies
jest.mock("@/src/services/aiTarot", () => ({
  generateAIReading: jest.fn(),
  isAIAvailable: jest.fn(),
  getAIModelInfo: jest.fn(),
}))

jest.mock("@/src/models/Reading", () => {
  const mockReadingSave = jest.fn()
  return {
    Reading: jest.fn().mockImplementation(function (this: any, data: any) {
      Object.assign(this, data)
      this.save = mockReadingSave
      return this
    }),
  }
})

// Create mock functions that can be spied on
const mockCreate = jest.fn().mockResolvedValue({
  _id: "reading-456",
  userId: "user-123",
})
const mockFindOne = jest.fn().mockResolvedValue({
  _id: "reading-456",
  userId: "user-123",
})
const mockRateReading = jest.fn().mockResolvedValue({
  _id: "reading-456",
  userId: "user-123",
  rating: 5,
})

jest.mock("@/src/repositories/ReadingRepository", () => ({
  ReadingRepository: jest.fn().mockImplementation(() => ({
    create: mockCreate,
    findOne: mockFindOne,
    rateReading: mockRateReading,
  })),
}))

jest.mock("@/src/utils/database", () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}))

jest.mock("@/src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

// Mock middleware to pass through
jest.mock("@/src/middleware/auth.v2", () => ({
  withAuth: (handler: any) => handler,
  getAuthService: jest.fn(),
}))

jest.mock("@/src/middleware/errorHandler", () => ({
  errorHandler: (handler: any) => async (req: any, res: any) => {
    try {
      await handler(req, res)
    } catch (error: any) {
      res.status(error.status || 500).json({ message: error.message })
    }
  },
}))

jest.mock("@/src/middleware/requestLogger", () => ({
  requestLogger: (handler: any) => handler,
}))

// Mock rate limiter v2 (the API uses v2)
jest.mock("@/src/middleware/rateLimit.v2", () => ({
  getRateLimiter: jest.fn().mockReturnValue({
    checkLimit: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000,
    }),
  }),
  setRateLimitHeaders: jest.fn(),
  RateLimitError: class RateLimitError extends Error {
    constructor(message: string, public retryAfter?: number) {
      super(message)
      this.name = "RateLimitError"
    }
  },
}))

// Mock CSRF service to pass through
jest.mock("@/src/middleware/csrf", () => ({
  getCSRFService: jest.fn().mockReturnValue({
    validateToken: jest.fn().mockResolvedValue(undefined),
    generateToken: jest.fn().mockResolvedValue("mock-csrf-token"),
  }),
}))

// Import handler after all mocks
import handler from "@/src/pages/api/tarot-reading"
import { Reading } from "@/src/models/Reading"
import * as aiTarotService from "@/src/services/aiTarot"

describe("Tarot Reading API Integration", () => {
  const mockUserId = "user-123"
  const mockReadingId = "reading-456"

  // Get references to the mocked functions
  const mockGenerateAIReading = aiTarotService.generateAIReading as jest.MockedFunction<typeof aiTarotService.generateAIReading>
  const mockIsAIAvailable = aiTarotService.isAIAvailable as jest.MockedFunction<typeof aiTarotService.isAIAvailable>
  const mockGetAIModelInfo = aiTarotService.getAIModelInfo as jest.MockedFunction<typeof aiTarotService.getAIModelInfo>

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementations
    mockCreate.mockResolvedValue({
      _id: mockReadingId,
      userId: mockUserId,
    })
    mockFindOne.mockResolvedValue({
      _id: mockReadingId,
      userId: mockUserId,
    })
    mockRateReading.mockResolvedValue({
      _id: mockReadingId,
      userId: mockUserId,
      rating: 5,
    })
  })

  describe("POST /api/tarot-reading - AI Integration", () => {
    it("should call generateAIReading when useAI=true and AI is available", async () => {
      // Arrange
      const mockAIInterpretation = "Oh look, The Fool. How fitting."
      mockIsAIAvailable.mockReturnValue(true)
      mockGenerateAIReading.mockResolvedValue(mockAIInterpretation)
      mockGetAIModelInfo.mockReturnValue({
        available: true,
        model: "grok-4-fast-reasoning",
        provider: "xAI Grok",
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          spreadName: "Maybe It's Not Them, It's You",
          useAI: true,
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(mockIsAIAvailable).toHaveBeenCalled()
      expect(mockGenerateAIReading).toHaveBeenCalled()
      expect(res._getStatusCode()).toBe(200)

      const response = JSON.parse(res._getData())
      expect(response.success).toBe(true)
      expect(response.data.interpretation).toBe(mockAIInterpretation)
      expect(response.data.aiGenerated).toBe(true)
      expect(response.data.modelInfo).toBeDefined()
    })

    it("should NOT call generateAIReading when useAI=false", async () => {
      // Arrange
      mockIsAIAvailable.mockReturnValue(true)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          spreadName: "Maybe It's Not Them, It's You",
          useAI: false,
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(mockGenerateAIReading).not.toHaveBeenCalled()
      expect(res._getStatusCode()).toBe(200)

      const response = JSON.parse(res._getData())
      expect(response.success).toBe(true)
      expect(response.data.aiGenerated).toBe(false)
      expect(response.data.modelInfo).toBeUndefined()
    })

    it("should use template when AI is unavailable even if useAI=true", async () => {
      // Arrange
      mockIsAIAvailable.mockReturnValue(false)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          spreadName: "Maybe It's Not Them, It's You",
          useAI: true,
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(mockIsAIAvailable).toHaveBeenCalled()
      expect(mockGenerateAIReading).not.toHaveBeenCalled()
      expect(res._getStatusCode()).toBe(200)

      const response = JSON.parse(res._getData())
      expect(response.success).toBe(true)
      expect(response.data.aiGenerated).toBe(false)
    })

    it("should fallback to template when AI generation throws error", async () => {
      // Arrange
      mockIsAIAvailable.mockReturnValue(true)
      mockGenerateAIReading.mockRejectedValue(new Error("AI service timeout"))

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          spreadName: "Maybe It's Not Them, It's You",
          useAI: true,
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(mockGenerateAIReading).toHaveBeenCalled()
      expect(res._getStatusCode()).toBe(200)

      const response = JSON.parse(res._getData())
      expect(response.success).toBe(true)
      expect(response.data.interpretation).toBeTruthy()
      expect(response.data.aiGenerated).toBe(false)
    })

    it("should save reading with aiGenerated=true when AI is used", async () => {
      // Arrange
      mockIsAIAvailable.mockReturnValue(true)
      mockGenerateAIReading.mockResolvedValue("AI reading")
      mockGetAIModelInfo.mockReturnValue({
        available: true,
        model: "grok-4-fast-reasoning",
        provider: "xAI Grok",
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          spreadName: "Maybe It's Not Them, It's You",
          useAI: true,
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          aiGenerated: true,
        })
      )
    })

    it("should save reading with aiGenerated=false when template is used", async () => {
      // Arrange
      mockIsAIAvailable.mockReturnValue(false)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          spreadName: "Maybe It's Not Them, It's You",
          useAI: false,
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          aiGenerated: false,
        })
      )
    })
  })

  describe("POST /api/tarot-reading - Error Handling", () => {
    it("should return error for invalid spread name", async () => {
      // Arrange
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          spreadName: "Non-Existent Spread",
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400)
    })
  })

  describe("PUT /api/tarot-reading - Update Rating", () => {
    it("should update reading rating successfully", async () => {
      // Arrange
      const rating = 5
      mockRateReading.mockResolvedValue({
        _id: mockReadingId,
        userId: mockUserId,
        rating,
      })

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        body: {
          readingId: mockReadingId,
          rating,
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.success).toBe(true)
      expect(response.data.message).toContain("Rating updated successfully")
      expect(mockFindOne).toHaveBeenCalledWith({
        _id: mockReadingId,
        userId: mockUserId
      })
      expect(mockRateReading).toHaveBeenCalledWith(mockReadingId, rating)
    })

    it("should reject invalid rating values", async () => {
      // Arrange
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
        body: {
          readingId: mockReadingId,
          rating: 10, // Invalid: must be 1-5
        },
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBeGreaterThanOrEqual(400)
    })
  })

  describe("Method Not Allowed", () => {
    it("should return 405 for unsupported HTTP methods", async () => {
      // Arrange
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
      })
      ;(req as any).userId = mockUserId

      // Act
      await handler(req, res)

      // Assert
      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response.success).toBe(false)
      expect(response.error.message).toBe("Method not allowed")
    })
  })
})
