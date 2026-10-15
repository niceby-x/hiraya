import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const fallbackIcon = (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
)

const itemClass =
  'flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10 focus-visible:bg-white/10'

// Avatar disc: the role icon (sprout for students, chart for teachers) on solid aqua.
function Avatar({ icon, size }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-aqua text-night ring-2 ring-aqua/25 [&>svg]:h-[55%] [&>svg]:w-[55%] ${size}`}
    >
      {icon ?? fallbackIcon}
    </span>
  )
}

// Profile menu for the top bar: who is signed in, the light/dark switch, the demo reset and
// sign out. Behaves as a standard menu button: Escape or an outside tap closes it, arrow keys
// move between items, and focus returns to the button.
export default function ProfileMenu({ userLabel, userIcon, isDark, onToggleTheme, onReset, resetTitle }) {
  // The menu remembers the route it was opened on, so it closes by itself on navigation.
  const [openAt, setOpenAt] = useState(null)
  const wrapRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()
  const { pathname } = useLocation()
  const open = openAt === pathname
  const setOpen = (value) => setOpenAt(value ? pathname : null)

  const [name = '', ...rest] = (userLabel ?? '').split(' · ')
  const detail = rest.join(' · ')

  const items = () => [...(menuRef.current?.querySelectorAll('[role^="menuitem"]') ?? [])]

  useEffect(() => {
    if (!open) return undefined
    items()[0]?.focus()
    const onPointer = (e) => {
      if (!wrapRef.current?.contains(e.target)) setOpenAt(null)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  const close = (restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) buttonRef.current?.focus()
  }

  const onKeyDown = (e) => {
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const list = items()
      const i = list.indexOf(document.activeElement)
      const next = e.key === 'ArrowDown' ? (i + 1) % list.length : (i - 1 + list.length) % list.length
      list[next]?.focus()
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={name ? `Profile and settings for ${name}` : 'Profile and settings'}
        onClick={() => setOpen(!open)}
        className={`flex h-11 cursor-pointer items-center gap-2 rounded-full border p-1 transition-colors sm:pr-2.5 lg:pr-3.5 ${
          open ? 'border-aqua/50 bg-aqua/15' : 'border-white/15 bg-white/8 hover:border-white/25 hover:bg-white/15'
        }`}
      >
        <Avatar icon={userIcon} size="h-9 w-9" />
        {name && <span className="hidden max-w-36 truncate text-sm font-bold text-white lg:block">{name}</span>}
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`hidden text-white/65 transition-transform sm:block ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Profile and settings"
          className="menu-pop absolute top-full right-0 z-50 mt-2.5 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/15 bg-night p-1.5 text-white shadow-2xl shadow-black/50"
        >
          {userLabel && (
            <div className="mb-1.5 flex items-center gap-3 rounded-xl bg-white/6 px-3 py-2.5">
              <Avatar icon={userIcon} size="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm leading-tight font-bold text-white">{name}</p>
                {detail && <p className="mt-0.5 text-xs leading-snug text-white/60">{detail}</p>}
              </div>
            </div>
          )}

          <button type="button" role="menuitemcheckbox" aria-checked={isDark} onClick={onToggleTheme} className={itemClass}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-white/75">
              {isDark ? (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </>
              ) : (
                <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
              )}
            </svg>
            <span className="flex-1">Dark mode</span>
            <span
              aria-hidden="true"
              className={`relative h-6 w-10.5 shrink-0 rounded-full transition-colors ${isDark ? 'bg-aqua' : 'bg-white/25'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isDark ? 'left-5' : 'left-0.5'}`} />
            </span>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onReset()
              close(false)
            }}
            className={itemClass}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-white/75">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="min-w-0">
              <span className="block">Reset demo data</span>
              {resetTitle && <span className="block text-xs leading-snug font-normal text-white/55">{resetTitle}</span>}
            </span>
          </button>

          <div className="mx-1 my-1.5 h-px bg-white/12" role="separator" />

          <Link
            to="/"
            role="menuitem"
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-bold text-rose-300 transition-colors hover:bg-rose-400/10 focus-visible:bg-rose-400/10"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            <span>Sign out</span>
          </Link>
        </div>
      )}
    </div>
  )
}
