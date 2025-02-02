import type React from "react"
import { useState, useEffect } from "react"
import type { IReading } from "../models/Reading"

export const UserDashboard: React.FC = () => {
  const [readings, setReadings] = useState<IReading[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchReadings(currentPage)
  }, [currentPage])

  const fetchReadings = async (page: number) => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/user/readings?page=${page}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Past Readings</h2>
      {error && <p className="text-red-500">{error}</p>}
      {isLoading ? (
        <p>Loading your cosmic history...</p>
      ) : readings.length === 0 ? (
        <p>You haven't had any readings yet. Maybe you're avoiding the truth?</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {readings.map((reading) => (
              <li key={reading._id} className="py-4">
                <div className="flex space-x-3">
                  <div className="flex-1 space-y-1">
                    <h3 className="text-lg font-medium">{reading.spreadName}</h3>
                    <p className="text-sm text-gray-500">{new Date(reading.createdAt).toLocaleString()}</p>
                    <p className="text-sm">{reading.interpretation}</p>
                    {reading.rating && (
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-1">Rating:</span>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <svg
                            key={value}
                            className={`w-4 h-4 ${value <= reading.rating! ? "text-yellow-400" : "text-gray-300"}`}
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
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

