import { AuthProvider } from "@/lib/AuthContext"
import { SentryProvider } from "@/components/SentryProvider"
import { SkipLinks } from "@/components/SkipLinks"
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
        <SkipLinks />
        <SentryProvider>
          <AuthProvider>
            <main id="main-content">
              {children}
            </main>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </SentryProvider>
      </body>
    </html>
  )
}