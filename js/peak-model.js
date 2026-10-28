/* The Gaussian / elliptical peak model of a mountain, and of a range made of several peaks.

   One peak:  h(x, y) = H * exp( -( u^2 / (2 sx^2) + v^2 / (2 sy^2) ) )
     u =  (x - x0) cos(t) + (y - y0) sin(t)
     v = -(x - x0) sin(t) + (y - y0) cos(t)
   H is the height of the summit above the base, (x0, y0) is where it stands, sx and sy are how far it
   spreads along and across its own axis (km), and t is the angle that axis points. When sx = sy the peak is
   round; when they differ, every contour line is an ellipse, so the peak is a ridge.

   A range:   h(x, y) = base + (the sum of its peaks)        x, y in km, heights in metres. */
(function (root, factory) {
  var api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.AndesMath = Object.assign(root.AndesMath || {}, api)
})(typeof self !== 'undefined' ? self : this, function () {
  var RAD = Math.PI / 180

  // Height of one peak above the base at (x, y). p: { x, y, h, sx, sy, angle (degrees) }
  function peakHeight(p, x, y) {
    var t = p.angle * RAD
    var dx = x - p.x
    var dy = y - p.y
    var u = dx * Math.cos(t) + dy * Math.sin(t)
    var v = -dx * Math.sin(t) + dy * Math.cos(t)
    return p.h * Math.exp(-((u * u) / (2 * p.sx * p.sx) + (v * v) / (2 * p.sy * p.sy)))
  }

  // Elevation of the whole range at (x, y).
  function elevation(peaks, base, x, y) {
    var total = base
    for (var i = 0; i < peaks.length; i++) total += peakHeight(peaks[i], x, y)
    return total
  }

  // Facts about one peak on its own (ignoring the others).
  function peakFacts(p) {
    var sMin = Math.min(p.sx, p.sy)
    var along = 2 * Math.sqrt(2 * Math.LN2) // full width at half height = 2.355 sigma
    var k = Math.sqrt(2 * Math.log(10)) // the contour at a tenth of the height sits k sigma from the summit
    var a = k * p.sx
    var b = k * p.sy
    return {
      // The slope is steepest one sigma from the summit, along the short axis: H e^(-1/2) / sigma.
      steepestSlopeDeg: Math.atan((p.h * Math.exp(-0.5)) / (sMin * 1000)) / RAD,
      halfHeightWidthAlong: along * p.sx,
      halfHeightWidthAcross: along * p.sy,
      footprintAxes: [a, b],
      footprintArea: Math.PI * a * b, // km^2, inside the contour at a tenth of the height
      volume: (2 * Math.PI * p.h * p.sx * p.sy) / 1000, // km^3 of rock above the base (the exact integral)
      axisRatio: Math.max(p.sx, p.sy) / sMin,
    }
  }

  // A grid of elevations: rows[j][i] for y = j * dy, x = i * dx, covering width x depth (km).
  function grid(peaks, base, width, depth, nx, ny) {
    var rows = []
    var min = Infinity
    var max = -Infinity
    var top = { x: 0, y: 0, h: -Infinity }
    for (var j = 0; j < ny; j++) {
      var row = new Float32Array(nx)
      var y = (j / (ny - 1)) * depth
      for (var i = 0; i < nx; i++) {
        var x = (i / (nx - 1)) * width
        var h = elevation(peaks, base, x, y)
        row[i] = h
        if (h < min) min = h
        if (h > max) max = h
        if (h > top.h) top = { x: x, y: y, h: h }
      }
      rows.push(row)
    }
    return { rows: rows, min: min, max: max, top: top }
  }

  return { peakHeight: peakHeight, elevation: elevation, peakFacts: peakFacts, grid: grid }
})
