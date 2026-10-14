import { useEffect, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import SkillRing from '../components/SkillRing.jsx'
import { questions } from '../data/questions.js'
import { getCompetency, remediationPath } from '../lib/path.js'
import { percent } from '../lib/mastery.js'
import { recordResponse, useLearner, useSettings } from '../lib/store.js'

const letters = ['A', 'B', 'C', 'D']

const Back = () => (
  <Link to="/student" className="st-back">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 5l-7 7 7 7" />
    </svg>
    My progress
  </Link>
)

const Check = ({ className }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
)

const Cross = ({ className }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
)

function optionClass({ submitted, isPicked, isAnswer }) {
  if (!submitted) return isPicked ? 'is-picked' : ''
  if (isAnswer) return 'is-right'
  if (isPicked) return 'is-wrong'
  return 'is-dim'
}

function PracticeSession({ competency, items }) {
  const { learnerId, targetId, theta } = useSettings()
  const learner = useLearner(learnerId)
  const outlet = useOutletContext()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [change, setChange] = useState(null)

  const currentMastery = learner.mastery[competency.id]
  const isNowMastered = currentMastery >= theta
  const updatedPath = remediationPath(learner.mastery, targetId, theta)
  const nextRecommendedId = updatedPath.find((id) => id !== competency.id) ?? updatedPath[0]
  const nextRecommended = nextRecommendedId ? getCompetency(nextRecommendedId) : null

  const q = items[index]
  const isCorrect = q ? picked === q.answer : false
  const isLast = index === items.length - 1

  function submit() {
    if (picked === null || submitted) return
    setSubmitted(true)
    if (isCorrect) {
      setCorrectCount((c) => c + 1)
      outlet?.celebrate?.()
    }
    setChange(recordResponse(learner.id, competency.id, isCorrect))
  }

  function next() {
    setIndex((i) => i + 1)
    setPicked(null)
    setSubmitted(false)
  }

  useEffect(() => {
    if (!q) return undefined
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const key = e.key.toUpperCase()
      if (!submitted) {
        const letterIdx = letters.indexOf(key)
        const numIdx = ['1', '2', '3', '4'].indexOf(key)
        const chosen = letterIdx !== -1 ? letterIdx : numIdx
        if (chosen !== -1 && chosen < q.options.length) {
          e.preventDefault()
          setPicked(chosen)
        } else if (e.key === 'Enter' && picked !== null) {
          e.preventDefault()
          submit()
        }
      } else if (e.key === 'Enter') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const header = (
    <div className="st-ph">
      <div>
        <Back />
        <h1 className="st-title">{competency.name}</h1>
        <p className="st-sub">
          {competency.strand} · Goal: {percent(theta)}% mastery
        </p>
      </div>
      <div className="st-ph-ring">
        <SkillRing p={currentMastery} theta={theta} size={72} />
        <div>Your mastery</div>
      </div>
    </div>
  )

  if (items.length === 0) {
    return (
      <div className="st-practice">
        {header}
        <section className="st-card st-pad">
          <p className="st-empty">Practice questions for this skill are not loaded yet.</p>
        </section>
      </div>
    )
  }

  if (index >= items.length) {
    return (
      <div className="st-practice">
        {header}
        <section className="st-card st-pad st-done">
          <span className={`st-pill st-pill--${isNowMastered ? 'ok' : 'warn'}`}>
            {isNowMastered ? `✓ Reached ${percent(theta)}% Mastery Line` : `${percent(currentMastery)}% Current Estimate`}
          </span>
          <h2 className="st-h2" style={{ marginTop: '.75rem' }}>Practice complete</h2>
          <p className="st-score" style={{ marginTop: '1rem' }}>
            {correctCount}
            <small> of {items.length}</small>
          </p>
          <p className="st-sub" style={{ marginTop: '.75rem' }}>answered correctly</p>
          <p className="st-note" style={{ margin: '.75rem auto 0', maxWidth: '32rem' }}>
            {isNowMastered
              ? `Great job! Your mastery estimate for ${competency.name} is now ${percent(currentMastery)}%, which meets the ${percent(theta)}% threshold.`
              : `Your mastery estimate is now ${percent(currentMastery)}%. Practice another round to reach the ${percent(theta)}% mastery line.`}
          </p>
          <div className="st-actions">
            {isNowMastered && nextRecommended ? (
              <Link to={`/student/practice?skill=${nextRecommended.id}`} className="st-btn st-btn--primary">
                Next skill: {nextRecommended.short}
              </Link>
            ) : (
              <button
                type="button"
                className="st-btn st-btn--primary"
                onClick={() => {
                  setIndex(0)
                  setPicked(null)
                  setSubmitted(false)
                  setCorrectCount(0)
                }}
              >
                Practice again
              </button>
            )}
            <Link to="/student/path" className="st-btn st-btn--ghost">
              See my review path
            </Link>
          </div>
        </section>
      </div>
    )
  }

  const deltaPts = change ? percent(change.after) - percent(change.before) : 0
  const crossedThreshold = change && change.before < theta && change.after >= theta

  return (
    <div className="st-practice">
      {header}

      <section className="st-card st-pad">
        <div className="st-steps">
          <p>Question {index + 1} of {items.length}</p>
          <ol aria-hidden="true">
            {items.map((item, i) => (
              <li key={item.id ?? item.prompt} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} />
            ))}
          </ol>
        </div>

        <h2 className="st-q">{q.prompt}</h2>

        <div role="radiogroup" aria-label="Answer choices" className="st-opts">
          {q.options.map((option, i) => {
            const state = optionClass({ submitted, isPicked: picked === i, isAnswer: q.answer === i })
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={picked === i}
                disabled={submitted}
                onClick={() => setPicked(i)}
                className={`st-opt ${state}`}
              >
                <span className="st-letter">{letters[i]}</span>
                <span>{option}</span>
                {state === 'is-right' && <Check className="st-opt-mark" />}
                {state === 'is-wrong' && <Cross className="st-opt-mark" />}
              </button>
            )
          })}
        </div>

        <div aria-live="polite">
          {submitted && (
            <div className={`st-fb ${isCorrect ? 'is-right' : 'is-wrong'}`}>
              <div className="st-fb-head">
                <p className="st-fb-title">
                  {isCorrect
                    ? 'Correct!'
                    : `Not quite. The correct answer is ${letters[q.answer]}. ${q.options[q.answer]}`}
                </p>
                {change && (
                  <span className={`st-delta ${deltaPts >= 0 ? 'is-up' : 'is-down'}`}>
                    {deltaPts >= 0 ? `+${deltaPts}%` : `${deltaPts}%`} BKT update
                  </span>
                )}
              </div>
              <p className="st-fb-text">{q.explanation}</p>
              {change && (
                <div className="st-meter">
                  <div className="st-meter-row">
                    <span>Your {competency.short} mastery</span>
                    <span>
                      {percent(change.before)}% → {percent(change.after)}%
                    </span>
                  </div>
                  <div
                    className="st-track"
                    role="img"
                    aria-label={`Mastery moved from ${percent(change.before)} to ${percent(change.after)} percent. Mastery line ${percent(theta)} percent.`}
                  >
                    <div
                      className="st-track-fill"
                      style={{ '--from': `${percent(change.before)}%`, '--to': `${percent(change.after)}%` }}
                    />
                    <span className="st-line95" style={{ left: `${percent(theta)}%` }} />
                    <span className="st-line95-label" style={{ left: `${percent(theta)}%` }}>
                      {percent(theta)}% line
                    </span>
                  </div>
                </div>
              )}
              {crossedThreshold && (
                <div className="st-mastered-banner">
                  <span>✓ You crossed the {percent(theta)}% mastery line for {competency.short}!</span>
                  {nextRecommended && (
                    <Link to={`/student/practice?skill=${nextRecommended.id}`} className="st-btn st-btn--sm st-btn--primary">
                      Jump to {nextRecommended.short}
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="st-next">
          {!submitted ? (
            <button type="button" className="st-btn st-btn--primary" onClick={submit} disabled={picked === null}>
              Submit answer
            </button>
          ) : (
            <button type="button" className="st-btn st-btn--primary" onClick={next}>
              {isLast ? 'See results' : 'Next question'}
            </button>
          )}
          <span className="st-kbd-hint">
            Tip: Press <kbd>A</kbd>–<kbd>D</kbd> to choose, <kbd>Enter</kbd> to continue
          </span>
        </div>
      </section>
    </div>
  )
}

export default function Practice() {
  const [params] = useSearchParams()
  const { learnerId, targetId, theta } = useSettings()
  const learner = useLearner(learnerId)
  const path = remediationPath(learner.mastery, targetId, theta)
  const [defaultSkill] = useState(() => path[0] ?? targetId)
  const skillId = params.get('skill') ?? defaultSkill
  const competency = getCompetency(skillId)

  if (!competency) {
    return (
      <div className="st-practice">
        <Back />
        <h1 className="st-title">Practice</h1>
        <p className="st-sub">That skill was not found.</p>
      </div>
    )
  }

  return <PracticeSession key={skillId} competency={competency} items={questions[skillId] ?? []} />
}