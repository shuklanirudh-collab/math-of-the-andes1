const test = require('node:test')
const assert = require('node:assert/strict')
const { analyse, describe, shares } = require('../js/sdi-math.js')
const { simulate, balance } = require('../js/lotka-volterra.js')

const sp = (...counts) => counts.map((count, i) => ({ name: 'S' + (i + 1), count }))

test('the worked example from the original site: 13 and 15 give 0.516', () => {
  const r = analyse(sp(13, 15))
  assert.equal(r.ok, true)
  assert.equal(r.numerator, 13 * 12 + 15 * 14)
  assert.equal(r.numerator, 366)
  assert.equal(r.total, 28)
  assert.equal(r.denominator, 756)
  assert.equal(r.sdi.toFixed(3), '0.516')
})

test('equal populations are as even as possible', () => {
  const r = analyse(sp(10, 10, 10))
  assert.equal(r.richness, 3)
  assert.ok(r.evenness > 0.95)
  assert.equal(r.sdi.toFixed(3), (1 - (3 * 90) / (30 * 29)).toFixed(3))
})

test('one species dominating gives a low index and low evenness', () => {
  const r = analyse(sp(98, 1, 1))
  assert.ok(r.sdi < 0.05)
  assert.ok(r.evenness < 0.45)
  assert.match(describe(r), /dominates/)
})

test('a single species has an index of 0', () => {
  const r = analyse(sp(10, 0))
  assert.equal(r.sdi, 0)
  assert.equal(r.richness, 1)
  assert.equal(r.evenness, null)
  assert.match(describe(r), /no diversity/)
})

test('species with no animals do not count towards richness', () => {
  assert.equal(analyse(sp(5, 0, 7)).richness, 2)
})

test('rejects counts the formula cannot use', () => {
  assert.equal(analyse(sp(1, 0)).ok, false) // fewer than 2 animals
  assert.equal(analyse(sp(-3, 5)).ok, false)
  assert.equal(analyse(sp(2.5, 5)).ok, false)
  assert.equal(analyse(sp(NaN, 5)).ok, false)
})

test('all singletons: every pair is a different species', () => {
  const r = analyse(sp(1, 1, 1))
  assert.equal(r.sdi, 1)
  assert.equal(r.inverse, null)
  assert.equal(r.evenness, 1)
})

test('shares add up to 1', () => {
  const total = shares(analyse(sp(3, 5, 12))).reduce((n, s) => n + s.share, 0)
  assert.ok(Math.abs(total - 1) < 1e-12)
})

test('predator-prey: at the balance point nothing moves', () => {
  const p = { a: 1, b: 0.1, d: 0.075, g: 1.5 }
  const b = balance(p)
  assert.ok(Math.abs(b.prey - 20) < 1e-9)
  assert.ok(Math.abs(b.predators - 10) < 1e-9)
  const run = simulate(p, b.prey, b.predators, 20)
  assert.ok(Math.abs(run.x[run.x.length - 1] - 20) < 1e-6)
  assert.ok(Math.abs(run.y[run.y.length - 1] - 10) < 1e-6)
})

test('predator-prey: the populations cycle and the conserved quantity holds', () => {
  const p = { a: 1, b: 0.1, d: 0.075, g: 1.5 }
  const run = simulate(p, 10, 5, 40)
  // V = d x - g ln x + b y - a ln y never changes along a solution
  const V = (x, y) => p.d * x - p.g * Math.log(x) + p.b * y - p.a * Math.log(y)
  const first = V(run.x[0], run.y[0])
  for (let i = 0; i < run.x.length; i += 40) assert.ok(Math.abs(V(run.x[i], run.y[i]) - first) < 1e-4)
  assert.ok(Math.max(...run.x) > 30)
  assert.ok(Math.min(...run.x) < 10)
})

test('predator-prey: no predators means the prey grow without limit; no prey means predators die out', () => {
  const p = { a: 0.5, b: 0.1, d: 0.1, g: 0.5 }
  assert.ok(simulate(p, 10, 0, 5).x.at(-1) > 100)
  assert.ok(simulate(p, 0, 10, 5).y.at(-1) < 1)
})
