import type React from "react"
import { useEffect, useState } from "react"

interface ErrorAnnouncerProps {
  errors: Record<string, string>
}

export const ErrorAnnouncer: React.FC<ErrorAnnouncerProps> = ({ errors }) => {
  const [announcement, setAnnouncement] = useState("")

  useEffect(() => {
    const errorMessages = Object.values(errors).filter(Boolean)
    if (errorMessages.length > 0) {
      setAnnouncement(errorMessages.join(". "))
    } else {
      setAnnouncement("")
    }
  }, [errors])

  return (
    <div aria-live="polite" className="sr-only" role="status">
      {announcement}
    </div>
  )
}

