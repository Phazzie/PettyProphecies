import React from "react"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateSpreadSelection } from "../utils/validation"
import { spreads } from "../data/tarotSpreads"
import { toast } from "react-toastify"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"

interface ReadingResponse {
  interpretation: string
  readingId: string
}

export const TarotReading: React.FC = () => {
  const { values, errors, isValid, handleChange, validateForm } = useFormValidation(
    { spread: "" },
    { spread: validateSpreadSelection },
  )
  const { request, loading } = useApiRequest<ReadingResponse>()
  const [reading, setReading] = React.useState<ReadingResponse | null>(null)
  const [rating, setRating] = React.useState<number | null>(null)

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
          onSuccess: (data) => {
            setReading(data)
            toast.info("Your reading is ready. Brace yourself for the truth... or whatever this is.")
          },
        })
      } catch (err) {
        console.error("Error getting tarot reading:", err)
      }
    }
  }

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
        onSuccess: () => {
          setRating(value)
          toast.success("Rating submitted. Your opinion has been duly noted and promptly ignored.")
        },
      })
    } catch (err) {
      console.error("Error updating rating:", err)
    }
  }

  return (
    <div className="space-y-6">
      <ErrorAnnouncer errors={errors} />
      <h2 className="text-2xl font-bold">Get Your Passive-Aggressive Tarot Reading</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="spread" className="block text-sm font-medium text-gray-700">
            Choose a Spread
          </label>
          <select
            id="spread"
            name="spread"
            value={values.spread}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            aria-invalid={errors.spread ? "true" : "false"}
            aria-describedby="spread-error"
          >
            <option value="">Select a spread</option>
            {spreads.map((spread) => (
              <option key={spread.name} value={spread.name}>
                {spread.name}
              </option>
            ))}
          </select>
          {errors.spread && <ErrorMessage message={errors.spread} />}
        </div>
        <button
          type="submit"
          disabled={!isValid || loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner /> : "Get Reading"}
        </button>
      </form>
      {reading && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Your Passive-Aggressive Tarot Reading</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>{reading.interpretation}</p>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700">Rate this reading:</p>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleRating(value)}
                    className={`mr-1 p-1 rounded-full ${
                      rating && value <= rating ? "text-yellow-400" : "text-gray-300"
                    } hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
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

