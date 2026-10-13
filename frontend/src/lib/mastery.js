import { THRESHOLD } from '../data/mock.js'

// Below this, a skill is 'low'. Between this and the mastery line it is 'gap'.
export const LOW_LINE = 0.6

// 'mastered' at or above the mastery line, 'low' below LOW_LINE, otherwise 'gap'
export function bandFor(p, theta = THRESHOLD) {
  if (p >= theta) return 'mastered'
  if (p >= LOW_LINE) return 'gap'
  return 'low'
}

export const percent = (p) => Math.round(p * 100)

// ---- Teacher view (Sprint 01): two states, based only on the selected threshold ----

// 'meets' at or above theta, 'below' under it, 'none' when there is no estimate.
export function statusFor(p, theta = THRESHOLD) {
  if (typeof p !== 'number' || !Number.isFinite(p)) return 'none'
  return p >= theta ? 'meets' : 'below'
}

// Whole-number percentage, as `percent`, except when rounding would make the number
// agree with the wrong side of the threshold (0.949 against 95% is shown as 94.9%).
export function formatPercent(p, theta = THRESHOLD) {
  if (typeof p !== 'number' || !Number.isFinite(p)) return '—'
  const rounded = Math.round(p * 100)
  if (p < theta && rounded >= Math.round(theta * 100)) {
    return `${Math.floor(p * 1000 + 1e-9) / 10}%`
  }
  return `${rounded}%`
}
