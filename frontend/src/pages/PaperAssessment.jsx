import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Card from '../components/Card.jsx'
import MasteryRing from '../components/MasteryRing.jsx'
import Notice from '../components/Notice.jsx'
import SegmentedControl from '../components/SegmentedControl.jsx'
import UndoToast from '../components/UndoToast.jsx'
import StatusPill from '../components/StatusPill.jsx'
import { paramsFor } from '../data/bktParams.js'
import { competencies } from '../data/mock.js'
import { questions } from '../data/questions.js'
import { updateMastery } from '../lib/bkt.js'
import { buttonClass } from '../lib/buttonClass.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { getCompetency } from '../lib/path.js'
import { recordPaperAssessment, undoMasteryChange, updateSettings, useLearners, useSettings } from '../lib/store.js'
import {
  contextQuery,
  learnerLink,
  overviewLink,
  readContext,
  THRESHOLD_OPTIONS,
} from '../lib/teacherContext.js'

const ITEM_COUNT_OPTIONS = [3, 4, 5]

// Sticky learner column needs an opaque background; this is the selected-row tint on top of the panel colour.
const selectedStickyBg = 'bg-[color-mix(in_srgb,var(--color-brand-soft)_30%,var(--color-panel))]'

const markLabel = (m) => (m === true ? 'Correct' : m === false ? 'Wrong' : 'Unmarked')
const isMarked = (m) => typeof m === 'boolean'
const hasPrior = (p) => typeof p === 'number' && Number.isFinite(p)
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

