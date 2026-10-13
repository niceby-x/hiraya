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

// Remediation path for one learner and one target, used by the student pages.
// Delegates to candidatePath() so student and teacher pages always agree: the path is
// the candidate gaps (dependency order) followed by the target, and it is empty when the
// target already meets the mastery line (even if a prerequisite is below it).
export function remediationPath(mastery, targetId = TARGET_ID, theta = THRESHOLD) {
  return candidatePath(mastery, targetId, theta).path
}

// ---------------------------------------------------------------------------
// Candidate gaps and path (Sprint 01, shared with the student pages in Sprint 02).
// A learner whose target already meets the threshold gets no remediation path: the
// target is only treated as the "struggling" competency while its estimate is below theta.
// ---------------------------------------------------------------------------

export const hasCompetency = (id) => typeof id === 'string' && Object.hasOwn(byId, id)

const hasEstimate = (p) => typeof p === 'number' && Number.isFinite(p)

// Candidate prerequisite gaps and the remediation path for one learner and one target.
//
// Returns { status, gaps, path, unknown }
//   status  'invalid-target'  the target id is not in the graph
//           'no-data'         the learner has no estimate for the target
//           'target-met'      target estimate >= theta: path is empty (target is not a struggling skill)
//           'needs-review'    target estimate < theta: path = candidate gaps in dependency order, target last
//   gaps    prerequisite ids (direct and indirect) whose estimate is below theta, earliest prerequisite first
//   path    gaps followed by the target ([] unless status is 'needs-review')
//   unknown prerequisite ids with no estimate. They are neither gaps nor mastered, so they are reported separately.
export function candidatePath(mastery, targetId, theta) {
  if (!hasCompetency(targetId)) return { status: 'invalid-target', gaps: [], path: [], unknown: [] }

  const estimates = mastery ?? {}
  if (!hasEstimate(estimates[targetId])) return { status: 'no-data', gaps: [], path: [], unknown: [] }
  if (estimates[targetId] >= theta) return { status: 'target-met', gaps: [], path: [], unknown: [] }

  const prerequisites = dependencyOrder(targetId).filter((id) => id !== targetId)
  const unknown = prerequisites.filter((id) => !hasEstimate(estimates[id]))
  const gaps = prerequisites.filter((id) => hasEstimate(estimates[id]) && estimates[id] < theta)
  return { status: 'needs-review', gaps, path: [...gaps, targetId], unknown }
}

// Every direct and indirect prerequisite of the target, earliest first (the target is not included).
export function prerequisitesOf(targetId) {
  return hasCompetency(targetId) ? dependencyOrder(targetId).filter((id) => id !== targetId) : []
}

// Column order for the class grid: the target's dependency chain first (earliest
// prerequisite to the target), then every other skill in the original list order.
export function displayOrder(targetId) {
  const chain = hasCompetency(targetId) ? dependencyOrder(targetId) : []
  return [...chain, ...competencies.map((c) => c.id).filter((id) => !chain.includes(id))]
}
