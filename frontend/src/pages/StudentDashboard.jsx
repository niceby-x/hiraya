import { Link } from 'react-router-dom'
import SkillRing from '../components/SkillRing.jsx'
import { competencies, THRESHOLD } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'
import { candidatePath, getCompetency, remediationPath, TARGET_ID } from '../lib/path.js'
import { resetLearners, useLearner } from '../lib/store.js'

const pillClass = { mastered: 'ok', gap: 'warn', low: 'low', focus: 'focus', next: 'next' }

const legend = [
  { band: 'mastered', label: 'Mastered', text: `${percent(THRESHOLD)}% or higher` },
  { band: 'gap', label: 'Needs review', text: `below ${percent(THRESHOLD)}%` },
  { band: 'next', label: 'Review next', text: 'the skill to start with' },
  { band: 'focus', label: 'Focus topic', text: 'the skill you are working toward' },
]

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="st-skill-go" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
)

function Pill({ band, children }) {
  return <span className={`st-pill st-pill--${pillClass[band]}`}>{children}</span>
}

// Competencies grouped by strand, in curriculum order.
const strands = competencies.reduce((groups, c) => {
  const group = groups.find((g) => g.name === c.strand)
  if (group) group.items.push(c)
  else groups.push({ name: c.strand, items: [c] })
  return groups
}, [])

export default function StudentDashboard() {
  const learner = useLearner('l01')
  const target = getCompetency(TARGET_ID)
  const path = remediationPath(learner.mastery, TARGET_ID)
  const { status } = candidatePath(learner.mastery, TARGET_ID, THRESHOLD)
  const first = path.length > 0 ? getCompetency(path[0]) : null
  const toReview = Math.max(path.length - 1, 0)
  const bands = competencies.map((c) => bandFor(learner.mastery[c.id]))
  const masteredCount = bands.filter((b) => b === 'mastered').length

  const pillBandFor = (id, band) => {
    if (id === TARGET_ID) return 'focus'
    if (path[0] === id) return 'next'
    return band
  }
  const pillLabelFor = (id, band) => {
    if (id === TARGET_ID) return 'Focus topic'
    if (path[0] === id) return 'Review next'
    return band === 'mastered' ? 'Mastered' : 'Needs review'
  }

  let tile = 0

  return (
    <div className="st-page">
      <div className="st-greet">
        <div>
          <h1 className="st-title">Hello, {learner.name}</h1>
          <p className="st-sub">Grade 7 Mathematics</p>
        </div>
        <div className="st-tally">
          <p><strong>{masteredCount}</strong> of {competencies.length} skills mastered</p>
          <ul className="st-segs" aria-hidden="true">
            {bands.map((b, i) => (
              <li key={competencies[i].id} className={b === 'mastered' ? 'is-ok' : b === 'gap' ? 'is-warn' : 'is-low'} />
            ))}
          </ul>
        </div>
      </div>

      {first ? (
        <section className="st-hero" aria-labelledby="start-here">
          <span className="st-here"><i aria-hidden="true" />Start here</span>
          <h2 id="start-here" className="st-hero-title">{first.name}</h2>
          <p className="st-hero-text">
            {first.id === TARGET_ID
              ? 'This is your focus topic.'
              : `${toReview} skill${toReview === 1 ? '' : 's'} to review before ${target.name}. Later skills build on this one, so it comes first.`}
          </p>

          <ol className="st-route" aria-label="Your review route">
            {path.map((id, i) => (
              <li key={id} className={`st-stop ${i === 0 ? 'is-first' : ''} ${i === path.length - 1 ? 'is-last' : ''}`} style={{ '--i': i }}>
                <span className="st-stop-pct">{percent(learner.mastery[id])}%</span>
                {i < path.length - 1 && <span className="st-seg" aria-hidden="true" />}
                <span className="st-node" aria-hidden="true" />
                <span className="st-stop-label">{getCompetency(id).short}</span>
              </li>
            ))}
          </ol>

          <div className="st-actions">
            <Link to={`/student/practice?skill=${first.id}`} className="st-btn st-btn--primary">
              Practice this skill <Arrow />
            </Link>
            <Link to="/student/path" className="st-btn st-btn--ghost">See my review path</Link>
          </div>
        </section>
      ) : (
        <section className="st-card st-pad">
          <p className="st-empty">
            {status === 'target-met'
              ? `You have reached the mastery line for ${target.name}. No review path is needed for this goal.`
              : `There is no mastery estimate for ${target.name} yet, so a review path can't be shown.`}
          </p>
        </section>
      )}

      <section aria-labelledby="my-skills" className="st-page">
        <div>
          <h2 id="my-skills" className="st-h2">My skills</h2>
          <p className="st-note" style={{ marginTop: '.35rem' }}>
            Each ring fills to your mastery estimate. The tick marks the {percent(THRESHOLD)}% mastery line. Select a skill to practice it.
          </p>
        </div>

        {strands.map((group) => {
          const done = group.items.filter((c) => bandFor(learner.mastery[c.id]) === 'mastered').length
          return (
            <div key={group.name}>
              <h3 className="st-strand st-display">
                <b>{group.name}</b>
                <span>{done} of {group.items.length} mastered</span>
              </h3>
              <ul className="st-grid">
                {group.items.map((c) => {
                  const p = learner.mastery[c.id]
                  const band = bandFor(p)
                  const id = c.id
                  const pillBand = pillBandFor(id, band)
                  const away = Math.max(percent(THRESHOLD) - percent(p), 1)
                  const delay = 500 + 70 * tile++
                  return (
                    <li key={id}>
                      <Link to={`/student/practice?skill=${id}`} aria-label={`Practice ${c.name}`}
                        className={`st-card st-skill ${path[0] === id ? 'is-next' : ''} ${id === TARGET_ID ? 'is-focus' : ''}`}>
                        <SkillRing p={p} size={64} animate delay={delay} />
                        <span className="st-skill-body">
                          <p className="st-skill-name">{c.name}</p>
                          <span className="st-skill-meta">
                            <Pill band={pillBand}>{pillLabelFor(id, band)}</Pill>
                            <span>{band === 'mastered' ? 'At or above the line' : `${away} more point${away === 1 ? '' : 's'} to reach ${percent(THRESHOLD)}%`}</span>
                          </span>
                        </span>
                        <Chevron />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </section>

      <ul className="st-legend" aria-label="Legend">
        {legend.map((item) => (
          <li key={item.label}>
            <Pill band={item.band}>{item.label}</Pill>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>

      <p className="st-note">
        Sample data for the prototype.{' '}
        <button type="button" onClick={resetLearners}>Reset demo</button>
      </p>
    </div>
  )
}
