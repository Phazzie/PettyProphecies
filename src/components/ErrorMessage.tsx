import React from "react"

interface ErrorMessageProps {
  id?: string
  message: string
}

export const ErrorMessage: React.FC<ErrorMessageProps> = React.forwardRef<HTMLDivElement, ErrorMessageProps>(
  ({ id, message }, ref) => {
    return (
      <div ref={ref} id={id} className="text-red-500 text-sm mt-1" role="alert">
        {message}
      </div>
    )
  },
)

ErrorMessage.displayName = "ErrorMessage"

