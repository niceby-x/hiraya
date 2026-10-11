import { Link, useSearchParams } from 'react-router-dom'
import StatusPill from '../components/StatusPill.jsx'
import { competencies, learners, THRESHOLD } from '../data/mock.js'
import { NODE, positions, VIEW } from '../data/graphLayout.js'
import { bandFor, percent } from '../lib/mastery.js'
import { getCompetency, remediationPath, TARGET_ID } from '../lib/path.js'

const nodeStyles = {
  mastered: 'fill-mastered-soft stroke-mastered',
  gap: 'fill-gap-soft stroke-gap',
  low: 'fill-low-soft stroke-low',
}

const legend = [
  { band: 'mastered', label: 'Mastered', text: `${percent(THRESHOLD)}% or higher` },
  { band: 'gap', label: 'Needs review', text: `60% to below ${percent(THRESHOLD)}%` },
  { band: 'low', label: 'Needs review', text: 'below 60%' },
]

export default function LearnerView() {
  const [params, setParams] = useSearchParams()
  const learner = learners.find((l) => l.id === params.get('learner')) ?? learners[0]
  const target = getCompetency(TARGET_ID)

  const path = remediationPath(learner.mastery, TARGET_ID)
  const onPath = new Set(path)

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

  const gapCount = Math.max(path.length - 1, 0)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/teacher" className="text-sm font-bold text-brand">
            ← Class overview
          </Link>
          <h1 className="mt-3 font-display text-4xl font-bold">{learner.name}</h1>
          <p className="mt-2 text-muted">
            {path.length === 0
              ? `All skills on the way to ${target.name} are mastered.`
              : `${gapCount} prerequisite gap${gapCount === 1 ? '' : 's'} before ${target.name}.`}
          </p>
        </div>

        <div>
          <label htmlFor="learner" className="text-sm font-bold text-muted">
            Learner
          </label>
          <select
            id="learner"
            value={learner.id}
            onChange={(e) => setParams({ learner: e.target.value })}
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

      <section className="rounded-2xl border border-line bg-white p-8">
        <h2 className="font-display text-2xl font-bold">Prerequisite graph</h2>
        <p className="mt-1 text-sm text-muted">
          Arrows point from a prerequisite to the skill that builds on it. Teal arrows and numbered circles
          show the suggested review order.
        </p>

        <div className="mt-6 overflow-x-auto">
          <svg
            viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
            role="img"
            aria-label={`Prerequisite graph for ${learner.name}`}
            className="h-auto w-full min-w-190"
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
              const p = learner.mastery[c.id]
              const step = path.indexOf(c.id)
              const left = x - NODE.w / 2
              const top = y - NODE.h / 2

              return (
                <g key={c.id}>
                  <title>{`${c.name}: ${percent(p)}%`}</title>
                  <rect
                    x={left}
                    y={top}
                    width={NODE.w}
                    height={NODE.h}
                    rx={12}
                    strokeWidth={c.id === TARGET_ID ? 3 : 2}
                    className={nodeStyles[bandFor(p)]}
                  />
                  <text x={x} y={y - 4} textAnchor="middle" className="fill-ink text-base font-bold">
                    {c.short}
                  </text>
                  <text x={x} y={y + 18} textAnchor="middle" className="fill-ink text-sm">
                    {percent(p)}%
                  </text>
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
          {legend.map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <StatusPill band={item.band} label={item.label} />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-8">
        <h2 className="font-display text-2xl font-bold">Suggested review order</h2>
        {path.length === 0 ? (
          <p className="mt-2 text-muted">Nothing to review for this learner.</p>
        ) : (
          <ol className="mt-4 divide-y divide-line">
            {path.map((id, i) => {
              const c = getCompetency(id)
              const p = learner.mastery[id]
              return (
                <li key={id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="min-w-48 flex-1 font-bold">{c.name}</p>
                  <p className="w-12 text-right font-bold">{percent(p)}%</p>
                  <StatusPill band={bandFor(p)} label={id === TARGET_ID ? 'Focus topic' : undefined} />
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <p className="text-sm text-muted">HIRAYA suggests; the teacher decides. Sample data for the prototype.</p>
    </div>
  )
}