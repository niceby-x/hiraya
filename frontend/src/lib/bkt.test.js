// Run from the frontend folder: node --test src/lib/bkt.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { observe, transition, updateMastery, predictCorrect } from './bkt.js'

const params = { guess: 0.2, slip: 0.1, learn: 0.15 }
const close = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} is not close to ${b}`)

// Hand calculation, prior 0.58, correct answer:
//   0.58*0.9 = 0.522;  0.522 + 0.42*0.2 = 0.606;  0.522/0.606 = 0.861386
//   0.861386 + (1-0.861386)*0.15 = 0.882178
test('correct answer raises mastery (hand-checked value)', () => {
  close(observe(0.58, true, params), 0.861386)
  close(updateMastery(0.58, true, params), 0.882178)
})

// Hand calculation, prior 0.58, wrong answer:
//   0.58*0.1 = 0.058;  0.058 + 0.42*0.8 = 0.394;  0.058/0.394 = 0.147208
//   0.147208 + (1-0.147208)*0.15 = 0.275129
test('wrong answer lowers mastery (hand-checked value)', () => {
  close(observe(0.58, false, params), 0.147208)
  close(updateMastery(0.58, false, params), 0.275129)
})

test('learning transition with no learning leaves the posterior unchanged', () => {
  assert.equal(transition(0.4, { learn: 0 }), 0.4)
})

test('next-response prediction (hand-checked value)', () => {
  // 0.882178*0.9 + 0.117822*0.2 = 0.817524
  close(predictCorrect(0.882178, params), 0.817524)
})

test('estimate stays inside [0, 1] over a long run of answers', () => {
  let p = 0.5
  for (let i = 0; i < 200; i++) {
    p = updateMastery(p, i % 3 !== 0, params)
    assert.ok(p >= 0 && p <= 1)
  }
})

test('degenerate parameters do not produce NaN', () => {
  assert.equal(observe(0, true, { guess: 0, slip: 0.1 }), 0)
})
