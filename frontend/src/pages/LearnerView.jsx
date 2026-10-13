import { Link, useSearchParams } from 'react-router-dom'
import StatusPill from '../components/StatusPill.jsx'
import { competencies } from '../data/mock.js'
import { NODE, positions, VIEW } from '../data/graphLayout.js'
import { formatPercent, percent, statusFor } from '../lib/mastery.js'
import { candidatePath, dependencyOrder, getCompetency, prerequisitesOf } from '../lib/path.js'
import { useLearners } from '../lib/store.js'
import { contextQuery, learnerLink, overviewLink, readContext } from '../lib/teacherContext.js'
import Card from '../components/Card.jsx'
import Notice from '../components/Notice.jsx'

const nodeStyles = {
  meets: 'fill-mastered-soft stroke-mastered',
  below: 'fill-gap-soft stroke-gap',
  none: 'fill-surface stroke-muted',
}

const nodeWord = { meets: '✓ Meets', below: '▼ Below', none: 'No data' }

export default function LearnerView() {
  const [params, setParams] = useSearchParams()
  const learners = useLearners()
  const ctx = readContext(params, learners.map((l) => l.id))
  const { target: targetId, theta, invalid } = ctx
  const target = getCompetency(targetId)
  const backLink = overviewLink({ target: targetId, theta })

  if (learners.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Link to={backLink} className="text-sm font-bold text-brand">
          ← Class overview
        </Link>
        <Card>
          <h1 className="font-display text-2xl font-bold">No learners yet</h1>
          <p className="mt-2 text-muted">There are no learners in this class, so there is no learner view to show.</p>
        </Card>
      </div>
    )
  }

  if (invalid.learner) {
    return (
      <div className="flex flex-col gap-6">
        <Link to={backLink} className="text-sm font-bold text-brand">
          ← Class overview
        </Link>
        <Card>
          <h1 className="font-display text-2xl font-bold">Learner not found</h1>
          <p className="mt-2 text-muted">
            The learner in this link is not in the class. Choose a learner below, or return to the class overview.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {learners.map((l) => (
              <li key={l.id}>
                <Link
                  to={learnerLink({ learnerId: l.id, target: targetId, theta })}
                  className="inline-block rounded-full border border-line px-3 py-1 font-bold text-brand"
                >
                  {l.name}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    )
  }

  const learner = learners.find((l) => l.id === ctx.learnerId) ?? learners[0]
  const mastery = learner.mastery ?? {}

  // Same function the class overview uses for its target-specific counts.
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

  const drawEdge = (e) => (
    <path
      key={e.key}
      d={edgePath(e)}
      fill="none"
      strokeWidth={e.onPath ? 3 : 2}
      className={e.onPath ? 'stroke-brand' : 'stroke-muted/60'}
      markerEnd={`url(#${e.onPath ? 'arrow-brand' : 'arrow-gray'})`}
    />
  )

  const gapCount = result.gaps.length

  // One plain-language message for each outcome. An empty path is not a statement
  // that the learner has no difficulties.
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to={backLink} className="text-sm font-bold text-brand">
            ← Class overview
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{learner.name}</h1>
          <p className="mt-2 text-muted">
            Target competency: <strong className="text-ink">{target.name}</strong> · Mastery threshold:{' '}
            <strong className="text-ink">{percent(theta)}%</strong>
          </p>
          <p className="mt-1 max-w-3xl text-muted">{messages[result.status]}</p>
        </div>

        <div>
          <label htmlFor="learner" className="text-sm font-bold text-muted">
            Learner
          </label>
          <select
            id="learner"
            value={learner.id}
            onChange={(e) => setParams(contextQuery({ learnerId: e.target.value, target: targetId, theta }))}
            className="mt-1 block rounded-lg border border-line bg-white px-4 py-2 font-bold"
          >
            {learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {invalid.target && (
        <Notice>The target competency in the link was not recognized, so the default target is shown.</Notice>
      )}
      {invalid.theta && (
        <Notice>The mastery threshold in the link was not recognized, so {percent(theta)}% is used.</Notice>
      )}

      <Card>
        <h2 className="font-display text-2xl font-bold">Prerequisite graph</h2>
        <p className="mt-1 text-sm text-muted">
          Arrows point from a prerequisite to the skill that builds on it. Teal arrows and numbered circles
          show the suggested review order. Percentages are BKT mastery estimates.
        </p>
        <p className="mt-1 text-sm font-bold text-muted lg:hidden">Swipe sideways to see the whole graph.</p>

        <div className="mt-6 overflow-x-auto">
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

              return (
                <g key={c.id} className={relevant.has(c.id) ? undefined : 'opacity-50'}>
                  <title>{`${c.name}: ${formatPercent(p, theta)}${s === 'none' ? '' : s === 'meets' ? ' (meets the threshold)' : ' (below the threshold)'}`}</title>
                  <rect
                    x={left}
                    y={top}
                    width={NODE.w}
                    height={NODE.h}
                    rx={12}
                    strokeWidth={c.id === targetId ? 3 : 2}
                    className={nodeStyles[s]}
                  />
                  <text x={x} y={y - 4} textAnchor="middle" className="fill-ink text-base font-bold">
                    {c.short}
                  </text>
                  <text x={x} y={y + 18} textAnchor="middle" className="fill-ink text-sm">
                    {formatPercent(p, theta)} · {nodeWord[s]}
                  </text>
                  {c.id === targetId && (
                    <text x={left + NODE.w - 8} y={top + 15} textAnchor="end" className="fill-brand text-xs font-bold">
                      Target
                    </text>
                  )}
                  {step >= 0 && (
                    <g>
                      <circle cx={left + 4} cy={top + 4} r={13} className="fill-brand" />
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

        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
          <div className="flex items-center gap-2">
            <StatusPill band="meets" />
            <span>estimate at or above {percent(theta)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill band="below" />
            <span>estimate below {percent(theta)}%</span>
          </div>
        </div>
        {hasUnrelated && (
          <p className="mt-3 text-sm text-muted">Faded skills are not prerequisites of the selected target.</p>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-2xl font-bold">Suggested review order</h2>
        {path.length === 0 ? (
          <p className="mt-2 max-w-3xl text-muted">{messages[result.status]}</p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {path.map((id, i) => {
              const c = getCompetency(id)
              const p = mastery[id]
              return (
                <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="min-w-48 flex-1 font-bold">{c.name}</p>
                  <p className="w-14 text-right font-bold">{formatPercent(p, theta)}</p>
                  <StatusPill band={id === targetId ? 'focus' : 'below'} label={id === targetId ? 'Target competency' : undefined} />
                </li>
              )
            })}
          </ol>
        )}

        {result.status === 'needs-review' && metPrerequisites.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Prerequisites that meet the threshold and are not listed:{' '}
            {metPrerequisites.map((id) => `${getCompetency(id).name} (${formatPercent(mastery[id], theta)})`).join(', ')}.
          </p>
        )}
        {result.unknown.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            No estimate is available for: {result.unknown.map((id) => getCompetency(id).name).join(', ')}. These are not
            included in the path.
          </p>
        )}

        <p className="mt-6 text-sm text-muted">
          These are candidate review priorities from BKT estimates and the prerequisite graph. They support, and do
          not replace, your judgment of this learner.
        </p>
      </Card>

      <p className="text-sm text-muted">HIRAYA suggests; the teacher decides. Sample data for the prototype.</p>
    </div>
  )
}
