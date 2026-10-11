// SAMPLE DATA for the prototype. Replace with the encoded Grade 7 MATATAG
// prerequisite graph once the teacher review is done.

export const THRESHOLD = 0.95 // mastery line (θ)

export const competencies = [
  { id: 'c1', name: 'Operations on integers', short: 'Integers', strand: 'Number and Number Sense', prereqs: [] },
  { id: 'c2', name: 'Fractions and decimals', short: 'Fractions', strand: 'Number and Number Sense', prereqs: [] },
  { id: 'c3', name: 'Operations on rational numbers', short: 'Rational', strand: 'Number and Number Sense', prereqs: ['c1', 'c2'] },
  { id: 'c4', name: 'Exponents', short: 'Exponents', strand: 'Number and Number Sense', prereqs: ['c1'] },
  { id: 'c5', name: 'Evaluate algebraic expressions', short: 'Evaluate', strand: 'Patterns and Algebra', prereqs: ['c3', 'c4'] },
  { id: 'c6', name: 'Simplify algebraic expressions', short: 'Simplify', strand: 'Patterns and Algebra', prereqs: ['c5'] },
  { id: 'c7', name: 'Solve linear equations in one variable', short: 'Solve', strand: 'Patterns and Algebra', prereqs: ['c6', 'c3'] },
]

// [c1..c7] mastery probabilities -> { c1: 0.97, c2: 0.91, ... }
const row = (values) => Object.fromEntries(values.map((v, i) => [`c${i + 1}`, v]))

export const learners = [
  { id: 'l01', name: 'Learner 01', mastery: row([0.97, 0.91, 0.62, 0.96, 0.58, 0.71, 0.34]) },
  { id: 'l02', name: 'Learner 02', mastery: row([0.99, 0.96, 0.95, 0.97, 0.88, 0.8, 0.64]) },
  { id: 'l03', name: 'Learner 03', mastery: row([0.85, 0.78, 0.52, 0.9, 0.41, 0.38, 0.22]) },
  { id: 'l04', name: 'Learner 04', mastery: row([0.98, 0.97, 0.96, 0.98, 0.94, 0.9, 0.81]) },
  { id: 'l05', name: 'Learner 05', mastery: row([0.92, 0.88, 0.7, 0.84, 0.66, 0.55, 0.4]) },
  { id: 'l06', name: 'Learner 06', mastery: row([0.96, 0.95, 0.93, 0.97, 0.91, 0.85, 0.72]) },
  { id: 'l07', name: 'Learner 07', mastery: row([0.72, 0.6, 0.45, 0.7, 0.38, 0.3, 0.18]) },
  { id: 'l08', name: 'Learner 08', mastery: row([0.98, 0.96, 0.97, 0.99, 0.95, 0.92, 0.89]) },
]