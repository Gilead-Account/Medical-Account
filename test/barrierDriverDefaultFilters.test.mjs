import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const barriersDriversPagePath = new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url);
const barriersDriversCssPath = new URL('../src/pages/BarriersDrivers/BarriersDrivers.css', import.meta.url);
const mainCssPath = new URL('../src/styles/main.css', import.meta.url);

test('Barriers and Drivers opens on active barriers with the Active status card selected', async () => {
  const source = await readFile(barriersDriversPagePath, 'utf8');

  assert.match(source, /const DEFAULT_FILTERS = \{\s*type: 'All',\s*indication: 'All',\s*strategy: 'All',\s*status: 'Active'/);
  assert.match(source, /const \[tab,\s*setTab\] = useState\('barriers'\)/);
  assert.match(source, /className=\{`mock-kpi-card bd-status-card \$\{filters\.status === 'Active' \? 'is-active' : ''\}`\}/);
  assert.match(source, /aria-pressed=\{filters\.status === 'Active'\}/);
  assert.match(source, /<option value="Active">Active \{activeRecordTypeLabel\}<\/option>/);
});

test('Barriers and Drivers exposes a dynamic strategy filter next to indication', async () => {
  const source = await readFile(barriersDriversPagePath, 'utf8');

  assert.match(source, /strategy: 'All'/);
  assert.match(source, /const recordMatchesStrategy = \(record, strategy\) =>/);
  assert.match(source, /const strategyOptionsForFilter = \(picklists, tab, indicationFilter\) =>/);
  assert.match(source, /const type = tab === 'drivers' \? 'Driver' : 'Barrier'/);
  assert.match(source, /const allowedIndications = filterBarrierDriverIndicationsForType\(picklists\?\.barrierDriverIndications, type\)/);
  assert.match(source, /optionsForControllerValue\(picklists\?\.strategyOptionsByIndication, indication\)/);
  assert.match(source, /fallbackStrategiesForIndication\(picklists, indication\)/);
  assert.match(source, /strategyOptionsForFilter\(picklists, tab, filters\.indication\)/);
  assert.match(source, /recordMatchesStrategy\(r, filters\.strategy\)/);
  assert.match(source, /name="barrierDriverStrategyFilter"/);
  assert.match(source, /opt === 'All' \? 'Select strategy' : strategyLabelForValue\(picklists, opt\)/);
});

test('Barriers and Drivers keeps the strategy filter on the desktop row', async () => {
  const css = await readFile(barriersDriversCssPath, 'utf8');
  const mainCss = await readFile(mainCssPath, 'utf8');

  assert.match(css, /\.bd-filter-select-box\s*\{[^}]*?grid-template-columns:\s*repeat\(3,\s*minmax\(150px,\s*190px\)\)/);
  assert.match(mainCss, /\.bd-filter-select-box\s*\{[^}]*?grid-template-columns:\s*repeat\(3,\s*minmax\(150px,\s*190px\)\)/);
});

test('Barriers and Drivers keeps the three filters and add action visible through iPad Pro landscape', async () => {
  const css = await readFile(barriersDriversCssPath, 'utf8');
  const mainCss = await readFile(mainCssPath, 'utf8');
  const responsiveToolbarRules = css.slice(css.lastIndexOf('/* Keep the toolbar fluid through iPad Pro landscape'));

  assert.match(responsiveToolbarRules, /@media \(min-width: 721px\) and \(max-width: 1400px\)[\s\S]*?\.bd-command-body[\s\S]*?grid-template-columns:\s*max-content minmax\(0,\s*1fr\)/);
  assert.match(responsiveToolbarRules, /\.mock-filter-row\.bd-filter-strip[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) 116px[\s\S]*?box-sizing:\s*border-box[\s\S]*?padding-right:\s*8px/);
  assert.match(responsiveToolbarRules, /\.mock-filter-row\.bd-filter-strip[\s\S]*?grid-auto-flow:\s*column/);
  assert.match(responsiveToolbarRules, /\.bd-filter-select-box[\s\S]*?grid-column:\s*1[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(responsiveToolbarRules, /\.bd-filter-add-button[\s\S]*?grid-column:\s*2[\s\S]*?width:\s*100%/);
  assert.match(css, /@media \(min-width: 721px\) and \(max-width: 900px\)[\s\S]*?\.bd-command-body[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(mainCss, /@media \(min-width: 721px\) and \(max-width: 1180px\)[\s\S]*?\.mock-filter-row\.bd-filter-strip[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) auto/);
  assert.match(mainCss, /@media \(min-width: 721px\) and \(max-width: 1180px\)[\s\S]*?\.bd-filter-select-box[\s\S]*?grid-column:\s*1[\s\S]*?grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mainCss, /@media \(min-width: 721px\) and \(max-width: 1180px\)[\s\S]*?\.bd-filter-add-button[\s\S]*?grid-column:\s*2/);
});
