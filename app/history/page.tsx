"use client"

import { ProtectedRoute } from "@/src/components/ProtectedRoute"
import { ReadingHistory } from "@/src/components/ReadingHistory"

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <ReadingHistory />
      </div>
    </ProtectedRoute>
  )
}
