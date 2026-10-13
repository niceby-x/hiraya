import { bandFor } from '../lib/mastery.js'
import MasteryRing from './MasteryRing.jsx'
import StatusPill from './StatusPill.jsx'

export default function MasteryBar({ competency, p, label, pillBand }) {
  return (
    <li className="flex items-center gap-4 py-3.5">
      <MasteryRing p={p} />
      <div className="min-w-0 flex-1">
        <p className="font-bold">{competency.name}</p>
        <p className="text-sm text-muted">{competency.strand}</p>
      </div>
      <div className="w-32">
        <StatusPill band={pillBand ?? bandFor(p)} label={label} />
      </div>
    </li>
  )
}
