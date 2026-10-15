import { useState } from 'react'
import { prerequisiteLinks as links } from '../lib/links.js'
import { findCycle, getCompetency } from '../lib/path.js'
import { competencies } from '../data/mock.js'
import { NODE, positions, VIEW } from '../data/graphLayout.js'
import Card from '../components/Card.jsx'
import { buttonClass } from '../lib/buttonClass.js'

const ratingMeta = {
  valid: {
    label: 'Valid prerequisite',
    hint: 'Learners need the first skill before the second.',
    selected: 'border-mastered bg-mastered-soft shadow-xs',
    chip: 'bg-mastered-soft text-mastered-ink',
    dot: 'bg-mastered',
  },
  revise: {
    label: 'Needs revision',
    hint: 'Related, but the link is too broad, too narrow or in the wrong direction.',
    selected: 'border-gap bg-gap-soft shadow-xs',
    chip: 'bg-gap-soft text-gap-ink',
    dot: 'bg-gap',
  },
  not: {
    label: 'Not a prerequisite',
    hint: 'Learners can learn the second skill without the first.',
    selected: 'border-low bg-low-soft shadow-xs',
    chip: 'bg-low-soft text-low-ink',
    dot: 'bg-low',
  },
}

const ratingKeys = Object.keys(ratingMeta)
const cycle = findCycle()
const linkTitle = (link) => `${getCompetency(link.from).short} → ${getCompetency(link.to).short}`

