import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const appSource = await read('../src/App.jsx');
const sidebarSource = await read('../src/components/Sidebar.jsx');
const sharedSource = await read('../src/lib/dataservice/accountPlan/shared.js');
const fixtureSource = await read('../src/lib/mockData/fixtures.js');

test('Submitted for Approval is recognized as pending without edit locking', async () => {
  const helper = await import('../src/lib/accountPlanReadOnly.js');

  assert.equal(helper.UNDER_REVIEW_STATUS, 'Under Review');
  assert.equal(helper.SUBMITTED_FOR_APPROVAL_STATUS, 'Submitted for Approval');
  assert.equal(helper.APPROVED_STATUS, 'Approved');
  assert.equal(helper.isUnderReviewStatus(' under review '), true);
  assert.equal(helper.isSubmittedForApprovalStatus(' submitted for approval '), true);
  assert.equal(helper.isAccountPlanApprovalPending(null), false);
  assert.equal(helper.isAccountPlanApprovalPending({ approvalStatus: 'Under Review', isSubmitted: false }), true);
  assert.equal(helper.isAccountPlanApprovalPending({ approvalStatus: 'Submitted for Approval', isSubmitted: false }), true);
  assert.equal(helper.isAccountPlanApprovalPending({ approvalStatus: 'Draft', isSubmitted: true }), true);
  assert.equal(helper.isAccountPlanApprovalPending({ approvalStatus: 'Approved', isSubmitted: true }), false);
  assert.equal(helper.isUnderReviewStatus('Draft'), false);
  assert.equal(helper.isAccountPlanReadOnly, undefined);
});

test('shared account plan mapping carries medical approval fields', () => {
  assert.match(sharedSource, /'KPH_Medical_Approval_Status__c'/);
  assert.match(sharedSource, /'KPH_Medical_Submitter_Name__c'/);
  assert.match(sharedSource, /'KPH_Is_Submitted__c'/);
  assert.match(sharedSource, /approvalStatus:\s*r\[APPROVAL_STATUS_FIELD\]/);
  assert.match(sharedSource, /submitterName:\s*r\[APPROVAL_SUBMITTER_NAME_FIELD\]/);
  assert.match(sharedSource, /isSubmitted:\s*toBooleanFlag\(r\[APPROVAL_SUBMITTED_FIELD\]\)/);
  assert.match(fixtureSource, /KPH_Medical_Approval_Status__c:\s*'Draft'/);
  assert.match(fixtureSource, /KPH_Medical_Submitter_Name__c:\s*null/);
  assert.match(fixtureSource, /KPH_Is_Submitted__c:\s*false/);
});

test('App keeps every account-plan page editable after submission', () => {
  assert.doesNotMatch(appSource, /isAccountPlanReadOnly|const\s+isReadOnly/);
  assert.doesNotMatch(appSource, /isReadOnly=\{/);
  assert.match(appSource, /const isMrdApprovalPending = isAccountPlanApprovalPending\(effectiveShellPlan\)/);
});

test('Sidebar shows Submitted for Approval and hides repeat submission until manager approval', () => {
  assert.match(sidebarSource, /isSubmittedForApprovalStatus\(plan\?\.approvalStatus\)/);
  assert.match(
    sidebarSource,
    /const visibleExportMenuOptions = EXPORT_MENU_OPTIONS\.filter[\s\S]*?option\.key === 'submit-mpd-approval'[\s\S]*?isMpdApprovalDisabled \|\| isAccountPlanReviewer \|\| isMrdApprovalPending[\s\S]*?return false/
  );
  assert.match(sidebarSource, /Submitted for Approval/);
  assert.match(appSource, /This account plan is already Submitted for Approval\. Wait for manager approval before submitting again\./);
  assert.doesNotMatch(sidebarSource, /key: 'submit-approval'/);
  assert.match(sidebarSource, /sidebar-approve-plan-button/);
  assert.doesNotMatch(sidebarSource, /isReadOnly|Disabled while submitted for approval/);
});
