export default function PlaceholderPage({ title, note }) {
  return (
    <div>
      <h1 className="font-display text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-muted">{note}</p>
    </div>
  )
}