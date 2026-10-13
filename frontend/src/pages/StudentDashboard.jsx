import { Link } from 'react-router-dom'
import MasteryBar from '../components/MasteryBar.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { competencies, THRESHOLD } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'
import { getCompetency, remediationPath, TARGET_ID } from '../lib/path.js'
import { resetLearners, useLearner } from '../lib/store.js'
import RouteLine from '../components/RouteLine.jsx'
import Card from '../components/Card.jsx'
import { buttonClass } from '../lib/buttonClass.js'


const legend = [
  { band: 'mastered', label: 'Mastered', text: `${percent(THRESHOLD)}% or higher` },
  { band: 'gap', label: 'Needs review', text: `below ${percent(THRESHOLD)}%` },
  { band: 'next', label: 'Review next', text: 'the skill to start with' },
  { band: 'focus', label: 'Focus topic', text: 'the skill you are working toward' },
]

export default function StudentDashboard() {
  const learner = useLearner('l01')
  const target = getCompetency(TARGET_ID)
  const path = remediationPath(learner.mastery, TARGET_ID)
  const first = path.length > 0 ? getCompetency(path[0]) : null
  const toReview = Math.max(path.length - 1, 0)
  const masteredCount = competencies.filter(
    (c) => bandFor(learner.mastery[c.id]) === 'mastered',
  ).length

  const labelFor = (id) => {
    if (id === TARGET_ID) return 'Focus topic'
    if (path[0] === id) return 'Review next'
    return undefined
  }

  const pillBandFor = (id) => {
    if (id === TARGET_ID) return 'focus'
    if (path[0] === id) return 'next'
    return undefined
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">Hello, {learner.name}</h1>
        <p className="mt-2 text-muted">
          Grade 7 Mathematics · {masteredCount} of {competencies.length} skills mastered
        </p>
      </div>

      {first && (
        <section className="on-dark rounded-3xl bg-night p-5 text-white sm:p-10">
          <p className="text-sm font-bold uppercase tracking-widest text-aqua">Start here</p>
          <h2 className="mt-2 font-display text-4xl font-bold sm:text-5xl">{first.name}</h2>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            {first.id === TARGET_ID
              ? 'This is your focus topic.'
              : `${toReview} skill${toReview === 1 ? '' : 's'} to review before ${target.name}. Later skills build on this one, so it comes first.`}
          </p>
          <div className="mt-8">
            <RouteLine stops={path.map((id) => ({ id, label: getCompetency(id).short }))} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/student/practice?skill=${first.id}`} className="inline-block rounded-lg bg-aqua px-6 py-3 font-bold text-night-ink transition-colors hover:bg-aqua-hover">
              Practice this skill
            </Link>
            <Link
              to="/student/path"
              className={buttonClass('onBrandOutline')}
            >
              See my review path
            </Link>
          </div>
        </section>
      )}

      <Card>
        <h2 className="font-display text-2xl font-bold">My skills</h2>
        <p className="mt-1 text-sm text-muted">
          Listed from earliest to latest. The tick on each ring marks the {percent(THRESHOLD)}% mastery line.
        </p>
        <ul className="mt-4 divide-y divide-line">
          {competencies.map((c) => (
            <MasteryBar key={c.id} competency={c} p={learner.mastery[c.id]} label={labelFor(c.id)} pillBand={pillBandFor(c.id)} />
          ))}
        </ul>
      </Card>

      <section aria-label="Legend" className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
        {legend.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <StatusPill band={item.band} label={item.label} />
            <span>{item.text}</span>
          </div>
        ))}
      </section>

      <p className="text-sm text-muted">
        Sample data for the prototype.{' '}
        <button type="button" onClick={resetLearners} className="font-bold text-brand underline">
          Reset demo
        </button>
      </p>
    </div>
  )
}