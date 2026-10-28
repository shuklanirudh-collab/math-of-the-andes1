/* The Lotka-Volterra predator-prey model, solved step by step (fourth-order Runge-Kutta).
   dx/dt = a x - b x y      prey: grow on their own, get eaten when they meet a predator
   dy/dt = d x y - g y      predators: grow by eating prey, die off on their own */
(function (root, factory) {
  var api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.AndesMath = Object.assign(root.AndesMath || {}, api)
})(typeof self !== 'undefined' ? self : this, function () {
  function derivative(p, x, y) {
    return [p.a * x - p.b * x * y, p.d * x * y - p.g * y]
  }

  // p: { a, b, d, g }. Returns { t: [], x: [], y: [] } sampled every `every` steps.
  function simulate(p, x0, y0, duration, dt, every) {
    dt = dt || 0.01
    every = every || 5
    var steps = Math.round(duration / dt)
    var x = x0
    var y = y0
    var out = { t: [0], x: [x0], y: [y0] }
    for (var i = 1; i <= steps; i++) {
      var k1 = derivative(p, x, y)
      var k2 = derivative(p, x + (dt / 2) * k1[0], y + (dt / 2) * k1[1])
      var k3 = derivative(p, x + (dt / 2) * k2[0], y + (dt / 2) * k2[1])
      var k4 = derivative(p, x + dt * k3[0], y + dt * k3[1])
      x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
      y += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
      if (!isFinite(x) || !isFinite(y)) break
      if (i % every === 0) {
        out.t.push(i * dt)
        out.x.push(Math.max(0, x))
        out.y.push(Math.max(0, y))
      }
    }
    return out
  }

  // Where the two populations would sit perfectly still, and about how long one full cycle takes
  // (the period is exact only for small swings, but it is a good guide).
  function balance(p) {
    return { prey: p.g / p.d, predators: p.a / p.b, period: (2 * Math.PI) / Math.sqrt(p.a * p.g) }
  }

  return { simulate: simulate, balance: balance }
})
