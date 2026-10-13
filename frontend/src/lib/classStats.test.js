import test from 'node:test'
import assert from 'node:assert/strict'
import { learners } from '../data/mock.js'
import { candidatePath } from './path.js'
import { classWideReview, matchesLearner, targetSummary, visibleRows } from './classStats.js'

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

const deepFreeze = (o) => {
  Object.values(o).forEach((v) => typeof v === 'object' && v !== null && deepFreeze(v))
  return Object.freeze(o)
}

test('search matches name or id, ignores case and extra spaces, and an empty search matches everyone', () => {
  const [l03] = learners.filter((l) => l.id === 'l03')
  for (const q of ['learner 03', 'LEARNER   03', '  l03 ', 'L03', '03', 'earner 0']) assert.equal(matchesLearner(l03, q), true, q)
  for (const q of ['l04', 'learner 3x', 'zzz']) assert.equal(matchesLearner(l03, q), false, q)
  assert.equal(matchesLearner(l03, ''), true)
  assert.equal(matchesLearner(l03, undefined), true)
  assert.equal(matchesLearner({ id: 'x' }, 'x'), true) // missing name does not throw
})

test('searching lists a subset of the same rows and never changes them', () => {
  const rows = targetSummary(learners, 'c7', 0.95).rows
  const found = visibleRows(rows, { query: 'learner 0' })
  assert.equal(found.length, 8)
  const one = visibleRows(rows, { query: 'l05' })
  assert.deepEqual(one.map((r) => r.learner.id), ['l05'])
  assert.equal(one[0], rows[4]) // the very same row object, not a recomputed copy
  assert.deepEqual(visibleRows(rows, { query: 'nobody' }), [])
  assert.equal(visibleRows(rows).length, rows.length)
})

test('sorting by gaps: most first, ties keep roster order, same learners, counts match candidatePath', () => {
  for (const theta of [0.95, 0.98]) {
    for (const target of ['c7', 'c6', 'c5', 'c4', 'c3', 'c1']) {
      const rows = targetSummary(learners, target, theta).rows
      const sorted = visibleRows(rows, { sort: 'gaps' })
      assert.deepEqual([...sorted.map((r) => r.learner.id)].sort(), learners.map((l) => l.id).sort())
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1]
        const cur = sorted[i]
        assert.ok(prev.gaps.length >= cur.gaps.length)
        if (prev.gaps.length === cur.gaps.length) {
          assert.ok(rows.indexOf(prev) < rows.indexOf(cur), 'ties keep roster order')
        }
      }
      for (const r of sorted) assert.equal(r.gaps.length, candidatePath(r.learner.mastery, target, theta).gaps.length)
    }
  }
})

test('sample class, target c7 at 95%: sorted order by gap count (counts checked by hand against the sample table)', () => {
  const at95 = visibleRows(targetSummary(learners, 'c7', 0.95).rows, { sort: 'gaps' })
  assert.deepEqual(at95.map((r) => [r.learner.id, r.gaps.length]), [
    ['l03', 6], ['l05', 6], ['l07', 6], ['l01', 4], ['l06', 3], ['l02', 2], ['l04', 2], ['l08', 1],
  ])
})

test('search then sort works together, and the class summaries do not depend on either', () => {
  const summary = targetSummary(learners, 'c7', 0.95)
  const before = JSON.stringify({ ...summary, rows: undefined })
  const listed = visibleRows(summary.rows, { query: 'learner 0', sort: 'gaps' })
  assert.ok(listed.length > 0)
  const narrowed = visibleRows(summary.rows, { query: 'l01', sort: 'gaps' })
  assert.equal(narrowed.length, 1)
  // Totals still describe the whole class, whatever is listed.
  assert.equal(JSON.stringify({ ...targetSummary(learners, 'c7', 0.95), rows: undefined }), before)
  assert.equal(summary.needsReview + summary.targetMet + summary.noData, learners.length)
  assert.equal(
    classWideReview(learners, 0.95).find((r) => r.competency.id === 'c6').count,
    8,
  )
})

test('searching and sorting do not mutate learners, mastery or rows (frozen inputs)', () => {
  const frozen = deepFreeze(JSON.parse(JSON.stringify(learners)))
  const rows = deepFreeze(targetSummary(frozen, 'c7', 0.95).rows.map((r) => ({ ...r, gaps: [...r.gaps], path: [...r.path], unknown: [...r.unknown] })))
  const snapshot = JSON.stringify(rows)
  visibleRows(rows, { query: 'l0', sort: 'gaps' })
  visibleRows(rows, { sort: 'roster' })
  assert.equal(JSON.stringify(rows), snapshot)
  assert.deepEqual(frozen, learners)
})
