import { competencies } from '../data/mock.js'
import { candidatePath, getCompetency, prerequisitesOf } from './path.js'

// Skills ranked by how many learners are below the mastery line (most first).
// Ties keep the original skill order.
export function topGaps(learners, theta, limit = 5) {
  return competencies
    .map((c) => ({
      competency: c,
      count: learners.filter((l) => l.mastery[c.id] < theta).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

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
