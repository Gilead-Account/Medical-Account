import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  fixtures,
  fixtureRowsForAccountPlan,
  PLAN_ID,
} from '../src/lib/mockData/fixtures.js';

const mockAdapterSource = readFileSync(
  new URL('../src/lib/mockData/mockAdapter.js', import.meta.url),
  'utf8'
);

const unwrap = (row) => Object.fromEntries(
  Object.entries(row || {}).map(([field, cell]) => [field, cell?.value ?? cell])
);
const rows = (object) => (fixtures[object] || []).map(unwrap);

const accounts = new Map(rows('Account').map((record) => [record.Id, record]));
const barriers = new Map(
  rows('KPH_Medical_Barrier_Tactical_Actions__c').map((record) => [record.Id, record])
);

for (const record of barriers.values()) {
  assert.equal(record.KPH_Account_Plan__c, PLAN_ID, `Barrier/Opportunity ${record.Id} is not plan-scoped`);
}

for (const activity of rows('KPH_Medical_Tactics__c')) {
  assert.equal(activity.KPH_Account_Plans__c, PLAN_ID, `Medical Tactic ${activity.Id} is not plan-scoped`);
  assert.ok(
    barriers.has(activity.KPH_Barrier_or_Opportunity__c),
    `Medical Tactic ${activity.Id} has no seeded Barrier/Opportunity parent`
  );
}

for (const stakeholder of rows('KPH_Stakeholder_Map__c')) {
  assert.equal(stakeholder.KPH_Account_Plan__c, PLAN_ID, `Stakeholder ${stakeholder.Id} is not plan-scoped`);
  const hcp = accounts.get(stakeholder.KPH_Account__c);
  assert.ok(hcp?.IsPersonAccount, `Stakeholder ${stakeholder.Id} is not linked to a Person Account`);
  const parent = accounts.get(hcp.Primary_Parent_vod__c);
  assert.ok(parent && !parent.IsPersonAccount, `Stakeholder ${stakeholder.Id} HCP has no primary HCO parent`);
}

for (const member of rows('Account_Team_Member_vod__c')) {
  assert.equal(member.Account_Plan_vod__c, PLAN_ID, `Team Member ${member.Id} is not plan-scoped`);
  assert.ok(member.Team_Member_vod__c, `Team Member ${member.Id} has no User lookup`);
}

for (const referral of rows('KPH_Ecosystem_Map_Dynamics__c')) {
  assert.equal(referral.Account_Plan_vod__c, PLAN_ID, `Referral ${referral.Id} is not plan-scoped`);
  assert.ok(referral.KPH_HCO_Classification__c, `Referral ${referral.Id} has no HCO classification`);
  assert.ok(accounts.get(referral.KPH_Name_of_Site__c), `Referral ${referral.Id} has no site Account`);
}

const desktopPlanId = 'a0X8C00000Mock2AAC';
const desktopRows = (object) => fixtureRowsForAccountPlan(object, desktopPlanId).map(unwrap);
const selectedDesktopPlan = desktopRows('Account_Plan_vod__c').find(
  (record) => record.Id === desktopPlanId
);
assert.equal(selectedDesktopPlan?.Name, 'ACT Plan 009', 'Desktop fixture lost its selected plan identity');
assert.ok(
  selectedDesktopPlan?.KPH_ATC_Profile_Category__c,
  'Desktop fixture did not inherit the Medical plan template fields'
);
for (const [object, field] of [
  ['KPH_Ecosystem_Plan__c', 'KPH_Account_Plan__c'],
  ['KPH_Stakeholder_Map__c', 'KPH_Account_Plan__c'],
  ['Account_Team_Member_vod__c', 'Account_Plan_vod__c'],
  ['KPH_Ecosystem_Map_Dynamics__c', 'Account_Plan_vod__c'],
]) {
  const scopedRows = desktopRows(object);
  assert.ok(scopedRows.length, `Desktop fixture has no ${object} mock rows`);
  assert.ok(
    scopedRows.every((record) => record[field] === desktopPlanId),
    `Desktop ${object} mock rows are not scoped to the selected plan`
  );
}

const requiredPicklists = [
  ['Account_Plan_vod__c', 'KPH_ATC_Profile_Category__c'],
  ['Account_Plan_vod__c', 'KPH_Medical_Education__c'],
  ['Account_Plan_vod__c', 'KPH_Kite_Clinical_Trial__c'],
  ['Account_Plan_vod__c', 'KPH_Medical_Collaboration__c'],
  ['KPH_Medical_Barrier_Tactical_Actions__c', 'KPH_Barrier_Title__c'],
  ['KPH_Medical_Barrier_Tactical_Actions__c', 'KPH_Opportunity_Title__c'],
  ['KPH_Medical_Barrier_Tactical_Actions__c', 'KPH_Medical_Tactical_Action_Status__c'],
  ['KPH_Medical_Barrier_Tactical_Actions__c', 'KPH_Indication__c'],
  ['KPH_Medical_Barrier_Tactical_Actions__c', 'KPH_Medical_Strategy__c'],
  ['KPH_Medical_Tactics__c', 'KPH_Medical_Tactics__c'],
  ['KPH_Medical_Tactics__c', 'KPH_Status__c'],
  ['KPH_Medical_Tactics__c', 'KPH_Indication__c'],
  ['KPH_Medical_Tactics__c', 'KPH_Accountable_POD_Members__c'],
  ['Account_Team_Member_vod__c', 'KPH_Participation__c'],
  ['Account_Team_Member_vod__c', 'Account_Team_Member_Active__c'],
  ['KPH_Stakeholder_Map__c', 'KPH_Title__c'],
  ['KPH_Ecosystem_Map_Dynamics__c', 'Indication__c'],
];

for (const [object, field] of requiredPicklists) {
  const objectStart = mockAdapterSource.indexOf(`${object}: {`);
  // The Medical Tactics title field intentionally has the same API name as
  // its object, so begin the field search after the object declaration.
  const fieldStart = mockAdapterSource.indexOf(`${field}: {`, objectStart + `${object}: {`.length);
  assert.ok(objectStart >= 0 && fieldStart > objectStart, `Mock picklist is missing: ${object}.${field}`);
  const fieldEnd = mockAdapterSource.indexOf('\n    },', fieldStart);
  assert.ok(fieldEnd > fieldStart + field.length + 5, `Mock picklist is empty: ${object}.${field}`);
}

console.log(
  `Training fixture verification passed: ${barriers.size} barriers/opportunities, ` +
  `${rows('KPH_Medical_Tactics__c').length} medical tactics, ` +
  `${rows('KPH_Stakeholder_Map__c').length} stakeholders, and ` +
  `${requiredPicklists.length} populated picklists.`
);
