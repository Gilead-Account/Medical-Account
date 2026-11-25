import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const summarySource = await readFile(
  new URL('../src/pages/Overview/BarriersDriversSummary.jsx', import.meta.url),
  'utf8'
);
const overviewCss = await readFile(
  new URL('../src/pages/Overview/Overview.css', import.meta.url),
  'utf8'
);

test('Home Barriers and Opportunities table omits category and business impact and uses type-specific titles', () => {
  assert.match(summarySource, /truncateDisplay,\s*statusTone/);
  assert.match(summarySource, /const toneClass = \(tone\) =>/);
  assert.match(summarySource, /type === 'Driver' \? 'Opportunity Title' : 'Barrier Title'/);
  assert.match(summarySource, /key:\s*'status',\s*label:\s*'Status'/);
  assert.match(summarySource, /home-summary-status-cell/);
  assert.doesNotMatch(summarySource, /key:\s*'category'|row\.category|Business Impact|home-summary-impact-cell|impactTone/);
  assert.match(summarySource, /home-summary-indication-cell/);
  assert.match(summarySource, /home-summary-activity-count-cell/);
  assert.match(summarySource, /home-summary-tone-text/);
  assert.match(summarySource, /home-summary-plain-text/);
  assert.match(summarySource, /home-summary-columns \$\{table\.tone \|\| ''\}/);
  assert.doesNotMatch(summarySource, /className=\{`pill/);
  assert.doesNotMatch(summarySource, /chip-blue/);
  assert.match(overviewCss, /--home-right-column:\s*minmax\(320px,\s*0\.72fr\)/);
  assert.match(overviewCss, /home-summary-columns,[\s\S]*?home-summary-row[\s\S]*?grid-template-columns:[\s\S]*?minmax\(220px,\s*1\.9fr\)[\s\S]*?minmax\(96px,\s*0\.82fr\)[\s\S]*?minmax\(72px,\s*0\.56fr\)\s*!important/);
  assert.match(overviewCss, /home-summary-columns,[\s\S]*?home-summary-row[\s\S]*?column-gap:\s*12px/);
  assert.match(overviewCss, /home-summary-columns[\s\S]*?font-size:\s*11\.5px/);
  assert.match(overviewCss, /home-summary-columns > span[\s\S]*?white-space:\s*normal/);
  assert.match(overviewCss, /home-summary-columns > span[\s\S]*?box-sizing:\s*border-box/);
  assert.match(overviewCss, /home-summary-columns > span[\s\S]*?min-width:\s*0/);
  assert.match(overviewCss, /home-summary-columns > span[\s\S]*?max-width:\s*100%/);
  assert.match(overviewCss, /home-summary-columns > span[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(overviewCss, /home-summary-columns > span[\s\S]*?font-weight:\s*950/);
  assert.match(overviewCss, /@media \(min-width:\s*721px\) and \(max-width:\s*1400px\)[\s\S]*?home-summary-columns[\s\S]*?font-size:\s*9px/);
  assert.match(overviewCss, /@media \(min-width:\s*721px\) and \(max-width:\s*1400px\)[\s\S]*?grid-template-columns:[\s\S]*?minmax\(112px,\s*1\.72fr\)[\s\S]*?minmax\(58px,\s*0\.7fr\)[\s\S]*?minmax\(54px,\s*0\.64fr\)[\s\S]*?minmax\(50px,\s*0\.54fr\)/);
  assert.match(overviewCss, /home-summary-table \+ \.home-summary-table[\s\S]*?margin-top:\s*12px\s*!important/);
  assert.match(overviewCss, /home-bd-summary-card \.home-summary-table-head[\s\S]*?height:\s*42px[\s\S]*?max-height:\s*42px/);
  assert.match(overviewCss, /home-bd-summary-card \.home-summary-table[\s\S]*?flex:\s*0 0 auto\s*!important[\s\S]*?grid-template-rows:\s*max-content max-content max-content/);
  assert.match(overviewCss, /home-bd-summary-card[\s\S]*?align-content:\s*start[\s\S]*?grid-auto-rows:\s*max-content/);
  assert.doesNotMatch(overviewCss, /home-summary-table-head\.barrier\s*\{[\s\S]*?height:/);
  assert.match(overviewCss, /home-summary-columns > span:nth-child\(4\)[\s\S]*?home-summary-activity-count-cell[\s\S]*?width:\s*64px/);
  assert.match(overviewCss, /home-summary-columns\.barrier > span[\s\S]*?color:\s*#00658c/);
  assert.match(overviewCss, /home-summary-columns\.driver > span[\s\S]*?color:\s*#176f45/);
  assert.match(overviewCss, /home-summary-table-head\.driver \.summary-counts[\s\S]*?background:\s*#eef8f3[\s\S]*?color:\s*#176f45/);
  assert.match(overviewCss, /home-summary-tone-text\.is-positive[\s\S]*?color:\s*var\(--green\)/);
  assert.match(overviewCss, /home-summary-tone-text\.is-negative[\s\S]*?color:\s*var\(--danger\)/);
  assert.match(overviewCss, /home-summary-plain-text[\s\S]*?color:\s*#33566b/);
});