function MiniGraphPreview({ activeLink, ratings }) {
  const edgePath = (l) => {
    const a = positions[l.from]
    const b = positions[l.to]
    const x1 = a.x + NODE.w / 2
    const x2 = b.x - NODE.w / 2
    const xm = (x1 + x2) / 2
    return `M ${x1} ${a.y} C ${xm} ${a.y}, ${xm} ${b.y}, ${x2} ${b.y}`
  }

  return (
    <div className="tc-graph-surface mt-5 overflow-x-auto rounded-xl border border-line p-3">
      <svg
        viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
        aria-label="Curriculum prerequisite graph preview"
        className="h-auto w-full min-w-170"
      >
        <defs>
          <marker
            id="gr-arrow-muted"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerUnits="userSpaceOnUse"
            markerWidth="10"
            markerHeight="10"
            orient="auto"
          >
            <path d="M0 0 L10 5 L0 10 z" className="fill-muted/45" />
          </marker>
          <marker
            id="gr-arrow-active"
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

        {links.map((l) => {
          const isActive = l.id === activeLink.id
          const r = ratings[l.id]
          return (
            <path
              key={l.id}
              d={edgePath(l)}
              fill="none"
              strokeWidth={isActive ? 4 : 2}
              className={
                isActive
                  ? 'stroke-brand tc-edge-animated'
                  : r === 'valid'
                    ? 'stroke-mastered/70'
                    : r === 'revise'
                      ? 'stroke-gap/80'
                      : r === 'not'
                        ? 'stroke-low/80'
                        : 'stroke-muted/35'
              }
              markerEnd={`url(#${isActive ? 'gr-arrow-active' : 'gr-arrow-muted'})`}
            />
          )
        })}

        {competencies.map((c) => {
          const { x, y } = positions[c.id]
          const left = x - NODE.w / 2
          const top = y - NODE.h / 2
          const isFrom = c.id === activeLink.from
          const isTo = c.id === activeLink.to
          const active = isFrom || isTo
          return (
            <g key={c.id} className={active ? '' : 'opacity-50'}>
              <rect
                x={left}
                y={top}
                width={NODE.w}
                height={NODE.h}
                rx={12}
                strokeWidth={active ? 3 : 1.5}
                className={
                  isTo
                    ? 'fill-brand-soft stroke-brand'
                    : isFrom
                      ? 'fill-panel stroke-brand'
                      : 'fill-panel stroke-line'
                }
              />
              <text x={x} y={y - 2} textAnchor="middle" className="fill-ink text-sm font-bold">
                {c.short}
              </text>
              <text x={x} y={y + 16} textAnchor="middle" className="fill-muted text-xs font-bold">
                {isFrom ? 'Prerequisite' : isTo ? 'Target skill' : c.code ?? c.id.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export default function GraphReview() {
  const [ratings, setRatings] = useState({})
  const [notes, setNotes] = useState({})
  const [index, setIndex] = useState(0)
  const [view, setView] = useState('review') // 'review' | 'summary' | 'submitted'

  const ratedCount = Object.keys(ratings).length
  const allRated = ratedCount === links.length
  const validCount = links.filter((l) => ratings[l.id] === 'valid').length

  const header = (
    <Card className="border-brand/25">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
            Expert Validation Protocol · MATATAG Grade 7 DAG
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Prerequisite graph review</h1>
          <p className="mt-1.5 text-sm text-muted">
            Rate each prerequisite link for content validity and inter-rater agreement before the DAG is used for learner remediation paths.
          </p>
        </div>
        {cycle ? (
          <p role="alert" className="rounded-xl bg-low-soft px-4 py-3 text-sm font-bold text-low-ink border border-low/30">
            Loop found: {cycle.map((id) => getCompetency(id).short).join(' → ')}. Fix these links before review.
          </p>
        ) : (
          <div className="rounded-xl border border-mastered/30 bg-mastered-soft px-4 py-2.5 text-sm font-bold text-mastered-ink">
            ✓ Graph check passed: {competencies.length} skills, {links.length} links, no loops
          </div>
        )}
      </div>
    </Card>
  )

  if (view === 'submitted') {
    return (
      <div className="flex flex-col gap-7">
        {header}
        <Card>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-mastered-soft text-mastered-ink">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">Ratings recorded</h2>
          <p className="mt-2 max-w-2xl text-muted">
            In this prototype the ratings are kept in browser memory. In the full system they are stored with the
            subject-matter expert&apos;s record, and content validity (CVI) plus inter-rater reliability (Cohen&apos;s or Fleiss&apos; kappa, κ) are computed before the prerequisite DAG is used for recommendations.
          </p>
          <div className="mt-5 grid max-w-xl gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-line bg-white p-3.5">
              <span className="block text-xs font-bold text-muted uppercase">Valid Links</span>
              <strong className="mt-1 block font-display text-2xl text-mastered-ink tabular-nums">
                {validCount} / {links.length}
              </strong>
            </div>
            <div className="rounded-xl border border-line bg-white p-3.5">
              <span className="block text-xs font-bold text-muted uppercase">Sample Fleiss&apos; κ</span>
              <strong className="mt-1 block font-display text-2xl text-brand tabular-nums">
                0.84
              </strong>
              <span className="text-[11px] text-muted">Strong agreement</span>
            </div>
            <div className="rounded-xl border border-line bg-white p-3.5">
              <span className="block text-xs font-bold text-muted uppercase">Scale CVI (S-CVI)</span>
              <strong className="mt-1 block font-display text-2xl text-ink tabular-nums">
                {(validCount / links.length).toFixed(2)}
              </strong>
              <span className="text-[11px] text-muted">Current reviewer</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setRatings({})
              setNotes({})
              setIndex(0)
              setView('review')
            }}
            className={`mt-6 cursor-pointer ${buttonClass('primary')}`}
          >
            Review again
          </button>
        </Card>
      </div>
    )
  }

  if (view === 'summary') {
    const flagged = links.filter((l) => ratings[l.id] !== 'valid')
    return (
      <div className="flex flex-col gap-7">
        {header}
        <Card>
          <h2 className="font-display text-2xl font-bold">Review summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {ratingKeys.map((key) => (
              <div key={key} className={`rounded-2xl p-5 ${ratingMeta[key].chip}`}>
                <p className="font-display text-3xl font-bold tabular-nums">
                  {links.filter((l) => ratings[l.id] === key).length}
                </p>
                <p className="mt-1 font-bold">{ratingMeta[key].label}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-8 font-display text-xl font-bold">Links to revisit</h3>
          {flagged.length === 0 ? (
            <p className="mt-2 text-muted">All links were rated valid.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {flagged.map((l) => (
                <li key={l.id} className="py-3.5">
                  <p className="font-bold">
                    {getCompetency(l.from).name} → {getCompetency(l.to).name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${ratingMeta[ratings[l.id]].chip}`}>
                      {ratingMeta[ratings[l.id]].label}
                    </span>
                    {notes[l.id] ? `— ${notes[l.id]}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView('review')}
              className={`cursor-pointer ${buttonClass('outline')}`}
            >
              Back to links
            </button>
            <button
              type="button"
              disabled={Boolean(cycle)}
              onClick={() => setView('submitted')}
              className={`cursor-pointer ${buttonClass('primary')}`}
            >
              Submit ratings
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const link = links[index]
  const from = getCompetency(link.from)
  const to = getCompetency(link.to)
  const current = ratings[link.id]
  const isLast = index === links.length - 1
  const nextDisabled = Boolean(cycle) || (isLast ? !allRated : current === undefined)

  return (
    <div className="flex flex-col gap-7">
      {header}

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold tracking-wider text-muted uppercase">
              Link {index + 1} of {links.length} · Expert Reviewer 1 of 3 (Sample)
            </p>
            <span className="text-xs font-bold text-brand tabular-nums">
              {Math.round((ratedCount / links.length) * 100)}% complete
            </span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{ width: `${(ratedCount / links.length) * 100}%` }}
            />
          </div>

          {/* Visual DAG Highlight */}
          <MiniGraphPreview activeLink={link} ratings={ratings} />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-line bg-white px-4 py-2.5">
              <span className="block text-xs font-bold tracking-wider text-muted uppercase">
                Prerequisite ({from.short}{from.code ? ` · ${from.code}` : ''})
              </span>
              <span className="font-bold text-ink">{from.name}</span>
            </div>
            <span className="text-2xl font-bold text-brand" aria-hidden="true">→</span>
            <div className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-2.5">
              <span className="block text-xs font-bold tracking-wider text-brand uppercase">
                Dependent Skill ({to.short}{to.code ? ` · ${to.code}` : ''})
              </span>
              <span className="font-bold text-brand">{to.name}</span>
            </div>
          </div>

          <h2 className="mt-5 font-display text-2xl font-bold">
            Is {from.name} a prerequisite for {to.name}?
          </h2>

          <div role="radiogroup" aria-label="Rating" className="mt-5 flex flex-col gap-3">
            {ratingKeys.map((key) => {
              const meta = ratingMeta[key]
              const selected = current === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={Boolean(cycle)}
                  onClick={() => setRatings((r) => ({ ...r, [link.id]: key }))}
                  className={`flex items-start gap-3.5 rounded-xl border-2 px-5 py-4 text-left transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected ? meta.selected : 'border-line bg-white hover:border-brand'
                  }`}
                >
                  <span
                    className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected ? 'border-ink bg-ink text-white' : 'border-muted'
                    }`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  <div>
                    <span className="block text-base font-bold">{meta.label}</span>
                    <span className="mt-0.5 block text-sm text-muted">{meta.hint}</span>
                  </div>
                </button>
              )
            })}
          </div>

          <label htmlFor="note" className="mt-6 block text-xs font-bold tracking-wider text-muted uppercase">
            Expert comment / rationale (optional)
          </label>
          <textarea
            id="note"
            rows={3}
            disabled={Boolean(cycle)}
            value={notes[link.id] ?? ''}
            onChange={(e) => setNotes((n) => ({ ...n, [link.id]: e.target.value }))}
            placeholder="For example: this link should also include decimals."
            className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm focus:border-brand disabled:opacity-50"
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              disabled={index === 0}
              className={`cursor-pointer ${buttonClass('outline')}`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => (isLast ? setView('summary') : setIndex((i) => i + 1))}
              disabled={nextDisabled}
              className={`cursor-pointer ${buttonClass('primary')}`}
            >
              {isLast ? 'Review summary' : 'Next link'}
            </button>
            {isLast && !allRated && (
              <p className="text-sm text-muted">
                {links.length - ratedCount} link{links.length - ratedCount === 1 ? '' : 's'} still unrated. Use the list to jump to them.
              </p>
            )}
          </div>
        </Card>

        <aside className="tc-card h-fit rounded-2xl p-6 lg:sticky lg:top-20">
          {/* Inter-Rater Reliability & Content Validity Preview (Objective 1 & Chapter 2) */}
          <div className="mb-5 rounded-xl border border-brand/25 bg-brand-soft/45 p-3.5 text-xs">
            <p className="font-bold tracking-wider text-brand uppercase">
              Expert Panel Agreement (Sample)
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line bg-white p-2">
                <span className="block text-[10px] font-bold text-muted uppercase">Fleiss&apos; Kappa (κ)</span>
                <strong className="font-display text-base text-ink tabular-nums">0.84 (Strong)</strong>
              </div>
              <div className="rounded-lg border border-line bg-white p-2">
                <span className="block text-[10px] font-bold text-muted uppercase">Mean I-CVI</span>
                <strong className="font-display text-base text-ink tabular-nums">0.96 (Valid)</strong>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Inter-rater agreement across Mathematics teachers is verified before the DAG is used for learner remediation paths.
            </p>
          </div>

          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">All links</h2>
            <p className="text-xs font-bold text-muted tabular-nums">
              {ratedCount} of {links.length} rated
            </p>
          </div>
          <ol className="mt-4 flex flex-col gap-1.5">
            {links.map((l, i) => {
              const r = ratings[l.id]
              const isCurrent = i === index
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={isCurrent ? 'step' : undefined}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                      isCurrent ? 'bg-brand-soft ring-1 ring-brand/30' : 'hover:bg-surface'
                    }`}
                  >
                    <span className={isCurrent ? 'font-bold text-brand' : 'font-medium'}>
                      {i + 1}. {linkTitle(l)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        r ? ratingMeta[r].chip : 'bg-surface text-muted'
                      }`}
                    >
                      {r ? ratingMeta[r].label : 'Not rated'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </aside>
      </div>
    </div>
  )
}