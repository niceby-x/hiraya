import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import KnowledgeBackdrop from './KnowledgeBackdrop.jsx'
import ShellHeader, { bottomNavInset } from './ShellHeader.jsx'
import { icons } from './navIcons.jsx'
import SkipLink from './SkipLink.jsx'
import { useRouteA11y } from '../lib/routeA11y.js'
import { useLearner, useSettings } from '../lib/store.js'
import { useTheme } from '../lib/useTheme.js'
import '../pages/student.css'

const links = [
  { to: '/student', label: 'My progress', end: true, icon: icons.progress },
  { to: '/student/practice', label: 'Practice', icon: icons.practice },
  { to: '/student/path', label: 'Review path', icon: icons.path },
]

const userIcon = (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
)

export default function StudentShell({ userLabel, home }) {
  const { key, pathname } = useLocation()
  const [lit, setLit] = useState(0)
  const { theme, isDark, toggleTheme } = useTheme()
  const mainRef = useRouteA11y(pathname)
  const { learnerId } = useSettings()
  const learner = useLearner(learnerId)
  const displayLabel = learner ? `${learner.name} · Grade 7` : userLabel

  return (
    <div className={`st-root ${bottomNavInset}`} data-theme={theme}>
      <SkipLink mainRef={mainRef} />
      <KnowledgeBackdrop pulse={`${key}:${lit}`} dim={!isDark} />

      <ShellHeader
        navLabel="Student navigation"
        links={links}
        homeTo={home}
        resetTitle="Reset the sample mastery scores to their starting values"
        isDark={isDark}
        onToggleTheme={toggleTheme}
        userIcon={userIcon}
        userLabel={displayLabel}
        profileMenu
      />

      <main ref={mainRef} className="st-main">
        <Outlet context={{ celebrate: () => setLit((n) => n + 1) }} />
      </main>
    </div>
  )
}
