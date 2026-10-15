import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import KnowledgeBackdrop from './KnowledgeBackdrop.jsx'
import ShellHeader from './ShellHeader.jsx'
import SkipLink from './SkipLink.jsx'
import { competencies } from '../data/mock.js'
import { percent } from '../lib/mastery.js'
import { useRouteA11y } from '../lib/routeA11y.js'
import { useLearner, useSettings } from '../lib/store.js'
import { useTheme } from '../lib/useTheme.js'
import '../pages/student.css'

const links = [
  { to: '/student', label: 'My progress', end: true },
  { to: '/student/practice', label: 'Practice' },
  { to: '/student/path', label: 'Review path' },
]

const userIcon = (
  <svg viewBox="0 0 48 48" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 42V22" />
    <path d="M24 28c-8 0-12-5-12-12 8 0 12 5 12 12Z" />
    <path d="M24 22c0-7 4-11 12-11 0 7-4 11-12 11Z" />
  </svg>
)

export default function StudentShell({ userLabel, home }) {
  const { key, pathname } = useLocation()
  const [lit, setLit] = useState(0)
  const { theme, isDark, toggleTheme } = useTheme()
  const mainRef = useRouteA11y(pathname)
  const { learnerId, theta } = useSettings()
  const learner = useLearner(learnerId)
  const masteredCount = competencies.filter((c) => (learner?.mastery?.[c.id] ?? 0) >= theta).length
  const displayLabel = learner ? `${learner.name} · Grade 7` : userLabel

  return (
    <div className="st-root" data-theme={theme}>
      <SkipLink mainRef={mainRef} />
      <KnowledgeBackdrop pulse={`${key}:${lit}`} dim={!isDark} />

      <ShellHeader
        className="st-topbar"
        badge="Student"
        navLabel="Student navigation"
        links={links}
        homeTo={home}
        extra={
          <span className="st-header-pill" title={`Skills at or above ${percent(theta)}% mastery`}>
            ✓ {masteredCount}/{competencies.length} Mastered
          </span>
        }
        resetTitle="Reset the sample mastery scores to their starting values"
        isDark={isDark}
        onToggleTheme={toggleTheme}
        userIcon={userIcon}
        userLabel={displayLabel}
        userPillClass="lg:flex"
      />

      <main ref={mainRef} className="st-main">
        <Outlet context={{ celebrate: () => setLit((n) => n + 1) }} />
      </main>
    </div>
  )
}
