import { render, screen, fireEvent } from "@testing-library/react"
import ErrorBoundary from "../../components/ErrorBoundary"
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

    expect(screen.getByText("Oops! Something went wrong.")).toBeInTheDocument()
    expect(
      screen.getByText("Don't worry, it's probably just the universe conspiring against you. Again."),
    ).toBeInTheDocument()
  })

  it("allows user to try again", () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorComponent />
      </ErrorBoundary>,
    )

    fireEvent.click(screen.getByText("Try again (if you dare)"))

    rerender(
      <ErrorBoundary>
        <div>Recovered content</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText("Recovered content")).toBeInTheDocument()
  })
})

