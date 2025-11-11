/**
 * API Response Helper Tests
 * Following TDD approach - tests written first
 */
import { createMocks } from "node-mocks-http"
import type { NextApiRequest, NextApiResponse } from "next"
import type { IAPIResponse } from "../../src/interfaces/seams"
import {
  ValidationError,
  AuthenticationError,
} from "../../src/interfaces/seams"

// Import the helpers AFTER defining the tests
import {
  sendSuccess,
  sendError,
  sendPaginated,
} from "../../src/utils/apiResponse"

describe("API Response Helpers", () => {
  describe("sendSuccess", () => {
    it("should send success response with data and default 200 status", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = { userId: "123", username: "testuser" }
      sendSuccess(res, testData)

      expect(res._getStatusCode()).toBe(200)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(testData)
      expect(responseData.timestamp).toBeDefined()
      expect(responseData.error).toBeUndefined()
    })

    it("should send success response with custom status code", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = { id: "new-id" }
      sendSuccess(res, testData, 201)

      expect(res._getStatusCode()).toBe(201)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(testData)
    })

    it("should handle null data", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      sendSuccess(res, null)

      expect(res._getStatusCode()).toBe(200)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(true)
      expect(responseData.data).toBeNull()
    })

    it("should handle undefined data", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      sendSuccess(res, undefined)

      expect(res._getStatusCode()).toBe(200)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(true)
      expect(responseData.data).toBeUndefined()
    })

    it("should handle array data", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ]
      sendSuccess(res, testData)

      expect(res._getStatusCode()).toBe(200)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual(testData)
      expect(Array.isArray(responseData.data)).toBe(true)
    })

    it("should include valid ISO 8601 timestamp", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      sendSuccess(res, { test: "data" })

      const responseData: IAPIResponse = JSON.parse(res._getData())

      const timestamp = new Date(responseData.timestamp)
      expect(timestamp.toISOString()).toBe(responseData.timestamp)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  describe("sendError", () => {
    it("should send error response with ValidationError and default 400 status", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const error = new ValidationError("Invalid email", "email")
      sendError(res, error)

      expect(res._getStatusCode()).toBe(400)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("VALIDATION_ERROR")
      expect(responseData.error?.message).toBe("Invalid email")
      expect(responseData.error?.field).toBe("email")
      expect(responseData.timestamp).toBeDefined()
    })

    it("should send error response with AuthenticationError and default 401 status", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const error = new AuthenticationError("Token expired")
      sendError(res, error)

      expect(res._getStatusCode()).toBe(401)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("AUTHENTICATION_ERROR")
      expect(responseData.error?.message).toBe("Token expired")
    })

    it("should allow overriding status code", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const error = new Error("Custom error")
      sendError(res, error, 503)

      expect(res._getStatusCode()).toBe(503)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("INTERNAL_ERROR")
    })

    it("should handle generic Error with 500 status", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const error = new Error("Something went wrong")
      sendError(res, error)

      expect(res._getStatusCode()).toBe(500)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(false)
      expect(responseData.error?.code).toBe("INTERNAL_ERROR")
    })

    it("should include error details when present", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const error = new ValidationError("Invalid format", "phone", {
        pattern: "\\d{10}",
        provided: "abc",
      })
      sendError(res, error)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.error?.details).toEqual({
        pattern: "\\d{10}",
        provided: "abc",
      })
    })

    it("should not include data field in error responses", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const error = new ValidationError("Error")
      sendError(res, error)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData).not.toHaveProperty("data")
    })
  })

  describe("sendPaginated", () => {
    it("should send paginated response with metadata", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
        { id: 3, name: "Item 3" },
      ]

      sendPaginated(res, testData, 15, 2, 3)

      expect(res._getStatusCode()).toBe(200)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(true)
      expect(responseData.data).toEqual({
        items: testData,
        pagination: {
          total: 15,
          page: 2,
          limit: 3,
          totalPages: 5,
          hasNextPage: true,
          hasPrevPage: true,
        },
      })
    })

    it("should calculate pagination metadata correctly for first page", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = [{ id: 1 }, { id: 2 }]

      sendPaginated(res, testData, 10, 1, 2)

      const responseData: IAPIResponse = JSON.parse(res._getData())
      const pagination = responseData.data?.pagination

      expect(pagination?.page).toBe(1)
      expect(pagination?.totalPages).toBe(5)
      expect(pagination?.hasNextPage).toBe(true)
      expect(pagination?.hasPrevPage).toBe(false)
    })

    it("should calculate pagination metadata correctly for last page", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = [{ id: 9 }, { id: 10 }]

      sendPaginated(res, testData, 10, 5, 2)

      const responseData: IAPIResponse = JSON.parse(res._getData())
      const pagination = responseData.data?.pagination

      expect(pagination?.page).toBe(5)
      expect(pagination?.totalPages).toBe(5)
      expect(pagination?.hasNextPage).toBe(false)
      expect(pagination?.hasPrevPage).toBe(true)
    })

    it("should handle single page of results", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = [{ id: 1 }]

      sendPaginated(res, testData, 1, 1, 10)

      const responseData: IAPIResponse = JSON.parse(res._getData())
      const pagination = responseData.data?.pagination

      expect(pagination?.totalPages).toBe(1)
      expect(pagination?.hasNextPage).toBe(false)
      expect(pagination?.hasPrevPage).toBe(false)
    })

    it("should handle empty results", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      sendPaginated(res, [], 0, 1, 10)

      expect(res._getStatusCode()).toBe(200)
      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.success).toBe(true)
      expect(responseData.data?.items).toEqual([])
      expect(responseData.data?.pagination.total).toBe(0)
      expect(responseData.data?.pagination.totalPages).toBe(0)
      expect(responseData.data?.pagination.hasNextPage).toBe(false)
      expect(responseData.data?.pagination.hasPrevPage).toBe(false)
    })

    it("should calculate totalPages correctly with remainder", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      sendPaginated(res, [], 7, 1, 3)

      const responseData: IAPIResponse = JSON.parse(res._getData())
      const pagination = responseData.data?.pagination

      // 7 items / 3 per page = 3 pages (pages 1, 2, and 3 with 1 item)
      expect(pagination?.totalPages).toBe(3)
    })

    it("should include timestamp", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      sendPaginated(res, [], 0, 1, 10)

      const responseData: IAPIResponse = JSON.parse(res._getData())

      expect(responseData.timestamp).toBeDefined()
      const timestamp = new Date(responseData.timestamp)
      expect(timestamp.toISOString()).toBe(responseData.timestamp)
    })

    it("should handle large datasets", () => {
      const { res } = createMocks<NextApiRequest, NextApiResponse>()

      const testData = Array.from({ length: 100 }, (_, i) => ({ id: i }))

      sendPaginated(res, testData, 1000, 5, 100)

      const responseData: IAPIResponse = JSON.parse(res._getData())
      const pagination = responseData.data?.pagination

      expect(pagination?.total).toBe(1000)
      expect(pagination?.totalPages).toBe(10)
      expect(pagination?.page).toBe(5)
      expect(pagination?.hasNextPage).toBe(true)
      expect(pagination?.hasPrevPage).toBe(true)
    })
  })

  describe("Response Format Consistency", () => {
    it("all success responses should have consistent structure", () => {
      const { res: res1 } = createMocks<NextApiRequest, NextApiResponse>()
      const { res: res2 } = createMocks<NextApiRequest, NextApiResponse>()
      const { res: res3 } = createMocks<NextApiRequest, NextApiResponse>()

      sendSuccess(res1, { test: 1 })
      sendError(res2, new ValidationError("Test"))
      sendPaginated(res3, [], 0, 1, 10)

      const response1: IAPIResponse = JSON.parse(res1._getData())
      const response2: IAPIResponse = JSON.parse(res2._getData())
      const response3: IAPIResponse = JSON.parse(res3._getData())

      // All should have these fields
      expect(response1).toHaveProperty("success")
      expect(response1).toHaveProperty("timestamp")

      expect(response2).toHaveProperty("success")
      expect(response2).toHaveProperty("timestamp")

      expect(response3).toHaveProperty("success")
      expect(response3).toHaveProperty("timestamp")

      // Success responses should have data
      expect(response1.success).toBe(true)
      expect(response1).toHaveProperty("data")
      expect(response1.error).toBeUndefined()

      // Error responses should have error
      expect(response2.success).toBe(false)
      expect(response2).toHaveProperty("error")
      expect(response2.data).toBeUndefined()

      // Paginated responses should have data
      expect(response3.success).toBe(true)
      expect(response3).toHaveProperty("data")
    })
  })
})
