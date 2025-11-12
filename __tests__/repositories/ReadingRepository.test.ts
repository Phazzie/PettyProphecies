/**
 * ReadingRepository Tests
 *
 * Tests for ReadingRepository implementation
 * Following TDD - tests written BEFORE implementation
 * Uses mocked mongoose models
 */

// Mock setup
const mockFindById = jest.fn()
const mockFind = jest.fn()
const mockFindOne = jest.fn()
const mockFindByIdAndUpdate = jest.fn()
const mockFindByIdAndDelete = jest.fn()

jest.mock("@/src/models/Reading", () => ({
  Reading: jest.fn().mockImplementation((data) => ({
    ...data,
    save: jest.fn().mockResolvedValue({ ...data, _id: "newreading" }),
  })),
}))

const { Reading } = require("@/src/models/Reading")

Reading.findById = mockFindById
Reading.find = mockFind
Reading.findOne = mockFindOne
Reading.findByIdAndUpdate = mockFindByIdAndUpdate
Reading.findByIdAndDelete = mockFindByIdAndDelete

import { ReadingRepository } from "@/src/repositories/ReadingRepository"

describe("ReadingRepository", () => {
  let readingRepository: ReadingRepository
  let mockReading: any

  beforeEach(() => {
    readingRepository = new ReadingRepository()
    jest.clearAllMocks()

    mockReading = {
      _id: "reading123",
      userId: "user123",
      spreadName: "Three Card Spread",
      cards: ["The Fool", "The Magician", "The High Priestess"],
      interpretation: "Your reading interpretation...",
      rating: 5,
      createdAt: new Date("2024-01-01"),
    }
  })

  describe("findById", () => {
    it("should find reading by id", async () => {
      mockFindById.mockResolvedValue(mockReading)

      const result = await readingRepository.findById("reading123")

      expect(mockFindById).toHaveBeenCalledWith("reading123")
      expect(result).toEqual(mockReading)
    })

    it("should return null if reading not found", async () => {
      mockFindById.mockResolvedValue(null)

      const result = await readingRepository.findById("nonexistent")

      expect(result).toBeNull()
    })
  })

  describe("findByUserId", () => {
    it("should find readings for a user with default sorting (newest first)", async () => {
      const mockReadings = [
        { ...mockReading, _id: "reading1", createdAt: new Date("2024-01-02") },
        { ...mockReading, _id: "reading2", createdAt: new Date("2024-01-01") },
      ]

      const mockChain = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReadings),
      }
      mockFind.mockReturnValue(mockChain)

      const result = await readingRepository.findByUserId("user123")

      expect(mockFind).toHaveBeenCalledWith({ userId: "user123" })
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toEqual(mockReadings)
    })

    it("should support pagination", async () => {
      const mockReadings = [mockReading]

      const mockChain = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReadings),
      }
      mockFind.mockReturnValue(mockChain)

      const result = await readingRepository.findByUserId("user123", {
        limit: 10,
        skip: 20,
      })

      expect(mockChain.limit).toHaveBeenCalledWith(10)
      expect(mockChain.skip).toHaveBeenCalledWith(20)
      expect(result).toEqual(mockReadings)
    })

    it("should support custom sorting", async () => {
      const mockReadings = [mockReading]

      const mockChain = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReadings),
      }
      mockFind.mockReturnValue(mockChain)

      await readingRepository.findByUserId("user123", {
        sort: { rating: -1 },
      })

      expect(mockChain.sort).toHaveBeenCalledWith({ rating: -1 })
    })

    it("should return empty array if user has no readings", async () => {
      const mockChain = {
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      }
      mockFind.mockReturnValue(mockChain)

      const result = await readingRepository.findByUserId("user456")

      expect(result).toEqual([])
    })
  })

  describe("rateReading", () => {
    it("should update reading rating", async () => {
      const updatedReading = { ...mockReading, rating: 4 }
      mockFindByIdAndUpdate.mockResolvedValue(updatedReading)

      const result = await readingRepository.rateReading("reading123", 4)

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        "reading123",
        { rating: 4 },
        { new: true }
      )
      expect(result?.rating).toBe(4)
    })

    it("should return null if reading not found", async () => {
      mockFindByIdAndUpdate.mockResolvedValue(null)

      const result = await readingRepository.rateReading("nonexistent", 5)

      expect(result).toBeNull()
    })

    it("should accept valid ratings (1-5)", async () => {
      mockFindByIdAndUpdate.mockResolvedValue(mockReading)

      await readingRepository.rateReading("reading123", 1)
      await readingRepository.rateReading("reading123", 5)

      expect(mockFindByIdAndUpdate).toHaveBeenCalledTimes(2)
    })

    it("should throw error for invalid rating (< 1)", async () => {
      await expect(readingRepository.rateReading("reading123", 0)).rejects.toThrow(
        "Rating must be between 1 and 5"
      )
    })

    it("should throw error for invalid rating (> 5)", async () => {
      await expect(readingRepository.rateReading("reading123", 6)).rejects.toThrow(
        "Rating must be between 1 and 5"
      )
    })
  })

  describe("create", () => {
    it("should create a new reading", async () => {
      const readingData = {
        userId: "user123",
        spreadName: "Celtic Cross",
        cards: ["The Fool"],
        interpretation: "Test interpretation",
      }

      const mockSave = jest.fn().mockResolvedValue({ ...readingData, _id: "newreading" })
      Reading.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      const result = await readingRepository.create(readingData)

      expect(mockSave).toHaveBeenCalled()
    })

    it("should handle database errors during creation", async () => {
      const readingData = {
        userId: "user123",
        spreadName: "Test",
        cards: ["Card"],
        interpretation: "Test",
      }

      const mockSave = jest.fn().mockRejectedValue(new Error("Database error"))
      Reading.mockImplementationOnce((data: any) => ({
        ...data,
        save: mockSave,
      }))

      await expect(readingRepository.create(readingData)).rejects.toThrow("Database error")
    })
  })

  describe("update", () => {
    it("should update reading fields", async () => {
      const updateData = {
        interpretation: "Updated interpretation",
      }

      mockFindByIdAndUpdate.mockResolvedValue({
        ...mockReading,
        ...updateData,
      })

      const result = await readingRepository.update("reading123", updateData)

      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith("reading123", updateData, { new: true })
      expect(result?.interpretation).toBe("Updated interpretation")
    })

    it("should return null if reading not found", async () => {
      mockFindByIdAndUpdate.mockResolvedValue(null)

      const result = await readingRepository.update("nonexistent", { interpretation: "test" })

      expect(result).toBeNull()
    })
  })

  describe("delete", () => {
    it("should delete reading and return true", async () => {
      mockFindByIdAndDelete.mockResolvedValue(mockReading)

      const result = await readingRepository.delete("reading123")

      expect(mockFindByIdAndDelete).toHaveBeenCalledWith("reading123")
      expect(result).toBe(true)
    })

    it("should return false if reading not found", async () => {
      mockFindByIdAndDelete.mockResolvedValue(null)

      const result = await readingRepository.delete("nonexistent")

      expect(result).toBe(false)
    })
  })

  describe("findOne", () => {
    it("should find reading with custom query", async () => {
      mockFindOne.mockResolvedValue(mockReading)

      const result = await readingRepository.findOne({ userId: "user123" })

      expect(mockFindOne).toHaveBeenCalledWith({ userId: "user123" })
      expect(result).toEqual(mockReading)
    })
  })

  describe("findMany", () => {
    it("should find multiple readings with query and options", async () => {
      const mockReadings = [mockReading, { ...mockReading, _id: "reading456" }]
      const mockQuery = {
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockReadings),
      }
      mockFind.mockReturnValue(mockQuery)

      const result = await readingRepository.findMany(
        {},
        { limit: 10, skip: 0, sort: { createdAt: -1 } }
      )

      expect(mockFind).toHaveBeenCalledWith({})
      expect(mockQuery.limit).toHaveBeenCalledWith(10)
      expect(mockQuery.skip).toHaveBeenCalledWith(0)
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(result).toEqual(mockReadings)
    })
  })
})
