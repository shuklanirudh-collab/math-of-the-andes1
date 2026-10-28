# Math of the Andes

A school project by the Chinchillas, rebuilt. A fast, accessible, mobile-friendly website about how mathematics helps us understand and protect life in the Andes.

**What is on the page**

- **Simpson's Diversity Index calculator.** Any number of species (2 to 12, with Andean animals suggested), live results as you type, a plain-English reading, effective species and evenness, share bars, and the full working with a copy button. Includes the original worked example (13 chinchillas and 15 condors gives 0.516).
- **Predator and prey simulator.** The Lotka-Volterra equations solved with Runge-Kutta, with sliders for every parameter, a time chart and a phase loop.
- **Gaussian / elliptical peak model of the Andes.** One equation describes a mountain; stretch it unevenly and its contours become ellipses (a ridge); add up to six peaks on a base height to build a range. A contour map (drag the peaks), a side view, sliders for height, spread, direction and position, and the facts of the selected peak: steepest slope, width at half height, footprint, and the volume of rock.
- **The three animals**, their conservation status, and a simplified food chain.
- **The documentary**, with a poster frame and lazy loading.
- Dark mode, keyboard and screen-reader friendly, works on phones. The old `sdi.html` link redirects to the calculator.

## Run it

Open `index.html`, or for a proper local server (needed for video seeking):

```
npm start        # http://localhost:8080
npm test         # checks the maths (19 tests)
```

No build step and no dependencies: plain HTML, CSS and JavaScript.

## Publish it (GitHub Pages)

1. Put this folder in a GitHub repository (the folder's contents at the top level of the repo).
2. Repository **Settings > Pages**, set the source to the `main` branch and the `/ (root)` folder.
3. The site appears at `https://<username>.github.io/<repository>/`.

The documentary is about 21 MB, which is fine for GitHub (single files can be up to 100 MB).

## Structure

```
index.html            the page
css/style.css         all styling (light and dark)
js/sdi-math.js        Simpson's index maths (no page code, tested)
js/lotka-volterra.js  predator-prey maths (no page code, tested)
js/peak-model.js      Gaussian / elliptical peak maths (no page code, tested)
js/app.js             the calculator and simulator interface
assets/               documentary, poster, favicon
tests/                node:test checks of the maths
tools/serve.js        tiny local server
sdi.html              redirect from the old calculator address
```

## Notes

- Conservation status follows the IUCN Red List: chinchillas and the Andean mountain cat are Endangered, the Andean condor is Vulnerable. Check iucnredlist.org for the latest.
- The first version used a stock cartoon chinchilla as its icon. It carried a stock-site watermark, so it was replaced with an original icon.
