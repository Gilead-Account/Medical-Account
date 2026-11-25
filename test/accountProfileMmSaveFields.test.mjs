import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url),
  'utf8'
);

const mappedFields = (constantName) => {
  const block = source.match(
    new RegExp(`export const ${constantName} = \\{([\\s\\S]*?)\\n\\};`)
  )?.[1] || '';
  return Object.fromEntries(
    [...block.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9]*):\s*'([^']+)'/g)]
      .map((match) => [match[1], match[2]])
  );
};

test('MM Medical profile uses the confirmed eight Ecosystem Plan fields', () => {
  assert.deepEqual(mappedFields('MM_MEDICAL_PROFILE_FIELD_API_NAMES'), {
    atcProfileCategory: 'KPH_MM_ATC_Profile_Category__c',
    medicalEducation: 'KPH_MM_Medical_Education__c',
    atcProfile: 'KPH_MM_ATC_Profile__c',
    kiteClinicalTrial: 'KPH_MM_Kite_Clinical_Trial__c',
    competitorTrial: 'KPH_MM_Competitor_Trial__c',
    medicalCollaboration: 'KPH_MM_Medical_Collaboration__c',
    researchCapabilitiesTimelines: 'KPH_MM_Research_Capabilities__c',
    medicalEducationStatus: 'KPH_Medical_Education_Status__c',
  });
});

test('DLBCL Medical profile uses the confirmed eight Ecosystem Plan fields', () => {
  assert.deepEqual(mappedFields('DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES'), {
    atcProfileCategory: 'KPH_DLBCL_ATC_Profile_Category__c',
    medicalEducation: 'KPH_DLBCL_Medical_Education__c',
    atcProfile: 'KPH_DLBCL_ATC_Profile__c',
    kiteClinicalTrial: 'KPH_DLBCL_Clinical_Trial__c',
    competitorTrial: 'KPH_DLBCL_Competitor_Trial__c',
    medicalCollaboration: 'KPH_DLBCL_Medical_Collaboration__c',
    researchCapabilitiesTimelines: 'KPH_DLBCL_MM_Research_Capabilities__c',
    medicalEducationStatus: 'KPH_DLBCL_Medical_Education_Status__c',
  });
});

test('Medical profile save is live-only and writes the Ecosystem Plan record', () => {
  const saveBlock = source.match(
    /export const updateMedicalAccountProfileField = \(profileId, field, value\) => \{([\s\S]*?)\n\};/
  )?.[1] || '';

  assert.match(saveBlock, /!hasVeevaRuntime\(\)/);
  assert.match(saveBlock, /MEDICAL_PROFILE_FIELD_API_NAMES\.includes\(field\)/);
  assert.match(saveBlock, /updateRecord\(ACCOUNT_PROFILE_OBJECT, profileId/);
  assert.match(saveBlock, /\{ crm: true \}/);
  assert.doesNotMatch(source, /updateAccountPlanProfileField/);
});
