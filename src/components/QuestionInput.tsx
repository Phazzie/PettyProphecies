import React from 'react'

interface QuestionInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  value,
  onChange,
  maxLength = 500,
  placeholder = "Ask the cards a question... (optional)",
  className = '',
  disabled = false,
}) => {
  const remaining = maxLength - value.length
  const isNearLimit = remaining < 50

  return (
    <div className={`space-y-2 ${className}`}>
      <label
        htmlFor="question-input"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Your Question (Optional)
      </label>
      <textarea
        id="question-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors duration-200"
        aria-label="Your Question"
      />
      <div className={`text-sm ${isNearLimit ? 'text-red-500' : 'text-gray-500'} dark:${isNearLimit ? 'text-red-400' : 'text-gray-400'}`}>
        {remaining} characters remaining
      </div>
    </div>
  )
}

export default QuestionInput
