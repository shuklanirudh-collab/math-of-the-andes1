/* The page: the Simpson's Diversity Index calculator and the predator-prey simulator.
   The maths lives in sdi-math.js and lotka-volterra.js. */
(function () {
  'use strict'
  var M = window.AndesMath

  function el(tag, attrs, children) {
    var node = document.createElement(tag)
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k]
      else if (k === 'class') node.className = attrs[k]
      else node.setAttribute(k, attrs[k])
    })
    ;(children || []).forEach(function (c) { node.appendChild(c) })
    return node
  }
  var $ = function (id) { return document.getElementById(id) }
  var fmt = function (n, d) { return Number(n).toFixed(d) }

  /* ---------------------------------------------------------------- calculator */

  var MAX_SPECIES = 12
  var PRESETS = {
    original: [['Chinchilla', 13], ['Andean condor', 15]],
    even: [['Andean condor', 10], ['Chinchilla', 10], ['Andean mountain cat', 10]],
    dominated: [['Chinchilla', 90], ['Andean condor', 5], ['Andean mountain cat', 5]],
  }
  var nextId = 1
  var rows = []

  function makeRow(name, count) { return { id: nextId++, name: name, count: count === undefined ? '' : String(count) } }
  function load(preset) { rows = PRESETS[preset].map(function (p) { return makeRow(p[0], p[1]) }) }

  function renderRows() {
    var host = $('rows')
    host.textContent = ''
    rows.forEach(function (row, i) {
      var nameInput = el('input', { type: 'text', id: 'name-' + row.id, list: 'animal-names', autocomplete: 'off', placeholder: 'Species ' + (i + 1), maxlength: '40' })
      nameInput.value = row.name
      nameInput.addEventListener('input', function () { row.name = nameInput.value; update() })

      var countInput = el('input', { type: 'number', id: 'count-' + row.id, min: '0', step: '1', inputmode: 'numeric', placeholder: 'e.g. 12' })
      countInput.value = row.count
      countInput.addEventListener('input', function () { row.count = countInput.value; update() })

      var remove = el('button', { type: 'button', class: 'remove', 'aria-label': 'Remove species ' + (i + 1), title: 'Remove', text: '×' })
      remove.disabled = rows.length <= 2
      remove.addEventListener('click', function () {
        rows = rows.filter(function (r) { return r !== row })
        renderRows()
        update()
        var focus = $('rows').querySelector('input')
        if (focus) focus.focus()
      })

      host.appendChild(el('div', { class: 'row' }, [
        el('div', { class: 'name-field' }, [el('label', { for: 'name-' + row.id, text: 'Species ' + (i + 1) }), nameInput]),
        el('div', { class: 'count-field' }, [el('label', { for: 'count-' + row.id, text: 'Animals' }), countInput]),
        remove,
      ]))
    })
    $('add-row').disabled = rows.length >= MAX_SPECIES
  }

  function label(row, i) { return row.name.trim() || 'Species ' + (i + 1) }

  function readCounts() {
    var counts = []
    var empty = false
    var bad = []
    rows.forEach(function (row, i) {
      var text = row.count.trim()
      var input = $('count-' + row.id)
      var invalid = false
      if (text === '') {
        empty = true
        counts.push({ name: label(row, i), count: 0 })
      } else {
        var n = Number(text)
        if (!Number.isInteger(n) || n < 0) { invalid = true; bad.push(label(row, i)) }
        counts.push({ name: label(row, i), count: n })
      }
      if (input) input.setAttribute('aria-invalid', invalid ? 'true' : 'false')
    })
    return { counts: counts, empty: empty, bad: bad }
  }

  function showEmpty(text, msg, isInfo) {
    $('result').hidden = true
    $('result-empty').hidden = false
    $('result-empty').textContent = text
    var m = $('message')
    m.textContent = msg || ''
    m.className = 'message' + (isInfo ? ' info' : '')
  }

  var lastWorking = ''

  function update() {
    var read = readCounts()
    if (read.bad.length) {
      return showEmpty('Fix the highlighted numbers to see the result.', 'Use whole numbers only (0 or more) for ' + read.bad.join(', ') + '.')
    }
    if (read.empty) {
      return showEmpty('Enter the number of animals for every species to see the result.', 'Use 0 for a species that is not there.', true)
    }
    var r = M.analyse(read.counts)
    if (!r.ok) return showEmpty('Enter at least two animals in total and the result appears here.', r.reason)

    var names = read.counts.map(function (c) { return c.name.toLowerCase() })
    var dup = names.filter(function (n, i) { return names.indexOf(n) !== i })[0]
    var m = $('message')
    m.textContent = dup ? '“' + dup + '” appears more than once. If it is the same species, put its animals in one row.' : ''
    m.className = 'message info'

    $('result-empty').hidden = true
    $('result').hidden = false
    $('r-sdi').textContent = fmt(r.sdi, 3)
    $('r-gauge').style.width = Math.max(0, Math.min(1, r.sdi)) * 100 + '%'
    $('r-reading').textContent = M.describe(r)
    $('r-richness').textContent = r.richness
    $('r-total').textContent = r.total
    $('r-inverse').textContent = r.inverse === null ? '—' : fmt(r.inverse, 2)
    $('r-evenness').textContent = r.evenness === null ? '—' : fmt(r.evenness, 2)

    var bars = $('r-bars')
    bars.textContent = ''
    M.shares(r).forEach(function (s) {
      var fill = el('span', { class: 'bar-fill' })
      fill.style.width = s.share * 100 + '%'
      bars.appendChild(el('li', {}, [
        el('div', { class: 'bar-label' }, [el('span', { text: s.name }), el('span', { text: s.n + ' · ' + fmt(s.share * 100, 1) + '%' })]),
        el('div', { class: 'bar-track' }, [fill]),
      ]))
    })

    var body = $('r-table')
    body.textContent = ''
    r.rows.forEach(function (row, i) {
      body.appendChild(el('tr', {}, [el('td', { text: label(rows[i], i) }), el('td', { text: row.n }), el('td', { text: row.nn1 })]))
    })
    $('r-total2').textContent = r.total
    $('r-numerator').textContent = r.numerator

    var terms = r.rows.map(function (row) { return row.n + '×' + (row.n - 1) })
    var values = r.rows.map(function (row) { return row.nn1 })
    var steps = [
      ['Top of the fraction: ', 'Σ n(n − 1) = ' + terms.join(' + ') + ' = ' + values.join(' + ') + ' = ' + r.numerator],
      ['Total animals: ', 'N = ' + r.rows.map(function (row) { return row.n }).join(' + ') + ' = ' + r.total],
      ['Bottom of the fraction: ', 'N(N − 1) = ' + r.total + ' × ' + (r.total - 1) + ' = ' + r.denominator],
      ['Index: ', 'SDI = 1 − ' + r.numerator + ' / ' + r.denominator + ' = ' + fmt(r.sdi, 3) + ' (to 3 decimal places)'],
    ]
    var list = $('r-steps')
    list.textContent = ''
    steps.forEach(function (s) { list.appendChild(el('li', {}, [el('strong', { text: s[0] }), document.createTextNode(s[1])])) })
    lastWorking = steps.map(function (s, i) { return i + 1 + '. ' + s[0] + s[1] }).join('\n')
  }

  function copyWorking() {
    var done = function () { $('copied').textContent = 'Copied'; setTimeout(function () { $('copied').textContent = '' }, 2000) }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(lastWorking).then(done, function () { $('copied').textContent = 'Could not copy' })
    } else {
      var area = el('textarea', { 'aria-hidden': 'true' })
      area.value = lastWorking
      document.body.appendChild(area)
      area.select()
      try { document.execCommand('copy'); done() } catch (e) { $('copied').textContent = 'Could not copy' }
      document.body.removeChild(area)
    }
  }

  function initCalculator() {
    load('original')
    renderRows()
    update()
    $('sdi-form').addEventListener('submit', function (e) { e.preventDefault() })
    $('add-row').addEventListener('click', function () {
      if (rows.length >= MAX_SPECIES) return
      rows.push(makeRow('', ''))
      renderRows()
      update()
      $('name-' + rows[rows.length - 1].id).focus()
    })
    $('reset').addEventListener('click', function () { load('original'); renderRows(); update() })
    Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (b) {
      b.addEventListener('click', function () { load(b.getAttribute('data-preset')); renderRows(); update() })
    })
    $('copy').addEventListener('click', copyWorking)
  }

  /* ----------------------------------------------------------------- simulator */

  var CLASSIC = { a: 1, b: 0.1, d: 0.075, g: 1.5, x0: 10, y0: 5 }
  var SLIDERS = [
    { key: 'a', symbol: 'α', name: 'Prey growth rate', min: 0.2, max: 2, step: 0.05, hint: 'How fast prey breed when no predators are around.' },
    { key: 'b', symbol: 'β', name: 'Predation rate', min: 0.02, max: 0.3, step: 0.005, hint: 'How often a meeting ends with the prey being eaten.' },
    { key: 'd', symbol: 'δ', name: 'Predator efficiency', min: 0.02, max: 0.3, step: 0.005, hint: 'How well eaten prey turn into new predators.' },
    { key: 'g', symbol: 'γ', name: 'Predator death rate', min: 0.2, max: 2.5, step: 0.05, hint: 'How fast predators die out when there is no food.' },
    { key: 'x0', symbol: 'x₀', name: 'Starting prey', min: 2, max: 60, step: 1, hint: 'How many prey there are at the start.' },
    { key: 'y0', symbol: 'y₀', name: 'Starting predators', min: 1, max: 40, step: 1, hint: 'How many predators there are at the start.' },
  ]
  var sim = Object.assign({}, CLASSIC)
  var inputs = {}
  var outputs = {}
  var queued = false

  function niceMax(v) {
    var pow = Math.pow(10, Math.floor(Math.log10(v)))
    var f = v / pow
    var nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
    return nice * pow
  }

  var NS = 'http://www.w3.org/2000/svg'
  function s(tag, attrs, text) {
    var n = document.createElementNS(NS, tag)
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]) })
    if (text !== undefined) n.textContent = text
    return n
  }

  function drawTime(data, ymax, T) {
    var W = 640, H = 320, L = 46, R = 12, Tp = 14, B = 44
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet' })
    var X = function (t) { return L + (t / T) * (W - L - R) }
    var Y = function (v) { return H - B - (v / ymax) * (H - B - Tp) }
    for (var i = 0; i <= 4; i++) {
      var v = (ymax * i) / 4
      svg.appendChild(s('line', { class: 'grid', x1: L, x2: W - R, y1: Y(v), y2: Y(v) }))
      svg.appendChild(s('text', { x: L - 8, y: Y(v) + 4, 'text-anchor': 'end' }, String(Math.round(v * 10) / 10)))
    }
    var step = niceMax(T / 5)
    for (var t = 0; t <= T + 1e-9; t += step) {
      svg.appendChild(s('text', { x: X(t), y: H - 26, 'text-anchor': 'middle' }, String(Math.round(t * 10) / 10)))
    }
    svg.appendChild(s('line', { class: 'axis', x1: L, x2: W - R, y1: H - B, y2: H - B }))
    svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, 'Time'))
    var pts = function (series) { return data.t.map(function (t, i) { return X(t).toFixed(1) + ',' + Y(series[i]).toFixed(1) }).join(' ') }
    svg.appendChild(s('polyline', { class: 'line-prey', points: pts(data.x) }))
    svg.appendChild(s('polyline', { class: 'line-pred', points: pts(data.y) }))
    $('chart-time').textContent = ''
    $('chart-time').appendChild(svg)
  }

  function drawPhase(data, xmax, ymax, bal) {
    var W = 320, H = 320, L = 44, R = 12, Tp = 12, B = 38
    var svg = s('svg', { viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet' })
    var X = function (v) { return L + (v / xmax) * (W - L - R) }
    var Y = function (v) { return H - B - (v / ymax) * (H - B - Tp) }
    for (var i = 0; i <= 4; i++) {
      svg.appendChild(s('line', { class: 'grid', x1: L, x2: W - R, y1: Y((ymax * i) / 4), y2: Y((ymax * i) / 4) }))
      svg.appendChild(s('text', { x: L - 6, y: Y((ymax * i) / 4) + 4, 'text-anchor': 'end' }, String(Math.round(((ymax * i) / 4) * 10) / 10)))
      svg.appendChild(s('text', { x: X((xmax * i) / 4), y: H - B + 16, 'text-anchor': 'middle' }, String(Math.round(((xmax * i) / 4) * 10) / 10)))
    }
    svg.appendChild(s('line', { class: 'axis', x1: L, x2: W - R, y1: H - B, y2: H - B }))
    svg.appendChild(s('line', { class: 'axis', x1: L, x2: L, y1: Tp, y2: H - B }))
    svg.appendChild(s('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle' }, 'Prey'))
    svg.appendChild(s('text', { x: 12, y: (Tp + H - B) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 12 ' + (Tp + H - B) / 2 + ')' }, 'Predators'))
    svg.appendChild(s('polyline', { class: 'loop', points: data.x.map(function (v, i) { return X(v).toFixed(1) + ',' + Y(data.y[i]).toFixed(1) }).join(' ') }))
    svg.appendChild(s('circle', { class: 'dot', cx: X(data.x[0]), cy: Y(data.y[0]), r: 5 }))
    var ex = X(bal.prey), ey = Y(bal.predators)
    if (bal.prey <= xmax && bal.predators <= ymax) {
      svg.appendChild(s('path', { class: 'eq', d: 'M' + (ex - 5) + ',' + (ey - 5) + 'l10,10m0,-10l-10,10', stroke: 'currentColor', 'stroke-width': 2 }))
      svg.lastChild.setAttribute('style', 'stroke: var(--ink); fill: none')
    }
    $('chart-phase').textContent = ''
    $('chart-phase').appendChild(svg)
  }

  function runSim() {
    queued = false
    var p = { a: sim.a, b: sim.b, d: sim.d, g: sim.g }
    var bal = M.balance(p)
    var T = Math.max(15, Math.min(80, bal.period * 3))
    var data = M.simulate(p, sim.x0, sim.y0, T, 0.01, 5)
    var xmaxV = Math.max.apply(null, data.x)
    var ymaxV = Math.max.apply(null, data.y)
    drawTime(data, niceMax(Math.max(xmaxV, ymaxV) * 1.08), T)
    drawPhase(data, niceMax(xmaxV * 1.08), niceMax(ymaxV * 1.08), bal)
    $('sim-facts').textContent =
      'Balance point: ' + fmt(bal.prey, 1) + ' prey and ' + fmt(bal.predators, 1) + ' predators, where neither population would change. One cycle takes about ' + fmt(bal.period, 1) +
      ' time units. In this run the prey peak at ' + fmt(xmaxV, 0) + ' and the predators at ' + fmt(ymaxV, 0) + '.'
    $('chart-time').setAttribute('aria-label', 'Line chart of prey and predator populations over ' + fmt(T, 0) + ' time units. Prey peak at ' + fmt(xmaxV, 0) + ', predators at ' + fmt(ymaxV, 0) + '.')
  }
  function queueSim() { if (!queued) { queued = true; requestAnimationFrame(runSim) } }

  function initSimulator() {
    var host = $('sliders')
    SLIDERS.forEach(function (def) {
      var out = el('span', { class: 'val', id: 'val-' + def.key })
      var input = el('input', { type: 'range', id: 'sl-' + def.key, min: def.min, max: def.max, step: def.step, 'aria-describedby': 'hint-' + def.key })
      input.value = sim[def.key]
      inputs[def.key] = input
      outputs[def.key] = out
      var show = function () { out.textContent = Number(input.value) }
      show()
      input.addEventListener('input', function () { sim[def.key] = Number(input.value); show(); queueSim() })
      host.appendChild(el('div', { class: 'slider' }, [
        el('div', { class: 'slider-top' }, [el('label', { for: 'sl-' + def.key, text: def.symbol + '  ' + def.name }), out]),
        input,
        el('p', { class: 'hint', id: 'hint-' + def.key, text: def.hint }),
      ]))
    })
    $('sim-reset').addEventListener('click', function () {
      Object.assign(sim, CLASSIC)
      SLIDERS.forEach(function (d) { inputs[d.key].value = sim[d.key]; outputs[d.key].textContent = sim[d.key] })
      runSim()
    })
    runSim()
  }

  /* ------------------------------------------------------------ mountain model */

  var WIDTH = 100 // km, east to west
  var DEPTH = 75 // km, south to north
  var MAX_PEAKS = 6
  var RANGES = {
    single: { base: 3000, peaks: [{ x: 50, y: 37.5, h: 3500, sx: 14, sy: 14, angle: 0 }] },
    ridge: { base: 3000, peaks: [{ x: 50, y: 37.5, h: 3500, sx: 26, sy: 9, angle: 30 }] },
    range: {
      base: 3000,
      peaks: [
        { x: 20, y: 54, h: 2200, sx: 16, sy: 8, angle: 60 },
        { x: 35, y: 42, h: 3000, sx: 12, sy: 7, angle: 70 },
        { x: 50, y: 35, h: 3300, sx: 14, sy: 8, angle: 75 },
        { x: 65, y: 28, h: 2700, sx: 15, sy: 7, angle: 65 },
        { x: 80, y: 19, h: 1900, sx: 13, sy: 8, angle: 60 },
      ],
    },
  }
  var PEAK_SLIDERS = [
    { key: 'h', name: 'Height above base', unit: ' m', min: 300, max: 5000, step: 50, hint: 'H: how tall the summit stands above the base.' },
    { key: 'sx', name: 'Spread along the ridge', unit: ' km', min: 3, max: 40, step: 0.5, hint: 'σ₁: how far it stretches along its long axis.' },
    { key: 'sy', name: 'Spread across the ridge', unit: ' km', min: 3, max: 40, step: 0.5, hint: 'σ₂: how far it stretches the other way. Make σ₁ = σ₂ for a round peak.' },
    { key: 'angle', name: 'Direction of the ridge', unit: '°', min: 0, max: 180, step: 1, hint: 'Angle of the long axis, anticlockwise from east.' },
    { key: 'x', name: 'East–west position', unit: ' km', min: 0, max: WIDTH, step: 0.5, hint: 'Or drag the peak on the map.' },
    { key: 'y', name: 'North–south position', unit: ' km', min: 0, max: DEPTH, step: 0.5, hint: '' },
  ]
  var RAMP = [[0, [127, 154, 120]], [0.3, [183, 194, 143]], [0.55, [226, 207, 160]], [0.78, [184, 122, 88]], [1, [246, 244, 238]]]
  var mm = { base: 3000, peaks: [], sel: 0 }
  var mmInputs = {}
  var mmOut = {}
  var mmQueued = false

  function ramp(t) {
    t = Math.max(0, Math.min(1, t))
    for (var i = 1; i < RAMP.length; i++) {
      if (t <= RAMP[i][0]) {
        var a = RAMP[i - 1], b = RAMP[i]
        var f = (t - a[0]) / (b[0] - a[0])
        return [a[1][0] + (b[1][0] - a[1][0]) * f, a[1][1] + (b[1][1] - a[1][1]) * f, a[1][2] + (b[1][2] - a[1][2]) * f]
      }
    }
    return RAMP[RAMP.length - 1][1]
  }

  function loadRange(name) {
    var r = RANGES[name]
    mm.base = r.base
    mm.peaks = r.peaks.map(function (p) { return Object.assign({}, p) })
    mm.sel = 0
    syncMountain()
  }

  function pickInterval(span) {
    var options = [50, 100, 200, 250, 500, 1000, 2000]
    for (var i = 0; i < options.length; i++) if (span / options[i] <= 14) return options[i]
    return 2000
  }

  function drawMap(g) {
    var canvas = $('mm-map')
    var ctx = canvas.getContext('2d')
    var W = canvas.width, H = canvas.height
    var nx = 320, ny = 240
    var gg = M.grid(mm.peaks, mm.base, WIDTH, DEPTH, nx, ny)
    var span = Math.max(1, gg.max - gg.min)
    var iv = pickInterval(span)
    $('mm-interval').textContent = iv
    var off = document.createElement('canvas')
    off.width = nx
    off.height = ny
    var octx = off.getContext('2d')
    var img = octx.createImageData(nx, ny)
    for (var j = 0; j < ny; j++) {
      var row = gg.rows[ny - 1 - j] // north at the top
      var below = j < ny - 1 ? gg.rows[ny - 2 - j] : null
      for (var i = 0; i < nx; i++) {
        var h = row[i]
        var c = ramp((h - gg.min) / span)
        var band = Math.floor(h / iv)
        var edge = (i < nx - 1 && Math.floor(row[i + 1] / iv) !== band) || (below && Math.floor(below[i] / iv) !== band)
        var k = (j * nx + i) * 4
        var m = edge ? 0.62 : 1
        img.data[k] = c[0] * m
        img.data[k + 1] = c[1] * m
        img.data[k + 2] = c[2] * m
        img.data[k + 3] = 255
      }
    }
    octx.putImageData(img, 0, 0)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(off, 0, 0, W, H)

    var pxPerKm = W / WIDTH
    var cx = function (x) { return (x / WIDTH) * W }
    var cy = function (y) { return (1 - y / DEPTH) * H }

    // the outline of the selected peak at a tenth of its height
    var sel = mm.peaks[mm.sel]
    if (sel) {
      var f = M.peakFacts(sel)
      ctx.save()
      ctx.setLineDash([6, 5])
      ctx.lineWidth = 2
      ctx.strokeStyle = 'rgba(31,46,38,0.85)'
      ctx.beginPath()
      ctx.ellipse(cx(sel.x), cy(sel.y), f.footprintAxes[0] * pxPerKm, f.footprintAxes[1] * pxPerKm, -(sel.angle * Math.PI) / 180, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
    mm.peaks.forEach(function (p, i) {
      var isSel = i === mm.sel
      ctx.beginPath()
      ctx.arc(cx(p.x), cy(p.y), isSel ? 11 : 9, 0, Math.PI * 2)
      ctx.fillStyle = isSel ? '#2f6f6c' : 'rgba(31,46,38,0.78)'
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#fff'
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.font = '700 11px Inter, Arial, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(i + 1), cx(p.x), cy(p.y) + 0.5)
    })
    // scale bar
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fillRect(12, H - 34, 25 * pxPerKm + 24, 24)
    ctx.fillStyle = '#1f2e26'
    ctx.fillRect(24, H - 20, 25 * pxPerKm, 3)
    ctx.font = '600 11px Inter, Arial, sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText('25 km', 24, H - 25)
    ctx.textAlign = 'right'
    ctx.fillText('N ↑', W - 12, 20)
    return gg
  }

  function drawRelief(gMap) {
    var canvas = $('mm-relief')
    var ctx = canvas.getContext('2d')
    var W = canvas.width, H = canvas.height
    var rows = 56, cols = 150
    var g = M.grid(mm.peaks, mm.base, WIDTH, DEPTH, cols, rows)
    var span = Math.max(1, g.max - g.min)
    var style = getComputedStyle(document.documentElement)
    ctx.fillStyle = style.getPropertyValue('--bg').trim() || '#f6f7f0'
    ctx.fillRect(0, 0, W, H)
    var padX = 24, shear = 46, depthPx = 96, liftPx = 130
    var bottom = H - 16
    var step = depthPx / (rows - 1)
    var widthPx = W - padX * 2 - shear
    for (var j = rows - 1; j >= 0; j--) { // far (north) rows first
      var d = j / (rows - 1)
      var baseline = bottom - d * depthPx
      var row = g.rows[j]
      for (var i = 0; i < cols - 1; i++) {
        var x0 = padX + (i / (cols - 1)) * widthPx + d * shear
        var x1 = padX + ((i + 1) / (cols - 1)) * widthPx + d * shear
        var l0 = ((row[i] - g.min) / span) * liftPx
        var l1 = ((row[i + 1] - g.min) / span) * liftPx
        var c = ramp((row[i] - g.min) / span)
        var shade = 1 - d * 0.18 // far rows a little paler, for depth
        ctx.fillStyle = 'rgb(' + Math.round(c[0] * shade + 255 * (1 - shade) * 0.5) + ',' + Math.round(c[1] * shade + 255 * (1 - shade) * 0.5) + ',' + Math.round(c[2] * shade + 255 * (1 - shade) * 0.5) + ')'
        ctx.beginPath()
        ctx.moveTo(x0, baseline - l0)
        ctx.lineTo(x1 + 0.6, baseline - l1)
        ctx.lineTo(x1 + 0.6, baseline + step + 1)
        ctx.lineTo(x0, baseline + step + 1)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = 'rgba(31,46,38,0.28)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x0, baseline - l0)
        ctx.lineTo(x1, baseline - l1)
        ctx.stroke()
      }
    }
    return g
  }

  function selectedFacts() {
    var p = mm.peaks[mm.sel]
    if (!p) return
    var f = M.peakFacts(p)
    var items = [
      ['Summit above the base', Math.round(p.h).toLocaleString() + ' m'],
      ['Steepest slope', fmt(f.steepestSlopeDeg, 0) + '°'],
      ['Width at half height', fmt(f.halfHeightWidthAlong, 0) + ' × ' + fmt(f.halfHeightWidthAcross, 0) + ' km'],
      ['Footprint at a tenth of the height', Math.round(f.footprintArea).toLocaleString() + ' km²'],
      ['Rock above the base', (f.volume >= 100 ? Math.round(f.volume).toLocaleString() : fmt(f.volume, 1)) + ' km³'],
      ['Shape', f.axisRatio < 1.05 ? 'Round' : fmt(f.axisRatio, 1) + ' : 1 elliptical'],
    ]
    var list = $('mm-facts')
    list.textContent = ''
    items.forEach(function (it) { list.appendChild(el('div', {}, [el('dt', { text: it[0] }), el('dd', { text: it[1] })])) })
  }

  function renderMountain() {
    mmQueued = false
    var gm = drawMap()
    drawRelief(gm)
    selectedFacts()
    var top = gm.top
    $('mm-summary').textContent =
      'Highest point of the range: ' + Math.round(top.h).toLocaleString() + ' m, ' + fmt(top.x, 0) + ' km east and ' + fmt(top.y, 0) + ' km north on the map. The lowest ground is the base at ' + Math.round(gm.min).toLocaleString() + ' m. The vertical scale in the side view is exaggerated.'
    $('mm-map').setAttribute('aria-label', 'Contour map of a range of ' + mm.peaks.length + ' modelled peaks. The highest point is ' + Math.round(top.h) + ' metres.')
  }
  function queueMountain() { if (!mmQueued) { mmQueued = true; requestAnimationFrame(renderMountain) } }

  function showSliderValues() {
    var p = mm.peaks[mm.sel]
    mmInputs.base.value = mm.base
    mmOut.base.textContent = mm.base.toLocaleString() + ' m'
    PEAK_SLIDERS.forEach(function (d) {
      mmInputs[d.key].value = p[d.key]
      mmOut[d.key].textContent = Number(p[d.key]).toLocaleString() + d.unit
    })
  }

  function renderTabs() {
    var host = $('peak-tabs')
    host.textContent = ''
    mm.peaks.forEach(function (p, i) {
      var b = el('button', { type: 'button', class: 'chip', 'aria-pressed': i === mm.sel ? 'true' : 'false', text: 'Peak ' + (i + 1) })
      b.addEventListener('click', function () { mm.sel = i; syncMountain() })
      host.appendChild(b)
    })
    $('peak-add').disabled = mm.peaks.length >= MAX_PEAKS
    $('peak-remove').disabled = mm.peaks.length <= 1
  }

  function syncMountain() { renderTabs(); showSliderValues(); renderMountain() }

  function initMountain() {
    var host = $('mm-sliders')
    var all = [{ key: 'base', name: 'Height above the base (the plateau)', unit: ' m', min: 0, max: 4500, step: 100, hint: 'The height of the ground the peaks stand on.', global: true }].concat(PEAK_SLIDERS)
    all.forEach(function (def) {
      var out = el('span', { class: 'val' })
      var input = el('input', { type: 'range', id: 'mm-' + def.key, min: def.min, max: def.max, step: def.step, 'aria-describedby': 'mm-hint-' + def.key })
      mmInputs[def.key] = input
      mmOut[def.key] = out
      input.addEventListener('input', function () {
        var v = Number(input.value)
        if (def.global) mm.base = v
        else mm.peaks[mm.sel][def.key] = v
        out.textContent = v.toLocaleString() + def.unit
        queueMountain()
      })
      host.appendChild(el('div', { class: 'slider' }, [
        el('div', { class: 'slider-top' }, [el('label', { for: 'mm-' + def.key, text: def.name }), out]),
        input,
        def.hint ? el('p', { class: 'hint', id: 'mm-hint-' + def.key, text: def.hint }) : el('span', { id: 'mm-hint-' + def.key }),
      ]))
    })
    Array.prototype.forEach.call(document.querySelectorAll('[data-range]'), function (b) {
      b.addEventListener('click', function () { loadRange(b.getAttribute('data-range')) })
    })
    $('peak-add').addEventListener('click', function () {
      if (mm.peaks.length >= MAX_PEAKS) return
      mm.peaks.push({ x: 50 + mm.peaks.length * 3, y: 37.5, h: 2500, sx: 10, sy: 10, angle: 0 })
      mm.sel = mm.peaks.length - 1
      syncMountain()
    })
    $('peak-remove').addEventListener('click', function () {
      if (mm.peaks.length <= 1) return
      mm.peaks.splice(mm.sel, 1)
      mm.sel = Math.max(0, mm.sel - 1)
      syncMountain()
    })

    // dragging a peak on the map
    var canvas = $('mm-map')
    var dragging = -1
    var where = function (e) {
      var r = canvas.getBoundingClientRect()
      return { px: ((e.clientX - r.left) / r.width) * canvas.width, py: ((e.clientY - r.top) / r.height) * canvas.height }
    }
    canvas.addEventListener('pointerdown', function (e) {
      var w = where(e)
      var best = -1, bestD = 30
      mm.peaks.forEach(function (p, i) {
        var d = Math.hypot((p.x / WIDTH) * canvas.width - w.px, (1 - p.y / DEPTH) * canvas.height - w.py)
        if (d < bestD) { best = i; bestD = d }
      })
      if (best < 0) return
      dragging = best
      mm.sel = best
      canvas.setPointerCapture(e.pointerId)
      canvas.classList.add('dragging')
      renderTabs()
      showSliderValues()
      queueMountain()
    })
    canvas.addEventListener('pointermove', function (e) {
      if (dragging < 0) return
      var w = where(e)
      var p = mm.peaks[dragging]
      p.x = Math.round(Math.max(0, Math.min(WIDTH, (w.px / canvas.width) * WIDTH)) * 2) / 2
      p.y = Math.round(Math.max(0, Math.min(DEPTH, (1 - w.py / canvas.height) * DEPTH)) * 2) / 2
      showSliderValues()
      queueMountain()
    })
    var stop = function () { dragging = -1; canvas.classList.remove('dragging') }
    canvas.addEventListener('pointerup', stop)
    canvas.addEventListener('pointercancel', stop)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', queueMountain)

    loadRange('range')
  }

  initCalculator()
  initSimulator()
  initMountain()
})()
