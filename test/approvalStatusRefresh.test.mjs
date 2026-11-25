import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const appSource = await read('../src/App.jsx');
const sharedSource = await read('../src/lib/dataservice/accountPlan/shared.js');

test('shared data service exposes an Account Plan approval refresh snapshot', () => {
  assert.match(sharedSource, /export const APPROVAL_STATUS_FIELD = 'KPH_Medical_Approval_Status__c'/);
  assert.match(sharedSource, /export const APPROVAL_SUBMITTER_NAME_FIELD = 'KPH_Medical_Submitter_Name__c'/);
  assert.match(sharedSource, /export const APPROVAL_SUBMITTED_FIELD = 'KPH_Is_Submitted__c'/);
  assert.match(sharedSource, /export const fetchPlanApprovalStatus = async \(planId\)/);
  assert.match(sharedSource, /object:\s*'Account_Plan_vod__c'/);
  assert.match(sharedSource, /fields:\s*\[[\s\S]*?APPROVAL_STATUS_FIELD,[\s\S]*?APPROVAL_SUBMITTED_FIELD,[\s\S]*?APPROVAL_SUBMITTER_NAME_FIELD,[\s\S]*?LAST_FD_REVIEW_DATE_FIELD,[\s\S]*?'LastModifiedDate'/);
  assert.match(sharedSource, /lastFieldDirectorReviewDate:\s*r\[LAST_FD_REVIEW_DATE_FIELD\]\s*\|\|\s*null/);
  assert.doesNotMatch(sharedSource, /acceptedApprovalReviewDate/);
  assert.match(sharedSource, /approvalStatus:\s*r\[APPROVAL_STATUS_FIELD\]/);
  assert.match(sharedSource, /isSubmitted:\s*toBooleanFlag\(r\[APPROVAL_SUBMITTED_FIELD\]\)/);
  assert.match(sharedSource, /submitterName:\s*r\[APPROVAL_SUBMITTER_NAME_FIELD\]/);
});

test('App overlays live approval status without making the account plan read-only', () => {
  assert.match(appSource, /import\s+\{\s*fetchPlanApprovalStatus,\s*getCurrentUserName\s*\}\s+from\s+'@\/lib\/dataservice\/accountPlan\/shared'/);
  assert.match(appSource, /const APPROVAL_STATUS_REFRESH_MS = 3000;/);
  assert.match(appSource, /const \[approvalStatusSnapshot, setApprovalStatusSnapshot\] = useState\(null\)/);
  assert.match(appSource, /const effectiveShellPlan = shellPlan/);
  assert.match(appSource, /isSubmitted:\s*hasLiveApprovalStatus\s*\?\s*approvalStatusSnapshot\.isSubmitted\s*:\s*shellPlan\.isSubmitted/);
  assert.doesNotMatch(appSource, /isAccountPlanReadOnly|const isReadOnly/);
  assert.match(appSource, /const isMrdApprovalPending = isAccountPlanApprovalPending\(effectiveShellPlan\)/);
});

test('App refreshes approval status and loaded workspace pages on app resume', () => {
  assert.match(appSource, /const refreshApprovalStatus = useCallback\(/);
  assert.match(appSource, /refreshApprovalStatus\(\{ force: true \}\)/);
  assert.match(appSource, /window\.setInterval\(\(\) => \{\s*refreshApprovalStatus\(\);/);
  assert.match(appSource, /document\.addEventListener\('visibilitychange', handleResume\)/);
  assert.match(appSource, /window\.addEventListener\('focus', handleResume\)/);
  assert.match(appSource, /window\.addEventListener\('pageshow', handleResume\)/);
  assert.match(appSource, /WORKSPACE_RESUME_REFRESH_THROTTLE_MS = 1200/);
  assert.match(appSource, /workspaceResumeRefreshRef\.current = now;\s*refreshLoadedPages\(\);/);
  assert.match(appSource, /}, \[activeKey, refreshApprovalStatus\]\);/);
  assert.match(appSource, /}, \[refreshApprovalStatus, refreshLoadedPages\]\);/);
});

test('App marks the plan Submitted for Approval immediately after submit succeeds', () => {
  assert.match(appSource, /setApprovalStatusSnapshot\(\{\s*planId:\s*shellPlanId,\s*approvalStatus:/);
  assert.match(appSource, /approvalStatus:\s*SUBMITTED_FOR_APPROVAL_STATUS/);
  assert.match(appSource, /isSubmitted:\s*true/);
  assert.match(appSource, /The account plan is now Submitted for Approval\./);
  assert.match(appSource, /refreshApprovalStatus\(\{ force: true \}\)/);
});
