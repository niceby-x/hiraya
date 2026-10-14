import { Fragment, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { competencies } from '../data/mock.js'
import { classWideReview, masteredCount, targetSummary, visibleRows } from '../lib/classStats.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { displayOrder, getCompetency } from '../lib/path.js'
import { useLearners } from '../lib/store.js'
import { contextQuery, learnerLink, readContext, THRESHOLD_OPTIONS } from '../lib/teacherContext.js'
import Card from '../components/Card.jsx'
import Notice from '../components/Notice.jsx'
import StatusPill from '../components/StatusPill.jsx'

const cellStyles = {
  meets: 'bg-mastered-soft text-mastered-ink',
  below: 'bg-gap-soft text-gap-ink',
  none: 'bg-line text-ink',
}

const marker = { meets: '✓', below: '▼', none: '' }
const statusText = { meets: 'meets the threshold', below: 'below the threshold', none: 'no data' }

// Short note under a learner's name: their candidate-gap count for the selected target.
const gapNote = (status, gaps) =>
  status === 'needs-review'
    ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'}`
    : status === 'target-met'
      ? 'Target met'
      : status === 'no-data'
        ? 'No data'
        : ''

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

// Collapsible list of learners, each linking to that learner's view with the current target and threshold.
function LearnerLinks({ learners, target, theta }) {
  if (learners.length === 0) return null
  return (
    <details className="w-full text-sm">
      <summary className="cursor-pointer py-1 font-bold text-brand">Show learners</summary>
      <ul className="mt-2 flex flex-wrap gap-2 pb-1">
        {learners.map((l) => (
          <li key={l.id}>
            <Link
              to={learnerLink({ learnerId: l.id, target, theta })}
              className="inline-block rounded-full border border-line px-3 py-1 font-bold text-brand"
            >
              {l.name}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}

function CountBar({ count, total }) {
  return (
    <div className="h-3 min-w-40 flex-1 rounded-full bg-line">
      <div
        className="h-full rounded-full bg-gap"
        style={{ width: `${total ? (count / total) * 100 : 0}%` }}
      />
    </div>
  )
}

export default function TeacherDashboard() {
  const [params, setParams] = useSearchParams()
  const learners = useLearners()
  // Search and order only change which learners are listed. They never touch mastery data or the class summaries.
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('roster')
  const { target: targetId, theta, learnerId, invalid } = readContext(params, learners.map((l) => l.id))
  const target = getCompetency(targetId)
  const columns = displayOrder(targetId).map(getCompetency)

  // Every control change rewrites the URL with a complete, valid target + threshold, keeping the
  // last-viewed learner, and replaces the history entry so Back leaves the page.
  const update = (change) =>
    setParams(contextQuery({ target: targetId, theta, learnerId, ...change }), { replace: true })

  const total = learners.length * competencies.length
  const classWide = classWideReview(learners, theta).filter((r) => r.count > 0)
  const summary = targetSummary(learners, targetId, theta)
  const rows = visibleRows(summary.rows, { query, sort })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">Class overview</h1>
          <p className="mt-2 text-muted">Grade 7 Mathematics · sample class</p>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="target" className="mb-1 block text-sm font-bold text-muted">
              Target competency
            </label>
            <select
              id="target"
              value={targetId}
              onChange={(e) => update({ target: e.target.value })}
              className="block max-w-full rounded-lg border border-line bg-white px-4 py-2.5 font-bold"
            >
              {competencies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p id="theta-label" className="mb-1 text-sm font-bold text-muted">
              Mastery threshold
            </p>
            <div
              role="radiogroup"
              aria-labelledby="theta-label"
              className="inline-flex rounded-lg border border-line bg-white p-1"
            >
              {THRESHOLD_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  role="radio"
                  aria-checked={theta === o}
                  onClick={() => update({ theta: o })}
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
      </div>

      {invalid.target && (
        <Notice>The target competency in the link was not recognized, so the default target is shown.</Notice>
      )}
      {invalid.theta && (
        <Notice>The mastery threshold in the link was not recognized, so {percent(theta)}% is used.</Notice>
      )}

      <p className="text-sm text-muted">
        Showing <strong className="text-ink">{target.name}</strong> as the target, with a mastery threshold of{' '}
        <strong className="text-ink">{percent(theta)}%</strong>. Mastery figures are BKT estimates of how likely
        a learner is to have mastered a skill. They are not test scores. Changing the threshold changes how the
        estimates are classified, not the estimates themselves.
      </p>

      {learners.length === 0 ? (
        <Card>
          <h2 className="font-display text-2xl font-bold">No learners yet</h2>
          <p className="mt-2 text-muted">There are no learners in this class, so there are no mastery estimates to show.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Learners" value={learners.length} />
            <Stat label="Skills tracked" value={competencies.length} />
            <Stat label={`Estimates at or above ${percent(theta)}%`} value={`${masteredCount(learners, theta)} of ${total}`} />
            <Stat label="Learners below the threshold on the target" value={`${summary.needsReview} of ${learners.length}`} />
          </div>

          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-56 flex-1">
                <label htmlFor="learner-search" className="mb-1 block text-sm font-bold text-muted">
                  Search learners
                </label>
                <input
                  id="learner-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Name or ID (e.g. Learner 03)"
                  autoComplete="off"
                  className="block w-full rounded-lg border border-line bg-white px-4 py-2.5"
                />
              </div>
              <div>
                <label htmlFor="learner-sort" className="mb-1 block text-sm font-bold text-muted">
                  Order learners by
                </label>
                <select
                  id="learner-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="block max-w-full rounded-lg border border-line bg-white px-4 py-2.5 font-bold"
                >
                  <option value="roster">Class list order</option>
                  <option value="gaps">Most candidate gaps first</option>
                </select>
              </div>
              {query !== '' && (
                <button type="button" onClick={() => setQuery('')} className="py-2.5 font-bold text-brand">
                  Clear search
                </button>
              )}
            </div>
            <p className="mt-3 text-sm text-muted" aria-live="polite">
              Showing {rows.length} of {learners.length} learners in the mastery grid and the learner list below.
              Gap counts are candidate prerequisite gaps for {target.name} at {percent(theta)}%. The class totals
              and summaries always cover all {learners.length} learners.
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-2xl font-bold">Mastery by learner and skill</h2>
            <p className="mt-1 text-sm text-muted">
              The selected target and its prerequisites come first, from the earliest prerequisite to the target
              (marked in its column header). Skills that are not prerequisites of the target follow.
            </p>

            <p className="mt-3 text-sm font-bold text-muted lg:hidden">Swipe sideways to see every skill.</p>

            <div className="mt-3 overflow-x-auto lg:mt-6">
              <div className="grid min-w-190 items-center gap-2" style={gridStyle}>
                <p className="sticky left-0 z-10 bg-white text-sm font-bold text-muted">Learner</p>
                {columns.map((c) => (
                  <p
                    key={c.id}
                    className={`text-center text-sm font-bold ${c.id === targetId ? 'text-brand' : 'text-muted'}`}
                  >
                    {c.short}
                    {c.id === targetId && <span className="block text-xs">Target</span>}
                  </p>
                ))}

                {rows.map(({ learner: l, status, gaps }) => (
                  <Fragment key={l.id}>
                    <div className="sticky left-0 z-10 bg-white py-1">
                      <Link to={learnerLink({ learnerId: l.id, target: targetId, theta })} className="font-bold text-brand">
                        {l.name}
                      </Link>
                      <p className="text-xs text-muted">{gapNote(status, gaps)}</p>
                    </div>
                    {columns.map((c) => {
                      const p = l.mastery?.[c.id]
                      const s = statusFor(p, theta)
                      return (
                        <div
                          key={c.id}
                          title={`${l.name} · ${c.name}: ${formatPercent(p, theta)} (${statusText[s]})`}
                          className={`relative rounded-lg py-3 text-center font-bold ${cellStyles[s]}`}
                        >
                          {marker[s] && <span aria-hidden="true">{marker[s]} </span>}
                          {formatPercent(p, theta)}
                          <span className="sr-only"> {statusText[s]}</span>
                        </div>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>

            {rows.length === 0 && (
              <p className="mt-4 text-muted">No learners match “{query}”. Clear the search to see the whole class.</p>
            )}

            <p className="mt-6 text-sm text-muted">
              ✓ Meets the threshold: estimate at or above {percent(theta)}%. ▼ Below the threshold: estimate below{' '}
              {percent(theta)}%. Select a learner's name to open their view with this target and threshold.
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-2xl font-bold">Competencies that may need review across the class</h2>
            <p className="mt-1 text-sm text-muted">
              Learners with an estimate below {percent(theta)}%, for each skill, whatever the target. This is a
              class-wide view. It is separate from the prerequisite gaps for the selected target below.
            </p>
            {classWide.length === 0 ? (
              <p className="mt-4 text-muted">No learner has an estimate below {percent(theta)}% for any skill.</p>
            ) : (
              <ul className="mt-4 divide-y divide-line">
                {classWide.map(({ competency, count, learners: affected }) => (
                  <li key={competency.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 py-3">
                    <p className="w-full font-bold sm:w-72">{competency.name}</p>
                    <CountBar count={count} total={learners.length} />
                    <p className="w-28 text-right text-sm font-bold">
                      {count} of {learners.length}
                    </p>
                    <LearnerLinks learners={affected} target={targetId} theta={theta} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-2xl font-bold">Candidate prerequisite gaps for {target.name}</h2>
            <p className="mt-1 text-sm text-muted">
              Only direct and indirect prerequisites of the selected target with an estimate below {percent(theta)}%
              are counted, listed from the earliest prerequisite. These are candidate review priorities to support
              your judgment, not diagnoses. The counts come from the same path logic as each learner's view.
            </p>

            {summary.prerequisites.length === 0 ? (
              <p className="mt-4 text-muted">This competency has no prerequisites in the sample graph.</p>
            ) : (
              <>
                {summary.withGaps === 0 && (
                  <p className="mt-4 text-muted">
                    No prerequisite competencies below the selected threshold were identified for this target.
                  </p>
                )}
                <ul className="mt-4 divide-y divide-line">
                  {summary.prerequisites.map(({ competency, count, learners: affected }) => (
                    <li key={competency.id} className="flex flex-wrap items-center gap-x-5 gap-y-1 py-3">
                      <p className="w-full font-bold sm:w-72">{competency.name}</p>
                      <CountBar count={count} total={learners.length} />
                      <p className="w-28 text-right text-sm font-bold">
                        {count} of {learners.length}
                      </p>
                      <LearnerLinks learners={affected} target={targetId} theta={theta} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3 className="mt-8 font-display text-xl font-bold">Learners and the target</h3>
            <p className="mt-1 text-sm text-muted">
              A learner whose target estimate already meets the threshold has no remediation path for this target.
            </p>
            <ul className="mt-2 divide-y divide-line">
              {rows.map(({ learner, status, gaps }) => {
                const p = learner.mastery?.[targetId]
                const text =
                  status === 'needs-review'
                    ? gaps.length === 0
                      ? 'No prerequisite gaps below the threshold; the target is below it'
                      : `${gaps.length} candidate prerequisite gap${gaps.length === 1 ? '' : 's'}`
                    : status === 'target-met'
                      ? 'Target meets the threshold; no remediation path'
                      : 'No mastery data for this target'
                return (
                  <li key={learner.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                    <p className="w-28 font-bold">{learner.name}</p>
                    <p className="w-16 font-bold">{formatPercent(p, theta)}</p>
                    <StatusPill band={statusFor(p, theta)} />
                    <p className="min-w-48 flex-1 text-sm text-muted">{text}</p>
                    <Link
                      to={learnerLink({ learnerId: learner.id, target: targetId, theta })}
                      className="font-bold text-brand"
                    >
                      Open learner view
                      <span className="sr-only"> for {learner.name}</span> →
                    </Link>
                  </li>
                )
              })}
            </ul>
            {rows.length === 0 && (
              <p className="mt-4 text-muted">No learners match “{query}”. Clear the search to see the whole class.</p>
            )}
          </Card>
        </>
      )}

      <p className="text-sm text-muted">
        HIRAYA suggests candidate review priorities; the teacher decides. Sample data for the prototype.
      </p>
    </div>
  )
}
