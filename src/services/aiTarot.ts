import OpenAI from "openai"
import type { TarotCard } from "@/src/data/tarotCards"
import type { TarotSpread } from "@/src/data/tarotSpreads"

/**
 * AI-Powered Tarot Reading Service
 * Uses xAI's Grok to generate dynamic, personalized passive-aggressive tarot readings
 */

const XAI_API_KEY = process.env.XAI_API_KEY

let xai: OpenAI | null = null

// Initialize xAI (uses OpenAI SDK with xAI endpoint) only if API key is available
if (XAI_API_KEY) {
  xai = new OpenAI({
    apiKey: XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
  })
}

export interface AIReadingOptions {
  cards: TarotCard[]
  spread: TarotSpread
  userQuestion?: string
  isReversed?: boolean[]
}

/**
 * Generate an AI-powered passive-aggressive tarot reading
 */
export async function generateAIReading(options: AIReadingOptions): Promise<string> {
  const { cards, spread, userQuestion, isReversed = [] } = options

  // Fallback to template if AI not available
  if (!xai) {
    console.warn("xAI not configured, using template reading")
    return spread.interpret(cards)
  }

  try {
    // Build card descriptions
    const cardDescriptions = cards
      .map((card, index) => {
        const position = spread.positions[index]
        const reversed = isReversed[index] ? " (Reversed)" : ""
        const meanings = isReversed[index] ? card.reversed.join(", ") : card.upright.join(", ")
        return `**${position}**: ${card.name}${reversed}\n   - ${card.description}\n   - Meanings: ${meanings}`
      })
      .join("\n\n")

    // Craft the prompt
    const prompt = `You are a passive-aggressive tarot reader with a snarky but ultimately insightful personality. You call people out on their BS, but you genuinely want to help them grow.

**THE READING:**
Spread: ${spread.name}
${spread.description}

${cardDescriptions}

${userQuestion ? `**User's Question:** "${userQuestion}"\n` : ""}

**YOUR TASK:**
Give a reading that is:
1. **Passive-aggressive and witty** - Use sarcasm, backhanded compliments, and playful judgment
2. **Actually insightful** - Despite the snark, provide genuine wisdom about each card position
3. **Connected to their question** - If they asked something, address it directly (while roasting them a bit)
4. **3-4 paragraphs** - Not too long, not too short

**TONE EXAMPLES:**
- "Oh, look at you with The Fool in your 'Current Situation' position. Shocking. Absolutely shocking."
- "The High Priestess is telling you to trust your intuition? That's cute. Maybe if you'd listened to it the last 47 times..."
- "Let me guess, you're going to ignore this advice and do what you want anyway? Yeah, that's what I thought."

Write the reading now. Be snarky, be insightful, be memorable.`

    const completion = await xai.chat.completions.create({
      model: "grok-4-fast-reasoning",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
    })

    if (
      !completion.choices ||
      !Array.isArray(completion.choices) ||
      completion.choices.length === 0 ||
      !completion.choices[0].message ||
      typeof completion.choices[0].message.content !== "string" ||
      completion.choices[0].message.content.trim() === ""
    ) {
      throw new Error("Malformed or empty response from xAI: " + JSON.stringify(completion))
    }

    const text = completion.choices[0].message.content

    return text
  } catch (error) {
    console.error("AI reading generation failed:", error)
    // Fallback to template reading
    return spread.interpret(cards)
  }
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return xai !== null
}

/**
 * Get AI model info
 */
export function getAIModelInfo() {
  return {
    available: isAIAvailable(),
    model: "grok-4-fast-reasoning",
    provider: "xAI Grok",
  }
}
