import { describe, test, expect } from "@jest/globals"
import { getRandomCard, getCardByName, getCardByNumber, tarotCards } from "../../src/data/tarotCards"

describe("Tarot Card Functions", () => {
  test("tarotCards array contains 5 Major Arcana cards (to be expanded to 22)", () => {
    // TODO: Expand to full 22 Major Arcana cards
    expect(tarotCards.length).toBe(5)
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
    // Check that each card has a substantial passive-aggressive message
    tarotCards.forEach((card) => {
      expect(card.passiveAggressive.length).toBeGreaterThan(20)
      // Should have some punctuation or emphasis
      expect(card.passiveAggressive).toMatch(/[.!?]/)
    })
  })
})

