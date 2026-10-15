import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Card from '../components/Card.jsx'
import MasteryRing from '../components/MasteryRing.jsx'
import Notice from '../components/Notice.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { paramsFor } from '../data/bktParams.js'
import { competencies } from '../data/mock.js'
import { questions } from '../data/questions.js'
import { updateMastery } from '../lib/bkt.js'
import { buttonClass } from '../lib/buttonClass.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { getCompetency } from '../lib/path.js'
import { recordPaperAssessment, updateSettings, useLearners, useSettings } from '../lib/store.js'
import {
  contextQuery,
  learnerLink,
  overviewLink,
  readContext,
  THRESHOLD_OPTIONS,
} from '../lib/teacherContext.js'

const ITEM_COUNT_OPTIONS = [3, 4, 5]

// Tri-state cycle for each paper item: null (unmarked) -> true (correct) -> false (wrong)
function nextMark(current) {
  if (current === null || current === undefined) return true
  if (current === true) return false
  return null
}

function computePreview(prior, marks, params) {
  const answered = (marks ?? []).filter((m) => typeof m === 'boolean')
  if (answered.length === 0 || typeof prior !== 'number') {
    return { after: prior, answeredCount: 0, correctCount: 0 }
  }
  let after = prior
  for (const correct of answered) {
    after = updateMastery(after, correct, params)
  }
  return {
    after,
    answeredCount: answered.length,
    correctCount: answered.filter(Boolean).length,
  }
}

