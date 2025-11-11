import { Component, type ErrorInfo, type ReactNode } from "react"
import * as Sentry from "@sentry/nextjs"
import ErrorPage from "./ErrorPage"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Capture error to Sentry with React context
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    })
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use ErrorPage
      return this.props.fallback || <ErrorPage error={this.state.error} />
    }

    return this.props.children
  }
}

export default ErrorBoundary

