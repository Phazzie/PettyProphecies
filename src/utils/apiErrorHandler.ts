import { toast } from "react-toastify"
import { captureException } from "./sentry"

export interface ApiError extends Error {
  status?: number
}

export const handleApiError = (error: ApiError) => {
  console.error("API Error:", error)
  captureException(error)

  let message = "An error occurred. The universe must really have it out for you."

  if (error.status === 401) {
    message = "Unauthorized. Did you forget your own password? Typical."
  } else if (error.status === 404) {
    message = "Not found. It probably saw you coming and ran away."
  } else if (error.status >= 500) {
    message = "Server error. Even our servers are having a bad day because of you."
  }

  toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  })
}

