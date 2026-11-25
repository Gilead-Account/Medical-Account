import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('Referral & Dynamics and Stakeholders expose no add, edit, or modal controls', async () => {
  const [accountProfile, referralDynamics, stakeholdersPage, stakeholdersTab] = await Promise.all([
    source('../src/pages/AccountProfile/index.jsx'),
    source('../src/pages/AccountProfile/ReferralDynamicsTab.jsx'),
    source('../src/pages/Stakeholders/index.jsx'),
    source('../src/pages/Stakeholders/StakeholdersTab.jsx'),
  ]);

  assert.doesNotMatch(accountProfile, /ReferralAccountEditModal|referralModal|handleSaveReferral|handleDeleteReferral/);
  assert.doesNotMatch(referralDynamics, /ReferralEditButton|EditPencilIcon|onAddReferral|onEditReferral/);
  assert.doesNotMatch(referralDynamics, />\s*Add\s*</);

  assert.doesNotMatch(stakeholdersPage, /StakeholderEditModal|editingStakeholder|saveStakeholder|deleteStakeholderRow/);
  assert.doesNotMatch(stakeholdersTab, /Add Stakeholder|stakeholder-edit-button|onAdd|onOpenEdit/);
});
