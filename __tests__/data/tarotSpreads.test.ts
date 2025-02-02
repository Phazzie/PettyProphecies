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

