import { toast } from "react-toastify"

/**
 * Represents a cached item with its data and expiry time
 */
interface CacheItem<T> {
  data: T
  expiry: number
}

// In-memory cache object
const cache: { [key: string]: CacheItem<any> } = {}

/**
 * Makes an API request with caching capabilities
 * @template T The expected return type of the API request
 * @param {string} url - The URL to make the request to
 * @param {RequestInit} options - Fetch options for the request
 * @param {number} cacheTime - Time in milliseconds to cache the response (default: 5 minutes)
 * @returns {Promise<T>} The response data
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  cacheTime: number = 5 * 60 * 1000, // 5 minutes default cache time
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`
  const cachedItem = cache[cacheKey]

  // Return cached data if it exists and hasn't expired
  if (cachedItem && cachedItem.expiry > Date.now()) {
    return cachedItem.data
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Cache the response
    cache[cacheKey] = {
      data,
      expiry: Date.now() + cacheTime,
    }

    return data
  } catch (error) {
    console.error("API request failed:", error)
    toast.error("Failed to fetch data. The universe is clearly against us.")
    throw error
  }
}

