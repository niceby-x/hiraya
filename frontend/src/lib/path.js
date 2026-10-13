import { competencies, THRESHOLD } from '../data/mock.js'

// The skill the learner is working toward (sample: Solve linear equations)
export const TARGET_ID = 'c7'

const byId = Object.fromEntries(competencies.map((c) => [c.id, c]))

export const getCompetency = (id) => byId[id]

// Returns the ids of one loop (first id repeated at the end) if the prerequisite
// links contain a cycle, otherwise null. The graph must be acyclic to be a DAG.
export function findCycle(list = competencies) {
  const map = Object.fromEntries(list.map((c) => [c.id, c]))
  const state = {} // undefined = new, 1 = on the current path, 2 = done
  const stack = []

  function visit(id) {
    if (state[id] === 2) return null
    if (state[id] === 1) return [...stack.slice(stack.indexOf(id)), id]
    state[id] = 1
    stack.push(id)
    for (const p of map[id]?.prereqs ?? []) {
      const found = visit(p)
      if (found) return found
    }
    stack.pop()
    state[id] = 2
    return null
  }

  for (const c of list) {
    const found = visit(c.id)
    if (found) return found
  }
  return null
}

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