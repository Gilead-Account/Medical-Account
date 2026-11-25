import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const overviewCssPath = new URL('../src/pages/Overview/Overview.css', import.meta.url);
const summaryPath = new URL('../src/pages/Overview/BarriersDriversSummary.jsx', import.meta.url);

test('Home Status and Indication headings align with their centered row values', async () => {
  const [css, summary] = await Promise.all([
    readFile(overviewCssPath, 'utf8'),
    readFile(summaryPath, 'utf8'),
  ]);

  assert.match(
    summary,
    /key: 'name'[\s\S]*?key: 'status'[\s\S]*?key: 'indication'[\s\S]*?key: 'activityCount'/
  );
  assert.match(
    css,
    /home-summary-columns > span:nth-child\(2\),[\s\S]*?home-summary-columns > span:nth-child\(3\)[\s\S]*?text-align:\s*center;/
  );
  assert.match(
    css,
    /home-summary-status-cell,[\s\S]*?home-summary-indication-cell[\s\S]*?justify-content:\s*center;/
  );
});
