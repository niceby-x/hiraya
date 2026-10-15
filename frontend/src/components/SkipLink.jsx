import { focusMain } from '../lib/routeA11y.js'

// First tab stop on every page: jumps past the header to the main content.
export default function SkipLink({ mainRef }) {
  return (
    <a
      href="#main"
      onClick={(e) => {
        e.preventDefault()
        focusMain(mainRef.current)
      }}
      className="sr-only rounded-lg bg-white px-4 py-2 text-sm font-bold text-night shadow-lg focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
    >
      Skip to main content
    </a>
  )
}
