import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url),
  'utf8'
);
const dataSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/accountProfile.js', import.meta.url),
  'utf8'
);
const pageSource = await readFile(
  new URL('../src/pages/AccountProfile/index.jsx', import.meta.url),
  'utf8'
);
const tabSource = await readFile(
  new URL('../src/pages/AccountProfile/AccountIntelligenceTab.jsx', import.meta.url),
  'utf8'
);

test('Medical Account Profile records use CRM except for the explicit local preview', () => {
  const fetchBlock = sharedSource.match(
    /export const fetchMedicalAccountProfile = async \(planId,[\s\S]*?\) => \{([\s\S]*?)\n\};/
  )?.[1] || '';

  assert.match(fetchBlock, /if \(!useCrm && !allowMockPreview\) return null/);
  assert.match(fetchBlock, /runCrmQuery/);
  assert.match(fetchBlock, /useCrm \? runCrmQuery : runQuery/);
  assert.match(dataSource, /allowMockPreview: isLocalPreview/);
  assert.match(dataSource, /getRuntimePicklistValueLabels\(ACCOUNT_PROFILE_OBJECT, field\)/);
  assert.doesNotMatch(dataSource, /fetchPlan\(planId/);
  assert.doesNotMatch(dataSource, /updateAccountPlanProfileField/);
});

test('MM and DLBCL tabs receive distinct CRM records and mappings', () => {
  assert.match(pageSource, /profileType=\{tab === 'mm-medical-profile' \? 'mm' : 'dlbcl'\}/);
  assert.match(pageSource, /data\.mmMedicalProfile \|\| \{\}/);
  assert.match(pageSource, /data\.dlbclMedicalProfile \|\| \{\}/);
  assert.doesNotMatch(pageSource, /values=\{data\.mmProfile \|\| \{\}\}/);
  assert.match(
    dataSource,
    /medicalProfileId:[\s\S]*?medicalProfile\?\.id \|\|[\s\S]*?referralProfile\?\.id \|\|[\s\S]*?commercialProfile\?\.id \|\|[\s\S]*?profile\?\.id \|\|[\s\S]*?null/
  );
});

test('control types and text limits follow the supplied workbook', () => {
  assert.match(tabSource, /key: 'medicalEducation'[\s\S]*?inputType: 'education-status-list'/);
  assert.match(tabSource, /medicalEducationStatusFieldsFor\(profileType\)/);
  assert.match(tabSource, /parentKey: 'medicalEducation'/);
  assert.match(tabSource, /MEDICAL_EDUCATION_STATUS_OPTIONS = \['Pending', 'Completed', 'Declined'\]/);
  assert.match(tabSource, /key: 'atcProfile'[\s\S]*?maxLength: 32768/);
  assert.match(tabSource, /key: 'competitorTrial'[\s\S]*?maxLength: 32768/);
  assert.match(tabSource, /kiteClinicalTrialLabel = isDlbcl \? 'Kite Lymphoma\/Pipeline' : 'Kite MM'/);
  assert.match(tabSource, /key: 'kiteClinicalTrial', label: kiteClinicalTrialLabel/);
  assert.match(tabSource, /key: 'competitorTrial', label: `\$\{prefix\} Competitor Trial`/);
  assert.match(tabSource, /key: 'atcProfile', label: `\$\{prefix\} ATC Profile`/);
  assert.doesNotMatch(tabSource, /DLBCL ATC Profile 1/);
  assert.match(tabSource, /key: 'researchCapabilitiesTimelines'[\s\S]*?maxLength: 255/);
  assert.match(tabSource, /optionLabels\.get\(selectedValue\) \|\| selectedValue/);
});
