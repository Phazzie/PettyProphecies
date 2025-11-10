import { describe, test, expect } from "@jest/globals"
import {
  maybeItsYouSpread,
  doingYourBestSpread,
  quarterLifeCrisisSpread,
  selfCareAvoidanceSpread,
  podcastIdeaSpread,
  plantParentSpread,
  getSpreadByName,
} from "../../src/data/tarotSpreads"

describe("Tarot Spread Functions", () => {
  const allSpreads = [
    maybeItsYouSpread,
    doingYourBestSpread,
    quarterLifeCrisisSpread,
    selfCareAvoidanceSpread,
    podcastIdeaSpread,
    plantParentSpread,
  ]

  allSpreads.forEach((spread) => {
    test(`${spread.name} returns correct number of cards`, () => {
      const reading = spread.getReading()
      expect(reading.length).toBe(spread.positions.length)
    })

    test(`${spread.name} interpretation includes all positions`, () => {
      const reading = spread.getReading()
      const interpretation = spread.interpret(reading)
      spread.positions.forEach((position) => {
        expect(interpretation).toContain(position + ":")
      })
    })

    test(`${spread.name} interpretation includes passive-aggressive flavor`, () => {
      const reading = spread.getReading()
      const interpretation = spread.interpret(reading)
      expect(interpretation).toMatch(/(!|\?|\.{3}|Just a thought|I guess|I'm sure|Maybe)/)
    })
  })

  test("getSpreadByName returns correct spread", () => {
    allSpreads.forEach((spread) => {
      expect(getSpreadByName(spread.name)).toBe(spread)
    })
  })

  test("getSpreadByName is case insensitive", () => {
    expect(getSpreadByName("maybe it's not them, it's you")).toBe(maybeItsYouSpread)
  })

  test("getSpreadByName returns undefined for non-existent spread", () => {
    const nonExistentSpread = getSpreadByName("Not a real spread")
    expect(nonExistentSpread).toBeUndefined()
  })
})

describe("Tarot Spread DrawnCard Support", () => {
  const allSpreads = [
    maybeItsYouSpread,
    doingYourBestSpread,
    quarterLifeCrisisSpread,
    selfCareAvoidanceSpread,
    podcastIdeaSpread,
    plantParentSpread,
  ]

  allSpreads.forEach((spread) => {
    test(`${spread.name} returns DrawnCard objects with isReversed field`, () => {
      const reading = spread.getReading()

      reading.forEach((card) => {
        expect(card).toHaveProperty("isReversed")
        expect(typeof card.isReversed).toBe("boolean")
      })
    })

    test(`${spread.name} returns DrawnCard objects with position field`, () => {
      const reading = spread.getReading()

      reading.forEach((card, index) => {
        expect(card).toHaveProperty("position")
        expect(typeof card.position).toBe("string")
        expect(card.position).toBe(spread.positions[index])
      })
    })

    test(`${spread.name} positions match spread configuration`, () => {
      const reading = spread.getReading()

      expect(reading.length).toBe(spread.positions.length)
      reading.forEach((card, index) => {
        expect(card.position).toBe(spread.positions[index])
      })
    })

    test(`${spread.name} DrawnCard objects contain all TarotCard properties`, () => {
      const reading = spread.getReading()

      reading.forEach((card) => {
        // Standard TarotCard properties
        expect(card).toHaveProperty("name")
        expect(card).toHaveProperty("number")
        expect(card).toHaveProperty("description")
        expect(card).toHaveProperty("upright")
        expect(card).toHaveProperty("reversed")
        expect(card).toHaveProperty("passiveAggressive")

        // DrawnCard extensions
        expect(card).toHaveProperty("isReversed")
        expect(card).toHaveProperty("position")
      })
    })
  })

  test("no duplicate cards in a single reading", () => {
    // Test with a spread - each card should be unique
    const reading = maybeItsYouSpread.getReading()
    const cardNumbers = reading.map((card) => card.number)
    const uniqueCardNumbers = new Set(cardNumbers)

    expect(uniqueCardNumbers.size).toBe(cardNumbers.length)
  })
})

