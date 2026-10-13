// HIRAYA mark: hollow competency nodes linked by bands, with a solid triangle
// (forward progress) set into the centre opening. Color comes from currentColor,
// and the node rings are truly hollow so the background shows through.
export default function Logo({ size = 30, className = 'text-brand' }) {
  return (
    <svg width={size} height={size} viewBox="10 8 138 138" aria-hidden="true" className={className} fill="none">
      <g stroke="currentColor" strokeWidth="4.2" strokeLinecap="round">
        <path d="M102.0 31.9C110.8 48.1 121.8 63.2 130.5 79.4" />
        <path d="M67.5 47.1L107.0 70.8" />
        <path d="M55.8 50.0C46.4 65.9 37.2 82.0 28.2 98.1" />
        <path d="M59.0 120.7L59.2 75.2" />
        <path d="M127.0 91.4L87.5 115.5" />
        <path d="M67.5 129.0C84.9 128.7 105.3 128.8 122.8 129.0" />
        <circle cx="98.2" cy="24.3" r="8.5" />
        <circle cx="60.2" cy="42.7" r="8.5" />
        <circle cx="134.3" cy="87.0" r="8.5" />
        <circle cx="24.0" cy="105.5" r="8.5" />
        <circle cx="59.0" cy="129.2" r="8.5" />
        <circle cx="131.3" cy="129.2" r="8.5" />
      </g>
      <path d="M69.8 68.8 77.3 106.4 107.1 81.6Z" fill="currentColor" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}
