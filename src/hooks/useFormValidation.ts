import { useState, useCallback } from "react"
import { getPassiveAggressiveMessage } from "../utils/validation"

type ValidationRules = {
  [key: string]: (value: string) => boolean
}

type ValidationErrors = {
  [key: string]: string
}

export const useFormValidation = (initialState: { [key: string]: string }, rules: ValidationRules) => {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isValid, setIsValid] = useState(false)

  const validateField = useCallback(
    (name: string, value: string) => {
      const validateRule = rules[name]
      const isValidField = validateRule(value)
      const errorMessage = getPassiveAggressiveMessage(name, isValidField)

      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: errorMessage,
      }))

      return isValidField
    },
    [rules],
  )

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target
      setValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }))

      validateField(name, value)
    },
    [validateField],
  )

  const validateForm = useCallback(() => {
    const formIsValid = Object.keys(rules).every((key) => validateField(key, values[key]))
    setIsValid(formIsValid)
    return formIsValid
  }, [rules, validateField, values])

  return { values, errors, isValid, handleChange, validateForm }
}

