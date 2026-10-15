import { competencies } from '../data/mock.js'
import { candidatePath, getCompetency, prerequisitesOf } from './path.js'

// Number of learner-skill pairs at or above the mastery line.
export function masteredCount(learners, theta) {
  return learners.reduce(
    (sum, l) => sum + competencies.filter((c) => l.mastery[c.id] >= theta).length,
    0,
  )
}

// ---- Teacher view (Sprint 01) ----

// CLASS-WIDE: every skill with the learners whose estimate is below the line,
// most affected first. This ignores any target; it is not a prerequisite-gap list.
export function classWideReview(learners, theta) {
  return competencies
    .map((c) => {
      const affected = learners.filter((l) => l.mastery?.[c.id] < theta)
      return { competency: c, count: affected.length, learners: affected }
    })
    .sort((a, b) => b.count - a.count)
}

// TARGET-SPECIFIC: built from candidatePath(), the same function the learner page
// uses, so counts here always match each learner's own path.
//   rows            one per learner: { learner, status, gaps, path, unknown }
//   prerequisites   each prerequisite of the target (earliest first) with the learners
//                   for whom it is a candidate gap
export function targetSummary(learners, targetId, theta) {
  const rows = learners.map((learner) => ({
    learner,
    ...candidatePath(learner.mastery, targetId, theta),
  }))
  const prerequisites = prerequisitesOf(targetId).map((id) => {
    const affected = rows.filter((r) => r.gaps.includes(id)).map((r) => r.learner)
    return { competency: getCompetency(id), count: affected.length, learners: affected }
  })
  const count = (status) => rows.filter((r) => r.status === status).length
  return {
    rows,
    prerequisites,
    needsReview: count('needs-review'),
    targetMet: count('target-met'),
    noData: count('no-data'),
    withGaps: rows.filter((r) => r.gaps.length > 0).length,
  }
}

// ---- Teacher dashboard list controls (Sprint 02) ----
// These only choose which learners are LISTED and in what order. They take the rows from
// targetSummary() and return a new array of the same row objects. They never change a
// learner's mastery, and the class totals and summaries are always computed from the full roster.

const normalize = (text) => String(text ?? '').toLowerCase().replace(/\s+/g, ' ').trim()

// Case-insensitive match on the learner's name or id. An empty search matches everyone.
export function matchesLearner(learner, query) {
  const q = normalize(query)
  if (!q) return true
  return normalize(learner?.name).includes(q) || normalize(learner?.id).includes(q)
}

// rows: targetSummary(...).rows. sort: 'roster' (original order) or 'gaps' (most candidate
// prerequisite gaps first). Learners with the same gap count keep their roster order.
// Learners whose target already meets the threshold, or who have no data, have 0 gaps.
export function visibleRows(rows, { query = '', sort = 'roster' } = {}) {
  const found = rows.filter((row) => matchesLearner(row.learner, query))
  if (sort !== 'gaps') return found
  return found
    .map((row, index) => ({ row, index }))
    .sort((a, b) => b.row.gaps.length - a.row.gaps.length || a.index - b.index)
    .map(({ row }) => row)
}
