import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import KnowledgeBackdrop from './KnowledgeBackdrop.jsx'
import Logo from './Logo.jsx'
import { competencies } from '../data/mock.js'
import { percent } from '../lib/mastery.js'
import { resetLearners, useLearner, useSettings } from '../lib/store.js'
import '../pages/student.css'

const THEME_KEY = 'hiraya-theme'

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const links = [
  { to: '/student', label: 'My progress', end: true },
  { to: '/student/practice', label: 'Practice' },
  { to: '/student/path', label: 'Review path' },
]

export default function StudentShell({ userLabel, home }) {
  const { key } = useLocation()
  const [lit, setLit] = useState(0)
  const [theme, setTheme] = useState(readTheme)
  const light = theme === 'light'
  const { learnerId, theta } = useSettings()
  const learner = useLearner(learnerId)
  const masteredCount = competencies.filter((c) => (learner?.mastery?.[c.id] ?? 0) >= theta).length
  const displayLabel = learner ? `${learner.name} · Grade 7` : userLabel

  function toggleTheme() {
    const next = light ? 'dark' : 'light'
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Storage can be blocked.
    }
  }

  return (
    <div className="st-root" data-theme={theme}>
      <KnowledgeBackdrop pulse={`${key}:${lit}`} />

      <header className="on-dark st-topbar sticky top-0 z-30 border-b border-white/12 bg-night/90 px-4 py-2.5 text-white backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-295 flex-wrap items-center gap-x-6 gap-y-2">
          <Link to={home} className="flex items-center gap-2.5 py-1 group">
            <Logo size={32} className="text-aqua transition-transform duration-200 group-hover:scale-105" />
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold tracking-widest text-white">HIRAYA</span>
              <span className="rounded-full border border-aqua/30 bg-aqua/10 px-2 py-0.5 text-[11px] font-bold tracking-wide text-aqua uppercase">
                Student
              </span>
            </div>
          </Link>

          <nav
            aria-label="Student navigation"
            className="order-last flex w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:order-none sm:w-auto sm:flex-1 sm:pb-0"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `relative whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-aqua/15 font-bold text-white shadow-[inset_0_-2px_0_0_#66e5d3]'
                      : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm sm:ml-0">
            <span className="st-header-pill" title={`Skills at or above ${percent(theta)}% mastery`}>
              ✓ {masteredCount}/{competencies.length} Mastered
            </span>
            <button
              type="button"
              onClick={resetLearners}
              title="Reset the sample mastery scores to their starting values"
              className="hidden rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/80 transition-colors hover:border-aqua/40 hover:bg-white/10 hover:text-white md:inline-flex items-center gap-1.5 cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset demo
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'}
              title={light ? 'Switch to dark mode' : 'Switch to light mode'}
              className="grid h-8.5 w-8.5 place-items-center rounded-full border border-white/15 bg-white/8 text-white/85 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
            >
              {light ? (
                <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              )}
            </button>
            <div className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1 pr-3 pl-1.5 lg:flex">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-aqua/20 text-aqua">
                <svg viewBox="0 0 48 48" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 42V22" />
                  <path d="M24 28c-8 0-12-5-12-12 8 0 12 5 12 12Z" />
                  <path d="M24 22c0-7 4-11 12-11 0 7-4 11-12 11Z" />
                </svg>
              </span>
              <span className="text-xs font-medium text-white/85">{displayLabel}</span>
            </div>
            <Link
              to="/"
              className="rounded-lg px-2.5 py-1.5 font-bold text-aqua transition-colors hover:bg-aqua/10 hover:underline"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <main className="st-main">
        <Outlet context={{ celebrate: () => setLit((n) => n + 1) }} />
      </main>
    </div>
  )
}