import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary component to catch and handle errors in child components
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  /**
   * Update state so the next render will show the fallback UI
   * @param {Error} error - The error that was caught
   * @returns {State} The new state
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  /**
   * Log the error to an error reporting service
   * @param {Error} error - The error that was caught
   * @param {ErrorInfo} errorInfo - Additional information about the error
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
    // Here you would log the error to an error reporting service
    // For example: logErrorToService(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Oops! Something went wrong.</h1>
            <p className="text-gray-700 mb-4">
              Don't worry, it's probably just the universe conspiring against you. Again.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition duration-200"
            >
              Try again (if you dare)
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

