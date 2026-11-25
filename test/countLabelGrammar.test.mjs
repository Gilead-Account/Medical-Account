import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { countNoun, formatCountLabel } from '../src/lib/helper/utils.js';

test('count labels stay singular at zero and one, then become plural', () => {
  assert.equal(formatCountLabel(0, 'Team Member'), '0 Team Member');
  assert.equal(formatCountLabel(1, 'Team Member'), '1 Team Member');
  assert.equal(formatCountLabel(2, 'Team Member'), '2 Team Members');
  assert.equal(formatCountLabel(2, 'person', 'people'), '2 people');
  assert.equal(countNoun(0, 'item'), 'item');
  assert.equal(countNoun(1, 'item'), 'item');
  assert.equal(countNoun(2, 'item'), 'items');
});

test('visible count surfaces use the shared count-label helpers', async () => {
  const sources = await Promise.all([
    'pages/Overview/PodUsers.jsx',
    'pages/Overview/UrgentActivities.jsx',
    'pages/Stakeholders/StakeholdersTab.jsx',
    'pages/TeamMembers/index.jsx',
    'pages/AccountProfile/ReferralDynamicsTab.jsx',
    'pages/BarriersDrivers/index.jsx',
  ].map((path) => readFile(new URL(`../src/${path}`, import.meta.url), 'utf8')));

  sources.forEach((source) => assert.match(source, /formatCountLabel\(/));
});
