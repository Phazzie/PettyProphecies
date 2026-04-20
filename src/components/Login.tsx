import type React from "react"
import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateEmail, validatePassword } from "../utils/validation"
import { toast } from "sonner"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"
import { getPassiveAggressiveMessage } from "../utils/passiveAggressiveMessages"
import { ForgotPassword } from "./ForgotPassword"

/**
 * Login component for user authentication
 * @returns {JSX.Element} The Login form
 */
export const Login: React.FC = () => {
  const { login } = useAuth()
  const { values, errors, isValid, handleChange, validateForm } = useFormValidation(
    { email: "", password: "" },
    { email: validateEmail, password: validatePassword },
  )
  const { request, loading } = useApiRequest<{ message: string }>()
  const [success, setSuccess] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // const errorRef = useFocusError(Object.values(errors).find(Boolean) || null)

  /**
   * Handles form submission
   * @param {React.FormEvent} e - The form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setSuccess(false)
      try {
        await request({
          url: "/api/auth/login",
          method: "POST",
          body: values,
          onSuccess: () => {
            login()
            toast.success(getPassiveAggressiveMessage("login"))
            setSuccess(true)
          },
        })
      } catch (err) {
        console.error("Login error:", err)
      }
    }
  }

  return (
    <>
      {showForgotPassword ? (
        <ForgotPassword onBack={() => setShowForgotPassword(false)} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="login-heading">
          <h2 id="login-heading" className="text-xl font-semibold mb-4">
            Login
          </h2>
          <ErrorAnnouncer errors={errors} />
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && <ErrorMessage id="email-error" message={errors.email} />}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && <ErrorMessage id="password-error" message={errors.password} />}
          </div>
          <button
            type="submit"
            disabled={!isValid || loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-busy={loading}
          >
            {loading ? <LoadingSpinner /> : "Login"}
          </button>
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="w-full text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 text-center"
          >
            Forgot your password? Again?
          </button>
          {success && (
            <div className="mt-4 text-green-600" role="status" aria-live="polite">
              Login successful. Redirecting...
            </div>
          )}
        </form>
      )}
    </>
  )
}

