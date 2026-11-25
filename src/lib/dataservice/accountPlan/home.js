import { medicalPicklistLabel, withMedicalPicklistLabels } from './titlePicklistMappings.js';
// Home (Overview) page composer.
//
// Pulls everything the six Overview tiles render:
//   • Header strip       (KPH_Ecosystem_Plan__c)
//   • Customer Goals     (Account_Plan_vod__c)
//   • Kite Strategy      (aggregated from barriers/drivers)
//   • Barriers & Drivers (top 5 each via homeSummaryTables in the view layer)
//   • Critical Activities (urgent filter applied in the view layer)
//   • POD Users          (Account_Team_Member_vod__c by ecosystem plan id)
//
// Inline edit modals on Home (barrier/driver, critical activity, team member)
// share the same save helpers as their owning pages — re-exported below so
// `Overview/index.jsx` doesn't need to know which child page owns each writer.

import {
  aggregateStrategies,
  applyMedicalLegacyParentPolicy,
  BARRIER_DRIVER_INDICATION_FIELD,
  BARRIER_DRIVER_OBJECT,
  BARRIER_DRIVER_STATUS_FIELD,
  BARRIER_DRIVER_STRATEGY_FIELD,
  buildOpenActivityCountByBarrier,
  CRITICAL_ACTIVITY_OBJECT,
  createSalesforceIdLookup,
  createBarrierDriver,
  createCriticalActivity,
  deleteCriticalActivity,
  deleteTeamMember,
  fetchBarriersAndDrivers,
  fetchCriticalActivities,
  fetchHeaderFields,
  fetchTeamMembersByPlan,
  getSalesforceIdLookupEntry,
  isVisibleBarrierDriverIndication,
  normalizeBarrierDriverStatusForDisplay,
  requireCurrentAccountPlanId,
  resolveShellContextForPlanId,
  searchUsers,
  sortTeamMembersByParticipation,
  toBarrierDriver,
  toCustomerGoals,
  updateBarrierDriver,
  updateBarrierDriverStatus,
  updateCriticalActivity,
  updateCustomerGoals,
  updateTeamMember,
} from '@/lib/dataservice/accountPlan/shared';
import { optionsForControllerValue } from '@/lib/dataservice/accountPlan/dependentPicklists';
import { getPicklistValueLabels } from '@/lib/dataservice/query';
import {
  buildMedicalTacticOptionsByParentTitle,
  picklistInfoFromLabels as titlePicklistInfoFromLabels,
} from '@/lib/dataservice/accountPlan/titlePicklistMappings';
import {
  BARRIER_OPPORTUNITY_INDICATIONS,
  configuredPicklistOptions,
  medicalStrategyPicklistInfoByApiName,
  picklistOptionsByApiNameIndication,
} from '@/lib/dataservice/accountPlan/barrierOpportunityPicklists';

const TEAM_MEMBER_OBJECT = 'Account_Team_Member_vod__c';

// Fallback values are only used when the runtime cannot return picklist
// metadata, such as local preview or a field-level access miss.
const mergeUnique = (...lists) => {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const v of list || []) {
      if (!v || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
  }
  return out;
};

const picklistInfoFromLabels = (labels) => {
  const values = [];
  const labelByValue = {};
  const seen = new Set();
  const add = (value, label) => {
    if (value === null || value === undefined || value === '') return;
    const apiValue = String(value);
    if (!seen.has(apiValue)) {
      seen.add(apiValue);
      values.push(apiValue);
    }
    labelByValue[apiValue] = label === null || label === undefined || label === '' ? apiValue : String(label);
  };
  if (!labels) return { values, labels: labelByValue };
  if (Array.isArray(labels)) {
    for (const entry of labels) {
      if (!entry) continue;
      if (typeof entry === 'string') {
        add(entry, entry);
        continue;
      }
      if (typeof entry !== 'object') continue;
      const value = entry.value || entry.apiValue || entry.apiName || entry.name || entry.label || null;
      const label = entry.label || entry.displayLabel || entry.translatedLabel || entry.name || value;
      add(value, label);
    }
    return { values, labels: labelByValue };
  }
  if (typeof labels === 'object') {
    for (const [value, label] of Object.entries(labels)) add(value, label);
  }
  return { values, labels: labelByValue };
};

