import type { AppProps } from "next/app"
import { AuthProvider } from "../contexts/AuthContext"
import ErrorBoundary from "../components/ErrorBoundary"
import "../styles/globals.css"
import { initSentry } from "../utils/sentry"
import { useEffect } from "react"

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    initSentry()
  }, [])

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default MyApp

