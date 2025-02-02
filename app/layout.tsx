import { AuthProvider } from "@/lib/AuthContext"
import "@/styles/globals.css"
import type React from "react"

export const metadata = {
  title: "Passive-Aggressive Tarot",
  description: "Get your daily dose of sass with our tarot readings",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'