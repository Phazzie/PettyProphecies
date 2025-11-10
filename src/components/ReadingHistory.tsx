import type React from "react"
import { useState, useEffect } from "react"
import { useApiRequest } from "../hooks/useApiRequest"
import { ReadingCard } from "./ReadingCard"
import { LoadingSpinner } from "./LoadingSpinner"

interface Reading {
  _id: string
  spreadName: string
  cards: any[]
  interpretation: string
  rating?: number
  createdAt: Date
  aiGenerated: boolean
  userQuestion?: string
}

interface ReadingsResponse {
  readings: Reading[]
  page: number
  totalPages: number
  total: number
}

export const ReadingHistory: React.FC = () => {
  const [readings, setReadings] = useState<Reading[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedReadingId, setExpandedReadingId] = useState<string | null>(null)
  const { request, loading, error } = useApiRequest<ReadingsResponse>()

  useEffect(() => {
    fetchReadings(currentPage)
  }, [currentPage])

  const fetchReadings = async (page: number) => {
    try {
      const token = localStorage.getItem("token")
      const data = await request({
        url: `/api/readings?page=${page}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setReadings(data.readings)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error("Failed to fetch readings:", err)
    }
  }

  const handleReadingClick = (readingId: string) => {
    setExpandedReadingId(expandedReadingId === readingId ? null : readingId)
  }

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (loading && readings.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <p className="font-semibold">Error loading readings</p>
          <p>{error.message || "Failed to fetch your reading history. Please try again later."}</p>
        </div>
      </div>
    )
  }

  if (readings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No readings yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't created any tarot readings yet. Start your first reading to see your history here.
          </p>
          <a
            href="/tarot"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Get Your First Reading
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Your Reading History</h1>

      <div className="space-y-6">
        {readings.map((reading) => (
          <div key={reading._id}>
            <ReadingCard reading={reading} onClick={() => handleReadingClick(reading._id)} />
            {expandedReadingId === reading._id && (
              <div className="mt-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Full Interpretation</h4>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reading.interpretation}</p>

                <div className="mt-4">
                  <h5 className="text-md font-semibold text-gray-900 dark:text-white mb-2">Cards</h5>
                  <div className="flex flex-wrap gap-2">
                    {reading.cards.map((card, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                      >
                        {typeof card === "string" ? card : card.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 0}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <span className="text-gray-700 dark:text-gray-300">
            Page {currentPage + 1} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
