import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const appSource = await read('../src/App.jsx');
const sidebarSource = await read('../src/components/Sidebar.jsx');
const sidebarCss = await read('../src/components/Sidebar.css');
const approvalSource = await read('../src/lib/dataservice/accountPlan/approval.js');
const approveModalSource = await read('../src/components/ApproveAccountPlanModal.jsx');
const historyModalSource = await read('../src/components/ApprovalHistoryModal.jsx');
const historyModalCss = await read('../src/components/ApprovalHistoryModal.css');
const editModalCss = await read('../src/styles/edit-modal.css');

test('submitted plans display Submitted for Approval beneath Last FD Review', () => {
  assert.match(appSource, /approvalStatus:\s*SUBMITTED_FOR_APPROVAL_STATUS/);
  assert.match(sidebarSource, /isSubmittedForApprovalStatus\(plan\?\.approvalStatus\)/);
  assert.match(sidebarSource, /\? SUBMITTED_FOR_APPROVAL_STATUS/);
  assert.match(sidebarSource, /<strong>\{lastFieldDirectorReviewValue\}<\/strong>/);
});

test('MSL submission captures the current date for UI state and resolves the logged-in user name', () => {
  assert.match(approvalSource, /ACCOUNT_PLAN_SUBMITTED_DATE_FIELD = 'KPH_Medical_Submitted_Date__c'/);
  assert.match(appSource, /const submittedDate = localIsoDate\(\)/);
  assert.match(appSource, /const submitterName = await getCurrentUserName\(\)/);
  assert.match(appSource, /submitMpdApproval\(\{ planId: shellPlanId, submittedDate, submitterName \}\)/);
  assert.match(approvalSource, /getCrmDataForCurrentObject\('User', 'Id'\)/);
  assert.match(approvalSource, /fields:\s*\['Id', 'ManagerId'\]/);
  assert.match(approvalSource, /fields:\s*\['Id', 'Email', 'Name'\]/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD\]: approver\.email/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD\]: approver\.name/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD\]: normalizedSubmittedDate/);
});

test('MSL Manager and FD/MRD approver profiles see a green Approve button above Help', () => {
  assert.match(appSource, /canProfileApproveAccountPlan\(currentUserProfileName\)/);
  assert.match(appSource, /canProfileViewAccountPlanApprovalHistory\(currentUserProfileName\)/);
  assert.match(appSource, /isSubmittedForApprovalStatus\(effectiveShellPlan\?\.approvalStatus\)/);
  assert.match(appSource, /canApproveAccountPlan=\{canApproveAccountPlan\}/);
  assert.doesNotMatch(sidebarSource, /key: 'submit-approval'/);
  assert.match(sidebarSource, /const EXPORT_MENU_SECTIONS = \[/);
  assert.match(sidebarSource, /\{ key: 'approval', label: 'Approval' \}/);
  assert.match(sidebarSource, /\{ key: 'export', label: 'Export' \}/);
  assert.match(sidebarSource, /sidebar-export-section-label/);
  assert.match(sidebarCss, /\.sidebar-export-section-label/);
  assert.match(sidebarSource, /option\.key === 'submit-mpd-approval'[\s\S]*?isMpdApprovalDisabled \|\| isAccountPlanReviewer \|\| isMrdApprovalPending/);
  assert.match(sidebarSource, /sidebar-approve-plan-button/);
  assert.match(sidebarCss, /\.sidebar-approve-plan-button/);
  assert.ok(sidebarSource.indexOf('sidebar-approve-plan-button') < sidebarSource.indexOf('sidebar-policy-help'));
  assert.match(approveModalSource, /Approve Account Plan\?/);
});

test('approval writes Approved status and clears submitter plus approver email', () => {
  assert.match(appSource, /approveAccountPlan\(\{ planId: shellPlanId \}\)/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD\]: APPROVED_STATUS/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD\]: ''/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD\]: ''/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD\]: ''/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD\]: null/);
  assert.match(appSource, /approvalStatus:\s*APPROVED_STATUS/);
  assert.doesNotMatch(approvalSource, /ACCOUNT_PLAN_FD_REVIEW_DATE_FIELD\]:/);
});

