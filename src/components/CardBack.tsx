import React from 'react'

interface CardBackProps {
  className?: string
}

export const CardBack: React.FC<CardBackProps> = ({ className = '' }) => {
  return (
    <div
      className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden border-2 border-purple-500 bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900 shadow-xl ${className}`}
    >
      {/* Decorative border pattern */}
      <div className="absolute inset-0 border-4 border-purple-400 opacity-30 m-2 rounded"></div>
      <div className="absolute inset-0 border-2 border-purple-300 opacity-20 m-4 rounded"></div>

      {/* Center mystical symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg className="w-24 h-24 text-yellow-300 opacity-40" viewBox="0 0 100 100">
          {/* Mystical eye and symbols */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />

          {/* Star pattern */}
          <path d="M 50 5 L 53 40 L 95 50 L 53 60 L 50 95 L 47 60 L 5 50 L 47 40 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5" />

          {/* Center dot */}
          <circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-2 left-2 text-yellow-300 opacity-30 text-xs">✦</div>
      <div className="absolute top-2 right-2 text-yellow-300 opacity-30 text-xs">✦</div>
      <div className="absolute bottom-2 left-2 text-yellow-300 opacity-30 text-xs">✦</div>
      <div className="absolute bottom-2 right-2 text-yellow-300 opacity-30 text-xs">✦</div>

      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')]"></div>
    </div>
  )
}

export default CardBack
