import type React from "react"

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "medium" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  }

  return (
    <div className="flex justify-center items-center" role="status">
      <div className={`animate-spin rounded-full border-b-2 border-white ${sizeClasses[size]}`}></div>
      <span className="sr-only">Loading...</span>
    </div>
  )
}

