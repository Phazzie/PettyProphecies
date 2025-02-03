import { AppError, handleApiError } from "@/lib/errorHandler"

describe("errorHandler", () => {
  test("AppError should be created with code and message", () => {
    const error = new AppError("TEST_ERROR", "Test error message")
    expect(error.code).toBe("TEST_ERROR")
    expect(error.message).toBe("Test error message")
  })

  test("handleApiError should return AppError for AppError input", () => {
    const originalError = new AppError("TEST_ERROR", "Test error message")
    const handledError = handleApiError(originalError)
    expect(handledError).toBe(originalError)
  })

  test("handleApiError should create AppError for Error input", () => {
    const originalError = new Error("Test error message")
    const handledError = handleApiError(originalError)
    expect(handledError).toBeInstanceOf(AppError)
    expect(handledError.code).toBe("UNKNOWN_ERROR")
    expect(handledError.message).toBe("Test error message")
  })

  test("handleApiError should create AppError for unknown input", () => {
    const handledError = handleApiError("Not an error")
    expect(handledError).toBeInstanceOf(AppError)
    expect(handledError.code).toBe("UNKNOWN_ERROR")
    expect(handledError.message).toBe("An unknown error occurred")
  })
})

