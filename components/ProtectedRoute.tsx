"use client"

import { useAuth } from "@/lib/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type React from "react" // Added import for React

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

