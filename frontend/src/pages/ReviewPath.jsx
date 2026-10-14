import { Link } from 'react-router-dom'
import SkillRing from '../components/SkillRing.jsx'
import { THRESHOLD } from '../data/mock.js'
import { bandFor, percent } from '../lib/mastery.js'
import { candidatePath, getCompetency, skippedPrerequisites, TARGET_ID } from '../lib/path.js'
import { useLearner } from '../lib/store.js'

const names = (ids) => ids.map((id) => getCompetency(id).short)
const pillClass = { mastered: 'ok', gap: 'warn', low: 'low', focus: 'focus', next: 'next' }

export default function ReviewPath() {
  const learner = useLearner('l01')
  const target = getCompetency(TARGET_ID)
  const { status, path } = candidatePath(learner.mastery, TARGET_ID, THRESHOLD)
  // Listed only when a path exists, and only prerequisites with a real estimate at or above the line.
  // A prerequisite missing from the path is not automatically mastered (e.g. the target is met but it is not).
  const skipped = skippedPrerequisites(learner.mastery, TARGET_ID, THRESHOLD)

  const pillFor = (id, i) => {
    if (id === TARGET_ID) return ['focus', 'Focus topic']
    if (i === 0) return ['next', 'Review next']
    const band = bandFor(learner.mastery[id])
    return [band, band === 'mastered' ? 'Mastered' : 'Needs review']
  }

  return (
    <div className="st-page">
      <div>
        <h1 className="st-title">My review path</h1>
        <p className="st-sub">Suggested order to reach {target.name}</p>
      </div>

      <section className="st-card st-pad" aria-labelledby="how-made">
        <h2 id="how-made" className="st-how-title">How this order was made</h2>
        <ol className="st-how">
          <li><b>1</b><span>Start from your goal: {target.name}.</span></li>
          <li><b>2</b><span>Check every skill it depends on, step by step.</span></li>
          <li><b>3</b><span>Keep the ones below {percent(THRESHOLD)}% and list them so each skill comes after the skills it builds on.</span></li>
        </ol>
      </section>

      {path.length === 0 ? (
        <section className="st-card st-pad">
          <p className="st-empty">
            {status === 'target-met'
              ? `You have reached the mastery line for ${target.name}. No review path is needed for this goal.`
              : `There is no mastery estimate for ${target.name} yet, so a review path can't be shown.`}
          </p>
        </section>
      ) : (
        <ol className="st-line">
          {path.map((id, i) => {
            const c = getCompetency(id)
            const p = learner.mastery[id]
            const unlocks = path.filter((other) => getCompetency(other).prereqs.includes(id))
            const [band, label] = pillFor(id, i)
            return (
              <li key={id} className={`st-step ${i === 0 ? 'is-next' : ''} ${id === TARGET_ID ? 'is-focus' : ''}`}>
                <div className="st-rail"><span className="st-num">{i + 1}</span></div>
                <div className="st-card st-step-card">
                  <div className="st-ring-wrap"><SkillRing p={p} size={72} /></div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="st-step-head">
                      <h3 className="st-step-name">{c.name}</h3>
                      <span className={`st-pill st-pill--${pillClass[band]}`}>{label}</span>
                    </div>
                    <p className="st-step-now">{percent(p)}% now · mastery line {percent(THRESHOLD)}%</p>
                    <p className="st-chips">
                      <b>Builds on</b>
                      {c.prereqs.length > 0 ? names(c.prereqs).map((n) => <span key={n} className="st-chip">{n}</span>) : <span>no earlier skills</span>}
                    </p>
                    {unlocks.length > 0 && (
                      <p className="st-chips">
                        <b>Needed for</b>
                        {names(unlocks).map((n) => <span key={n} className="st-chip">{n}</span>)}
                      </p>
                    )}
                    <Link to={`/student/practice?skill=${id}`} className={`st-btn st-btn--sm ${i === 0 ? 'st-btn--primary' : 'st-btn--ghost'}`}>
                      Practice this skill
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {skipped.length > 0 && (
        <section aria-labelledby="skipped">
          <h2 id="skipped" className="st-h2">Already mastered, so skipped</h2>
          <ul className="st-skipped">
            {skipped.map((id) => (
              <li key={id}>
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                {getCompetency(id).name} · {percent(learner.mastery[id])}%
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="st-note">This order is a suggestion. Your teacher can change it. Sample data for the prototype.</p>
    </div>
  )
}
