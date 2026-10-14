// Run from the frontend folder: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { learners } from '../data/mock.js'
import {
  candidatePath,
  dependencyOrder,
  displayOrder,
  hasCompetency,
  masteredPrerequisites,
  prerequisitesOf,
  remediationPath,
  skippedPrerequisites,
} from './path.js'

const byLearner = Object.fromEntries(learners.map((l) => [l.id, l.mastery]))
// All skills mastered, then override what a test needs.
const mastery = (overrides = {}) => ({ c1: 1, c2: 1, c3: 1, c4: 1, c5: 1, c6: 1, c7: 1, ...overrides })

test('traversal collects direct and indirect prerequisites, each after the skills it needs', () => {
  assert.deepEqual(dependencyOrder('c7'), ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])
  assert.deepEqual(dependencyOrder('c4'), ['c1', 'c4'])
  assert.deepEqual(prerequisitesOf('c5'), ['c1', 'c2', 'c3', 'c4'])
  assert.deepEqual(prerequisitesOf('c1'), [])
})

test('a skill that is not behind the target is never a candidate gap', () => {
  // c5 and c6 are far below the line, but they are not prerequisites of c4.
  const r = candidatePath(mastery({ c4: 0.5, c5: 0.1, c6: 0.1 }), 'c4', 0.95)
  assert.equal(r.status, 'needs-review')
  assert.deepEqual(r.gaps, [])
  assert.deepEqual(r.path, ['c4'])
})

test('needs review: gaps in dependency order, target last, mastered prerequisites left out', () => {
  // Learner 06 at 0.95: c3 is the only prerequisite gap before c5 and c6.
  const r = candidatePath(byLearner.l06, 'c7', 0.95)
  assert.equal(r.status, 'needs-review')
  assert.deepEqual(r.gaps, ['c3', 'c5', 'c6'])
  assert.deepEqual(r.path, ['c3', 'c5', 'c6', 'c7'])
})

test('every gap comes after the prerequisites it depends on (all sample learners, both thresholds)', () => {
  const full = dependencyOrder('c7')
  for (const theta of [0.95, 0.98]) {
    for (const l of learners) {
      const { path, status } = candidatePath(l.mastery, 'c7', theta)
      if (status !== 'needs-review') continue
      assert.equal(path.at(-1), 'c7')
      const positions = path.map((id) => full.indexOf(id))
      assert.deepEqual(positions, [...positions].sort((a, b) => a - b))
    }
  }
})

test('no candidate gaps but target below the line: the path is the target alone', () => {
  const r = candidatePath(mastery({ c7: 0.5 }), 'c7', 0.95)
  assert.equal(r.status, 'needs-review')
  assert.deepEqual(r.gaps, [])
  assert.deepEqual(r.path, ['c7'])
})

test('target at or above the line: empty path, even if a prerequisite is below the line', () => {
  const r = candidatePath(mastery({ c3: 0.5, c7: 0.99 }), 'c7', 0.95)
  assert.equal(r.status, 'target-met')
  assert.deepEqual(r.path, [])
  assert.deepEqual(r.gaps, [])
})

test('a mastery estimate exactly equal to the threshold meets it', () => {
  assert.equal(candidatePath(mastery({ c7: 0.95 }), 'c7', 0.95).status, 'target-met')
  assert.equal(candidatePath(mastery({ c3: 0.95, c7: 0.5 }), 'c7', 0.95).gaps.includes('c3'), false)
})

test('0.95 and 0.98 classify the same estimates differently, without changing them', () => {
  const m = mastery({ c3: 0.96, c7: 0.5 })
  const before = { ...m }
  assert.deepEqual(candidatePath(m, 'c7', 0.95).gaps, [])
  assert.deepEqual(candidatePath(m, 'c7', 0.98).gaps, ['c3'])
  assert.deepEqual(m, before)
})

test('0.98 on the sample data (Learner 04): c2, c3 and c5 become gaps', () => {
  assert.deepEqual(candidatePath(byLearner.l04, 'c7', 0.95).path, ['c5', 'c6', 'c7'])
  assert.deepEqual(candidatePath(byLearner.l04, 'c7', 0.98).path, ['c2', 'c3', 'c5', 'c6', 'c7'])
})

