import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import { load } from "./home-test-loader.mjs";
const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { WeatherIcon } = load("components/app/home/WeatherIcon");
const { weatherCondition, weatherLabel } = load("features/home/presentation");
const { HOME_STRINGS } = load("features/home/strings");
const groups = {
  clear: [0], partlyCloudy: [1, 2], cloudy: [3], fog: [45, 48],
  rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
  snow: [71, 73, 75, 77, 85, 86], thunder: [95, 96, 99], unknown: [null, -1, 100],
};
const paths = new Set();
for (const [condition, codes] of Object.entries(groups)) {
  let shape;
  for (const code of codes) {
    assert.equal(weatherCondition(code), condition);
    assert.equal(weatherLabel(code), HOME_STRINGS.labels.weatherConditions[condition]);
    const dom = new JSDOM(renderToStaticMarkup(React.createElement(WeatherIcon, { code })));
    const svg = dom.window.document.querySelector("svg");
    assert.equal(svg.getAttribute("stroke"), "black");
    assert.equal(svg.getAttribute("fill"), "none");
    assert.equal(svg.getAttribute("aria-hidden"), "true");
    const d = svg.querySelector("path").getAttribute("d");
    if (shape) assert.equal(d, shape);
    shape = d;
    dom.window.close();
  }
  paths.add(shape);
}
assert.equal(paths.size, Object.keys(groups).length, "each weather condition has its own icon");
const source = (file) => fs.readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
const home = source("components/app/screens/HomeTabScreen.tsx");
assert.match(home, /truncate text-left text-sm font-normal underline/);
assert.match(home, /<WeatherIcon code=\{weather.daily.weatherCode\} \/>/);
assert.match(home, /border-\[var\(--primary\)\] bg-\[var\(--primary\)\]/);
assert.match(source("components/app/home/RecordConfirmationDialog.tsx"), /bg-\[var\(--primary\)\]/);
const sources = source("components/app/home/WeatherSources.tsx");
assert.match(sources, /ⓘ/);
assert.doesNotMatch(sources, /rounded-full|\bborder\b.*text-sm/);
console.log("PASS home UI: weather SVGs and labels, region typography, accent colors, single information circle");
