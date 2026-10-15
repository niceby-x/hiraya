// Run from the frontend folder: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { recordPaperAssessment, recordResponse, resetLearners, undoMasteryChange } from './store.js'
import { learners as seed } from '../data/mock.js'

// The store keeps module-level state, so read it back through a fresh record call's `before` value.
const read = (id, skill) => {
  const { before, after } = recordResponse(id, skill, true)
  // put it back so reading does not change anything
  undoMasteryChange(skill, { [id]: { before, after } })
  return before
}

test('undo restores the estimates that a paper assessment changed', () => {
  resetLearners()
  const skill = 'c2'
  const before = seed.map((l) => l.mastery[skill])
  const changes = recordPaperAssessment(skill, { l01: [true, false], l02: [false, false, false] })
  assert.deepEqual(Object.keys(changes).sort(), ['l01', 'l02'])
  assert.notEqual(read('l01', skill), before[0])

  const result = undoMasteryChange(skill, changes)
  assert.deepEqual(result.restored.sort(), ['l01', 'l02'])
  assert.deepEqual(result.skipped, [])
  assert.equal(read('l01', skill), before[0])
  assert.equal(read('l02', skill), before[1])
})

test('undo skips a learner whose estimate changed again after the recording', () => {
  resetLearners()
  const skill = 'c3'
  const changes = recordPaperAssessment(skill, { l01: [true, true] })
  const later = recordResponse('l01', skill, false) // for example, a student practising
  const result = undoMasteryChange(skill, changes)
  assert.deepEqual(result.restored, [])
  assert.deepEqual(result.skipped, ['l01'])
  assert.equal(read('l01', skill), later.after)
})

test('undo of a single demo answer puts the previous estimate back', () => {
  resetLearners()
  const change = recordResponse('l03', 'c4', false)
  assert.ok(change.after < change.before)
  undoMasteryChange('c4', { l03: change })
  assert.equal(read('l03', 'c4'), change.before)
})
