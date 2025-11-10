import { render, screen } from "@testing-library/react"
import { ErrorBoundary } from "../../components/ErrorBoundary"
import { jest } from "@jest/globals"

// Mock console.error to avoid cluttering test output
console.error = jest.fn()

const ErrorComponent = () => {
  throw new Error("Test error")
}

describe("ErrorBoundary", () => {
  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText("Test content")).toBeInTheDocument()
  })

  it("renders error message when there is an error", () => {
    render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByText("Something went wrong. Please try refreshing the page.")).toBeInTheDocument()
  })
})

