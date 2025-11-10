import { renderHook, act } from "@testing-library/react"
import { useApiRequest } from "@/src/hooks/useApiRequest"
import { jest } from "@jest/globals"

// Mock fetch
global.fetch = jest.fn()

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

