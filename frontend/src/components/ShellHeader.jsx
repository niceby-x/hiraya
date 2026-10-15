import { useEffect, useRef } from 'react'
import { Link, NavLink, matchPath, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'
import { resetLearners } from '../lib/store.js'

export const bottomNavInset = 'pb-20 sm:pb-0'

// 5 copies on mobile so the centered active tab always has continuous neighbors on both sides,
// even on wider phones or 3-item menus. Copy index 2 is the centered primary set.
const COPIES = 5
const CENTER_COPY = 2

export default function ShellHeader({
  badge,
  navLabel,
  links = [],
  homeTo = '/',
  resetTitle = 'Reset sample BKT mastery data to initial values',
  isDark = false,
  onToggleTheme,
  userIcon,
  userLabel,
  userPillClass = 'xl:flex',
  children,
}) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const mobileNavRef = useRef(null)
  const itemRefs = useRef({})
  const firstMount = useRef(true)
  const adjustingScroll = useRef(false)

  const baseHome = typeof homeTo === 'string' ? homeTo : homeTo?.pathname ?? '/'

  function handleReset() {
    resetLearners()
    navigate(baseHome, { replace: true })
  }

  // Find which link in `links` matches the current route
  const activeIndex = links.findIndex((link) =>
     Boolean(matchPath({ path: link.to, end: Boolean(link.end) }, pathname)),
  )

  // Measure the pixel width of one full set of links (including gap)
  const getSetWidth = () => {
    if (links.length === 0) return 0
    const startA = itemRefs.current[`${CENTER_COPY}:0`]
    const startB = itemRefs.current[`${CENTER_COPY + 1}:0`]
    if (!startA || !startB) return 0
    return startB.offsetLeft - startA.offsetLeft
  }

  // Center the active button inside the continuous mobile strip on route change
  useEffect(() => {
    const nav = mobileNavRef.current
    if (!nav || activeIndex < 0) return
    const target = itemRefs.current[`${CENTER_COPY}:${activeIndex}`]
    if (!target) return

    const targetCenter = target.offsetLeft + target.offsetWidth / 2
    const nextLeft = targetCenter - nav.clientWidth / 2
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    nav.scrollTo({
      left: nextLeft,
      behavior: firstMount.current || calm ? 'auto' : 'smooth',
    })
    firstMount.current = false
  }, [pathname, activeIndex, links.length])

  // Seamless infinite wrap when the user swipes/scrolls the mobile navbar manually
  const handleMobileScroll = () => {
    if (adjustingScroll.current) return
    const nav = mobileNavRef.current
    const setWidth = getSetWidth()
    if (!nav || setWidth <= 0) return

    const centerStart = itemRefs.current[`${CENTER_COPY}:0`]?.offsetLeft ?? setWidth * CENTER_COPY
    const minLeft = centerStart - setWidth
    const maxLeft = centerStart + setWidth

    if (nav.scrollLeft < minLeft) {
      adjustingScroll.current = true
      nav.scrollLeft += setWidth
      requestAnimationFrame(() => {
        adjustingScroll.current = false
      })
    } else if (nav.scrollLeft > maxLeft) {
      adjustingScroll.current = true
      nav.scrollLeft -= setWidth
      requestAnimationFrame(() => {
        adjustingScroll.current = false
      })
    }
  }

  // If the user taps a button in a flanking copy (left or right buffer), shift scrollLeft
  // to the matching position in the center copy first so the smooth scroll glides shortest-path.
  const handleCopyClick = (copyIdx) => {
    if (copyIdx === CENTER_COPY) return
    const nav = mobileNavRef.current
    const setWidth = getSetWidth()
    if (!nav || setWidth <= 0) return
    nav.scrollLeft += (CENTER_COPY - copyIdx) * setWidth
  }

  const linkClass = (isActive) =>
    `relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${
      isActive
        ? 'bg-aqua/15 font-bold text-white shadow-[inset_0_-2px_0_0_#66e5d3]'
        : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
    }`

  // Phone tab: icon over label, at least 44px tall for touch. Exactly three tabs span the bar
  // edge to edge (no side padding), so a looping copy of any tab can never show beside itself.
  const mobileLinkClass = (isActive) =>
    `relative flex min-h-12 w-[calc((100%-0.5rem)/3)] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-xs leading-tight transition-colors ${
      isActive
        ? 'bg-aqua/15 font-bold text-aqua shadow-[inset_0_2px_0_0_#66e5d3]'
        : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
    }`

  return (
    <>
      <header className="st-topbar on-dark sticky top-0 z-30 border-b border-white/12 bg-night/90 px-4 py-2.5 text-white backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-295 flex-wrap items-center gap-x-4 gap-y-2">
          <Link to={homeTo} className="group flex shrink-0 items-center gap-2.5 py-1">
            <Logo size={32} className="text-aqua transition-transform duration-200 group-hover:scale-105" />
            <div className="flex items-baseline gap-2">
              <span className="font-display text-xl font-bold tracking-widest text-white">HIRAYA</span>
              {badge && (
                <span className="rounded-full border border-aqua/30 bg-aqua/10 px-2 py-0.5 text-[11px] font-bold tracking-wide text-aqua uppercase">
                  {badge}
                </span>
              )}
            </div>
          </Link>

          <nav
            aria-label={navLabel}
            className="hidden gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex sm:w-auto sm:flex-1"
          >
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.search ? { pathname: link.to, search: link.search } : link.to}
                end={link.end}
                className={({ isActive }) => linkClass(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm sm:ml-0">
            {children}

            <button
              type="button"
              onClick={handleReset}
              title={resetTitle}
              className="hidden items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/80 transition-colors hover:border-aqua/40 hover:bg-white/10 hover:text-white md:inline-flex cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Reset demo
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="grid h-8.5 w-8.5 place-items-center rounded-full border border-white/15 bg-white/8 text-white/85 transition-colors hover:bg-white/15 hover:text-white cursor-pointer"
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
                </svg>
              )}
            </button>

            {userLabel && (
              <div className={`hidden items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1 pr-2.5 pl-1.5 ${userPillClass}`}>
                {userIcon && (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-aqua/20 text-aqua">
                    {userIcon}
                  </span>
                )}
                <span className="text-xs font-medium text-white/85">{userLabel}</span>
              </div>
            )}

            <Link
              to="/"
              className="rounded-lg px-2 py-1.5 font-bold text-aqua transition-colors hover:bg-aqua/10 hover:underline"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navbar: same styles & centering, looped continuously so no empty space appears */}
      <nav
        ref={mobileNavRef}
        aria-label={navLabel}
        onScroll={handleMobileScroll}
        className="on-dark fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-white/12 bg-night/90 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] text-white backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:hidden"
      >
        {Array.from({ length: COPIES }, (_, copyIdx) =>
          links.map((link, itemIdx) => {
            const isCenterCopy = copyIdx === CENTER_COPY
            const isActive = isCenterCopy && itemIdx === activeIndex
            return (
              <NavLink
                key={`${copyIdx}-${link.to}`}
                ref={(el) => {
                  itemRefs.current[`${copyIdx}:${itemIdx}`] = el
                }}
                to={link.search ? { pathname: link.to, search: link.search } : link.to}
                end={link.end}
                onClick={() => handleCopyClick(copyIdx)}
                aria-hidden={!isCenterCopy || undefined}
                tabIndex={isCenterCopy ? undefined : -1}
                aria-label={isCenterCopy && link.shortLabel ? link.label : undefined}
                className={mobileLinkClass(isActive)}
              >
                {link.icon && <span aria-hidden="true">{link.icon}</span>}
                <span>{link.shortLabel ?? link.label}</span>
              </NavLink>
            )
          }),
        )}
      </nav>
    </>
  )
}