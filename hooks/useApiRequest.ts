import { AppError } from "@/lib/errorHandler"

interface ApiRequestOptions<T> {
  url: string
  method?: "GET" | "POST" | "PUT" | "DELETE"
  body?: any
  headers?: Record<string, string>
  onSuccess?: (data: T) => void
}

export const useApiRequest = <T>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

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
        throw new AppError('API_ERROR', `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (e) {
      const appError = handleApiError(e);
      setError(appError);
      toast.error(`An error occurred: ${appError.message}`);
      throw appError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
};

