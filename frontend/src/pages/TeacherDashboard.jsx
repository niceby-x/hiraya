import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { competencies, learners, THRESHOLD } from '../data/mock.js'
import { masteredCount, topGaps } from '../lib/classStats.js'
import { bandFor, LOW_LINE, percent } from '../lib/mastery.js'
import Card from '../components/Card.jsx'

const options = [THRESHOLD, 0.98]

const cellStyles = {
  mastered: 'bg-mastered-soft text-mastered-ink',
  gap: 'bg-gap-soft text-gap-ink',
  low: 'bg-low-soft text-low-ink',
}

const gridStyle = {
  gridTemplateColumns: `120px repeat(${competencies.length}, minmax(0, 1fr))`,
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      <p className="text-sm font-bold text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  )
}

export default function TeacherDashboard() {
  const [theta, setTheta] = useState(THRESHOLD)
  const gaps = topGaps(theta)
  const total = learners.length * competencies.length

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Class overview</h1>
          <p className="mt-2 text-muted">Grade 7 Mathematics · sample class</p>
        </div>

        <div>
          <p className="mb-1 text-sm font-bold text-muted">Mastery line</p>
          <div
            role="radiogroup"
            aria-label="Mastery line"
            className="inline-flex rounded-lg border border-line bg-white p-1"
          >
            {options.map((o) => (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={theta === o}
                onClick={() => setTheta(o)}
                className={`rounded-md px-4 py-2 font-bold ${
                  theta === o ? 'bg-brand text-white' : 'text-ink'
                }`}
              >
                {percent(o)}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Learners" value={learners.length} />
        <Stat label="Skills tracked" value={competencies.length} />
        <Stat label={`Skills mastered at ${percent(theta)}%`} value={`${masteredCount(theta)} of ${total}`} />
      </div>

      <Card>
        <h2 className="font-display text-2xl font-bold">Mastery by learner and skill</h2>
        <p className="mt-1 text-sm text-muted">
          Skills run from the earliest prerequisite to the target skill, left to right.
        </p>

        <p className="mt-3 text-sm font-bold text-muted lg:hidden">Swipe sideways to see every skill.</p>

        <div className="mt-3 overflow-x-auto lg:mt-6">
          <div className="grid min-w-190 items-center gap-2" style={gridStyle}>
            <p className="sticky left-0 bg-white text-sm font-bold text-muted">Learner</p>
            {competencies.map((c) => (
              <p key={c.id} className="text-center text-sm font-bold text-muted">
                {c.short}
              </p>
            ))}

            {learners.map((l) => (
              <Fragment key={l.id}>
                <Link
                  to={`/teacher/learner?learner=${l.id}`}
                  className="sticky left-0 bg-white py-1 font-bold text-brand"
                >
                  {l.name}
                </Link>
                {competencies.map((c) => {
                  const p = l.mastery[c.id]
                  return (
                    <div
                      key={c.id}
                      title={`${l.name} · ${c.name}: ${percent(p)}%`}
                      className={`rounded-lg py-3 text-center font-bold ${cellStyles[bandFor(p, theta)]}`}
                    >
                      {percent(p)}%
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted">
          Green: mastered at {percent(theta)}% or higher. Amber: {percent(LOW_LINE)}% to below {percent(theta)}%. Red: below {percent(LOW_LINE)}%.
        </p>
      </Card>

      <Card>
        <h2 className="font-display text-2xl font-bold">Most common gaps</h2>
        <p className="mt-1 text-sm text-muted">
          Learners below the {percent(theta)}% mastery line, by skill.
        </p>
        <ul className="mt-4 divide-y divide-line">
          {gaps.map(({ competency, count }) => (
            <li key={competency.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 py-3">
              <p className="w-full font-bold sm:w-72">{competency.name}</p>
              <div className="h-3 min-w-40 flex-1 rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-gap"
                  style={{ width: `${(count / learners.length) * 100}%` }}
                />
              </div>
              <p className="w-28 text-right text-sm font-bold">
                {count} of {learners.length}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <p className="text-sm text-muted">HIRAYA suggests; the teacher decides. Sample data for the prototype.</p>
    </div>
  )
}