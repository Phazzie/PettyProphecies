import { useState, useCallback, useRef, useEffect } from "react"
import { ApiError, handleApiError } from "../utils/apiErrorHandler"
import { useCSRFToken } from "./useCSRFToken"

interface ApiRequestOptions<T> {
  url: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: any
  headers?: Record<string, string>
  onSuccess?: (data: T) => void
}

export const useApiRequest = <T>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { csrfToken } = useCSRFToken();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function to abort ongoing requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const request = useCallback(async ({
    url,
    method = 'GET',
    body,
    headers = {},
    onSuccess
  }: ApiRequestOptions<T>) => {
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // Include cookies for authentication
        signal, // Add abort signal
      });

      if (!response.ok) {
        const error = new Error(`HTTP error! status: ${response.status}`) as ApiError;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (e) {
      // Don't set error state if request was aborted
      if ((e as Error).name === 'AbortError') {
        return;
      }

      const apiError = e as ApiError;
      // Ensure error has a status code
      if (!apiError.status) {
        apiError.status = 500;
      }
      setError(apiError);
      handleApiError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [csrfToken]);

  return { request, loading, error };
};

