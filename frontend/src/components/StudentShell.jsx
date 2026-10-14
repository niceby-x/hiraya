import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import KnowledgeBackdrop from './KnowledgeBackdrop.jsx'
import Logo from './Logo.jsx'
import '../pages/student.css'

const THEME_KEY = 'hiraya-theme'

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

const links = [
  { to: '/student', label: 'My progress', end: true },
  { to: '/student/practice', label: 'Practice' },
  { to: '/student/path', label: 'Review path' },
]

// Shell for the student screens: the sign-in screen's night-teal world, with the knowledge
// network behind the page. Moving between pages, or answering correctly, lights a chain of nodes.
export default function StudentShell({ userLabel, home }) {
  const { key } = useLocation()
  const [lit, setLit] = useState(0)
  const [theme, setTheme] = useState(readTheme)
  const light = theme === 'light'

  function toggleTheme() {
    const next = light ? 'dark' : 'light'
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Storage can be blocked. The theme still changes for this visit.
    }
  }

  return (
    <div className="st-root" data-theme={theme}>
      <KnowledgeBackdrop pulse={`${key}:${lit}`} />

      <header className="st-header">
        <Link to={home} className="st-brand">
          <Logo size={32} className="text-aqua" />
          <span className="st-brand-name">HIRAYA</span>
        </Link>

        <nav className="st-nav" aria-label="Student">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>
          ))}
        </nav>

        <div className="st-user">
          <button type="button" className="st-theme" onClick={toggleTheme} aria-label={light ? 'Switch to dark mode' : 'Switch to light mode'} title={light ? 'Dark mode' : 'Light mode'}>
            {light ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            )}
          </button>
          <span className="st-avatar" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M24 42V22" /><path d="M24 28c-8 0-12-5-12-12 8 0 12 5 12 12Z" /><path d="M24 22c0-7 4-11 12-11 0 7-4 11-12 11Z" />
            </svg>
          </span>
          <span className="st-user-name">{userLabel}</span>
          <Link to="/" className="st-signout">Sign out</Link>
        </div>
      </header>

      <main className="st-main">
        <Outlet context={{ celebrate: () => setLit((n) => n + 1) }} />
      </main>
    </div>
  )
}
