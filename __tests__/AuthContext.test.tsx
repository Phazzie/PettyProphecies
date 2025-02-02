import { render, act } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/lib/AuthContext"

describe("AuthContext", () => {
  it("provides authentication state and methods", () => {
    let authState: any

    const TestComponent = () => {
      authState = useAuth()
      return null
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    )

    expect(authState.isAuthenticated).toBe(false)
    expect(typeof authState.login).toBe("function")
    expect(typeof authState.logout).toBe("function")

    act(() => {
      authState.login("test-token")
    })

    expect(authState.isAuthenticated).toBe(true)

    act(() => {
      authState.logout()
    })

    expect(authState.isAuthenticated).toBe(false)
  })
})

