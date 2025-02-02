import "../styles/globals.css"
import { AuthProvider } from "../contexts/AuthContext"
import ErrorBoundary from "../components/ErrorBoundary"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Inter } from "next/font/google"
import { SkipLink } from "../components/SkipLink"
import type React from "react" // Added import for React

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <ErrorBoundary>
          <AuthProvider>
            <SkipLink href="#main-content">Skip to main content</SkipLink>
            <div className="min-h-screen flex flex-col">
              <header className="bg-indigo-600 text-white p-4">
                <div className="container mx-auto">
                  <h1 className="text-2xl font-bold">Passive-Aggressive Tarot</h1>
                </div>
              </header>
              <main id="main-content" className="flex-grow container mx-auto px-4 py-8">
                {children}
              </main>
              <footer className="bg-gray-200 dark:bg-gray-800 p-4 mt-8">
                <div className="container mx-auto text-center text-sm">
                  &copy; {new Date().getFullYear()} Passive-Aggressive Tarot. All rights reserved (not that you'd care).
                </div>
              </footer>
            </div>
            <ToastContainer position="bottom-right" />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}



import './globals.css'