import { useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import SkillRing from '../components/SkillRing.jsx'
import { THRESHOLD } from '../data/mock.js'
import { questions } from '../data/questions.js'
import { getCompetency, remediationPath, TARGET_ID } from '../lib/path.js'
import { percent } from '../lib/mastery.js'
import { recordResponse, useLearner } from '../lib/store.js'

const LEARNER_ID = 'l01'
const letters = ['A', 'B', 'C', 'D']

const Back = () => (
  <Link to="/student" className="st-back">
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
    My progress
  </Link>
)
const Check = ({ className }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
)
const Cross = ({ className }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
)

function optionClass({ submitted, isPicked, isAnswer }) {
  if (!submitted) return isPicked ? 'is-picked' : ''
  if (isAnswer) return 'is-right'
  if (isPicked) return 'is-wrong'
  return 'is-dim'
}

function PracticeSession({ competency, items }) {
  const learner = useLearner(LEARNER_ID)
  const outlet = useOutletContext()
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [change, setChange] = useState(null) // { before, after } mastery for the last answer

  const header = (
    <div className="st-ph">
      <div>
        <Back />
        <h1 className="st-title">{competency.name}</h1>
        <p className="st-sub">Practice</p>
      </div>
      <div className="st-ph-ring">
        <SkillRing p={learner.mastery[competency.id]} size={72} />
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
          <h2 className="st-h2">Practice complete</h2>
          <p className="st-score" style={{ marginTop: '1rem' }}>{correctCount}<small> of {items.length}</small></p>
          <p className="st-sub" style={{ marginTop: '.75rem' }}>answered correctly</p>
          <p className="st-note" style={{ margin: '.75rem auto 0', maxWidth: '32rem' }}>
            In the full system, each answer updates your mastery estimate and your review path.
          </p>
          <div className="st-actions">
            <button type="button" className="st-btn st-btn--primary" onClick={() => { setIndex(0); setPicked(null); setSubmitted(false); setCorrectCount(0) }}>
              Practice again
            </button>
            <Link to="/student/path" className="st-btn st-btn--ghost">See my review path</Link>
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
    if (isCorrect) {
      setCorrectCount((c) => c + 1)
      outlet?.celebrate?.()
    }
    setChange(recordResponse(LEARNER_ID, competency.id, isCorrect))
  }

  function next() {
    setIndex((i) => i + 1)
    setPicked(null)
    setSubmitted(false)
  }

  return (
    <div className="st-practice">
      {header}

      <section className="st-card st-pad">
        <div className="st-steps">
          <p>Question {index + 1} of {items.length}</p>
          <ol aria-hidden="true">
            {items.map((item, i) => (
              <li key={item.prompt} className={i < index ? 'is-done' : i === index ? 'is-now' : ''} />
            ))}
          </ol>
        </div>

        <h2 className="st-q">{q.prompt}</h2>

        <div role="radiogroup" aria-label="Answer choices" className="st-opts">
          {q.options.map((option, i) => {
            const state = optionClass({ submitted, isPicked: picked === i, isAnswer: q.answer === i })
            return (
              <button key={option} type="button" role="radio" aria-checked={picked === i} disabled={submitted}
                onClick={() => setPicked(i)} className={`st-opt ${state}`}>
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
              <p className="st-fb-title">
                {isCorrect ? 'Correct.' : `Not quite. The correct answer is ${letters[q.answer]}. ${q.options[q.answer]}`}
              </p>
              <p className="st-fb-text">{q.explanation}</p>
              {change && (
                <div className="st-meter">
                  <div className="st-meter-row">
                    <span>Your {competency.short} mastery</span>
                    <span>{percent(change.before)}% → {percent(change.after)}%</span>
                  </div>
                  <div className="st-track" role="img" aria-label={`Mastery moved from ${percent(change.before)} to ${percent(change.after)} percent. Mastery line ${percent(THRESHOLD)} percent.`}>
                    <div className="st-track-fill" style={{ '--from': `${percent(change.before)}%`, '--to': `${percent(change.after)}%` }} />
                    <span className="st-line95" style={{ left: `${percent(THRESHOLD)}%` }} />
                    <span className="st-line95-label" style={{ left: `${percent(THRESHOLD)}%` }}>{percent(THRESHOLD)}% line</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="st-next">
          {!submitted ? (
            <button type="button" className="st-btn st-btn--primary" onClick={submit} disabled={picked === null}>Submit answer</button>
          ) : (
            <button type="button" className="st-btn st-btn--primary" onClick={next}>{isLast ? 'See results' : 'Next question'}</button>
          )}
        </div>
      </section>
    </div>
  )
}

export default function Practice() {
  const [params] = useSearchParams()
  const learner = useLearner(LEARNER_ID)
  const path = remediationPath(learner.mastery, TARGET_ID)
  // Fixed when the page opens, so the session is not reset mid-practice when an
  // answer moves the first skill of the path above the mastery line.
  const [defaultSkill] = useState(() => path[0] ?? TARGET_ID)
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

  // key resets the session when the skill changes
  return <PracticeSession key={skillId} competency={competency} items={questions[skillId] ?? []} />
}
