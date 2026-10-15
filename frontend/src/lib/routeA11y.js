import { useEffect, useRef } from 'react'

export const APP_NAME = 'HIRAYA'

// Page names for the document title, by pathname.
const TITLES = {
  '/': 'Sign in',
  '/student': 'My progress',
  '/student/practice': 'Practice',
  '/student/path': 'Review path',
  '/teacher': 'Class overview',
  '/teacher/learner': 'Learner view',
  '/teacher/record': 'Record assessment',
  '/teacher/graph': 'Prerequisite graph',
}

export function titleFor(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const page = TITLES[clean]
  return page ? `${page} · ${APP_NAME}` : APP_NAME
}

// Moves keyboard and screen-reader focus to the page heading (or the main area).
export function focusMain(main) {
  if (!main) return
  const target = main.querySelector('h1') ?? main
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus()
}

// Sets the document title on every route and, after a navigation, moves focus to the new
// page so keyboard and screen-reader users are not left on the link they just activated.
// Returns a ref for the <main> element. Changes to the query string do not move focus.
export function useRouteA11y(pathname) {
  const mainRef = useRef(null)
  const first = useRef(true)

  useEffect(() => {
    document.title = titleFor(pathname)
    if (first.current) {
      first.current = false
      return
    }
    focusMain(mainRef.current)
  }, [pathname])

  return mainRef
}

// Sets the document title for a page that is not inside a shell (the sign-in screen).
export function useDocumentTitle(pathname) {
  useEffect(() => {
    document.title = titleFor(pathname)
  }, [pathname])
}
