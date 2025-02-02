import { useEffect, useRef } from "react"

export const useFocusError = (error: string | null) => {
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  return errorRef
}

