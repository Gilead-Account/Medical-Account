export const MPD_APPROVAL_RESTRICTED_PROFILES = [
  'KPH-Key Account Director',
  'KPH-CTAM Manager',
];

export const ACCOUNT_PLAN_REVIEWER_PROFILES = [
  'KPH-Medical Plan Director',
  'KPH-Medical Planning Director',
  'KPH-Medical Regional Director',
  'KPH-Field Director',
  'Medical Plan Director',
  'Medical Planning Director',
  'Medical Regional Director',
  'Field Director',
];

export const ACCOUNT_PLAN_APPROVAL_HISTORY_PROFILES = [
  ...ACCOUNT_PLAN_REVIEWER_PROFILES,
  'KPH-MSL-Manager-Platform',
  'KPH-MSL-Platform',
  'Medical Science Liaison',
];

export const MEDICAL_APPROVAL_MANAGER_PROFILE = 'KPH-MSL-Manager-Platform';

// Account Plan approvals may be completed by an MSL Manager acting in the
// approval flow or by the explicit Field/Medical Regional Director profiles.
// Keep this list separate from ACCOUNT_PLAN_REVIEWER_PROFILES because Medical
// Plan Directors can review the plan but are not an FD/MRD approver.
export const ACCOUNT_PLAN_APPROVER_PROFILES = [
  MEDICAL_APPROVAL_MANAGER_PROFILE,
  'KPH-Field Director',
  'Field Director',
  'KPH-Medical Regional Director',
  'Medical Regional Director',
];

const normalizeProfileName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const RESTRICTED_PROFILE_NAMES = new Set(
  MPD_APPROVAL_RESTRICTED_PROFILES.map(normalizeProfileName)
);
const REVIEWER_PROFILE_NAMES = new Set(
  ACCOUNT_PLAN_REVIEWER_PROFILES.map(normalizeProfileName)
);
const APPROVAL_HISTORY_PROFILE_NAMES = new Set(
  ACCOUNT_PLAN_APPROVAL_HISTORY_PROFILES.map(normalizeProfileName)
);
const ACCOUNT_PLAN_APPROVER_PROFILE_NAMES = new Set(
  ACCOUNT_PLAN_APPROVER_PROFILES.map(normalizeProfileName)
);

export const isMpdApprovalRestrictedProfile = (profileName) =>
  RESTRICTED_PROFILE_NAMES.has(normalizeProfileName(profileName));

export const isAccountPlanReviewerProfile = (profileName) =>
  REVIEWER_PROFILE_NAMES.has(normalizeProfileName(profileName));

export const isMedicalApprovalManagerProfile = (profileName) =>
  normalizeProfileName(profileName) === normalizeProfileName(MEDICAL_APPROVAL_MANAGER_PROFILE);

export const canProfileApproveAccountPlan = (profileName) =>
  ACCOUNT_PLAN_APPROVER_PROFILE_NAMES.has(normalizeProfileName(profileName));

export const canProfileViewAccountPlanApprovalHistory = (profileName) =>
  APPROVAL_HISTORY_PROFILE_NAMES.has(normalizeProfileName(profileName));
