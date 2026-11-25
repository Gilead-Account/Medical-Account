import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('completed Medical Tactic surfaces contain no 90-day filter or wording', async () => {
  const sources = await Promise.all([
    source('../src/lib/dataservice/accountPlan/criticalActivities.js'),
    source('../src/lib/dataservice/accountPlan/barriersDrivers.js'),
    source('../src/pages/CriticalActivities/index.jsx'),
    source('../src/pages/BarriersDrivers/index.jsx'),
    source('../src/lib/helper/utils.js'),
  ]);

  for (const content of sources) {
    assert.doesNotMatch(content, /90[ -]?days?|last 90/i);
  }
});
