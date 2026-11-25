import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const accountProfileSource = await readFile(
  new URL('../src/pages/AccountProfile/index.jsx', import.meta.url),
  'utf8'
);
const accountProfileDataSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/accountProfile.js', import.meta.url),
  'utf8'
);
const sharedSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url),
  'utf8'
);
const commercialMmProfileSource = await readFile(
  new URL('../src/pages/AccountProfile/CommercialMmProfileTab.jsx', import.meta.url),
  'utf8'
);
const accountProfileCss = await readFile(
  new URL('../src/pages/AccountProfile/AccountProfile.css', import.meta.url),
  'utf8'
);

const mappedFields = (source, constantName) => {
  const block = source.match(
    new RegExp(`export const ${constantName} = \\{([\\s\\S]*?)\\n\\};`)
  )?.[1] || '';
  return Object.fromEntries(
    [...block.matchAll(/(?:^|\n)\s*(?:'([^']+)'|([A-Za-z][A-Za-z0-9]*)):\s*'([^']+)'/g)]
      .map((match) => [match[1] || match[2], match[3]])
  );
};

const tabsBlock = accountProfileSource.match(/const TABS = \[([\s\S]*?)\];/)?.[1] || '';

test('Medical Account Profile exposes the approved five tabs in order', () => {
  assert.match(
    tabsBlock,
    /MM ATC Medical Profile[\s\S]*DLBCL ATC Medical Profile[\s\S]*MM Comm Profile[\s\S]*DLBCL Comm Profile[\s\S]*Referral & Dynamics/
  );
});

test('Commercial-reference tabs are rendered through read-only components', () => {
  const mmReferenceBlock = accountProfileSource.match(
    /\{tab === 'mm-comm-profile' && \(([\s\S]*?)\n\s*\)\}/
  )?.[1] || '';
  const dlbclReferenceBlock = accountProfileSource.match(
    /\{tab === 'dlbcl-comm-profile' && \(([\s\S]*?)\n\s*\)\}/
  )?.[1] || '';

  assert.match(mmReferenceBlock, /<CommercialMmProfileTab[\s\S]*isReadOnly/);
  assert.match(dlbclReferenceBlock, /<ProfileTab[\s\S]*isReadOnly/);
  assert.doesNotMatch(mmReferenceBlock, /onSave=/);
  assert.doesNotMatch(dlbclReferenceBlock, /onSave=/);
});

test('Commercial-reference data is loaded through resilient read-only field queries', () => {
  assert.match(sharedSource, /export const MM_PROFILE_FIELD_API_NAMES = \{/);
  assert.match(sharedSource, /ACCOUNT_PROFILE_OPTIONAL_FIELDS/);
  assert.match(sharedSource, /fetchAccessibleAccountProfileFields/);
  assert.match(accountProfileDataSource, /const ATTRIBUTE_DEFS = \[/);
  assert.match(accountProfileDataSource, /const REIMBURSEMENT_DEFS = \[/);
  assert.match(accountProfileDataSource, /const DLBCL_PROFILE_QUESTIONS = \[/);
  assert.match(accountProfileDataSource, /fetchCommercialProfilePicklists/);
  assert.match(accountProfileDataSource, /fetchCommercialAccountProfile/);
  assert.match(accountProfileDataSource, /commercialProfilePromise/);
  assert.match(accountProfileDataSource, /\.\.\.\(commercialProfile\?\.mmProfile \|\| \{\}\)/);
});

test('Commercial profile reads and picklists use CRM inside Veeva with local preview fallback', () => {
  assert.match(sharedSource, /export const fetchCommercialAccountProfile = async/);
  assert.match(sharedSource, /const query = useCrm \? runCrmQuery : runQuery/);
  assert.match(sharedSource, /__KPH_COMMERCIAL_PROFILE_QUERY_LOGS__/);
  assert.match(sharedSource, /\[KPH Commercial Profiles\]/);
  assert.match(accountProfileDataSource, /getCrmPicklistValueLabels/);
  assert.match(
    accountProfileDataSource,
    /hasVeevaRuntime\(\) \? getCrmPicklistValueLabels : getPicklistValueLabels/
  );
  assert.match(accountProfileDataSource, /sourceLookup\(\{ account, profile: commercialProfile \}\)/);
  assert.match(accountProfileDataSource, /buildProfileQuestionColumns\(\s*commercialProfile,/);
});

test('Commercial profiles reuse the original Medical fields with Commercial mappings', () => {
  const attributeBlock = accountProfileDataSource.match(
    /const ATTRIBUTE_DEFS = \[([\s\S]*?)\];/
  )?.[1] || '';

  assert.match(sharedSource, /perceptionOfAnitoCel:\s*'KPH_Perception_of_Anito_Cel__c'/);
  assert.match(attributeBlock, /ATC Cohort DLBCL[\s\S]*MM ATC Priority/);
  assert.doesNotMatch(
    attributeBlock,
    /ATC Segment DLBCL|LT Focus\/ Sprint Account|aALL Target|Q vs Q CAR-T Volume Trend|Referral Volume DLBCL|2L\+ DLBCL Treated patient/
  );
  assert.doesNotMatch(commercialMmProfileSource, /commercialTrialCartMix|Commercial vs\. Trial CART Mix/);
  assert.doesNotMatch(sharedSource, /KPH_Commercial_vs_Trial_CAR_T_Mix__c/);
  assert.doesNotMatch(
    accountProfileDataSource,
    /summarizeReferralActivityMetrics|profileWithReferralMetrics/
  );
});

test('MM Comm Profile maps every existing card to enhancement Aug-R2 without adding cards', () => {
  const mmMappings = mappedFields(sharedSource, 'MM_PROFILE_FIELD_API_NAMES');
  const uiKeys = [...new Set(
    [...commercialMmProfileSource.matchAll(/\bkey:\s*'([^']+)'/g)].map((match) => match[1])
  )];

  assert.equal(uiKeys.length, 30);
  assert.deepEqual(Object.keys(mmMappings).sort(), [...uiKeys].sort());
  assert.equal(mmMappings.factAccredited, 'KPH_FACT_Accredited__c');
  assert.equal(mmMappings.perceptionOfAnitoCel, 'KPH_Perception_of_Anito_Cel__c');
  assert.equal(mmMappings.operationalCapacityAssessment, 'KPH_Operational_Capacity_Assessment__c');
  assert.equal(mmMappings.ptStatus, 'KPH_P_T_Status__c');
  assert.equal(mmMappings.mmOpinionLeaders, 'KPH_MM_Opinion_Leaders__c');
  assert.doesNotMatch(commercialMmProfileSource, /commercialTrialCartMix/);
  assert.match(accountProfileSource, /values=\{data\.commercialMmProfile \|\| \{\}\}/);
  assert.match(accountProfileDataSource, /commercialMmProfile:\s*\{ \.\.\.\(commercialProfile\?\.mmProfile \|\| \{\}\) \}/);
});

test('MM Comm Profile hides requested treatment cards and uses consistent blue lines', () => {
  assert.match(commercialMmProfileSource, /title:\s*'MM Treatment Landscape'/);
  assert.doesNotMatch(commercialMmProfileSource, /title:\s*'MM Treatment Landscape & Demand'/);
  for (const key of [
    'secondLineTreatmentPreference',
    'fourthLineTreatmentPreference',
    'perceptionOfAnitoCel',
  ]) {
    assert.match(
      commercialMmProfileSource,
      new RegExp(`key:\\s*'${key}'[^\\n]*hidden:\\s*true`)
    );
  }
  assert.match(
    commercialMmProfileSource,
    /fields:\s*section\.fields\.filter\(\(field\) => !field\.hidden\)/
  );
  assert.match(commercialMmProfileSource, /mm-commercial-workbook/);
  assert.match(
    accountProfileCss,
    /\.mm-commercial-workbook[\s\S]*--mm-commercial-line:\s*#9ed3e6/
  );
  assert.match(
    accountProfileCss,
    /\.account-intelligence-field\.is-readonly[\s\S]*border-left-color:\s*var\(--mm-commercial-accent\)/
  );
});

test('MM Comm Profile keeps each section number visually attached to its title', () => {
  assert.match(
    commercialMmProfileSource,
    /className="account-intelligence-section-heading"[\s\S]*className="account-intelligence-section-number"[\s\S]*<h3>\{section\.title\}<\/h3>/
  );
  assert.match(
    accountProfileCss,
    /\.mm-commercial-workbook \.account-intelligence-section-heading\s*\{[\s\S]*grid-template-columns:\s*28px minmax\(0, 1fr\)/
  );
  assert.match(
    accountProfileCss,
    /\.mm-commercial-workbook \.account-intelligence-section-number\s*\{[\s\S]*background:\s*var\(--mm-commercial-accent\)/
  );
});

test('DLBCL Comm Profile maps only its existing cards to enhancement Aug-R2 fields', () => {
  const dlbclMappings = mappedFields(sharedSource, 'DLBCL_COMM_PROFILE_FIELD_API_NAMES');
  const expectedKeys = [
    'atcCohort',
    'payerMix',
    'payerType',
    'topPayersName',
    'dlbclCapacityImpact',
    'dlbclOpBusinessPct',
    'dlbclFinancialConstraint',
    'dlbclPreferOpSetting',
    'dlbclOpSettingReasons',
    'dlbclBispecificTiming',
    'dlbclBispecificImpact',
    'dlbclOpUseDetails',
    'dlbclBreyanziCompetition',
    'dlbclBreyanziIndication',
  ];

  assert.deepEqual(Object.keys(dlbclMappings), expectedKeys);
  assert.equal(dlbclMappings.atcCohort, 'KPH_ATC_Cohort__c');
  assert.equal(dlbclMappings.payerMix, 'KPH_Payer_Mix__c');
  assert.equal(dlbclMappings.topPayersName, 'KPH_Top_3_Payers_Name__c');
  assert.equal(
    dlbclMappings.dlbclCapacityImpact,
    'KPH_Is_capacity_having_an_impact_on_CART__c'
  );
  assert.equal(
    dlbclMappings.dlbclBreyanziIndication,
    'KPH_If_yes_in_what_indication__c'
  );
  assert.match(accountProfileDataSource, /crmField:\s*'KPH_Is_capacity_having_an_impact_on_CART__c'/);
  assert.match(accountProfileDataSource, /crmField:\s*'KPH_If_yes_in_what_indication__c'/);
  assert.doesNotMatch(
    accountProfileDataSource.match(/const ATTRIBUTE_DEFS = \[([\s\S]*?)\];/)?.[1] || '',
    /ATC Segment DLBCL|LT Focus\/ Sprint Account|aALL Target|Referral Volume DLBCL/
  );
});
