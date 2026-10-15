import { Outlet, useLocation } from 'react-router-dom'
import KnowledgeBackdrop from './KnowledgeBackdrop.jsx'
import ShellHeader, { bottomNavInset } from './ShellHeader.jsx'
import SkipLink from './SkipLink.jsx'
import { useRouteA11y } from '../lib/routeA11y.js'
import { useTheme } from '../lib/useTheme.js'

const userIcon = (
  <svg viewBox="0 0 48 48" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="8" width="36" height="32" rx="5" />
    <path d="M16 32v-7M24 32V16M32 32v-11" />
  </svg>
)

export default function AppShell({ links, userLabel, home }) {
  const { search, pathname, key } = useLocation()
  const { theme, isDark, toggleTheme } = useTheme()
  const mainRef = useRouteA11y(pathname)
  const navLinks = links.map((link) => ({ ...link, search: link.keepSearch ? search : '' }))

  return (
    <div className={`tc-root ${bottomNavInset}`} data-theme={theme}>
      <SkipLink mainRef={mainRef} />
      <KnowledgeBackdrop pulse={key} dim={!isDark} />

      <ShellHeader
        navLabel="Teacher navigation"
        links={navLinks}
        homeTo={{ pathname: home, search }}
        resetTitle="Reset sample BKT mastery data to initial values"
        isDark={isDark}
        onToggleTheme={toggleTheme}
        userIcon={userIcon}
        userLabel={userLabel}
      />

      <main ref={mainRef} key={pathname} className="relative z-10 mx-auto w-full max-w-295 px-4 py-6 sm:px-8 sm:py-9">
        <Outlet />
      </main>
    </div>
  )
}
