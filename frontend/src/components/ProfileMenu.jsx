import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

// Phone-only profile menu for the top bar. It holds the things that do not fit beside the
// logo on a small screen: who is signed in, the light/dark switch and the demo reset.
// Behaves as a standard menu button: Escape or an outside tap closes it, arrow keys move
// between items, and focus returns to the button.
export default function ProfileMenu({ userLabel, isDark, onToggleTheme, onReset, resetTitle }) {
  // The menu remembers the route it was opened on, so it closes by itself on navigation.
  const [openAt, setOpenAt] = useState(null)
  const wrapRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()
  const { pathname } = useLocation()
  const open = openAt === pathname
  const setOpen = (value) => setOpenAt(value ? pathname : null)

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
    <div ref={wrapRef} className="relative sm:hidden" onKeyDown={onKeyDown}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Profile and settings"
        onClick={() => setOpen(!open)}
        className={`grid h-11 w-11 cursor-pointer place-items-center rounded-full border transition-colors ${
          open ? 'border-aqua/50 bg-aqua/15 text-aqua' : 'border-white/15 bg-white/8 text-white/85 hover:bg-white/15 hover:text-white'
        }`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Profile and settings"
          className="absolute top-full right-0 z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-white/15 bg-night p-1.5 text-white shadow-2xl shadow-black/40"
        >
          {userLabel && (
            <div className="flex items-center gap-2.5 px-2.5 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-aqua/20 text-aqua">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              </span>
              <span className="text-sm leading-snug font-bold text-white/90">{userLabel}</span>
            </div>
          )}
          <div className="mx-1 my-1 h-px bg-white/12" role="separator" />

          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={isDark}
            onClick={onToggleTheme}
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-white/75">
              <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
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
            title={resetTitle}
            onClick={() => {
              onReset()
              close(false)
            }}
            className="flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-white/75">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>Reset demo data</span>
          </button>
        </div>
      )}
    </div>
  )
}
