// Medical Account Profile page composer.
//
// The visible UI uses:
//   • seven Medical profile fields stored on Account_Plan_vod__c
//   • referral mapping and read-only healthcare-network child records
//   • read-only DLBCL/MM regional dynamics stored on KPH_Ecosystem_Plan__c

import {
  ACCOUNT_PROFILE_OBJECT,
  createReferralAccount,
  deleteReferralAccount as softDeleteReferralAccount,
  fetchAccountProfile,
  fetchAccountProfileChildRecords,
  fetchCommercialAccountProfile,
  fetchMedicalAccountProfile,
  fetchReferralDynamicsAccountProfile,
  DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES,
  DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES,
  MEDICAL_PROFILE_FIELD_API_NAMES,
  MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES,
  MM_MEDICAL_PROFILE_FIELD_API_NAMES,
  MM_PROFILE_FIELD_API_NAMES,
  REFERRAL_ACCOUNT_OBJECT,
  requireCurrentAccountPlanId,
  resolveShellContextForPlanId,
  searchSiteAccounts,
  updateMedicalAccountProfileField,
  updateReferralAccount,
} from '@/lib/dataservice/accountPlan/shared';
import {
  getCrmPicklistValueLabels,
  getPicklistValueLabels,
} from '@/lib/dataservice/query';
import { hasVeevaRuntime, isLocalPreview } from '@/lib/dataservice/client';

