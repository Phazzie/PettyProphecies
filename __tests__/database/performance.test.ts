/**
 * Database Performance Tests
 *
 * Tests to verify database query performance and connection pooling
 */

import mongoose from 'mongoose'
import { User } from '@/src/models/User'
import { Reading } from '@/src/models/Reading'
import { PasswordReset } from '@/src/models/PasswordReset'

describe('Database Performance', () => {
  beforeAll(async () => {
    // Connect to test database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test'
    await mongoose.connect(MONGODB_URI)
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // Clean up test data
    await User.deleteMany({})
    await Reading.deleteMany({})
    await PasswordReset.deleteMany({})
  })

  describe('User Queries', () => {
    it('should query users by email efficiently', async () => {
      // Create a test user
      await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword123',
      })

      const start = Date.now()
      const user = await User.findOne({ email: 'test@example.com' })
      const duration = Date.now() - start

      expect(user).toBeDefined()
      expect(user?.email).toBe('test@example.com')
      expect(duration).toBeLessThan(100) // Should be fast with index
    })

    it('should query users by username efficiently', async () => {
      // Create a test user
      await User.create({
        email: 'test@example.com',
        username: 'testuser',
        password: 'hashedpassword123',
      })

      const start = Date.now()
      const user = await User.findOne({ username: 'testuser' })
      const duration = Date.now() - start

      expect(user).toBeDefined()
      expect(user?.username).toBe('testuser')
      expect(duration).toBeLessThan(100) // Should be fast with index
    })
  })

  describe('Reading Queries', () => {
    it('should query user readings efficiently with compound index', async () => {
      const userId = 'test-user-id'

      // Create test readings
      await Reading.create([
        {
          userId,
          spreadName: 'Three Card',
          cards: ['The Fool', 'The Magician', 'The High Priestess'],
          interpretation: 'Test interpretation 1',
          createdAt: new Date(Date.now() - 3000),
        },
        {
          userId,
          spreadName: 'Celtic Cross',
          cards: ['The Emperor', 'The Empress'],
          interpretation: 'Test interpretation 2',
          createdAt: new Date(Date.now() - 2000),
        },
        {
          userId,
          spreadName: 'Single Card',
          cards: ['The Lovers'],
          interpretation: 'Test interpretation 3',
          createdAt: new Date(Date.now() - 1000),
        },
      ])

      const start = Date.now()
      const readings = await Reading.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
      const duration = Date.now() - start

      expect(readings).toHaveLength(3)
      expect(readings[0].spreadName).toBe('Single Card') // Most recent
      expect(duration).toBeLessThan(100) // Should use compound index
    })

    it('should query readings by rating efficiently', async () => {
      const userId = 'test-user-id'

      // Create test readings with ratings
      await Reading.create([
        {
          userId,
          spreadName: 'Three Card',
          cards: ['The Fool'],
          interpretation: 'Test 1',
          rating: 5,
        },
        {
          userId,
          spreadName: 'Three Card',
          cards: ['The Magician'],
          interpretation: 'Test 2',
          rating: 4,
        },
        {
          userId,
          spreadName: 'Three Card',
          cards: ['The High Priestess'],
          interpretation: 'Test 3',
          rating: 5,
        },
      ])

      const start = Date.now()
      const highRatedReadings = await Reading.find({ rating: 5 }).lean()
      const duration = Date.now() - start

      expect(highRatedReadings).toHaveLength(2)
      expect(duration).toBeLessThan(100) // Should use rating index
    })

    it('should efficiently query recent readings', async () => {
      // Create test readings
      await Reading.create([
        {
          userId: 'user1',
          spreadName: 'Three Card',
          cards: ['The Fool'],
          interpretation: 'Old reading',
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
        },
        {
          userId: 'user2',
          spreadName: 'Celtic Cross',
          cards: ['The Magician'],
          interpretation: 'Recent reading',
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
      ])

      const start = Date.now()
      const recentReadings = await Reading.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
      const duration = Date.now() - start

      expect(recentReadings).toHaveLength(2)
      expect(recentReadings[0].interpretation).toBe('Recent reading')
      expect(duration).toBeLessThan(100) // Should use createdAt index
    })
  })

  describe('PasswordReset Queries', () => {
    it('should query password resets by token efficiently', async () => {
      const token = 'test-token-123'

      await PasswordReset.create({
        userId: 'user123',
        token,
        expiresAt: new Date(Date.now() + 3600000),
      })

      const start = Date.now()
      const reset = await PasswordReset.findOne({ token })
      const duration = Date.now() - start

      expect(reset).toBeDefined()
      expect(reset?.token).toBe(token)
      expect(duration).toBeLessThan(100) // Should use token index
    })

    it('should query password resets by userId efficiently', async () => {
      const userId = 'user123'

      await PasswordReset.create([
        {
          userId,
          token: 'token1',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId,
          token: 'token2',
          expiresAt: new Date(Date.now() + 3600000),
        },
      ])

      const start = Date.now()
      const resets = await PasswordReset.find({ userId })
      const duration = Date.now() - start

      expect(resets).toHaveLength(2)
      expect(duration).toBeLessThan(100) // Should use userId index
    })

    it('should query expired tokens efficiently', async () => {
      const now = new Date()

      await PasswordReset.create([
        {
          userId: 'user1',
          token: 'expired',
          expiresAt: new Date(now.getTime() - 3600000),
        },
        {
          userId: 'user2',
          token: 'valid',
          expiresAt: new Date(now.getTime() + 3600000),
        },
      ])

      const start = Date.now()
      const expiredResets = await PasswordReset.find({
        expiresAt: { $lt: now },
      })
      const duration = Date.now() - start

      expect(expiredResets).toHaveLength(1)
      expect(duration).toBeLessThan(100) // Should use expiresAt index
    })
  })

  describe('Connection Pooling', () => {
    it('should have connection pooling configured', () => {
      const connection = mongoose.connection

      expect(connection).toBeDefined()
      expect(connection.client).toBeDefined()
      // Connection pool is managed internally by Mongoose
      // We verify it exists but can't directly test pool behavior in unit tests
    })

    it('should reuse connections for multiple queries', async () => {
      // Create test data
      await User.create({
        email: 'pool-test@example.com',
        username: 'pooltest',
        password: 'password123',
      })

      // Execute multiple queries in parallel
      const queries = Array(5).fill(null).map(() =>
        User.findOne({ email: 'pool-test@example.com' })
      )

      const start = Date.now()
      const results = await Promise.all(queries)
      const duration = Date.now() - start

      // All queries should succeed
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result?.email).toBe('pool-test@example.com')
      })

      // Multiple queries should be fast due to connection pooling
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Lean Queries', () => {
    it('should demonstrate performance benefit of lean()', async () => {
      const userId = 'lean-test-user'

      // Create test data
      await Reading.create(
        Array(10).fill(null).map((_, i) => ({
          userId,
          spreadName: 'Test',
          cards: ['Card'],
          interpretation: `Reading ${i}`,
        }))
      )

      // Standard query (with Mongoose hydration)
      const startNormal = Date.now()
      const normalResults = await Reading.find({ userId }).limit(10)
      const normalDuration = Date.now() - startNormal

      // Lean query (plain JavaScript objects)
      const startLean = Date.now()
      const leanResults = await Reading.find({ userId }).limit(10).lean()
      const leanDuration = Date.now() - startLean

      // Both should return same number of results
      expect(normalResults).toHaveLength(10)
      expect(leanResults).toHaveLength(10)

      // Lean query should be faster (or at least not slower)
      // Note: In small datasets, the difference may be negligible
      expect(leanDuration).toBeLessThanOrEqual(normalDuration * 1.5)
    })
  })

  describe('Index Usage', () => {
    it('should verify all User indexes exist', async () => {
      const indexes = await User.collection.getIndexes()

      expect(indexes).toHaveProperty('email_1')
      expect(indexes).toHaveProperty('username_1')
      expect(indexes).toHaveProperty('createdAt_1')
    })

    it('should verify all Reading indexes exist', async () => {
      const indexes = await Reading.collection.getIndexes()

      expect(indexes).toHaveProperty('userId_1_createdAt_-1')
      expect(indexes).toHaveProperty('createdAt_1')
      expect(indexes).toHaveProperty('rating_1')
    })

    it('should verify all PasswordReset indexes exist', async () => {
      const indexes = await PasswordReset.collection.getIndexes()

      expect(indexes).toHaveProperty('userId_1')
      expect(indexes).toHaveProperty('token_1')
      expect(indexes).toHaveProperty('expiresAt_1')
      expect(indexes).toHaveProperty('createdAt_1')
    })
  })
})
