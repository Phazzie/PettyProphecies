export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  // Require at least 8 characters, one uppercase letter, one lowercase letter, and one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
  return passwordRegex.test(password)
}

export const validateUsername = (username: string): boolean => {
  // Require 3-20 characters, only alphanumeric characters and underscores
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

export const validateSpreadSelection = (spread: string): boolean => {
  return spread.trim() !== ""
}

export const getPassiveAggressiveMessage = (field: string, isValid: boolean): string => {
  if (isValid) return ""

  switch (field) {
    case "email":
      return "Wow, an invalid email. You must be new to the internet."
    case "password":
      return "That password is about as strong as a wet paper bag. Try harder."
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

