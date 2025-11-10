import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals"
import type { TarotCard } from "@/src/data/tarotCards"
import type { TarotSpread } from "@/src/data/tarotSpreads"

// Create mock completion function
const mockCreate = jest.fn()

// Mock OpenAI before importing the module
jest.mock("openai", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })),
  }
})

describe("AI Tarot Service", () => {
  let originalEnv: NodeJS.ProcessEnv

  // Sample test data
  const mockCard: TarotCard = {
    number: 0,
    name: "The Fool",
    description: "A card of new beginnings",
    upright: ["innocence", "new beginnings", "free spirit"],
    reversed: ["recklessness", "fearlessness", "risk"],
    passiveAggressive: "Oh look, starting something new again? How original.",
  }

  const mockSpread: TarotSpread = {
    name: "Test Spread",
    description: "A test spread",
    positions: ["Position 1", "Position 2", "Position 3"],
    getReading: () => [mockCard, mockCard, mockCard],
    interpret: (cards: TarotCard[]) => "Template interpretation",
  }

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env }

    // Clear module cache to allow fresh imports
    jest.resetModules()

    // Reset mocks
    mockCreate.mockReset()
  })

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv
  })

  test("generateAIReading returns AI-generated content when API key is available", async () => {
    // Set up environment
    process.env.XAI_API_KEY = "test-api-key"

    // Mock OpenAI response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Oh, The Fool again? How fitting. Let me guess, you're about to make another impulsive decision that you'll regret in three to five business days? The universe is literally screaming at you to think before you leap, but sure, go ahead and ignore the warning signs. That's worked out so well for you in the past, hasn't it?",
          },
        },
      ],
    })

    // Import after setting up mocks
    const { generateAIReading } = require("@/src/services/aiTarot")

    const result = await generateAIReading({
      cards: [mockCard, mockCard, mockCard],
      spread: mockSpread,
      userQuestion: "Should I quit my job?",
    })

    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(100)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "grok-4-fast-reasoning",
        temperature: 0.8,
        max_tokens: 1000,
      })
    )
  })

  test("generateAIReading falls back to template when XAI_API_KEY is missing", async () => {
    // Ensure API key is NOT set
    delete process.env.XAI_API_KEY

    // Import after clearing API key
    const { generateAIReading } = require("@/src/services/aiTarot")

    const result = await generateAIReading({
      cards: [mockCard, mockCard, mockCard],
      spread: mockSpread,
    })

    expect(result).toBe("Template interpretation")
  })

  test("generateAIReading includes user question in prompt when provided", async () => {
    process.env.XAI_API_KEY = "test-api-key"

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "AI response with question context about finding love and being worthy" } }],
    })

    const { generateAIReading } = require("@/src/services/aiTarot")

    const userQuestion = "Will I find love?"
    await generateAIReading({
      cards: [mockCard],
      spread: mockSpread,
      userQuestion,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const prompt = callArgs.messages[0].content

    expect(prompt).toContain(userQuestion)
    expect(prompt).toContain("User's Question")
  })

  test("generateAIReading handles card reversals correctly", async () => {
    process.env.XAI_API_KEY = "test-api-key"

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Reading with reversed cards acknowledged and properly interpreted with deep insight" } }],
    })

    const { generateAIReading } = require("@/src/services/aiTarot")

    await generateAIReading({
      cards: [mockCard, mockCard],
      spread: mockSpread,
      isReversed: [true, false],
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const prompt = callArgs.messages[0].content

    expect(prompt).toContain("(Reversed)")
    expect(prompt).toContain("recklessness") // reversed meaning
  })

  test("generateAIReading falls back to template on API error", async () => {
    process.env.XAI_API_KEY = "test-api-key"

    mockCreate.mockRejectedValue(new Error("API timeout"))

    const { generateAIReading } = require("@/src/services/aiTarot")

    const result = await generateAIReading({
      cards: [mockCard, mockCard, mockCard],
      spread: mockSpread,
    })

    expect(result).toBe("Template interpretation")
  })

  test("generateAIReading falls back to template on empty AI response", async () => {
    process.env.XAI_API_KEY = "test-api-key"

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "" } }],
    })

    const { generateAIReading } = require("@/src/services/aiTarot")

    const result = await generateAIReading({
      cards: [mockCard, mockCard, mockCard],
      spread: mockSpread,
    })

    expect(result).toBe("Template interpretation")
  })

  test("generateAIReading falls back to template when no choices in response", async () => {
    process.env.XAI_API_KEY = "test-api-key"

    mockCreate.mockResolvedValue({
      choices: [],
    })

    const { generateAIReading } = require("@/src/services/aiTarot")

    const result = await generateAIReading({
      cards: [mockCard, mockCard, mockCard],
      spread: mockSpread,
    })

    expect(result).toBe("Template interpretation")
  })

  test("isAIAvailable returns true when API key is set", () => {
    process.env.XAI_API_KEY = "test-api-key"

    const { isAIAvailable } = require("@/src/services/aiTarot")

    expect(isAIAvailable()).toBe(true)
  })

  test("isAIAvailable returns false when API key is missing", () => {
    delete process.env.XAI_API_KEY

    const { isAIAvailable } = require("@/src/services/aiTarot")

    expect(isAIAvailable()).toBe(false)
  })

  test("getAIModelInfo returns correct model information", () => {
    process.env.XAI_API_KEY = "test-api-key"

    const { getAIModelInfo } = require("@/src/services/aiTarot")

    const info = getAIModelInfo()

    expect(info).toEqual({
      available: true,
      model: "grok-4-fast-reasoning",
      provider: "xAI Grok",
    })
  })

  test("generateAIReading builds proper prompt with all card positions", async () => {
    process.env.XAI_API_KEY = "test-api-key"

    mockCreate.mockResolvedValue({
      choices: [{ message: { content: "Complete reading with all positions covered thoroughly and with great wisdom and insight" } }],
    })

    const { generateAIReading } = require("@/src/services/aiTarot")

    const threeCardSpread: TarotSpread = {
      name: "Past Present Future",
      description: "A classic three-card spread",
      positions: ["Past", "Present", "Future"],
      getReading: () => [mockCard, mockCard, mockCard],
      interpret: () => "Template",
    }

    await generateAIReading({
      cards: [mockCard, mockCard, mockCard],
      spread: threeCardSpread,
    })

    const callArgs = mockCreate.mock.calls[0][0]
    const prompt = callArgs.messages[0].content

    expect(prompt).toContain("Past")
    expect(prompt).toContain("Present")
    expect(prompt).toContain("Future")
    expect(prompt).toContain(mockCard.name)
    expect(prompt).toContain(mockCard.description)
  })

  test("generateAIReading handles network timeout errors gracefully", async () => {
    process.env.XAI_API_KEY = "test-api-key"

    // Simulate a timeout error
    const timeoutError = new Error("Request timeout")
    timeoutError.name = "TimeoutError"
    mockCreate.mockRejectedValue(timeoutError)

    const { generateAIReading } = require("@/src/services/aiTarot")

    const result = await generateAIReading({
      cards: [mockCard],
      spread: mockSpread,
    })

    expect(result).toBe("Template interpretation")
  })
})
