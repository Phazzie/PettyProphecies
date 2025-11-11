/**
 * ResetPassword component
 *
 * Allows users to reset their password using a token from email
 * Following existing UI patterns from Login/Register components
 */

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { useApiRequest } from "../hooks/useApiRequest"
import { validatePassword } from "../utils/validation"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"
import { toast } from "sonner"

/**
 * Calculates password strength
 * @param password - Password to evaluate
 * @returns Strength level: "weak", "medium", or "strong"
 */
function getPasswordStrength(password: string): "weak" | "medium" | "strong" {
  if (!password || password.length < 6) return "weak"
  if (password.length < 8) return "weak"

  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length

  if (criteriaCount >= 3 && password.length >= 8) return "strong"
  if (criteriaCount >= 2 && password.length >= 8) return "medium"
  return "weak"
}

/**
 * ResetPassword form component
 * @returns {JSX.Element} The ResetPassword form
 */
export const ResetPassword: React.FC = () => {
  const router = useRouter()
  const { token } = router.query
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [tokenError, setTokenError] = useState("")
  const { request, loading } = useApiRequest<{ message: string }>()
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong">("weak")

  // Check for token on mount
  useEffect(() => {
    if (router.isReady && !token) {
      setTokenError("No reset token found. Please request a new password reset.")
    }
  }, [router.isReady, token])

  /**
   * Handles password input change
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordStrength(getPasswordStrength(value))

    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError("")
    }
  }

  /**
   * Handles confirm password input change
   */
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setConfirmPassword(value)

    // Clear error when user starts typing
    if (confirmPasswordError) {
      setConfirmPasswordError("")
    }
  }

  /**
   * Validates the form
   */
  const validate = (): boolean => {
    let isValid = true

    // Validate password
    if (!password || password.trim() === "") {
      setPasswordError("Password is required")
      isValid = false
    } else if (!validatePassword(password)) {
      setPasswordError(
        "Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one number"
      )
      isValid = false
    }

    // Validate confirm password
    if (!confirmPassword || confirmPassword.trim() === "") {
      setConfirmPasswordError("Please confirm your password")
      isValid = false
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
      isValid = false
    }

    return isValid
  }

  /**
   * Handles form submission
   * @param {React.FormEvent} e - The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error("No reset token found")
      return
    }

    if (validate()) {
      try {
        await request({
          url: "/api/auth/reset-password",
          method: "POST",
          body: {
            token: token as string,
            password,
          },
          onSuccess: () => {
            toast.success("Password reset successful! Redirecting to login...")
            setTimeout(() => {
              router.push("/login")
            }, 1500)
          },
        })
      } catch (err) {
        console.error("Reset password error:", err)
      }
    }
  }

  // Show token error if no token
  if (tokenError) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-red-800">{tokenError}</p>
        </div>
        <button
          onClick={() => router.push("/forgot-password")}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Request New Reset Link
        </button>
      </div>
    )
  }

  const strengthColors = {
    weak: "bg-red-500",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  }

  const strengthWidth = {
    weak: "w-1/3",
    medium: "w-2/3",
    strong: "w-full",
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-labelledby="reset-password-heading"
      role="form"
    >
      <h2 id="reset-password-heading" className="text-xl font-semibold mb-4">
        Reset Password
      </h2>

      <ErrorAnnouncer errors={{ password: passwordError, confirmPassword: confirmPasswordError }} />

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          New Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={password}
          onChange={handlePasswordChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={passwordError ? "true" : "false"}
          aria-describedby={passwordError ? "password-error" : "password-strength"}
        />
        {passwordError && <ErrorMessage id="password-error" message={passwordError} />}

        {/* Password Strength Meter */}
        {password && !passwordError && (
          <div id="password-strength" className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password Strength:</span>
              <span className={`text-xs font-medium ${
                passwordStrength === "strong" ? "text-green-600" :
                passwordStrength === "medium" ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${strengthColors[passwordStrength]} ${strengthWidth[passwordStrength]}`}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={confirmPasswordError ? "true" : "false"}
          aria-describedby={confirmPasswordError ? "confirmPassword-error" : undefined}
        />
        {confirmPasswordError && (
          <ErrorMessage id="confirmPassword-error" message={confirmPasswordError} />
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={loading}
      >
        {loading ? <LoadingSpinner /> : "Reset Password"}
      </button>
    </form>
  )
}
