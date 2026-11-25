import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ACCOUNT_PLAN_APPROVER_PROFILES,
  ACCOUNT_PLAN_APPROVAL_HISTORY_PROFILES,
  ACCOUNT_PLAN_REVIEWER_PROFILES,
  canProfileApproveAccountPlan,
  canProfileViewAccountPlanApprovalHistory,
  isAccountPlanReviewerProfile,
  isMedicalApprovalManagerProfile,
  MEDICAL_APPROVAL_MANAGER_PROFILE,
  isMpdApprovalRestrictedProfile,
  MPD_APPROVAL_RESTRICTED_PROFILES,
} from '../src/lib/approvalProfileAccess.js';

test('MPD approval is restricted for the requested profiles', () => {
  assert.deepEqual(MPD_APPROVAL_RESTRICTED_PROFILES, [
    'KPH-Key Account Director',
    'KPH-CTAM Manager',
  ]);
  assert.equal(isMpdApprovalRestrictedProfile('KPH-Key Account Director'), true);
  assert.equal(isMpdApprovalRestrictedProfile('KPH-CTAM Manager'), true);
});

test('Medical Regional Director and Field Director profiles can review account plans', () => {
  assert.ok(ACCOUNT_PLAN_REVIEWER_PROFILES.includes('KPH-Medical Plan Director'));
  assert.ok(ACCOUNT_PLAN_REVIEWER_PROFILES.includes('KPH-Medical Regional Director'));
  assert.ok(ACCOUNT_PLAN_REVIEWER_PROFILES.includes('KPH-Field Director'));
  assert.equal(isAccountPlanReviewerProfile('medical plan director'), true);
  assert.equal(isAccountPlanReviewerProfile('medical planning director'), true);
  assert.equal(isAccountPlanReviewerProfile('Medical Regional Director'), true);
  assert.equal(isAccountPlanReviewerProfile(' field   director '), true);
  assert.equal(isAccountPlanReviewerProfile('Medical Science Liaison'), false);
});

test('medical Account Plan approval is limited to the exact MSL manager profile', () => {
  assert.equal(MEDICAL_APPROVAL_MANAGER_PROFILE, 'KPH-MSL-Manager-Platform');
  assert.equal(isMedicalApprovalManagerProfile('KPH-MSL-Manager-Platform'), true);
  assert.equal(isMedicalApprovalManagerProfile(' kph-msl-manager-platform '), true);
  assert.equal(isMedicalApprovalManagerProfile('KPH-Field Director'), false);
  assert.equal(isMedicalApprovalManagerProfile('KPH-MSL-Platform'), false);
});

test('MSL Manager, Field Director, and Medical Regional Director profiles can approve', () => {
  assert.deepEqual(ACCOUNT_PLAN_APPROVER_PROFILES, [
    'KPH-MSL-Manager-Platform',
    'KPH-Field Director',
    'Field Director',
    'KPH-Medical Regional Director',
    'Medical Regional Director',
  ]);
  assert.equal(canProfileApproveAccountPlan('KPH-MSL-Manager-Platform'), true);
  assert.equal(canProfileApproveAccountPlan(' kph-field   director '), true);
  assert.equal(canProfileApproveAccountPlan('Field Director'), true);
  assert.equal(canProfileApproveAccountPlan('KPH-Medical Regional Director'), true);
  assert.equal(canProfileApproveAccountPlan('medical regional director'), true);
  assert.equal(canProfileApproveAccountPlan('KPH-Medical Plan Director'), false);
  assert.equal(canProfileApproveAccountPlan('KPH-MSL-Platform'), false);
});

test('KPH MSL Platform and reviewer profiles can view approval history', () => {
  assert.ok(ACCOUNT_PLAN_APPROVAL_HISTORY_PROFILES.includes('KPH-MSL-Platform'));
  assert.equal(canProfileViewAccountPlanApprovalHistory(' kph-msl-platform '), true);
  assert.equal(canProfileViewAccountPlanApprovalHistory('Medical Science Liaison'), true);
  assert.equal(canProfileViewAccountPlanApprovalHistory('Field Director'), true);
  assert.equal(canProfileViewAccountPlanApprovalHistory('Commercial Profile'), false);
});

test('MPD approval profile matching is whitespace and case insensitive', () => {
  assert.equal(isMpdApprovalRestrictedProfile('  kph-key   account director  '), true);
  assert.equal(isMpdApprovalRestrictedProfile('kph-ctam manager'), true);
  assert.equal(isMpdApprovalRestrictedProfile('Commercial Profile'), false);
  assert.equal(isMpdApprovalRestrictedProfile(null), false);
});
