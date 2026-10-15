// Run from the frontend folder: npm test
import test from 'node:test'
import assert from 'node:assert/strict'
import { questions } from '../data/questions.js'
import { missedEntry, nextRadioIndex, shuffle, shuffleItems } from './practice.js'

// Small repeatable random source (LCG) so the tests do not depend on Math.random.
const seeded = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}

test('shuffle keeps every element and does not change the input', () => {
  const input = [1, 2, 3, 4, 5]
  const out = shuffle(input, seeded(7))
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5])
  assert.deepEqual(input, [1, 2, 3, 4, 5])
})

test('shuffled questions keep the same correct answer text for every skill', () => {
  for (const [skill, items] of Object.entries(questions)) {
    for (let seed = 1; seed <= 25; seed++) {
      const shuffled = shuffleItems(items, seeded(seed))
      assert.equal(shuffled.length, items.length, skill)
      for (const q of shuffled) {
        const original = items.find((o) => o.id === q.id)
        assert.ok(original, `${skill}: ${q.id} missing`)
        assert.equal(q.options[q.answer], original.options[original.answer], `${q.id} answer moved`)
        assert.deepEqual([...q.options].sort(), [...original.options].sort(), `${q.id} options changed`)
      }
    }
  }
})

test('shuffleItems does not change the question bank itself', () => {
  const before = JSON.stringify(questions)
  shuffleItems(questions.c1, seeded(3))
  assert.equal(JSON.stringify(questions), before)
})

test('missedEntry records what the student picked and the right answer', () => {
  const item = { id: 'x-1', prompt: 'P?', options: ['a', 'b', 'c'], answer: 2, explanation: 'why' }
  assert.deepEqual(missedEntry(item, 0), { id: 'x-1', prompt: 'P?', picked: 'a', correct: 'c', explanation: 'why' })
})

test('arrow keys move through the options and wrap around', () => {
  assert.equal(nextRadioIndex(0, 'ArrowDown', 4), 1)
  assert.equal(nextRadioIndex(3, 'ArrowRight', 4), 0)
  assert.equal(nextRadioIndex(0, 'ArrowUp', 4), 3)
  assert.equal(nextRadioIndex(2, 'ArrowLeft', 4), 1)
  assert.equal(nextRadioIndex(1, 'Home', 4), 0)
  assert.equal(nextRadioIndex(1, 'End', 4), 3)
  assert.equal(nextRadioIndex(-1, 'ArrowDown', 4), 1)
  assert.equal(nextRadioIndex(1, 'Tab', 4), -1)
})
