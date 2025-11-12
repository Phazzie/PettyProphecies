import { createMocks } from "node-mocks-http"
import { errorHandler } from "../../src/middleware/errorHandler"
import { ApiError, ValidationError, AuthenticationError, DatabaseError } from "../../src/types/errors"
import logger from "../../src/utils/logger"

jest.mock("../../src/utils/logger", () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

describe("Error Handler Middleware", () => {
  it("should handle ApiError correctly", async () => {
    const { req, res } = createMocks()
    const handler = jest.fn().mockRejectedValue(new ApiError(400, "Bad Request"))

    await errorHandler(handler)(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        message: "Bad Request",
        code: "ApiError",
      },
    })
    expect(logger.error).toHaveBeenCalled()
  })

  it("should handle ValidationError correctly", async () => {
    const { req, res } = createMocks()
    const handler = jest.fn().mockRejectedValue(new ValidationError("Invalid input"))

    await errorHandler(handler)(req, res)

    expect(res._getStatusCode()).toBe(400)
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        message: "Invalid input",
        code: "ValidationError",
      },
    })
    expect(logger.error).toHaveBeenCalled()
  })

  it("should handle AuthenticationError correctly", async () => {
    const { req, res } = createMocks()
    const handler = jest.fn().mockRejectedValue(new AuthenticationError("Unauthorized"))

    await errorHandler(handler)(req, res)

    expect(res._getStatusCode()).toBe(401)
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        message: "Unauthorized",
        code: "AuthenticationError",
      },
    })
    expect(logger.error).toHaveBeenCalled()
  })

  it("should handle DatabaseError correctly", async () => {
    const { req, res } = createMocks()
    const handler = jest.fn().mockRejectedValue(new DatabaseError("Database connection failed"))

    await errorHandler(handler)(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        message: "Database connection failed",
        code: "DatabaseError",
      },
    })
    expect(logger.error).toHaveBeenCalled()
  })

  it("should handle unexpected errors correctly", async () => {
    const { req, res } = createMocks()
    const handler = jest.fn().mockRejectedValue(new Error("Unexpected error"))

    await errorHandler(handler)(req, res)

    expect(res._getStatusCode()).toBe(500)
    expect(JSON.parse(res._getData())).toEqual({
      error: {
        message: "An unexpected error occurred",
        code: "InternalServerError",
      },
    })
    expect(logger.error).toHaveBeenCalled()
  })
})

