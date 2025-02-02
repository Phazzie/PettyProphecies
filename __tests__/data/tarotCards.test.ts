import { describe, test, expect } from "@jest/globals"
import { getRandomCard, getCardByName, getCardByNumber, tarotCards } from "../../src/data/tarotCards"

describe("Tarot Card Functions", () => {
  test("tarotCards array has 22 cards", () => {
    expect(tarotCards.length).toBe(22)
  })

  test("getRandomCard returns a valid card", () => {
    const card = getRandomCard()
    expect(card).toBeDefined()
    expect(tarotCards).toContain(card)
  })

  test("getCardByName returns correct card", () => {
    const foolCard = getCardByName("The Fool")
    expect(foolCard).toBeDefined()
    expect(foolCard?.name).toBe("The Fool")
    expect(foolCard?.number).toBe(0)
  })

  test("getCardByName is case insensitive", () => {
    const magicianCard = getCardByName("the magician")
    expect(magicianCard).toBeDefined()
    expect(magicianCard?.name).toBe("The Magician")
    expect(magicianCard?.number).toBe(1)
  })

  test("getCardByName returns undefined for non-existent card", () => {
    const nonExistentCard = getCardByName("Not a real card")
    expect(nonExistentCard).toBeUndefined()
  })

  test("getCardByNumber returns correct card", () => {
    const foolCard = getCardByNumber(0)
    expect(foolCard).toBeDefined()
    expect(foolCard?.name).toBe("The Fool")
    expect(foolCard?.number).toBe(0)
  })

  test("getCardByNumber returns undefined for non-existent number", () => {
    const nonExistentCard = getCardByNumber(22)
    expect(nonExistentCard).toBeUndefined()
  })

  test("All cards have passive-aggressive interpretations", () => {
    tarotCards.forEach((card) => {
      expect(card.passiveAggressive).toBeDefined()
      expect(card.passiveAggressive.length).toBeGreaterThan(0)
    })
  })

  test("Passive-aggressive interpretations are sufficiently snarky", () => {
    const snarkyPatterns = [/\?/, /!/, /\.{3}/, /I'm sure/, /right\?/, /how nice/i, /good luck/i]
    tarotCards.forEach((card) => {
      const hasSnark = snarkyPatterns.some((pattern) => pattern.test(card.passiveAggressive))
      expect(hasSnark).toBe(true)
    })
  })
})

