import { useState, useEffect } from 'react'

export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/auth/csrf', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token')
        }

        const data = await response.json()
        if (data.success && data.data.csrfToken) {
          setCSRFToken(data.data.csrfToken)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [])

  return { csrfToken, loading, error }
}
