"use client"

import type React from "react"
import { createContext, useState, useContext, useEffect } from "react"

interface User {
  id: string
  username: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Verify session on mount by calling an endpoint
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data.user) {
            setUser(data.data.user)
          }
        }
      } catch (error) {
        console.error('Session verification failed:', error)
      }
    }
    verifySession()
  }, [])

  const login = (user: User) => {
    setUser(user)
    // No localStorage! Auth is in httpOnly cookie
  }

  const logout = async () => {
    // Call logout API to clear httpOnly cookie
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout failed:', error)
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

