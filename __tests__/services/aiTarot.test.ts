/**
 * AI Tarot Service Tests
 *
 * Tests the AI-powered tarot reading service with xAI Grok integration.
 * Following TDD principles: Tests written FIRST, implementation already exists.
 */

import type { TarotCard } from "@/src/data/tarotCards"
import type { TarotSpread } from "@/src/data/tarotSpreads"

// Mock OpenAI before importing the service
const mockCreate = jest.fn()
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }))
})

// Mock console methods to avoid noise in test output
const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation()
const mockConsoleError = jest.spyOn(console, "error").mockImplementation()

describe("AI Tarot Service", () => {
  // Test fixtures
  const mockCards: TarotCard[] = [
    {
      name: "The Fool",
      number: 0,
      description: "New beginnings, innocence, spontaneity",
      upright: ["New beginnings", "Free spirit", "Leap of faith"],
      reversed: ["Recklessness", "Inconsideration", "Foolishness"],
      passiveAggressive: "Oh look at you, ready to jump off that cliff of life.",
    },
    {
      name: "The Magician",
      number: 1,
      description: "Manifestation, resourcefulness, power",
      upright: ["Manifestation", "Resourcefulness", "Inspired action"],
      reversed: ["Manipulation", "Poor planning", "Untapped talents"],
      passiveAggressive: "Wow, you're so talented. Shame you never use those skills.",
    },
  ]

  const mockSpread: TarotSpread = {
    name: "Test Spread",
    description: "A test spread for unit testing",
    positions: ["Position 1", "Position 2"],
    getReading: jest.fn(() => mockCards),
    interpret: jest.fn((cards: TarotCard[]) =>
      cards.map((card, i) => `${i}: ${card.passiveAggressive}`).join("\n")
    ),
  }

  beforeEach(() => {
    mockCreate.mockClear()
  })

  afterAll(() => {
    mockConsoleWarn.mockRestore()
    mockConsoleError.mockRestore()
  })

  describe("generateAIReading", () => {
    it("should generate AI reading when API key is available and API responds successfully", async () => {
      // Arrange
      const originalEnv = process.env.XAI_API_KEY
      process.env.XAI_API_KEY = "test-api-key"

      const mockAIResponse = "Oh, The Fool and The Magician? How delightfully chaotic. Let me guess, you're about to make a decision you'll regret? Classic."

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: mockAIResponse,
            },
          },
        ],
      })

      // Re-import the module to pick up the XAI_API_KEY
      jest.resetModules()
      const { generateAIReading: freshGenerateAIReading } = require("@/src/services/aiTarot")

      // Act
      const result = await freshGenerateAIReading({
        cards: mockCards,
        spread: mockSpread,
        userQuestion: "Should I quit my job?",
        isReversed: [false, true],
      })

      // Assert
      expect(result).toBe(mockAIResponse)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "grok-4-fast-reasoning",
          temperature: 0.8,
          max_tokens: 1000,
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: "user",
              content: expect.stringContaining("The Fool"),
            }),
          ]),
        })
      )

      // Restore
      if (originalEnv === undefined) {
        delete process.env.XAI_API_KEY
      } else {
        process.env.XAI_API_KEY = originalEnv
      }
    })

    it("should fallback to template reading when XAI_API_KEY is not set", async () => {
      // Arrange - No API key set
      delete process.env.XAI_API_KEY
      jest.resetModules()
      const { generateAIReading: freshGenerateAIReading } = require("@/src/services/aiTarot")

      // Act
      const result = await freshGenerateAIReading({
        cards: mockCards,
        spread: mockSpread,
      })

      // Assert
      expect(result).toBe(mockSpread.interpret(mockCards))
      expect(mockConsoleWarn).toHaveBeenCalledWith("xAI not configured, using template reading")
    })

    it("should fallback to template reading when API call fails", async () => {
      // Arrange
      const originalEnv = process.env.XAI_API_KEY
      process.env.XAI_API_KEY = "test-api-key"

      mockCreate.mockRejectedValue(new Error("API timeout"))

      jest.resetModules()
      const { generateAIReading: freshGenerateAIReading } = require("@/src/services/aiTarot")

      // Act
      const result = await freshGenerateAIReading({
        cards: mockCards,
        spread: mockSpread,
      })

      // Assert
      expect(result).toBe(mockSpread.interpret(mockCards))
      expect(mockConsoleError).toHaveBeenCalledWith(
        "AI reading generation failed:",
        expect.any(Error)
      )

      // Restore
      if (originalEnv === undefined) {
        delete process.env.XAI_API_KEY
      } else {
        process.env.XAI_API_KEY = originalEnv
      }
    })

    it("should fallback to template reading when API returns malformed response", async () => {
      // Arrange
      const originalEnv = process.env.XAI_API_KEY
      process.env.XAI_API_KEY = "test-api-key"

      mockCreate.mockResolvedValue({
        choices: [], // Empty choices array
      })

      jest.resetModules()
      const { generateAIReading: freshGenerateAIReading } = require("@/src/services/aiTarot")

      // Act
      const result = await freshGenerateAIReading({
        cards: mockCards,
        spread: mockSpread,
      })

      // Assert
      expect(result).toBe(mockSpread.interpret(mockCards))
      expect(mockConsoleError).toHaveBeenCalledWith(
        "AI reading generation failed:",
        expect.any(Error)
      )

      // Restore
      if (originalEnv === undefined) {
        delete process.env.XAI_API_KEY
      } else {
        process.env.XAI_API_KEY = originalEnv
      }
    })

    it("should fallback to template reading when API returns empty content", async () => {
      // Arrange
      const originalEnv = process.env.XAI_API_KEY
      process.env.XAI_API_KEY = "test-api-key"

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "", // Empty content
            },
          },
        ],
      })

      jest.resetModules()
      const { generateAIReading: freshGenerateAIReading } = require("@/src/services/aiTarot")

      // Act
      const result = await freshGenerateAIReading({
        cards: mockCards,
        spread: mockSpread,
      })

      // Assert
      expect(result).toBe(mockSpread.interpret(mockCards))

      // Restore
      if (originalEnv === undefined) {
        delete process.env.XAI_API_KEY
      } else {
        process.env.XAI_API_KEY = originalEnv
      }
    })

    it("should include user question in prompt when provided", async () => {
      // Arrange
      const originalEnv = process.env.XAI_API_KEY
      process.env.XAI_API_KEY = "test-api-key"

      const userQuestion = "Will I find love?"
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "Ah, love. Sure, why not.",
            },
          },
        ],
      })

      jest.resetModules()
      const { generateAIReading: freshGenerateAIReading } = require("@/src/services/aiTarot")

      // Act
      await freshGenerateAIReading({
        cards: mockCards,
        spread: mockSpread,
        userQuestion,
      })

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(userQuestion),
            }),
          ]),
        })
      )

      // Restore
      if (originalEnv === undefined) {
        delete process.env.XAI_API_KEY
      } else {
        process.env.XAI_API_KEY = originalEnv
      }
    })

    it("should handle reversed cards in the reading", async () => {
      // Arrange
      const originalEnv = process.env.XAI_API_KEY
      process.env.XAI_API_KEY = "test-api-key"

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "Reversed cards? Of course they are.",
            },
          },
        ],
      })

      jest.resetModules()
      const { generateAIReading: freshGenerateAIReading } = require("@/src/services/aiTarot")

      // Act
      await freshGenerateAIReading({
        cards: mockCards,
        spread: mockSpread,
        isReversed: [true, false],
      })

      // Assert
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("(Reversed)"),
            }),
          ]),
        })
      )

      // Restore
      if (originalEnv === undefined) {
        delete process.env.XAI_API_KEY
      } else {
        process.env.XAI_API_KEY = originalEnv
      }
    })
  })

  describe("isAIAvailable", () => {
    it("should return true when XAI_API_KEY is set", () => {
      // Arrange
      process.env.XAI_API_KEY = "test-api-key"
      jest.resetModules()
      const { isAIAvailable: freshIsAIAvailable } = require("@/src/services/aiTarot")

      // Act
      const result = freshIsAIAvailable()

      // Assert
      expect(result).toBe(true)
    })

    it("should return false when XAI_API_KEY is not set", () => {
      // Arrange
      delete process.env.XAI_API_KEY
      jest.resetModules()
      const { isAIAvailable: freshIsAIAvailable } = require("@/src/services/aiTarot")

      // Act
      const result = freshIsAIAvailable()

      // Assert
      expect(result).toBe(false)
    })
  })

  describe("getAIModelInfo", () => {
    it("should return correct model info when AI is available", () => {
      // Arrange
      process.env.XAI_API_KEY = "test-api-key"
      jest.resetModules()
      const { getAIModelInfo: freshGetAIModelInfo } = require("@/src/services/aiTarot")

      // Act
      const result = freshGetAIModelInfo()

      // Assert
      expect(result).toEqual({
        available: true,
        model: "grok-4-fast-reasoning",
        provider: "xAI Grok",
      })
    })

    it("should return correct model info when AI is not available", () => {
      // Arrange
      delete process.env.XAI_API_KEY
      jest.resetModules()
      const { getAIModelInfo: freshGetAIModelInfo } = require("@/src/services/aiTarot")

      // Act
      const result = freshGetAIModelInfo()

      // Assert
      expect(result).toEqual({
        available: false,
        model: "grok-4-fast-reasoning",
        provider: "xAI Grok",
      })
    })
  })
})
