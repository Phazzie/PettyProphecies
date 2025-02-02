import type React from "react"

interface ErrorPageProps {
  error: Error | null
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Oops! Something went wrong.</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't worry, it's probably just the universe conspiring against you. Again.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error details (as if you'd understand):</h3>
                <div className="mt-2 text-sm text-red-700">
                  {error ? error.message : "Unknown error. How mysterious."}
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={() => (window.location.href = "/")}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go back home (if you can handle it)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage

