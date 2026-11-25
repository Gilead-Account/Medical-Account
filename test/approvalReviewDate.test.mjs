import assert from 'node:assert/strict';
import test from 'node:test';

import { acceptedApprovalReviewDate } from '../src/lib/approvalReviewDate.js';

test('an explicit FD review date remains authoritative after approval', () => {
  assert.equal(
    acceptedApprovalReviewDate('Approved', '2026-07-30', '2026-07-31T02:15:00Z'),
    '2026-07-30'
  );
});

test('accepted approvals use their modification date when CRM omitted the review date', () => {
  assert.equal(
    acceptedApprovalReviewDate('Approved', null, '2026-07-31T02:15:00Z'),
    '2026-07-31'
  );
  assert.equal(
    acceptedApprovalReviewDate('Accepted', '', '2026-08-01T10:30:00Z'),
    '2026-08-01'
  );
});

test('pending approvals do not display a modification date as the FD review date', () => {
  assert.equal(
    acceptedApprovalReviewDate('Under Review', null, '2026-07-31T02:15:00Z'),
    null
  );
});
