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

// Puts skills back to the values they had before a recorded change (undo).
// `changes` is { [learnerId]: { before, after } }. A learner is only restored while their
// estimate is still the value that change produced, so an undo can never overwrite
// something recorded afterwards. Returns which learners were restored and which skipped.
export function undoMasteryChange(skillId, changes) {
  const restored = []
  const skipped = []
  state = state.map((learner) => {
    const change = changes[learner.id]
    if (!change) return learner
    if (learner.mastery[skillId] !== change.after) {
      skipped.push(learner.id)
      return learner
    }
    restored.push(learner.id)
    return { ...learner, mastery: { ...learner.mastery, [skillId]: change.before } }
  })
  if (restored.length > 0) emit()
  return { restored, skipped }
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

export function recordPaperAssessment(skillId, responsesByLearner) {
  const params = paramsFor(skillId)
  const changes = {}

  state = state.map((learner) => {
    const answers = responsesByLearner[learner.id]
    if (! Array.isArray(answers) || answers.length === 0) return learner

    const before = learner.mastery[skillId]
    let after = before
    for (const correct of answers) {
      if (typeof correct === 'boolean') {
        after = updateMastery(after, correct, params)
      }
    }

    if (after === before) return learner
    changes[learner.id] = { before, after, count: answers.length }
    return { ...learner, mastery: { ...learner.mastery, [skillId]: after } }
  })

  if (Object.keys(changes).length > 0) {
    emit()
  }
  return changes
}