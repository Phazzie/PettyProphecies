import { describe, test, expect, beforeEach, jest } from "@jest/globals"
import mongoose from "mongoose"
import { createMocks } from "node-mocks-http"
import jwt from "jsonwebtoken"
import type { NextApiRequest, NextApiResponse } from "next"

// Mock all dependencies
jest.mock("../../src/utils/database", () => ({
  connectToDatabase: jest.fn().mockResolvedValue({}),
}))

jest.mock("../../src/middleware/rateLimit", () => ({
  rateLimitMiddleware: jest.fn((handler) => handler),
}))

jest.mock("../../src/utils/logger", () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock Reading model - define mocks inside factory to avoid hoisting issues
jest.mock("../../src/models/Reading", () => {
  const mockFindChain = {
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn(),
  }

  return {
    Reading: {
      find: jest.fn(() => mockFindChain),
      countDocuments: jest.fn(),
    },
    __mockFindChain: mockFindChain, // Export for testing
  }
})

// Mock the auth middleware to inject userId
jest.mock("../../src/middleware/auth", () => ({
  authMiddleware: (handler: any) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const token = req.headers.authorization?.split(" ")[1]
      if (!token) {
        return res.status(401).json({ message: "Authentication required" })
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret") as any
        req.userId = decoded.userId
        return handler(req, res)
      } catch (error) {
        return res.status(401).json({ message: "Invalid token" })
      }
    }
  },
}))

// Now import the handler and mocks
import readingsHandler from "../../src/pages/api/readings"
import { Reading, __mockFindChain as mockFindChain } from "../../src/models/Reading"

console.log("Imported Reading:", Reading)
console.log("Imported mockFindChain:", mockFindChain)

const JWT_SECRET = process.env.JWT_SECRET || "test-secret"