export default function PaperAssessment() {
  const [params, setParams] = useSearchParams()
  const learners = useLearners()
  const settings = useSettings()

  const effectiveParams = new URLSearchParams(params)
  if (!effectiveParams.has('target')) effectiveParams.set('target', settings.targetId)
  if (!effectiveParams.has('theta')) effectiveParams.set('theta', String(settings.theta))
  if (!effectiveParams.has('learner') && settings.learnerId) {
    effectiveParams.set('learner', settings.learnerId)
  }

  const { target: targetId, theta, learnerId, invalid } = readContext(
    effectiveParams,
    learners.map((l) => l.id),
  )

  useEffect(() => {
    updateSettings({
      targetId,
      theta,
      ...(learnerId ? { learnerId } : {}),
    })
  }, [targetId, theta, learnerId])

  const target = getCompetency(targetId)
  const bktParams = paramsFor(targetId)
  const skillQuestions = questions[targetId] ?? []

  const [itemCount, setItemCount] = useState(() =>
    Math.min(5, Math.max(3, skillQuestions.length || 3)),
  )
  const [assessmentTitle, setAssessmentTitle] = useState('Seatwork / Paper Quiz #1')
  // sheet: { [learnerId]: Array<boolean | null> }
  const [sheet, setSheet] = useState({})
  const [lastReceipt, setLastReceipt] = useState(null)

  const updateContext = (change) =>
    setParams(contextQuery({ target: targetId, theta, learnerId, ...change }), { replace: true })

  const handleSkillChange = (newSkillId) => {
    const qLen = (questions[newSkillId] ?? []).length
    setItemCount(Math.min(5, Math.max(3, qLen || 3)))
    setSheet({})
    setLastReceipt(null)
    updateContext({ target: newSkillId })
  }

  const handleItemCountChange = (count) => {
    setItemCount(count)
    setSheet((prev) => {
      const next = {}
      for (const [id, marks] of Object.entries(prev)) {
        next[id] = Array.from({ length: count }, (_, i) => marks[i] ?? null)
      }
      return next
    })
  }

  const getMarks = (id) =>
    Array.from({ length: itemCount }, (_, i) => sheet[id]?.[i] ?? null)

  const toggleItem = (id, idx) => {
    setLastReceipt(null)
    setSheet((prev) => {
      const row = Array.from({ length: itemCount }, (_, i) => prev[id]?.[i] ?? null)
      row[idx] = nextMark(row[idx])
      return { ...prev, [id]: row }
    })
  }

  const fillRow = (id, value) => {
    setLastReceipt(null)
    setSheet((prev) => ({
      ...prev,
      [id]: Array.from({ length: itemCount }, () => value),
    }))
  }

  const clearAll = () => {
    setSheet({})
    setLastReceipt(null)
  }

  // Count how many learners have at least one marked item
  const pendingEntries = {}
  let totalMarkedItems = 0
  for (const l of learners) {
    const answered = getMarks(l.id).filter((m) => typeof m === 'boolean')
    if (answered.length > 0) {
      pendingEntries[l.id] = answered
      totalMarkedItems += answered.length
    }
  }
  const pendingLearnerCount = Object.keys(pendingEntries).length

  const handleCommit = (e) => {
    e.preventDefault()
    if (pendingLearnerCount === 0) return
    const changes = recordPaperAssessment(targetId, pendingEntries)
    setLastReceipt({
      title: assessmentTitle.trim() || 'Paper Assessment',
      skill: target,
      learnerCount: Object.keys(changes).length,
      itemCount: totalMarkedItems,
      changes,
    })
    setSheet({})
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Top Header & Controls */}
      <Card className="border-brand/25">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Link
              to={overviewLink({ target: targetId, theta, learnerId })}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"
            >
              <span aria-hidden="true">←</span> Class overview
            </Link>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                Classroom Paper-to-BKT Bridge
              </span>
              <span className="text-xs font-bold text-muted">
                P(G)={bktParams.guess.toFixed(2)} · P(S)={bktParams.slip.toFixed(2)} · P(T)={bktParams.learn.toFixed(2)}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Record paper assessment
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              Encode item-by-item results from printed quizzes or seatwork for{' '}
              <strong className="text-ink">{target.name}</strong>. Each marked item runs a sequential
              Bayesian Knowledge Tracing update in memory.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-60">
              <label
                htmlFor="record-skill"
                className="mb-1.5 block text-xs font-bold tracking-wider text-muted uppercase"
              >
                Assessed competency
              </label>
              <select
                id="record-skill"
                value={targetId}
                onChange={(e) => handleSkillChange(e.target.value)}
                className="block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-bold shadow-2xs transition-colors hover:border-brand focus:border-brand"
              >
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">
                Paper items
              </p>
              <div
                role="group"
                aria-label="Number of items on paper assessment"
                className="inline-flex rounded-xl border border-line bg-white p-1 shadow-2xs"
              >
                {ITEM_COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleItemCountChange(n)}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-all cursor-pointer ${
                      itemCount === n ? 'bg-brand text-white shadow-xs' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {n} items
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">
                Threshold (θ)
              </p>
              <div
                role="group"
                aria-label="Mastery threshold"
                className="inline-flex rounded-xl border border-line bg-white p-1 shadow-2xs"
              >
                {THRESHOLD_OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => updateContext({ theta: o })}
                    className={`rounded-lg px-3.5 py-1.5 text-sm font-bold transition-all cursor-pointer ${
                      theta === o ? 'bg-brand text-white shadow-xs' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {percent(o)}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {invalid.target && (
        <Notice>The target competency in the link was not recognized, so the default target is shown.</Notice>
      )}
      {invalid.theta && (
        <Notice>The mastery threshold in the link was not recognized, so {percent(theta)}% is used.</Notice>
      )}

      {/* Confirmation Receipt Banner after Recording */}
      {lastReceipt && (
        <Card className="border-mastered/40 bg-mastered-soft/35">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mastered text-white px-3 py-0.5 text-xs font-bold">
                ✓ BKT Estimates Updated
              </span>
              <h2 className="mt-2 font-display text-xl font-bold text-ink">
                Recorded &ldquo;{lastReceipt.title}&rdquo; for {lastReceipt.skill.name}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Processed <strong className="text-ink">{lastReceipt.itemCount}</strong> item responses across{' '}
                <strong className="text-ink">{lastReceipt.learnerCount}</strong> learner
                {lastReceipt.learnerCount === 1 ? '' : 's'}. Class overview and student remediation paths are now in sync.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                to={overviewLink({ target: targetId, theta, learnerId })}
                className={buttonClass('primary', 'sm')}
              >
                View updated class overview
              </Link>
              <button
                type="button"
                onClick={() => setLastReceipt(null)}
                className={`cursor-pointer ${buttonClass('outline', 'sm')}`}
              >
                Dismiss
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Reference Item Key (from sample item bank) */}
      {skillQuestions.length > 0 && (
        <Card>
          <details className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-lg font-bold">
                  Reference item key for {target.short} ({skillQuestions.length} sample items)
                </h2>
                <p className="text-xs text-muted">
                  Optional reference if your printed worksheet uses HIRAYA&apos;s benchmark items.
                </p>
              </div>
              <span className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold text-brand group-open:bg-brand-soft">
                Toggle answer key
              </span>
            </summary>
            <ol className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
              {skillQuestions.slice(0, itemCount).map((q, idx) => (
                <li key={q.id} className="rounded-xl border border-line bg-white p-3.5 text-sm">
                  <p className="text-xs font-bold text-brand uppercase">Item Q{idx + 1}</p>
                  <p className="mt-1 font-bold text-ink">{q.prompt}</p>
                  <p className="mt-2 text-xs text-mastered-ink font-bold">
                    Key: {['A', 'B', 'C', 'D'][q.answer]}. {q.options[q.answer]}
                  </p>
                </li>
              ))}
            </ol>
          </details>
        </Card>
      )}

      {/* Main Grading Matrix */}
      <Card as="form" onSubmit={handleCommit}>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div className="min-w-64 flex-1 sm:max-w-sm">
            <label
              htmlFor="assessment-title"
              className="mb-1 block text-xs font-bold tracking-wider text-muted uppercase"
            >
              Assessment label
            </label>
            <input
              id="assessment-title"
              type="text"
              value={assessmentTitle}
              onChange={(e) => setAssessmentTitle(e.target.value)}
              placeholder="e.g. Quiz 2 — Linear Equations"
              className="block w-full rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-bold shadow-2xs focus:border-brand"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>Click an item cell to cycle:</span>
            <span className="rounded-md border border-line bg-surface px-2 py-1 font-bold text-muted">
              — Blank
            </span>
            <span>→</span>
            <span className="rounded-md border border-mastered/40 bg-mastered-soft px-2 py-1 font-bold text-mastered-ink">
              ✓ Correct
            </span>
            <span>→</span>
            <span className="rounded-md border border-low/40 bg-low-soft px-2 py-1 font-bold text-low-ink">
              ✗ Wrong
            </span>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-bold tracking-wider text-muted uppercase">
                <th className="py-3 pr-4">Learner</th>
                <th className="py-3 px-3 text-center">Prior P(L)</th>
                {Array.from({ length: itemCount }, (_, i) => (
                  <th key={i} className="py-3 px-2 text-center">
                    Q{i + 1}
                  </th>
                ))}
                <th className="py-3 px-3 text-center">Quick fill</th>
                <th className="py-3 pl-4 text-right">Preview After P(L)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {learners.map((l) => {
                const prior = l.mastery?.[targetId] ?? 0
                const marks = getMarks(l.id)
                const { after, answeredCount, correctCount } = computePreview(
                  prior,
                  marks,
                  bktParams,
                )
                const delta = Math.round(after * 100) - Math.round(prior * 100)
                const isSelectedLearner = l.id === learnerId

                return (
                  <tr
                    key={l.id}
                    className={isSelectedLearner ? 'bg-brand-soft/30' : 'hover:bg-surface/60'}
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        <MasteryRing p={after} theta={theta} size={42} />
                        <div>
                          <Link
                            to={learnerLink({ learnerId: l.id, target: targetId, theta })}
                            className="font-bold text-brand hover:underline"
                          >
                            {l.name}
                          </Link>
                          <p className="text-xs text-muted">
                            {answeredCount === 0
                              ? 'No items marked'
                              : `${correctCount}/${answeredCount} correct`}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-display font-bold tabular-nums text-muted">
                      {formatPercent(prior, theta)}
                    </td>

                    {marks.map((mark, idx) => (
                      <td key={idx} className="py-3.5 px-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => toggleItem(l.id, idx)}
                          aria-label={`${l.name} Question ${idx + 1}: ${
                            mark === true ? 'Correct' : mark === false ? 'Wrong' : 'Unmarked'
                          }`}
                          className={`h-10 w-12 rounded-xl border font-display text-sm font-bold transition-all cursor-pointer ${
                            mark === true
                              ? 'border-mastered bg-mastered-soft text-mastered-ink shadow-2xs'
                              : mark === false
                                ? 'border-low bg-low-soft text-low-ink shadow-2xs'
                                : 'border-line bg-white text-muted hover:border-brand'
                          }`}
                        >
                          {mark === true ? '✓' : mark === false ? '✗' : '—'}
                        </button>
                      </td>
                    ))}

                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => fillRow(l.id, true)}
                          title={`Mark all items correct for ${l.name}`}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-mastered-ink hover:border-mastered cursor-pointer"
                        >
                          All ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => fillRow(l.id, false)}
                          title={`Mark all items wrong for ${l.name}`}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-low-ink hover:border-low cursor-pointer"
                        >
                          All ✗
                        </button>
                        {answeredCount > 0 && (
                          <button
                            type="button"
                            onClick={() => fillRow(l.id, null)}
                            title={`Clear marks for ${l.name}`}
                            className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-muted hover:border-brand cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 pl-4 text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-2">
                        {answeredCount > 0 && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                              delta >= 0
                                ? 'bg-mastered-soft text-mastered-ink'
                                : 'bg-low-soft text-low-ink'
                            }`}
                          >
                            {delta >= 0 ? `+${delta}%` : `${delta}%`}
                          </span>
                        )}
                        <span className="w-14 font-display text-base font-bold tabular-nums text-ink">
                          {formatPercent(after, theta)}
                        </span>
                        <StatusPill band={statusFor(after, theta)} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
          <p className="text-sm text-muted">
            {pendingLearnerCount === 0 ? (
              'Mark at least one item above to preview and record BKT updates.'
            ) : (
              <>
                Ready to update <strong className="text-ink">{pendingLearnerCount}</strong> learner
                {pendingLearnerCount === 1 ? '' : 's'} (<strong className="text-ink">{totalMarkedItems}</strong>{' '}
                marked item{totalMarkedItems === 1 ? '' : 's'}) on{' '}
                <strong className="text-ink">{target.short}</strong>.
              </>
            )}
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={clearAll}
              disabled={pendingLearnerCount === 0}
              className={`cursor-pointer ${buttonClass('outline', 'sm')}`}
            >
              Clear sheet
            </button>
            <button
              type="submit"
              disabled={pendingLearnerCount === 0}
              className={`cursor-pointer ${buttonClass('primary', 'sm')}`}
            >
              Record assessment &amp; update BKT
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}