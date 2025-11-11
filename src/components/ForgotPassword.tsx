/**
 * ForgotPassword component
 *
 * Allows users to request a password reset email
 * Following existing UI patterns from Login/Register components
 */

import type React from "react"
import { useState } from "react"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateEmail } from "../utils/validation"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"

/**
 * ForgotPassword form component
 * @returns {JSX.Element} The ForgotPassword form
 */
export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const { request, loading } = useApiRequest<{ message: string }>()
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  /**
   * Handles email input change
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("")
    }
  }

  /**
   * Validates the form
   */
  const validate = (): boolean => {
    if (!email || email.trim() === "") {
      setEmailError("Email is required")
      return false
    }

    if (!validateEmail(email)) {
      setEmailError("Invalid email format")
      return false
    }

    return true
  }

  /**
   * Handles form submission
   * @param {React.FormEvent} e - The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validate()) {
      setSuccess(false)
      setSuccessMessage("")

      try {
        await request({
          url: "/api/auth/forgot-password",
          method: "POST",
          body: { email },
          onSuccess: (data) => {
            setSuccess(true)
            setSuccessMessage(
              "If that email exists, we've sent reset instructions. Check your spam folder if you don't see it. We know you will."
            )
            // Clear the form
            setEmail("")
          },
        })
      } catch (err) {
        console.error("Forgot password error:", err)
        setSuccess(false)
      }
    }
  }

  const isValid = !emailError && email.trim() !== ""

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      aria-labelledby="forgot-password-heading"
      role="form"
    >
      <h2 id="forgot-password-heading" className="text-xl font-semibold mb-4">
        Forgot Password
      </h2>

      <ErrorAnnouncer errors={{ email: emailError }} />

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={handleEmailChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "email-error" : undefined}
        />
        {emailError && <ErrorMessage id="email-error" message={emailError} />}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={loading}
      >
        {loading ? <LoadingSpinner /> : "Send Reset Link"}
      </button>

      {success && successMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md" role="status" aria-live="polite">
          <p className="text-green-800 text-sm">{successMessage}</p>
        </div>
      )}
    </form>
  )
}
