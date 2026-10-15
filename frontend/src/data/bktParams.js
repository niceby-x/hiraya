// SAMPLE BKT parameters for the prototype. In the full system these are fitted
// per competency from response data (pyBKT) and served by the backend.
export const defaultParams = { init: 0.5, guess: 0.2, slip: 0.1, learn: 0.15 }

// Override a skill here if it needs different values, e.g. c3: { init: 0.45, guess: 0.25, slip: 0.1, learn: 0.12 }
const bySkill = {}

export const paramsFor = (skillId) => ({ ...defaultParams, ...bySkill[skillId] })