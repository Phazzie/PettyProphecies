import { useRouter } from "next/router"
import { useAuth } from "../contexts/AuthContext"
import type React from "react" // Added import for React

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  return <>{children}</>
}

