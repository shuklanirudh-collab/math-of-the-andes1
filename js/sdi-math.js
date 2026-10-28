/* Simpson's Diversity Index: the maths only, with no page in it, so it can be tested on its own.
   D  = sum of n(n-1) over all species, divided by N(N-1)   (chance that two animals picked at random are the same species)
   SDI = 1 - D                                               (chance that they are different species) */
(function (root, factory) {
  var api = factory()
  if (typeof module === 'object' && module.exports) module.exports = api
  else root.AndesMath = Object.assign(root.AndesMath || {}, api)
})(typeof self !== 'undefined' ? self : this, function () {
  // counts: an array of { name, count }. Returns the full working, or { ok: false, reason }.
  function analyse(species) {
    var rows = []
    for (var i = 0; i < species.length; i++) {
      var n = species[i].count
      if (!Number.isInteger(n) || n < 0) return { ok: false, reason: 'Every population must be a whole number, 0 or more.' }
      rows.push({ name: species[i].name, n: n, nn1: n * (n - 1) })
    }
    var total = 0
    var numerator = 0
    var richness = 0
    for (var j = 0; j < rows.length; j++) {
      total += rows[j].n
      numerator += rows[j].nn1
      if (rows[j].n > 0) richness++
    }
    if (total < 2) return { ok: false, reason: 'The index needs at least 2 animals in total, because it compares pairs of them.' }
    var denominator = total * (total - 1)
    var dominance = numerator / denominator
    var sdi = 1 - dominance
    var inverse = dominance > 0 ? 1 / dominance : null // the "effective number of species"
    var evenness = null
    if (richness > 1) evenness = inverse === null ? 1 : Math.min(1, inverse / richness)
    return {
      ok: true,
      rows: rows,
      total: total,
      numerator: numerator,
      denominator: denominator,
      dominance: dominance,
      sdi: sdi,
      inverse: inverse,
      richness: richness,
      evenness: evenness,
    }
  }

  // A plain-English reading of the result, in terms of how evenly the animals are spread.
  function describe(r) {
    if (!r.ok) return ''
    if (r.richness <= 1) return 'Only one species is present, so there is no diversity at all: any two animals you pick will be the same kind.'
    if (r.evenness === null || r.evenness >= 0.9) return 'The animals are spread very evenly across the species, so for this many species the area is about as diverse as it can be.'
    if (r.evenness >= 0.7) return 'The species are fairly evenly balanced. One or two are a little more common than the rest.'
    if (r.evenness >= 0.45) return 'One or two species make up most of the animals, which pulls the diversity down.'
    return 'A single species dominates. Even with several species present, most random pairs of animals would be the same kind.'
  }

  // Relative abundance of each species, as a fraction of the total, for the bars.
  function shares(r) {
    if (!r.ok) return []
    return r.rows.map(function (row) {
      return { name: row.name, n: row.n, share: row.n / r.total }
    })
  }

  return { analyse: analyse, describe: describe, shares: shares }
})
