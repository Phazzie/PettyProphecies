import { useState, useEffect } from "react"

/**
 * Fetches a CSRF token from the server and caches it for use in mutation requests.
 * Include the returned token as the X-CSRF-Token header on all POST/PUT/DELETE requests.
 */
export function useCsrf() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => {
        if (data?.csrfToken) setCsrfToken(data.csrfToken)
      })
      .catch(() => {
        // CSRF token fetch failed; mutations will be rejected by the server
      })
  }, [])

  return csrfToken
}
