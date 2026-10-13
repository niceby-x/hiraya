import { useState } from 'react'
import { prerequisiteLinks as links } from '../lib/links.js'
import { findCycle, getCompetency } from '../lib/path.js'
import { competencies } from '../data/mock.js'
import Card from '../components/Card.jsx'
import { buttonClass } from '../lib/buttonClass.js'

const ratingMeta = {
  valid: {
    label: 'Valid prerequisite',
    hint: 'Learners need the first skill before the second.',
    selected: 'border-mastered bg-mastered-soft',
    chip: 'bg-mastered-soft text-mastered-ink',
  },
  revise: {
    label: 'Needs revision',
    hint: 'Related, but the link is too broad, too narrow or in the wrong direction.',
    selected: 'border-gap bg-gap-soft',
    chip: 'bg-gap-soft text-gap-ink',
  },
  not: {
    label: 'Not a prerequisite',
    hint: 'Learners can learn the second skill without the first.',
    selected: 'border-low bg-low-soft',
    chip: 'bg-low-soft text-low-ink',
  },
}

const ratingKeys = Object.keys(ratingMeta)

const cycle = findCycle()

const linkTitle = (link) => `${getCompetency(link.from).short} → ${getCompetency(link.to).short}`

export default function GraphReview() {
  const [ratings, setRatings] = useState({})
  const [notes, setNotes] = useState({})
  const [index, setIndex] = useState(0)
  const [view, setView] = useState('review') // 'review' | 'summary' | 'submitted'

  const ratedCount = Object.keys(ratings).length
  const allRated = ratedCount === links.length

  const header = (
    <div>
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Prerequisite graph review</h1>
      <p className="mt-2 text-muted">
        Rate each prerequisite link before the graph is used for recommendations.
      </p>
      {cycle ? (
        <p role="alert" className="mt-3 rounded-lg bg-low-soft px-4 py-3 font-bold text-low-ink">
          Loop found: {cycle.map((id) => getCompetency(id).short).join(' → ')}. Fix these links before review.
        </p>
      ) : (
        <p className="mt-3 inline-block rounded-lg bg-mastered-soft px-4 py-2 text-sm font-bold text-mastered-ink">
          Graph check passed: {competencies.length} skills, {links.length} links, no loops
        </p>
      )}
    </div>
  )

  if (view === 'submitted') {
    return (
      <div className="flex flex-col gap-8">
        {header}
        <Card>
          <h2 className="font-display text-2xl font-bold">Ratings recorded</h2>
          <p className="mt-2 max-w-2xl text-muted">
            In this prototype the ratings are not saved. In the full system they are stored with the
            teacher&apos;s name, and agreement among teachers (Cohen&apos;s or Fleiss&apos; kappa) is computed
            before the graph is used.
          </p>
          <button
            type="button"
            onClick={() => {
              setRatings({})
              setNotes({})
              setIndex(0)
              setView('review')
            }}
            className={`mt-6 ${buttonClass('primary')}`}
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
      <div className="flex flex-col gap-8">
        {header}
        <Card>
          <h2 className="font-display text-2xl font-bold">Review summary</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {ratingKeys.map((key) => (
              <div key={key} className={`rounded-xl p-5 ${ratingMeta[key].chip}`}>
                <p className="font-display text-3xl font-bold">
                  {links.filter((l) => ratings[l.id] === key).length}
                </p>
                <p className="font-bold">{ratingMeta[key].label}</p>
              </div>
            ))}
          </div>

          <h3 className="mt-8 font-display text-xl font-bold">Links to revisit</h3>
          {flagged.length === 0 ? (
            <p className="mt-2 text-muted">All links were rated valid.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {flagged.map((l) => (
                <li key={l.id} className="py-3">
                  <p className="font-bold">
                    {getCompetency(l.from).name} → {getCompetency(l.to).name}
                  </p>
                  <p className="text-sm text-muted">
                    {ratingMeta[ratings[l.id]].label}
                    {notes[l.id] ? ` · ${notes[l.id]}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setView('review')}
              className={buttonClass('outline')}
            >
              Back to links
            </button>
            <button
              type="button"
              onClick={() => setView('submitted')}
              className={buttonClass('primary')}
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
  const nextDisabled = isLast ? !allRated : current === undefined

  return (
    <div className="flex flex-col gap-8">
      {header}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card>
          <p className="text-sm font-bold text-muted">
            Link {index + 1} of {links.length} · Teacher 1 of 3 · sample
          </p>
          <div className="mt-2 h-2 rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(ratedCount / links.length) * 100}%` }}
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-lg bg-surface px-4 py-2 font-medium">{from.name}</span>
            <span className="text-2xl text-brand">→</span>
            <span className="rounded-lg bg-brand-soft px-4 py-2 font-bold text-brand">{to.name}</span>
          </div>
          <h2 className="mt-4 font-display text-2xl font-bold">
            Is {from.name} a prerequisite for {to.name}?
          </h2>

          <div role="radiogroup" aria-label="Rating" className="mt-6 flex flex-col gap-3">
            {ratingKeys.map((key) => {
              const meta = ratingMeta[key]
              const selected = current === key
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setRatings((r) => ({ ...r, [link.id]: key }))}
                  className={`rounded-xl border-2 px-5 py-4 text-left transition-colors ${
                    selected ? meta.selected : 'border-line bg-white hover:border-brand'
                  }`}
                >
                  <span className="block text-lg font-bold">{meta.label}</span>
                  <span className="block text-sm text-muted">{meta.hint}</span>
                </button>
              )
            })}
          </div>

          <label htmlFor="note" className="mt-6 block text-sm font-bold text-muted">
            Comment (optional)
          </label>
          <textarea
            id="note"
            rows={3}
            value={notes[link.id] ?? ''}
            onChange={(e) => setNotes((n) => ({ ...n, [link.id]: e.target.value }))}
            placeholder="For example: this link should also include decimals."
            className="mt-1 w-full rounded-lg border border-line bg-white px-4 py-3"
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => i - 1)}
              disabled={index === 0}
              className={buttonClass('outline')}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => (isLast ? setView('summary') : setIndex((i) => i + 1))}
              disabled={nextDisabled}
              className={buttonClass('primary')}
            >
              {isLast ? 'Review summary' : 'Next link'}
            </button>
            {isLast && !allRated && (
              <p className="text-sm text-muted">
                {links.length - ratedCount} link{links.length - ratedCount === 1 ? '' : 's'} still unrated. Use the
                list to jump to them.
              </p>
            )}
          </div>
        </Card>

        <aside className="h-fit rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-xl font-bold">All links</h2>
          <p className="text-sm text-muted">
            {ratedCount} of {links.length} rated
          </p>
          <ol className="mt-4 flex flex-col gap-1">
            {links.map((l, i) => {
              const r = ratings[l.id]
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? 'step' : undefined}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left ${
                      i === index ? 'bg-brand-soft' : 'hover:bg-surface'
                    }`}
                  >
                    <span className={i === index ? 'font-bold text-brand' : 'font-medium'}>
                      {i + 1}. {linkTitle(l)}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
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