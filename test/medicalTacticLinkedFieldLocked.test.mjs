import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Medical Tactic edit modal locks the linked Barrier/Opportunity field', async () => {
  const source = await read('../src/pages/CriticalActivities/CriticalActivityEditModal.jsx');

  assert.match(source, /const isEdit = !!activity\?\.id/);
  assert.match(
    source,
    /value=\{form\.parentId\}[\s\S]*?disabled=\{isEdit \|\| !hasRelatedOptions\}[\s\S]*?aria-disabled=\{isEdit \|\| !hasRelatedOptions\}/
  );
});

test('New Medical Tactic modal still permits selecting an unlocked parent', async () => {
  const source = await read('../src/pages/CriticalActivities/CriticalActivityNewModal.jsx');

  assert.match(source, /lockedParentOption \?/);
  assert.match(source, /value=\{form\.parentId\}[\s\S]*?disabled=\{!hasRelatedOptions\}/);
  assert.doesNotMatch(source, /disabled=\{isEdit \|\| !hasRelatedOptions\}/);
});
