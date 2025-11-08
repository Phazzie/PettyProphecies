import { AuthProvider } from "@/lib/AuthContext"
import { SentryProvider } from "@/components/SentryProvider"
import { Toaster } from "sonner"
import "./globals.css"
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
        <SentryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </SentryProvider>
      </body>
    </html>
  )
}