test('invalid target id gives a status instead of throwing', () => {
  for (const bad of ['c99', '', undefined, null, '__proto__', 'constructor']) {
    assert.equal(candidatePath(mastery(), bad, 0.95).status, 'invalid-target')
  }
  assert.equal(hasCompetency('toString'), false)
})

test('missing data: no estimate for the target is "no-data"; missing prerequisites are reported, not counted as mastered or as gaps', () => {
  assert.equal(candidatePath({}, 'c7', 0.95).status, 'no-data')
  assert.equal(candidatePath(undefined, 'c7', 0.95).status, 'no-data')
  const r = candidatePath({ c7: 0.4, c6: 0.5 }, 'c7', 0.95)
  assert.equal(r.status, 'needs-review')
  assert.deepEqual(r.gaps, ['c6'])
  assert.deepEqual(r.unknown, ['c1', 'c2', 'c3', 'c4', 'c5'])
})

test('student remediationPath keeps its results for the sample learner and the all-mastered case', () => {
  assert.deepEqual(remediationPath(byLearner.l01, 'c7', 0.95), ['c2', 'c3', 'c5', 'c6', 'c7'])
  assert.deepEqual(remediationPath(mastery(), 'c7', 0.95), [])
})

test('target met but a prerequisite below the line: student and teacher both give no path', () => {
  const m = mastery({ c3: 0.5, c7: 0.99 })
  assert.deepEqual(remediationPath(m, 'c7', 0.95), [])
  assert.deepEqual(candidatePath(m, 'c7', 0.95).path, [])
  // Same estimates at 0.98: the target (0.99) still meets the line, so still no path.
  assert.deepEqual(remediationPath(m, 'c7', 0.98), [])
})

test('student and teacher paths are identical for every learner, target and threshold', () => {
  for (const theta of [0.95, 0.98]) {
    for (const target of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) {
      for (const l of learners) {
        assert.deepEqual(remediationPath(l.mastery, target, theta), candidatePath(l.mastery, target, theta).path)
      }
    }
  }
})

test('student path is also identical on synthetic estimates where the target meets the line but prerequisites do not', () => {
  const cases = [mastery({ c3: 0.5, c7: 0.99 }), mastery({ c1: 0.2, c2: 0.3, c5: 0.4, c6: 0.99 }), mastery({ c7: 0.5 })]
  for (const m of cases) {
    for (const target of ['c3', 'c5', 'c6', 'c7']) {
      assert.deepEqual(remediationPath(m, target, 0.95), candidatePath(m, target, 0.95).path)
    }
  }
})

test('grid column order: the target chain first, then the other skills in list order', () => {
  assert.deepEqual(displayOrder('c7'), ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])
  assert.deepEqual(displayOrder('c4'), ['c1', 'c4', 'c2', 'c3', 'c5', 'c6', 'c7'])
  assert.deepEqual(displayOrder('c3'), ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])
  assert.deepEqual(displayOrder('c1'), ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])
  // every target: each skill appears exactly once, and the chain keeps dependency order
  for (const t of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) {
    const order = displayOrder(t)
    assert.deepEqual([...order].sort(), ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])
    assert.deepEqual(order.slice(0, dependencyOrder(t).length), dependencyOrder(t))
  }
  assert.deepEqual(displayOrder('nope'), ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])
})

test('regression: target met (c7 0.99) but c3 below (0.50) at 0.95: path is empty and c3 is not labelled mastered', () => {
  const m = mastery({ c7: 0.99, c3: 0.5 })
  assert.deepEqual(remediationPath(m, 'c7', 0.95), [])
  assert.equal(candidatePath(m, 'c7', 0.95).status, 'target-met')
  const mastered = masteredPrerequisites(m, 'c7', 0.95)
  assert.ok(!mastered.includes('c3'), 'c3 must not appear under "Already mastered, so skipped"')
  // The prerequisites that really are at or above the line are still listed, in dependency order.
  assert.deepEqual(mastered, prerequisitesOf('c7').filter((id) => id !== 'c3'))
})

