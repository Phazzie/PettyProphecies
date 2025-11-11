# Critical Test Examples - Quick Start Guide

## 1. Main Auth Endpoint Tests (HIGHEST PRIORITY)

**File:** `__tests__/api/auth/main-auth.test.ts`
**Coverage Target:** `/src/pages/api/auth/[...auth].ts` (currently 0%)

### Test Structure

```typescript
/**
 * Tests for Main Authentication Endpoint
 * /api/auth/[...auth] - Handles login, register, logout, verify, csrf
 */

import { createMocks } from 'node-mocks-http'
import type { NextApiRequest, NextApiResponse } from 'next'
import handler from '@/src/pages/api/auth/[...auth]'
import { User } from '@/src/models/User'

// Mock dependencies
jest.mock('@/src/utils/database')
jest.mock('@/src/middleware/rateLimit.v2')
jest.mock('@/src/middleware/csrf')
jest.mock('@/src/services/email')

describe('POST /api/auth/login', () => {
  it('should login with valid credentials and set httpOnly cookie', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      query: { auth: ['login'] },
      body: {
        email: 'test@example.com',
        password: 'password123'
      },
      headers: {
        'x-csrf-token': 'valid-token'
      }
    })

    // Mock user exists and password is correct
    const mockUser = {
      _id: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      password: '$2a$10$...' // hashed
    }
    User.findOne = jest.fn().mockResolvedValue(mockUser)
    
    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const cookies = res._getHeaders()['set-cookie']
    expect(cookies).toContain('auth-token=')
    expect(cookies).toContain('HttpOnly')
    expect(cookies).toContain('Secure')
  })

  it('should reject invalid credentials with 401', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { auth: ['login'] },
      body: {
        email: 'test@example.com',
        password: 'wrongpassword'
      }
    })

    User.findOne = jest.fn().mockResolvedValue(null)

    await handler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toMatchObject({
      error: expect.objectContaining({
        code: 'AuthenticationError'
      })
    })
  })

  it('should enforce rate limiting on login', async () => {
    // Mock rate limiter to deny request
    const mockRateLimiter = require('@/src/middleware/rateLimit.v2')
    mockRateLimiter.getRateLimiter().checkLimit.mockResolvedValue({
      allowed: false,
      retryAfter: 300
    })

    const { req, res } = createMocks({
      method: 'POST',
      query: { auth: ['login'] },
      body: { email: 'test@example.com', password: 'pass' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(429)
    expect(res._getHeaders()['retry-after']).toBeDefined()
  })
})

describe('POST /api/auth/register', () => {
  it('should create new user and send welcome email', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { auth: ['register'] },
      body: {
        username: 'newuser',
        email: 'new@example.com',
        password: 'securepass123'
      }
    })

    const mockEmailService = require('@/src/services/email')
    mockEmailService.emailService.sendWelcome = jest.fn()

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(mockEmailService.emailService.sendWelcome).toHaveBeenCalledWith(
      'new@example.com',
      'newuser'
    )
  })

  it('should reject duplicate email with 409', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { auth: ['register'] },
      body: {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'pass123'
      }
    })

    // Mock existing user
    const mockUserRepo = require('@/src/repositories/UserRepository')
    mockUserRepo.UserRepository.prototype.findByEmail = jest.fn()
      .mockResolvedValue({ email: 'existing@example.com' })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(409)
  })
})

describe('GET /api/auth/verify', () => {
  it('should return user data for valid token', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { auth: ['verify'] },
      headers: {
        cookie: 'auth-token=valid.jwt.token'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toMatchObject({
      authenticated: true,
      user: expect.objectContaining({
        id: expect.any(String),
        username: expect.any(String),
        email: expect.any(String)
      })
    })
  })

  it('should return not authenticated for invalid token', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { auth: ['verify'] }
      // No cookie
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toMatchObject({
      authenticated: false,
      user: null
    })
  })
})

describe('POST /api/auth/logout', () => {
  it('should clear auth cookie', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      query: { auth: ['logout'] }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const cookies = res._getHeaders()['set-cookie']
    expect(cookies).toContain('Max-Age=0')
  })
})
```

## 2. User Model Tests (CRITICAL)

**File:** `__tests__/models/User.test.ts`
**Coverage Target:** `/src/models/User.ts` (currently 0%)

