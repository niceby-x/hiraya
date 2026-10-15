import { THRESHOLD } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'

// Student-side mastery ring: glows in the band color, the white tick marks the mastery line.
// `animate` fills the ring once on first paint, `delay` staggers it.
export default function SkillRing({ p, theta = THRESHOLD, size = 64, animate = false, delay = 0 }) {
  const r = 20
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" className={`st-ring st-ring--${bandFor(p, theta)}`}
      aria-label={`Mastery score ${percent(p)} percent. Mastery goal ${percent(theta)} percent.`}>
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4.5" className="st-ring-track" />
      <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4.5" strokeLinecap="round" className={`st-ring-fill ${animate ? 'is-animated' : ''}`}
        strokeDasharray={`${c * p} ${c}`} transform="rotate(-90 24 24)" style={{ '--c': c, '--d': `${delay}ms` }} />
      <line x1="24" y1="0" x2="24" y2="7.5" strokeWidth="2" className="st-ring-tick" transform={`rotate(${theta * 360} 24 24)`} />
      <text x="24" y="28.5" textAnchor="middle" className="st-ring-text">{percent(p)}</text>
    </svg>
  )
}
