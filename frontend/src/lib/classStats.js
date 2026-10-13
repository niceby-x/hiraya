import { competencies } from '../data/mock.js'

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