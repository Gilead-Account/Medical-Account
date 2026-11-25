import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const accountProfileSource = await readFile(
  new URL('../src/pages/AccountProfile/index.jsx', import.meta.url),
  'utf8'
);
const referralDynamicsSource = await readFile(
  new URL('../src/pages/AccountProfile/ReferralDynamicsTab.jsx', import.meta.url),
  'utf8'
);
const profileTabSource = await readFile(
  new URL('../src/pages/AccountProfile/ProfileTab.jsx', import.meta.url),
  'utf8'
);
const accountProfileCss = await readFile(
  new URL('../src/pages/AccountProfile/AccountProfile.css', import.meta.url),
  'utf8'
);
const accountProfileFieldHelpSource = await readFile(
  new URL('../src/components/AccountProfileFieldHelp.jsx', import.meta.url),
  'utf8'
);
const accountInsightsTabSource = await readFile(
  new URL('../src/pages/AccountProfile/AccountInsightsTab.jsx', import.meta.url),
  'utf8'
);
const accountInsightModalSource = await readFile(
  new URL('../src/pages/AccountProfile/AccountInsightEditModal.jsx', import.meta.url),
  'utf8'
);
const healthcareNetworkModalSource = await readFile(
  new URL('../src/pages/AccountProfile/HealthcareNetworkEditModal.jsx', import.meta.url),
  'utf8'
);
const accountProfileDataSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/accountProfile.js', import.meta.url),
  'utf8'
);
const accountPlanSharedSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url),
  'utf8'
);
const accountIntelligenceTabSource = await readFile(
  new URL('../src/pages/AccountProfile/AccountIntelligenceTab.jsx', import.meta.url),
  'utf8'
);
const commercialMmProfileSource = await readFile(
  new URL('../src/pages/AccountProfile/CommercialMmProfileTab.jsx', import.meta.url),
  'utf8'
);
const mockFixturesSource = await readFile(
  new URL('../src/lib/mockData/fixtures.js', import.meta.url),
  'utf8'
);
const mockAdapterSource = await readFile(
  new URL('../src/lib/mockData/mockAdapter.js', import.meta.url),
  'utf8'
);
const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

const tabsBlock = accountProfileSource.match(/const TABS = \[([\s\S]*?)\];/);
const profileQuestionFocusWithinBlock = accountProfileCss.match(
  /\.profile-question-select-shell:focus-within\s*\{([\s\S]*?)\}/
)?.[1] || '';
const profileQuestionSelectValueBlock = accountProfileCss.match(
  /\.profile-question-select-value\s*\{([\s\S]*?)\}/
)?.[1] || '';
const accountInformationFieldsBlock = accountIntelligenceTabSource.match(
  /const accountInformationFields = \(mmProfilePicklists = \{\}\) => \[([\s\S]*?)\];/
)?.[1] || '';
const accountInformation340bBlock = accountInformationFieldsBlock.match(
  /\{\s*key:\s*'340bAccount'[\s\S]*?\n\s*\},/
)?.[0] || '';

test('Account Profile tab bar exposes only medical profiles and Referral & Dynamics', () => {
  assert.ok(tabsBlock, 'Account Profile TABS constant was not found.');
  assert.match(appSource, /label: 'Medical Account Profile', shortLabel: 'MP'/);
  assert.match(tabsBlock[1], /label:\s*'MM ATC Medical Profile'/);
  assert.match(tabsBlock[1], /label:\s*'DLBCL ATC Medical Profile'/);
  assert.match(tabsBlock[1], /key:\s*'referral-dynamics'/);
  assert.doesNotMatch(tabsBlock[1], /MM Comm Profile|DLBCL Comm Profile|mm-comm-profile|dlbcl-comm-profile/);
  assert.doesNotMatch(tabsBlock[1], /key:\s*'account-insights'/);
});

test('Account Profile renders medical profile components without commercial profile tabs', () => {
  assert.match(accountProfileSource, /import AccountIntelligenceTab/);
  assert.match(
    accountProfileSource,
    /\['mm-medical-profile', 'dlbcl-medical-profile'\]\.includes\(tab\)/
  );
  assert.doesNotMatch(accountProfileSource, /CommercialMmProfileTab|tab === 'mm-comm-profile'|tab === 'dlbcl-comm-profile'/);
});

test('Account Profile tab order matches the approved reference screenshot', () => {
  assert.match(
    tabsBlock[1],
    /MM ATC Medical Profile[\s\S]*DLBCL ATC Medical Profile[\s\S]*Referral & Dynamics/
  );
  assert.match(accountProfileSource, /initialTab : 'mm-medical-profile'/);
});

