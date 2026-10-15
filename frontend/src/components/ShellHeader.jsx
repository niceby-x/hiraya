import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import { resetLearners } from '../lib/store.js'

function ThemeIcon({ dark }) {
  const common = { viewBox: '0 0 24 24', width: 17, height: 17, 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return dark ? (
    <svg {...common}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ) : (
    <svg {...common}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  )
}

// Below xl the tab row is pinned to the bottom of the screen instead of sitting under the logo.
// Page roots add this padding so the last content is not hidden behind it.
export const bottomNavInset = 'max-xl:pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))]'

// Header shared by the teacher and student shells: logo, role badge, navigation,
// reset button, theme toggle, signed-in label and sign-out link.
//   links:       [{ to, label, end?, search? }]
//   homeTo:      where the logo goes (string or { pathname, search })
//   extra:       optional node shown before the reset button (e.g. a mastery count)
//   userIcon:    node for the round badge in the signed-in label
//   userPillClass: breakpoint class that reveals the signed-in label (e.g. "lg:flex")
//   spreadTabs:  on phones (below sm), give each tab an equal share of the bottom bar (for short tab lists)
export default function ShellHeader({
  className = '',
  badge,
  navLabel,
  links,
  homeTo,
  extra,
  resetTitle,
  isDark,
  onToggleTheme,
  userIcon,
  userLabel,
  userPillClass,
  spreadTabs = false,
}) {
  const themeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  const { pathname } = useLocation()
  const navRef = useRef(null)
  const [edges, setEdges] = useState({ start: false, end: false })
  const [spacer, setSpacer] = useState({ start: 0, end: 0 })
  const hasCentered = useRef(false)

  // When the tabs do not all fit (phones), fade the cut-off side.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return undefined
    const update = () =>
      setEdges({
        start: nav.scrollLeft > 2,
        end: nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 2,
      })
    update()
    nav.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(nav)
    return () => {
      nav.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [pathname])

  // A scroller cannot scroll past its ends, so the first and last tabs could never reach the middle.
  // When the tabs overflow, add empty room before the first and after the last so they can centre too.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return undefined
    const measure = () => {
      const tabs = [...nav.querySelectorAll('a')]
      if (!tabs.length) return
      const style = getComputedStyle(nav)
      const gap = parseFloat(style.columnGap) || 0
      const padStart = parseFloat(style.paddingLeft) || 0
      const padEnd = parseFloat(style.paddingRight) || 0
      const widths = tabs.map((tab) => tab.offsetWidth)
      const natural = widths.reduce((sum, w) => sum + w, 0) + gap * (tabs.length - 1) + padStart + padEnd
      const room = (width, pad) => Math.max(0, Math.round((nav.clientWidth - width) / 2 - pad - gap))
      const next =
        natural > nav.clientWidth + 1
          ? { start: room(widths[0], padStart), end: room(widths[widths.length - 1], padEnd) }
          : { start: 0, end: 0 }
      setSpacer((prev) => (prev.start === next.start && prev.end === next.end ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [pathname, spacer.start, spacer.end])

  // Centre the current tab after every navigation (and once the spacers above are in place).
  useLayoutEffect(() => {
    const nav = navRef.current
    const current = nav?.querySelector('[aria-current="page"]')
    if (!nav || !current) return
    const offset = current.getBoundingClientRect().left - nav.getBoundingClientRect().left
    const left = nav.scrollLeft + offset - (nav.clientWidth - current.offsetWidth) / 2
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    nav.scrollTo({ left, behavior: hasCentered.current && !reduceMotion ? 'smooth' : 'auto' })
    hasCentered.current = true
  }, [pathname, spacer.start, spacer.end])

  const fade = `linear-gradient(to right, ${edges.start ? 'transparent, #000 28px' : '#000, #000'}, ${edges.end ? '#000 calc(100% - 28px), transparent' : '#000, #000'})`
  const navStyle = edges.start || edges.end ? { maskImage: fade, WebkitMaskImage: fade } : undefined

  return (
    <header className={`on-dark sticky top-0 z-30 border-b border-white/12 bg-night/95 px-4 py-2.5 text-white sm:px-8 ${className}`}>
      <div className="mx-auto flex max-w-295 flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-6">
        <Link to={homeTo} className="group flex shrink-0 items-center gap-2 py-1 pointer-coarse:min-h-11 sm:gap-2.5">
          <Logo size={32} className="text-aqua transition-transform duration-200 group-hover:scale-105 max-sm:h-7 max-sm:w-7" />
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold tracking-widest text-white sm:text-xl">HIRAYA</span>
            <span className="rounded-full border border-aqua/30 bg-aqua/10 px-1.5 py-0.5 text-xs sm:px-2 font-bold max-[359px]:hidden tracking-wide text-aqua uppercase">
              {badge}
            </span>
          </div>
        </Link>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-night/95 xl:contents">
        <nav
          ref={navRef}
          style={navStyle}
          aria-label={navLabel}
          className="flex gap-1.5 overflow-x-auto px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-8 xl:w-auto xl:flex-1 xl:p-0"
        >
          {spacer.start > 0 && <span aria-hidden="true" className="shrink-0" style={{ width: spacer.start }} />}
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={{ pathname: link.to, search: link.search ?? '' }}
              end={link.end}
              className={({ isActive }) =>
                `relative whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition-colors pointer-coarse:py-3 ${
                  spreadTabs ? 'max-sm:flex-1 max-sm:text-center' : ''
                } ${
                  isActive
                    ? 'bg-aqua/15 font-bold text-white shadow-[inset_0_-2px_0_0_#66e5d3]'
                    : 'font-medium text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {spacer.end > 0 && <span aria-hidden="true" className="shrink-0" style={{ width: spacer.end }} />}
        </nav>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 text-sm sm:gap-2.5">
          {extra}
          <button
            type="button"
            onClick={resetLearners}
            title={resetTitle}
            className="hidden cursor-pointer items-center gap-1.5 pointer-coarse:min-h-11 pointer-coarse:px-3.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-white/80 transition-colors hover:border-aqua/40 hover:bg-white/10 hover:text-white md:inline-flex"
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
            aria-label={themeLabel}
            title={themeLabel}
            className="grid h-8.5 w-8.5 cursor-pointer place-items-center rounded-full pointer-coarse:h-11 pointer-coarse:w-11 border border-white/15 bg-white/8 text-white/85 transition-colors hover:bg-white/15 hover:text-white"
          >
            <ThemeIcon dark={isDark} />
          </button>

          <div className={`hidden items-center gap-2 rounded-full border border-white/12 bg-white/5 py-1 pr-3 pl-1.5 ${userPillClass}`}>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-aqua/20 text-aqua">{userIcon}</span>
            <span className="text-xs font-medium text-white/85">{userLabel}</span>
          </div>

          <Link
            to="/"
            className="rounded-lg px-2 py-1.5 font-bold text-aqua sm:px-2.5 transition-colors hover:bg-aqua/10 hover:underline pointer-coarse:py-3"
          >
            Sign out
          </Link>
        </div>
      </div>
    </header>
  )
}