const valuesFromPicklistLabels = (labels) => picklistInfoFromLabels(labels).values;

const fetchPicklistInfo = (objectApi, fieldApi) =>
  getPicklistValueLabels(objectApi, fieldApi)
    .then(titlePicklistInfoFromLabels)
    .catch(() => ({ values: [], labels: {} }));

const fetchPicklistOptions = (objectApi, fieldApi) =>
  getPicklistValueLabels(objectApi, fieldApi)
    .then(valuesFromPicklistLabels)
    .catch(() => []);


const visibleIndications = (values) =>
  (values || []).filter(isVisibleBarrierDriverIndication);

const fetchHomePicklists = async () => {
  const [
    barrierStatuses,
    barrierIndications,
    strategyPicklist,
    activityStatuses,
    activityIndications,
    accountableMembers,
    participationOptions,
    barrierTitles,
    driverTitles,
    medicalTacticTitles,
  ] = await Promise.all([
    fetchPicklistOptions(BARRIER_DRIVER_OBJECT, BARRIER_DRIVER_STATUS_FIELD),
    fetchPicklistOptions(BARRIER_DRIVER_OBJECT, BARRIER_DRIVER_INDICATION_FIELD),
    fetchPicklistInfo(BARRIER_DRIVER_OBJECT, BARRIER_DRIVER_STRATEGY_FIELD),
    fetchPicklistOptions(CRITICAL_ACTIVITY_OBJECT, 'KPH_Status__c'),
    fetchPicklistOptions(CRITICAL_ACTIVITY_OBJECT, 'KPH_Indication__c'),
    fetchPicklistOptions(CRITICAL_ACTIVITY_OBJECT, 'KPH_Accountable_POD_Members__c'),
    fetchPicklistOptions(TEAM_MEMBER_OBJECT, 'KPH_Participation__c'),
    getPicklistValueLabels(BARRIER_DRIVER_OBJECT, 'KPH_Barrier_Title__c')
      .then(titlePicklistInfoFromLabels)
      .catch(() => ({ values: [], labels: {} })),
    getPicklistValueLabels(BARRIER_DRIVER_OBJECT, 'KPH_Opportunity_Title__c')
      .then(titlePicklistInfoFromLabels)
      .catch(() => ({ values: [], labels: {} })),
    getPicklistValueLabels(CRITICAL_ACTIVITY_OBJECT, 'KPH_Medical_Tactics__c')
      .then(titlePicklistInfoFromLabels)
      .catch(() => ({ values: [], labels: {} })),
  ]);
  const strategyInfo = medicalStrategyPicklistInfoByApiName(
    strategyPicklist.values,
    strategyPicklist.labels
  );
  const strategyOptions = strategyInfo.values;
  const strategyOptionsByIndication = strategyInfo.optionsByIndication;
  const hasStrategyIndicationFilters = true;
  const strategiesForIndication = (indication) =>
    optionsForControllerValue(strategyOptionsByIndication, indication) || [];
  const barrierTitleOptionsByIndication = picklistOptionsByApiNameIndication(
    barrierTitles.values
  );
  const driverTitleOptionsByIndication = picklistOptionsByApiNameIndication(
    driverTitles.values
  );
  return {
    barrierStatuses,
    barrierIndications,
    dlbclStrategies: strategiesForIndication('DLBCL'),
    portfolioStrategies: strategiesForIndication('Portfolio'),
    mmStrategies: strategiesForIndication('MM'),
    barrierStrategies: strategyOptions,
    strategyLabels: Object.fromEntries(Object.keys(strategyPicklist.labels).map((value) => [
      value, medicalPicklistLabel(value, strategyPicklist.labels),
    ])),
    strategyOptionsByIndication,
    hasStrategyIndicationFilters,
    strategyRanks: [],
    categoryLabels: {},
    barrierCategoryOptionsByIndication: {},
    driverCategoryOptionsByIndication: {},
    dlbclBarrierCategories: [],
    dlbclDriverCategories: [],
    barrierCategories: [],
    impactLevels: [],
    activityStatuses,
    activityIndications,
    accountableMembers,
    participationOptions,
    barrierTitles: barrierTitles.values,
    barrierTitleLabels: barrierTitles.labels,
    barrierTitleOptionsByIndication,
    driverTitles: driverTitles.values,
    driverTitleLabels: driverTitles.labels,
    driverTitleOptionsByIndication,
    medicalTacticTitles: medicalTacticTitles.values,
    medicalTacticTitleLabels: medicalTacticTitles.labels,
    medicalTacticOptionsByParentTitle: buildMedicalTacticOptionsByParentTitle(
      medicalTacticTitles.values
    ),
  };
};

