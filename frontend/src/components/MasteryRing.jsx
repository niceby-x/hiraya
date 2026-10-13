import { THRESHOLD } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'

const stroke = { mastered: 'stroke-mastered', gap: 'stroke-gap', low: 'stroke-low' }

// Ring filled to the mastery estimate; the tick marks the mastery line.
export default function MasteryRing({ p, theta = THRESHOLD, size = 56 }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" className="shrink-0"
      aria-label={`${percent(p)} percent. Mastery line ${percent(theta)} percent.`}>
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" className="stroke-line" />
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="5" strokeLinecap="round" className={stroke[bandFor(p, theta)]}
        strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 24 24)" />
      <line x1="24" y1="0.5" x2="24" y2="8.5" strokeWidth="2" className="stroke-ink" transform={`rotate(${theta * 360} 24 24)`} />
      <text x="24" y="28" textAnchor="middle" className="fill-ink text-[12px] font-bold">{percent(p)}</text>
    </svg>
  )
}
