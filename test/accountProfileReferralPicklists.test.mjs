import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const modulePath = new URL('../src/lib/dataservice/accountPlan/accountProfile.js', import.meta.url);
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadModule = async ({
  veevaRuntime = true,
  labels = {},
  referralAccounts = [],
  medicalProfile = {
    id: 'live-medical-profile',
    mmMedicalProfile: { atcProfile: 'MM CRM value' },
    dlbclMedicalProfile: { atcProfile: 'DLBCL CRM value' },
  },
} = {}) => {
  globalThis.__picklistCalls = [];
  globalThis.__picklistLabels = labels;
  globalThis.__referralAccounts = referralAccounts;
  globalThis.__medicalProfile = medicalProfile;
  globalThis.__childCalls = [];

  const sharedStubUrl = dataModule(`
    export const ACCOUNT_PROFILE_OBJECT = 'KPH_Ecosystem_Plan__c';
    export const MM_MEDICAL_PROFILE_FIELD_API_NAMES = {
      atcProfileCategory: 'KPH_MM_ATC_Profile_Category__c', medicalEducation: 'KPH_MM_Medical_Education__c',
      atcProfile: 'KPH_MM_ATC_Profile__c', kiteClinicalTrial: 'KPH_MM_Kite_Clinical_Trial__c',
      competitorTrial: 'KPH_MM_Competitor_Trial__c', medicalCollaboration: 'KPH_MM_Medical_Collaboration__c',
      researchCapabilitiesTimelines: 'KPH_MM_Research_Capabilities__c', medicalEducationStatus: 'KPH_Medical_Education_Status__c'
    };
    export const DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES = {
      atcProfileCategory: 'KPH_DLBCL_ATC_Profile_Category__c', medicalEducation: 'KPH_DLBCL_Medical_Education__c',
      atcProfile: 'KPH_DLBCL_ATC_Profile__c', kiteClinicalTrial: 'KPH_DLBCL_Clinical_Trial__c',
      competitorTrial: 'KPH_DLBCL_Competitor_Trial__c', medicalCollaboration: 'KPH_DLBCL_Medical_Collaboration__c',
      researchCapabilitiesTimelines: 'KPH_DLBCL_MM_Research_Capabilities__c', medicalEducationStatus: 'KPH_DLBCL_Medical_Education_Status__c'
    };
    export const MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES = {
      'AE Management': 'KPH_ae_management_Status__c',
      'ATC Onboarding': 'KPH_atc_onboarding_Status2__c', Outpatient: 'KPH_outpatient_Status3__c'
    };
    export const DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES = {
      'AE Management': 'KPH_DLBCL_ae_management_Status__c',
      'ATC Onboarding': 'KPH_DLBCL_atc_onboarding2__c', Outpatient: 'KPH_DLBCL_outpatient3__c'
    };
    export const MEDICAL_PROFILE_FIELD_API_NAMES = [
      ...Object.values(MM_MEDICAL_PROFILE_FIELD_API_NAMES), ...Object.values(DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES),
      ...Object.values(MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES),
      ...Object.values(DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES)
    ];
    export const MM_PROFILE_FIELD_API_NAMES = {
      factAccredited: 'KPH_FACT_Accredited__c', anitoCelTrialSite: 'KPH_Anito_Cel_Trial_Site__c',
      cartProgramStructure: 'KPH_CAR_T_Program_Structure__c', outpatientCartCapability: 'KPH_Outpatient_CAR_T_Capability__c',
      operationalCapacityAssessment: 'KPH_Operational_Capacity_Assessment__c', ptStatus: 'KPH_P_T_Status__c',
      ptTimingNextReview: 'KPH_P_T_Timing_Next_Review__c', formularyStatus: 'KPH_Formulary_Status__c'
    };
    export const REFERRAL_ACCOUNT_OBJECT = 'KPH_Ecosystem_Map_Dynamics__c';
    export const createReferralAccount = () => Promise.resolve({});
    export const deleteReferralAccount = () => Promise.resolve({});
    export const fetchAccountProfile = () => Promise.resolve({ id: 'medical-profile', mmProfile: {} });
    export const fetchMedicalAccountProfile = () => Promise.resolve(globalThis.__medicalProfile);
    export const fetchCommercialAccountProfile = () => Promise.resolve({ id: 'commercial-profile', mmProfile: {} });
    export const fetchReferralDynamicsAccountProfile = () => Promise.resolve({
      id: 'crm-referral-profile', regionDynamicsDlbcl: 'CRM DLBCL dynamics', regionDynamicsMm: 'CRM MM dynamics'
    });
    export const fetchAccountProfileChildRecords = (...args) => {
      globalThis.__childCalls.push(args);
      return Promise.resolve({ referralAccounts: globalThis.__referralAccounts, healthcareNetworks: [] });
    };
    export const requireCurrentAccountPlanId = () => Promise.resolve('plan-001');
    export const resolveShellContextForPlanId = () => Promise.resolve({
      planId: 'plan-001', plan: { id: 'plan-001' }, account: { id: 'account-001', name: 'Mock Account' }
    });
    export const searchSiteAccounts = () => Promise.resolve([]);
    export const updateMedicalAccountProfileField = () => Promise.resolve({});
    export const updateReferralAccount = () => Promise.resolve({});
  `);
  const queryStubUrl = dataModule(`
    const get = (object, field, channel) => {
      globalThis.__picklistCalls.push({ object, field, channel });
      return Promise.resolve(globalThis.__picklistLabels[object]?.[field] || {});
    };
    export const getPicklistValueLabels = (object, field) => get(object, field, 'local');
    export const getCrmPicklistValueLabels = (object, field) => get(object, field, 'crm');
  `);
  const clientStubUrl = dataModule(`
    export const hasVeevaRuntime = () => ${veevaRuntime};
    export const isLocalPreview = false;
  `);
  const source = (await readFile(modulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/accountPlan\/shared['"]/g, `from '${sharedStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`);
  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, calls: globalThis.__picklistCalls, childCalls: globalThis.__childCalls };
};

test('Indication options come from live KPH_Ecosystem_Map_Dynamics__c metadata', async () => {
  const { mod, calls } = await loadModule({
    labels: { KPH_Ecosystem_Map_Dynamics__c: { Indication__c: { DLBCL: 'DLBCL', MM: 'MM' } } },
    referralAccounts: [{ id: 'ref-1', indication: 'Legacy' }],
  });
  const data = await mod.loadAccountProfile();

  assert.ok(calls.some((call) => call.object === 'KPH_Ecosystem_Map_Dynamics__c' && call.field === 'Indication__c' && call.channel === 'crm'));
  assert.deepEqual(data.referralIndicationOptions, [
    { value: '', label: '-' }, { value: 'DLBCL', label: 'DLBCL' },
    { value: 'MM', label: 'MM' }, { value: 'Legacy', label: 'Legacy' },
  ]);
});

test('Referral rows and dynamics use the CRM Ecosystem Plan id and values', async () => {
  const { mod, childCalls } = await loadModule();
  const data = await mod.loadAccountProfile();

  assert.deepEqual(childCalls, [['plan-001', 'crm-referral-profile']]);
  assert.equal(data.profileId, 'crm-referral-profile');
  assert.deepEqual(data.regionalDynamics, { DLBCL: 'CRM DLBCL dynamics', MM: 'CRM MM dynamics' });
});

test('both Medical profiles and all sixteen picklists come from live Ecosystem Plan CRM calls', async () => {
  const { mod, calls } = await loadModule();
  const data = await mod.loadAccountProfile();
  const medicalFields = new Set([
    'KPH_MM_ATC_Profile_Category__c',
    'KPH_MM_Medical_Education__c',
    'KPH_MM_Kite_Clinical_Trial__c',
    'KPH_MM_Medical_Collaboration__c',
    'KPH_Medical_Education_Status__c',
    'KPH_DLBCL_ATC_Profile_Category__c',
    'KPH_DLBCL_Medical_Education__c',
    'KPH_DLBCL_Clinical_Trial__c',
    'KPH_DLBCL_Medical_Collaboration__c',
    'KPH_DLBCL_Medical_Education_Status__c',
    'KPH_ae_management_Status__c',
    'KPH_atc_onboarding_Status2__c',
    'KPH_outpatient_Status3__c',
    'KPH_DLBCL_ae_management_Status__c',
    'KPH_DLBCL_atc_onboarding2__c',
    'KPH_DLBCL_outpatient3__c',
  ]);
  const medicalCalls = calls.filter((call) =>
    call.object === 'KPH_Ecosystem_Plan__c' &&
    medicalFields.has(call.field)
  );

  assert.equal(data.medicalProfileId, 'live-medical-profile');
  assert.equal(data.mmMedicalProfile.atcProfile, 'MM CRM value');
  assert.equal(data.dlbclMedicalProfile.atcProfile, 'DLBCL CRM value');
  assert.equal(medicalCalls.length, 16);
  assert.ok(medicalCalls.every((call) => call.channel === 'crm'));
});

test('Medical profile save target falls back to another plan-scoped Ecosystem Plan read', async () => {
  const { mod } = await loadModule({ medicalProfile: null });
  const data = await mod.loadAccountProfile();

  assert.equal(data.medicalProfileId, 'crm-referral-profile');
  assert.deepEqual(data.mmMedicalProfile, {});
  assert.deepEqual(data.dlbclMedicalProfile, {});
});
