// SAMPLE BKT parameters for the prototype. In the full system these are fitted
// per competency from response data (pyBKT) and served by the backend.
// P(L0) is not listed: the prototype starts from each learner's current mastery.

export const defaultParams = { guess: 0.2, slip: 0.1, learn: 0.15 }

// Override a skill here if it needs different values, e.g. c3: { guess: 0.25, slip: 0.1, learn: 0.12 }
const bySkill = {}

export const paramsFor = (skillId) => ({ ...defaultParams, ...bySkill[skillId] })
