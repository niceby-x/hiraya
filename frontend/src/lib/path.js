import { competencies, THRESHOLD } from '../data/mock.js'

// The skill the learner is working toward (sample: Solve linear equations)
export const TARGET_ID = 'c7'

const byId = Object.fromEntries(competencies.map((c) => [c.id, c]))

export const getCompetency = (id) => byId[id]

// The target and every prerequisite behind it, each listed after the skills it needs.
// Depth-first, post-order backward traversal from the target.
export function dependencyOrder(targetId = TARGET_ID) {
  const visited = new Set()
  const order = []

  function visit(id) {
    if (visited.has(id)) return
    visited.add(id)
    byId[id].prereqs.forEach(visit)
    order.push(id)
  }

  visit(targetId)
  return order
}

// Keep only prerequisites below the mastery line, then put the target last.
export function remediationPath(mastery, targetId = TARGET_ID, theta = THRESHOLD) {
  const order = dependencyOrder(targetId)
  const gaps = order.filter((id) => id !== targetId && mastery[id] < theta)
  if (gaps.length === 0 && mastery[targetId] >= theta) return []
  return [...gaps, targetId]
}