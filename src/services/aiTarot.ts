import { GoogleGenerativeAI } from "@google/generative-ai"
import type { TarotCard } from "@/src/data/tarotCards"
import type { TarotSpread } from "@/src/data/tarotSpreads"

/**
 * AI-Powered Tarot Reading Service
 * Uses Google Gemini to generate dynamic, personalized passive-aggressive tarot readings
 */

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY

let genAI: GoogleGenerativeAI | null = null

// Initialize Google AI only if API key is available
if (GOOGLE_AI_API_KEY) {
  genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY)
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
  if (!genAI) {
    console.warn("Google AI not configured, using template reading")
    return spread.interpret(cards)
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

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
  return genAI !== null
}

/**
 * Get AI model info
 */
export function getAIModelInfo() {
  return {
    available: isAIAvailable(),
    model: "gemini-1.5-flash",
    provider: "Google Gemini",
  }
}
