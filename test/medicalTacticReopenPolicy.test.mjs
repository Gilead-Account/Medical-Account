import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criticalActivityClosedParentEditReason,
} from '../src/pages/CriticalActivities/linkedBarrierDriverOptions.js';

const lockedMessage = 'Reopen the linked Barrier/Opportunity before editing this medical tactic.';

test('a completed Medical Tactic can reopen while its parent remains active', () => {
  const activity = { barrierDriverId: 'barrier-open', status: 'Complete' };
  const parent = { id: 'barrier-open', status: 'Open' };

  assert.equal(criticalActivityClosedParentEditReason(activity, parent), '');
});

test('a completed Medical Tactic stays locked while its parent is closed', () => {
  const activity = { barrierDriverId: 'barrier-closed', status: 'Complete' };
  const parent = { id: 'barrier-closed', status: 'Closed' };

  assert.equal(criticalActivityClosedParentEditReason(activity, parent), lockedMessage);
});
