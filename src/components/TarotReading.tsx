import React, { useState, useCallback, useMemo } from "react"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateSpreadSelection } from "../utils/validation"
import { spreads } from "../data/tarotSpreads"
import { toast } from "sonner"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"
import { getPassiveAggressiveMessage } from "../utils/passiveAggressiveMessages"

/**
 * Interface for the response from the tarot reading API
 */
interface ReadingResponse {
  interpretation: string
  readingId: string
  aiGenerated?: boolean
  modelInfo?: {
    available: boolean
    model: string
    provider: string
  }
}

/**
 * TarotReading component
 * Allows users to select a tarot spread and receive a passive-aggressive reading
 */
const TarotReadingComponent: React.FC = () => {
  // Form validation hook
  const { values, errors, isValid, handleChange, validateForm } = useFormValidation(
    { spread: "" },
    { spread: validateSpreadSelection },
  )

  // API request hook
  const { request, loading } = useApiRequest<ReadingResponse>()

  // State for storing the current reading and its rating
  const [reading, setReading] = useState<ReadingResponse | null>(null)
  const [rating, setRating] = useState<number | null>(null)

  // State for AI toggle - default to true if AI is available
  const [useAI, setUseAI] = useState<boolean>(() => {
    // Check if AI is available via environment variable
    return typeof window !== "undefined" && process.env.NEXT_PUBLIC_XAI_AVAILABLE === "true"
  })

  /**
   * Handles AI checkbox change
   */
  const handleAIChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setUseAI(e.target.checked)
  }, [])

  /**
   * Memoize spread options to prevent recreation on every render
   */
  const spreadOptions = useMemo(() =>
    spreads.map((spread) => (
      <option key={spread.name} value={spread.name}>
        {spread.name}
      </option>
    )), [])

  /**
   * Handles form submission to get a new tarot reading
   * @param e - Form submission event
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      try {
        const data = await request({
          url: "/api/tarot-reading",
          method: "POST",
          body: {
            spreadName: values.spread,
            useAI,
          },
        })
        setReading(data)
        toast.info(getPassiveAggressiveMessage("reading"))
      } catch (err) {
        console.error("Error getting tarot reading:", err)
      }
    }
  }, [validateForm, request, values.spread, useAI])

  /**
   * Handles rating submission for a reading
   * @param value - Rating value (1-5)
   */
  const handleRating = useCallback(async (value: number) => {
    if (!reading) return

    try {
      await request({
        url: "/api/tarot-reading",
        method: "PUT",
        body: { readingId: reading.readingId, rating: value },
      })
      setRating(value)
      toast.success("Rating submitted. Your opinion has been duly noted and promptly ignored.")
    } catch (err) {
      console.error("Error updating rating:", err)
    }
  }, [reading, request])

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Get Your Passive-Aggressive Tarot Reading</h2>
      <ErrorAnnouncer errors={errors} />
      <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="tarot-reading-form">
        <div>
          <label htmlFor="spread" className="block text-sm font-medium mb-1">
            Choose a Spread
          </label>
          <select
            id="spread"
            name="spread"
            value={values.spread}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            aria-invalid={errors.spread ? "true" : "false"}
            aria-describedby={errors.spread ? "spread-error" : undefined}
          >
            <option value="">Select a spread</option>
            {spreadOptions}
          </select>
          {errors.spread && <ErrorMessage id="spread-error" message={errors.spread} />}
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useAI"
            checked={useAI}
            onChange={handleAIChange}
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            aria-describedby="useAI-description"
          />
          <label htmlFor="useAI" className="text-sm font-medium">
            Use AI Reading
          </label>
          <span id="useAI-description" className="text-xs text-gray-500 dark:text-gray-600">
            (Powered by xAI Grok)
          </span>
        </div>
        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          aria-busy={loading}
        >
          {loading ? <LoadingSpinner /> : "Get Reading"}
        </button>
      </form>
      {reading && (
        <div className="mt-8 bg-gray-100 dark:bg-gray-700 rounded-lg p-6" aria-live="polite">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Your Passive-Aggressive Tarot Reading</h3>
            {reading.aiGenerated && reading.modelInfo && (
              <div className="flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900 px-3 py-1 rounded-full">
                <svg
                  className="w-4 h-4 text-indigo-600 dark:text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                  Generated by AI ({reading.modelInfo.provider})
                </span>
              </div>
            )}
          </div>
          <p className="text-lg mb-6">{reading.interpretation}</p>
          <div>
            <p className="text-sm font-medium mb-2">Rate this reading:</p>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRating(value)}
                  className={`mr-1 p-1 rounded-full ${
                    rating && value <= rating ? "text-yellow-400" : "text-gray-600"
                  } hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200`}
                  aria-label={`Rate ${value} star${value !== 1 ? "s" : ""}`}
                  aria-pressed={rating === value}
                >
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const TarotReading = React.memo(TarotReadingComponent)

