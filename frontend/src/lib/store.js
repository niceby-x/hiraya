import { useSyncExternalStore } from 'react'
import { learners as seed } from '../data/mock.js'
import { paramsFor } from '../data/bktParams.js'
import { updateMastery } from './bkt.js'

// In-memory learner state, seeded from sample data. It lives for the browser
// session only: a page reload (or resetLearners) restores the sample values.
// Later this module is replaced by calls to the backend (POST /api/responses).

const clone = () => seed.map((l) => ({ ...l, mastery: { ...l.mastery } }))

let state = clone()
const listeners = new Set()

const emit = () => listeners.forEach((fn) => fn())

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const getSnapshot = () => state

// Apply one answer to one learner's skill. Returns { before, after }.
export function recordResponse(learnerId, skillId, correct) {
  const learner = state.find((l) => l.id === learnerId)
  const before = learner.mastery[skillId]
  const after = updateMastery(before, correct, paramsFor(skillId))
  state = state.map((l) =>
    l.id === learnerId ? { ...l, mastery: { ...l.mastery, [skillId]: after } } : l,
  )
  emit()
  return { before, after }
}

export function resetLearners() {
  state = clone()
  emit()
}

export const useLearners = () => useSyncExternalStore(subscribe, getSnapshot)

export const useLearner = (id) => useLearners().find((l) => l.id === id)