test('Account Profile sidebar page opens on the MM Profile tab by default', () => {
  assert.match(
    appSource,
    /activeKey === 'kpi'[\s\S]*?<AccountProfile[\s\S]*?initialTab="mm-medical-profile"/
  );
  assert.doesNotMatch(
    appSource,
    /activeKey === 'kpi'[\s\S]*?<AccountProfile[\s\S]*?initialTab="dlbcl-comm-profile"/
  );
});

test('Account Profile empty values render as a dash instead of Not entered', () => {
  assert.doesNotMatch(profileTabSource, /Not entered/);
  assert.doesNotMatch(referralDynamicsSource, /Not entered/);
  assert.doesNotMatch(accountIntelligenceTabSource, /Not entered/);
});

test('MM Profile fields are mapped to their owning CRM objects', () => {
  assert.match(accountIntelligenceTabSource, /MM_PROFILE_FIELD_API_NAMES/);
  assert.match(accountPlanSharedSource, /export const MM_PROFILE_FIELD_API_NAMES = \{/);
  [
    'KPH_ATC_Profile_Category__c',
    'KPH_Medical_Education__c',
    'KPH_ATC_Profile_1__c',
    'KPH_Kite_Clinical_Trial__c',
    'KPH_Competitor_Trial__c',
    'KPH_Medical_Collaboration__c',
    'KPH_Research_Capabilities_Timelines__c',
  ].forEach((apiName) => {
    assert.match(accountPlanSharedSource, new RegExp(apiName));
  });
  assert.match(accountPlanSharedSource, /Object\.entries\(MM_PROFILE_FIELD_API_NAMES\)/);
  assert.match(accountPlanSharedSource, /ACCOUNT_PLAN_RESEARCH_CAPABILITIES_FIELD/);
  assert.match(accountPlanSharedSource, /ACCOUNT_PLAN_MM_PROFILE_FIELD_API_NAMES/);
  assert.match(accountPlanSharedSource, /mmProfile,/);
  assert.match(accountProfileDataSource, /\.\.\.\(plan\?\.mmProfile \|\| \{\}\)/);
  assert.match(accountProfileDataSource, /ACCOUNT_PLAN_MM_PROFILE_FIELDS\.has\(field\)[\s\S]*updateAccountPlanProfileField/);
  assert.match(accountIntelligenceTabSource, /key:\s*'atcProfileCategory'[\s\S]*?inputType:\s*'multiselect'/);
  assert.match(accountIntelligenceTabSource, /key:\s*'medicalEducation'[\s\S]*?inputType:\s*'education-status-list'/);
  assert.match(accountIntelligenceTabSource, /key:\s*'atcProfileSummary'[\s\S]*?inputType:\s*'text'/);
  assert.doesNotMatch(accountIntelligenceTabSource, /Strategic Opportunities/);
});

test('MM Profile picklists render CRM metadata options instead of hardcoded values', () => {
  assert.match(
    accountIntelligenceTabSource,
    /key:\s*'atcProfileCategory'[\s\S]*?options:\s*mmProfilePicklists\[MM_PROFILE_FIELD_API_NAMES\.atcProfileCategory\]\s*\|\|\s*\[\]/
  );
  assert.match(
    accountIntelligenceTabSource,
    /key:\s*'medicalEducation'[\s\S]*?options:\s*mmProfilePicklists\[MM_PROFILE_FIELD_API_NAMES\.medicalEducation\]\s*\|\|\s*\[\]/
  );
  assert.match(
    accountIntelligenceTabSource,
    /key:\s*'kiteClinicalTrial'[\s\S]*?options:\s*mmProfilePicklists\[MM_PROFILE_FIELD_API_NAMES\.kiteClinicalTrial\]\s*\|\|\s*\[\]/
  );
  assert.match(
    accountIntelligenceTabSource,
    /key:\s*'medicalCollaboration'[\s\S]*?options:\s*mmProfilePicklists\[MM_PROFILE_FIELD_API_NAMES\.medicalCollaboration\]\s*\|\|\s*\[\]/
  );
});

test('MM and DLBCL ATC multiselect chevrons match the standard profile selects', () => {
  assert.doesNotMatch(accountIntelligenceTabSource, /⌄/);
  assert.match(
    accountProfileCss,
    /select\.account-intelligence-control,\s*\n\.page-account-profile \.medical-multiselect-trigger\s*\{[\s\S]*?calc\(100% - 14px\) 50%[\s\S]*?calc\(100% - 9px\) 50%/
  );
});

test('both ATC Medical Profile tabs receive populated multi-select mock data', () => {
  assert.match(accountProfileSource, /\['mm-medical-profile', 'dlbcl-medical-profile'\]\.includes\(tab\)/);
  assert.match(accountProfileSource, /values=\{data\.mmProfile \|\| \{\}\}/);
  assert.match(mockFixturesSource, /KPH_ATC_Profile_Category__c: 'Academic ATC;High Research Engagement;Outpatient Expansion'/);
  assert.match(mockFixturesSource, /KPH_Medical_Education__c: 'Peer-to-Peer Education;Tumor Board Education'/);
  assert.match(mockFixturesSource, /KPH_Kite_Clinical_Trial__c: 'ZUMA-7;ZUMA-24'/);
  assert.match(mockFixturesSource, /KPH_Medical_Collaboration__c:[\s\S]*?'Scientific Exchange;Investigator-Initiated Research;RWE Collaboration'/);
  assert.match(mockAdapterSource, /Account_Plan_vod__c:[\s\S]*?KPH_ATC_Profile_Category__c:[\s\S]*?KPH_Medical_Education__c:[\s\S]*?KPH_Kite_Clinical_Trial__c:[\s\S]*?KPH_Medical_Collaboration__c:/);
  assert.match(accountIntelligenceTabSource, /editValue\(value\)\.split\(';'\)/);
  assert.match(accountIntelligenceTabSource, /Array\.from\(next\)\.join\(';'\)/);
});

test('Commercial MM editable CRM picklists render as selects', () => {
  [
    'outpatientCartCapability',
    'operationalCapacityAssessment',
    'ptStatus',
    'ptTimingNextReview',
    'formularyStatus',
  ].forEach((key) => {
    assert.match(
      commercialMmProfileSource,
      new RegExp(`key:\\s*'${key}'[^\\n]*inputType:\\s*'select'[^\\n]*mmProfilePicklists`)
    );
  });
});

test('MM Profile uses KPH_Ecosystem_Plan__c and omits unrelated account information fields', () => {
  assert.match(accountPlanSharedSource, /export const ACCOUNT_PROFILE_OBJECT = 'KPH_Ecosystem_Plan__c';/);
  assert.match(
    accountPlanSharedSource,
    /runQuery\(\{[\s\S]*?object:\s*ACCOUNT_PROFILE_OBJECT[\s\S]*?fields:\s*ACCOUNT_PROFILE_BASE_FIELDS/
  );
  assert.match(accountPlanSharedSource, /export const ACCOUNT_PROFILE_OPTIONAL_FIELDS = ACCOUNT_PROFILE_FIELDS\.filter/);
  assert.match(accountPlanSharedSource, /getFieldLabel called with field that cannot be accessed/);
  assert.match(accountPlanSharedSource, /fetchAccessibleAccountProfileFields\(where, fields\.slice\(0, midpoint\)\)/);
  assert.match(accountPlanSharedSource, /fetchAccessibleAccountProfileFields\(where, fields\.slice\(midpoint\)\)/);
  assert.match(accountIntelligenceTabSource, /const accountInformationFields = \(\) => \[\]/);
});

test('Account Plan shell isolates profile-restricted fields instead of failing the page', () => {
  assert.match(accountPlanSharedSource, /const fetchAccessiblePlanFields = async \(where, fields\) =>/);
  assert.match(accountPlanSharedSource, /fetchAccessiblePlanFields\(where, fields\.slice\(0, midpoint\)\)/);
  assert.match(accountPlanSharedSource, /fetchAccessiblePlanFields\(where, fields\.slice\(midpoint\)\)/);
  assert.match(
    accountPlanSharedSource,
    /const accessibleRecord = await fetchAccessiblePlanFields\(where, optionalFields\)/
  );
});

test('MM Profile tab renders CRM-backed values with local editable controls', () => {
  assert.match(accountIntelligenceTabSource, /values = \{\}/);
  assert.match(accountIntelligenceTabSource, /valueFromProfile/);
  assert.match(
    accountIntelligenceTabSource,
    /useState\(\(\) =>\s*buildInitialEditableValues\(values, sections, accountFields\)\s*\)/
  );
  assert.match(accountIntelligenceTabSource, /function AccountIntelligenceControl/);
  assert.match(accountProfileCss, /\.account-intelligence-control/);
});

test('Medical Profile uses one Save button in the section header for all changed fields', () => {
  assert.doesNotMatch(accountProfileSource, /tab === 'mm-comm-profile' && mmProfileSaveAction/);
  assert.match(accountIntelligenceTabSource, /saveAction=\{index === 0 \? \{/);
  assert.match(accountIntelligenceTabSource, /className="account-intelligence-save-button"/);
  assert.match(accountIntelligenceTabSource, /onClick=\{saveAction\.onSave\}/);
  assert.match(accountIntelligenceTabSource, /onSaveActionChange/);
  assert.match(accountIntelligenceTabSource, /onSaveActionChange\(\{/);
  assert.match(accountIntelligenceTabSource, /const dirtyItems = useMemo/);
  assert.match(accountIntelligenceTabSource, /const hasUnsaved = dirtyItems\.length > 0/);
  assert.match(accountIntelligenceTabSource, /hasUnsaved \? `Save \(\$\{dirtyCount\}\)` : 'Save'/);
  assert.match(accountIntelligenceTabSource, /for \(const item of dirtyItems\)/);
  assert.doesNotMatch(accountIntelligenceTabSource, /<div className="mm-profile-head">/);
  assert.doesNotMatch(accountIntelligenceTabSource, /<h3>MM Profile<\/h3>/);
  assert.doesNotMatch(accountIntelligenceTabSource, /function SectionSaveAction/);
  assert.doesNotMatch(accountIntelligenceTabSource, /onSaveSection/);
  assert.doesNotMatch(accountProfileCss, /\.mm-profile-head/);
  assert.match(
    accountProfileCss,
    /\.account-profile-tabs-card\s*\{[\s\S]*?position:\s*sticky[\s\S]*?top:\s*0/
  );
  assert.match(
    accountProfileCss,
    /\.account-profile-tabs-card\s*\{[\s\S]*?z-index:\s*30/
  );
});

test('commercial profile tabs and render paths are removed', () => {
  assert.doesNotMatch(accountProfileSource, /COMMERCIAL_PROFILES_ARE_READ_ONLY/);
  assert.doesNotMatch(accountProfileSource, /mm-comm-profile|dlbcl-comm-profile/);
  assert.doesNotMatch(accountProfileSource, /CommercialMmProfileTab|<ProfileTab/);
});

test('MM Comm Profile omits Commercial vs. Trial CART Mix', () => {
  assert.doesNotMatch(commercialMmProfileSource, /Commercial vs\. Trial CART Mix|commercialTrialCartMix/);
  assert.doesNotMatch(accountPlanSharedSource, /KPH_Commercial_vs_Trial_CAR_T_Mix__c/);
});

test('MM Comm Profile groups the three bispecific utilization cards on one row', () => {
  assert.match(
    commercialMmProfileSource,
    /key:\s*'currentBispecificUtilization'[\s\S]*?layout:\s*'mm-bispecific'[\s\S]*?key:\s*'fourthLinePatientEstimate'[\s\S]*?layout:\s*'mm-bispecific'[\s\S]*?key:\s*'bispecificUse'[\s\S]*?layout:\s*'mm-bispecific'/
  );
  assert.match(
    accountProfileCss,
    /\.is-mm-treatment \.account-intelligence-field\.is-mm-bispecific\s*\{\s*grid-column:\s*span 4;/
  );
});

test('MM Profile read-only editable fields render disabled controls', () => {
  assert.match(accountIntelligenceTabSource, /disabled=\{!isEditable\}/);
  assert.match(accountIntelligenceTabSource, /item\.editable && isReadOnly \? 'is-readonly' : ''/);
  assert.match(accountProfileCss, /\.account-intelligence-control:disabled/);
  assert.match(accountProfileCss, /\.account-intelligence-field\.is-readonly/);
});

test('MM Profile text fields are limited to 250 characters', () => {
  assert.match(accountIntelligenceTabSource, /const MM_PROFILE_TEXT_MAX_LENGTH = 250/);
  assert.match(accountIntelligenceTabSource, /maxLength=\{MM_PROFILE_TEXT_MAX_LENGTH\}/);
  assert.doesNotMatch(accountIntelligenceTabSource, /maxLength=\{500\}|maxLength=\{?500\}?/);
});

test('original diagram MM Profile fields render in the required order and form', () => {
  assert.match(accountProfileSource, /mmProfilePicklists=\{data\.mmProfilePicklists \|\| \{\}\}/);
  assert.match(accountIntelligenceTabSource, /mmProfilePicklists = \{\}/);
  assert.match(accountIntelligenceTabSource, /atcProfileCategory[\s\S]*medicalEducation[\s\S]*atcProfileSummary[\s\S]*kiteClinicalTrial[\s\S]*competitorTrial[\s\S]*medicalCollaboration[\s\S]*researchCapabilitiesTimelines/);
  assert.match(accountIntelligenceTabSource, /function MedicalMultiSelect[\s\S]*aria-expanded=\{isOpen\}/);
  assert.doesNotMatch(accountIntelligenceTabSource, /projectedAnitoCelDemand|accessBarriers|cartProgramStructure/);
  assert.match(accountProfileCss, /\.is-medical-profile-diagram \.account-intelligence-field-grid/);
  assert.match(accountIntelligenceTabSource, /const MM_PROFILE_TEXT_MAX_LENGTH = 250/);
  assert.match(accountIntelligenceTabSource, /maxLength=\{MM_PROFILE_TEXT_MAX_LENGTH\}/);
});

test('Account Insights is not exposed as a standalone page', () => {
  assert.doesNotMatch(appSource, /key:\s*'account-insights'|activeKey === 'account-insights'|initialTab="account-insights"/);
});

test('Referral and Dynamics tab shows MM Regional Dynamics directly below DLBCL', () => {
  assert.match(
    referralDynamicsSource,
    /<RegionalDynamicsPanel[\s\S]*?indication="DLBCL"[\s\S]*?content=\{regionalDynamics\?\.DLBCL\}[\s\S]*?\/>\s*<RegionalDynamicsPanel[\s\S]*?indication="MM"[\s\S]*?content=\{regionalDynamics\?\.MM\}[\s\S]*?\/>\s*<HealthcareNetworksCard/
  );
});

test('Regional Dynamics and Other Healthcare Networks are always read only', () => {
  const regionalPanel = referralDynamicsSource.match(
    /function RegionalDynamicsPanel[\s\S]*?\n\}/
  )?.[0] || '';
  const networkCard = referralDynamicsSource.match(
    /function HealthcareNetworksCard[\s\S]*?\n\}/
  )?.[0] || '';

  assert.doesNotMatch(regionalPanel, />\s*Edit\s*</);
  assert.doesNotMatch(networkCard, />\s*Add\s*</);
  assert.doesNotMatch(networkCard, /ReferralEditButton/);
  assert.match(networkCard, /network-table is-read-only/);
  assert.doesNotMatch(accountProfileSource, /onEditHealthcareNetwork=|onAddHealthcareNetwork=|onEditRegionalDynamics=/);
  assert.match(accountProfileCss, /\.network-table\.is-read-only \.profile-table-head/);
});

test('Referral and Dynamics tab exposes only the requested section info icons', () => {
  assert.match(accountProfileFieldHelpSource, /referralMapping:/);
  assert.match(accountProfileFieldHelpSource, /dlbclRegionalDynamics:/);
  assert.match(accountProfileFieldHelpSource, /healthcareNetworks:/);
  assert.match(referralDynamicsSource, /helpKey="referralMapping"/);
  assert.match(referralDynamicsSource, /helpKey="dlbclRegionalDynamics"/);
  assert.match(referralDynamicsSource, /helpKey="healthcareNetworks"/);
  assert.equal([...referralDynamicsSource.matchAll(/AccountProfileFieldHelp helpKey=/g)].length, 3);
  assert.doesNotMatch(accountProfileFieldHelpSource, /hcpTargetCount:|referralPriority:|indication:/);
  assert.doesNotMatch(referralDynamicsSource, /helpKey="hcpTargetCount"|helpKey="referralPriority"|helpKey="indication"/);
});

test('Top 3 Payers always spans two reimbursement rows with vertical payer rows', () => {
  assert.match(profileTabSource, /has-expanded-top-payers/);
  assert.match(profileTabSource, /\.split\(\s*\/\[\\\/\\n\]\+\/\s*\)/);
  assert.doesNotMatch(profileTabSource, /\.split\(\s*\/\[[^\]]*,/);
  assert.match(profileTabSource, /has-no-top-payers/);
  assert.match(profileTabSource, /has-one-top-payer/);
  assert.match(profileTabSource, /has-two-top-payers/);
  assert.match(profileTabSource, /has-three-top-payers/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1\.08fr\)\s*minmax\(0,\s*0\.92fr\)/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid[\s\S]*?grid-template-rows:\s*repeat\(2,\s*minmax\(64px,\s*auto\)\)/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid \.is-top-payers-ranked[\s\S]*?grid-row:\s*1 \/ span 2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid \.is-payer-type[\s\S]*?grid-column:\s*2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid \.is-payer-mix[\s\S]*?grid-column:\s*2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-expanded-top-payers[\s\S]*?\.is-top-payers-ranked[\s\S]*?grid-column:\s*1/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-expanded-top-payers[\s\S]*?\.is-top-payers-ranked[\s\S]*?grid-row:\s*1 \/ span 2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-expanded-top-payers[\s\S]*?\.is-payer-mix[\s\S]*?grid-column:\s*2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-expanded-top-payers[\s\S]*?\.is-payer-type[\s\S]*?grid-column:\s*2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-two-top-payers \.top-payers-ranked-list[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-three-top-payers \.top-payers-ranked-list[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-expanded-top-payers[\s\S]*?\.top-payers-ranked-row strong[\s\S]*?white-space:\s*normal/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-expanded-top-payers[\s\S]*?\.top-payers-ranked-row strong[\s\S]*?font-size:\s*12px/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-expanded-top-payers[\s\S]*?\.profile-attribute-card:not\(\.is-top-payers-ranked\)[\s\S]*?min-height:\s*64px/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-compact-top-payers[\s\S]*?\.is-top-payers-ranked[\s\S]*?grid-row:\s*1 \/ span 2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid\.has-compact-top-payers[\s\S]*?\.is-payer-mix[\s\S]*?grid-column:\s*2/);
  assert.match(accountProfileCss, /\.reimbursement-card-grid \.is-payer-mix strong[\s\S]*?white-space:\s*normal/);
});

test('DLBCL Comm Profile keeps only Carrissa-approved Account Attribute cards', () => {
  const attributeBlock = accountProfileDataSource.match(/const ATTRIBUTE_DEFS = \[([\s\S]*?)\];/)?.[1] || '';
  const reimbursementBlock = accountProfileDataSource.match(/const REIMBURSEMENT_DEFS = \[([\s\S]*?)\];/)?.[1] || '';

  assert.doesNotMatch(attributeBlock, /Account Name/);
  assert.doesNotMatch(attributeBlock, /label:\s*'EID'/);
  assert.doesNotMatch(attributeBlock, /Territory/);
  assert.doesNotMatch(attributeBlock, /Plan Status/);
  assert.doesNotMatch(attributeBlock, /Referral Strategy Target/);
  assert.doesNotMatch(attributeBlock, /Referral Volume DLBCL|2L\+ DLBCL Treated patient/);
  assert.doesNotMatch(attributeBlock, /aALL Target|Q vs Q CAR-T Volume Trend/);
  assert.doesNotMatch(attributeBlock, /ATC Segment DLBCL|LT Focus\/ Sprint Account/);
  assert.match(attributeBlock, /ATC Cohort DLBCL[\s\S]*?field:\s*'atcCohort'/);
  assert.match(attributeBlock, /MM ATC Priority/);
  // KAD Target List was removed from the Account Profile attribute grid.
  assert.doesNotMatch(attributeBlock, /KAD Target List|kadTargetList/);
  assert.doesNotMatch(reimbursementBlock, /Referral Strategy Target/);
  assert.doesNotMatch(reimbursementBlock, /Referral Volume|2L\+/);
});

test('Account Profile visible fields expose compact info help icons', () => {
  [
    'aallTarget',
    'qVsQCartVolumeTrend',
    'atcCohort',
    'atcSegment',
    'kltSprint',
    'topPayers',
    'payerType',
    'payerMix',
    'dlbclProfile',
  ].forEach((key) => {
    assert.match(accountProfileFieldHelpSource, new RegExp(`${key}:`));
  });

  // KAD Target List was removed from the Account Profile attribute grid.
  assert.doesNotMatch(accountProfileFieldHelpSource, /kadTarget:/);

  // Referral Volume and 2L+ Volume intentionally carry no help icon.
  assert.doesNotMatch(accountProfileFieldHelpSource, /referralVolume:/);
  assert.doesNotMatch(accountProfileFieldHelpSource, /secondLinePlusVolume:/);

  assert.match(accountProfileDataSource, /helpKey:\s*def\.key/);
  assert.match(profileTabSource, /AccountProfileFieldHelp/);
  assert.match(profileTabSource, /className="profile-attribute-help"/);
  assert.match(profileTabSource, /helpKey="dlbclProfile"/);
  assert.match(accountProfileCss, /\.account-profile-field-help \.field-help-button[\s\S]*?width:\s*15px/);
  assert.match(accountProfileCss, /\.profile-attribute-help \.field-help-button[\s\S]*?width:\s*14px/);
  assert.doesNotMatch(accountProfileFieldHelpSource, /Referral Strategy Target|referralStrategyTarget/);
});

test('Account Profile card fields are mapped from KPH_Ecosystem_Plan__c profile columns', () => {
  const profileMapperBlock = accountPlanSharedSource.match(
    /export const toAccountProfile = \(row\) => \{([\s\S]*?)\n\};/
  )?.[1] || '';

  assert.match(profileMapperBlock, /aallTarget:\s*r\.KPH_aALL_Target__c/);
  assert.match(profileMapperBlock, /cartVolumeTrend:\s*r\.KPH_Volume_Trend__c/);
  assert.match(accountPlanSharedSource, /KPH_Referral_Count__c/);
  assert.match(accountPlanSharedSource, /KPH_X2L_DLBCL_Treated_Patients__c/);
  assert.match(accountProfileDataSource, /summarizeReferralActivityMetrics\(referralAccounts\)/);
  assert.doesNotMatch(accountPlanSharedSource, /REFERRAL_VOLUME_DUMMY/);
  assert.doesNotMatch(accountPlanSharedSource, /SECOND_LINE_PLUS_VOLUME_DUMMY/);
  assert.doesNotMatch(profileMapperBlock, /cartVolumeTrend:\s*firstFilled/);
});

test('Account Insights add button says Add Insight', () => {
  assert.match(accountInsightsTabSource, />\s*Add Insight\s*</);
  assert.doesNotMatch(accountInsightsTabSource, />\s*Add\s*</);
});

test('Account Insights create path passes Account Profile id for Monthly Executive Summary link', () => {
  assert.match(accountProfileSource, /const profileId = data\.profileId/);
  assert.match(accountProfileSource, /addAccountInsight\(planId,\s*profileId,\s*form\)/);
  assert.match(accountPlanSharedSource, /KPH_Account_Profile__c/);
});

test('Account Insights exposes Indication in the table and popup', () => {
  assert.match(accountInsightsTabSource, /\{\s*key:\s*'indication',\s*label:\s*'Indication'\s*\}/);
  assert.match(accountInsightModalSource, /Field label="Indication"/);
  assert.match(accountInsightModalSource, /name="accountInsightIndication"/);
  assert.match(accountProfileSource, /indicationOptions=\{data\.accountInsightIndicationOptions \|\| \[\]\}/);
});

test('Healthcare Network create path passes Account Profile id for Other Healthcare Networks link', () => {
  assert.match(accountProfileSource, /const profileId = data\.profileId/);
  assert.match(accountProfileSource, /addHealthcareNetwork\(profileId,\s*form\)/);
});

test('Healthcare Network add modal starts with a blank Account Name lookup', () => {
  const initialFormBlock = healthcareNetworkModalSource.match(
    /const buildInitialForm = \(record, defaultAccount\) => \(\{([\s\S]*?)\}\);/
  )?.[1] || '';

  assert.match(initialFormBlock, /accountId:\s*record\?\.accountId\s*\|\|\s*''/);
  assert.match(initialFormBlock, /accountName:\s*record\?\.accountName\s*\|\|\s*''/);
  assert.doesNotMatch(initialFormBlock, /defaultAccount\?\.(id|name)/);
});

test('Referral Mapping is read only without create or edit modal wiring', () => {
  assert.doesNotMatch(accountProfileSource, /ReferralAccountEditModal|addReferralAccount|saveReferralAccount|deleteReferralAccount/);
  assert.doesNotMatch(referralDynamicsSource, /ReferralEditButton|onAddReferral|onEditReferral|>\s*Add\s*</);
});

test('DLBCL profile answer picklists use native select controls', () => {
  assert.match(profileTabSource, /<select[\s\S]*?profile-question-select-input/);
  assert.doesNotMatch(profileTabSource, /profile-question-select-menu/);
  assert.doesNotMatch(profileTabSource, /role="listbox"/);
  assert.doesNotMatch(accountProfileCss, /profile-question-select-option/);
});

test('DLBCL profile If yes follow-ups use editable checkbox multi-selects', () => {
  assert.match(accountPlanSharedSource, /KPH_If_Yes_to_above_reasons__c/);
  assert.match(
    accountProfileDataSource,
    /key:\s*'opSettingReasons'[\s\S]*?type:\s*'multipicklist'[\s\S]*?crmField:\s*'KPH_If_Yes_to_above_reasons__c'/
  );
  assert.match(
    accountProfileDataSource,
    /key:\s*'breyanziIndication'[\s\S]*?type:\s*'multipicklist'[\s\S]*?crmField:\s*'KPH_If_yes_in_what_indication__c'/
  );
  assert.match(profileTabSource, /profile-question-multi-menu/);
  assert.match(profileTabSource, /type="checkbox"/);
  assert.match(profileTabSource, /toggleMultiSelectValue/);
  assert.match(profileTabSource, /join\(MULTI_PICKLIST_SEPARATOR\)/);
  assert.match(accountProfileCss, /\.profile-question-multi-menu/);
  assert.match(accountProfileCss, /\.profile-question-multi-menu[\s\S]*?bottom:\s*calc\(100% \+ 4px\)/);
  assert.doesNotMatch(accountProfileCss, /\.profile-question-multi-menu[\s\S]*?top:\s*calc\(100% \+ 4px\)/);
});

test('DLBCL profile closed dropdown value wraps while native select handles options', () => {
  assert.match(profileTabSource, /profile-question-select-shell/);
  assert.match(profileTabSource, /profile-question-select-value/);
  assert.match(profileTabSource, /aria-hidden="true"/);
  assert.match(accountProfileCss, /\.profile-question-select-value[\s\S]*?white-space:\s*normal/);
  assert.match(accountProfileCss, /\.profile-question-select-value[\s\S]*?overflow-wrap:\s*anywhere/);
  assert.match(profileQuestionSelectValueBlock, /border:\s*0/);
  assert.match(accountProfileCss, /\.profile-question-select-input[\s\S]*?opacity:\s*0/);
  assert.match(accountProfileCss, /\.profile-question-select-input[\s\S]*?-webkit-appearance:\s*none/);
  assert.match(accountProfileCss, /\.profile-question-select-input[\s\S]*?appearance:\s*none/);
  assert.match(accountProfileCss, /\.profile-question-select-input:focus,[\s\S]*?\.profile-question-select-input:focus-visible[\s\S]*?outline:\s*0/);
  assert.match(profileQuestionFocusWithinBlock, /border-color:\s*var\(--line\)/);
  assert.doesNotMatch(profileQuestionFocusWithinBlock, /box-shadow:\s*0 0 0 2px/);
});

test('DLBCL profile select shell masks native iPad dropdown chrome', () => {
  assert.match(accountProfileCss, /\.profile-question-select-shell[\s\S]*?overflow:\s*hidden/);
  assert.match(accountProfileCss, /\.profile-question-select-shell[\s\S]*?isolation:\s*isolate/);
  assert.match(accountProfileCss, /\.profile-question-select-shell::before[\s\S]*?pointer-events:\s*none/);
  assert.match(accountProfileCss, /\.profile-question-select-shell::before[\s\S]*?z-index:\s*2/);
  assert.match(accountProfileCss, /\.profile-question-select-value[\s\S]*?pointer-events:\s*none/);
  assert.match(accountProfileCss, /\.profile-question-select-input[\s\S]*?z-index:\s*1/);
  assert.match(accountProfileCss, /\.profile-question-select-input[\s\S]*?background-image:\s*none\s*!important/);
  assert.match(accountProfileCss, /\.profile-question-select-input[\s\S]*?-webkit-text-fill-color:\s*transparent/);
});

test('DLBCL profile desktop native dropdown option text stays readable', () => {
  assert.match(
    accountProfileCss,
    /@media \(min-width:\s*1200px\)[\s\S]*?\.profile-question-select-input option\s*\{[\s\S]*?color:\s*var\(--ink\)/
  );
  assert.match(
    accountProfileCss,
    /@media \(min-width:\s*1200px\)[\s\S]*?\.profile-question-select-input option\s*\{[\s\S]*?-webkit-text-fill-color:\s*var\(--ink\)/
  );
  assert.match(
    accountProfileCss,
    /@media \(min-width:\s*1200px\)[\s\S]*?\.profile-question-select-input option\s*\{[\s\S]*?background:\s*#fff/
  );
});

test('DLBCL profile tablet table reserves readable question and answer columns', () => {
  assert.match(accountProfileCss, /Balanced iPad DLBCL question layout/);
  assert.match(accountProfileCss, /\.profile-question-table \.profile-question-head,[\s\S]*?\.profile-question-table \.profile-question-row[\s\S]*?grid-template-columns:\s*minmax\(132px,\s*0\.9fr\)\s*minmax\(0,\s*1\.45fr\)/);
  assert.doesNotMatch(accountProfileCss, /grid-template-columns:\s*minmax\(0,\s*0\.55fr\)\s*minmax\(0,\s*1\.7fr\)/);
});

test('DLBCL profile answer column does not draw a divider through native select values', () => {
  const groupedAnswerCellBlock = accountProfileCss.match(
    /\.profile-question-table \.profile-question-row > span,\s*[\s\S]*?\.profile-question-answer\s*\{([\s\S]*?)\}/
  )?.[1] || '';
  const answerCellBlock = accountProfileCss.match(
    /\.profile-question-answer\s*\{([\s\S]*?)\}/
  )?.[1] || '';

  assert.doesNotMatch(groupedAnswerCellBlock, /border-bottom:\s*1px solid #e0eef4/);
  assert.doesNotMatch(answerCellBlock, /border-bottom:\s*1px solid #e0eef4/);
  assert.match(answerCellBlock, /border-bottom:\s*0/);
});
