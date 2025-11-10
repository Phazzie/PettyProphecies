import { apiRequest } from "../../src/utils/api"
import fetchMock from "jest-fetch-mock"

fetchMock.enableMocks()

describe("apiRequest", () => {
  beforeEach(() => {
    fetchMock.resetMocks()
  })

  it("should make a successful API request", async () => {
    const mockData = { message: "Success" }
    fetchMock.mockResponseOnce(JSON.stringify(mockData))

    const result = await apiRequest<{ message: string }>("/api/test1")
    expect(result).toEqual(mockData)
  })

  it("should use cached data for repeated requests", async () => {
    const mockData = { message: "Success" }
    fetchMock.mockResponseOnce(JSON.stringify(mockData))

    // First call - should fetch from API
    const result1 = await apiRequest<{ message: string }>("/api/test2")
    // Second call - should return cached data
    const result2 = await apiRequest<{ message: string }>("/api/test2")

    expect(result1).toEqual(mockData)
    expect(result2).toEqual(mockData)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("should throw an error for failed requests", async () => {
    fetchMock.mockResponseOnce("", { status: 500 })

    await expect(apiRequest("/api/test3")).rejects.toThrow("HTTP error! status: 500")
  })
})
