export default function Logo({ size = 28, className = 'text-brand' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="6" cy="14" r="3.5" />
      <circle cx="22" cy="6" r="3.5" />
      <circle cx="22" cy="22" r="3.5" />
      <path d="M9.2 12.6 L18.8 7.4 M9.2 15.4 L18.8 20.6" />
    </svg>
  )
}