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

    const result = await apiRequest<{ message: string }>("/api/test")
    expect(result).toEqual(mockData)
  })

  it("should use cached data for repeated requests", async () => {
    const mockData = { message: "Cached" }
    fetchMock.mockResponseOnce(JSON.stringify(mockData))

    await apiRequest<{ message: string }>("/api/test")
    const result = await apiRequest<{ message: string }>("/api/test")

    expect(result).toEqual(mockData)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("should throw an error for failed requests", async () => {
    fetchMock.mockRejectOnce(new Error("API Error"))

    await expect(apiRequest("/api/test")).rejects.toThrow("API Error")
  })
})

