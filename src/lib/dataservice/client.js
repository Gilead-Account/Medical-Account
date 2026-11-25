// Veeva MyInsights runtime bridge.
//
// `window.Q` and `window.ds` are loaded as <script> tags in index.html
// from public/static/. iPad may finish initializing them after this module
// has been evaluated, so runtime access must remain dynamic.
//
// Local development and the explicit training build use the bundled mock
// adapter. The separate live build uses Veeva's runtime DataService.

import {
  bindMockAccountPlanContext,
  mockAdapter,
} from '@/lib/mockData/mockAdapter';

const isDev = !!(import.meta && import.meta.env && import.meta.env.DEV);
const isTrainingBuild =
  !!(import.meta && import.meta.env && import.meta.env.VITE_DATA_MODE === 'mock');
const useMockData = isDev || isTrainingBuild;
const getRuntimeDs = () =>
  typeof window !== 'undefined' && window.ds ? window.ds : null;
export const hasVeevaRuntime = () => !isDev && !!getRuntimeDs();

const missingRuntime = (method) => () =>
  Promise.reject(
    new Error(
      `Veeva DataService runtime unavailable: ${method} requires window.ds. ` +
        'Deploy this ZIP inside Veeva CRM MyInsights to load actual data.'
    )
  );

const missingRuntimeAdapter = {
  runQuery: missingRuntime('runQuery'),
  queryRecord: missingRuntime('queryRecord'),
  getDataForCurrentObject: missingRuntime('getDataForCurrentObject'),
  getPicklistValueLabels: missingRuntime('getPicklistValueLabels'),
  getObjectMetadata: missingRuntime('getObjectMetadata'),
  viewRecord: missingRuntime('viewRecord'),
  createRecord: missingRuntime('createRecord'),
  updateRecord: missingRuntime('updateRecord'),
  deleteRecord: missingRuntime('deleteRecord'),
};

const findRuntimeField = (value, field, depth = 0) => {
  if (value == null || depth > 8) return null;
  if (typeof value !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(value, field)) {
    const cell = value[field];
    if (cell && typeof cell === 'object' && 'value' in cell) return cell.value;
    return cell;
  }
  for (const child of Object.values(value)) {
    const found = findRuntimeField(child, field, depth + 1);
    if (found !== null && found !== undefined && found !== '') return found;
  }
  return null;
};

// Training records stay mocked, but Veeva supplies the real Account Plan
// entry-point context and, when available, the signed-in User identity.
// Only packaged training builds borrow identity/context from an available
// Veeva bridge. Local Vite serves the bridge scripts too, but they are not
// connected to CRM and can leave getDataForCurrentObject pending forever.
const mockAdapterWithRuntimeIdentity = isTrainingBuild
  ? {
        ...mockAdapter,
        getDataForCurrentObject(object, field) {
          const isAccountPlanId =
            ['AccountPlan', 'Account_Plan_vod__c', 'Account_Plan_vod', 'Account_Plan'].includes(object) &&
            field === 'Id';
          const isAccountId = object === 'Account' && field === 'Id';
          if (object !== 'User' && !isAccountPlanId && !isAccountId) {
            return mockAdapter.getDataForCurrentObject(object, field);
          }
          const runtimeDs = getRuntimeDs();
          if (!runtimeDs || typeof runtimeDs.getDataForCurrentObject !== 'function') {
            return isAccountPlanId
              ? Promise.resolve({ Account_Plan_vod__c: { Id: null } })
              : mockAdapter.getDataForCurrentObject(object, field);
          }
          return Promise.resolve().then(
            () => runtimeDs.getDataForCurrentObject(object, field)
          ).then(
            (result) => {
              if (isAccountPlanId) {
                const planId = findRuntimeField(result, 'Id');
                if (planId) bindMockAccountPlanContext(planId);
              }
              return result;
            },
            () => isAccountPlanId
              ? { Account_Plan_vod__c: { Id: null } }
              : mockAdapter.getDataForCurrentObject(object, field)
          );
        },
      }
  : mockAdapter;

export const $q = (typeof window !== 'undefined' && window.Q) || null;
const dynamicRuntimeAdapter = Object.fromEntries(
  Object.keys(missingRuntimeAdapter).map((method) => [
    method,
    (...args) => {
      const runtimeDs = getRuntimeDs();
      const implementation = runtimeDs && typeof runtimeDs[method] === 'function'
        ? runtimeDs[method].bind(runtimeDs)
        : missingRuntimeAdapter[method];
      return implementation(...args);
    },
  ])
);
export const ds = useMockData
  ? mockAdapterWithRuntimeIdentity
  : dynamicRuntimeAdapter;
// Explicit, deliberately read-only CRM channel used by hybrid training builds.
// Local development uses fixtures because its bridge has no CRM connection.
// It does not expose create/update/delete methods, preventing feature code from
// accidentally sending training edits to Veeva CRM.
const crmReadAdapter = isDev ? mockAdapter : dynamicRuntimeAdapter;
export const crmReadDs = Object.freeze({
  runQuery: (...args) => crmReadAdapter.runQuery(...args),
  getDataForCurrentObject: (...args) => crmReadAdapter.getDataForCurrentObject(...args),
  getPicklistValueLabels: (...args) => crmReadAdapter.getPicklistValueLabels(...args),
});
// Deliberately narrow live-write channel. Feature code must opt into this
// explicitly; the training build's other mutations remain mock-backed.
export const crmCreateDs = Object.freeze({
  createRecord: (...args) => dynamicRuntimeAdapter.createRecord(...args),
});
export const crmUpdateDs = Object.freeze({
  updateRecord: (...args) => dynamicRuntimeAdapter.updateRecord(...args),
});

export const isMockRuntime = useMockData;
export const isLocalPreview = isDev;
export const isHybridTrainingRuntime = () => isTrainingBuild && hasVeevaRuntime();
export const bindAccountPlanDataContext = (planId) =>
  useMockData ? bindMockAccountPlanContext(planId) : planId;

// True when running inside Veeva CRM's online hosted CDN (cdnhtml.salesforce.com).
// The offline iPad container hosts MyInsights from a local path, and a few
// VQL syntax differences (e.g. `{'a','b'}` vs `('a','b')`) hinge on this check.
// Mirrors `isOnline` in site_crm_v1/src/lib/helper/utils.js.
export const isOnline = () => {
  if (typeof window === 'undefined') return false;
  return /cdnhtml/i.test(window.location.hostname);
};
