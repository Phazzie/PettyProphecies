import React from 'react'

interface TarotCardPlaceholderProps {
  name: string
  number: number
  description: string
  isReversed?: boolean
  className?: string
}

export const TarotCardPlaceholder: React.FC<TarotCardPlaceholderProps> = ({
  name,
  number,
  description,
  isReversed = false,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden border-2 border-purple-500 bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 shadow-xl transition-transform hover:scale-105 ${
        isReversed ? 'rotate-180' : ''
      } ${className}`}
    >
      {/* Decorative border pattern */}
      <div className="absolute inset-0 border-4 border-purple-400 opacity-20 m-2 rounded"></div>

      {/* Card content */}
      <div className={`relative h-full flex flex-col items-center justify-between p-4 ${isReversed ? 'rotate-180' : ''}`}>
        {/* Top number */}
        <div className="text-yellow-300 font-bold text-sm">{number}</div>

        {/* Card name - centered */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <h3 className="text-yellow-100 font-serif text-lg md:text-xl font-bold mb-2 tracking-wide">
            {name}
          </h3>
          <p className="text-purple-200 text-xs md:text-sm opacity-80 line-clamp-3">
            {description}
          </p>
        </div>

        {/* Bottom number */}
        <div className="text-yellow-300 font-bold text-sm rotate-180">{number}</div>
      </div>

      {/* Mystical decoration overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 150">
          <circle cx="50" cy="75" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-300" />
          <circle cx="50" cy="75" r="20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-yellow-300" />
          <path d="M 50 45 L 50 105" stroke="currentColor" strokeWidth="0.5" className="text-yellow-300" />
          <path d="M 20 75 L 80 75" stroke="currentColor" strokeWidth="0.5" className="text-yellow-300" />
        </svg>
      </div>

      {/* Reversed indicator */}
      {isReversed && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          Reversed
        </div>
      )}
    </div>
  )
}

export default TarotCardPlaceholder
