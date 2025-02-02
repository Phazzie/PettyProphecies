import { renderHook, act } from "@testing-library/react-hooks"
import { useApiRequest } from "@/hooks/useApiRequest"
import { AppError } from "@/lib/errorHandler"
import { jest } from "@jest/globals" // Added import for jest

// Mock fetch
global.fetch = jest.fn()

// Mock toast
jest.mock("react-toastify", () => ({
  toast: {
    error: jest.fn(),
  },
}))

describe("useApiRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("should make a successful request", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    })

    const { result } = renderHook(() => useApiRequest())

    await act(async () => {
      const data = await result.current.request({ url: "https://api.example.com" })
      expect(data).toEqual({ data: "test" })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  test("should handle API errors", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { result } = renderHook(() => useApiRequest())

    await act(async () => {
      try {
        await result.current.request({ url: "https://api.example.com" })
      } catch (error) {
        expect(error).toBeInstanceOf(AppError)
        expect((error as AppError).code).toBe("API_ERROR")
      }
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeInstanceOf(AppError)
  })
})

