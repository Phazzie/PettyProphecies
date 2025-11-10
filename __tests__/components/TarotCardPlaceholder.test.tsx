import React from 'react'
import { render, screen } from '@testing-library/react'
import { TarotCardPlaceholder } from '../../src/components/TarotCardPlaceholder'
import '@testing-library/jest-dom'

describe('TarotCardPlaceholder Component', () => {
  const mockCard = {
    name: 'The Fool',
    number: 0,
    description: 'New beginnings, innocence, spontaneity',
  }

  describe('Basic Rendering', () => {
    test('renders card name and description', () => {
      render(<TarotCardPlaceholder {...mockCard} />)

      expect(screen.getByText('The Fool')).toBeInTheDocument()
      expect(screen.getByText(/New beginnings/)).toBeInTheDocument()
    })

    test('displays card number correctly', () => {
      render(<TarotCardPlaceholder {...mockCard} />)

      // Card number appears twice (top and bottom)
      const numbers = screen.getAllByText('0')
      expect(numbers).toHaveLength(2)
    })
  })

  describe('Reversal State Display', () => {
    test('displays "Reversed" badge when isReversed is true', () => {
      render(<TarotCardPlaceholder {...mockCard} isReversed={true} />)

      expect(screen.getByText('Reversed')).toBeInTheDocument()
    })

    test('does not display "Reversed" badge when isReversed is false', () => {
      render(<TarotCardPlaceholder {...mockCard} isReversed={false} />)

      expect(screen.queryByText('Reversed')).not.toBeInTheDocument()
    })

    test('does not display "Reversed" badge when isReversed is undefined (default)', () => {
      render(<TarotCardPlaceholder {...mockCard} />)

      expect(screen.queryByText('Reversed')).not.toBeInTheDocument()
    })
  })

  describe('CSS Rotation for Reversal', () => {
    test('applies rotation CSS when isReversed is true', () => {
      const { container } = render(<TarotCardPlaceholder {...mockCard} isReversed={true} />)

      const cardElement = container.querySelector('.rotate-180')
      expect(cardElement).toBeInTheDocument()
    })

    test('does not apply rotation CSS when isReversed is false', () => {
      const { container } = render(<TarotCardPlaceholder {...mockCard} isReversed={false} />)

      // The outer div should not have rotate-180 class
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).not.toContain('rotate-180')
    })

    test('reversed card has correct visual structure', () => {
      const { container } = render(<TarotCardPlaceholder {...mockCard} isReversed={true} />)

      // Outer container should have rotate-180
      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).toContain('rotate-180')

      // Inner content should counter-rotate to keep text readable
      const innerDiv = container.querySelector('.relative.h-full')
      expect(innerDiv).toBeInTheDocument()
      expect(innerDiv?.className).toContain('rotate-180')
    })
  })

  describe('Custom Styling', () => {
    test('applies custom className when provided', () => {
      const { container } = render(
        <TarotCardPlaceholder {...mockCard} className="custom-class" />
      )

      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).toContain('custom-class')
    })

    test('maintains default classes with custom className', () => {
      const { container } = render(
        <TarotCardPlaceholder {...mockCard} className="custom-class" />
      )

      const outerDiv = container.firstChild as HTMLElement
      expect(outerDiv.className).toContain('custom-class')
      expect(outerDiv.className).toContain('border-purple-500')
    })
  })

  describe('Badge Styling', () => {
    test('reversed badge has correct styling classes', () => {
      render(<TarotCardPlaceholder {...mockCard} isReversed={true} />)

      const badge = screen.getByText('Reversed')
      expect(badge.className).toContain('bg-red-500')
      expect(badge.className).toContain('text-white')
      expect(badge.className).toContain('absolute')
      expect(badge.className).toContain('top-2')
      expect(badge.className).toContain('right-2')
    })
  })
})
