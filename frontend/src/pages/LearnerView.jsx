import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import StatusPill from '../components/StatusPill.jsx'
import MasteryRing from '../components/MasteryRing.jsx'
import BktInspector from '../components/BktInspector.jsx'
import LearnerCompareDrawer from '../components/LearnerCompareDrawer.jsx'
import { competencies } from '../data/mock.js'
import { NODE, positions, VIEW } from '../data/graphLayout.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { candidatePath, dependencyOrder, getCompetency, prerequisitesOf } from '../lib/path.js'
import { updateSettings, useLearners, useSettings } from '../lib/store.js'
import {
  contextQuery,
  learnerLink,
  learnerSelection,
  overviewLink,
  readContext,
  THRESHOLD_OPTIONS,
} from '../lib/teacherContext.js'
import Card from '../components/Card.jsx'
import Notice from '../components/Notice.jsx'

const nodeStyles = {
  meets: 'fill-mastered-soft stroke-mastered',
  below: 'fill-gap-soft stroke-gap',
  none: 'fill-surface stroke-muted',
}
const nodeWord = { meets: '✓ Meets', below: '▲ Below', none: 'No data' }

function LearnerPicker({ state, learners, target, theta, invalid, backLink }) {
  return (
    <div className="flex flex-col gap-6">
      <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
        <span aria-hidden="true">←</span> Class overview
      </Link>
      {invalid.target && (
        <Notice>The target competency in the link was not recognized, so the default target is shown.</Notice>
      )}
      {invalid.theta && (
        <Notice>The mastery threshold in the link was not recognized, so {percent(theta)}% is used.</Notice>
      )}
      <Card>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {state === 'invalid' ? 'Learner not found' : 'Choose a learner'}
        </h1>
        <p className="mt-2 max-w-3xl text-muted">
          {state === 'invalid'
            ? 'The learner in this link is not in the class. Choose a learner below, or return to the class overview.'
            : 'No learner is selected yet. Choose a learner to see their mastery estimates, prerequisite graph and suggested review order.'}
        </p>
        <p className="mt-2 text-sm text-muted">
          Target competency: <strong className="text-ink">{target.name}</strong> • Mastery threshold:{' '}
          <strong className="text-ink">{percent(theta)}%</strong>
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {learners.map((l) => {
            const p = l.mastery?.[target.id]
            const { gaps } = candidatePath(l.mastery, target.id, theta)
            return (
              <li key={l.id}>
                <Link
                  to={learnerLink({ learnerId: l.id, target: target.id, theta })}
                  replace
                  className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
                >
                  <MasteryRing p={p ?? 0} theta={theta} size={52} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-lg font-bold text-ink">{l.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusPill band={statusFor(p, theta)} />
                      <span className="text-xs font-bold text-muted">
                        {gaps.length} prerequisite gap{gaps.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-brand">
                    Open <span className="sr-only">learner view for {l.name}</span>→
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Percentages are each learner&apos;s BKT estimate for the selected target competency ({target.name}).
        </p>
      </Card>
    </div>
  )
}

export default function LearnerView() {
  const [params, setParams] = useSearchParams()
  const [hoveredNode, setHoveredNode] = useState(null)
  const [inspectedSkill, setInspectedSkill] = useState(null)
  const [compareOtherId, setCompareOtherId] = useState(null)

  const learners = useLearners()
  const settings = useSettings()
  const effectiveParams = new URLSearchParams(params)
  if (!effectiveParams.has('target')) effectiveParams.set('target', settings.targetId)
  if (!effectiveParams.has('theta')) effectiveParams.set('theta', String(settings.theta))

  const ctx = readContext(effectiveParams, learners.map((l) => l.id))
  const { target: targetId, theta, invalid } = ctx

  useEffect(() => {
    updateSettings({
      targetId,
      theta,
      ...(ctx.learnerId ? { learnerId: ctx.learnerId } : {}),
    })
  }, [targetId, theta, ctx.learnerId])
  const target = getCompetency(targetId)
  const backLink = overviewLink({ target: targetId, theta, learnerId: ctx.learnerId })

  if (learners.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
          <span aria-hidden="true">←</span> Class overview
        </Link>
        <Card>
          <h1 className="font-display text-2xl font-bold">No learners yet</h1>
          <p className="mt-2 text-muted">There are no learners in this class, so there is no learner view to show.</p>
        </Card>
      </div>
    )
  }

  const selection = learnerSelection(ctx)
  if (selection !== 'selected') {
    return (
      <LearnerPicker
        state={selection}
        learners={learners}
        target={target}
        theta={theta}
        invalid={invalid}
        backLink={backLink}
      />
    )
  }

  const learner = learners.find((l) => l.id === ctx.learnerId)
  const mastery = learner.mastery ?? {}

  const updateContext = (change) =>
    setParams(contextQuery({ learnerId: learner.id, target: targetId, theta, ...change }), { replace: true })

  const result = candidatePath(mastery, targetId, theta)
  const path = result.path
  const onPath = new Set(path)
  const relevant = new Set(dependencyOrder(targetId))
  const hasUnrelated = competencies.some((c) => !relevant.has(c.id))
  const prerequisites = prerequisitesOf(targetId)
  const metPrerequisites = prerequisites.filter((id) => statusFor(mastery[id], theta) === 'meets')
  const targetEstimate = formatPercent(mastery[targetId], theta)

  const edges = competencies.flatMap((c) =>
    c.prereqs.map((from) => ({
      key: `${from}-${c.id}`,
      from,
      to: c.id,
      onPath: onPath.has(from) && onPath.has(c.id),
    })),
  )

  const edgePath = (e) => {
    const a = positions[e.from]
    const b = positions[e.to]
    const x1 = a.x + NODE.w / 2
    const x2 = b.x - NODE.w / 2
    const xm = (x1 + x2) / 2
    return `M ${x1} ${a.y} C ${xm} ${a.y}, ${xm} ${b.y}, ${x2} ${b.y}`
  }

  const drawEdge = (e) => {
    const isConnectedToHover = hoveredNode && (e.from === hoveredNode || e.to === hoveredNode)
    return (
      <path
        key={e.key}
        d={edgePath(e)}
        fill="none"
        strokeWidth={e.onPath || isConnectedToHover ? 3.5 : 2}
        className={`${
          e.onPath ? 'stroke-brand tc-edge-animated' : isConnectedToHover ? 'stroke-brand' : 'stroke-muted/45'
        } transition-opacity duration-200`}
        markerEnd={`url(#${e.onPath || isConnectedToHover ? 'arrow-brand' : 'arrow-gray'})`}
      />
    )
  }

  const gapCount = result.gaps.length

  const messages = {
    'needs-review':
      gapCount === 0
        ? `No prerequisite competencies below the selected threshold were identified for this target. The target estimate (${targetEstimate}) is below ${percent(theta)}%, so it is the only item in the review path.`
        : `${gapCount} candidate prerequisite gap${gapCount === 1 ? '' : 's'} identified before ${target.name}.`,
    'target-met': `The estimate for ${target.name} (${targetEstimate}) currently meets the selected mastery threshold of ${percent(theta)}%, so no remediation path is generated for this learner and target. This does not show that the learner has no difficulties with other skills.`,
    'no-data': `No mastery estimate is available for this learner on ${target.name}, so no path can be generated.`,
    'invalid-target': 'The target competency is not recognized, so no path can be generated.',
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Header & Switcher Controls */}
      <Card className="border-brand/25">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex-1 min-w-64">
            <Link to={backLink} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">
              <span aria-hidden="true">←</span> Class overview
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <MasteryRing p={mastery[targetId] ?? 0} theta={theta} size={64} />
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-3xl font-bold sm:text-4xl">{learner.name}</h1>
                  <StatusPill band={statusFor(mastery[targetId], theta)} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  Target competency: <strong className="text-ink">{target.name}</strong> ({targetEstimate}) • Mastery threshold:{' '}
                  <strong className="text-ink">{percent(theta)}%</strong>
                </p>
              </div>
            </div>

            <p className="mt-3 max-w-3xl rounded-xl bg-brand-soft/60 px-4 py-2.5 text-sm font-medium text-ink">
              {messages[result.status]}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="learner" className="mb-1 block text-xs font-bold tracking-wider text-muted uppercase">
                Learner
              </label>
              <select
                id="learner"
                value={learner.id}
                onChange={(e) => updateContext({ learnerId: e.target.value })}
                className="block rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-bold shadow-2xs"
              >
                {learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="target-select" className="mb-1 block text-xs font-bold tracking-wider text-muted uppercase">
                Target
              </label>
              <select
                id="target-select"
                value={targetId}
                onChange={(e) => updateContext({ target: e.target.value })}
                className="block rounded-xl border border-line bg-white px-3.5 py-2 text-sm font-bold shadow-2xs"
              >
                {competencies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="mb-1 text-xs font-bold tracking-wider text-muted uppercase">Threshold</p>
              <div className="inline-flex rounded-xl border border-line bg-white p-1 shadow-2xs">
                {THRESHOLD_OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => updateContext({ theta: o })}
                    className={`rounded-lg px-3 py-1 text-sm font-bold transition-colors cursor-pointer ${
                      theta === o ? 'bg-brand text-white' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {percent(o)}%
                  </button>
                ))}
              </div>
            </div>

            {learners.length >= 2 && (
              <button
                type="button"
                onClick={() =>
                  setCompareOtherId(learners.find((l) => l.id !== learner.id)?.id ?? learner.id)
                }
                className="rounded-xl border border-brand/30 bg-brand-soft px-3.5 py-2 text-sm font-bold text-brand transition-colors hover:bg-brand hover:text-white cursor-pointer"
              >
                Compare learner
              </button>
            )}
          </div>
        </div>
      </Card>

      {invalid.target && (
        <Notice>The target competency in the link was not recognized, so the default target is shown.</Notice>
      )}
      {invalid.theta && (
        <Notice>The mastery threshold in the link was not recognized, so {percent(theta)}% is used.</Notice>
      )}

      {/* Interactive Prerequisite Graph */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Prerequisite graph</h2>
            <p className="mt-1 text-sm text-muted">
              Arrows point from a prerequisite to the skill that builds on it. Animated teal arrows and numbered badges show the suggested review order.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setInspectedSkill(targetId)}
            className="rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-bold text-brand hover:border-brand cursor-pointer"
          >
            Inspect BKT math for {target.short} →
          </button>
        </div>

        <div className="tc-graph-surface mt-5 overflow-x-auto rounded-2xl border border-line p-4">
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            role="img"
            aria-label={`Prerequisite graph for ${learner.name}, target ${target.name}`}
            className="h-auto w-full min-w-225"
          >
            <defs>
              <marker
                id="arrow-gray"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerUnits="userSpaceOnUse"
                markerWidth="12"
                markerHeight="12"
                orient="auto"
              >
                <path d="M0 0 L10 5 L0 10 z" className="fill-muted/60" />
              </marker>
              <marker
                id="arrow-brand"
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerUnits="userSpaceOnUse"
                markerWidth="14"
                markerHeight="14"
                orient="auto"
              >
                <path d="M0 0 L10 5 L0 10 z" className="fill-brand" />
              </marker>
            </defs>

            {edges.filter((e) => !e.onPath).map(drawEdge)}
            {edges.filter((e) => e.onPath).map(drawEdge)}

            {competencies.map((c) => {
              const { x, y } = positions[c.id]
              const p = mastery[c.id]
              const s = statusFor(p, theta)
              const step = path.indexOf(c.id)
              const left = x - NODE.w / 2
              const top = y - NODE.h / 2
              const isTarget = c.id === targetId
              return (
                <g
                  key={c.id}
                  onMouseEnter={() => setHoveredNode(c.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setInspectedSkill(c.id)}
                  className={`cursor-pointer transition-opacity duration-200 ${
                    relevant.has(c.id) ? '' : 'opacity-45 hover:opacity-90'
                  }`}
                >
                  <title>{`${c.name}: ${formatPercent(p, theta)}${
                    s === 'none' ? '' : s === 'meets' ? ' (meets the threshold)' : ' (below the threshold)'
                  } — Click to inspect BKT parameters`}</title>

                  {isTarget && (
                    <rect
                      x={left - 5}
                      y={top - 5}
                      width={NODE.w + 10}
                      height={NODE.h + 10}
                      rx={16}
                      fill="none"
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      className="stroke-brand"
                    />
                  )}

                  <rect
                    x={left}
                    y={top}
                    width={NODE.w}
                    height={NODE.h}
                    rx={12}
                    strokeWidth={isTarget ? 3 : 2}
                    className={nodeStyles[s]}
                  />
                  <text x={x} y={y - 4} textAnchor="middle" className="fill-ink text-base font-bold">
                    {c.short}
                  </text>
                  <text x={x} y={y + 18} textAnchor="middle" className="fill-ink text-sm font-medium">
                    {formatPercent(p, theta)} • {nodeWord[s]}
                  </text>

                  {isTarget && (
                    <text x={left + NODE.w - 8} y={top + 15} textAnchor="end" className="fill-brand text-xs font-bold">
                      Target
                    </text>
                  )}

                  {step >= 0 && (
                    <g>
                      <circle cx={left + 4} cy={top + 4} r={14} className="fill-brand stroke-white" strokeWidth="2" />
                      <text x={left + 4} y={top + 9} textAnchor="middle" className="fill-white text-sm font-bold">
                        {step + 1}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted">
          <div className="flex items-center gap-2">
            <StatusPill band="meets" />
            <span>estimate at or above {percent(theta)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill band="below" />
            <span>estimate below {percent(theta)}%</span>
          </div>
          <span className="text-xs">
            Click any skill node in the graph to inspect its BKT parameters and simulate answers.
          </span>
        </div>
        {hasUnrelated && (
          <p className="mt-2 text-xs text-muted">Faded skills are not prerequisites of the selected target.</p>
        )}
      </Card>

      {/* Suggested Topological Review Order */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold">Suggested review order</h2>
          {path.length > 0 && (
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
              {path.length} step{path.length === 1 ? '' : 's'} in topological order
            </span>
          )}
        </div>

        {path.length === 0 ? (
          <p className="mt-3 max-w-3xl rounded-xl bg-mastered-soft/60 p-4 text-sm font-medium text-mastered-ink">
            {messages[result.status]}
          </p>
        ) : (
          <ol className="mt-5 flex flex-col gap-3">
            {path.map((id, i) => {
              const c = getCompetency(id)
              const p = mastery[id]
              const isFirst = i === 0
              const isTarget = id === targetId
              return (
                <li
                  key={id}
                  className={`flex flex-wrap items-center gap-4 rounded-xl border p-4 transition-colors ${
                    isFirst
                      ? 'border-brand bg-brand-soft/35 shadow-xs'
                      : 'border-line bg-white'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display font-bold ${
                      isFirst ? 'bg-brand text-white shadow-sm' : 'border-2 border-brand text-brand'
                    }`}
                  >
                    {i + 1}
                  </span>

                  <MasteryRing p={p ?? 0} theta={theta} size={48} />

                  <div className="min-w-48 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-bold text-ink">{c.name}</p>
                      {isFirst && (
                        <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-white">
                          Start here
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      {c.strand} • {c.prereqs.length > 0 ? `Builds on ${c.prereqs.map((pr) => getCompetency(pr).short).join(', ')}` : 'Foundational skill'}
                    </p>
                  </div>

                  <p className="w-16 text-right font-display text-lg font-bold tabular-nums">
                    {formatPercent(p, theta)}
                  </p>

                  <StatusPill
                    band={isTarget ? 'focus' : 'below'}
                    label={isTarget ? 'Target competency' : undefined}
                  />

                  <button
                    type="button"
                    onClick={() => setInspectedSkill(id)}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-bold text-brand hover:border-brand cursor-pointer"
                  >
                    BKT Math
                  </button>
                </li>
              )
            })}
          </ol>
        )}

        {result.status === 'needs-review' && metPrerequisites.length > 0 && (
          <div className="mt-5 rounded-xl border border-mastered/25 bg-mastered-soft/45 px-4 py-3 text-sm text-mastered-ink">
            <strong>Prerequisites that already meet {percent(theta)}% (skipped):</strong>{' '}
            {metPrerequisites.map((id) => `${getCompetency(id).name} (${formatPercent(mastery[id], theta)})`).join(', ')}.
          </div>
        )}

        {result.unknown.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            No estimate is available for: {result.unknown.map((id) => getCompetency(id).name).join(', ')}. These are not included in the path.
          </p>
        )}

        <p className="mt-6 border-t border-line pt-3.5 text-xs text-muted">
          These are candidate review priorities from BKT estimates and the prerequisite graph. They support, and do not replace, your judgment of this learner.
        </p>
      </Card>

      <p className="text-center text-xs text-muted">HIRAYA suggests; the teacher decides. Sample data for the prototype.</p>

      {/* BKT Inspector Modal */}
      {inspectedSkill && (
        <BktInspector
          learner={learner}
          skillId={inspectedSkill}
          theta={theta}
          onClose={() => setInspectedSkill(null)}
        />
      )}

      {/* Quick-Compare Drawer */}
      {compareOtherId && (
        <LearnerCompareDrawer
          learners={learners}
          learnerAId={learner.id}
          learnerBId={compareOtherId}
          onSelectA={(a) => updateContext({ learnerId: a })}
          onSelectB={(b) => setCompareOtherId(b)}
          targetId={targetId}
          theta={theta}
          onClose={() => setCompareOtherId(null)}
        />
      )}
    </div>
  )
}