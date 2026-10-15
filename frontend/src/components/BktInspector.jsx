import { useEffect, useState } from 'react'
import { paramsFor } from '../data/bktParams.js'
import { observe, predictCorrect, updateMastery } from '../lib/bkt.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { getCompetency } from '../lib/path.js'
import { recordResponse, undoMasteryChange } from '../lib/store.js'
import Overlay from './Overlay.jsx'
import StatusPill from './StatusPill.jsx'

export default function BktInspector({ learner, skillId, theta, onClose }) {
  // { learnerId, skillId, correct, before, after, undone } for the last demo action in this dialog.
  const [demo, setDemo] = useState(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
    <Overlay>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bkt-inspector-title"
        className="fixed inset-0 z-50 flex overflow-y-auto overscroll-contain bg-night/60 p-4 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="tc-card relative m-auto w-full max-w-lg rounded-2xl border border-brand/35 p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold text-brand">
                  BKT Model Inspector
                </span>
                {competency.code && (
                  <span className="rounded-full border border-line bg-surface px-2 py-0.5 text-[11px] font-bold text-muted">
                    {competency.code}
                  </span>
                )}
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
              <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
                Current Mastery P(Lₙ)
              </p>
              <div className="mt-1 flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-bold text-ink tabular-nums">
                  {formatPercent(prior, theta)}
                </span>
                <StatusPill band={statusFor(prior, theta)} />
              </div>
              <p className="mt-1 text-[11px] text-muted tabular-nums">
                Exact prior: {hasPrior ? prior.toFixed(4) : 'No data'} (θ = {percent(theta)}%)
              </p>
            </div>

            <div className="rounded-xl border border-line bg-white p-3.5">
              <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
                Next Correct Pred. P(Cₙ₊₁)
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-brand tabular-nums">
                {fmtDec(pCorrectNext)}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                P(Lₙ)(1 − S) + (1 − P(Lₙ))G
              </p>
            </div>
          </div>

          {/* All 4 BKT Parameters (Chapter 2) */}
          <div className="mt-4">
            <p className="text-xs font-bold tracking-wider text-muted uppercase">
              Four-Parameter BKT Configuration (Sample)
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
              <div className="rounded-xl border border-line bg-white p-2.5">
                <p className="text-xs font-bold text-muted">Init P(L₀)</p>
                <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">
                  {(params.init ?? 0.5).toFixed(2)}
                </p>
                <p className="text-[10px] text-muted">Starting prior</p>
              </div>
              <div className="rounded-xl border border-line bg-white p-2.5">
                <p className="text-xs font-bold text-muted">Learn P(T)</p>
                <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">
                  {params.learn.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted">Transition rate</p>
              </div>
              <div className="rounded-xl border border-line bg-white p-2.5">
                <p className="text-xs font-bold text-muted">Guess P(G)</p>
                <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">
                  {params.guess.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted">Right by chance</p>
              </div>
              <div className="rounded-xl border border-line bg-white p-2.5">
                <p className="text-xs font-bold text-muted">Slip P(S)</p>
                <p className="mt-0.5 font-display text-lg font-bold text-ink tabular-nums">
                  {params.slip.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted">Careless error</p>
              </div>
            </div>
          </div>

          {/* Interpretable Model Rationale (Table 2, Feature 3) */}
          {hasPrior && (
            <div className="mt-3 rounded-xl border border-brand/25 bg-brand-soft/45 px-3.5 py-2.5 text-xs text-ink">
              <strong>Interpretable BKT Rationale:</strong> Because Guess P(G)={params.guess.toFixed(2)} and Slip P(S)={params.slip.toFixed(2)}, BKT tempers single-item jumps so a lucky guess is not mistaken for mastery and a single slip does not erase high prior mastery.
            </div>
          )}

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
                    <span className="rounded-full bg-mastered text-on-mastered px-2 py-0.5 text-[11px] font-bold tabular-nums">
                      +{((nextRight - prior) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted tabular-nums">
                    1. Posterior P(Lₙ|right): <strong className="text-ink">{fmtDec(obsRight)}</strong>
                  </p>
                  <p className="text-xs text-muted tabular-nums">
                    2. After Learn P(Lₙ): <strong className="text-mastered-ink">{fmtDec(nextRight)}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => runDemo(true)}
                    className="mt-2.5 w-full rounded-lg bg-mastered px-3 py-1.5 text-xs font-bold text-on-mastered transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    Simulate +1 Correct Answer
                  </button>
                </div>

                <div className="rounded-xl border border-low/30 bg-low-soft/45 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-low-ink">If Next Answer is Wrong</span>
                    <span className="rounded-full bg-low text-on-low px-2 py-0.5 text-[11px] font-bold tabular-nums">
                      {((nextWrong - prior) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted tabular-nums">
                    1. Posterior P(Lₙ|wrong): <strong className="text-ink">{fmtDec(obsWrong)}</strong>
                  </p>
                  <p className="text-xs text-muted tabular-nums">
                    2. After Learn P(Lₙ): <strong className="text-low-ink">{fmtDec(nextWrong)}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => runDemo(false)}
                    className="mt-2.5 w-full rounded-lg bg-low px-3 py-1.5 text-xs font-bold text-on-low transition-opacity hover:opacity-90 cursor-pointer"
                  >
                    Simulate +1 Wrong Answer
                  </button>
                </div>
              </div>
            </div>
          )}

          {lastDemo && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs">
              <span>
                {lastDemo.undone
                  ? `Undone: restored ${competency.short} estimate to ${formatPercent(lastDemo.before, theta)}.`
                  : `Simulated ${lastDemo.correct ? 'correct' : 'wrong'} response: ${formatPercent(lastDemo.before, theta)} → ${formatPercent(lastDemo.after, theta)}.`}
              </span>
              {!lastDemo.undone && (
                <button
                  type="button"
                  onClick={undoDemo}
                  className="font-bold text-brand underline cursor-pointer"
                >
                  Undo
                </button>
              )}
            </div>
          )}

          <p className="mt-4 border-t border-line pt-3 text-[11px] text-muted">
            Simulating an answer updates in-memory BKT state across both Teacher and Student views. Use <strong>Reset demo</strong> in the top bar to restore initial values.
          </p>
        </div>
      </div>
    </Overlay>
  )
}