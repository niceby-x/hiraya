import { useState } from 'react'
import { Link } from 'react-router-dom'
import SkillRing from '../components/SkillRing.jsx'
import StudentPill from '../components/StudentPill.jsx'
import { competencies } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'
import { candidatePath, getCompetency, remediationPath } from '../lib/path.js'
import { resetLearners, useLearner, useSettings } from '../lib/store.js'

const Arrow = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="st-skill-go" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5l7 7-7 7" />
  </svg>
)

const strands = competencies.reduce((groups, c) => {
  const group = groups.find((g) => g.name === c.strand)
  if (group) group.items.push(c)
  else groups.push({ name: c.strand, items: [c] })
  return groups
}, [])

export default function StudentDashboard() {
  const [filter, setFilter] = useState('all') // 'all' | 'path' | 'mastered'
  const { learnerId, targetId, theta } = useSettings()
  const learner = useLearner(learnerId)
  const target = getCompetency(targetId)
  const path = remediationPath(learner.mastery, targetId, theta)
  const pathSet = new Set(path)
  const { status } = candidatePath(learner.mastery, targetId, theta)
  const first = path.length > 0 ? getCompetency(path[0]) : null
  const toReview = Math.max(path.length - 1, 0)
  const bands = competencies.map((c) => bandFor(learner.mastery[c.id], theta))
  const masteredCount = bands.filter((b) => b === 'mastered').length

  const legend = [
    { band: 'mastered', label: 'Mastered', text: `${percent(theta)}% or higher` },
    { band: 'gap', label: 'Needs review', text: `below ${percent(theta)}%` },
    { band: 'next', label: 'Review next', text: 'the skill to start with' },
    { band: 'focus', label: 'Focus topic', text: 'the skill you are working toward' },
  ]

  const pillBandFor = (id, band) => {
    if (id === targetId) return 'focus'
    if (path[0] === id) return 'next'
    return band
  }

  const pillLabelFor = (id, band) => {
    if (id === targetId) return 'Focus topic'
    if (path[0] === id) return 'Review next'
    return band === 'mastered' ? 'Mastered' : 'Needs review'
  }

  const matchesFilter = (c) => {
    if (filter === 'path') return pathSet.has(c.id)
    if (filter === 'mastered') return bandFor(learner.mastery[c.id], theta) === 'mastered'
    return true
  }

  let tile = 0

  return (
    <div className="st-page">
      <div className="st-greet">
        <div>
          <h1 className="st-title">Hello, {learner.name}</h1>
          <p className="st-sub">Grade 7 Mathematics · Focus topic: {target.name} · Mastery goal: {percent(theta)}%</p>
        </div>
        <div className="st-tally">
          <p>
            <strong>{masteredCount}</strong> of {competencies.length} skills mastered (goal: {percent(theta)}%)
          </p>
          <ul className="st-segs" aria-hidden="true">
            {bands.map((b, i) => (
              <li
                key={competencies[i].id}
                title={`${competencies[i].name}: ${percent(learner.mastery[competencies[i].id])}%`}
                className={b === 'mastered' ? 'is-ok' : b === 'gap' ? 'is-warn' : 'is-low'}
              />
            ))}
          </ul>
        </div>
      </div>

      {first ? (
        <section className="st-hero" aria-labelledby="start-here">
          <span className="st-here">
            <i aria-hidden="true" />
            Recommended next step
          </span>
          <h2 id="start-here" className="st-hero-title">{first.name}</h2>
          <p className="st-hero-text">
            {first.id === targetId
              ? `You have reached your mastery goal of ${percent(theta)}% on all the earlier skills! You are ready to practice your focus topic.`
              : `${toReview} earlier skill${toReview === 1 ? '' : 's'} to review before ${target.name}. Later skills build on this one, so it comes first.`}
          </p>

          <ol className="st-route" aria-label="Your review route">
            {path.map((id, i) => {
              const comp = getCompetency(id)
              const isFirst = i === 0
              const isLast = i === path.length - 1
              return (
                <li
                  key={id}
                  className={`st-stop ${isFirst ? 'is-first' : ''} ${isLast ? 'is-last' : ''}`}
                  style={{ '--i': i }}
                >
                  {i < path.length - 1 && <span className="st-seg" aria-hidden="true" />}
                  <Link
                    to={`/student/practice?skill=${id}`}
                    className="st-stop-link"
                    title={`Practice ${comp.name} (mastery score ${percent(learner.mastery[id])}%)`}
                  >
                    <span className="st-stop-pct">{percent(learner.mastery[id])}%</span>
                    <span className="st-node" aria-hidden="true" />
                    <span className="st-stop-label">{comp.short}</span>
                    <span className="st-stop-role">
                      {isFirst ? 'Start' : isLast ? 'Goal' : `Step ${i + 1}`}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>

          <div className="st-actions">
            <Link to={`/student/practice?skill=${first.id}`} className="st-btn st-btn--primary">
              Practice {first.short} <Arrow />
            </Link>
            <Link to="/student/path" className="st-btn st-btn--ghost">
              See full review path
            </Link>
          </div>
        </section>
      ) : (
        <section className="st-card st-pad">
          <p className="st-empty">
            {status === 'target-met'
              ? `✓ You have reached your mastery goal of ${percent(theta)}% for ${target.name}! No review path is needed for this goal.`
              : `There is no mastery score for ${target.name} yet, so a review path can't be shown.`}
          </p>
        </section>
      )}

      <section aria-labelledby="my-skills" className="st-page">
        <div className="st-filter-head">
          <div>
            <h2 id="my-skills" className="st-h2">My skills</h2>
            <p className="st-note" style={{ marginTop: '.35rem' }}>
              Each ring fills to your mastery score. The small tick marks your mastery goal of {percent(theta)}%.
            </p>
          </div>
          <div className="st-filters" role="group" aria-label="Filter skills">
            <button
              type="button"
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              className={`st-filter-btn ${filter === 'all' ? 'is-active' : ''}`}
            >
              All ({competencies.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('path')}
              aria-pressed={filter === 'path'}
              className={`st-filter-btn ${filter === 'path' ? 'is-active' : ''}`}
            >
              On my path ({path.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('mastered')}
              aria-pressed={filter === 'mastered'}
              className={`st-filter-btn ${filter === 'mastered' ? 'is-active' : ''}`}
            >
              Mastered ({masteredCount})
            </button>
          </div>
        </div>

        {strands.map((group) => {
          const visibleItems = group.items.filter(matchesFilter)
          if (visibleItems.length === 0) return null
          const done = group.items.filter((c) => bandFor(learner.mastery[c.id], theta) === 'mastered').length
          return (
            <div key={group.name}>
              <h3 className="st-strand st-display">
                <b>{group.name}</b>
                <span>{done} of {group.items.length} mastered</span>
              </h3>
              <ul className="st-grid">
                {visibleItems.map((c) => {
                  const p = learner.mastery[c.id]
                  const band = bandFor(p, theta)
                  const id = c.id
                  const pillBand = pillBandFor(id, band)
                  const away = Math.max(percent(theta) - percent(p), 1)
                  const delay = 300 + 60 * tile++
                  return (
                    <li key={id}>
                      <Link
                        to={`/student/practice?skill=${id}`}
                        aria-label={`Practice ${c.name}. ${pillLabelFor(id, band)}. Mastery score ${percent(p)} percent${band === 'mastered' ? ', goal reached' : `, ${away} more point${away === 1 ? '' : 's'} to reach ${percent(theta)} percent`}.`}
                        className={`st-card st-skill ${path[0] === id ? 'is-next' : ''} ${id === targetId ? 'is-focus' : ''}`}
                      >
                        <SkillRing p={p} theta={theta} size={64} animate delay={delay} />
                        <span className="st-skill-body">
                          <p className="st-skill-name">{c.name}</p>
                          <span className="st-skill-meta">
                            <StudentPill band={pillBand}>{pillLabelFor(id, band)}</StudentPill>
                            <span>
                              {band === 'mastered'
                                ? 'Goal reached'
                                : `${away} more point${away === 1 ? '' : 's'} to reach ${percent(theta)}%`}
                            </span>
                          </span>
                          <p className="st-skill-prereq">
                            {c.prereqs.length > 0
                              ? `Builds on: ${c.prereqs.map((pr) => getCompetency(pr).short).join(', ')}`
                              : 'Foundational skill'}
                          </p>
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
            <StudentPill band={item.band}>{item.label}</StudentPill>
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