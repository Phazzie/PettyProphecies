export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = "AppError"
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error
  }
  if (error instanceof Error) {
    return new AppError("UNKNOWN_ERROR", error.message)
  }
  return new AppError("UNKNOWN_ERROR", "An unknown error occurred")
}

