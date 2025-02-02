import type React from "react"
import { useState } from "react"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateSpreadSelection } from "../utils/validation"
import { spreads } from "../data/tarotSpreads"
import { toast } from "react-toastify"
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
}

/**
 * TarotReading component
 * Allows users to select a tarot spread and receive a passive-aggressive reading
 */
export const TarotReading: React.FC = () => {
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

  /**
   * Handles form submission to get a new tarot reading
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      try {
        const data = await request({
          url: "/api/tarot-reading",
          method: "POST",
          body: { spreadName: values.spread },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        setReading(data)
        toast.info(getPassiveAggressiveMessage("reading"))
      } catch (err) {
        console.error("Error getting tarot reading:", err)
      }
    }
  }

  /**
   * Handles rating submission for a reading
   * @param value - Rating value (1-5)
   */
  const handleRating = async (value: number) => {
    if (!reading) return

    try {
      await request({
        url: "/api/tarot-reading",
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: { readingId: reading.readingId, rating: value },
      })
      setRating(value)
      toast.success("Rating submitted. Your opinion has been duly noted and promptly ignored.")
    } catch (err) {
      console.error("Error updating rating:", err)
    }
  }

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
            {spreads.map((spread) => (
              <option key={spread.name} value={spread.name}>
                {spread.name}
              </option>
            ))}
          </select>
          {errors.spread && <ErrorMessage id="spread-error" message={errors.spread} />}
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
          <h3 className="text-xl font-semibold mb-4">Your Passive-Aggressive Tarot Reading</h3>
          <p className="text-lg mb-6">{reading.interpretation}</p>
          <div>
            <p className="text-sm font-medium mb-2">Rate this reading:</p>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => handleRating(value)}
                  className={`mr-1 p-1 rounded-full ${
                    rating && value <= rating ? "text-yellow-400" : "text-gray-400"
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

