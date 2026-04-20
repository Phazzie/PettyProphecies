"use client"

import type React from "react"
import { useState } from "react"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateEmail } from "../utils/validation"
import { LoadingSpinner } from "./LoadingSpinner"
import { ErrorMessage } from "./ErrorMessage"

interface Props {
  onBack?: () => void
}

/**
 * ForgotPassword component — lets users request a password reset link.
 */
export const ForgotPassword: React.FC<Props> = ({ onBack }) => {
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const { request, loading } = useApiRequest<{ message: string }>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError("")

    if (!validateEmail(email)) {
      setEmailError("Wow, an invalid email. You must be new to the internet.")
      return
    }

    try {
      await request({
        url: "/api/auth/forgot-password",
        method: "POST",
        body: { email },
      })
      setSubmitted(true)
    } catch {
      // The endpoint always returns 200; error here means network issue
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          If that email exists in our system, you&apos;ll receive a reset link shortly. Check your inbox.
          Or your spam folder. You know what you did.
        </p>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
          >
            Back to login
          </button>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="forgot-heading">
      <h2 id="forgot-heading" className="text-xl font-semibold mb-4">
        Forgot Password
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Can&apos;t remember your password? Shocking. Enter your email and we&apos;ll send you a reset link.
      </p>
      <div>
        <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          type="email"
          id="forgot-email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "forgot-email-error" : undefined}
        />
        {emailError && <ErrorMessage id="forgot-email-error" message={emailError} />}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={loading}
      >
        {loading ? <LoadingSpinner /> : "Send Reset Link"}
      </button>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-full text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
        >
          Back to login
        </button>
      )}
    </form>
  )
}
