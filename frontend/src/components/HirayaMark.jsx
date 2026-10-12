// A sprout whose leaf tips are nodes: learning growth + competency relationships.
export default function HirayaMark({ size = 44, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 44V26" />
      <path d="M24 33C14 33 9 28 9 19" />
      <path d="M24 27C34 27 39 22 39 13" />
      <path d="M9 19 24 7l15 6" strokeWidth="1.6" opacity=".7" />
      <g fill="currentColor" stroke="none">
        <circle cx="9" cy="19" r="4" /><circle cx="39" cy="13" r="4" /><circle cx="24" cy="7" r="4.5" /><circle cx="24" cy="44" r="2.6" />
      </g>
    </svg>
  )
}