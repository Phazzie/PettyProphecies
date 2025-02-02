import { describe, test, expect, beforeAll, afterAll, jest } from "@jest/globals"
import mongoose from "mongoose"
import { createMocks } from "node-mocks-http"
import authHandler from "../../src/pages/api/auth/[...auth]"
import { User } from "../../src/models/User"

jest.mock("../../src/utils/database")
jest.mock("../../src/middleware/rateLimit", () => ({
  rateLimitMiddleware: jest.fn((handler) => handler),
}))

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI as string)
})

afterAll(async () => {
  await mongoose.connection.close()
})

describe("Authentication API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("POST /api/auth/register - successful registration", async () => {
    const { req, res } = createMocks({
      method: "POST",
      query: {
        auth: "register",
      },
      body: {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      },
    })

    await authHandler(req, res)

    expect(res._getStatusCode()).toBe(201)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        message: "User registered successfully",
      }),
    )
  })

  test("POST /api/auth/login - successful login", async () => {
    const mockUser = {
      _id: "mockUserId",
      email: "test@example.com",
      comparePassword: jest.fn().mockResolvedValue(true),
    }
    jest.spyOn(User, "findOne").mockResolvedValue(mockUser as any)

    const { req, res } = createMocks({
      method: "POST",
      query: {
        auth: "login",
      },
      body: {
        email: "test@example.com",
        password: "password123",
      },
    })

    await authHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toHaveProperty("token")
  })

  test("POST /api/auth/login - invalid credentials", async () => {
    jest.spyOn(User, "findOne").mockResolvedValue(null)

    const { req, res } = createMocks({
      method: "POST",
      query: {
        auth: "login",
      },
      body: {
        email: "nonexistent@example.com",
        password: "wrongpassword",
      },
    })

    await authHandler(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        error: {
          message: "Invalid credentials",
          code: "AuthenticationError",
        },
      }),
    )
  })

  test("GET /api/auth/logout - successful logout", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {
        auth: "logout",
      },
    })

    await authHandler(req, res)

    expect(res._getStatusCode()).toBe(200)
    expect(JSON.parse(res._getData())).toEqual({
      message: "Logged out successfully",
    })
  })
})

