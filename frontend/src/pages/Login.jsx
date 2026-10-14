import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KnowledgeBackdrop from '../components/KnowledgeBackdrop.jsx'
import AnimatedLogo from '../components/AnimatedLogo.jsx'
import './login.css'

const SAMPLE_PASSWORD = 'sample1234'

// Clicking the logo swaps between these two headlines. Each one is a list of lines of words.
const HEADLINES = [
  [['Build', 'the', 'foundations.'], ['Grow', 'your', 'skills.']],
  [['The', 'fruit', 'of', 'one’s', 'hopes,', 'dreams,', 'and', 'aspirations.']],
]
const HEADLINE_TEXT = HEADLINES.map((lines) => lines.map((l) => l.join(' ')).join(' '))

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

function EyeIcon({ off }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  )
}

const leadIcons = {
  user: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
}

function Field({ id, label, error, shake, type, icon, ...props }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className={`lg-field ${icon ? 'has-icon' : ''} ${isPassword ? 'has-toggle' : ''} ${shake ? 'lg-shake' : ''}`} key={shake}>
      <input id={id} placeholder=" " type={isPassword && visible ? 'text' : type} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-err` : undefined} {...props} />
      <label htmlFor={id}>{label}</label>
      <fieldset className="lg-outline" aria-hidden="true">
        <legend><span>{label}</span></legend>
      </fieldset>
      {icon && <span className="lg-lead" aria-hidden="true">{leadIcons[icon]}</span>}
      {isPassword && (
        <button type="button" className="lg-eye" onClick={() => setVisible((v) => !v)} aria-label="Show password" aria-pressed={visible}>
          <EyeIcon off={visible} />
        </button>
      )}
      {error && <p id={`${id}-err`} className="lg-err">{error}</p>}
    </div>
  )
}

export default function Login() {
  const [burst, setBurst] = useState(null)
  const [alt, setAlt] = useState(0) // which headline is showing
  const navigate = useNavigate()
  const [role, setRole] = useState(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState(0)
  const [pulse, setPulse] = useState(0)
  const [help, setHelp] = useState(false)

  function pick(key) {
    setRole(key)
    setUsername(roles[key].username)
    setPassword(SAMPLE_PASSWORD)
    setErrors({})
    setHelp(false)
    setPulse((n) => n + 1)
  }

  function back() {
    setRole(null)
    setErrors({})
    setHelp(false)
  }

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!username.trim()) next.username = 'Enter your username.'
    if (password !== SAMPLE_PASSWORD) next.password = 'That password does not match.'
    setErrors(next)
    if (Object.keys(next).length) {
      setShake((n) => n + 1)
      return
    }
    navigate(roles[role].to)
  }

  const typing = (set) => (e) => {
    set(e.target.value)
    setErrors({})
    setPulse((n) => n + 1)
  }

  const hasRole = Boolean(role)

  return (
    <div className="lg-root">
      <KnowledgeBackdrop pulse={pulse} burst={burst} />
      <main className="lg-main">
        {/* Collapsible Intro: hides logo, headline, subtitle, and rule when a role card is clicked */}
        <div className="lg-intro" data-hidden={hasRole} aria-hidden={hasRole || undefined}>
          <div className="lg-intro-inner">
            <header className="lg-brand">
              <AnimatedLogo
                size={65}
                onActivate={(pt) => {
                  if (hasRole) return
                  setBurst({ ...pt, id: performance.now() })
                  setAlt((v) => 1 - v)
                }}
              />
              <span className="lg-brand-name">HIRAYA</span>
            </header>
            <h1 className="lg-title" aria-label={HEADLINE_TEXT[alt]}>
              {HEADLINES.map((lines, v) => (
                <span key={v} className={`lg-variant ${v === 1 ? 'is-alt' : ''}`} data-on={alt === v} aria-hidden="true">
                  {lines.map((line, l) => (
                    <span key={l} className={`lg-line ${v === 0 && l === 1 ? 'is-accent' : ''}`}>
                      {line.map((w, i) => (
                        <span key={`${w}-${i}`} className="lg-word" style={{ '--i': lines.slice(0, l).flat().length + i }}>
                          {w}
                        </span>
                      ))}
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="lg-sub">
              Discover what to learn next through personalized mathematics practice and teacher-guided support.
            </p>
            <hr className="lg-rule" />
          </div>
        </div>

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
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </button>
                ) : (
                  <form onSubmit={submit} noValidate className="lg-form">
                    <div className="lg-form-head">
                      <span className="lg-icon sm">{r.icon}</span>
                      <p>{r.title}</p>
                      <button type="button" className="lg-swap" onClick={back} aria-label="Change role" data-tip="Change role">
                        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 8h15M15 4l4 4-4 4" /><path d="M20 16H5M9 12l-4 4 4 4" />
                        </svg>
                      </button>
                    </div>
                    <Field
                      id="username"
                      label="Username"
                      icon="user"
                      autoComplete="username"
                      value={username}
                      onChange={typing(setUsername)}
                      error={errors.username}
                      shake={errors.username ? shake : 0}
                    />
                    <Field
                      id="password"
                      label="Password"
                      icon="lock"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={typing(setPassword)}
                      error={errors.password}
                      shake={errors.password ? shake : 0}
                    />
                    <div className="lg-forgot">
                      <label className="lg-check">
                        <input type="checkbox" name="remember" />
                        <span className="lg-box" aria-hidden="true">
                          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3.5 8.5l3 3 6-7" />
                          </svg>
                        </span>
                        Remember me
                      </label>
                      {errors.password && (
                        <p role="alert" className="lg-tip">Not sure? Reset it with Forgot password.</p>
                      )}
                      <button type="button" className="lg-link" onClick={() => setHelp((v) => !v)}>
                        Forgot password?
                      </button>
                    </div>
                    {help && (
                      <p className="lg-help">
                        Password reset is not connected in this prototype. The sample password is {SAMPLE_PASSWORD}.
                      </p>
                    )}
                    <button type="submit" className="lg-primary">Sign in</button>
                    <div className="lg-or"><span>or</span></div>
                    <button type="button" className="lg-sso" onClick={() => navigate(r.to)}>
                      <span className="lg-g" aria-hidden="true">
                        <svg viewBox="0 0 48 48" width="18" height="18">
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                        </svg>
                      </span>
                      Sign in with Google (DepEd account)
                    </button>
                    <p className="lg-note">
                      Prototype only. Accounts and single sign-on are not connected, and all data is sample data.
                    </p>
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