const REFERRAL_INDICATION_FIELD = 'Indication__c';
const PROFILE_YESNO_OPTIONS = [
  { value: '', label: '-' },
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const ATTRIBUTE_DEFS = [
  { key: 'atcCohort', label: 'ATC Cohort DLBCL', type: 'text', source: 'profile', field: 'atcCohort' },
  { key: 'mmAtcPriority', label: 'MM ATC Priority', type: 'text', source: 'account', field: 'mmAtcPriority' },
];

const REIMBURSEMENT_DEFS = [
  { key: 'payerMix', label: 'Payer Mix', type: 'text', source: 'profile', field: 'payerMix' },
  { key: 'payerType', label: 'Payer Type', type: 'text', source: 'profile', field: 'payerType' },
  { key: 'topPayers', label: 'Top 3 Payers', type: 'text', source: 'profile', field: 'topPayersName' },
];

const DLBCL_PROFILE_QUESTIONS = [
  { key: 'capacityImpact', label: 'Is capacity having an impact on CART?', type: 'yesno', field: 'dlbclCapacityImpact', crmField: 'KPH_Is_capacity_having_an_impact_on_CART__c' },
  { key: 'opBusinessPct', label: 'What % of CART business is done OP?', type: 'text', field: 'dlbclOpBusinessPct', crmField: 'KPH_What_of_CART_business_is_done_OP__c' },
  { key: 'financialConstraint', label: 'Financial / reimbursement constraint?', type: 'yesno', field: 'dlbclFinancialConstraint', crmField: 'KPH_Financial_and_or_reimbursement__c' },
  { key: 'preferOpSetting', label: 'Does ATC prefer CART administration in OP?', type: 'text', field: 'dlbclPreferOpSetting', crmField: 'KPH_Does_ATC_prefer_CART_administration__c' },
  { key: 'opSettingReasons', label: 'If yes, what are the reasons?', type: 'multipicklist', field: 'dlbclOpSettingReasons', crmField: 'KPH_If_Yes_to_above_reasons__c', dependsOn: 'preferOpSetting', showWhenParentHasValue: true },
  { key: 'bispecificTiming', label: 'Bispecifics for DLBCL being used?', type: 'yesno', field: 'dlbclBispecificTiming', crmField: 'KPH_Bispecifics_for_DLBCL_being_used__c' },
  { key: 'bispecificImpact', label: 'Does bispecific use in DLBCL impact CART?', type: 'text', field: 'dlbclBispecificImpact', crmField: 'KPH_Bispecific_use_in_DLBCL_impact_CART__c' },
  { key: 'opUseDetails', label: 'If ATC is using OP, do they...?', type: 'text', field: 'dlbclOpUseDetails', crmField: 'KPH_If_ATC_is_using_OP_do_they__c' },
  { key: 'breyanziCompetition', label: 'Direct competition from Breyanzi?', type: 'yesno', field: 'dlbclBreyanziCompetition', crmField: 'KPH_Is_there_direct_competition_from__c' },
  { key: 'breyanziIndication', label: 'If yes, in what indication?', type: 'multipicklist', field: 'dlbclBreyanziIndication', crmField: 'KPH_If_yes_in_what_indication__c', dependsOn: 'breyanziCompetition' },
];

const sourceLookup = ({ account, profile }) => ({ account, profile });
const valueFromDef = (def, sources) => sources[def.source]?.[def.field] ?? null;
const buildReferenceRows = (defs, sources) => defs.map((def) => ({
  key: def.key,
  label: def.label,
  type: def.type,
  helpKey: def.key,
  value: valueFromDef(def, sources),
}));

const picklistOptionsFromLabels = (labels) => {
  if (!labels) return [];
  if (Array.isArray(labels)) {
    return labels
      .map((entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') return { value: entry, label: entry };
        if (typeof entry !== 'object') return null;
        const value =
          entry.value ||
          entry.apiValue ||
          entry.apiName ||
          entry.name ||
          entry.label ||
          null;
        if (value === null || value === undefined || value === '') return null;
        return {
          value: String(value),
          label: String(entry.label || entry.displayLabel || entry.name || value),
        };
      })
      .filter(Boolean);
  }
  if (typeof labels === 'object') {
    return Object.entries(labels)
      .filter(([value]) => value !== '')
      .map(([value, label]) => ({ value: String(value), label: String(label || value) }));
  }
  return [];
};

const mergePicklistOptions = (...optionGroups) => {
  const seen = new Set();
  const out = [{ value: '', label: '-' }];
  for (const group of optionGroups) {
    for (const option of group || []) {
      const value = String(option?.value ?? option ?? '');
      if (!value || seen.has(value)) continue;
      seen.add(value);
      out.push({
        value,
        label: String(option?.label ?? value),
      });
    }
  }
  return out;
};

const getRuntimePicklistValueLabels = (...args) =>
  (hasVeevaRuntime() ? getCrmPicklistValueLabels : getPicklistValueLabels)(...args);

const fetchReferralIndicationPicklist = () =>
  getRuntimePicklistValueLabels(REFERRAL_ACCOUNT_OBJECT, REFERRAL_INDICATION_FIELD)
    .then(picklistOptionsFromLabels)
    .catch(() => []);

const fetchProfileQuestionPicklists = async () => Object.fromEntries(
  await Promise.all(DLBCL_PROFILE_QUESTIONS.map(async (def) => [
    def.crmField,
    await getRuntimePicklistValueLabels(ACCOUNT_PROFILE_OBJECT, def.crmField)
      .then(picklistOptionsFromLabels)
      .catch(() => []),
  ]))
);

const MEDICAL_PROFILE_PICKLIST_FIELDS = [
  MM_MEDICAL_PROFILE_FIELD_API_NAMES.atcProfileCategory,
  MM_MEDICAL_PROFILE_FIELD_API_NAMES.medicalEducation,
  MM_MEDICAL_PROFILE_FIELD_API_NAMES.kiteClinicalTrial,
  MM_MEDICAL_PROFILE_FIELD_API_NAMES.medicalCollaboration,
  MM_MEDICAL_PROFILE_FIELD_API_NAMES.medicalEducationStatus,
  DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES.atcProfileCategory,
  DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES.medicalEducation,
  DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES.kiteClinicalTrial,
  DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES.medicalCollaboration,
  DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES.medicalEducationStatus,
  ...Object.values(MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES),
  ...Object.values(DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES),
];

const fetchMedicalProfilePicklists = async () => Object.fromEntries(
  await Promise.all(MEDICAL_PROFILE_PICKLIST_FIELDS.map(async (field) => [
    field,
    await getRuntimePicklistValueLabels(ACCOUNT_PROFILE_OBJECT, field)
      .then(picklistOptionsFromLabels)
      .catch(() => []),
  ]))
);

const COMMERCIAL_PROFILE_PICKLIST_FIELDS = [
  MM_PROFILE_FIELD_API_NAMES.factAccredited,
  MM_PROFILE_FIELD_API_NAMES.anitoCelTrialSite,
  MM_PROFILE_FIELD_API_NAMES.cartProgramStructure,
  MM_PROFILE_FIELD_API_NAMES.outpatientCartCapability,
  MM_PROFILE_FIELD_API_NAMES.operationalCapacityAssessment,
  MM_PROFILE_FIELD_API_NAMES.ptStatus,
  MM_PROFILE_FIELD_API_NAMES.ptTimingNextReview,
  MM_PROFILE_FIELD_API_NAMES.formularyStatus,
];

const fetchCommercialProfilePicklists = async () => Object.fromEntries(
  await Promise.all(COMMERCIAL_PROFILE_PICKLIST_FIELDS.map(async (field) => [
    field,
    await getRuntimePicklistValueLabels(ACCOUNT_PROFILE_OBJECT, field)
      .then(picklistOptionsFromLabels)
      .catch(() => []),
  ]))
);

const buildProfileQuestionColumns = (profile, picklists = {}) => {
  const half = Math.ceil(DLBCL_PROFILE_QUESTIONS.length / 2);
  const toItem = (def) => ({
    key: def.key,
    label: def.label,
    type: def.type,
    inputType: def.type === 'multipicklist' ? 'multipicklist' : 'picklist',
    field: def.field,
    crmField: def.crmField,
    value: profile?.[def.field] ?? null,
    dependsOn: def.dependsOn || null,
    showWhenParentHasValue: Boolean(def.showWhenParentHasValue),
    isMultiSelect: def.type === 'multipicklist',
    options: picklists[def.crmField] || [],
  });
  return [
    DLBCL_PROFILE_QUESTIONS.slice(0, half).map(toItem),
    DLBCL_PROFILE_QUESTIONS.slice(half).map(toItem),
  ];
};

export const loadAccountProfile = async () => {
  const planContextId = await requireCurrentAccountPlanId();
  const shellContextPromise = resolveShellContextForPlanId(planContextId);
  const medicalProfilePromise = fetchMedicalAccountProfile(planContextId, {
    allowMockPreview: isLocalPreview,
  });
  const profilePromise = fetchAccountProfile(planContextId);
  const commercialProfilePromise = fetchCommercialAccountProfile(planContextId);
  const referralProfilePromise = fetchReferralDynamicsAccountProfile(planContextId);
  const childRecordsPromise = referralProfilePromise.then((profileRecord) =>
    fetchAccountProfileChildRecords(planContextId, profileRecord?.id || null)
  );

  const [
    shellContext,
    profile,
    commercialProfile,
    referralProfile,
    profileQuestionPicklists,
    referralIndicationPicklist,
    medicalProfilePicklists,
    commercialProfilePicklists,
    medicalProfile,
    childRecords,
  ] = await Promise.all([
    shellContextPromise,
    profilePromise,
    commercialProfilePromise,
    referralProfilePromise,
    fetchProfileQuestionPicklists(),
    fetchReferralIndicationPicklist(),
    fetchMedicalProfilePicklists(),
    fetchCommercialProfilePicklists(),
    medicalProfilePromise,
    childRecordsPromise,
  ]);
  const { planId, plan, account } = shellContext;
  const referralAccounts = childRecords.referralAccounts || [];
  const sources = sourceLookup({ account, profile: commercialProfile });

  return {
    planId,
    plan,
    account,
    profile,
    profileId: referralProfile?.id || profile?.id || null,
    // Every source below is the same plan-scoped KPH_Ecosystem_Plan__c row.
    // Keep the dedicated Medical query authoritative, but retain IDs from the
    // other live reads so one unavailable Medical field group does not leave
    // an otherwise loaded profile without a valid update target.
    medicalProfileId:
      medicalProfile?.id ||
      referralProfile?.id ||
      commercialProfile?.id ||
      profile?.id ||
      null,
    accountAttributeRows: buildReferenceRows(ATTRIBUTE_DEFS, sources),
    reimbursementRows: buildReferenceRows(REIMBURSEMENT_DEFS, sources),
    profileQuestionColumns: buildProfileQuestionColumns(
      commercialProfile,
      profileQuestionPicklists
    ),
    profileQuestionYesNoOptions: PROFILE_YESNO_OPTIONS,
    mmMedicalProfile: { ...(medicalProfile?.mmMedicalProfile || {}) },
    dlbclMedicalProfile: { ...(medicalProfile?.dlbclMedicalProfile || {}) },
    commercialMmProfile: { ...(commercialProfile?.mmProfile || {}) },
    mmProfilePicklists: {
      ...commercialProfilePicklists,
      ...medicalProfilePicklists,
    },
    referralIndicationOptions: mergePicklistOptions(
      referralIndicationPicklist,
      referralAccounts.map((row) => row.indication).filter(Boolean)
    ),
    referralAccounts,
    healthcareNetworks: childRecords.healthcareNetworks || [],
    regionalDynamics: {
      DLBCL: referralProfile?.regionDynamicsDlbcl || '',
      MM: referralProfile?.regionDynamicsMm || '',
    },
  };
};

export const saveMedicalProfileField = (profileId, field, value) => {
  if (!MEDICAL_PROFILE_FIELD_API_NAMES.includes(field)) {
    return Promise.reject(new Error('Unsupported Medical profile field.'));
  }
  return updateMedicalAccountProfileField(profileId, field, value);
};

export const saveReferralAccount = updateReferralAccount;
export const addReferralAccount = createReferralAccount;
export const deleteReferralAccount = softDeleteReferralAccount;
export const searchReferralSiteAccounts = searchSiteAccounts;
