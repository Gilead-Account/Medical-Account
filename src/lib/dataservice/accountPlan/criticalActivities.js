import { withMedicalPicklistLabels } from './titlePicklistMappings.js';
import { fetchBarrierDriverPicklists } from './barriersDrivers.js';
// Critical Activities page composer.
//
// Returns the full activities list (not just the 30-day Home slice), the
// barrier/driver map needed to render "Related Barrier/Driver" names, plus
// pre-computed Open vs. Completed sections that mirror the
// legacy `criticalActivityTableSections`.

import {
  BARRIER_DRIVER_OBJECT,
  BARRIER_DRIVER_STATUS_FIELD,
  applyMedicalLegacyParentPolicy,
  CRITICAL_ACTIVITY_OBJECT,
  createSalesforceIdLookup,
  fetchBarriersAndDrivers,
  fetchCriticalActivities,
  getSalesforceIdLookupEntry,
  isVisibleBarrierDriverIndication,
  normalizeBarrierDriverStatusForDisplay,
  requireCurrentAccountPlanId,
  resolveShellContextForPlanId,
  toBarrierDriver,
  createCriticalActivity,
  deleteCriticalActivity,
  updateCriticalActivity,
  updateBarrierDriverStatus,
} from '@/lib/dataservice/accountPlan/shared';
import { getPicklistValueLabels } from '@/lib/dataservice/query';
import {
  buildMedicalTacticOptionsByParentTitle,
  picklistInfoFromLabels,
} from '@/lib/dataservice/accountPlan/titlePicklistMappings';

const OPEN_STATUSES = new Set(['Open', 'Planned', 'In Progress']);
const mergeWithDataValues = (base, valuesFromData) => {
  const seen = new Set();
  const out = [];
  for (const v of [...(base || []), ...(valuesFromData || [])]) {
    if (!v || v === 'All' || seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
};

const valuesFromPicklistLabels = (labels) => {
  if (!labels) return [];
  if (Array.isArray(labels)) {
    return mergeWithDataValues(
      [],
      labels.map((entry) => {
        if (!entry) return null;
        if (typeof entry === 'string') return entry;
        if (typeof entry !== 'object') return null;
        return entry.value || entry.apiValue || entry.apiName || entry.name || entry.label || null;
      })
    );
  }
  if (typeof labels === 'object') return mergeWithDataValues([], Object.keys(labels));
  return [];
};

const fetchActivityPicklistOptions = (fieldApi) =>
  getPicklistValueLabels(CRITICAL_ACTIVITY_OBJECT, fieldApi)
    .then(valuesFromPicklistLabels)
    .catch(() => []);

const fetchBarrierDriverStatusPicklistOptions = () =>
  getPicklistValueLabels(BARRIER_DRIVER_OBJECT, BARRIER_DRIVER_STATUS_FIELD)
    .then(valuesFromPicklistLabels)
    .catch(() => []);

const visibleIndications = (values) =>
  (values || []).filter(isVisibleBarrierDriverIndication);

export const fetchCriticalActivityPicklists = async () => {
  const [activityStatuses, activityIndications, accountableMembers, barrierStatuses, medicalTacticTitles] = await Promise.all([
    fetchActivityPicklistOptions('KPH_Status__c'),
    fetchActivityPicklistOptions('KPH_Indication__c'),
    fetchActivityPicklistOptions('KPH_Accountable_POD_Members__c'),
    fetchBarrierDriverStatusPicklistOptions(),
    getPicklistValueLabels(CRITICAL_ACTIVITY_OBJECT, 'KPH_Medical_Tactics__c')
      .then(picklistInfoFromLabels)
      .catch(() => ({ values: [], labels: {} })),
  ]);
  return {
    activityStatuses,
    activityIndications,
    accountableMembers,
    barrierStatuses,
    medicalTacticTitles: medicalTacticTitles.values,
    medicalTacticTitleLabels: medicalTacticTitles.labels,
    medicalTacticOptionsByParentTitle: buildMedicalTacticOptionsByParentTitle(
      medicalTacticTitles.values
    ),
  };
};

const isOpen = (activity) =>
  activity && OPEN_STATUSES.has(activity.status);

const isCompleted = (activity) =>
  activity && (activity.status === 'Complete' || activity.status === 'Completed' || activity.status === 'Closed');

export const loadCriticalActivities = async () => {
  const planContextId = await requireCurrentAccountPlanId();
  const [shellContext, activities, barrierResult, dynamicPicklists, titlePicklists] = await Promise.all([
    resolveShellContextForPlanId(planContextId),
    fetchCriticalActivities(planContextId),
    fetchBarriersAndDrivers(planContextId),
    fetchCriticalActivityPicklists(),
    fetchBarrierDriverPicklists(),
  ]);
  const { planId, plan, account } = shellContext;
  const { rows: barrierRows, access: barrierDriverAccess } = barrierResult;

  const barriersDrivers = barrierRows
    .map((row) => withMedicalPicklistLabels(toBarrierDriver(row, barrierDriverAccess), titlePicklists))
    .filter(Boolean)
    .filter((record) => isVisibleBarrierDriverIndication(record.indication));
  const barrierById = createSalesforceIdLookup(barriersDrivers);
  const barrierDriverOptions = barriersDrivers.map((bd) => ({
    id: bd.id,
    type: bd.type,
    name: bd.name,
    indication: bd.indication,
    status: bd.status,
    recordTypeId: bd.recordTypeId,
    legacyEditState: bd.legacyEditState,
  }));

  // Attach the related barrier/driver name onto each activity so the table
  // doesn't have to re-map per render.
  const visibleActivities = activities.filter((activity) =>
    isVisibleBarrierDriverIndication(activity?.indication) &&
    (!activity?.barrierDriverId || getSalesforceIdLookupEntry(barrierById, activity.barrierDriverId))
  );

  const enriched = visibleActivities.map((a) => {
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

  // Picklists come straight from CRM metadata only — no hardcoded fallback and
  // no union with values found on existing records. Values deleted from a
  // picklist in CRM are therefore never offered (selecting/saving them trips
  // the restricted-picklist "bad value" error).
  const picklists = {
    activityStatuses: dynamicPicklists.activityStatuses || [],
    activityIndications: visibleIndications(dynamicPicklists.activityIndications),
    accountableMembers: dynamicPicklists.accountableMembers || [],
    barrierStatuses: (dynamicPicklists.barrierStatuses || []).map(normalizeBarrierDriverStatusForDisplay),
    medicalTacticTitles: dynamicPicklists.medicalTacticTitles || [],
    medicalTacticTitleLabels: dynamicPicklists.medicalTacticTitleLabels || {},
    medicalTacticOptionsByParentTitle: dynamicPicklists.medicalTacticOptionsByParentTitle || {},
  };

  return {
    planId,
    plan,
    account,
    activities: enriched,
    barrierDriverOptions,
    picklists,
    sections: [
      {
        key: 'open',
        title: 'Open and Planned Medical Tactics',
        emptyMessage: 'No open or planned medical tactics match the current filters.',
        rows: enriched.filter(isOpen),
      },
      {
        key: 'completed',
        title: 'Completed Medical Tactics',
        emptyMessage: 'No completed medical tactics match the current filters.',
        rows: enriched.filter(isCompleted),
      },
    ],
  };
};

export const saveCriticalActivity = updateCriticalActivity;
export const addCriticalActivity = createCriticalActivity;
export const saveBarrierDriverStatus = updateBarrierDriverStatus;
export { deleteCriticalActivity };
