// SAMPLE DATA for the prototype. Replace with the encoded Grade 7 MATATAG
// prerequisite graph once the teacher review is done.

export const THRESHOLD = 0.95 // mastery line (theta)

export const competencies = [
  {
    id: 'c1',
    code: 'MAT7-Q1-NA1',
    name: 'Operations on integers',
    short: 'Integers',
    strand: 'Number and Number Sense',
    prereqs: [],
    resource: {
      title: 'MATATAG Q1 Lesson Exemplar: Integer Operations & Sign Rules',
      summary: 'Same signs: add absolute values and keep the sign. Different signs: subtract the smaller absolute value from the larger and keep the sign of the larger.',
      example: '(-8) + 15 = +7  |  (-6) - (-10) = (-6) + 10 = 4',
    },
  },
  {
    id: 'c2',
    code: 'MAT7-Q1-NA2',
    name: 'Fractions and decimals',
    short: 'Fractions',
    strand: 'Number and Number Sense',
    prereqs: [],
    resource: {
      title: 'MATATAG Q1 Task Card: Converting & Adding Fractions and Decimals',
      summary: 'To convert a fraction to a decimal, divide the numerator by the denominator. To add unlike fractions, rewrite them with their least common denominator (LCD) first.',
      example: '3/4 = 3 ÷ 4 = 0.75  |  1/2 + 1/3 = 3/6 + 2/6 = 5/6',
    },
  },
  {
    id: 'c3',
    code: 'MAT7-Q1-NA3',
    name: 'Operations on rational numbers',
    short: 'Rational',
    strand: 'Number and Number Sense',
    prereqs: ['c1', 'c2'],
    resource: {
      title: 'MATATAG Q1 Module: Signed Fractions & Decimal Operations',
      summary: 'Combine integer sign rules with fraction and decimal operations. Rewrite signed fractions with a common denominator before adding or subtracting.',
      example: '-2/3 + 1/6 = -4/6 + 1/6 = -3/6 = -1/2',
    },
  },
  {
    id: 'c4',
    code: 'MAT7-Q2-NA4',
    name: 'Exponents',
    short: 'Exponents',
    strand: 'Number and Number Sense',
    prereqs: ['c1'],
    resource: {
      title: 'MATATAG Q2 Lesson Exemplar: Laws of Exponents',
      summary: 'An exponent tells how many times the base is used as a factor. When multiplying powers with the same base, add the exponents: x^a · x^b = x^(a+b).',
      example: '2^4 = 16  |  (-3)^2 = (-3)(-3) = 9  |  x^2 · x^3 = x^5',
    },
  },
  {
    id: 'c5',
    code: 'MAT7-Q2-PA1',
    name: 'Evaluate algebraic expressions',
    short: 'Evaluate',
    strand: 'Patterns and Algebra',
    prereqs: ['c3', 'c4'],
    resource: {
      title: 'MATATAG Q2 Task Card: Substitution & Order of Operations (GEMDAS)',
      summary: 'Replace each variable with its given value in parentheses, then follow GEMDAS: grouping symbols, exponents, multiplication/division, and addition/subtraction.',
      example: 'For 2a^2 + 1 at a = -3: 2(-3)^2 + 1 = 2(9) + 1 = 19',
    },
  },
  {
    id: 'c6',
    code: 'MAT7-Q2-PA2',
    name: 'Simplify algebraic expressions',
    short: 'Simplify',
    strand: 'Patterns and Algebra',
    prereqs: ['c5'],
    resource: {
      title: 'MATATAG Q2 Module: Distributive Property & Combining Like Terms',
      summary: 'Distribute factors across parentheses—watching negative signs carefully—then group and combine terms that have the exact same variable and exponent.',
      example: '(4a - 1) - (a - 5) = 4a - 1 - a + 5 = 3a + 4',
    },
  },
  {
    id: 'c7',
    code: 'MAT7-Q3-PA3',
    name: 'Solve linear equations in one variable',
    short: 'Solve',
    strand: 'Patterns and Algebra',
    prereqs: ['c6', 'c3'],
    resource: {
      title: 'MATATAG Q3 Lesson Exemplar: Properties of Equality',
      summary: 'Isolate the variable on one side of the equation by applying inverse operations equally to both sides after simplifying.',
      example: '4n - 3 = n + 9  →  3n - 3 = 9  →  3n = 12  →  n = 4',
    },
  },
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