// Keys that mark a cell directly, so a wrong answer does not need two clicks.
const CORRECT_KEYS = ['1', 'c', 'y']
const WRONG_KEYS = ['0', 'x', 'w', 'n']

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
  const [toast, setToast] = useState(null)
  const [announce, setAnnounce] = useState('')
  // One column is the tab stop in every row; arrow keys move it.
  const [activeCol, setActiveCol] = useState(0)
  const cellRefs = useRef({})
  const sheetRef = useRef(sheet)
  useEffect(() => {
    sheetRef.current = sheet
  }, [sheet])

  const sheetHasMarks = (s) => learners.some((l) => (s[l.id] ?? []).some(isMarked))

  const updateContext = (change) =>
    setParams(contextQuery({ target: targetId, theta, learnerId, ...change }), { replace: true })

  const handleSkillChange = (newSkillId) => {
    if (newSkillId === targetId) return
    if (
      sheetHasMarks(sheet) &&
      !window.confirm(
        `You have marked items for ${target.short} that are not recorded yet. Switching competency will discard them. Switch anyway?`,
      )
    ) {
      return
    }
    const qLen = (questions[newSkillId] ?? []).length
    setItemCount(Math.min(5, Math.max(3, qLen || 3)))
    setSheet({})
    setLastReceipt(null)
    updateContext({ target: newSkillId })
  }

  const handleItemCountChange = (count) => {
    const droppedMarks =
      count < itemCount &&
      learners.some((l) => (sheet[l.id] ?? []).slice(count).some(isMarked))
    if (
      droppedMarks &&
      !window.confirm(`Showing ${count} items will remove the marks you entered from Q${count + 1} onward. Continue?`)
    ) {
      return
    }
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

  const setMark = (id, idx, value) => {
    setLastReceipt(null)
    setSheet((prev) => {
      const row = Array.from({ length: itemCount }, (_, i) => prev[id]?.[i] ?? null)
      row[idx] = value
      return { ...prev, [id]: row }
    })
    const name = learners.find((l) => l.id === id)?.name ?? 'Learner'
    setAnnounce(`${name}, question ${idx + 1}: ${markLabel(value)}`)
  }

  const toggleItem = (id, idx) => setMark(id, idx, nextMark(getMarks(id)[idx]))

  // Arrow keys move between cells; 1/C = correct, 0/X = wrong, Backspace/Delete = blank.
  const handleCellKey = (e, rowIdx, colIdx, learnerId) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const focusCell = (r, c) => {
      const el = cellRefs.current[`${r}:${c}`]
      if (!el) return
      e.preventDefault()
      setActiveCol(c)
      el.focus()
    }
    const lastCol = itemCount - 1
    const lastRow = learners.length - 1
    switch (e.key) {
      case 'ArrowRight': return focusCell(rowIdx, Math.min(colIdx + 1, lastCol))
      case 'ArrowLeft': return focusCell(rowIdx, Math.max(colIdx - 1, 0))
      case 'ArrowDown': return focusCell(Math.min(rowIdx + 1, lastRow), colIdx)
      case 'ArrowUp': return focusCell(Math.max(rowIdx - 1, 0), colIdx)
      case 'Home': return focusCell(rowIdx, 0)
      case 'End': return focusCell(rowIdx, lastCol)
      default:
    }
    const key = e.key.toLowerCase()
    let value
    if (CORRECT_KEYS.includes(key)) value = true
    else if (WRONG_KEYS.includes(key)) value = false
    else if (e.key === 'Backspace' || e.key === 'Delete') value = null
    else return
    e.preventDefault()
    setMark(learnerId, colIdx, value)
    // After marking, move on so a row can be typed quickly (for example 1 1 0 1).
    if (value !== null && colIdx < lastCol) focusCell(rowIdx, colIdx + 1)
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
    // A learner with no starting estimate cannot be updated (the prototype starts BKT from the current estimate).
    if (!hasPrior(l.mastery?.[targetId])) continue
    const answered = getMarks(l.id).filter((m) => typeof m === 'boolean')
    if (answered.length > 0) {
      pendingEntries[l.id] = answered
      totalMarkedItems += answered.length
    }
  }
  const pendingLearnerCount = Object.keys(pendingEntries).length

  // Reloading or closing the tab also discards unrecorded marks.
  useEffect(() => {
    if (pendingLearnerCount === 0) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pendingLearnerCount])

  const handleCommit = (e) => {
    e.preventDefault()
    if (pendingLearnerCount === 0) return
    const snapshot = { skillId: targetId, itemCount, sheet }
    const changes = recordPaperAssessment(targetId, pendingEntries)
    const title = assessmentTitle.trim() || 'Paper Assessment'
    const learnerCount = Object.keys(changes).length
    setLastReceipt({
      title,
      skill: target,
      learnerCount,
      itemCount: totalMarkedItems,
      changes,
    })
    setSheet({})
    setToast({
      message: `Recorded “${title}” for ${target.short}: ${plural(learnerCount, 'learner')} updated.`,
      actionLabel: 'Undo',
      onAction: () => handleUndo(changes, snapshot),
    })
  }

  // Puts the estimates back and, if the sheet is still empty, puts the marks back too so they can be corrected.
  const handleUndo = (changes, snapshot) => {
    const { restored, skipped } = undoMasteryChange(snapshot.skillId, changes)
    setLastReceipt(null)
    const sheetIsEmpty = !sheetHasMarks(sheetRef.current)
    const marksBack = restored.length > 0 && sheetIsEmpty
    if (marksBack) {
      setItemCount(snapshot.itemCount)
      setSheet(snapshot.sheet)
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('target', snapshot.skillId)
          return next
        },
        { replace: true },
      )
    }
    const parts = [`Undone: ${plural(restored.length, 'learner')} restored to the earlier estimate.`]
    if (skipped.length > 0) {
      parts.push(`${plural(skipped.length, 'learner')} not restored because their estimate changed since.`)
    }
    if (marksBack) parts.push('Your marks are back on the sheet.')
    setToast({ message: parts.join(' ') })
  }

  // Warn before in-page links throw away marks that are not recorded yet.
  const guardLeave = (e) => {
    if (
      pendingLearnerCount > 0 &&
      !window.confirm('You have marked items that are not recorded yet. Leave this page and discard them?')
    ) {
      e.preventDefault()
    }
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Top Header & Controls */}
      <Card className="border-brand/25">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Link
              to={overviewLink({ target: targetId, theta, learnerId })}
              onClick={guardLeave}
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
              <p id="item-count-label" className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">
                Paper items
              </p>
              <SegmentedControl
                value={itemCount}
                options={ITEM_COUNT_OPTIONS}
                onChange={handleItemCountChange}
                getLabel={(n) => `${n} items`}
                labelledBy="item-count-label"
              />
            </div>

            <div>
              <p id="paper-theta-label" className="mb-1.5 text-xs font-bold tracking-wider text-muted uppercase">
                Threshold (θ)
              </p>
              <SegmentedControl
                value={theta}
                options={THRESHOLD_OPTIONS}
                onChange={(o) => updateContext({ theta: o })}
                getLabel={(o) => `${percent(o)}%`}
                labelledBy="paper-theta-label"
              />
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mastered text-on-mastered px-3 py-0.5 text-xs font-bold">
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
              <span className="shrink-0 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-bold whitespace-nowrap text-brand group-open:bg-brand-soft">
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
            <span>Click an item cell to cycle (or use the keys below):</span>
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

        <p className="mt-4 text-xs text-muted pointer-coarse:hidden">
          <strong className="text-ink">Keyboard:</strong> arrow keys move between cells · <kbd>1</kbd> or <kbd>C</kbd> = correct · <kbd>0</kbd> or <kbd>X</kbd> = wrong · <kbd>Backspace</kbd> = blank. After a mark, focus moves to the next question.
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {announce}
        </p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-bold tracking-wider text-muted uppercase">
                <th scope="col" className="sticky left-0 z-10 bg-panel py-3 pr-4">Learner</th>
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
              {learners.map((l, rowIdx) => {
                const prior = l.mastery?.[targetId]
                const canMark = hasPrior(prior)
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
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 py-3.5 pr-4 text-left font-normal ${
                        isSelectedLearner ? selectedStickyBg : 'bg-panel'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MasteryRing p={after} theta={theta} size={42} />
                        <div>
                          <Link
                            to={learnerLink({ learnerId: l.id, target: targetId, theta })}
                            onClick={guardLeave}
                            className="font-bold text-brand hover:underline"
                          >
                            {l.name}
                          </Link>
                          <p className="text-xs text-muted">
                            {!canMark
                              ? 'No starting estimate, cannot record'
                              : answeredCount === 0
                                ? 'No items marked'
                                : `${correctCount}/${answeredCount} correct`}
                          </p>
                        </div>
                      </div>
                    </th>

                    <td className="py-3.5 px-3 text-center font-display font-bold tabular-nums text-muted">
                      {formatPercent(prior, theta)}
                    </td>

                    {marks.map((mark, idx) => (
                      <td key={idx} className="py-3.5 px-1.5 text-center">
                        <button
                          type="button"
                          ref={(el) => {
                            cellRefs.current[`${rowIdx}:${idx}`] = el
                          }}
                          disabled={!canMark}
                          tabIndex={idx === Math.min(activeCol, itemCount - 1) ? 0 : -1}
                          onFocus={() => setActiveCol(idx)}
                          onClick={() => toggleItem(l.id, idx)}
                          onKeyDown={(e) => handleCellKey(e, rowIdx, idx, l.id)}
                          aria-label={`${l.name} Question ${idx + 1}: ${canMark ? markLabel(mark) : 'no starting estimate'}`}
                          className={`h-10 w-12 rounded-xl border font-display text-sm font-bold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
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
                          disabled={!canMark}
                          aria-label={`Mark all items correct for ${l.name}`}
                          title={`Mark all items correct for ${l.name}`}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-mastered-ink hover:border-mastered cursor-pointer"
                        >
                          All ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => fillRow(l.id, false)}
                          disabled={!canMark}
                          aria-label={`Mark all items wrong for ${l.name}`}
                          title={`Mark all items wrong for ${l.name}`}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-bold text-low-ink hover:border-low cursor-pointer"
                        >
                          All ✗
                        </button>
                        {answeredCount > 0 && (
                          <button
                            type="button"
                            onClick={() => fillRow(l.id, null)}
                            aria-label={`Clear marks for ${l.name}`}
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

      <UndoToast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}