test('manager approval confirmation has Confirm and Cancel only', () => {
  assert.match(approveModalSource, />\s*Cancel\s*</);
  assert.match(approveModalSource, /'Approving\.\.\.' : 'Confirm'/);
  assert.doesNotMatch(approveModalSource, /Comments|textarea|Revise/);
});

test('manager approval confirmation contains no Account Plan data grid', () => {
  assert.doesNotMatch(approveModalSource, /REVIEW_FIELDS|Approval Status|Submitted Date|Last FD Review|fd-review-grid/);
  assert.doesNotMatch(appSource, /fetchAccountPlanApprovalReview|loadApprovalReview/);
  assert.doesNotMatch(approveModalSource, /Last Barrier & Tactical Action Update/);
  assert.doesNotMatch(approveModalSource, /Last Internal POD Meeting Update/);
});

test('MSLs and reviewers can inspect approval history without comments', () => {
  assert.match(appSource, /fetchAccountPlanApprovalHistory/);
  assert.match(sidebarSource, /Approval History/);
  assert.match(sidebarSource, /option\.approvalHistoryOnly && !canViewApprovalHistory/);
  assert.match(historyModalSource, /Created Date/);
  assert.match(historyModalSource, /label: 'Approval Date'/);
  assert.doesNotMatch(historyModalSource, /Approval Date \/ Last FD Review/);
  assert.match(historyModalSource, /Medical Submitter/);
  assert.match(historyModalSource, /Actual Approver/);
  assert.doesNotMatch(historyModalSource, /Comments/);
});

test('approval history queries only medical record types and maps their relevant status fields', () => {
  assert.match(approvalSource, /'KPH_Medical_Approved'/);
  assert.match(approvalSource, /'KPH_Medical_Pending'/);
  assert.match(approvalSource, /'KPH_Medical_Submitted'/);
  assert.match(approvalSource, /object: 'RecordType'/);
  assert.match(approvalSource, /fields: \['Id', 'DeveloperName'\]/);
  assert.match(approvalSource, /DeveloperName IN/);
  assert.match(approvalSource, /buildIdMatchWhere\('RecordTypeId', recordType\.id\)/);
  assert.match(approvalSource, /APPROVAL_HISTORY_MEDICAL_STATUS_FIELD = 'KPH_Medical_Status__c'/);
  assert.match(approvalSource, /APPROVAL_HISTORY_MEDICAL_APPROVER_FIELD = 'KPH_Medical_Approver__c'/);
  assert.match(approvalSource, /APPROVAL_HISTORY_MEDICAL_SUBMITTER_FIELD = 'KPH_Medical_Submitter__c'/);
  assert.doesNotMatch(approvalSource, /KPH_Assigned_To__c|KPH_Actual_Approver__c/);
});

test('approval history supports ascending and descending sorting on every column', () => {
  assert.match(historyModalSource, /TableSortButton/);
  assert.match(historyModalSource, /nextTableSort/);
  assert.match(historyModalSource, /stableSortRows/);
  assert.match(historyModalSource, /toDateSortValue/);
  assert.match(historyModalSource, /useState\(\{ key: 'createdDate', direction: 'desc' \}\)/);
  assert.match(historyModalSource, /key: 'createdDate'/);
  assert.match(historyModalSource, /key: 'approvalDate'/);
  assert.match(historyModalSource, /key: 'status'/);
  assert.match(historyModalSource, /key: 'medicalSubmitter'/);
  assert.match(historyModalSource, /key: 'actualApprover'/);
  assert.match(historyModalSource, /aria-sort/);
  assert.match(historyModalSource, /sortedEntries\.map/);
});

test('approval history and simple approval confirmation use the shared modal layout', () => {
  assert.match(historyModalSource, /stakeholder-edit-modal approval-history-modal/);
  assert.match(historyModalSource, /stakeholder-edit-head/);
  assert.match(historyModalSource, /stakeholder-edit-body approval-history-body/);
  assert.doesNotMatch(historyModalCss, /linear-gradient/);
  assert.match(approveModalSource, /stakeholder-edit-modal submit-mpd-approval-modal/);
  assert.doesNotMatch(approveModalSource, /fd-review-modal|fd-review-body|fd-review-grid/);
});
