const test = require('node:test')
const assert = require('node:assert/strict')
const { peakHeight, elevation, peakFacts, grid } = require('../js/peak-model.js')

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} is not within ${eps} of ${b}`)
const round = { x: 50, y: 40, h: 3000, sx: 10, sy: 10, angle: 0 }
const ridge = { x: 50, y: 40, h: 3000, sx: 20, sy: 5, angle: 0 }

test('the summit is H, and one sigma away the height is H times e^(-1/2)', () => {
  near(peakHeight(round, 50, 40), 3000)
  near(peakHeight(round, 60, 40), 3000 * Math.exp(-0.5))
  near(peakHeight(ridge, 70, 40), 3000 * Math.exp(-0.5)) // one sigma along the long axis
  near(peakHeight(ridge, 50, 45), 3000 * Math.exp(-0.5)) // one sigma across it
})

test('a round peak looks the same in every direction, whatever the angle', () => {
  const a = peakHeight({ ...round, angle: 0 }, 58, 47)
  near(peakHeight({ ...round, angle: 37 }, 58, 47), a)
  near(peakHeight(round, 50 + 8 * Math.cos(1), 40 + 8 * Math.sin(1)), peakHeight(round, 50 + 8 * Math.cos(2.5), 40 + 8 * Math.sin(2.5)))
})

test('rotating an elliptical peak turns its long axis', () => {
  const turned = { ...ridge, angle: 90 }
  near(peakHeight(turned, 50, 60), peakHeight(ridge, 70, 40)) // the long axis now points north
  near(peakHeight(turned, 50, 60), 3000 * Math.exp(-0.5))
})

test('the contour at a tenth of the height is an ellipse with the stated semi-axes', () => {
  const f = peakFacts(ridge)
  near(peakHeight(ridge, 50 + f.footprintAxes[0], 40), 300, 1e-6)
  near(peakHeight(ridge, 50, 40 + f.footprintAxes[1]), 300, 1e-6)
  near(f.footprintArea, Math.PI * f.footprintAxes[0] * f.footprintAxes[1])
})

test('the half-height width is 2.355 sigma', () => {
  const f = peakFacts(ridge)
  near(peakHeight(ridge, 50 + f.halfHeightWidthAlong / 2, 40), 1500, 1e-6)
  near(f.halfHeightWidthAcross, 2.3548 * 5, 1e-3)
})

test('the steepest slope is one sigma out along the short axis (checked against a numerical slope)', () => {
  const f = peakFacts(ridge)
  const step = 1e-4
  const slopeAt = (d) => Math.abs(peakHeight(ridge, 50, 40 + d + step) - peakHeight(ridge, 50, 40 + d)) / (step * 1000)
  const best = Math.max(...[3, 4, 4.5, 5, 5.5, 6, 7].map(slopeAt))
  near(slopeAt(5), best, 1e-6)
  near(Math.atan(slopeAt(5)) * (180 / Math.PI), f.steepestSlopeDeg, 1e-3)
})

test('the volume formula matches adding up the heights on a fine grid', () => {
  const p = { x: 50, y: 50, h: 2000, sx: 8, sy: 5, angle: 25 }
  let sum = 0
  const d = 0.5
  for (let x = 0; x <= 100; x += d) for (let y = 0; y <= 100; y += d) sum += peakHeight(p, x, y) * d * d
  near(sum / 1000, peakFacts(p).volume, 1e-3 * peakFacts(p).volume)
})

test('a range is the base plus its peaks, and the grid finds the highest point', () => {
  const peaks = [round, { x: 20, y: 20, h: 1000, sx: 6, sy: 6, angle: 0 }]
  near(elevation(peaks, 3000, 50, 40), 3000 + 3000 + peakHeight(peaks[1], 50, 40))
  const g = grid(peaks, 3000, 100, 75, 101, 76)
  near(g.top.x, 50, 1)
  near(g.top.y, 40, 1)
  assert.ok(g.top.h > 6000 && g.top.h < 6001)
  assert.ok(g.min >= 3000)
})
