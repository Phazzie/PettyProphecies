import type React from "react"
import { formatDistanceToNow } from "date-fns"

interface ReadingCardProps {
  reading: {
    _id: string
    spreadName: string
    cards: any[]
    interpretation: string
    rating?: number
    createdAt: Date
    aiGenerated: boolean
    userQuestion?: string
  }
  onClick: () => void
}

export const ReadingCard: React.FC<ReadingCardProps> = ({ reading, onClick }) => {
  const formattedDate = formatDistanceToNow(new Date(reading.createdAt), { addSuffix: true })

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const renderStars = (rating?: number) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < rating ? "text-yellow-500" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{reading.spreadName}</h3>
        {reading.aiGenerated && (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full" data-testid="ai-badge">
            AI Generated
          </span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{formattedDate}</p>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          {reading.cards.length} {reading.cards.length === 1 ? "card" : "cards"}
        </p>

        {reading.rating && (
          <div className="flex items-center gap-2">
            {renderStars(reading.rating)}
            <span className="text-sm text-gray-600 dark:text-gray-400">({reading.rating}/5)</span>
          </div>
        )}
      </div>

      {reading.userQuestion && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Question: <span className="font-normal italic">{reading.userQuestion}</span>
          </p>
        </div>
      )}

      <p className="text-gray-700 dark:text-gray-300 mb-4">{truncateText(reading.interpretation)}</p>

      <button
        onClick={onClick}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
      >
        View Details
      </button>
    </div>
  )
}
