import test from 'node:test'
import assert from 'node:assert/strict'
import { contextQuery, learnerLink, overviewLink, parseTheta, readContext } from './teacherContext.js'
import { formatPercent, statusFor } from './mastery.js'

const ids = ['l01', 'l02']
const read = (qs) => readContext(new URLSearchParams(qs), ids)

test('missing parameters use the defaults without flagging anything', () => {
  const c = read('')
  assert.deepEqual(c, { target: 'c7', theta: 0.95, learnerId: null, invalid: { target: false, theta: false, learner: false } })
})

test('valid parameters are read as given', () => {
  const c = read('learner=l02&target=c4&theta=0.98')
  assert.equal(c.target, 'c4')
  assert.equal(c.theta, 0.98)
  assert.equal(c.learnerId, 'l02')
  assert.equal(c.invalid.target || c.invalid.theta || c.invalid.learner, false)
})

test('invalid target and threshold fall back to the defaults and are flagged', () => {
  const c = read('target=c99&theta=0.5')
  assert.equal(c.target, 'c7')
  assert.equal(c.theta, 0.95)
  assert.equal(c.invalid.target, true)
  assert.equal(c.invalid.theta, true)
})

test('threshold values: only 0.95 and 0.98 (also as 95 / 98) are accepted', () => {
  assert.equal(parseTheta('0.95'), 0.95)
  assert.equal(parseTheta('98'), 0.98)
  for (const bad of ['0.9', '1', 'abc', '', '0', 'NaN', '-0.95', null, undefined]) assert.equal(parseTheta(bad), null)
})

test('prototype-style target names are rejected', () => {
  for (const t of ['__proto__', 'constructor', 'toString']) assert.equal(read(`target=${t}`).target, 'c7')
})

test('unknown learner is flagged and not selected', () => {
  const c = read('learner=l99')
  assert.equal(c.learnerId, null)
  assert.equal(c.invalid.learner, true)
})

test('links carry learner, target and threshold, and read back the same', () => {
  const link = learnerLink({ learnerId: 'l02', target: 'c4', theta: 0.98 })
  assert.equal(link, '/teacher/learner?learner=l02&target=c4&theta=0.98')
  const back = read(link.split('?')[1])
  assert.deepEqual([back.learnerId, back.target, back.theta], ['l02', 'c4', 0.98])
  assert.equal(overviewLink({ target: 'c4', theta: 0.98 }), '/teacher?target=c4&theta=0.98')
  assert.equal(contextQuery({ target: 'c7', theta: 0.95 }), 'target=c7&theta=0.95')
})

test('status has two states from the selected threshold, plus "none" when there is no estimate', () => {
  assert.equal(statusFor(0.95, 0.95), 'meets')
  assert.equal(statusFor(0.9499, 0.95), 'below')
  assert.equal(statusFor(0.97, 0.98), 'below')
  assert.equal(statusFor(0.3, 0.95), 'below')
  assert.equal(statusFor(undefined, 0.95), 'none')
})

test('displayed percentage never shows the threshold itself for an estimate below it', () => {
  assert.equal(formatPercent(0.949, 0.95), '94.9%')
  assert.equal(formatPercent(0.9499, 0.95), '94.9%')
  assert.equal(formatPercent(0.975, 0.98), '97.5%')
  assert.equal(formatPercent(0.95, 0.95), '95%')
  assert.equal(formatPercent(0.58, 0.95), '58%')
  assert.equal(formatPercent(undefined, 0.95), '—')
})
