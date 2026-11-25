// Stakeholders page composer.
// Pulls the plan's stakeholders (KPH_Stakeholder_Map__c). Team members live on
// their own page now and have their own loader.

import {
  createStakeholder,
  deleteStakeholder,
  fetchStakeholders,
  requireCurrentAccountPlanId,
  resolveShellContextForPlanId,
  searchSiteAccounts,
  searchStakeholderAccounts,
  updateStakeholder,
} from '@/lib/dataservice/accountPlan/shared';
import {
  getCrmPicklistValueLabels,
  getPicklistValueLabels,
} from '@/lib/dataservice/query';
import { hasVeevaRuntime } from '@/lib/dataservice/client';

const STAKEHOLDER_OBJECT = 'KPH_Stakeholder_Map__c';

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
        return entry.value || entry.apiValue || entry.apiName || entry.label || entry.name || null;
      })
    );
  }
  if (typeof labels === 'object') return mergeWithDataValues([], Object.keys(labels));
  return [];
};

const fetchPicklistOptions = (fieldApi) => {
  const getLabels = hasVeevaRuntime()
    ? getCrmPicklistValueLabels
    : getPicklistValueLabels;
  return getLabels(STAKEHOLDER_OBJECT, fieldApi)
    .then(valuesFromPicklistLabels)
    .catch(() => []);
};

const fetchStakeholderPicklists = async () => {
  const roleOptions = await fetchPicklistOptions('KPH_Title__c');

  return {
    roleOptions,
  };
};

export const loadStakeholders = async () => {
  const planContextId = await requireCurrentAccountPlanId();
  const [shellContext, stakeholders, dynamicPicklists] = await Promise.all([
    resolveShellContextForPlanId(planContextId),
    fetchStakeholders(planContextId),
    fetchStakeholderPicklists(),
  ]);
  const { planId, plan, account } = shellContext;
  const picklists = {
    roleOptions: dynamicPicklists.roleOptions || [],
  };

  return { planId, plan, account, stakeholders, picklists };
};

export {
  createStakeholder,
  deleteStakeholder,
  searchSiteAccounts,
  searchStakeholderAccounts,
  updateStakeholder,
};
