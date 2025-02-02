import type React from "react"
import { useAuth } from "../contexts/AuthContext"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateEmail, validatePassword } from "../utils/validation"
import { toast } from "react-toastify"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"
import { useState } from "react"
import { useFocusError } from "../hooks/useFocusError"

export const Login: React.FC = () => {
  const { login } = useAuth()
  const { values, errors, isValid, handleChange, validateForm } = useFormValidation(
    { email: "", password: "" },
    { email: validateEmail, password: validatePassword },
  )
  const { request, loading } = useApiRequest<{ token: string }>()
  const [success, setSuccess] = useState(false)

  const errorRef = useFocusError(Object.values(errors).find(Boolean) || null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      setSuccess(false)
      try {
        const data = await request({
          url: "/api/auth/login",
          method: "POST",
          body: values,
          onSuccess: (data) => {
            login(data.token)
            toast.success("Welcome back. Try not to mess things up this time.")
            setSuccess(true)
          },
        })
      } catch (err) {
        console.error("Login error:", err)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          aria-describedby="email-error"
        />
        {errors.email && <ErrorMessage message={errors.email} ref={errorRef} />}
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
          aria-describedby="password-error"
        />
        {errors.password && <ErrorMessage message={errors.password} />}
      </div>
      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? <LoadingSpinner /> : "Login"}
      </button>
      {success && <div className="mt-4 text-green-600">Login successful. Redirecting...</div>}
    </form>
  )
}

