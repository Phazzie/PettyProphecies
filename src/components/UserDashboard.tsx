import type React from "react"
import { useState, useEffect } from "react"
import type { IReading } from "../models/Reading"
import { LoadingSpinner } from "./LoadingSpinner"

/**
 * UserDashboard component displays a user's past tarot readings
 * @returns {JSX.Element} The UserDashboard component
 */
export const UserDashboard: React.FC = () => {
  const [readings, setReadings] = useState<IReading[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchReadings(currentPage)
  }, [currentPage])

  /**
   * Fetches readings for the current page
   * @param {number} page - The page number to fetch
   */
  const fetchReadings = async (page: number) => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/user/readings?page=${page}`)

      if (response.ok) {
        const data = await response.json()
        setReadings(data.readings)
        setTotalPages(data.totalPages)
      } else {
        setError("Failed to fetch readings")
      }
    } catch (err) {
      setError("An error occurred while fetching readings")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Your Past Readings</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="large" />
        </div>
      ) : readings.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">
          You haven&apos;t had any readings yet. Maybe you&apos;re avoiding the truth?
        </p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {readings.map((reading) => (
              <li key={reading._id?.toString()} className="py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{reading.spreadName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(reading.createdAt).toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{reading.interpretation}</p>
                  </div>
                  {reading.rating && (
                    <div className="mt-2 md:mt-0 flex items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">Rating:</span>
                      {[1, 2, 3, 4, 5].map((value) => (
                        <svg
                          key={value}
                          className={`w-4 h-4 ${value <= reading.rating! ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

