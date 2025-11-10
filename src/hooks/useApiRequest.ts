import { useState, useCallback } from "react"
import { ApiError, handleApiError } from "../utils/apiErrorHandler"

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

  const request = useCallback(async ({
    url,
    method = 'GET',
    body,
    headers = {},
    onSuccess
  }: ApiRequestOptions<T>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
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
  }, []);

  return { request, loading, error };
};

