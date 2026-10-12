import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KnowledgeBackdrop from '../components/KnowledgeBackdrop.jsx'
import HirayaMark from '../components/HirayaMark.jsx'
import './login.css'

const SAMPLE_PASSWORD = 'sample1234'

const HEADLINE = [
  ['Build', 'the', 'foundations.'],
  ['Grow', 'your', 'skills.'],
]

const roles = {
  student: {
    title: "I'm a Student",
    blurb: 'Find the skills to practice and strengthen your understanding.',
    username: 'learner01',
    to: '/student',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 42V22" /><path d="M24 28c-8 0-12-5-12-12 8 0 12 5 12 12Z" /><path d="M24 22c0-7 4-11 12-11 0 7-4 11-12 11Z" />
      </svg>
    ),
  },
  teacher: {
    title: "I'm a Teacher",
    blurb: 'Explore learner progress and identify foundational skills that need support.',
    username: 'teacher.math7',
    to: '/teacher',
    icon: (
      <svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="8" width="36" height="32" rx="5" /><path d="M16 32v-7M24 32V16M32 32v-11" />
      </svg>
    ),
  },
}

function Field({ id, label, error, shake, ...props }) {
  return (
    <div className={`lg-field ${shake ? 'lg-shake' : ''}`} key={shake}>
      <input id={id} placeholder=" " aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      <label htmlFor={id}>{label}</label>
      {error && <p id={`${id}-err`} className="lg-err">{error}</p>}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState(0)
  const [pulse, setPulse] = useState(0)
  const [help, setHelp] = useState(false)

  function pick(key) {
    setRole(key); setUsername(roles[key].username); setPassword(SAMPLE_PASSWORD)
    setErrors({}); setHelp(false); setPulse((n) => n + 1)
  }

  function back() { setRole(null); setErrors({}); setHelp(false) }

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!username.trim()) next.username = 'Enter your username.'
    if (password !== SAMPLE_PASSWORD) next.password = 'That password does not match.'
    setErrors(next)
    if (Object.keys(next).length) { setShake((n) => n + 1); return }
    navigate(roles[role].to)
  }

  const typing = (set) => (e) => { set(e.target.value); setErrors({}); setPulse((n) => n + 1) }

  return (
    <div className="lg-root">
      <KnowledgeBackdrop pulse={pulse} />

      <main className="lg-main">
        <header className="lg-brand">
          <span className="lg-tile"><HirayaMark size={40} /></span>
          <span className="lg-brand-name">HIRAYA</span>
        </header>

        <h1 className="lg-title" aria-label="Build the foundations. Grow your skills.">
          {HEADLINE.map((line, l) => (
            <span key={l} className={`lg-line ${l === 1 ? 'is-accent' : ''}`} aria-hidden="true">
              {line.map((w, i) => (
                <span key={w} className="lg-word" style={{ '--i': l * 3 + i }}>{w}</span>
              ))}
            </span>
          ))}
        </h1>
        <p className="lg-sub">Discover what to learn next through personalized mathematics practice and teacher-guided support.</p>
        <hr className="lg-rule" />

        <div className="lg-roles" data-picked={role ?? ''}>
          {Object.entries(roles).map(([key, r]) => {
            const open = role === key
            const away = role && !open
            return (
              <section key={key} className={`lg-card ${open ? 'is-open' : ''} ${away ? 'is-away' : ''}`} aria-hidden={away || undefined}>
                {!open ? (
                  <button type="button" className="lg-pick" onClick={() => pick(key)} tabIndex={away ? -1 : 0}>
                    <span className="lg-plain-icon">{r.icon}</span>
                    <span className="lg-pick-title">{r.title}</span>
                    <span className="lg-pick-blurb">{r.blurb}</span>
                    <span className={`lg-btn ${key === 'student' ? 'is-primary' : ''}`}>
                      Continue as {key === 'student' ? 'Student' : 'Teacher'}
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </button>
                ) : (
                  <form onSubmit={submit} noValidate className="lg-form">
                    <div className="lg-form-head">
                      <span className="lg-icon sm">{r.icon}</span>
                      <p>{r.title}</p>
                      <button type="button" className="lg-link" onClick={back}>Change role</button>
                    </div>

                    <Field id="username" label="Username" autoComplete="username" value={username}
                      onChange={typing(setUsername)} error={errors.username} shake={errors.username ? shake : 0} />
                    <Field id="password" label="Password" type="password" autoComplete="current-password" value={password}
                      onChange={typing(setPassword)} error={errors.password} shake={errors.password ? shake : 0} />

                    <div className="lg-forgot">
                      {errors.password && (
                        <p role="alert" className="lg-tip">Not sure? Reset it with Forgot password.</p>
                      )}
                      <button type="button" className="lg-link" onClick={() => setHelp((v) => !v)}>Forgot password?</button>
                    </div>
                    {help && (
                      <p className="lg-help">Password reset is not connected in this prototype. The sample password is {SAMPLE_PASSWORD}.</p>
                    )}

                    <button type="submit" className="lg-primary">Sign in</button>
                    <div className="lg-or"><span>or</span></div>
                    <button type="button" className="lg-sso" onClick={() => navigate(r.to)}>
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                        <path fill="#fff" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.300 3-7.300Z" />
                        <path fill="#fff" opacity=".8" d="M12 22c2.7 0 5-.9 6.600-2.400l-3.200-2.500c-.9.600-2 1-3.400 1-2.600 0-4.800-1.800-5.600-4.100H3.100v2.600A10 10 0 0 0 12 22Z" />
                        <path fill="#fff" opacity=".6" d="M6.400 13.900a6 6 0 0 1 0-3.800V7.500H3.100a10 10 0 0 0 0 9l3.300-2.600Z" />
                        <path fill="#fff" opacity=".9" d="M12 5.900c1.500 0 2.800.5 3.800 1.500l2.900-2.900A10 10 0 0 0 3.100 7.500l3.300 2.600C7.200 7.700 9.400 5.900 12 5.900Z" />
                      </svg>
                      Sign in with Google (DepEd account)
                    </button>
                    <p className="lg-note">Prototype only. Accounts and single sign-on are not connected, and all data is sample data.</p>
                  </form>
                )}
              </section>
            )
          })}
        </div>
      </main>
    </div>
  )
}