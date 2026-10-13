export default function Notice({ children }) {
  return (
    <p role="status" className="rounded-lg border border-line bg-brand-soft px-4 py-3 text-sm">
      {children}
    </p>
  )
}
