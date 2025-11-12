import { renderHook, act } from "@testing-library/react"
import { jest } from "@jest/globals"

// Mock dependencies BEFORE importing the hook
jest.mock("@/src/hooks/useCSRFToken", () => ({
  useCSRFToken: () => ({
    csrfToken: "test-token",
    loading: false,
    error: null,
  }),
}))

jest.mock("@/src/utils/apiErrorHandler", () => ({
  handleApiError: jest.fn(),
  ApiError: Error,
}))

jest.mock("@/src/utils/sentry", () => ({
  captureException: jest.fn(),
}))

// Now import after mocks are set up
import { useApiRequest } from "@/src/hooks/useApiRequest"

// Ensure fetch mock is available
const mockFetch = global.fetch as jest.Mock

describe("useApiRequest", () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  test("should make a successful request", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: "test" }),
      })
    )

    const { result } = renderHook(() => useApiRequest())

    await act(async () => {
      const data = await result.current.request({ url: "https://api.example.com" })
      expect(data).toEqual({ data: "test" })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  test("should handle API errors", async () => {
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({}),
      })
    )

    const { result } = renderHook(() => useApiRequest())

    await act(async () => {
      try {
        await result.current.request({ url: "https://api.example.com" })
        // Should not reach here
        expect(true).toBe(false)
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain("HTTP error")
        // Verify status code is properly set
        expect((error as any).status).toBe(404)
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.status).toBe(404)
  })
})

