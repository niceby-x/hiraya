import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { learners } from '../data/mock.js'
import { questions } from '../data/questions.js'
import { getCompetency, remediationPath, TARGET_ID } from '../lib/path.js'

const learner = learners[0]
const letters = ['A', 'B', 'C', 'D']

function optionClass({ submitted, isPicked, isAnswer }) {
  const base =
    'flex w-full items-center gap-4 rounded-xl border-2 px-5 py-4 text-left transition-colors disabled:cursor-default'
  if (!submitted) {
    return `${base} ${isPicked ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand'}`
  }
  if (isAnswer) return `${base} border-mastered bg-mastered-soft`
  if (isPicked) return `${base} border-low bg-low-soft`
  return `${base} border-line bg-white opacity-60`
}

function PracticeSession({ competency, items }) {
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const header = (
    <div>
      <Link to="/student" className="text-sm font-bold text-brand">
        ← My progress
      </Link>
      <p className="mt-4 text-sm font-bold uppercase tracking-widest text-muted">Practice</p>
      <h1 className="mt-1 font-display text-4xl font-bold">{competency.name}</h1>
    </div>
  )

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <p className="rounded-2xl border border-line bg-white p-8 text-muted">
          Practice questions for this skill are not loaded yet.
        </p>
      </div>
    )
  }

  if (index >= items.length) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <section className="rounded-2xl border border-line bg-white p-8">
          <h2 className="font-display text-2xl font-bold">Practice complete</h2>
          <p className="mt-2 text-lg">
            You answered {correctCount} of {items.length} correctly.
          </p>
          <p className="mt-2 max-w-2xl text-muted">
            In the full system, each answer updates your mastery estimate and your review path.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setIndex(0)
                setPicked(null)
                setSubmitted(false)
                setCorrectCount(0)
              }}
              className="rounded-lg bg-brand px-6 py-3 font-bold text-white"
            >
              Practice again
            </button>
            <Link to="/student/path" className="rounded-lg border-2 border-brand px-6 py-3 font-bold text-brand">
              See my review path
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const q = items[index]
  const isCorrect = picked === q.answer
  const isLast = index === items.length - 1

  function submit() {
    setSubmitted(true)
    if (isCorrect) setCorrectCount((c) => c + 1)
  }

  function next() {
    setIndex((i) => i + 1)
    setPicked(null)
    setSubmitted(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {header}

      <section className="rounded-2xl border border-line bg-white p-8">
        <div className="flex items-center gap-4">
          <p className="text-sm font-bold text-muted">
            Question {index + 1} of {items.length}
          </p>
          <div className="h-2 flex-1 rounded-full bg-line">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(index / items.length) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="mt-6 font-display text-2xl font-bold">{q.prompt}</h2>

        <div role="radiogroup" aria-label="Answer choices" className="mt-6 flex flex-col gap-3">
          {q.options.map((option, i) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={picked === i}
              disabled={submitted}
              onClick={() => setPicked(i)}
              className={optionClass({ submitted, isPicked: picked === i, isAnswer: q.answer === i })}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface font-bold">
                {letters[i]}
              </span>
              <span className="text-lg">{option}</span>
            </button>
          ))}
        </div>

        <div aria-live="polite">
          {submitted && (
            <div
              className={`mt-6 rounded-xl p-5 ${
                isCorrect ? 'bg-mastered-soft text-mastered-ink' : 'bg-low-soft text-low-ink'
              }`}
            >
              <p className="font-bold">
                {isCorrect
                  ? 'Correct.'
                  : `Not quite. The correct answer is ${letters[q.answer]}. ${q.options[q.answer]}`}
              </p>
              <p className="mt-1">{q.explanation}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          {!submitted ? (
            <button
              type="button"
              onClick={submit}
              disabled={picked === null}
              className="rounded-lg bg-brand px-6 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit answer
            </button>
          ) : (
            <button type="button" onClick={next} className="rounded-lg bg-brand px-6 py-3 font-bold text-white">
              {isLast ? 'See results' : 'Next question'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

export default function Practice() {
  const [params] = useSearchParams()
  const path = remediationPath(learner.mastery, TARGET_ID)
  const skillId = params.get('skill') ?? path[0] ?? TARGET_ID
  const competency = getCompetency(skillId)

  if (!competency) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-bold">Practice</h1>
        <p className="text-muted">That skill was not found.</p>
        <Link to="/student" className="font-bold text-brand">
          ← My progress
        </Link>
      </div>
    )
  }

  // key resets the session when the skill changes
  return <PracticeSession key={skillId} competency={competency} items={questions[skillId] ?? []} />
}