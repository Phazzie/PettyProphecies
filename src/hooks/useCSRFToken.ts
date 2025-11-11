import { useState, useEffect } from 'react'

// Module-level cache to prevent re-fetching across component instances
let cachedToken: string | null = null
let cachedTokenTimestamp: number = 0
let pendingTokenRequest: Promise<string> | null = null
const CACHE_DURATION_MS = 3600000 // 1 hour (same as server-side token expiry)

/**
 * Fetch CSRF token with caching to prevent redundant requests
 * Only fetches if cache is expired or empty
 */
async function fetchCSRFToken(): Promise<string> {
  const now = Date.now()

  // Return cached token if still valid
  if (cachedToken && now - cachedTokenTimestamp < CACHE_DURATION_MS) {
    return cachedToken
  }

  // If a request is already pending, wait for it instead of making a new one
  if (pendingTokenRequest) {
    return pendingTokenRequest
  }

  // Create new request and store it to prevent duplicate concurrent requests
  pendingTokenRequest = (async () => {
    try {
      const response = await fetch('/api/auth/csrf', {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token')
      }

      const data = await response.json()
      if (data.success && data.data.csrfToken) {
        cachedToken = data.data.csrfToken
        cachedTokenTimestamp = Date.now()
        return cachedToken
      }

      throw new Error('Invalid CSRF token response')
    } finally {
      // Clear pending request so future calls can make new requests if needed
      pendingTokenRequest = null
    }
  })()

  return pendingTokenRequest
}

/**
 * Hook to access CSRF token with automatic caching
 * Fetches once and reuses across all component instances for 1 hour
 */
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(cachedToken)
  const [loading, setLoading] = useState(!cachedToken)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If we already have a cached token, use it immediately
    if (cachedToken) {
      setCSRFToken(cachedToken)
      setLoading(false)
      return
    }

    // Otherwise fetch it
    const loadToken = async () => {
      try {
        const token = await fetchCSRFToken()
        setCSRFToken(token)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadToken()
  }, [])

  return { csrfToken, loading, error }
}
