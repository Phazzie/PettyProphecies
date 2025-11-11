/**
 * PasswordReset Model Tests
 *
 * Tests for the PasswordReset mongoose model
 * Following TDD - tests written BEFORE implementation
 */

import mongoose from "mongoose"
import { PasswordReset, IPasswordReset } from "@/src/models/PasswordReset"

describe("PasswordReset Model", () => {
  beforeAll(async () => {
    // Connect to in-memory database
    await mongoose.connect("mongodb://localhost:27017/test")
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
  })

  afterEach(async () => {
    await PasswordReset.deleteMany({})
  })

  describe("Model Creation", () => {
    it("should create a password reset request with required fields", async () => {
      const resetData = {
        userId: "user123",
        token: "secure-random-token-123",
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      }

      const reset = new PasswordReset(resetData)
      const savedReset = await reset.save()

      expect(savedReset._id).toBeDefined()
      expect(savedReset.userId).toBe(resetData.userId)
      expect(savedReset.token).toBe(resetData.token)
      expect(savedReset.expiresAt).toEqual(resetData.expiresAt)
      expect(savedReset.createdAt).toBeDefined()
      expect(savedReset.createdAt).toBeInstanceOf(Date)
    })

    it("should fail when userId is missing", async () => {
      const resetData = {
        token: "secure-random-token-123",
        expiresAt: new Date(Date.now() + 3600000),
      }

      const reset = new PasswordReset(resetData)

      await expect(reset.save()).rejects.toThrow()
    })

    it("should fail when token is missing", async () => {
      const resetData = {
        userId: "user123",
        expiresAt: new Date(Date.now() + 3600000),
      }

      const reset = new PasswordReset(resetData)

      await expect(reset.save()).rejects.toThrow()
    })

    it("should fail when expiresAt is missing", async () => {
      const resetData = {
        userId: "user123",
        token: "secure-random-token-123",
      }

      const reset = new PasswordReset(resetData)

      await expect(reset.save()).rejects.toThrow()
    })
  })

  describe("Token Uniqueness", () => {
    it("should enforce unique token constraint", async () => {
      const resetData1 = {
        userId: "user123",
        token: "unique-token-123",
        expiresAt: new Date(Date.now() + 3600000),
      }

      const resetData2 = {
        userId: "user456",
        token: "unique-token-123", // Same token
        expiresAt: new Date(Date.now() + 3600000),
      }

      const reset1 = new PasswordReset(resetData1)
      await reset1.save()

      const reset2 = new PasswordReset(resetData2)
      await expect(reset2.save()).rejects.toThrow()
    })

    it("should allow multiple reset requests for same user with different tokens", async () => {
      const resetData1 = {
        userId: "user123",
        token: "token-1",
        expiresAt: new Date(Date.now() + 3600000),
      }

      const resetData2 = {
        userId: "user123",
        token: "token-2",
        expiresAt: new Date(Date.now() + 3600000),
      }

      const reset1 = new PasswordReset(resetData1)
      const reset2 = new PasswordReset(resetData2)

      await reset1.save()
      await reset2.save()

      const resets = await PasswordReset.find({ userId: "user123" })
      expect(resets).toHaveLength(2)
    })
  })

  describe("Expiry Validation", () => {
    it("should store future expiry dates", async () => {
      const futureDate = new Date(Date.now() + 3600000) // 1 hour from now

      const reset = new PasswordReset({
        userId: "user123",
        token: "token-123",
        expiresAt: futureDate,
      })

      const savedReset = await reset.save()
      expect(savedReset.expiresAt.getTime()).toBe(futureDate.getTime())
    })

    it("should allow past expiry dates (for expired tokens)", async () => {
      const pastDate = new Date(Date.now() - 3600000) // 1 hour ago

      const reset = new PasswordReset({
        userId: "user123",
        token: "expired-token",
        expiresAt: pastDate,
      })

      const savedReset = await reset.save()
      expect(savedReset.expiresAt.getTime()).toBe(pastDate.getTime())
    })
  })

  describe("Indexes", () => {
    it("should have index on token field", async () => {
      const indexes = await PasswordReset.collection.getIndexes()

      expect(indexes).toHaveProperty("token_1")
      expect(indexes.token_1).toEqual([["token", 1]])
    })

    it("should have index on expiresAt field", async () => {
      const indexes = await PasswordReset.collection.getIndexes()

      expect(indexes).toHaveProperty("expiresAt_1")
      expect(indexes.expiresAt_1).toEqual([["expiresAt", 1]])
    })

    it("should have index on userId field", async () => {
      const indexes = await PasswordReset.collection.getIndexes()

      expect(indexes).toHaveProperty("userId_1")
      expect(indexes.userId_1).toEqual([["userId", 1]])
    })
  })

  describe("Query Performance", () => {
    it("should efficiently find reset request by token", async () => {
      const reset = new PasswordReset({
        userId: "user123",
        token: "find-me-token",
        expiresAt: new Date(Date.now() + 3600000),
      })
      await reset.save()

      const found = await PasswordReset.findOne({ token: "find-me-token" })
      expect(found).toBeDefined()
      expect(found?.userId).toBe("user123")
    })

    it("should efficiently find all reset requests by userId", async () => {
      await PasswordReset.create([
        {
          userId: "user123",
          token: "token-1",
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: "user123",
          token: "token-2",
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: "user456",
          token: "token-3",
          expiresAt: new Date(Date.now() + 3600000),
        },
      ])

      const userResets = await PasswordReset.find({ userId: "user123" })
      expect(userResets).toHaveLength(2)
    })

    it("should efficiently find expired tokens", async () => {
      const now = new Date()

      await PasswordReset.create([
        {
          userId: "user1",
          token: "expired-1",
          expiresAt: new Date(now.getTime() - 3600000), // Expired
        },
        {
          userId: "user2",
          token: "valid-1",
          expiresAt: new Date(now.getTime() + 3600000), // Valid
        },
        {
          userId: "user3",
          token: "expired-2",
          expiresAt: new Date(now.getTime() - 7200000), // Expired
        },
      ])

      const expiredResets = await PasswordReset.find({
        expiresAt: { $lt: now },
      })

      expect(expiredResets).toHaveLength(2)
    })
  })
})
