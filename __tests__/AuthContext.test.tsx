import { render, act, waitFor } from "@testing-library/react"
import { AuthProvider, useAuth } from "@/lib/AuthContext"

// Mock fetch for session verification and logout
global.fetch = jest.fn()

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock failed session verification by default
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false })
    })
  })

  it("provides authentication state and methods", async () => {
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

    // Wait for initial session verification to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify', {
        credentials: 'include'
      })
    })

    expect(authState.isAuthenticated).toBe(false)
    expect(authState.user).toBe(null)
    expect(typeof authState.login).toBe("function")
    expect(typeof authState.logout).toBe("function")

    // Test login with user object
    const testUser = {
      id: "123",
      username: "testuser",
      email: "test@example.com"
    }

    act(() => {
      authState.login(testUser)
    })

    expect(authState.isAuthenticated).toBe(true)
    expect(authState.user).toEqual(testUser)

    // Mock logout endpoint
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    })

    // Test logout
    await act(async () => {
      await authState.logout()
    })

    expect(authState.isAuthenticated).toBe(false)
    expect(authState.user).toBe(null)
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
  })
})