export const loadHome = async () => {
  const planId = await requireCurrentAccountPlanId();
  const shellContextPromise = resolveShellContextForPlanId(planId);

  // Fan out everything that only depends on the current plan id. Shell context
  // still resolves the plan/account for the sidebar, but it no longer blocks
  // the page-specific reads.
  const [shellContext, headerResult, barrierResult, activities, teamMembers, dynamicPicklists] = await Promise.all([
    shellContextPromise,
    fetchHeaderFields(planId),
    fetchBarriersAndDrivers(planId),
    fetchCriticalActivities(planId),
    fetchTeamMembersByPlan(planId),
    fetchHomePicklists(),
  ]);
  const { planRow, plan, account } = shellContext;
  const { rows: barrierRows, access: barrierDriverAccess } = barrierResult;

  const header = {
    ...(headerResult.header || {}),
    // MM ATC Priority lives on the Account record (KPH_MM_ATC_Priority__c).
    mmAtcPriority: account?.mmAtcPriority || null,
  };

  // Derive the shapes the React components consume.
  const customerGoals = toCustomerGoals(planRow);
  const strategyLabels = dynamicPicklists.strategyLabels || {};
  const strategies = Object.fromEntries(
    Object.entries(aggregateStrategies(barrierRows, strategyLabels)).map(([indication, values]) => [
      indication, values.map((value) => medicalPicklistLabel(value, strategyLabels)),
    ])
  );
  const barriersDrivers = barrierRows
    .map((row) => withMedicalPicklistLabels(toBarrierDriver(row, barrierDriverAccess, { strategyLabels }), dynamicPicklists))
    .filter(Boolean)
    .filter((record) => isVisibleBarrierDriverIndication(record.indication));
  const barriers = barriersDrivers.filter((r) => r.type === 'Barrier');
  const drivers = barriersDrivers.filter((r) => r.type === 'Driver');
  const barrierById = createSalesforceIdLookup(barriersDrivers);
  const visibleActivities = activities.filter((activity) =>
    isVisibleBarrierDriverIndication(activity?.indication) &&
    (!activity?.barrierDriverId || getSalesforceIdLookupEntry(barrierById, activity.barrierDriverId))
  );

  // Enrich activities with parentName/parentType so the home edit modal can
  // show the linked barrier/driver without re-mapping per render.
  const enrichedActivities = visibleActivities.map((a) => {
    const parent = a.barrierDriverId ? getSalesforceIdLookupEntry(barrierById, a.barrierDriverId) : null;
    return applyMedicalLegacyParentPolicy({
      ...withMedicalPicklistLabels(a, dynamicPicklists, true),
      indication: parent ? (parent.indication || a.indication || '') : (a.indication || ''),
      barrierDriverId: parent ? parent.id : a.barrierDriverId,
      parentName: parent ? parent.name : (a.barrierDriverId ? 'Linked record unavailable' : 'Plan-level'),
      parentType: parent ? parent.type : (a.parentType || null),
      parentRecordTypeId: parent ? (parent.recordTypeId || null) : null,
    }, parent);
  });
  const openActivityCountByBarrier = buildOpenActivityCountByBarrier(enrichedActivities);

  // Lightweight picklists for the home edit modals — strictly from CRM metadata
  // only. No hardcoded fallback and never unioned with values on existing
  // records. ("type" is the record type, not a CRM picklist.)
  const strategyOptions = dynamicPicklists.barrierStrategies || [];
  const dlbclStrategies = dynamicPicklists.dlbclStrategies || strategyOptions;
  const portfolioStrategies = dynamicPicklists.portfolioStrategies || strategyOptions;
  const mmStrategies = dynamicPicklists.mmStrategies || strategyOptions;
  const dlbclBarrierCategories = dynamicPicklists.dlbclBarrierCategories || [];
  const dlbclDriverCategories = dynamicPicklists.dlbclDriverCategories || [];
  const categoryOptions = mergeUnique(
    dlbclBarrierCategories,
    dlbclDriverCategories
  );

  const picklists = {
    barrierTypes: ['Barrier', 'Driver'],
    barrierStatuses: (dynamicPicklists.barrierStatuses || []).map(normalizeBarrierDriverStatusForDisplay),
    barrierDriverIndications: configuredPicklistOptions(
      visibleIndications(dynamicPicklists.barrierIndications),
      {},
      BARRIER_OPPORTUNITY_INDICATIONS
    ),
    barrierStrategies: strategyOptions,
    strategyLabels,
    categoryLabels: dynamicPicklists.categoryLabels || {},
    dlbclStrategies,
    portfolioStrategies,
    mmStrategies,
    strategyOptionsByIndication: dynamicPicklists.strategyOptionsByIndication || {},
    strategyRanks: dynamicPicklists.strategyRanks || [],
    barrierCategoryOptionsByIndication: dynamicPicklists.barrierCategoryOptionsByIndication || {},
    driverCategoryOptionsByIndication: dynamicPicklists.driverCategoryOptionsByIndication || {},
    barrierCategories: categoryOptions,
    barrierTitles: dynamicPicklists.barrierTitles || [],
    barrierTitleLabels: dynamicPicklists.barrierTitleLabels || {},
    barrierTitleOptionsByIndication: dynamicPicklists.barrierTitleOptionsByIndication || {},
    driverTitles: dynamicPicklists.driverTitles || [],
    driverTitleLabels: dynamicPicklists.driverTitleLabels || {},
    driverTitleOptionsByIndication: dynamicPicklists.driverTitleOptionsByIndication || {},
    dlbclBarrierCategories,
    dlbclDriverCategories,
    impactLevels: dynamicPicklists.impactLevels || [],
    activityStatuses: dynamicPicklists.activityStatuses || [],
    activityIndications: visibleIndications(dynamicPicklists.activityIndications),
    accountableMembers: dynamicPicklists.accountableMembers || [],
    medicalTacticTitles: dynamicPicklists.medicalTacticTitles || [],
    medicalTacticTitleLabels: dynamicPicklists.medicalTacticTitleLabels || {},
    medicalTacticOptionsByParentTitle: dynamicPicklists.medicalTacticOptionsByParentTitle || {},
    participationOptions: dynamicPicklists.participationOptions || [],
  };

  return {
    planId,
    plan,
    account,
    header,
    customerGoals,
    strategies,
    barriers,
    drivers,
    criticalActivities: enrichedActivities,
    openActivityCountByBarrier,
    teamMembers,
    picklists,
  };
};

export const saveCustomerGoals = updateCustomerGoals;
export const saveBarrierDriver = updateBarrierDriver;
export const saveBarrierDriverStatus = updateBarrierDriverStatus;
export const addBarrierDriver = createBarrierDriver;
export const saveCriticalActivity = updateCriticalActivity;
export const addCriticalActivity = createCriticalActivity;
export { deleteCriticalActivity };
export { deleteTeamMember, searchUsers, sortTeamMembersByParticipation, updateTeamMember };
