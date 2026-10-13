import test from 'node:test'
import assert from 'node:assert/strict'
import { learners } from '../data/mock.js'
import { candidatePath } from './path.js'
import { classWideReview, targetSummary } from './classStats.js'

test('class-wide review counts every skill below the line, whatever the target', () => {
  const counts = Object.fromEntries(classWideReview(learners, 0.95).map((r) => [r.competency.id, r.count]))
  assert.deepEqual(counts, { c1: 3, c2: 4, c3: 5, c4: 3, c5: 7, c6: 8, c7: 8 })
  const c6 = classWideReview(learners, 0.95).find((r) => r.competency.id === 'c6')
  assert.equal(c6.learners.length, c6.count)
})

test('target summary counts equal the per-learner candidate gaps (both thresholds, several targets)', () => {
  for (const theta of [0.95, 0.98]) {
    for (const target of ['c7', 'c5', 'c4', 'c3', 'c1']) {
      const s = targetSummary(learners, target, theta)
      for (const row of s.rows) {
        assert.deepEqual(row.gaps, candidatePath(row.learner.mastery, target, theta).gaps)
      }
      for (const p of s.prerequisites) {
        const expected = learners.filter((l) => candidatePath(l.mastery, target, theta).gaps.includes(p.competency.id))
        assert.equal(p.count, expected.length)
      }
      const total = s.prerequisites.reduce((n, p) => n + p.count, 0)
      assert.equal(total, s.rows.reduce((n, r) => n + r.gaps.length, 0))
    }
  }
})

test('target summary differs from the class-wide list: only prerequisites of the target appear', () => {
  const s = targetSummary(learners, 'c4', 0.95)
  assert.deepEqual(s.prerequisites.map((p) => p.competency.id), ['c1'])
  assert.equal(s.prerequisites[0].count, 3)
  assert.equal(s.withGaps, 3)
  assert.equal(s.needsReview + s.targetMet + s.noData, learners.length)
})

test('learners whose target meets the line are not counted as needing review', () => {
  const s = targetSummary(learners, 'c1', 0.95)
  assert.equal(s.needsReview, 3)
  assert.equal(s.targetMet, 5)
  assert.equal(s.prerequisites.length, 0)
})

test('empty roster and learners with no data do not break the summaries', () => {
  assert.equal(targetSummary([], 'c7', 0.95).rows.length, 0)
  const s = targetSummary([{ id: 'x', name: 'X', mastery: {} }], 'c7', 0.95)
  assert.equal(s.noData, 1)
  assert.equal(classWideReview([{ id: 'x', name: 'X', mastery: {} }], 0.95).every((r) => r.count === 0), true)
})