test('mastered prerequisites: at the line counts, below it or without a valid estimate does not', () => {
  const m = mastery({ c1: 0.95, c2: 0.949, c3: undefined, c4: NaN, c5: '0.99', c6: null })
  assert.deepEqual(masteredPrerequisites(m, 'c7', 0.95), ['c1'])
  assert.deepEqual(masteredPrerequisites(undefined, 'c7', 0.95), [])
  assert.deepEqual(masteredPrerequisites(m, 'nope', 0.95), [])
})

test('when a path is generated, gaps, mastered and unknown prerequisites split the prerequisites exactly', () => {
  for (const theta of [0.95, 0.98]) {
    for (const target of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) {
      for (const l of learners) {
        const r = candidatePath(l.mastery, target, theta)
        if (r.status !== 'needs-review') continue
        const mastered = masteredPrerequisites(l.mastery, target, theta)
        assert.deepEqual([...r.gaps, ...mastered, ...r.unknown].sort(), [...prerequisitesOf(target)].sort())
        assert.ok(r.gaps.every((id) => !mastered.includes(id)))
      }
    }
  }
})

test('missing or invalid target estimate is never reported as target-met', () => {
  for (const bad of [undefined, null, NaN, '0.99']) {
    const r = candidatePath(mastery({ c7: bad }), 'c7', 0.95)
    assert.equal(r.status, 'no-data')
    assert.deepEqual(r.path, [])
  }
  assert.notEqual(candidatePath({}, 'c7', 0.95).status, 'target-met')
})

// "Already mastered, so skipped" is shown only when a remediation path exists AND there is something to list.
test('skipped list: normal path with mastered prerequisites lists exactly those, in dependency order', () => {
  // Learner 01 at 0.95: path is c2, c3, c5, c6, c7; c1 (0.97) and c4 (0.96) are mastered and left out.
  assert.deepEqual(remediationPath(byLearner.l01, 'c7', 0.95), ['c2', 'c3', 'c5', 'c6', 'c7'])
  assert.deepEqual(skippedPrerequisites(byLearner.l01, 'c7', 0.95), ['c1', 'c4'])
})

test('skipped list: target already meets the threshold -> no path, nothing listed (even if a prerequisite is low)', () => {
  const m = mastery({ c7: 0.99, c3: 0.5 })
  assert.deepEqual(remediationPath(m, 'c7', 0.95), [])
  assert.deepEqual(skippedPrerequisites(m, 'c7', 0.95), [])
  assert.deepEqual(skippedPrerequisites(mastery(), 'c7', 0.95), []) // everything mastered: still nothing to "skip"
})

test('skipped list: missing target estimate -> no path, nothing listed, even though other prerequisites are mastered', () => {
  for (const bad of [undefined, null, NaN]) {
    const m = mastery({ c7: bad })
    assert.equal(candidatePath(m, 'c7', 0.95).status, 'no-data')
    assert.deepEqual(remediationPath(m, 'c7', 0.95), [])
    assert.deepEqual(skippedPrerequisites(m, 'c7', 0.95), [])
  }
  assert.deepEqual(skippedPrerequisites(undefined, 'c7', 0.95), [])
})

test('skipped list: normal path where no prerequisite is mastered -> empty, so no empty section is shown', () => {
  // Learner 03 at 0.95: all six prerequisites are below the line.
  const r = candidatePath(byLearner.l03, 'c7', 0.95)
  assert.equal(r.status, 'needs-review')
  assert.deepEqual(r.path, ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'])
  assert.deepEqual(skippedPrerequisites(byLearner.l03, 'c7', 0.95), [])
})

test('skipped list never contains a path step, and is non-empty only when a path exists', () => {
  for (const theta of [0.95, 0.98]) {
    for (const target of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7']) {
      for (const l of learners) {
        const path = remediationPath(l.mastery, target, theta)
        const skipped = skippedPrerequisites(l.mastery, target, theta)
        assert.ok(skipped.every((id) => !path.includes(id)))
        if (path.length === 0) assert.deepEqual(skipped, [])
      }
    }
  }
})
