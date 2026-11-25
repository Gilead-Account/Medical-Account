import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('new Medical Tactics default Accountable to MSL in every create flow', async () => {
  const [newModal, combinedModal, editModal] = await Promise.all([
    source('../src/pages/CriticalActivities/CriticalActivityNewModal.jsx'),
    source('../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx'),
    source('../src/pages/CriticalActivities/CriticalActivityEditModal.jsx'),
  ]);

  assert.match(newModal, /accountable: 'MSL'/);
  assert.match(combinedModal, /const buildInitialTacticForm[\s\S]*?accountable: 'MSL'/);
  assert.match(editModal, /accountable: activity\?\.ownerLabel \|\| ''/);
});
