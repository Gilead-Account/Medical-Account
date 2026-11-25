import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  escapeBelongsToFieldControl,
  isDirectBackdropClick,
} from '../src/lib/helper/modalDismiss.js';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('native desktop field popups consume Escape without closing their modal', () => {
  assert.equal(escapeBelongsToFieldControl({ target: { tagName: 'SELECT' } }), true);
  assert.equal(escapeBelongsToFieldControl({ target: { tagName: 'INPUT', type: 'date' } }), true);
  assert.equal(escapeBelongsToFieldControl({ defaultPrevented: true }), true);
  assert.equal(
    escapeBelongsToFieldControl({ target: { closest: (selector) => selector === '.field-help' } }),
    true
  );
  assert.equal(escapeBelongsToFieldControl({ target: { tagName: 'TEXTAREA' } }), false);
});

test('backdrop dismissal only accepts a direct backdrop click', () => {
  const backdrop = {};
  assert.equal(isDirectBackdropClick({ target: backdrop, currentTarget: backdrop }), true);
  assert.equal(isDirectBackdropClick({ target: {}, currentTarget: backdrop }), false);
});

test('medical tactic modals guard desktop Escape and descendant click events', async () => {
  const [newModal, editModal, combinedModal, fieldHelp] = await Promise.all([
    source('../src/pages/CriticalActivities/CriticalActivityNewModal.jsx'),
    source('../src/pages/CriticalActivities/CriticalActivityEditModal.jsx'),
    source('../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx'),
    source('../src/components/EditModalField.jsx'),
  ]);

  for (const modal of [newModal, editModal, combinedModal]) {
    assert.match(modal, /escapeBelongsToFieldControl/);
    assert.match(modal, /isDirectBackdropClick/);
  }
  assert.match(fieldHelp, /e\.preventDefault\(\);[\s\S]*?e\.stopPropagation\(\);[\s\S]*?setIsOpen\(false\)/);
});

test('background activity refreshes update rows without dismissing an in-progress modal', async () => {
  const [page, newModal] = await Promise.all([
    source('../src/pages/CriticalActivities/index.jsx'),
    source('../src/pages/CriticalActivities/CriticalActivityNewModal.jsx'),
  ]);
  const refreshEffect = page.match(
    /useEffect\(\(\) => \{\s*setActivityRows\(activities\);[\s\S]*?\}, \[activities\]\);/
  )?.[0] || '';

  assert.ok(refreshEffect);
  assert.doesNotMatch(refreshEffect, /setEditingActivity\(null\)/);
  assert.doesNotMatch(refreshEffect, /setIsNewActivityOpen\(false\)/);
  assert.doesNotMatch(
    newModal,
    /setForm\(buildInitialForm\(statusOptions, parentRecord, relatedOptions\)\);\s*\}, \[statusOptions, parentRecord\?\.id, relatedOptions\]\)/
  );
});
