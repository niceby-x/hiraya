// Bayesian Knowledge Tracing for ONE skill (Chapter 2, "BKT Algorithm").
// Pure functions: no React, no data imports, so the same logic can be tested
// on its own and later compared with the pyBKT output from the backend.
//
// params = { guess: P(G), slip: P(S), learn: P(T) }
// prior  = P(L_{n-1}), the mastery estimate before the answer.

// Step 1: observation update. Returns P(L_n | answer).
export function observe(prior, correct, { guess, slip }) {
  const num = correct ? prior * (1 - slip) : prior * slip
  const den = correct
    ? prior * (1 - slip) + (1 - prior) * guess
    : prior * slip + (1 - prior) * (1 - guess)
  return den === 0 ? prior : num / den // den is 0 only for degenerate params
}

// Step 2: learning transition. Returns P(L_n).
export function transition(posterior, { learn }) {
  return posterior + (1 - posterior) * learn
}

// Steps 1 and 2 together: the new mastery estimate after one answer.
export function updateMastery(prior, correct, params) {
  return transition(observe(prior, correct, params), params)
}

// Step 3: next-response prediction. Returns P(C_{n+1}).
export function predictCorrect(mastery, { guess, slip }) {
  return mastery * (1 - slip) + (1 - mastery) * guess
}
