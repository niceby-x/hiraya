import { Link } from 'react-router-dom'
import StatusPill from '../components/StatusPill.jsx'
import { THRESHOLD } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'
import { dependencyOrder, getCompetency, remediationPath, TARGET_ID } from '../lib/path.js'
import { useLearner } from '../lib/store.js'
import Card from '../components/Card.jsx'
import { buttonClass } from '../lib/buttonClass.js'


const names = (ids) => ids.map((id) => getCompetency(id).short).join(', ')

export default function ReviewPath() {
  const learner = useLearner('l01')
  const target = getCompetency(TARGET_ID)
  const path = remediationPath(learner.mastery, TARGET_ID)
  const skipped = dependencyOrder(TARGET_ID).filter((id) => id !== TARGET_ID && !path.includes(id))

  const labelFor = (id, i) => {
    if (id === TARGET_ID) return 'Focus topic'
    if (i === 0) return 'Review next'
    return undefined
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">My review path</h1>
        <p className="mt-2 text-muted">Suggested order to reach {target.name}</p>
      </div>

      <section className="rounded-2xl bg-brand-soft p-6">
        <h2 className="font-display text-xl font-bold text-brand">How this order was made</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5">
          <li>Start from your goal: {target.name}.</li>
          <li>Check every skill it depends on, step by step.</li>
          <li>
            Keep the ones below {percent(THRESHOLD)}% and list them so each skill comes after the
            skills it builds on.
          </li>
        </ol>
      </section>

      {path.length === 0 ? (
        <Card as="p" className="text-muted">
          Every skill on the way to {target.name} is mastered. Nothing to review.
        </Card>
      ) : (
        <ol>
          {path.map((id, i) => {
            const c = getCompetency(id)
            const p = learner.mastery[id]
            const unlocks = path.filter((other) => getCompetency(other).prereqs.includes(id))
            const isLast = i === path.length - 1

            return (
              <li key={id} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-bold ${
                      i === 0 ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink'
                    }`}
                  >
                    {i + 1}
                  </span>
                  {!isLast && <span className="w-0.5 flex-1 bg-line" />}
                </div>

                <div className={`flex-1 rounded-2xl border border-line bg-white p-6 ${isLast ? '' : 'mb-6'}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl font-bold">{c.name}</h3>
                    <StatusPill band={id === TARGET_ID ? 'focus' : i === 0 ? 'next' : bandFor(p)} label={labelFor(id, i)} />
                  </div>
                  <p className="mt-1 text-muted">
                    {percent(p)}% now · mastery line {percent(THRESHOLD)}%
                  </p>
                  <p className="mt-3 text-sm">
                    <span className="font-bold">Builds on:</span>{' '}
                    {c.prereqs.length > 0 ? names(c.prereqs) : 'no earlier skills'}
                  </p>
                  {unlocks.length > 0 && (
                    <p className="text-sm">
                      <span className="font-bold">Needed for:</span> {names(unlocks)}
                    </p>
                  )}
                  <Link
                    to={`/student/practice?skill=${id}`}
                    className={`mt-4 ${buttonClass('outline', 'sm')}`}
                  >
                    Practice this skill
                  </Link>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {skipped.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">Already mastered, so skipped</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {skipped.map((id) => (
              <li
                key={id}
                className="rounded-full bg-mastered-soft px-3 py-1 text-sm font-bold text-mastered-ink"
              >
                {getCompetency(id).name} · {percent(learner.mastery[id])}%
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-muted">
        This order is a suggestion. Your teacher can change it. Sample data for the prototype.
      </p>
    </div>
  )
}