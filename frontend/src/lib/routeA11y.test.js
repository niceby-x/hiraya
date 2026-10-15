import assert from 'node:assert/strict'
import test from 'node:test'
import { titleFor } from './routeA11y.js'

test('every route gets its own document title', () => {
  assert.equal(titleFor('/'), 'Sign in · HIRAYA')
  assert.equal(titleFor('/student'), 'My progress · HIRAYA')
  assert.equal(titleFor('/student/practice'), 'Practice · HIRAYA')
  assert.equal(titleFor('/teacher/record'), 'Record assessment · HIRAYA')
  assert.equal(titleFor('/teacher/graph'), 'Prerequisite graph · HIRAYA')
})

test('a trailing slash does not change the title, and unknown paths fall back to the app name', () => {
  assert.equal(titleFor('/teacher/learner/'), 'Learner view · HIRAYA')
  assert.equal(titleFor('/nope'), 'HIRAYA')
})
