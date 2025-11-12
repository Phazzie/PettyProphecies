/**
 * Skip Links Component
 * Provides keyboard navigation shortcuts for accessibility
 * WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */

export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a
        href="#main-content"
        className="fixed top-0 left-0 z-50 bg-blue-600 text-white px-4 py-2 m-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="fixed top-0 left-32 z-50 bg-blue-600 text-white px-4 py-2 m-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Skip to navigation
      </a>
    </div>
  )
}
