import { useSyncExternalStore } from 'react'
import { learners as seed, THRESHOLD } from '../data/mock.js'
import { paramsFor } from '../data/bktParams.js'
import { updateMastery } from './bkt.js'
import { TARGET_ID } from './path.js'

const clone = () => seed.map((l) => ({ ...l, mastery: { ...l.mastery } }))
const defaultSettings = () => ({ learnerId: 'l01', targetId: TARGET_ID, theta: THRESHOLD })

let state = clone()
let settings = defaultSettings()
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

const getSnapshot = () => state
const getSettingsSnapshot = () => settings

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

export function updateSettings(patch) {
  const next = { ...settings, ...patch }
  if (
    next.learnerId === settings.learnerId &&
    next.targetId === settings.targetId &&
    next.theta === settings.theta
  ) {
    return
  }
  settings = next
  emit()
}

export function resetLearners() {
  state = clone()
  settings = defaultSettings()
  emit()
}

export const useLearners = () => useSyncExternalStore(subscribe, getSnapshot)
export const useLearner = (id) => {
  const list = useLearners()
  return list.find((l) => l.id === id) ?? list[0]
}
export const useSettings = () => useSyncExternalStore(subscribe, getSettingsSnapshot)