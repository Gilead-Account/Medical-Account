import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const appSource = await read('../src/App.jsx');
const sidebarSource = await read('../src/components/Sidebar.jsx');
const sidebarCss = await read('../src/components/Sidebar.css');
const sharedSource = await read('../src/lib/dataservice/accountPlan/shared.js');
const approvalSource = await read('../src/lib/dataservice/accountPlan/approval.js');
const profileSource = await read('../src/lib/approvalProfileAccess.js');
const approveModalSource = await read('../src/components/ApproveAccountPlanModal.jsx');

test('Medical approval uses the exact Account Plan CRM fields and picklist values', () => {
  assert.match(approvalSource, /ACCOUNT_PLAN_OBJECT = 'Account_Plan_vod__c'/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD = 'KPH_Medical_Approval_Status__c'/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD = 'KPH_Medical_Submitter_Name__c'/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD = 'KPH_Medical_Approver_Email__c'/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD = 'KPH_Medical_Submitted_Date__c'/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD = 'KPH_Medical_Approver_Name__c'/);
  assert.match(approvalSource, /SUBMITTED_FOR_APPROVAL_STATUS/);
  assert.match(approvalSource, /APPROVED_STATUS/);
});

test('submit resolves the logged-in User Name through getDataForCurrentObject', () => {
  assert.match(sharedSource, /getDataForCurrentObject\('User', 'Name'\)/);
  assert.match(appSource, /const submitterName = await getCurrentUserName\(\)/);
  assert.match(appSource, /submitMpdApproval\(\{ planId: shellPlanId, submittedDate, submitterName \}\)/);
});

test('submit resolves ManagerId and manager Email through live User queries', () => {
  assert.match(approvalSource, /getCrmDataForCurrentObject\('User', 'Id'\)/);
  assert.match(approvalSource, /runCrmQuery\(\{[\s\S]*?object:\s*'User',[\s\S]*?fields:\s*\['Id', 'ManagerId'\]/);
  assert.match(approvalSource, /runCrmQuery\(\{[\s\S]*?object:\s*'User',[\s\S]*?fields:\s*\['Id', 'Email', 'Name'\]/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD\]: approver\.email/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD\]: approver\.name/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD\]: normalizedSubmittedDate/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD\]: ''/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD\]: ''/);
  assert.match(approvalSource, /ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD\]: null/);
});

test('Medical status is queried and mapped into the live Account Plan shell', () => {
  assert.match(sharedSource, /APPROVAL_STATUS_FIELD = 'KPH_Medical_Approval_Status__c'/);
  assert.match(sharedSource, /approvalStatus:\s*r\[APPROVAL_STATUS_FIELD\]/);
  assert.match(sharedSource, /'KPH_Medical_Approval_Status__c'/);
});

test('MSL Manager and FD/MRD profiles qualify for Medical approval', () => {
  assert.match(profileSource, /MEDICAL_APPROVAL_MANAGER_PROFILE = 'KPH-MSL-Manager-Platform'/);
  assert.match(profileSource, /ACCOUNT_PLAN_APPROVER_PROFILES/);
  assert.match(profileSource, /canProfileApproveAccountPlan/);
  assert.match(appSource, /canProfileApproveAccountPlan\(currentUserProfileName\)/);
});

test('pending submission hides MSL submit and shows a green manager Approve button above Help', () => {
  assert.match(sidebarSource, /option\.key === 'submit-mpd-approval'[\s\S]*?isMrdApprovalPending[\s\S]*?return false/);
  assert.match(sidebarSource, /className="sidebar-approve-plan-button"/);
  assert.match(sidebarSource, /isApprovingAccountPlan \? 'Approving\.\.\.' : 'Approve'/);
  assert.ok(
    sidebarSource.indexOf('sidebar-approve-plan-button') < sidebarSource.indexOf('sidebar-policy-help'),
    'Approve button should render above the Help section'
  );
  assert.match(sidebarCss, /\.sidebar-approve-plan-button[\s\S]*?background:[^;]*(?:#|rgb|linear-gradient)[\s\S]*?color:\s*#fff/i);
});

test('Last FD Review displays Submitted for Approval while pending', () => {
  assert.match(sidebarSource, /isSubmittedForApprovalStatus\(plan\?\.approvalStatus\)/);
  assert.match(sidebarSource, /SUBMITTED_FOR_APPROVAL_STATUS/);
});

test('manager approval requires an explicit confirmation', () => {
  assert.match(approveModalSource, /Approve Account Plan\?/);
  assert.match(approveModalSource, /Confirm that you want to approve this account plan/);
  assert.match(approveModalSource, /'Approving\.\.\.' : 'Confirm'/);
  assert.doesNotMatch(approveModalSource, /REVIEW_FIELDS|Approval Status|Submitted Date|Last FD Review|fd-review-grid/);
});
