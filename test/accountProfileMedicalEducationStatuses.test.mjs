import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { medicalEducationValueFromStatuses } from '../src/pages/AccountProfile/medicalEducationStatuses.js';

const sharedSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url),
  'utf8'
);
const composerSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/accountProfile.js', import.meta.url),
  'utf8'
);
const tabSource = await readFile(
  new URL('../src/pages/AccountProfile/AccountIntelligenceTab.jsx', import.meta.url),
  'utf8'
);
const profileCss = await readFile(
  new URL('../src/pages/AccountProfile/AccountProfile.css', import.meta.url),
  'utf8'
);

test('MM and DLBCL education values map to their six exact status fields', () => {
  [
    "'AE Management': 'KPH_ae_management_Status__c'",
    "'ATC Onboarding': 'KPH_atc_onboarding_Status2__c'",
    "Outpatient: 'KPH_outpatient_Status3__c'",
    "'AE Management': 'KPH_DLBCL_ae_management_Status__c'",
    "'ATC Onboarding': 'KPH_DLBCL_atc_onboarding2__c'",
    "Outpatient: 'KPH_DLBCL_outpatient3__c'",
  ].forEach((mapping) => assert.match(sharedSource, new RegExp(mapping.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));

  assert.match(sharedSource, /MEDICAL_PROFILE_FIELD_API_NAMES[\s\S]*MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES/);
  assert.match(sharedSource, /MEDICAL_PROFILE_FIELD_API_NAMES[\s\S]*DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES/);
  assert.match(composerSource, /\.\.\.Object\.values\(MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES\)/);
  assert.match(composerSource, /\.\.\.Object\.values\(DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES\)/);
});

test('education values are derived from their independent statuses', () => {
  assert.match(tabSource, /MEDICAL_EDUCATION_STATUS_OPTIONS = \['Pending', 'Completed', 'Declined'\]/);
  assert.match(tabSource, /statusItemByOption\.get\(option\.value\)/);
  assert.match(tabSource, /medicalEducationValueFromStatuses/);
  assert.match(tabSource, /updates\[item\.crmField\] = nextValue/);

  const options = ['AE Management', 'ATC Onboarding', 'Outpatient'];
  const statusItems = options.map((option) => ({
    parentOption: option,
    key: `status:${option}`,
  }));
  assert.equal(
    medicalEducationValueFromStatuses(options, statusItems, {
      'status:AE Management': 'Completed',
      'status:ATC Onboarding': 'Pending',
      'status:Outpatient': '',
    }),
    'AE Management;ATC Onboarding'
  );
});

test('Medical Education is a status-only list with no selection controls or status heading', () => {
  assert.match(tabSource, /key: 'medicalEducation'[\s\S]*?inputType: 'education-status-list'[\s\S]*?layout: 'diagram-half'/);
  assert.match(tabSource, /options:[\s\S]*?Object\.keys\(statusFieldApiNames\)/);
  assert.match(tabSource, /function MedicalEducationEditor/);
  assert.match(tabSource, /medical-education-option-label/);
  assert.match(tabSource, /medical-education-status-control/);
  const editorSource = tabSource.match(/function MedicalEducationEditor\([\s\S]*?\n\}\n\nfunction MedicalMultiSelect/)?.[0] || '';
  assert.doesNotMatch(editorSource, /type="checkbox"|<span>Status<\/span>|medical-education-editor-head/);
});

test('MM and DLBCL place Kite Clinical Trial before ATC Profile and Medical Education after it', () => {
  assert.match(
    tabSource,
    /kiteClinicalTrialField,[\s\S]*?key: 'atcProfile'[\s\S]*?medicalEducationField,[\s\S]*?\.\.\.educationStatusFields/
  );
});

test('both Competitor Trial textareas fill their fields beside Medical Education', () => {
  assert.match(tabSource, /item\.key === 'competitorTrial' \? 'is-competitor-trial'/);
  assert.match(
    profileCss,
    /\.is-medical-profile-diagram[\s\S]*?\.is-competitor-trial[\s\S]*?\.account-intelligence-field-copy\s*\{[\s\S]*?grid-template-rows:\s*auto minmax\(0, 1fr\);[\s\S]*?height:\s*100%;/
  );
  assert.match(
    profileCss,
    /\.is-competitor-trial[\s\S]*?textarea\.account-intelligence-control\s*\{[\s\S]*?height:\s*100%;[\s\S]*?min-height:\s*0;/
  );
});

test('Medical Education keeps the same two-column list with touch sizing on iPad', () => {
  assert.match(profileCss, /@media \(min-width: 721px\) and \(max-width: 1199px\)[\s\S]*?\.page-account-profile \.medical-education-option/);
  assert.match(profileCss, /\.is-medical-profile-diagram \.account-intelligence-field-grid[\s\S]*?grid-template-columns:\s*repeat\(2,/);
  assert.equal(
    profileCss.includes('@media (max-width: 900px) {\n  .account-intelligence-section.is-medical-profile-diagram .account-intelligence-field-grid'),
    false
  );
  assert.doesNotMatch(profileCss, /\.medical-education-option input\[type='checkbox'\]/);
  assert.match(profileCss, /\.page-account-profile \.medical-education-status-control[\s\S]*?min-height: 44px/);
});

test('Medical Education statuses match other Account Profile value typography', () => {
  assert.match(
    profileCss,
    /\.medical-education-status-control\s*\{[\s\S]*?font-family:\s*inherit;[\s\S]*?font-size:\s*11\.3px;[\s\S]*?font-weight:\s*800;[\s\S]*?line-height:\s*1\.2;/
  );
  assert.match(
    profileCss,
    /@media \(min-width: 721px\) and \(max-width: 1199px\)[\s\S]*?\.page-account-profile \.account-intelligence-control[\s\S]*?font-size:\s*12\.5px;[\s\S]*?\.page-account-profile \.medical-education-status-control[\s\S]*?font-size:\s*12\.5px;/
  );
});

test('CRM status values are hydrated under stable per-education keys', () => {
  assert.match(sharedSource, /MEDICAL_EDUCATION_STATUS_KEY_PREFIX = 'medicalEducationStatusFor:'/);
  assert.match(sharedSource, /medicalProfileEntries\s*=\s*\([\s\S]*medicalEducationStatusKey\(educationValue\)/);
});
