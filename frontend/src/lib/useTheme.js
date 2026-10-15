import { useState } from 'react'

const THEME_KEY = 'hiraya-theme'

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// Light/dark theme shared by both app shells, remembered in localStorage when it is allowed.
export function useTheme() {
  const [theme, setTheme] = useState(readTheme)

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Storage can be blocked.
    }
  }

  return { theme, isDark: theme === 'dark', toggleTheme }
}
