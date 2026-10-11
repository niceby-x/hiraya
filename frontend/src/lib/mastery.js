import { THRESHOLD } from '../data/mock.js'

// 'mastered' at or above the mastery line, 'low' below 60%, otherwise 'gap'
export function bandFor(p, theta = THRESHOLD) {
  if (p >= theta) return 'mastered'
  if (p >= 0.6) return 'gap'
  return 'low'
}

export const percent = (p) => Math.round(p * 100)