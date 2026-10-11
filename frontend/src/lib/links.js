import { competencies } from '../data/mock.js'

// Every prerequisite link in the graph, as { id, from, to }.
// "from" is the prerequisite and "to" is the skill that builds on it.
export const prerequisiteLinks = competencies.flatMap((c) =>
  c.prereqs.map((from) => ({ id: `${from}-${c.id}`, from, to: c.id })),
)