describe("GET /api/readings", () => {
  const userId1 = new mongoose.Types.ObjectId().toString()
  const userId2 = new mongoose.Types.ObjectId().toString()

  let mockReading: any
  let mockFind: jest.Mock
  let mockCountDocuments: jest.Mock

  beforeEach(() => {
    mockReading = Reading as any
    mockFind = mockReading?.find as jest.Mock
    mockCountDocuments = mockReading?.countDocuments as jest.Mock
    jest.clearAllMocks()
  })

  test("should require authentication (401 if not logged in)", async () => {
    const { req, res } = createMocks({
      method: "GET",
    })

    await readingsHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Authentication required",
    })
  })

  test("should require valid authentication token", async () => {
    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: "Bearer invalid-token",
      },
    })

    await readingsHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Invalid token",
    })
  })

  test("should return only authenticated user's readings", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    const mockReadings = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Three Card Spread",
        cards: ["The Fool", "The Magician", "The High Priestess"],
        interpretation: "Test interpretation",
        rating: 5,
        createdAt: new Date("2024-01-02"),
        aiGenerated: true,
        userQuestion: "What should I do?",
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Celtic Cross",
        cards: ["The Empress", "The Emperor"],
        interpretation: "Another interpretation",
        rating: 4,
        createdAt: new Date("2024-01-01"),
        aiGenerated: false,
      },
    ]

    ;(mockFindChain as any).lean.mockResolvedValue(mockReadings)
    mockCountDocuments.mockResolvedValue(2)

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockFind).toHaveBeenCalledWith({ userId: userId1 })

    const responseData = JSON.parse(res._getData())
    expect(responseData.readings).toHaveLength(2)
    expect(responseData.readings[0].userId).toBe(userId1)
    expect(responseData.readings[1].userId).toBe(userId1)
  })

  test("should not return other users' readings", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    const mockReadings = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Three Card Spread",
        cards: ["The Fool"],
        interpretation: "Test",
        createdAt: new Date(),
        aiGenerated: true,
      },
    ]

    ;(mockFindChain as any).lean.mockResolvedValue(mockReadings)
    mockCountDocuments.mockResolvedValue(1)

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    expect(mockFind).toHaveBeenCalledWith({ userId: userId1 })
    expect(mockFind).not.toHaveBeenCalledWith({ userId: userId2 })
  })

  test("should return readings sorted by newest first (createdAt desc)", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    const mockReadings = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Three Card Spread",
        cards: ["The Fool"],
        interpretation: "Newest",
        createdAt: new Date("2024-01-03"),
        aiGenerated: true,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Celtic Cross",
        cards: ["The Magician"],
        interpretation: "Older",
        createdAt: new Date("2024-01-01"),
        aiGenerated: false,
      },
    ]

    ;(mockFindChain as any).lean.mockResolvedValue(mockReadings)
    mockCountDocuments.mockResolvedValue(2)

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    expect((mockFindChain as any).sort).toHaveBeenCalledWith({ createdAt: -1 })
  })

  test("should return 10 readings per page by default", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    ;(mockFindChain as any).lean.mockResolvedValue([])
    mockCountDocuments.mockResolvedValue(0)

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    expect((mockFindChain as any).limit).toHaveBeenCalledWith(10)
    expect((mockFindChain as any).skip).toHaveBeenCalledWith(0)
  })

  test("should accept page query parameter for pagination", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    ;(mockFindChain as any).lean.mockResolvedValue([])
    mockCountDocuments.mockResolvedValue(25)

    const { req, res } = createMocks({
      method: "GET",
      query: {
        page: "2",
      },
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    expect((mockFindChain as any).skip).toHaveBeenCalledWith(20) // page 2 * 10 items per page
    expect((mockFindChain as any).limit).toHaveBeenCalledWith(10)

    const responseData = JSON.parse(res._getData())
    expect(responseData.page).toBe(2)
    expect(responseData.totalPages).toBe(3) // 25 total / 10 per page = 3 pages
    expect(responseData.total).toBe(25)
  })

  test("should return empty array when user has no readings", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    ;(mockFindChain as any).lean.mockResolvedValue([])
    mockCountDocuments.mockResolvedValue(0)

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const responseData = JSON.parse(res._getData())
    expect(responseData.readings).toEqual([])
    expect(responseData.total).toBe(0)
    expect(responseData.totalPages).toBe(0)
  })

  test("should return reading objects with all required fields", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    const mockReadings = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Three Card Spread",
        cards: ["The Fool", "The Magician", "The High Priestess"],
        interpretation: "A comprehensive interpretation of your reading.",
        rating: 5,
        createdAt: new Date("2024-01-01"),
        aiGenerated: true,
        userQuestion: "What does the future hold?",
      },
    ]

    ;(mockFindChain as any).lean.mockResolvedValue(mockReadings)
    mockCountDocuments.mockResolvedValue(1)

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    const responseData = JSON.parse(res._getData())
    const reading = responseData.readings[0]

    expect(reading).toHaveProperty("_id")
    expect(reading).toHaveProperty("userId")
    expect(reading).toHaveProperty("spreadName")
    expect(reading).toHaveProperty("cards")
    expect(reading).toHaveProperty("interpretation")
    expect(reading).toHaveProperty("rating")
    expect(reading).toHaveProperty("createdAt")
    expect(reading).toHaveProperty("aiGenerated")
    expect(reading).toHaveProperty("userQuestion")

    expect(reading.cards).toEqual(["The Fool", "The Magician", "The High Priestess"])
    expect(reading.spreadName).toBe("Three Card Spread")
    expect(reading.aiGenerated).toBe(true)
  })

  test("should include aiGenerated flag in readings", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    const mockReadings = [
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Three Card Spread",
        cards: ["The Fool"],
        interpretation: "AI generated reading",
        createdAt: new Date(),
        aiGenerated: true,
      },
      {
        _id: new mongoose.Types.ObjectId(),
        userId: userId1,
        spreadName: "Celtic Cross",
        cards: ["The Magician"],
        interpretation: "Manual reading",
        createdAt: new Date(),
        aiGenerated: false,
      },
    ]

    ;(mockFindChain as any).lean.mockResolvedValue(mockReadings)
    mockCountDocuments.mockResolvedValue(2)

    const { req, res } = createMocks({
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    const responseData = JSON.parse(res._getData())
    expect(responseData.readings[0].aiGenerated).toBe(true)
    expect(responseData.readings[1].aiGenerated).toBe(false)
  })

  test("should return 405 for non-GET methods", async () => {
    const token = jwt.sign({ userId: userId1 }, JWT_SECRET)

    const { req, res } = createMocks({
      method: "DELETE",
      headers: {
        authorization: `Bearer ${token}`,
      },
    })

    await readingsHandler(req, res)

    expect(res._getStatusCode()).toBe(405)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Method not allowed",
    })
  })
})
