import { THRESHOLD } from '../data/mock.js'
import { hasCompetency, TARGET_ID } from './path.js'

// The teacher's view settings live in the URL query string so they survive
// navigation: ?target=c7&theta=0.95&learner=l01
// Pure functions (no React) so they can be tested on their own.

export const THRESHOLD_OPTIONS = [THRESHOLD, 0.98]
export const DEFAULT_TARGET_ID = TARGET_ID
export const DEFAULT_THETA = THRESHOLD

// Accepts "0.95" or "95" (and "0.98" / "98"). Anything else is not a valid threshold.
export function parseTheta(raw) {
  if (raw === null || raw === undefined || String(raw).trim() === '') return null
  let n = Number(raw)
  if (!Number.isFinite(n)) return null
  if (n > 1) n /= 100
  return THRESHOLD_OPTIONS.find((o) => Math.abs(o - n) < 1e-9) ?? null
}

// Reads { target, theta, learnerId } from URLSearchParams (anything with .get).
// Missing values fall back to the defaults silently. Present-but-invalid values
// also fall back, and are flagged in `invalid` so the page can say so.
// `learnerId` is null when no learner was given; an unknown learner id is flagged
// and also returns null.
export function readContext(params, learnerIds = []) {
  const get = (key) => params?.get?.(key) ?? null
  const rawTarget = get('target')
  const rawTheta = get('theta')
  const rawLearner = get('learner')

  const targetOk = rawTarget !== null && hasCompetency(rawTarget)
  const theta = parseTheta(rawTheta)
  const learnerOk = rawLearner !== null && learnerIds.includes(rawLearner)

  return {
    target: targetOk ? rawTarget : DEFAULT_TARGET_ID,
    theta: theta ?? DEFAULT_THETA,
    learnerId: learnerOk ? rawLearner : null,
    invalid: {
      target: rawTarget !== null && !targetOk,
      theta: rawTheta !== null && theta === null,
      learner: rawLearner !== null && !learnerOk,
    },
  }
}

// Builds the query string (without the leading "?") for a teacher link.
export function contextQuery({ target, theta, learnerId }) {
  const q = new URLSearchParams()
  if (learnerId) q.set('learner', learnerId)
  q.set('target', target)
  q.set('theta', String(theta))
  return q.toString()
}

export const learnerLink = ({ learnerId, target, theta }) =>
  `/teacher/learner?${contextQuery({ learnerId, target, theta })}`

export const overviewLink = ({ target, theta }) => `/teacher?${contextQuery({ target, theta })}`
