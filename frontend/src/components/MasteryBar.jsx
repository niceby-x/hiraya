import { THRESHOLD } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'
import StatusPill from './StatusPill.jsx'

const fills = {
  mastered: 'bg-mastered',
  gap: 'bg-gap',
  low: 'bg-low',
}

export default function MasteryBar({ competency, p, label, pillBand }) {
  const band = bandFor(p)

  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4">
      <div className="w-full sm:w-64">
        <p className="font-bold">{competency.name}</p>
        <p className="text-sm text-muted">{competency.strand}</p>
      </div>

      <div
        className="relative h-3 min-w-40 flex-1 rounded-full bg-line"
        role="img"
        aria-label={`${competency.name}: ${percent(p)} percent`}
      >
        <div className={`h-full rounded-full ${fills[band]}`} style={{ width: `${percent(p)}%` }} />
        <div
          className="absolute -top-1 -bottom-1 w-0.5 bg-ink"
          style={{ left: `${THRESHOLD * 100}%` }}
        />
      </div>

      <p className="w-12 text-right font-bold">{percent(p)}%</p>
      <div className="w-32">
        <StatusPill band={pillBand ?? band} label={label} />
      </div>
    </li>
  )
}