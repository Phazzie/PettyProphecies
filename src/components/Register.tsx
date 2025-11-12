import React, { useCallback } from "react"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateEmail, validatePassword, validateUsername } from "../utils/validation"
import { toast } from "sonner"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"
import { getPassiveAggressiveMessage } from "../utils/passiveAggressiveMessages"
import { useAuth } from "../../lib/AuthContext"

// V2 API response structure
interface RegisterResponse {
  success: boolean
  data: {
    message: string
    user: {
      id: string
      username: string
      email: string
    }
  }
}

/**
 * Register component for user registration
 * @returns {JSX.Element} The Register form
 */
const RegisterComponent: React.FC = () => {
  // Auth context (v2 cookie-based)
  const { login } = useAuth()

  // Form validation hook
  const { values, errors, isValid, handleChange, validateForm } = useFormValidation(
    { username: "", email: "", password: "", confirmPassword: "" },
    {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
      confirmPassword: (value) => value === values.password,
    },
  )

  // API request hook with v2 response type
  const { request, loading } = useApiRequest<RegisterResponse>()

  /**
   * Handles form submission
   * @param {React.FormEvent} e - The form event
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      try {
        await request({
          url: "/api/auth/register",
          method: "POST",
          body: {
            username: values.username,
            email: values.email,
            password: values.password,
          },
          onSuccess: (response) => {
            // V2: Response contains user data, auth is handled by httpOnly cookies
            if (response.success && response.data.user) {
              login(response.data.user)
              toast.success(getPassiveAggressiveMessage("register"))
            }
          },
        })
      } catch (err) {
        console.error("Registration error:", err)
      }
    }
  }, [validateForm, request, values.username, values.email, values.password, login])

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="register-heading">
      <h2 id="register-heading" className="text-xl font-semibold mb-4">
        Register
      </h2>
      <ErrorAnnouncer errors={errors} />
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={values.username}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={errors.username ? "true" : "false"}
          aria-describedby={errors.username ? "username-error" : undefined}
        />
        {errors.username && <ErrorMessage id="username-error" message={errors.username} />}
      </div>
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
      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={values.confirmPassword}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          aria-invalid={errors.confirmPassword ? "true" : "false"}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
        />
        {errors.confirmPassword && <ErrorMessage id="confirmPassword-error" message={errors.confirmPassword} />}
      </div>
      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={loading}
      >
        {loading ? <LoadingSpinner /> : "Register"}
      </button>
    </form>
  )
}

export const Register = React.memo(RegisterComponent)

