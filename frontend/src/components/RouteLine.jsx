// The review path drawn as a route: first stop, stops in between, destination.
export default function RouteLine({ stops }) {
  const last = stops.length - 1
  return (
    <ol className="flex overflow-x-auto pb-2">
      {stops.map((s, i) => (
        <li key={s.id} className="relative min-w-28 flex-1 text-center">
          {i < last && <span className="absolute top-3.5 left-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-aqua" />}
          <span className={`relative z-10 mx-auto block rounded-full border-4 border-aqua ${
            i === 0 ? 'h-7 w-7 bg-aqua' : i === last ? 'h-8 w-8 border-white bg-night' : 'h-6 w-6 bg-night'}`} />
          <span className={`mt-2 block px-1 text-sm ${i === 0 || i === last ? 'font-bold text-white' : 'text-white/80'}`}>{s.label}</span>
        </li>
      ))}
    </ol>
  )
}
