// SAMPLE practice items for the prototype. Replace with the real item bank.
// answer is the index of the correct option.

export const questions = {
  c2: [
    {
      id: 'c2-1',
      prompt: 'Which decimal is equal to 3/4?',
      options: ['0.34', '0.43', '0.75', '1.34'],
      answer: 2,
      explanation: 'Divide the numerator by the denominator: 3 ÷ 4 = 0.75.',
    },
    {
      id: 'c2-2',
      prompt: 'What is 1/2 + 1/3?',
      options: ['2/5', '5/6', '1/6', '2/6'],
      answer: 1,
      explanation: 'Use a common denominator of 6: 3/6 + 2/6 = 5/6.',
    },
    {
      id: 'c2-3',
      prompt: 'Which number is the greatest?',
      options: ['3/8', '0.45', '0.5', '2/5'],
      answer: 2,
      explanation: 'As decimals: 3/8 = 0.375, 2/5 = 0.4, 0.45 and 0.5. The greatest is 0.5.',
    },
    {
      id: 'c2-4',
      prompt: 'Write 0.6 as a fraction in simplest form.',
      options: ['3/5', '6/10', '6/100', '1/6'],
      answer: 0,
      explanation: '0.6 = 6/10. Divide the top and bottom by 2 to get 3/5.',
    },
  ],
  c3: [
    {
      id: 'c3-1',
      prompt: 'What is -2/3 + 1/6?',
      options: ['-5/6', '-1/2', '1/2', '-1/6'],
      answer: 1,
      explanation: '-2/3 = -4/6, so -4/6 + 1/6 = -3/6 = -1/2.',
    },
    {
      id: 'c3-2',
      prompt: 'What is (-3/4) × (2/5)?',
      options: ['3/10', '-5/9', '-3/10', '-1/10'],
      answer: 2,
      explanation: 'Multiply: (-3 × 2) / (4 × 5) = -6/20 = -3/10. A negative times a positive is negative.',
    },
    {
      id: 'c3-3',
      prompt: 'What is -0.5 − (-1.25)?',
      options: ['-1.75', '0.75', '1.75', '-0.75'],
      answer: 1,
      explanation: 'Subtracting a negative means adding: -0.5 + 1.25 = 0.75.',
    },
  ],
}