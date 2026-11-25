import { medicalPicklistLabel, withMedicalPicklistLabels } from './titlePicklistMappings.js';
// Barriers & Drivers page composer.
//
// Same source object as the Home summary (KPH_Medical_Barrier_Tactical_Actions__c),
// but presented in full detail: every row, every column, plus per-row activity
// list (not just the count). Also pulls team members so the "Accountable"
// dropdown in the critical-activity modal can offer real POD names.

import {
  BARRIER_DRIVER_INDICATION_FIELD,
  BARRIER_DRIVER_OBJECT,
  BARRIER_DRIVER_STATUS_FIELD,
  BARRIER_DRIVER_STRATEGY_FIELD,
  applyMedicalLegacyParentPolicy,
  buildOpenActivityCountByBarrier,
  CRITICAL_ACTIVITY_OBJECT,
  createSalesforceIdLookup,
  createBarrierDriver,
  createCriticalActivity,
  deleteCriticalActivity,
  fetchBarriersAndDrivers,
  fetchCriticalActivities,
  getSalesforceIdLookupEntry,
  isOpenBarrierDriverStatus,
  isVisibleBarrierDriverIndication,
  normalizeBarrierDriverStatusForDisplay,
  requireCurrentAccountPlanId,
  resolveShellContextForPlanId,
  toBarrierDriver,
  updateBarrierDriver,
  updateBarrierDriverStatus,
  updateCriticalActivity,
} from '@/lib/dataservice/accountPlan/shared';
import {
  optionsForControllerValue,
} from '@/lib/dataservice/accountPlan/dependentPicklists';
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

const OPEN_STATUSES = new Set(['Open', 'Planned', 'In Progress']);
const COMPLETED_STATUSES = new Set(['Complete', 'Completed', 'Closed']);

const isOpenActivity = (activity) =>
  activity && activity.isDeactivated !== true && OPEN_STATUSES.has(activity.status);

const isCompletedActivity = (activity) =>
  activity && activity.isDeactivated !== true && COMPLETED_STATUSES.has(activity.status);

