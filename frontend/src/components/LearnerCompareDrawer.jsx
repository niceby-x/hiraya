import { Link } from 'react-router-dom'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { candidatePath, displayOrder, getCompetency } from '../lib/path.js'
import { learnerLink } from '../lib/teacherContext.js'
import MasteryRing from './MasteryRing.jsx'
import StatusPill from './StatusPill.jsx'

export default function LearnerCompareDrawer({
  learners,
  learnerAId,
  learnerBId,
  onSelectA,
  onSelectB,
  targetId,
  theta,
  onClose,
}) {
  if (!learnerAId || !learnerBId) return null

  const learnerA = learners.find((l) => l.id === learnerAId) ?? learners[0]
  const learnerB = learners.find((l) => l.id === learnerBId) ?? learners[1] ?? learners[0]
  const target = getCompetency(targetId)
  const orderedIds = displayOrder(targetId)

  const pathA = candidatePath(learnerA?.mastery, targetId, theta)
  const pathB = candidatePath(learnerB?.mastery, targetId, theta)

  const sharedGaps = pathA.gaps.filter((id) => pathB.gaps.includes(id))
  const peerTutorAtoB = orderedIds.filter(
    (id) =>
      statusFor(learnerA?.mastery?.[id], theta) === 'meets' &&
      statusFor(learnerB?.mastery?.[id], theta) === 'below',
  )
  const peerTutorBtoA = orderedIds.filter(
    (id) =>
      statusFor(learnerB?.mastery?.[id], theta) === 'meets' &&
      statusFor(learnerA?.mastery?.[id], theta) === 'below',
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-night/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="tc-card flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-brand/30 p-4 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
          <div>
            <span className="rounded-full bg-brand-soft px-3 py-0.5 text-xs font-bold text-brand">
              Side-by-Side Diagnostic
            </span>
            <h2 id="compare-drawer-title" className="mt-1.5 font-display text-2xl font-bold">
              Compare Learners
            </h2>
            <p className="text-xs text-muted">
              Target: <strong className="text-ink">{target.name}</strong> • Threshold: <strong className="text-ink">{percent(theta)}%</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close comparison drawer"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-white text-muted hover:border-brand hover:text-ink cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Learner Selectors & Target Summary */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'Learner A', learner: learnerA, otherId: learnerB?.id, path: pathA, onChange: onSelectA },
            { label: 'Learner B', learner: learnerB, otherId: learnerA?.id, path: pathB, onChange: onSelectB },
          ].map(({ label, learner, otherId, path, onChange }) => {
            const p = learner?.mastery?.[targetId]
            return (
              <div key={label} className="rounded-2xl border border-line bg-white p-4">
                <label
                  htmlFor={`compare-${label.replace(' ', '-').toLowerCase()}`}
                  className="block text-[11px] font-bold tracking-wider text-muted uppercase"
                >
                  {label}
                </label>
                <select
                  id={`compare-${label.replace(' ', '-').toLowerCase()}`}
                  value={learner?.id ?? ''}
                  onChange={(e) => onChange(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-line bg-surface/60 px-3 py-2 text-sm font-bold"
                >
                  {learners.map((l) => (
                    // The other learner is disabled so A and B can never be the same person.
                    <option key={l.id} value={l.id} disabled={l.id === otherId}>
                      {l.name}
                    </option>
                  ))}
                </select>

                <div className="mt-3 flex items-center gap-3">
                  <MasteryRing p={p} theta={theta} size={48} />
                  <div>
                    <p className="text-xs text-muted">Target ({target.short})</p>
                    <p className="font-display text-lg font-bold tabular-nums">
                      {formatPercent(p, theta)}
                    </p>
                    <StatusPill band={statusFor(p, theta)} />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-xs">
                  <span className="font-bold text-muted">
                    {path.gaps.length} prereq gap{path.gaps.length === 1 ? '' : 's'}
                  </span>
                  <Link
                    to={learnerLink({ learnerId: learner.id, target: targetId, theta })}
                    onClick={onClose}
                    className="font-bold text-brand hover:underline"
                  >
                    Full view →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Instructional Grouping & Peer Pairing Insights */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gap/30 bg-gap-soft/45 p-3.5">
            <p className="text-xs font-bold text-gap-ink">
              Shared Prerequisite Gaps ({sharedGaps.length})
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Skills below {percent(theta)}% for both learners (ideal for small-group review):
            </p>
            {sharedGaps.length === 0 ? (
              <p className="mt-2 text-xs font-bold text-ink">No overlapping prerequisite gaps.</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sharedGaps.map((id) => (
                  <span key={id} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-gap-ink border border-gap/30">
                    {getCompetency(id).short}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-mastered/30 bg-mastered-soft/45 p-3.5">
            <p className="text-xs font-bold text-mastered-ink">
              Peer Pairing Potential
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              Skills where one learner meets {percent(theta)}% and the other is below:
            </p>
            <div className="mt-2 space-y-1 text-xs">
              <p>
                <strong>{learnerA.name} → {learnerB.name}:</strong>{' '}
                {peerTutorAtoB.length > 0
                  ? peerTutorAtoB.map((id) => getCompetency(id).short).join(', ')
                  : 'None'}
              </p>
              <p>
                <strong>{learnerB.name} → {learnerA.name}:</strong>{' '}
                {peerTutorBtoA.length > 0
                  ? peerTutorBtoA.map((id) => getCompetency(id).short).join(', ')
                  : 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-Side Skill Mastery Comparison Bars */}
        <div className="mt-6">
          <h3 className="font-display text-lg font-bold">Skill-by-skill BKT comparison</h3>
          <p className="text-xs text-muted">
            Ordered by dependency chain for {target.short}. The vertical marker shows the {percent(theta)}% threshold.
          </p>

          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white px-4">
            {orderedIds.map((id) => {
              const c = getCompetency(id)
              const pA = learnerA?.mastery?.[id]
              const pB = learnerB?.mastery?.[id]
              const sA = statusFor(pA, theta)
              const sB = statusFor(pB, theta)

              return (
                <li key={id} className="py-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-ink">
                      {c.name}{' '}
                      {id === targetId && (
                        <span className="ml-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
                          Target
                        </span>
                      )}
                    </span>
                    <span className="text-muted">{c.short}</span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {[
                      { name: learnerA.name, p: pA, s: sA },
                      { name: learnerB.name, p: pB, s: sB },
                    ].map((row) => (
                      <div key={row.name} className="flex items-center gap-2.5 text-xs">
                        <span className="w-24 shrink-0 truncate font-medium text-muted">{row.name}</span>
                        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-line">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              row.s === 'meets' ? 'bg-mastered' : row.s === 'below' ? 'bg-gap' : 'bg-line'
                            }`}
                            style={{ width: row.s === 'none' ? '0%' : `${Math.min(100, Math.round(row.p * 100))}%` }}
                          />
                          <span
                            className="absolute top-0 bottom-0 w-0.5 bg-ink/70"
                            style={{ left: `${percent(theta)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-bold tabular-nums">
                          {formatPercent(row.p, theta)}
                        </span>
                      </div>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Remediation Path Comparison */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { learner: learnerA, path: pathA.path },
            { learner: learnerB, path: pathB.path },
          ].map(({ learner, path }) => (
            <div key={learner.id} className="rounded-xl border border-line bg-white p-3.5">
              <p className="text-xs font-bold text-ink">{learner.name}&apos;s Review Path</p>
              {path.length === 0 ? (
                <p className="mt-2 text-xs text-mastered-ink font-medium">
                  Target met — no remediation path needed.
                </p>
              ) : (
                <ol className="mt-2 space-y-1 text-xs">
                  {path.map((id, idx) => (
                    <li key={id} className="flex items-center gap-2">
                      <span className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-on-brand">
                        {idx + 1}
                      </span>
                      <span className="truncate font-medium">{getCompetency(id).short}</span>
                      <span className="ml-auto font-bold text-muted tabular-nums">
                        {formatPercent(learner.mastery?.[id], theta)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}