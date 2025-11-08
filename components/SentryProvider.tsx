"use client"

import { useEffect } from "react"
import { initSentry } from "@/src/utils/sentry"

export function SentryProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initSentry()
  }, [])

  return <>{children}</>
}
