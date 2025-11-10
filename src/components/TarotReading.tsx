import type React from "react"
import { useState } from "react"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateSpreadSelection } from "../utils/validation"
import { spreads } from "../data/tarotSpreads"
import { toast } from "sonner"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"
import { getPassiveAggressiveMessage } from "../utils/passiveAggressiveMessages"
import { TarotCardPlaceholder } from "./TarotCardPlaceholder"
import { CardBack } from "./CardBack"
import { QuestionInput } from "./QuestionInput"
import type { TarotCard } from "../data/tarotCards"

/**
 * Interface for a card in a reading with position and reversal info
 */
interface ReadingCard {
  id: number
  name: string
  position: string
  isReversed: boolean
}

/**
 * Interface for the response from the tarot reading API
 */
interface ReadingResponse {
  reading: ReadingCard[]
  interpretation: string
  readingId: string
  aiGenerated?: boolean
}

/**
 * TarotReading component
 * Allows users to select a tarot spread and receive a passive-aggressive reading
 * with visual card displays, loading states, and error handling
 */
export const TarotReading: React.FC = () => {
  // Form validation hook
  const { values, errors, isValid, handleChange, validateForm } = useFormValidation(
    { spread: "" },
    { spread: validateSpreadSelection },
  )

  // API request hook
  const { request, loading, error } = useApiRequest<ReadingResponse>()

  // State for storing the current reading, question, and rating
  const [reading, setReading] = useState<ReadingResponse | null>(null)
  const [question, setQuestion] = useState("")
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
          body: {
            spreadName: values.spread,
            question: question || undefined,
          },
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
   * Handles retry after an error
   */
  const handleRetry = () => {
    // Clear error and retry the last request
    handleSubmit(new Event("submit") as any)
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

  /**
   * Get the selected spread for card count
   */
  const selectedSpread = spreads.find((s) => s.name === values.spread)
  const cardCount = selectedSpread?.positions.length || 5

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Get Your Passive-Aggressive Tarot Reading</h2>
      <ErrorAnnouncer errors={errors} />

      <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="tarot-reading-form">
        <QuestionInput
          value={question}
          onChange={setQuestion}
          disabled={loading}
        />

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
            disabled={loading}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Loading State */}
      {loading && (
        <div className="mt-8" aria-live="polite">
          <p className="text-center text-lg font-medium mb-6 text-indigo-600 dark:text-indigo-400">
            Drawing cards...
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array(cardCount)
              .fill(null)
              .map((_, index) => (
                <div key={index} className="animate-pulse">
                  <CardBack />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mt-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-lg p-6" role="alert">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-300 font-medium">
                Oops! The cards are being difficult.
              </p>
              <p className="text-red-700 dark:text-red-400 mt-1">
                {error.message || "Something went wrong. Maybe the universe is telling you to try again?"}
              </p>
            </div>
          </div>
          <button
            onClick={handleRetry}
            className="mt-4 w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Reading Display */}
      {reading && !loading && (
        <div className="mt-8 space-y-6" aria-live="polite">
          {/* AI/Template Indicator Badge */}
          <div className="flex justify-center">
            {reading.aiGenerated ? (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-medium shadow-lg">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
                AI-Powered Reading
              </span>
            ) : (
              <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-lg">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Template Reading
              </span>
            )}
          </div>

          {/* Card Display */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {reading.reading.map((card, index) => (
              <div key={index} className="reading-card">
                <TarotCardPlaceholder
                  name={card.name}
                  number={card.id}
                  description={card.position}
                  isReversed={card.isReversed}
                />
              </div>
            ))}
          </div>

          {/* Interpretation */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Your Passive-Aggressive Tarot Reading</h3>
            <p className="text-lg mb-6 whitespace-pre-line">{reading.interpretation}</p>

            {/* Rating */}
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
        </div>
      )}
    </div>
  )
}

