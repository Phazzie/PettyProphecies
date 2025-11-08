import { toast } from "sonner"
import { captureException } from "./sentry"

export interface ApiError extends Error {
  status?: number
}

export const handleApiError = (error: ApiError) => {
  console.error("API Error:", error)
  captureException(error)

  let message = "An error occurred. The universe must really have it out for you."

  const status = error.status || 500
  if (status === 401) {
    message = "Unauthorized. Did you forget your own password? Typical."
  } else if (status === 404) {
    message = "Not found. It probably saw you coming and ran away."
  } else if (status >= 500) {
    message = "Server error. Even our servers are having a bad day because of you."
  }

  toast.error(message, {
    duration: 5000,
  })
}

