import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageSource = await readFile(
  new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url),
  'utf8'
);
test('Barriers and Opportunities does not expose a commercial barriers and drivers tab', () => {
  assert.doesNotMatch(pageSource, /key:\s*'commercial'/);
  assert.doesNotMatch(pageSource, /Commercial Barriers and Drivers/);
  assert.doesNotMatch(pageSource, /commercialBarriersHeading|commercialDriversHeading/);
});
