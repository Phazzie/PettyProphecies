import type React from "react"
import { useFormValidation } from "../hooks/useFormValidation"
import { useApiRequest } from "../hooks/useApiRequest"
import { validateEmail, validatePassword, validateUsername } from "../utils/validation"
import { toast } from "react-toastify"
import { ErrorAnnouncer } from "./ErrorAnnouncer"
import { ErrorMessage } from "./ErrorMessage"
import { LoadingSpinner } from "./LoadingSpinner"

export const Register: React.FC = () => {
  const { values, errors, isValid, handleChange, validateForm } = useFormValidation(
    { username: "", email: "", password: "", confirmPassword: "" },
    {
      username: validateUsername,
      email: validateEmail,
      password: validatePassword,
      confirmPassword: (value) => value === values.password,
    },
  )
  const { request, loading } = useApiRequest<{ message: string }>()

  const handleSubmit = async (e: React.FormEvent) => {
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
          onSuccess: () => {
            toast.success("Registration successful. Brace yourself for disappointment.")
          },
        })
      } catch (err) {
        console.error("Registration error:", err)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          aria-describedby="username-error"
        />
        {errors.username && <ErrorMessage message={errors.username} />}
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
          aria-describedby="email-error"
        />
        {errors.email && <ErrorMessage message={errors.email} />}
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
          aria-describedby="confirmPassword-error"
        />
        {errors.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
      </div>
      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {loading ? <LoadingSpinner /> : "Register"}
      </button>
    </form>
  )
}

