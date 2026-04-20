"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useApiRequest } from "../hooks/useApiRequest"
import { validatePassword } from "../utils/validation"
import { LoadingSpinner } from "./LoadingSpinner"
import { ErrorMessage } from "./ErrorMessage"

interface Props {
  onSuccess?: () => void
}

/**
 * ResetPassword component — reads the ?token= query param and lets users set a new password.
 */
export const ResetPassword: React.FC<Props> = ({ onSuccess }) => {
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmError, setConfirmError] = useState("")
  const [success, setSuccess] = useState(false)
  const { request, loading } = useApiRequest<{ message: string }>()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setToken(params.get("token") ?? "")
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")
    setConfirmError("")

    let valid = true
    if (!validatePassword(password)) {
      setPasswordError(
        "That password is pathetic. Need 12+ characters with uppercase, lowercase, numbers, AND special characters (@$!%*?&). Try harder.",
      )
      valid = false
    }
    if (password !== confirm) {
      setConfirmError("Apparently, typing the same thing twice is too challenging for you.")
      valid = false
    }
    if (!valid) return

    try {
      await request({
        url: "/api/auth/reset-password",
        method: "POST",
        body: { token, newPassword: password },
        onSuccess: () => {
          setSuccess(true)
          onSuccess?.()
        },
      })
    } catch {
      // Error handled by useApiRequest
    }
  }

  if (!token) {
    return (
      <div className="text-sm text-red-600" role="alert">
        Invalid reset link. Request a new one — you clearly need more practice clicking links.
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-2" role="status" aria-live="polite">
        <p className="text-sm text-green-600">Password reset successfully. Try not to forget this one.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="reset-heading">
      <h2 id="reset-heading" className="text-xl font-semibold mb-4">
        Reset Password
      </h2>
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          New Password
        </label>
        <input
          type="password"
          id="new-password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={passwordError ? "true" : "false"}
          aria-describedby={passwordError ? "new-password-error" : undefined}
        />
        {passwordError && <ErrorMessage id="new-password-error" message={passwordError} />}
      </div>
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirm-password"
          name="confirmPassword"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={confirmError ? "true" : "false"}
          aria-describedby={confirmError ? "confirm-password-error" : undefined}
        />
        {confirmError && <ErrorMessage id="confirm-password-error" message={confirmError} />}
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
