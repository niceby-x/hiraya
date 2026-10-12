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