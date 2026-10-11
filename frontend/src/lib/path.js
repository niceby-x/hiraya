import { competencies, THRESHOLD } from '../data/mock.js'

// The skill the learner is working toward (sample: Solve linear equations)
export const TARGET_ID = 'c7'

const byId = Object.fromEntries(competencies.map((c) => [c.id, c]))

export const getCompetency = (id) => byId[id]

// Backward traversal from the target through its prerequisites.
// Depth-first, post-order, so every prerequisite comes before the skill that needs it.
// Keep only skills below the mastery line, then put the target last.
export function remediationPath(mastery, targetId = TARGET_ID, theta = THRESHOLD) {
  const visited = new Set()
  const order = []

  function visit(id) {
    if (visited.has(id)) return
    visited.add(id)
    byId[id].prereqs.forEach(visit)
    order.push(id)
  }

  visit(targetId)

  const gaps = order.filter((id) => id !== targetId && mastery[id] < theta)
  if (gaps.length === 0 && mastery[targetId] >= theta) return []
  return [...gaps, targetId]
}