// Fallback values are only used when the runtime cannot return picklist
// metadata, such as local preview or a field-level access miss.
const mergeWithDataValues = (base, valuesFromData) => {
  const seen = new Set();
  const out = [];
  for (const v of [...base, ...valuesFromData]) {
    if (!v || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
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
    // Veeva returns a value -> translated-label map. Use the API value so
    // create/update writes the exact picklist value back to CRM.
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

export const fetchBarrierDriverPicklists = async () => {
  const [
    statuses,
    indications,
    strategyPicklist,
    barrierTitles,
    driverTitles,
  ] = await Promise.all([
    fetchPicklistOptions(BARRIER_DRIVER_OBJECT, BARRIER_DRIVER_STATUS_FIELD),
    fetchPicklistOptions(BARRIER_DRIVER_OBJECT, BARRIER_DRIVER_INDICATION_FIELD),
    fetchPicklistInfo(BARRIER_DRIVER_OBJECT, BARRIER_DRIVER_STRATEGY_FIELD),
    getPicklistValueLabels(BARRIER_DRIVER_OBJECT, 'KPH_Barrier_Title__c')
      .then(titlePicklistInfoFromLabels)
      .catch(() => ({ values: [], labels: {} })),
    getPicklistValueLabels(BARRIER_DRIVER_OBJECT, 'KPH_Opportunity_Title__c')
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
    barrierStatuses: statuses,
    barrierDriverIndications: indications,
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
    dlbclBarrierCategories: [],
    dlbclDriverCategories: [],
    categoryLabels: {},
    barrierCategoryOptionsByIndication: {},
    driverCategoryOptionsByIndication: {},
    barrierCategories: [],
    impactLevels: [],
    barrierTitles: barrierTitles.values,
    barrierTitleLabels: barrierTitles.labels,
    barrierTitleOptionsByIndication,
    driverTitles: driverTitles.values,
    driverTitleLabels: driverTitles.labels,
    driverTitleOptionsByIndication,
  };
};

const fetchCriticalActivityPicklists = async () => {
  const [activityStatuses, activityIndications, accountableMembers, medicalTacticTitles] = await Promise.all([
    fetchPicklistOptions(CRITICAL_ACTIVITY_OBJECT, 'KPH_Status__c'),
    fetchPicklistOptions(CRITICAL_ACTIVITY_OBJECT, 'KPH_Indication__c'),
    fetchPicklistOptions(CRITICAL_ACTIVITY_OBJECT, 'KPH_Accountable_POD_Members__c'),
    getPicklistValueLabels(CRITICAL_ACTIVITY_OBJECT, 'KPH_Medical_Tactics__c')
      .then(titlePicklistInfoFromLabels)
      .catch(() => ({ values: [], labels: {} })),
  ]);
  return {
    activityStatuses,
    activityIndications,
    accountableMembers,
    medicalTacticTitles: medicalTacticTitles.values,
    medicalTacticTitleLabels: medicalTacticTitles.labels,
    medicalTacticOptionsByParentTitle: buildMedicalTacticOptionsByParentTitle(
      medicalTacticTitles.values
    ),
  };
};


export { normalizeBarrierDriverStatusForDisplay } from '@/lib/dataservice/accountPlan/shared';

export const loadBarriersDrivers = async () => {
  const planContextId = await requireCurrentAccountPlanId();
  const [shellContext, { rows: barrierRows, access }, activities, dynamicPicklists, activityPicklists] = await Promise.all([
    resolveShellContextForPlanId(planContextId),
    fetchBarriersAndDrivers(planContextId),
    fetchCriticalActivities(planContextId),
    fetchBarrierDriverPicklists(),
    fetchCriticalActivityPicklists(),
  ]);
  const { planId, plan, account } = shellContext;

  const strategyLabels = dynamicPicklists.strategyLabels || {};
  const barriersDrivers = barrierRows
    .map((row) => withMedicalPicklistLabels(toBarrierDriver(row, access, { strategyLabels }), dynamicPicklists))
    .filter(Boolean)
    .filter((record) => isVisibleBarrierDriverIndication(record.indication));
  const barrierById = createSalesforceIdLookup(barriersDrivers);
  const visibleActivities = activities.filter((activity) =>
    isVisibleBarrierDriverIndication(activity?.indication) &&
    (!activity?.barrierDriverId || getSalesforceIdLookupEntry(barrierById, activity.barrierDriverId))
  );

  // Enrich activities with parentName / parentType so the page doesn't
  // need to re-map per render.
  const enrichedActivities = visibleActivities.map((a) => {
    const parent = a.barrierDriverId ? getSalesforceIdLookupEntry(barrierById, a.barrierDriverId) : null;
    return applyMedicalLegacyParentPolicy({
      ...withMedicalPicklistLabels(a, activityPicklists, true),
      indication: parent ? (parent.indication || a.indication || '') : (a.indication || ''),
      barrierDriverId: parent ? parent.id : a.barrierDriverId,
      parentName: parent ? parent.name : (a.barrierDriverId ? 'Linked record unavailable' : 'Plan-level'),
      parentType: parent ? parent.type : (a.parentType || null),
      parentRecordTypeId: parent ? (parent.recordTypeId || null) : null,
    }, parent);
  });

  const openActivityCountByBarrier = buildOpenActivityCountByBarrier(enrichedActivities);

  // Picklists come from CRM metadata and are never unioned with values found on
  // existing records, so a value deleted from a picklist in CRM is never offered
  // ("bad value for restricted picklist field").
  // (Barrier/Driver "type" is the record type, not a CRM picklist, so its options
  // are intrinsic app values.)
  const strategyOptions = dynamicPicklists.barrierStrategies || [];
  const dlbclStrategies = dynamicPicklists.dlbclStrategies || strategyOptions;
  const portfolioStrategies = dynamicPicklists.portfolioStrategies || strategyOptions;
  const mmStrategies = dynamicPicklists.mmStrategies || strategyOptions;
  const dlbclBarrierCategories = dynamicPicklists.dlbclBarrierCategories || [];
  const dlbclDriverCategories = dynamicPicklists.dlbclDriverCategories || [];

  const picklists = {
    barrierTypes: ['Barrier', 'Driver'],
    barrierTypeFilters: ['All', 'Barriers', 'Drivers'],
    barrierStatuses: (dynamicPicklists.barrierStatuses || []).map(normalizeBarrierDriverStatusForDisplay),
    barrierDriverIndications: configuredPicklistOptions(
      visibleIndications(dynamicPicklists.barrierDriverIndications),
      {},
      BARRIER_OPPORTUNITY_INDICATIONS
    ),
    dlbclStrategies,
    portfolioStrategies,
    mmStrategies,
    barrierStrategies: strategyOptions,
    strategyLabels,
    strategyOptionsByIndication: dynamicPicklists.strategyOptionsByIndication || {},
    hasStrategyIndicationFilters: dynamicPicklists.hasStrategyIndicationFilters === true,
    strategyRanks: dynamicPicklists.strategyRanks || [],
    categoryLabels: dynamicPicklists.categoryLabels || {},
    barrierCategoryOptionsByIndication: dynamicPicklists.barrierCategoryOptionsByIndication || {},
    driverCategoryOptionsByIndication: dynamicPicklists.driverCategoryOptionsByIndication || {},
    dlbclBarrierCategories,
    dlbclDriverCategories,
    // Combine the CRM category lists (dedupe) for the unfiltered category filter.
    barrierCategories: mergeWithDataValues(
      dlbclBarrierCategories,
      dlbclDriverCategories
    ),
    barrierTitles: dynamicPicklists.barrierTitles || [],
    barrierTitleLabels: dynamicPicklists.barrierTitleLabels || {},
    barrierTitleOptionsByIndication: dynamicPicklists.barrierTitleOptionsByIndication || {},
    driverTitles: dynamicPicklists.driverTitles || [],
    driverTitleLabels: dynamicPicklists.driverTitleLabels || {},
    driverTitleOptionsByIndication: dynamicPicklists.driverTitleOptionsByIndication || {},
    impactLevels: dynamicPicklists.impactLevels || [],
    activityStatuses: activityPicklists.activityStatuses || [],
    activityIndications: visibleIndications(activityPicklists.activityIndications),
    accountableMembers: activityPicklists.accountableMembers || [],
    medicalTacticTitles: activityPicklists.medicalTacticTitles || [],
    medicalTacticTitleLabels: activityPicklists.medicalTacticTitleLabels || {},
    medicalTacticOptionsByParentTitle: activityPicklists.medicalTacticOptionsByParentTitle || {},
  };

  const openBarriers = barriersDrivers.filter((r) => r.type === 'Barrier' && isOpenBarrierDriverStatus(r.status));
  const openDrivers = barriersDrivers.filter((r) => r.type === 'Driver' && isOpenBarrierDriverStatus(r.status));
  const openActivities = enrichedActivities.filter(isOpenActivity);
  const completedActivities = enrichedActivities.filter(isCompletedActivity);

  return {
    planId,
    plan,
    account,
    barriers: barriersDrivers.filter((r) => r.type === 'Barrier'),
    drivers: barriersDrivers.filter((r) => r.type === 'Driver'),
    activities: enrichedActivities,
    openActivityCountByBarrier,
    picklists,
    barrierDriverAccess: access,
    kpis: {
      openBarriers: openBarriers.length,
      openDrivers: openDrivers.length,
      openActivities: openActivities.length,
      completedRecent: completedActivities.length,
    },
    activitySections: [
      {
        key: 'open',
        title: 'Open and Planned Medical Tactics',
        emptyMessage: 'No open or planned medical tactics match the current filters.',
        rows: openActivities,
      },
      {
        key: 'completed',
        title: 'Completed Medical Tactics',
        emptyMessage: 'No completed medical tactics match the current filters.',
        rows: completedActivities,
      },
    ],
  };
};

export const saveBarrierDriver = updateBarrierDriver;
export const saveBarrierDriverStatus = updateBarrierDriverStatus;
export const addBarrierDriver = createBarrierDriver;
export const saveCriticalActivity = updateCriticalActivity;
export const addCriticalActivity = createCriticalActivity;
export { deleteCriticalActivity };
