import { z } from "zod"

// Zod schemas for validation
const emailSchema = z.string().email()

const passwordSchema = z
  .string()
  .min(12)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[a-zA-Z\d@$!%*?&]{12,}$/)

const usernameSchema = z.string().regex(/^[a-zA-Z0-9_]{3,20}$/)

/**
 * Validates an email address using Zod
 * @param {string} email - The email address to validate
 * @returns {boolean} True if the email is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email)
    return true
  } catch {
    return false
  }
}

/**
 * Validates a password
 * @param {string} password - The password to validate
 * @returns {boolean} True if the password is valid, false otherwise
 */
export const validatePassword = (password: string): boolean => {
  // Require at least 12 characters, one uppercase, one lowercase, one digit, and one special character (@$!%*?&)
  try {
    passwordSchema.parse(password)
    return true
  } catch {
    return false
  }
}

/**
 * Validates a username using Zod
 * @param {string} username - The username to validate
 * @returns {boolean} True if the username is valid, false otherwise
 */
export const validateUsername = (username: string): boolean => {
  // Require 3-20 characters, only alphanumeric characters and underscores
  try {
    usernameSchema.parse(username)
    return true
  } catch {
    return false
  }
}

/**
 * Validates a tarot spread selection
 * @param {string} spread - The selected spread
 * @returns {boolean} True if a spread is selected, false otherwise
 */
export const validateSpreadSelection = (spread: string): boolean => {
  return spread.trim() !== ""
}

/**
 * Gets a passive-aggressive error message for a given field
 * @param {string} field - The field name
 * @param {boolean} isValid - Whether the field is valid
 * @returns {string} A passive-aggressive error message
 */
export const getPassiveAggressiveMessage = (field: string, isValid: boolean): string => {
  if (isValid) return ""

  switch (field) {
    case "email":
      return "Wow, an invalid email. You must be new to the internet."
    case "password":
      return "That password is pathetic. Need 12+ characters with uppercase, lowercase, numbers, AND special characters (@$!%*?&). Try harder."
    case "username":
      return "Really? That's the username you're going with? How... creative."
    case "confirmPassword":
      return "Apparently, typing the same thing twice is too challenging for you."
    case "spread":
      return "You can't even choose a spread? How indecisive can you be?"
    default:
      return "I'm not even sure how you managed to mess this up."
  }
}