```typescript
import mongoose from 'mongoose'
import { User } from '@/src/models/User'
import { connectToDatabase } from '@/src/utils/database'

describe('User Model', () => {
  beforeAll(async () => {
    await connectToDatabase()
  })

  afterAll(async () => {
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    await User.deleteMany({})
  })

  describe('Password Hashing', () => {
    it('should hash password on save', async () => {
      const plainPassword = 'mypassword123'
      const user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: plainPassword
      })

      await user.save()

      // Password should be hashed
      expect(user.password).not.toBe(plainPassword)
      expect(user.password).toMatch(/^\$2[aby]\$/)  // bcrypt pattern
      expect(user.password.length).toBeGreaterThan(50)
    })

    it('should NOT rehash password if not modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })

      const originalHash = user.password
      
      // Modify non-password field
      user.username = 'modifieduser'
      await user.save()

      // Hash should remain the same
      expect(user.password).toBe(originalHash)
    })

    it('should rehash password when password is modified', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'oldpassword'
      })

      const oldHash = user.password
      
      user.password = 'newpassword'
      await user.save()

      expect(user.password).not.toBe(oldHash)
      expect(user.password).toMatch(/^\$2[aby]\$/)
    })
  })

  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'correctpassword'
      })

      const isMatch = await user.comparePassword('correctpassword')
      expect(isMatch).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'correctpassword'
      })

      const isMatch = await user.comparePassword('wrongpassword')
      expect(isMatch).toBe(false)
    })
  })

  describe('Validation', () => {
    it('should require username', async () => {
      const user = new User({
        email: 'test@example.com',
        password: 'password123'
        // username missing
      })

      await expect(user.save()).rejects.toThrow(/username/)
    })

    it('should require email', async () => {
      const user = new User({
        username: 'testuser',
        password: 'password123'
        // email missing
      })

      await expect(user.save()).rejects.toThrow(/email/)
    })

    it('should require password', async () => {
      const user = new User({
        username: 'testuser',
        email: 'test@example.com'
        // password missing
      })

      await expect(user.save()).rejects.toThrow(/password/)
    })

    it('should enforce unique email', async () => {
      await User.create({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'pass123'
      })

      const duplicate = new User({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'pass123'
      })

      await expect(duplicate.save()).rejects.toThrow(/duplicate/)
    })

    it('should enforce unique username', async () => {
      await User.create({
        username: 'duplicateuser',
        email: 'user1@example.com',
        password: 'pass123'
      })

      const duplicate = new User({
        username: 'duplicateuser',
        email: 'user2@example.com',
        password: 'pass123'
      })

      await expect(duplicate.save()).rejects.toThrow(/duplicate/)
    })
  })

  describe('Timestamps', () => {
    it('should set createdAt on creation', async () => {
      const user = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'pass123'
      })

      expect(user.createdAt).toBeInstanceOf(Date)
      expect(user.createdAt.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })
})
```

## 3. User Readings Endpoint Tests (HIGH PRIORITY)

**File:** `__tests__/api/user/readings.test.ts`
**Coverage Target:** `/src/pages/api/user/readings.ts` (currently 0%)

```typescript
import { createMocks } from 'node-mocks-http'
import handler from '@/src/pages/api/user/readings'
import { ReadingRepository } from '@/src/repositories/ReadingRepository'

jest.mock('@/src/repositories/ReadingRepository')
jest.mock('@/src/models/Reading')

describe('GET /api/user/readings', () => {
  it('should return paginated readings for authenticated user', async () => {
    const mockReadings = [
      { _id: '1', userId: 'user123', interpretation: 'Reading 1' },
      { _id: '2', userId: 'user123', interpretation: 'Reading 2' }
    ]

    ReadingRepository.prototype.findByUserId = jest.fn()
      .mockResolvedValue(mockReadings)
    
    const Reading = require('@/src/models/Reading').Reading
    Reading.countDocuments = jest.fn().mockResolvedValue(25)

    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1' }
    })
    req.userId = 'user123'

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data).toMatchObject({
      data: mockReadings,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3
      }
    })
  })

  it('should handle empty results', async () => {
    ReadingRepository.prototype.findByUserId = jest.fn()
      .mockResolvedValue([])
    
    const Reading = require('@/src/models/Reading').Reading
    Reading.countDocuments = jest.fn().mockResolvedValue(0)

    const { req, res } = createMocks({
      method: 'GET',
      query: { page: '1' }
    })
    req.userId = 'user123'

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.data).toEqual([])
    expect(data.pagination.total).toBe(0)
  })

  it('should reject non-GET methods', async () => {
    const { req, res } = createMocks({
      method: 'POST'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
  })
})
```

## Quick Command Reference

```bash
# Run tests for specific file
npm test -- __tests__/api/auth/main-auth.test.ts

# Run with coverage
npm test -- --coverage __tests__/models/User.test.ts

# Watch mode for development
npm test -- --watch __tests__/api/user/readings.test.ts

# Run all tests
npm test

# Generate coverage report
npm test -- --coverage
```

## Priority Order for Implementation

1. **Fix failing tests** (4 hours)
   - Fix logger mock in error handler tests
   - Fix RateLimitError resetAt property
   - Fix integration test mocks

2. **Main auth endpoint** (6 hours)
   - Creates `__tests__/api/auth/main-auth.test.ts`
   - Covers login, register, logout, verify

3. **User model** (4 hours)
   - Creates `__tests__/models/User.test.ts`
   - Tests password hashing and validation

4. **User readings endpoint** (3 hours)
   - Creates `__tests__/api/user/readings.test.ts`
   - Tests pagination and authentication

5. **Hook tests** (6 hours)
   - useFormValidation
   - useFocusError
   - useCSRFToken

**Total Time to Critical Coverage: ~23 hours**
