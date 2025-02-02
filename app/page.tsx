"use client"

import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Login } from "../components/Login"
import { Register } from "../components/Register"
import { TarotReading } from "../components/TarotReading"
import { UserDashboard } from "../components/UserDashboard"
import { ProtectedRoute } from "../components/ProtectedRoute"

export default function Home() {
  const { isAuthenticated, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<"reading" | "dashboard">("reading")

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Passive-Aggressive Tarot</h1>
          {isAuthenticated ? (
            <ProtectedRoute>
              <div className="mb-6">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setActiveTab("reading")}
                    className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                      activeTab === "reading"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Get Reading
                  </button>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`px-4 py-2 rounded-full transition-colors duration-200 ${
                      activeTab === "dashboard"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    Past Readings
                  </button>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                {activeTab === "reading" ? <TarotReading /> : <UserDashboard />}
              </div>
              <button
                onClick={logout}
                className="mt-6 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                Logout
              </button>
            </ProtectedRoute>
          ) : (
            <div className="space-y-6">
              <Login />
              <div className="text-center">
                <span className="text-gray-600">Don't have an account?</span>
              </div>
              <Register />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

