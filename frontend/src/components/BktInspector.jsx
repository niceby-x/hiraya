import { useState } from 'react'
import { paramsFor } from '../data/bktParams.js'
import { observe, predictCorrect, updateMastery } from '../lib/bkt.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { getCompetency } from '../lib/path.js'
import { recordResponse, undoMasteryChange } from '../lib/store.js'
import StatusPill from './StatusPill.jsx'

export default function BktInspector({ learner, skillId, theta, onClose }) {
  // { learnerId, skillId, correct, before, after, undone } for the last demo action in this dialog.
  const [demo, setDemo] = useState(null)

  if (!learner || !skillId) return null

  const competency = getCompetency(skillId)
  if (!competency) return null

  const prior = learner.mastery?.[skillId]
  const hasPrior = typeof prior === 'number' && Number.isFinite(prior)
  const params = paramsFor(skillId)

  const pCorrectNext = hasPrior ? predictCorrect(prior, params) : null
  const obsRight = hasPrior ? observe(prior, true, params) : null
  const nextRight = hasPrior ? updateMastery(prior, true, params) : null
  const obsWrong = hasPrior ? observe(prior, false, params) : null
  const nextWrong = hasPrior ? updateMastery(prior, false, params) : null

  const fmtDec = (n) => (typeof n === 'number' ? `${(n * 100).toFixed(1)}%` : '—')

  const runDemo = (correct) => {
    const change = recordResponse(learner.id, skillId, correct)
    setDemo({ learnerId: learner.id, skillId, correct, ...change, undone: false })
  }
  const undoDemo = () => {
    undoMasteryChange(skillId, { [learner.id]: { before: demo.before, after: demo.after } })
    setDemo({ ...demo, undone: true })
  }
  const lastDemo = demo && demo.learnerId === learner.id && demo.skillId === skillId ? demo : null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bkt-inspector-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="tc-card relative w-full max-w-lg rounded-2xl border border-brand/35 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
                BKT Model Inspector
              </span>
              <span className="text-xs font-bold text-muted">{learner.name}</span>
            </div>
            <h2 id="bkt-inspector-title" className="mt-1.5 font-display text-xl font-bold text-ink">
              {competency.name} ({competency.short})
            </h2>
            <p className="text-xs text-muted">{competency.strand}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close BKT inspector"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-white text-muted transition-colors hover:border-brand hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Current State & Prediction */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-white p-3.5">
            <p className="text-xs font-bold tracking-wider text-muted uppercase">
              Current Mastery P(Lₙ)
            </p>
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="font-display text-2xl font-bold text-ink tabular-nums">
                {formatPercent(prior, theta)}
              </span>
              <StatusPill band={statusFor(prior, theta)} />
            </div>
            <p className="mt-1 text-xs text-muted tabular-nums">
              Exact prior: {hasPrior ? prior.toFixed(4) : 'No data'} (θ = {percent(theta)}%)
            </p>
          </div>

          <div className="rounded-xl border border-line bg-white p-3.5">
            <p className="text-xs font-bold tracking-wider text-muted uppercase">
              Next Correct Pred. P(Cₙ₊₁)
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-brand tabular-nums">
              {fmtDec(pCorrectNext)}
            </p>
            <p className="mt-1 text-xs text-muted">
              P(Lₙ)(1 − S) + (1 − P(Lₙ))G
            </p>
          </div>
        </div>

        {/* Fitted / Sample BKT Parameters */}
        <div className="mt-4">
          <p className="text-xs font-bold tracking-wider text-muted uppercase">
            Skill BKT Parameters (Sample)
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl border border-line bg-white p-2.5">
              <p className="text-xs font-bold text-muted">Guess P(G)</p>
              <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">
                {params.guess.toFixed(2)}
              </p>
              <p className="text-xs text-muted">Right without mastery</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-2.5">
              <p className="text-xs font-bold text-muted">Slip P(S)</p>
              <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">
                {params.slip.toFixed(2)}
              </p>
              <p className="text-xs text-muted">Wrong despite mastery</p>
            </div>
            <div className="rounded-xl border border-line bg-white p-2.5">
              <p className="text-xs font-bold text-muted">Learn P(T)</p>
              <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">
                {params.learn.toFixed(2)}
              </p>
              <p className="text-xs text-muted">Transition per item</p>
            </div>
          </div>
        </div>

        {/* Two-Step Posterior Transition Preview */}
        {hasPrior && (
          <div className="mt-4">
            <p className="text-xs font-bold tracking-wider text-muted uppercase">
              Next Response Bayesian Update Preview
            </p>
            <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-mastered/30 bg-mastered-soft/45 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-mastered-ink">If Next Answer is Correct</span>
                  <span className="rounded-full bg-mastered text-on-mastered px-2 py-0.5 text-xs font-bold tabular-nums">
                    +{ ((nextRight - prior) * 100).toFixed(1) }%
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted tabular-nums">
                  1. Posterior P(L|✓): <strong className="text-ink">{fmtDec(obsRight)}</strong>
                </p>
                <p className="text-xs text-muted tabular-nums">
                  2. After Learn P(Lₙ): <strong className="text-mastered-ink">{fmtDec(nextRight)}</strong>
                </p>
              </div>

              <div className="rounded-xl border border-low/30 bg-low-soft/45 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-low-ink">If Next Answer is Wrong</span>
                  <span className="rounded-full bg-low text-on-low px-2 py-0.5 text-xs font-bold tabular-nums">
                    { ((nextWrong - prior) * 100).toFixed(1) }%
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted tabular-nums">
                  1. Posterior P(L|✗): <strong className="text-ink">{fmtDec(obsWrong)}</strong>
                </p>
                <p className="text-xs text-muted tabular-nums">
                  2. After Learn P(Lₙ): <strong className="text-low-ink">{fmtDec(nextWrong)}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {hasPrior && (
          <div className="mt-4 rounded-xl border-2 border-dashed border-gap/60 bg-gap-soft/40 p-3.5">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-gap-ink">
              <span className="rounded-full bg-gap px-2 py-0.5 text-xs font-bold text-white">DEMO ONLY</span>
              Changes the shared sample data
            </p>
            <p className="mt-1.5 text-sm text-ink">
              Recording a demo answer changes {learner.name}&apos;s {competency.short} estimate for everyone using this
              prototype, including the student view. Use Undo here, or <strong>Reset demo</strong> in the top bar, to
              restore it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => runDemo(true)}
                className="rounded-lg border-2 border-mastered bg-white px-3.5 py-2 text-sm font-bold text-mastered-ink transition-colors hover:bg-mastered-soft cursor-pointer"
              >
                Record a correct answer (demo)
              </button>
              <button
                type="button"
                onClick={() => runDemo(false)}
                className="rounded-lg border-2 border-low bg-white px-3.5 py-2 text-sm font-bold text-low-ink transition-colors hover:bg-low-soft cursor-pointer"
              >
                Record a wrong answer (demo)
              </button>
            </div>
            <div role="status" aria-live="polite">
              {lastDemo && (
                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-ink">
                  <span>
                    {lastDemo.undone
                      ? `Undone: back to ${formatPercent(lastDemo.before, theta)}.`
                      : `Recorded a ${lastDemo.correct ? 'correct' : 'wrong'} answer: ${formatPercent(lastDemo.before, theta)} → ${formatPercent(lastDemo.after, theta)}.`}
                  </span>
                  {!lastDemo.undone && (
                    <button
                      type="button"
                      onClick={undoDemo}
                      className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs font-bold text-brand hover:border-brand cursor-pointer"
                    >
                      Undo
                    </button>
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}