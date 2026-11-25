// KPH_Medical_Approval_Status__c picklist values used by the Medical review flow.
export const UNDER_REVIEW_STATUS = 'Under Review';
export const SUBMITTED_FOR_APPROVAL_STATUS = 'Submitted for Approval';
export const APPROVED_STATUS = 'Approved';

const statusKey = (value) => String(value || '').trim().toLowerCase();

export const isUnderReviewStatus = (value) =>
  statusKey(value) === statusKey(UNDER_REVIEW_STATUS);

export const isSubmittedForApprovalStatus = (value) =>
  statusKey(value) === statusKey(SUBMITTED_FOR_APPROVAL_STATUS);

export const isApprovedStatus = (value) =>
  statusKey(value) === statusKey(APPROVED_STATUS);

// Submitted for Approval is the authoritative cross-user pending state. Keep
// legacy Under Review support and the submitted flag as synchronization
// fallbacks, but Approved must always reopen submission for the MSL.
export const isAccountPlanApprovalPending = (plan) => {
  const { approvalStatus, isSubmitted } = plan || {};
  return isSubmittedForApprovalStatus(approvalStatus) ||
    isUnderReviewStatus(approvalStatus) ||
    (Boolean(isSubmitted) && !isApprovedStatus(approvalStatus));
};
