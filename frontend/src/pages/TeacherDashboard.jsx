import { Fragment, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { competencies } from '../data/mock.js'
import { classWideReview, masteredCount, targetSummary, visibleRows } from '../lib/classStats.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { displayOrder, getCompetency } from '../lib/path.js'
import { updateSettings, useLearners, useSettings } from '../lib/store.js'
import { contextQuery, learnerLink, readContext, THRESHOLD_OPTIONS } from '../lib/teacherContext.js'
import Card from '../components/Card.jsx'
import Notice from '../components/Notice.jsx'
import StatusPill from '../components/StatusPill.jsx'
import MasteryRing from '../components/MasteryRing.jsx'
import SegmentedControl from '../components/SegmentedControl.jsx'
import BktInspector from '../components/BktInspector.jsx'
import LearnerCompareDrawer from '../components/LearnerCompareDrawer.jsx'

const cellStyles = {
  meets: 'bg-mastered-soft text-mastered-ink border border-mastered/25',
  below: 'bg-gap-soft text-gap-ink border border-gap/30',
  none: 'bg-line text-ink border border-line',
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
  // The learner column is narrower on phones so more skill columns show beside it.
  gridTemplateColumns: `clamp(112px, 34vw, 150px) repeat(${competencies.length}, minmax(82px, 1fr))`,
}

function Stat({ label, value, sub, tone = 'brand', icon }) {
  const borderColors = {
    brand: 'border-t-4 border-t-brand',
    mastered: 'border-t-4 border-t-mastered',
    gap: 'border-t-4 border-t-gap',
  }
  return (
    <div className={`tc-card rounded-2xl p-4 sm:p-5 ${borderColors[tone] ?? borderColors.brand}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-bold tracking-wider text-muted uppercase">{label}</p>
        {icon && <span className="text-brand opacity-80">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  )
}

function LearnerLinks({ learners, target, theta }) {
  if (learners.length === 0) return null
  return (
    <details className="group w-full text-sm">
      <summary className="inline-flex cursor-pointer items-center gap-1.5 py-1 text-xs font-bold text-brand select-none hover:underline">
        <span>Show {learners.length} affected learner{learners.length === 1 ? '' : 's'}</span>
        <svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" className="transition-transform group-open:rotate-180" aria-hidden="true">
          <path d="M5 7.5L10 12.5L15 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <ul className="mt-2 flex flex-wrap gap-1.5 pb-1">
        {learners.map((l) => (
          <li key={l.id}>
            <Link
              to={learnerLink({ learnerId: l.id, target, theta })}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3 py-1 text-xs font-bold text-brand shadow-2xs transition-all hover:border-brand hover:bg-brand-soft"
            >
              {l.name}
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  )
}

function CountBar({ count, total, tone = 'gap' }) {
  const pct = total ? (count / total) * 100 : 0
  const fillClass = tone === 'brand' ? 'bg-brand' : 'bg-gap'
  return (
    <div className="h-2.5 min-w-36 flex-1 overflow-hidden rounded-full bg-line/80">
      <div
        className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function TeacherDashboard() {
  const [params, setParams] = useSearchParams()
  const learners = useLearners()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('roster')
  // Interactive BKT Inspector state: { learnerId, skillId } | null
  const [inspected, setInspected] = useState(null)
  // Quick-Compare Drawer state: { a: string, b: string } | null
  const [comparePair, setComparePair] = useState(null)

  const settings = useSettings()
  const effectiveParams = new URLSearchParams(params)
  if (!effectiveParams.has('target')) effectiveParams.set('target', settings.targetId)
  if (!effectiveParams.has('theta')) effectiveParams.set('theta', String(settings.theta))
  if (!effectiveParams.has('learner') && settings.learnerId) effectiveParams.set('learner', settings.learnerId)

  const { target: targetId, theta, learnerId, invalid } = readContext(effectiveParams, learners.map((l) => l.id))
  const target = getCompetency(targetId)
  const columns = displayOrder(targetId).map(getCompetency)

  useEffect(() => {
    updateSettings({
      targetId,
      theta,
      ...(learnerId ? { learnerId } : {}),
    })
  }, [targetId, theta, learnerId])

  const update = (change) =>
    setParams(contextQuery({ target: targetId, theta, learnerId, ...change }), { replace: true })

  const total = learners.length * competencies.length
  const masteredTotal = masteredCount(learners, theta)
  const classWide = classWideReview(learners, theta).filter((r) => r.count > 0)
  const summary = targetSummary(learners, targetId, theta)
  const rows = visibleRows(summary.rows, { query, sort })

  const inspectedLearner = inspected ? learners.find((l) => l.id === inspected.learnerId) : null

  const openCompareWith = (firstId) => {
    const secondId = learners.find((l) => l.id !== firstId)?.id ?? firstId
    setComparePair({ a: firstId, b: secondId })
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Top Hero & Global Control Bar */}
      <Card className="border-brand/25">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
              Grade 7 MATATAG Mathematics · Sample Cohort
            </div>
            <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Class overview
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              Showing <strong className="text-ink">{target.name}</strong> ({target.code ? `${target.code} · ` : ''}{target.strand}) as the target competency at a{' '}
              <strong className="text-ink">{percent(theta)}%</strong> mastery threshold.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-64 flex-1 sm:flex-initial">
              <label htmlFor="target" className="mb-1.5 block text-xs font-bold tracking-wider text-muted uppercase">
                Target competency
              </label>
              <select
                id="target"
                value={targetId}
                onChange={(e) => update({ target: e.target.value })}
                className="block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold shadow-2xs transition-colors hover:border-brand focus:border-brand"
              >
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short} ({c.code ?? c.id.toUpperCase()}) — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p id="theta-label" className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">
                Mastery threshold (θ)
              </p>
              <SegmentedControl
                value={theta}
                options={THRESHOLD_OPTIONS}
                onChange={(o) => update({ theta: o })}
                getLabel={(o) => `${percent(o)}%`}
                labelledBy="theta-label"
              />
            </div>

            {learners.length >= 2 && (
              <button
                type="button"
                onClick={() => openCompareWith(learners[0].id)}
                className="inline-flex items-center gap-2 rounded-xl border border-brand/30 bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-on-brand cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
                Compare learners
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3.5 text-xs text-muted">
          <span>
            Mastery figures are BKT posterior estimates P(Lₙ), not raw examination scores. Click any skill percentage cell below to inspect its BKT parameters and next-answer predictions.
          </span>
          <Link to="/teacher/graph" className="font-bold text-brand hover:underline">
            Validate prerequisite links →
          </Link>
        </div>
      </Card>

      {invalid.target && (
        <Notice>The target competency in the link was not recognized, so the default target is shown.</Notice>
      )}
      {invalid.theta && (
        <Notice>The mastery threshold in the link was not recognized, so {percent(theta)}% is used.</Notice>
      )}

      {learners.length === 0 ? (
        <Card>
          <h2 className="font-display text-2xl font-bold">No learners yet</h2>
          <p className="mt-2 text-muted">There are no learners in this class, so there are no mastery estimates to show.</p>
        </Card>
      ) : (
        <>
          {/* KPI Bento Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat
              label="Active Learners"
              value={learners.length}
              sub="Enrolled in Grade 7 sample roster"
              tone="brand"
              icon={
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
            <Stat
              label="Skills Tracked"
              value={competencies.length}
              sub={`${summary.prerequisites.length} prerequisites behind ${target.short}`}
              tone="brand"
              icon={
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              }
            />
            <Stat
              label={`Estimates ≥ ${percent(theta)}%`}
              value={`${masteredTotal} of ${total}`}
              sub={`${total ? Math.round((masteredTotal / total) * 100) : 0}% of all learner-skill pairs meet θ`}
              tone="mastered"
              icon={
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              }
            />
            <Stat
              label={`Below θ on ${target.short}`}
              value={`${summary.needsReview} of ${learners.length}`}
              sub={`${summary.withGaps} learner${summary.withGaps === 1 ? ' has' : 's have'} prerequisite gaps`}
              tone={summary.needsReview > 0 ? 'gap' : 'mastered'}
              icon={
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              }
            />
          </div>

          {/* Mastery Heatmap Matrix + Filter Controls */}
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <h2 className="font-display text-2xl font-bold">Mastery by learner and skill</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">
                  The selected target (<strong className="text-ink">{target.short}</strong>) and its prerequisites appear first in dependency order. Click any percentage cell to open its live BKT model breakdown.
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-3">
                <div className="w-full sm:w-auto sm:min-w-56">
                  <label htmlFor="learner-search" className="mb-1 block text-xs font-bold tracking-wider text-muted uppercase">
                    Search learners
                  </label>
                  <div className="relative">
                    <input
                      id="learner-search"
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Name or ID (e.g. Learner 03)"
                      autoComplete="off"
                      className="block w-full rounded-xl border border-line bg-white py-2 pr-3 pl-9 text-sm shadow-2xs focus:border-brand"
                    />
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <label htmlFor="learner-sort" className="mb-1 block text-xs font-bold tracking-wider text-muted uppercase">
                    Order learners by
                  </label>
                  <select
                    id="learner-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="block w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-bold shadow-2xs"
                  >
                    <option value="roster">Class list order</option>
                    <option value="gaps">Most candidate gaps first</option>
                  </select>
                </div>

                {query !== '' && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="rounded-xl border border-brand/30 bg-brand-soft px-3.5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-on-brand cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted" aria-live="polite">
              <span>
                Showing <strong className="text-ink">{rows.length}</strong> of <strong className="text-ink">{learners.length}</strong> learners. Class totals always cover all {learners.length} learners.
              </span>
              <span className="font-bold lg:hidden">Swipe sideways to inspect every skill →</span>
            </div>

            <div className="mt-4 overflow-x-auto pb-2">
              <div className="grid min-w-195 items-center gap-2" style={gridStyle}>
                <div className="sticky left-0 z-10 bg-panel/95 py-2 pr-2 backdrop-blur-xs">
                  <p className="text-xs font-bold tracking-wider text-muted uppercase">Learner</p>
                </div>
                {columns.map((c) => {
                  const isTarget = c.id === targetId
                  return (
                    <div
                      key={c.id}
                      className={`rounded-t-xl px-1.5 py-2 text-center ${
                        isTarget ? 'bg-brand-soft/80 ring-1 ring-brand/30' : ''
                      }`}
                    >
                      <p className={`text-sm font-bold ${isTarget ? 'text-brand' : 'text-ink'}`}>
                        {c.short}
                      </p>
                      <span className={`block text-[10px] font-bold ${isTarget ? 'text-brand' : 'text-muted'}`}>
                        {isTarget ? '★ Target' : c.code ?? c.id.toUpperCase()}
                      </span>
                    </div>
                  )
                })}

                {rows.map(({ learner: l, status, gaps }) => (
                  <Fragment key={l.id}>
                    <div className="sticky left-0 z-10 flex flex-col justify-center rounded-lg bg-panel/95 py-2 pr-3 backdrop-blur-xs">
                      <Link
                        to={learnerLink({ learnerId: l.id, target: targetId, theta })}
                        className="font-bold text-brand hover:underline flex items-center gap-1"
                      >
                        {l.name}
                      </Link>
                      <span
                        className={`mt-0.5 inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-bold ${
                          status === 'target-met'
                            ? 'bg-mastered-soft text-mastered-ink'
                            : gaps.length > 0
                              ? 'bg-gap-soft text-gap-ink'
                              : 'bg-line text-muted'
                        }`}
                      >
                        {gapNote(status, gaps)}
                      </span>
                    </div>
                    {columns.map((c) => {
                      const p = l.mastery?.[c.id]
                      const s = statusFor(p, theta)
                      const isTarget = c.id === targetId
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setInspected({ learnerId: l.id, skillId: c.id })}
                          aria-haspopup="dialog"
                          aria-label={
                            s === 'none'
                              ? `${l.name}, ${c.name}: no data`
                              : `${l.name}, ${c.name}: ${formatPercent(p, theta)}, ${statusText[s]}`
                          }
                          title={`${l.name} — ${c.name}: ${formatPercent(p, theta)} (${statusText[s]}). Click to inspect BKT parameters.`}
                          className={`relative rounded-xl py-3 text-center text-sm font-bold tabular-nums transition-transform hover:-translate-y-0.5 cursor-pointer ${
                            cellStyles[s]
                          } ${isTarget ? 'ring-2 ring-brand/45 shadow-xs' : ''}`}
                        >
                          {marker[s] && <span aria-hidden="true" className="mr-0.5 text-xs">{marker[s]}</span>}
                          {formatPercent(p, theta)}
                        </button>
                      )
                    })}
                  </Fragment>
                ))}
              </div>
            </div>

            {rows.length === 0 && (
              <p className="mt-4 rounded-xl bg-surface p-4 text-center text-muted">
                No learners match &ldquo;{query}&rdquo;. Clear the search to see the whole class.
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-xs bg-mastered-soft border border-mastered/40" />
                <strong>✓ Meets threshold:</strong> estimate ≥ {percent(theta)}%
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-xs bg-gap-soft border border-gap/40" />
                <strong>▼ Below threshold:</strong> estimate &lt; {percent(theta)}%
              </span>
              <span className="ml-auto">Click any cell to inspect BKT math, or click a learner&apos;s name to open their full graph.</span>
            </div>
          </Card>

          {/* 2-Column Diagnostic Breakdown */}
          <div className="grid gap-7 lg:grid-cols-2">
            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                    Target-Specific ({target.code ?? target.short})
                  </span>
                  <span className="text-xs font-bold text-muted">
                    {summary.prerequisites.length} prerequisite{summary.prerequisites.length === 1 ? '' : 's'}
                  </span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold">
                  Candidate prerequisite gaps for {target.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Direct and indirect prerequisites of <strong className="text-ink">{target.short}</strong> below{' '}
                  {percent(theta)}%, ordered from earliest foundation to immediate prerequisite.
                </p>

                {summary.prerequisites.length === 0 ? (
                  <p className="mt-6 rounded-xl bg-surface p-4 text-sm text-muted">
                    This competency is a foundational root node and has no prerequisites in the sample graph.
                  </p>
                ) : (
                  <>
                    {summary.withGaps === 0 && (
                      <p className="mt-4 rounded-xl bg-mastered-soft p-3.5 text-sm font-bold text-mastered-ink">
                        No prerequisite competencies below {percent(theta)}% were identified for this target.
                      </p>
                    )}
                    <ul className="mt-4 divide-y divide-line">
                      {summary.prerequisites.map(({ competency, count, learners: affected }, idx) => (
                        <li key={competency.id} className="py-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/12 text-xs font-bold text-brand">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-bold">
                                  {competency.name}{' '}
                                  {competency.code && (
                                    <span className="ml-1 text-xs font-semibold text-muted">
                                      ({competency.code})
                                    </span>
                                  )}
                                </p>
                                {competency.resource && (
                                  <p className="text-xs text-muted">
                                    Resource: {competency.resource.title}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="rounded-full bg-gap-soft px-2.5 py-0.5 text-xs font-bold text-gap-ink tabular-nums">
                              {count} of {learners.length} learners
                            </span>
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <CountBar count={count} total={learners.length} />
                          </div>
                          <div className="mt-1.5">
                            <LearnerLinks learners={affected} target={targetId} theta={theta} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Counts use the exact same <code className="font-mono">candidatePath()</code> traversal as each learner&apos;s individual view.
              </p>
            </Card>

            <Card className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-gap-soft px-3 py-1 text-xs font-bold text-gap-ink">
                    Class-Wide Triage
                  </span>
                  <span className="text-xs font-bold text-muted">All 7 competencies</span>
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold">
                  Competencies that may need review across the class
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Learners with an estimate below {percent(theta)}% for each skill across the entire curriculum, regardless of the selected target.
                </p>

                {classWide.length === 0 ? (
                  <p className="mt-6 rounded-xl bg-mastered-soft p-4 text-sm font-bold text-mastered-ink">
                    No learner has an estimate below {percent(theta)}% for any skill.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-line">
                    {classWide.map(({ competency, count, learners: affected }) => (
                      <li key={competency.id} className="py-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-bold">
                              {competency.name}
                              {competency.code && (
                                <span className="ml-1.5 text-xs font-semibold text-muted">
                                  ({competency.code})
                                </span>
                              )}
                              {competency.id === targetId && (
                                <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand">
                                  Target
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted">{competency.strand}</p>
                          </div>
                          <span className="text-sm font-bold tabular-nums">
                            {count} of {learners.length}
                          </span>
                        </div>
                        <div className="mt-2">
                          <CountBar count={count} total={learners.length} />
                        </div>
                        <div className="mt-1.5">
                          <LearnerLinks learners={affected} target={targetId} theta={theta} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
                Sorted by most affected learners first so you can plan whole-class warmups or small-group stations.
              </p>
            </Card>
          </div>

          {/* Learner Target Status Roster */}
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  Learners and the target ({target.short}{target.code ? ` · ${target.code}` : ''})
                </h2>
                <p className="mt-1 text-sm text-muted">
                  A learner whose target estimate already meets {percent(theta)}% requires no remediation path for this target.
                </p>
              </div>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {rows.map(({ learner, status, gaps, path }) => {
                const p = learner.mastery?.[targetId]
                const text =
                  status === 'needs-review'
                    ? gaps.length === 0
                      ? 'No prerequisite gaps below the threshold; the target itself is below it'
                      : `${gaps.length} candidate prerequisite gap${gaps.length === 1 ? '' : 's'}: ${gaps.map((id) => getCompetency(id).short).join(' → ')}`
                    : status === 'target-met'
                      ? 'Target meets the threshold; no remediation path needed'
                      : 'No mastery data for this target'
                return (
                  <li key={learner.id} className="flex flex-wrap items-center gap-4 py-3.5 transition-colors hover:bg-brand-soft/25 px-2 rounded-xl">
                    <MasteryRing p={p} theta={theta} size={48} />
                    <div className="min-w-36">
                      <p className="font-bold text-ink">{learner.name}</p>
                      <p className="text-xs font-bold text-muted tabular-nums">
                        Target estimate: {formatPercent(p, theta)}
                      </p>
                    </div>
                    <StatusPill band={statusFor(p, theta)} />
                    <div className="min-w-52 flex-1">
                      <p className="text-sm text-muted">{text}</p>
                      {path.length > 0 && (
                        <p className="mt-0.5 text-xs font-bold text-brand">
                          Next step: {getCompetency(path[0]).name}
                        </p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {learners.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => openCompareWith(learner.id)}
                          className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-bold text-muted transition-colors hover:border-brand hover:text-brand cursor-pointer"
                        >
                          Compare
                        </button>
                      )}
                      <Link
                        to={learnerLink({ learnerId: learner.id, target: targetId, theta })}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand-soft px-3.5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-on-brand"
                      >
                        Open learner view
                        <span className="sr-only"> for {learner.name}</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </li>
                )
              })}
            </ul>
            {rows.length === 0 && (
              <p className="mt-4 text-muted">No learners match &ldquo;{query}&rdquo;. Clear the search to see the whole class.</p>
            )}
          </Card>
        </>
      )}

      <p className="text-center text-xs text-muted">
        HIRAYA suggests candidate review priorities; the teacher decides. Sample data for the prototype.
      </p>

      {/* Modals & Drawers */}
      {inspectedLearner && (
        <BktInspector
          learner={inspectedLearner}
          skillId={inspected.skillId}
          theta={theta}
          onClose={() => setInspected(null)}
        />
      )}

      {comparePair && (
        <LearnerCompareDrawer
          learners={learners}
          learnerAId={comparePair.a}
          learnerBId={comparePair.b}
          onSelectA={(a) => setComparePair((prev) => ({ ...prev, a }))}
          onSelectB={(b) => setComparePair((prev) => ({ ...prev, b }))}
          targetId={targetId}
          theta={theta}
          onClose={() => setComparePair(null)}
        />
      )}
    </div>
  )
}