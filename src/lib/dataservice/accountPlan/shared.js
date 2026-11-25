// Shared primitives for every Account Plan page composer.
//
// What lives here:
//   • Field-list constants for each Veeva object the app touches
//   • Raw fetchers (`fetchPlan`, `fetchAccount`, `fetchHeaderFields`,
//     `fetchBarriersAndDrivers`, `fetchCriticalActivities`, `fetchPodUsers`,
//     `fetchTeamMembersByPlan`, `fetchStakeholders`)
//   • Mappers that flatten VOD-shaped responses into plain UI objects
//   • `resolveShellContext()` — the plan + parent Account every page needs
//     for the sidebar/header (avoids each page re-implementing the chain)
//
// What does NOT live here:
//   • Page-level orchestration / Promise.all wiring → that lives in each
//     page's own file (home.js, stakeholders.js, ...). Each page imports
//     only the primitives it needs.
//
// Adding a new page? Add its raw fetcher + mapper here, then create
// `accountPlan/<page>.js` and compose them in a `load<Page>()` function.

import {
  runQuery,
  runCrmQuery,
  getDataForCurrentObject,
  getCrmDataForCurrentObject,
  unwrap,
  buildIdMatchWhere,
  toCanonicalSalesforceId,
  salesforceIdVariants,
  createRecord,
  createCrmRecord,
  updateRecord,
} from '@/lib/dataservice/query';
import {
  bindAccountPlanDataContext,
  hasVeevaRuntime,
  isOnline,
  isMockRuntime,
} from '@/lib/dataservice/client';

export const isMedicalLegacyStrategy = (value) => {
  const text = String(fieldValue(value) || '').trim();
  return !text || /^[-\u2013\u2014]$/.test(text);
};

// Barriers without a stored Medical Strategy are read-only regardless of when
// they were created. Opportunities and Barriers with a strategy stay editable.
export const medicalLegacyEditState = (isBarrierWithLegacyStrategy = false) =>
  isBarrierWithLegacyStrategy ? 'legacy' : 'current';

const sameRecordId = (left, right) => {
  if (!left || !right) return false;
  if (String(left) === String(right)) return true;
  const canonicalLeft = toCanonicalSalesforceId(left);
  const canonicalRight = toCanonicalSalesforceId(right);
  return Boolean(canonicalLeft && canonicalRight && canonicalLeft === canonicalRight);
};

const readBarrierLegacyEditState = async (id) => {
  const where = buildIdMatchWhere('Id', id);
  if (!where) throw new Error('Unable to identify the record to save.');
  await fetchBarrierDriverRecordTypeIds();
  const rows = await runQuery({
    object: BARRIER_DRIVER_OBJECT,
    fields: ['Id', 'RecordTypeId', BARRIER_DRIVER_STRATEGY_FIELD],
    where,
  });
  if (rows?.length !== 1) throw new Error('Unable to verify historical-record edit access. Refresh and try again.');
  const row = unwrap(rows[0]);
  if (!sameRecordId(fieldValue(row?.Id), id)) {
    throw new Error('Unable to verify the record to save. Refresh and try again.');
  }
  const type = typeFromBarrierDriverRecordTypeId(fieldValue(row.RecordTypeId));
  if (!type) throw new Error('Unable to verify the Medical Barrier/Opportunity record type.');
  const isBarrier = type === 'Barrier';
  return medicalLegacyEditState(
    isBarrier && isMedicalLegacyStrategy(row[BARRIER_DRIVER_STRATEGY_FIELD])
  );
};

// Tactics inherit the legacy lock from their linked Barrier. Opportunities and
// their tactics are deliberately outside the bounded Carrissa request.
const readMedicalLegacyEditState = async (object, id) => {
  if (object === BARRIER_DRIVER_OBJECT) return readBarrierLegacyEditState(id);
  const where = buildIdMatchWhere('Id', id);
  if (!where) throw new Error('Unable to identify the record to save.');
  const rows = await runQuery({
    object,
    fields: ['Id', CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD],
    where,
  });
  if (rows?.length !== 1) throw new Error('Unable to verify historical-record edit access. Refresh and try again.');
  const row = unwrap(rows[0]);
  if (!sameRecordId(fieldValue(row?.Id), id)) {
    throw new Error('Unable to verify the record to save. Refresh and try again.');
  }
  const parentId = lookupIdValue(row[CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD]);
  return parentId ? readBarrierLegacyEditState(parentId) : 'current';
};

// =============================================================================
// Plan + Account (used by every page for the sidebar/header)
// =============================================================================

// IMPORTANT: no cross-object (dotted) fields here. iPad's offline VQL
// engine rejects the entire query if it can't resolve a relationship like
// `Owner.Name` or `Account_vod__r.Name`. We fetch the Account separately
// via fetchAccount(plan.accountId) and skip Owner.Name (not displayed).
//
export const CUSTOMER_GOALS_FIELD = 'KPH_ATC_Strategic_Opportunities__c';
export const APPROVAL_STATUS_FIELD = 'KPH_Medical_Approval_Status__c';
export const APPROVAL_SUBMITTED_FIELD = 'KPH_Is_Submitted__c';
export const APPROVAL_SUBMITTER_NAME_FIELD = 'KPH_Medical_Submitter_Name__c';
export const LAST_FD_REVIEW_DATE_FIELD = 'KPH_Last_FD_Review_date__c';
const toBooleanFlag = (value) => {
  const raw = fieldValue(value);
  return (
    raw === true ||
    raw === 1 ||
    ['true', 'yes', '1', 'active'].includes(String(raw || '').trim().toLowerCase())
  );
};

const PLAN_FIELDS_BASE = [
  'Id',
  'Name',
  'Account_vod__c',
  'KPH_ATC_EID__c',
  CUSTOMER_GOALS_FIELD,
  LAST_FD_REVIEW_DATE_FIELD,
  'KPH_Territory_Description__c',
  'KPH_Territory__c',
  APPROVAL_STATUS_FIELD,
  APPROVAL_SUBMITTED_FIELD,
  APPROVAL_SUBMITTER_NAME_FIELD,
  'LastModifiedDate',
];

export const PLAN_FIELDS = PLAN_FIELDS_BASE;

// These are established Account Plan shell/list APIs and must come from CRM
// in Veeva so Medical approval state refreshes across MSL and manager users.
const CRM_ACCOUNT_PLAN_FIELDS = new Set([
  'Id',
  'Name',
  'OwnerId',
  'Account_vod__c',
  'KPH_ATC_EID__c',
  'KPH_ATC_Certified_Date__c',
  'KPH_Plan_status__c',
  'KPH_Territory_Description__c',
  'KPH_Territory__c',
  LAST_FD_REVIEW_DATE_FIELD,
  'KPH_Medical_Submitted_Date__c',
  APPROVAL_STATUS_FIELD,
  APPROVAL_SUBMITTED_FIELD,
  APPROVAL_SUBMITTER_NAME_FIELD,
  'LastModifiedDate',
]);

export const ACCOUNT_FIELDS = [
  'Id',
  'Name',
  'EID_GILD__c',
  'Territory_vod__c',
  // NOTE: KPH_MM_ATC_Priority__c is queried separately. Some MyInsights users
  // may not have field-level read access, and including an inaccessible field
  // here makes Veeva fail the whole Account query (getFieldLabel error, code 21).
];
const ACCOUNT_MM_ATC_PRIORITY_FIELD = 'KPH_MM_ATC_Priority__c';

// ── plan-ID fallback chain ──────────────────────────────────────────────────
// Mirrors `resolveAccountPlanIdFallback` in the legacy data-repositories.js.
// Order matters: more-trusted sources first, scrapy URL/referrer sources last.

const SF_ID_PATTERN = /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/;
const isLikelySalesforceId = (value) =>
  typeof value === 'string' && SF_ID_PATTERN.test(value.trim());

const tryWindowGlobal = (path) => {
  if (typeof window === 'undefined') return null;
  let node = window;
  for (const segment of path) {
    try {
      if (!node || typeof node !== 'object') return null;
      node = node[segment];
    } catch {
      // cross-origin window access can throw; treat as not-present
      return null;
    }
  }
  return node;
};

const readHtmlConfigRecordId = () => {
  // Veeva injects window.HTMLConfig.currentObjectID when launching MyInsights
  // from a record page. On iPad it's the most reliable signal even when
  // getDataForCurrentObject returns nothing.
  const roots = [
    tryWindowGlobal(['HTMLConfig']),
    tryWindowGlobal(['parent', 'HTMLConfig']),
    tryWindowGlobal(['top', 'HTMLConfig']),
  ];
  const keys = [
    'currentObjectID',
    'currentObjectId',
    'currentRecordID',
    'currentRecordId',
    'recordID',
    'recordId',
    'accountPlanID',
    'accountPlanId',
  ];
  const candidates = [];
  for (const root of roots) {
    if (!root || typeof root !== 'object') continue;
    for (const key of keys) candidates.push(root[key]);
    for (const container of ['data', 'context', 'currentObject', 'record']) {
      const nested = root[container];
      if (!nested || typeof nested !== 'object') continue;
      for (const key of ['Id', 'ID', ...keys]) candidates.push(nested[key]);
    }
  }
  for (const c of candidates) {
    if (isLikelySalesforceId(c)) return String(c).trim();
  }
  return null;
};

const extractIdFromUrl = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const KEYS = ['id', 'recordId', 'recordid', 'cpId', 'accountPlanId', 'accountplanid'];
  try {
    const url = new URL(raw, typeof window !== 'undefined' && window.location ? window.location.origin : undefined);
    for (const key of KEYS) {
      const v = url.searchParams.get(key);
      if (isLikelySalesforceId(v)) return v.trim();
    }
  } catch {
    // string isn't a valid URL — fall through to regex scrape
  }
  const m = raw.match(/[?&#](?:id|recordId|recordid|cpId|accountPlanId|accountplanid)=([a-zA-Z0-9]{15,18})/);
  if (m && isLikelySalesforceId(m[1])) return m[1];
  return null;
};

const readUrlAndReferrerRecordId = () => {
  if (typeof window === 'undefined') return null;
  const sources = [
    window.location && window.location.href,
    window.location && window.location.search,
    window.location && window.location.hash,
    window.document && window.document.referrer,
  ];
  for (const src of sources) {
    const found = extractIdFromUrl(src);
    if (found) return found;
  }
  return null;
};

let currentAccountPlanIdOverride = null;
let currentAccountPlanIdInFlight = null;
const shellContextInFlight = new Map();

const readCurrentAccountPlanIdOverride = () => {
  if (isLikelySalesforceId(currentAccountPlanIdOverride)) {
    return String(currentAccountPlanIdOverride).trim();
  }
  const override =
    typeof window !== 'undefined' ? window.__KAM_ACCOUNT_PLAN_ID__ : null;
  return isLikelySalesforceId(override) ? String(override).trim() : null;
};

export const setCurrentAccountPlanIdOverride = (planId) => {
  const nextPlanId = isLikelySalesforceId(planId) ? String(planId).trim() : null;
  if (nextPlanId) bindAccountPlanDataContext(nextPlanId);
  currentAccountPlanIdOverride = nextPlanId;
  currentAccountPlanIdInFlight = null;
  shellContextInFlight.clear();
  if (typeof window !== 'undefined') {
    if (nextPlanId) {
      window.__KAM_ACCOUNT_PLAN_ID__ = nextPlanId;
    } else {
      delete window.__KAM_ACCOUNT_PLAN_ID__;
    }
  }
  return nextPlanId;
};

/**
 * Resolves which Account_Plan_vod__c to load. Tries every source the legacy
 * AngularJS app does, so the React app works in the same runtimes:
 *
 *   1. `window.__KAM_ACCOUNT_PLAN_ID__` override (dev fixtures / hosting page)
 *   2. Veeva DataService — `getDataForCurrentObject('Account_Plan_vod__c', 'Id')`
 *   3. `window.HTMLConfig.currentObjectID` (incl. parent + top windows)
 *      — Veeva populates this on iPad when the DS context is missing
 *   4. URL / referrer scrape (`?id=`, `?recordId=`, etc.)
 *   5. Account in context → fall back to that HCO's most recent plan
 *
 * If a candidate is a 15-char ID, callers should still expand to both 15
 * and 18-char forms when building WHERE clauses (use `buildIdMatchWhere`).
 */
const resolveCurrentAccountPlanId = async () => {
  const isVeevaRuntime = hasVeevaRuntime();
  const readContext = isVeevaRuntime
    ? getCrmDataForCurrentObject
    : getDataForCurrentObject;
  // Veeva's getDataForCurrentObject keyword for the Account Plan entry point
  // is `AccountPlan` (not the Salesforce object API name). Retain the API-name
  // variants only as compatibility fallbacks for older/custom runtimes.
  for (const objectName of ['AccountPlan', 'Account_Plan_vod__c', 'Account_Plan_vod', 'Account_Plan']) {
    const dsPlanId = await readContext(objectName, 'Id');
    if (isLikelySalesforceId(dsPlanId)) return dsPlanId;
  }

  const htmlConfigId = readHtmlConfigRecordId();
  if (htmlConfigId) return htmlConfigId;

  const urlId = readUrlAndReferrerRecordId();
  if (urlId) return urlId;

  const accountId = await readContext('Account', 'Id');
  if (!isLikelySalesforceId(accountId)) return null;

  const accountWhere = buildIdMatchWhere('Account_vod__c', accountId);
  if (!accountWhere) return null;

  const rows = await (isVeevaRuntime ? runCrmQuery : runQuery)({
    object: 'Account_Plan_vod__c',
    fields: ['Id'],
    where: accountWhere,
    sort: ['LastModifiedDate DESC'],
    limit: 1,
  });
  const row = unwrap(rows[0]);
  return row ? row.Id : null;
};

export const getCurrentAccountPlanId = async () => {
  const override = readCurrentAccountPlanIdOverride();
  if (isLikelySalesforceId(override)) {
    bindAccountPlanDataContext(override);
    return override;
  }
  if (currentAccountPlanIdInFlight) return currentAccountPlanIdInFlight;

  currentAccountPlanIdInFlight = resolveCurrentAccountPlanId().then(
    (planId) => {
      currentAccountPlanIdInFlight = null;
      if (isLikelySalesforceId(planId)) bindAccountPlanDataContext(planId);
      return planId;
    },
    (error) => {
      currentAccountPlanIdInFlight = null;
      throw error;
    }
  );
  return currentAccountPlanIdInFlight;
};

export const getCurrentUserId = () => getDataForCurrentObject('User', 'Id');

const USER_PROFILE_NAME_FIELDS = [
  'Profile_Name_vod_c',
  'Profile_Name_vod__c',
];

export const getCurrentUserProfileName = async () => {
  for (const field of USER_PROFILE_NAME_FIELDS) {
    const value = await getDataForCurrentObject('User', field);
    if (value) return value;
  }
  return null;
};

export const getCurrentUserName = async () => {
  const directName = await getDataForCurrentObject('User', 'Name');
  if (directName) return directName;
  const userId = await getCurrentUserId();
  const where = buildIdMatchWhere('Id', userId);
  if (!where) return null;
  const rows = await runQuery({
    object: 'User',
    fields: ['Id', 'Name'],
    where,
    limit: 1,
  });
  const user = unwrap(rows[0]);
  return user?.Name || null;
};

// `Id = '...'` — but matched against BOTH the 15-char and 18-char forms so
// the planId from `getDataForCurrentObject` (which on iPad is often 15-char)
// reliably hits an 18-char stored value.
const isInaccessibleFieldQueryError = (error) => {
  const message = String(error?.message || error || '');
  return (
    message.includes('getFieldLabel called with field that cannot be accessed') ||
    /["']?code["']?\s*:\s*21\b/.test(message)
  );
};

// Veeva rejects an entire VQL query when the current profile cannot read one
// selected field. Load plan fields in permission-safe batches so optional
// medical fields do not prevent the shared shell (and therefore every page)
// from rendering for CTAM users.
const fetchAccessiblePlanFields = async (where, fields, query = runQuery) => {
  if (!fields.length) return {};

  try {
    const rows = await query({
      object: 'Account_Plan_vod__c',
      fields: ['Id', ...fields],
      where,
      limit: 1,
    });
    return unwrap(rows[0]) || {};
  } catch (error) {
    if (fields.length === 1) {
      console.warn(`[accountPlan] skipping unavailable Account_Plan_vod__c.${fields[0]}`, error);
      return {};
    }

    const midpoint = Math.ceil(fields.length / 2);
    const [left, right] = await Promise.all([
      fetchAccessiblePlanFields(where, fields.slice(0, midpoint), query),
      fetchAccessiblePlanFields(where, fields.slice(midpoint), query),
    ]);
    return { ...left, ...right };
  }
};

export const fetchPlan = async (planId, fields = PLAN_FIELDS) => {
  const where = buildIdMatchWhere('Id', planId);
  if (!where) return null;

  const requestedFields = Array.from(new Set(fields || PLAN_FIELDS));
  const isVeevaRuntime = hasVeevaRuntime();
  const useHybridPlanRead = isVeevaRuntime && isMockRuntime;
  const primaryQuery = isVeevaRuntime ? runCrmQuery : runQuery;

  const rows = await primaryQuery({
    object: 'Account_Plan_vod__c',
    fields: ['Id'],
    where,
    limit: 1,
  });
  const baseRecord = unwrap(rows[0]);
  if (!baseRecord) return null;

  const optionalFields = requestedFields.filter((field) => field !== 'Id');
  if (!useHybridPlanRead) {
    const accessibleRecord = await fetchAccessiblePlanFields(where, optionalFields, primaryQuery);
    return { ...baseRecord, ...accessibleRecord };
  }

  const crmFields = optionalFields.filter((field) => CRM_ACCOUNT_PLAN_FIELDS.has(field));
  const mockFields = optionalFields.filter((field) => !CRM_ACCOUNT_PLAN_FIELDS.has(field));
  const [mockRecord, crmRecord] = await Promise.all([
    fetchAccessiblePlanFields(where, mockFields, runQuery),
    fetchAccessiblePlanFields(where, crmFields, runCrmQuery),
  ]);
  // CRM wins for identity/header fields. Unsupported Medical fields are read
  // from the fixture already bound to this real Account Plan ID.
  return { ...mockRecord, ...baseRecord, ...crmRecord };
};

export const fetchPlanApprovalStatus = async (planId) => {
  const resolvedPlanId = planId || await getCurrentAccountPlanId();
  const where = buildIdMatchWhere('Id', resolvedPlanId);
  if (!where) return null;

  const rows = await runQuery({
    object: 'Account_Plan_vod__c',
    fields: ['Id', APPROVAL_STATUS_FIELD, APPROVAL_SUBMITTED_FIELD, APPROVAL_SUBMITTER_NAME_FIELD, LAST_FD_REVIEW_DATE_FIELD, 'LastModifiedDate'],
    where,
    limit: 1,
  });
  const r = unwrap(rows[0]);
  if (!r) return null;

  return {
    planId: r.Id,
    approvalStatus: r[APPROVAL_STATUS_FIELD],
    isSubmitted: toBooleanFlag(r[APPROVAL_SUBMITTED_FIELD]),
    submitterName: r[APPROVAL_SUBMITTER_NAME_FIELD] || null,
    lastFieldDirectorReviewDate: r[LAST_FD_REVIEW_DATE_FIELD] || null,
    lastModifiedDate: r.LastModifiedDate || null,
  };
};

export const toPlanShape = (r) => {
  if (!r) return null;
  return {
    id: r.Id,
    name: r.Name || null,
    accountId: r.Account_vod__c,
    eid: r.KPH_ATC_EID__c || null,
    lastFieldDirectorReviewDate: r[LAST_FD_REVIEW_DATE_FIELD] || null,
    territoryDescription: r.KPH_Territory_Description__c || r.KPH_Territory__c,
    approvalStatus: r[APPROVAL_STATUS_FIELD],
    isSubmitted: toBooleanFlag(r[APPROVAL_SUBMITTED_FIELD]),
    submitterName: r[APPROVAL_SUBMITTER_NAME_FIELD] || null,
  };
};

const fetchAccountHeaderFields = (accountId) => {
  const where = buildIdMatchWhere('Id', accountId);
  if (!where) {
    return Promise.resolve({
      mmAtcPriority: null,
    });
  }
  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  return query({
    object: 'Account',
    fields: [
      'Id',
      ACCOUNT_MM_ATC_PRIORITY_FIELD,
    ],
    where,
    limit: 1,
  })
    .then((rows) => {
      const r = unwrap(rows[0]);
      return {
        mmAtcPriority: r?.[ACCOUNT_MM_ATC_PRIORITY_FIELD] || null,
      };
    })
    .catch(() => ({
      mmAtcPriority: null,
    }));
};

const fetchAccessibleAccountFields = async (where, fields, query) => {
  if (!fields.length) return {};
  try {
    const rows = await query({
      object: 'Account',
      fields: ['Id', ...fields],
      where,
      limit: 1,
    });
    return unwrap(rows[0]) || {};
  } catch (error) {
    if (fields.length === 1) {
      console.warn(`[accountPlan] skipping unavailable Account.${fields[0]}`, error);
      return {};
    }
    const midpoint = Math.ceil(fields.length / 2);
    const [left, right] = await Promise.all([
      fetchAccessibleAccountFields(where, fields.slice(0, midpoint), query),
      fetchAccessibleAccountFields(where, fields.slice(midpoint), query),
    ]);
    return { ...left, ...right };
  }
};

export const fetchAccount = async (accountId) => {
  const where = buildIdMatchWhere('Id', accountId);
  if (!where) return null;
  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  const [rows, accessibleAccountFields, accountHeaderFields] = await Promise.all([
    query({
      object: 'Account',
      fields: ['Id'],
      where,
      limit: 1,
    }),
    fetchAccessibleAccountFields(
      where,
      ACCOUNT_FIELDS.filter((field) => field !== 'Id'),
      query
    ),
    fetchAccountHeaderFields(accountId),
  ]);
  const baseAccount = unwrap(rows[0]);
  if (!baseAccount) return null;
  const r = { ...baseAccount, ...accessibleAccountFields };
  return {
    id: r.Id,
    name: r.Name,
    eid: r.EID_GILD__c,
    territory: r.Territory_vod__c,
    mmAtcPriority: accountHeaderFields.mmAtcPriority,
  };
};

const ACCOUNT_LOOKUP_SITE_RECORD_TYPE_IDS = ['01241000000cF0GAAU', '01241000000mw9YAAQ'];

const quoteSoqlValue = (value) => `'${String(value || '').replace(/'/g, "\\'")}'`;

const accountLookupSearchTerm = (value) => String(value || '').trim().replace(/\s+/g, ' ');

const titleCaseSearchTerm = (value) =>
  accountLookupSearchTerm(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

const accountLookupSearchVariants = (value) => {
  const term = accountLookupSearchTerm(value);
  if (!term) return [];
  return Array.from(new Set([term, term.toLowerCase(), term.toUpperCase(), titleCaseSearchTerm(term)]));
};

const accountLookupSiteWhere = () =>
  `(${ACCOUNT_LOOKUP_SITE_RECORD_TYPE_IDS.map((id) => `RecordTypeId = ${quoteSoqlValue(id)}`).join(' OR ')}) AND IsPersonAccount = false`;

const accountLookupWhere = (searchTerm) => {
  const variants = accountLookupSearchVariants(searchTerm);
  if (!variants.length) return accountLookupSiteWhere();
  const nameClauses = variants.map((term) => `Name LIKE ${quoteSoqlValue(`%${term}%`)}`);
  return `${accountLookupSiteWhere()} AND (${nameClauses.join(' OR ')})`;
};

const ACCOUNT_LOOKUP_FIELDS = [
  'Id',
  'Name',
  'EID_GILD__c',
  'Account_Identifier_vod__c',
  'NET_External_Id__c',
  'AccountNumber',
  'Territory_vod__c',
  'RecordTypeId',
  'IsPersonAccount',
];
const SITE_ACCOUNT_LOOKUP_REQUIRED_FIELDS = ['Id', 'Name'];
const STAKEHOLDER_ACCOUNT_LOOKUP_REQUIRED_FIELDS = ['Id', 'Name'];
const STAKEHOLDER_PRIMARY_PARENT_FIELD = 'Primary_Parent_vod__c';
// const ACCOUNT_PRIMARY_PARENT_RELATIONSHIP_NAME_FIELD = 'Primary_Parent_vod__r.Name';
// Kept disabled with the previous three-step list lookup path below.

const accountMatchesLookupTerm = (row, searchTerm) => {
  const term = accountLookupSearchTerm(searchTerm).toLowerCase();
  if (!term) return true;
  return String(row?.name || '').toLowerCase().includes(term);
};

const toAccountLookupOption = (row) => {
  const r = unwrap(row);
  if (!r || !r.Id || !r.Name) return null;
  const accountIdentifier =
    r.Account_Identifier_vod__c || r.EID_GILD__c || r.NET_External_Id__c || r.AccountNumber || null;
  return {
    id: r.Id,
    name: r.Name,
    accountIdentifier,
    eid: r.EID_GILD__c || accountIdentifier,
    territory: r.Territory_vod__c || null,
    ...(r[STAKEHOLDER_PRIMARY_PARENT_FIELD]
      ? { primaryParentId: r[STAKEHOLDER_PRIMARY_PARENT_FIELD] }
      : {}),
  };
};

const fetchSiteAccountRows = (params, query = runQuery) => {
  if (hasVeevaRuntime() && !isOnline()) {
    return query({ ...params, fields: SITE_ACCOUNT_LOOKUP_REQUIRED_FIELDS });
  }

  return query({ ...params, fields: ACCOUNT_LOOKUP_FIELDS }).catch((error) => {
    // Account identifier and territory fields are useful secondary labels but
    // are not required to select a referral site. Some profiles do not expose
    // every optional field, and Veeva rejects the entire query in that case.
    console.warn('[accountLookup] optional site fields unavailable; retrying required fields', error);
    return query({ ...params, fields: SITE_ACCOUNT_LOOKUP_REQUIRED_FIELDS });
  });
};

export const searchSiteAccounts = (searchTerm, limit = 25) => {
  const rowLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 25, 50));
  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  const params = {
    object: 'Account',
    where: accountLookupWhere(searchTerm),
    sort: ['Name ASC'],
    limit: rowLimit,
  };
  return fetchSiteAccountRows(params, query)
    .then((rows) =>
      rows
        .map(toAccountLookupOption)
        .filter(Boolean)
        .filter((row) => accountMatchesLookupTerm(row, searchTerm))
        .slice(0, rowLimit)
    )
    .catch((error) => {
      console.warn('[accountLookup] search failed', error);
      return [];
    });
};

const accountNameWhere = (searchTerm) => {
  const personAccountWhere = 'IsPersonAccount = true';
  const variants = accountLookupSearchVariants(searchTerm);
  if (!variants.length) return personAccountWhere;
  return `${personAccountWhere} AND (${variants
    .map((term) => `Name LIKE ${quoteSoqlValue(`%${term}%`)}`)
    .join(' OR ')})`;
};

const fetchStakeholderAccountRows = (params, query = runQuery) => {
  if (hasVeevaRuntime() && !isOnline()) {
    return query({ ...params, fields: STAKEHOLDER_ACCOUNT_LOOKUP_REQUIRED_FIELDS });
  }

  return query({
    ...params,
    fields: [...ACCOUNT_LOOKUP_FIELDS, STAKEHOLDER_PRIMARY_PARENT_FIELD],
  }).catch((error) => {
    // Primary Parent is useful training context but remains optional for
    // profiles whose Account FLS does not expose the Veeva relationship.
    console.warn('[stakeholderAccountLookup] primary parent unavailable; retrying base fields', error);
    return query({ ...params, fields: ACCOUNT_LOOKUP_FIELDS }).catch((baseFieldError) => {
      // Some CRM profiles do not expose every optional Account identifier or
      // territory field. The bridge rejects the whole query when
      // one selected field is unavailable, so retain a final Id + Name lookup
      // that is sufficient to select and save the stakeholder Account.
      console.warn(
        '[stakeholderAccountLookup] optional account fields unavailable; retrying required fields',
        baseFieldError
      );
      return query({ ...params, fields: STAKEHOLDER_ACCOUNT_LOOKUP_REQUIRED_FIELDS });
    });
  });
};

export const searchStakeholderAccounts = (searchTerm = '', limit = 50) => {
  const rowLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 50, 50));
  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  const params = {
    object: 'Account',
    where: accountNameWhere(searchTerm),
    sort: ['Name ASC'],
    limit: rowLimit,
  };
  return fetchStakeholderAccountRows(params, query)
    .then((rows) => {
      const options = rows
        .map(toAccountLookupOption)
        .filter(Boolean)
        .filter((row) => accountMatchesLookupTerm(row, searchTerm))
        .slice(0, rowLimit);
      const parentIds = options.map((row) => row.primaryParentId).filter(Boolean);
      return fetchAccountNameLookup(parentIds, 'stakeholderPrimaryParents', query).then((parentNameById) =>
        options.map((option) => ({
          ...option,
          ...(option.primaryParentId
            ? { primaryParent: accountNameFromLookup(parentNameById, option.primaryParentId) || option.primaryParentId }
            : {}),
        }))
      );
    })
    .catch((error) => {
      console.warn('[stakeholderAccountLookup] search failed', error);
      throw error;
    });
};

const USER_LOOKUP_FIELDS = ['Id', 'Name'];

const normalizeUserLookupId = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  const canonical = toCanonicalSalesforceId(text);
  return canonical ? canonical.slice(0, 15).toLowerCase() : text.toLowerCase();
};

const userLookupExcludedIdSet = (excludedUserIds = []) =>
  new Set(
    (excludedUserIds || [])
      .map(normalizeUserLookupId)
      .filter(Boolean)
  );

const userLookupExclusionWhere = (excludedUserIds = []) => {
  const seen = new Set();
  const clauses = [];
  for (const id of excludedUserIds || []) {
    const variants = salesforceIdVariants(id);
    for (const value of variants.length ? variants : [id]) {
      const text = String(value || '').trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      clauses.push(`Id != ${quoteSoqlValue(text)}`);
    }
  }
  return clauses.join(' AND ') || undefined;
};

const userLookupWhere = (searchTerm, excludedUserIds = []) => {
  const clauses = [];
  const variants = accountLookupSearchVariants(searchTerm);
  if (variants.length) {
    clauses.push(`(${variants.map((term) => `Name LIKE ${quoteSoqlValue(`%${term}%`)}`).join(' OR ')})`);
  }
  const exclusionWhere = userLookupExclusionWhere(excludedUserIds);
  if (exclusionWhere) clauses.push(exclusionWhere);
  return clauses.join(' AND ') || undefined;
};

const userMatchesLookupTerm = (row, searchTerm) => {
  const term = accountLookupSearchTerm(searchTerm).toLowerCase();
  if (!term) return true;
  return String(row?.name || '').toLowerCase().includes(term);
};

const toUserLookupOption = (row) => {
  const r = unwrap(row);
  if (!r || !r.Id || !r.Name) return null;
  return {
    id: r.Id,
    name: r.Name,
  };
};

export const searchUsers = (searchTerm = '', limit = 60, excludeUserIds = []) => {
  const rowLimit = Math.max(1, Math.min(Number.parseInt(limit, 10) || 60, 60));
  const excludedIds = userLookupExcludedIdSet(excludeUserIds);
  return runCrmQuery({
    object: 'User',
    fields: USER_LOOKUP_FIELDS,
    where: userLookupWhere(searchTerm, excludeUserIds),
    sort: ['Name ASC'],
    limit: rowLimit,
  })
    .then((rows) =>
      rows
        .map(toUserLookupOption)
        .filter(Boolean)
        .filter((row) => userMatchesLookupTerm(row, searchTerm))
        .filter((row) => !excludedIds.has(normalizeUserLookupId(row.id)))
        .slice(0, rowLimit)
    )
    .catch((error) => {
      console.warn('[userLookup] search failed', error);
      return [];
    });
};

const missingAccountPlanContextError = () =>
  new Error('No Account Plan in context. Did MyInsights launch from an Account_Plan_vod__c record?');

export const requireCurrentAccountPlanId = async () => {
  const planId = await getCurrentAccountPlanId();
  if (!planId) throw missingAccountPlanContextError();
  return planId;
};

const shellContextKey = (planId, planFields = PLAN_FIELDS) => {
  const normalizedPlanId = toCanonicalSalesforceId(planId) || String(planId || '').trim();
  return `${normalizedPlanId}|${(planFields || PLAN_FIELDS).join(',')}`;
};

/**
 * Plan + parent Account resolution shared across page loaders. Every page
 * needs the sidebar/header values, so this avoids duplicating the
 * planId → plan → account chain in each loader.
 */
const buildShellContextForPlanId = async (planId, planFields = PLAN_FIELDS) => {
  if (!planId) throw missingAccountPlanContextError();
  const planRow = await fetchPlan(planId, planFields);
  if (!planRow) throw new Error(`Account Plan ${planId} not found.`);
  const plan = toPlanShape(planRow);
  const account = await fetchAccount(plan.accountId);
  // Canonical-form plan ID — every plan-scoped child query downstream should
  // use this, then wrap it in `buildIdMatchWhere` to still hit 15-char fields.
  const canonicalPlanId = toCanonicalSalesforceId(planRow.Id) || planRow.Id || planId;
  return { planId: canonicalPlanId, planRow, plan, account };
};

export const resolveShellContextForPlanId = async (planId, { planFields = PLAN_FIELDS } = {}) => {
  if (!planId) throw missingAccountPlanContextError();
  const key = shellContextKey(planId, planFields);
  if (shellContextInFlight.has(key)) return shellContextInFlight.get(key);

  const request = buildShellContextForPlanId(planId, planFields).then(
    (context) => {
      shellContextInFlight.delete(key);
      return context;
    },
    (error) => {
      shellContextInFlight.delete(key);
      throw error;
    }
  );
  shellContextInFlight.set(key, request);
  return request;
};

export const resolveShellContext = async () =>
  resolveShellContextForPlanId(await requireCurrentAccountPlanId());

// =============================================================================
// Customer Goals  ─ Account_Plan_vod__c
// =============================================================================
// Single field; just a getter so the name of truth is discoverable.

export const toCustomerGoals = (planRow) =>
  planRow?.[CUSTOMER_GOALS_FIELD] || null;

export const updateCustomerGoals = (planId, value) => {
  if (!planId) return Promise.reject(new Error('Missing account plan id.'));
  return updateRecord('Account_Plan_vod__c', planId, {
    [CUSTOMER_GOALS_FIELD]: value || '',
  });
};

// =============================================================================
// Header strip fields  ─ KPH_Ecosystem_Plan__c
// =============================================================================
// MM Account Priority has no mapped CRM field yet. Keep it empty rather than
// displaying a synthetic business value.

export const ECOSYSTEM_PLAN_FIELDS = [
  'Id',
  'KPH_Account_Plan__c',
  'KPH_ATC_Cohort__c',
];

export const fetchHeaderFields = (planId) => {
  const where = buildIdMatchWhere('KPH_Account_Plan__c', planId);
  if (!where) return Promise.resolve({ ecosystemPlanId: null, header: null });
  return runQuery({
    object: 'KPH_Ecosystem_Plan__c',
    fields: ECOSYSTEM_PLAN_FIELDS,
    where,
    sort: ['LastModifiedDate DESC'],
    limit: 1,
  }).then((rows) => {
    const r = unwrap(rows[0]);
    if (!r) return { ecosystemPlanId: null, header: null };
    return {
      ecosystemPlanId: r.Id,
      header: {
        atcCohort: r.KPH_ATC_Cohort__c,
        mmAccountPriority: null,
      },
    };
  });
};

// =============================================================================
// Barriers & Drivers  ─ KPH_Medical_Barrier_Tactical_Actions__c
// =============================================================================

export const BARRIER_DRIVER_OBJECT = 'KPH_Medical_Barrier_Tactical_Actions__c';
export const BARRIER_DRIVER_COMMENTS_FIELD = 'KPH_Comments__c';
// IDs belong to the connected org; never fall back to another org's IDs.
export const BARRIER_DRIVER_RECORD_TYPE_IDS = {};
let barrierDriverRecordTypesPromise = null;
export const fetchBarrierDriverRecordTypeIds = () => {
  if (barrierDriverRecordTypesPromise) return barrierDriverRecordTypesPromise;
  barrierDriverRecordTypesPromise = runQuery({
    object: 'RecordType',
    fields: ['Id', 'DeveloperName', 'Name'],
    where: `SobjectType = '${BARRIER_DRIVER_OBJECT}' AND IsActive = true`,
  }).then((rows) => {
    const ids = {};
    for (const row of rows || []) {
      const recordType = unwrap(row) || {};
      const type = criticalActivityTypeFromRecordType(recordType);
      const id = fieldValue(recordType.Id);
      if (!type || !id) continue;
      if (ids[type] && normalizeRecordTypeId(ids[type]) !== normalizeRecordTypeId(id)) {
        throw new Error(`Multiple Medical ${type === 'Driver' ? 'Opportunity' : 'Barrier'} record types found.`);
      }
      ids[type] = id;
    }
    if (!ids.Barrier || !ids.Driver) {
      throw new Error('Medical Barrier/Opportunity record types are unavailable. Refresh or contact support.');
    }
    Object.assign(BARRIER_DRIVER_RECORD_TYPE_IDS, ids);
    return ids;
  }).catch((error) => {
    barrierDriverRecordTypesPromise = null;
    throw error;
  });
  return barrierDriverRecordTypesPromise;
};
export const BARRIER_DRIVER_TITLE_FIELDS = {
  Barrier: 'KPH_Barrier_Title__c',
  Driver: 'KPH_Opportunity_Title__c',
};
export const BARRIER_DRIVER_INDICATION_FIELD = 'KPH_Indication__c';
export const BARRIER_DRIVER_STRATEGY_FIELD = 'KPH_Medical_Strategy__c';
export const BARRIER_DRIVER_STATUS_FIELD = 'KPH_Medical_Tactical_Action_Status__c';
export const MM_INDICATION_VALUE = 'MM';

export const BARRIER_DRIVER_STATUS_ORDER = [
  'In Progress',
  'At Risk',
  'Behind',
  'Closed',
];

const barrierDriverStatusKey = (value) =>
  String(value || '')
    .trim()
    .replace(/[\u2013\u2014]/g, '-')
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const barrierDriverStatusRank = (value) => {
  const status = normalizeBarrierDriverStatusForDisplay(value);
  const index = BARRIER_DRIVER_STATUS_ORDER.indexOf(status);
  return index === -1 ? BARRIER_DRIVER_STATUS_ORDER.length : index;
};

export const isClosedBarrierDriverStatus = (value) =>
  normalizeBarrierDriverStatusForDisplay(value) === 'Closed';

export const isOpenBarrierDriverStatus = (value) =>
  !isClosedBarrierDriverStatus(value);

export const barrierDriverUsesStrategy = (indication) => {
  const key = String(indication || '').trim().toUpperCase();
  // MM uses the same medical strategy field as DLBCL/Portfolio.
  return key === 'DLBCL' || key === 'PORTFOLIO' || key === MM_INDICATION_VALUE;
};

export const isMmIndication = (indication) =>
  String(indication || '').trim().toUpperCase() === MM_INDICATION_VALUE;

// Indication is driven entirely by the CRM picklist for both record types;
// MM is no longer restricted to opportunities.
export const isBarrierDriverIndicationAllowedForType = () => true;

export const filterBarrierDriverIndicationsForType = (values = [], type, currentValue = '') => {
  const out = [];
  const seen = new Set();
  for (const value of [currentValue, ...(values || [])]) {
    if (!value || seen.has(value)) continue;
    if (!isBarrierDriverIndicationAllowedForType(type, value) && value !== currentValue) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
};

// Existing CRM rows flow through from CRM. Create/edit controls apply the
// current type-specific indication rule without hiding already-saved data.
export const isVisibleBarrierDriverIndication = () => true;

const normalizeRecordTypeId = (value) => {
  if (!value) return '';
  return toCanonicalSalesforceId(value) || String(value).trim();
};

const barrierDriverRecordTypeId = (type) =>
  BARRIER_DRIVER_RECORD_TYPE_IDS[type === 'Driver' ? 'Driver' : 'Barrier'];

const typeFromBarrierDriverRecordTypeId = (recordTypeId) => {
  const normalized = normalizeRecordTypeId(recordTypeId);
  if (!normalized) return '';
  if (normalized === normalizeRecordTypeId(BARRIER_DRIVER_RECORD_TYPE_IDS.Driver)) return 'Driver';
  if (normalized === normalizeRecordTypeId(BARRIER_DRIVER_RECORD_TYPE_IDS.Barrier)) return 'Barrier';
  return '';
};

// Title lives on a different field for each Medical record type. The app keeps
// its historical internal "Driver" value, which maps to the Opportunity field.
export const BARRIER_DRIVER_BASE_FIELDS = [
  'Id',
  'Name',
  'CreatedDate',
  'RecordTypeId',
  'LastModifiedDate',
  'KPH_Account_Plan__c',
  BARRIER_DRIVER_TITLE_FIELDS.Barrier,
  BARRIER_DRIVER_TITLE_FIELDS.Driver,
  BARRIER_DRIVER_INDICATION_FIELD,
  BARRIER_DRIVER_STATUS_FIELD,
  BARRIER_DRIVER_STRATEGY_FIELD,
];

export const BARRIER_DRIVER_OPTIONAL_FIELDS = [BARRIER_DRIVER_COMMENTS_FIELD];

export const BARRIER_DRIVER_FIELDS = [
  ...BARRIER_DRIVER_BASE_FIELDS,
  ...BARRIER_DRIVER_OPTIONAL_FIELDS,
];

// "Clinical-Grow Class | Expand Referral Networks" -> "Clinical"
export const categoryPrefix = (value) => {
  if (!value) return null;
  const idx = String(value).indexOf('-');
  return idx === -1 ? value : value.slice(0, idx).trim();
};

const barrierDriverFieldAccess = (fields) => ({
  canEditComments: fields.includes(BARRIER_DRIVER_COMMENTS_FIELD),
});

export const normalizeBarrierDriverStatusForDisplay = (value) => {
  const key = barrierDriverStatusKey(value);
  if (key === 'close' || key === 'closed' || key === 'complete' || key === 'completed') return 'Closed';
  if (key === 'in progress') return 'In Progress';
  if (key === 'at risk') return 'At Risk';
  if (key === 'behind') return 'Behind';
  // These values belonged to the retired status field and are not accepted by
  // the restricted Medical Tactical Action Status picklist.
  if (key === 'open' || key === 'identified - not started' || key === 'near outcome' || !key) return '';
  return value;
};

export const normalizeBarrierDriverStatusForSave = (value) => {
  const status = normalizeBarrierDriverStatusForDisplay(value);
  // The UI continues to use "Closed" for its filters and completed-state
  // behavior, while the Medical CRM picklist API value is "Complete".
  if (status === 'Closed') return 'Complete';
  return status || null;
};

const picklistLabelForValue = (labels, value) => {
  if (!value || !labels || typeof labels !== 'object') return value || null;
  return Object.prototype.hasOwnProperty.call(labels, value) ? (labels[value] || value) : value;
};

export const toBarrierDriver = (
  row,
  access = barrierDriverFieldAccess(BARRIER_DRIVER_FIELDS),
  options = {}
) => {
  const r = unwrap(row);
  if (!r) return null;
  const recordTypeType = typeFromBarrierDriverRecordTypeId(r.RecordTypeId);
  const isDriver = recordTypeType
    ? recordTypeType === 'Driver'
    : !!r[BARRIER_DRIVER_TITLE_FIELDS.Driver];
  const title = r[isDriver ? BARRIER_DRIVER_TITLE_FIELDS.Driver : BARRIER_DRIVER_TITLE_FIELDS.Barrier];
  const usesStrategy = barrierDriverUsesStrategy(r[BARRIER_DRIVER_INDICATION_FIELD]);
  const storedStrategy = fieldValue(r[BARRIER_DRIVER_STRATEGY_FIELD]);
  const strategy = usesStrategy ? (storedStrategy || null) : null;
  const legacyEditState = medicalLegacyEditState(
    !isDriver && isMedicalLegacyStrategy(storedStrategy)
  );
  return {
    id: r.Id,
    accountPlanId: r.KPH_Account_Plan__c || null,
    createdDate: fieldValue(r.CreatedDate) || null,
    legacyEditState,
    type: recordTypeType || (isDriver ? 'Driver' : 'Barrier'),
    recordTypeId: r.RecordTypeId || null,
    name: title || null,
    category: null,
    categoryValue: null,
    indication: r[BARRIER_DRIVER_INDICATION_FIELD],
    status: legacyEditState === 'legacy'
      ? 'Closed'
      : normalizeBarrierDriverStatusForDisplay(r[BARRIER_DRIVER_STATUS_FIELD]),
    businessImpact: null,
    strategy,
    strategyLabel: strategy ? picklistLabelForValue(options.strategyLabels, strategy) : null,
    strategyRank: null,
    planStrategyId: null,
    comments: access.canEditComments ? (r[BARRIER_DRIVER_COMMENTS_FIELD] || '') : '',
    canEditComments: legacyEditState === 'legacy' ? false : access.canEditComments,
    lastModifiedDate: r.LastModifiedDate,
  };
};

const fetchBarrierDriverRows = (where, fields = BARRIER_DRIVER_FIELDS) =>
  runQuery({
    object: BARRIER_DRIVER_OBJECT,
    fields,
    where,
    sort: ['Name ASC'],
  }).then(
    (rows) => ({ rows, fields }),
    (error) => {
      const field = inaccessibleFieldFromError(error);
      if (field && fields.includes(field) && BARRIER_DRIVER_OPTIONAL_FIELDS.includes(field)) {
        return fetchBarrierDriverRows(where, fields.filter((f) => f !== field));
      }
      throw error;
    }
  );

export const fetchBarriersAndDrivers = (planId) => {
  const where = buildIdMatchWhere('KPH_Account_Plan__c', planId);
  if (!where) return Promise.resolve({ rows: [], access: barrierDriverFieldAccess(BARRIER_DRIVER_FIELDS) });
  return fetchBarrierDriverRecordTypeIds().then(() => fetchBarrierDriverRows(where)).then(({ rows, fields }) => ({
    rows,
    access: barrierDriverFieldAccess(fields),
  }));
};

const buildBarrierDriverWriteFields = (form) => {
  const type = form.type === 'Driver' ? 'Driver' : 'Barrier';
  const isDriver = type === 'Driver';
  const usesStrategy = barrierDriverUsesStrategy(form.indication);
  const title = String(form.name || '').trim() || null;
  const offlineOppositeTitleValue = String(form.offlineOppositeTitleValue || '').trim();
  return {
    RecordTypeId: barrierDriverRecordTypeId(type),
    ...(isDriver
      ? {
          // Offline CRM applies the unused field's configured default even
          // when blank. Supply an indication-valid API value so the queued
          // create passes dependent restricted-picklist validation.
          [BARRIER_DRIVER_TITLE_FIELDS.Barrier]: offlineOppositeTitleValue,
          [BARRIER_DRIVER_TITLE_FIELDS.Driver]: title,
        }
      : {
          [BARRIER_DRIVER_TITLE_FIELDS.Barrier]: title,
          [BARRIER_DRIVER_TITLE_FIELDS.Driver]: offlineOppositeTitleValue,
        }),
    [BARRIER_DRIVER_INDICATION_FIELD]: form.indication || null,
    [BARRIER_DRIVER_STATUS_FIELD]: normalizeBarrierDriverStatusForSave(form.status),
    [BARRIER_DRIVER_STRATEGY_FIELD]: usesStrategy ? (form.strategy || null) : null,
    [BARRIER_DRIVER_COMMENTS_FIELD]: form.comments || null,
  };
};

const responseValue = (value) =>
  value && typeof value === 'object' && 'value' in value ? value.value : value;

export const createdRecordIdFromWriteResult = (result, depth = 0) => {
  if (result == null || depth > 5) return null;

  const unwrapped = responseValue(result);
  if (typeof unwrapped === 'string' || typeof unwrapped === 'number') {
    const value = String(unwrapped).trim();
    return value || null;
  }
  if (Array.isArray(unwrapped)) {
    for (const entry of unwrapped) {
      const id = createdRecordIdFromWriteResult(entry, depth + 1);
      if (id) return id;
    }
    return null;
  }
  if (!unwrapped || typeof unwrapped !== 'object') return null;

  const candidates = [
    unwrapped.data?.id,
    unwrapped.data?.Id,
    unwrapped.id,
    unwrapped.Id,
    unwrapped.recordId,
    unwrapped.result,
    unwrapped.response,
  ];
  for (const candidate of candidates) {
    const id = createdRecordIdFromWriteResult(candidate, depth + 1);
    if (id) return id;
  }
  return null;
};

const retryBarrierDriverWriteWithoutOptional = (writer, fields, omittedOptionalFields = []) =>
  writer(fields).then((result) => ({
    ...(result && typeof result === 'object' ? result : { result }),
    savedFields: fields,
    omittedOptionalFields,
  })).catch((error) => {
    const field = inaccessibleFieldFromError(error);
    if (
      field &&
      Object.prototype.hasOwnProperty.call(fields, field) &&
      BARRIER_DRIVER_OPTIONAL_FIELDS.includes(field)
    ) {
      const next = { ...fields };
      delete next[field];
      return retryBarrierDriverWriteWithoutOptional(writer, next, [...omittedOptionalFields, field]);
    }
    throw error;
  });

// A critical activity's indication must match its linked barrier/driver
// (the CRM enforces this). When a barrier/driver's indication changes, move
// every linked activity to the same indication. Only the activities that
// don't already match are written, so an unchanged indication is a no-op.
const cascadeIndicationToLinkedActivities = (barrierId, type, indication) => {
  const newIndication = String(indication || '').trim();
  if (!barrierId || !newIndication) return Promise.resolve(null);
  const lookupField = criticalActivityParentLookupFieldFor(type === 'Driver' ? 'Driver' : 'Barrier');
  const parentWhere = buildIdMatchWhere(lookupField, barrierId);
  if (!parentWhere) return Promise.resolve(null);
  const where = `${parentWhere} AND (${ACTIVITY_SOFT_DELETE_FIELD} = false OR ${ACTIVITY_SOFT_DELETE_FIELD} = null)`;
  return runQuery({
    object: CRITICAL_ACTIVITY_OBJECT,
    fields: ['Id', 'KPH_Indication__c'],
    where,
  })
    .then((rows) => {
      const mismatched = (rows || [])
        .map(unwrap)
        .filter(Boolean)
        .filter((r) => String(fieldValue(r.KPH_Indication__c) || '').trim() !== newIndication);
      if (!mismatched.length) return null;
      return Promise.all(
        mismatched.map((r) =>
          updateRecord(CRITICAL_ACTIVITY_OBJECT, r.Id, { KPH_Indication__c: newIndication })
        )
      );
    })
    .catch((error) => {
      // A cascade failure shouldn't fail the barrier/driver save itself; the
      // page reload + future activity edits keep things consistent.
      console.warn('[barriersDrivers] indication cascade to linked activities failed', error);
      return null;
    });
};

export const updateBarrierDriver = async (id, form) => {
  if (!id) return Promise.reject(new Error('Missing barrier/opportunity id.'));
  const legacyState = await readMedicalLegacyEditState(BARRIER_DRIVER_OBJECT, id);
  if (legacyState === 'unknown') {
    throw new Error('Unable to verify historical-record edit access. Refresh or contact support.');
  }
  if (legacyState === 'legacy') {
    throw new Error('Legacy Barriers are read-only. Create a new Barrier for new work.');
  }
  const fields = buildBarrierDriverWriteFields(form);
  return retryBarrierDriverWriteWithoutOptional(
    (writeFields) => updateRecord(BARRIER_DRIVER_OBJECT, id, writeFields),
    fields
  ).then((result) => {
      // Only cascade when the caller signals the indication actually
      // changed (form.previousIndication). Callers that don't opt in keep
      // the prior behaviour and skip the linked-activity query entirely.
      const prev = form.previousIndication;
      const changed =
        prev !== undefined &&
        String(prev || '').trim() !== String(form.indication || '').trim();
      if (!changed) return result;
      return cascadeIndicationToLinkedActivities(id, form.type, form.indication).then(() => result);
  });
};

export const updateBarrierDriverStatus = async (id, status) => {
  if (!id) return Promise.reject(new Error('Missing barrier/opportunity id.'));
  const legacyState = await readMedicalLegacyEditState(BARRIER_DRIVER_OBJECT, id);
  if (legacyState === 'unknown') {
    throw new Error('Unable to verify historical-record edit access. Refresh or contact support.');
  }
  if (legacyState === 'legacy') {
    throw new Error('Legacy Barriers are read-only.');
  }
  const fields = {
    [BARRIER_DRIVER_STATUS_FIELD]: normalizeBarrierDriverStatusForSave(status),
  };
  return updateRecord(BARRIER_DRIVER_OBJECT, id, fields).then((result) => ({
    ...(result && typeof result === 'object' ? result : { result }),
    savedFields: fields,
  }));
};

export const createBarrierDriver = async (planId, form) => {
  if (!planId) return Promise.reject(new Error('Missing account plan id.'));
  await fetchBarrierDriverRecordTypeIds();
  const fields = { KPH_Account_Plan__c: planId, ...buildBarrierDriverWriteFields(form) };
  return retryBarrierDriverWriteWithoutOptional(
    (nextFields) => createRecord(BARRIER_DRIVER_OBJECT, nextFields),
    fields
  );
};

// Strategy uses KPH_Medical_Strategy__c for DLBCL, Portfolio, and MM indications.
export const aggregateStrategies = (barrierRows, strategyLabels = {}) => {
  const dlbcl = new Set();
  const mm = new Set();
  const portfolio = new Set();
  for (const raw of barrierRows) {
    const r = unwrap(raw);
    if (!r) continue;
    if (!barrierDriverUsesStrategy(r[BARRIER_DRIVER_INDICATION_FIELD])) continue;
    const indication = String(r[BARRIER_DRIVER_INDICATION_FIELD] || '').trim().toUpperCase();
    const strategyValue = fieldValue(r[BARRIER_DRIVER_STRATEGY_FIELD]);
    if (!strategyValue) continue;
    const strategy = picklistLabelForValue(strategyLabels, strategyValue);
    // Only surface strategies from barriers/drivers that are still open.
    if (isClosedBarrierDriverStatus(r[BARRIER_DRIVER_STATUS_FIELD])) continue;
    if (indication === 'DLBCL') {
      dlbcl.add(strategy);
    } else if (indication === 'MM') {
      mm.add(strategy);
    } else if (indication === 'PORTFOLIO') {
      portfolio.add(strategy);
    }
  }
  return { dlbcl: Array.from(dlbcl), mm: Array.from(mm), portfolio: Array.from(portfolio) };
};

// =============================================================================
// Medical Tactics  ─ KPH_Medical_Tactics__c
// =============================================================================
// Link to plan:           KPH_Account_Plans__c = <planId>
// Link to barrier/opportunity: KPH_Barrier_or_Opportunity__c is the shared
// lookup for both record types. Parent type is resolved
// from the linked KPH_Medical_Barrier_Tactical_Actions__c record.
// "Open" status set:      { 'In Progress', 'Planned' }

export const OPEN_ACTIVITY_STATUSES = new Set(['Open', 'In Progress', 'Planned']);
export const CRITICAL_ACTIVITY_OBJECT = 'KPH_Medical_Tactics__c';
export const CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD = 'KPH_Barrier_or_Opportunity__c';
export const CRITICAL_ACTIVITY_TITLE_FIELD = 'KPH_Medical_Tactics__c';
export const ACTIVITY_SOFT_DELETE_FIELD = 'KPH_Is_Deleted__c';
// Salesforce picklist values support up to 255 characters. Several approved
// Medical Tactic values are longer than the legacy 55-character text limit.
export const CRITICAL_ACTIVITY_TITLE_MAX_LENGTH = 255;

export const ACTIVITY_BASE_FIELDS = [
  'Id',
  'Name',
  'CreatedById',
  'CreatedDate',
  'RecordTypeId',
  'LastModifiedDate',
  'KPH_Account_Plans__c',
  CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD,
  CRITICAL_ACTIVITY_TITLE_FIELD,
  'KPH_Detail__c',
  'KPH_Status__c',
  'KPH_To_Be_Completed_By__c',
  'KPH_Accountable_POD_Members__c',
  'KPH_Indication__c',
];

export const ACTIVITY_OPTIONAL_FIELDS = [
  ACTIVITY_SOFT_DELETE_FIELD,
];

export const ACTIVITY_FIELDS = [...ACTIVITY_BASE_FIELDS, ...ACTIVITY_OPTIONAL_FIELDS];

const escapeSoqlString = (value) => String(value).replace(/'/g, "\\'");

const truncateCriticalActivityTitle = (value) =>
  String(value || '').slice(0, CRITICAL_ACTIVITY_TITLE_MAX_LENGTH);

const buildAnyIdMatchWhere = (fieldApi, ids) => {
  const seen = new Set();
  const variants = [];
  for (const id of ids || []) {
    const values = salesforceIdVariants(id);
    for (const value of values.length ? values : [id]) {
      if (!value) continue;
      const trimmed = String(value).trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      variants.push(trimmed);
    }
  }
  if (!variants.length) return null;
  return variants.map((value) => `${fieldApi} = '${escapeSoqlString(value)}'`).join(' OR ');
};

const salesforceIdLookupKeys = (id) => {
  if (!id) return [];
  const rawId = String(id).trim();
  if (!rawId) return [];
  const variants = salesforceIdVariants(rawId);
  return variants.length ? variants : [rawId];
};

export const createSalesforceIdLookup = (records = [], idKey = 'id') => {
  const lookup = new Map();
  for (const record of records || []) {
    const id = record && record[idKey];
    for (const key of salesforceIdLookupKeys(id)) {
      lookup.set(key, record);
    }
  }
  return lookup;
};

export const getSalesforceIdLookupEntry = (lookup, id) => {
  if (!lookup || !id) return null;
  for (const key of salesforceIdLookupKeys(id)) {
    const entry = lookup.get(key);
    if (entry) return entry;
  }
  return null;
};

const lookupUserNamesById = (ids, context = 'userLookup') => {
  const where = buildAnyIdMatchWhere('Id', ids);
  if (!where) return Promise.resolve(new Map());
  return runQuery({
    object: 'User',
    fields: ['Id', 'Name'],
    where,
    sort: ['Name ASC'],
  }).then(
    (rows) => {
      const map = new Map();
      for (const row of rows || []) {
        const r = unwrap(row);
        if (!r || !r.Id || !r.Name) continue;
        map.set(r.Id, r.Name);
        for (const variant of salesforceIdVariants(r.Id)) {
          map.set(variant, r.Name);
        }
      }
      return map;
    },
    (error) => {
      console.warn(`[${context}] unable to resolve user names through User`, error);
      return new Map();
    }
  );
};

const isTruthy = (value) => {
  if (value === true) return true;
  const key = String(value || '').trim().toLowerCase();
  return key === 'true' || key === 'yes' || key === '1';
};

const unwrapLookupCell = (value, depth = 0) => {
  if (value === null || value === undefined || depth > 8) return value;
  if (typeof value !== 'object') return value;
  if ('value' in value) return unwrapLookupCell(value.value, depth + 1);
  if ('display' in value) return unwrapLookupCell(value.display, depth + 1);
  return value;
};

const lookupIdValue = (value) => {
  const cell = unwrapLookupCell(value);
  if (cell === null || cell === undefined || cell === '') return null;
  if (typeof cell !== 'object') {
    const text = String(cell).trim();
    return text || null;
  }
  for (const key of ['Id', 'id', 'ID']) {
    const nested = lookupIdValue(cell[key]);
    if (nested) return nested;
  }
  return null;
};

const stringifyError = (error) => {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  if (error.errorMessage) return error.errorMessage;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const inaccessibleFieldFromError = (error) => {
  const text = stringifyError(error);
  const patterns = [
    /field that cannot be accessed:\s*([A-Za-z0-9_]+)/i,
    /field type that is not supported:\s*(?:[A-Za-z0-9_]+\.)?([A-Za-z0-9_]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const canRetryWithoutField = (fields, field) =>
  field && fields.includes(field) && ACTIVITY_OPTIONAL_FIELDS.includes(field);

const activityFieldAccess = (fields) => ({
  canDelete: fields.includes(ACTIVITY_SOFT_DELETE_FIELD),
});

export const toActivity = (row, access = activityFieldAccess(ACTIVITY_FIELDS), userNameById = new Map()) => {
  const r = unwrap(row);
  if (!r) return null;
  const createdById = lookupIdValue(r.CreatedById) || '';
  const parentId = lookupIdValue(r[CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD]);
  const titleFallback = r[CRITICAL_ACTIVITY_TITLE_FIELD] || r.KPH_Detail__c;
  return {
    id: r.Id,
    name: truncateCriticalActivityTitle(titleFallback),
    createdDate: fieldValue(r.CreatedDate) || null,
    legacyEditState: 'current',
    details: r.KPH_Detail__c || '',
    status: r.KPH_Status__c,
    dueDate: r.KPH_To_Be_Completed_By__c,
    completedDate: null,
    ownerLabel: r.KPH_Accountable_POD_Members__c,
    indication: r.KPH_Indication__c,
    comments: '',
    isDeactivated: false,
    canEditComments: false,
    canDeactivate: access.canDelete,
    canDelete: access.canDelete,
    createdById,
    createdBy: userNameById.get(createdById) || relationshipName(r, 'CreatedBy') || createdById || '',
    barrierDriverId: parentId,
    parentType: null,
    lastModifiedDate: r.LastModifiedDate,
  };
};

export const applyMedicalLegacyParentPolicy = (activity, parent) => {
  if (!activity) return activity;
  const state = parent?.type === 'Barrier' ? parent.legacyEditState : 'current';
  if (state === 'legacy') {
    return {
      ...activity,
      legacyEditState: 'legacy',
      status: 'Complete',
      canDeactivate: false,
      canDelete: false,
    };
  }
  if (state === 'unknown') {
    return {
      ...activity,
      legacyEditState: 'unknown',
      canDeactivate: false,
      canDelete: false,
    };
  }
  return { ...activity, legacyEditState: 'current' };
};

const fetchCriticalActivityRows = (where, fields = ACTIVITY_FIELDS) =>
  runQuery({
    object: CRITICAL_ACTIVITY_OBJECT,
    fields,
    where: `${where} AND ${SOFT_DELETE_ACTIVE_WHERE}`,
    sort: ['LastModifiedDate DESC'],
  }).then(
    (rows) => ({ rows, fields }),
    (error) => {
      const field = inaccessibleFieldFromError(error);
      if (canRetryWithoutField(fields, field)) {
        return fetchCriticalActivityRows(where, fields.filter((f) => f !== field));
      }
      throw error;
    }
  );

export const fetchCriticalActivities = (planId) => {
  const where = buildIdMatchWhere('KPH_Account_Plans__c', planId);
  if (!where) return Promise.resolve([]);
  return fetchCriticalActivityRows(where).then(({ rows, fields }) => {
    const access = activityFieldAccess(fields);
    const createdByIds = rows
      .map((row) => {
        const r = unwrap(row);
        return r && r.CreatedById;
      })
      .filter(Boolean);
    return lookupUserNamesById(createdByIds, 'criticalActivities').then((userNameById) =>
      rows.map((row) => toActivity(row, access, userNameById)).filter(Boolean)
    );
  });
};

export const normalizedActivityStatus = (status) =>
  status === 'Completed' ? 'Complete' : status || 'Planned';

const normalizedCriticalActivityTitle = (form) => String(form?.title || '').trim();

const validateCriticalActivityTitle = (form) => {
  const title = normalizedCriticalActivityTitle(form);
  if (title.length > CRITICAL_ACTIVITY_TITLE_MAX_LENGTH) {
    return Promise.reject(
      new Error(`Medical Tactic title must be ${CRITICAL_ACTIVITY_TITLE_MAX_LENGTH} characters or fewer.`)
    );
  }
  return Promise.resolve(title);
};

const validateCriticalActivityDueDate = (form) => {
  const dueDate = String(form?.dueDate || '').trim();
  if (!dueDate) return Promise.reject(new Error('Due Date is required.'));
  return Promise.resolve(dueDate);
};

const recordIdForSoftDelete = (id) => {
  const text = String(id || '').trim();
  if (!text || !isOnline()) return text;
  return toCanonicalSalesforceId(text) || text;
};

const collectNotFoundSignals = (
  value,
  signals = { has404: false, hasNotFoundCode: false, text: [] },
  seen = new Set(),
  depth = 0
) => {
  if (value == null || depth > 16) return signals;
  if (typeof value === 'string') {
    signals.text.push(value.toLowerCase());
    return signals;
  }
  if (typeof value === 'number') {
    if (value === 404) signals.has404 = true;
    return signals;
  }
  if (typeof value !== 'object') return signals;
  if (seen.has(value)) return signals;
  seen.add(value);

  if (String(value.statusCode || '').trim() === '404') signals.has404 = true;
  if (String(value.errorCode || '').trim().toUpperCase() === 'NOT_FOUND') {
    signals.hasNotFoundCode = true;
  }

  Object.values(value).forEach((child) => {
    collectNotFoundSignals(child, signals, seen, depth + 1);
  });
  return signals;
};

const isDesktopSoftDeleteNotFoundError = (error) => {
  if (!isOnline()) return false;
  const signals = collectNotFoundSignals(error);
  const text = signals.text.join(' ');
  const hasResourceNotFoundMessage =
    text.includes('requested resource does not exist') ||
    text.includes('resource not found');
  return (signals.has404 || signals.hasNotFoundCode) && hasResourceNotFoundMessage;
};

const softDeleteRecord = (object, id, fields = {}, options = {}) => {
  const recordId = recordIdForSoftDelete(id);
  const deleteFields = { KPH_Is_Deleted__c: true, ...fields };
  return Promise.resolve(updateRecord(object, recordId, deleteFields, options)).catch((error) => {
    if (!isDesktopSoftDeleteNotFoundError(error)) throw error;
    return {
      success: true,
      data: { id: recordId },
      object,
      fields: deleteFields,
      desktopNotFoundAfterDelete: true,
    };
  });
};

const retryWriteWithoutInaccessibleOptionalField = (writer, fields, omittedOptionalFields = []) =>
  writer(fields).then((result) => ({
    ...(result && typeof result === 'object' ? result : { result }),
    savedFields: fields,
    omittedOptionalFields,
  })).catch((error) => {
    const field = inaccessibleFieldFromError(error);
    if (field && Object.prototype.hasOwnProperty.call(fields, field) && ACTIVITY_OPTIONAL_FIELDS.includes(field)) {
      const nextFields = { ...fields };
      delete nextFields[field];
      return retryWriteWithoutInaccessibleOptionalField(writer, nextFields, [...omittedOptionalFields, field]);
    }
    throw error;
  });

const hasExplicitCriticalActivityParent = (form) =>
  !!form && (
    Object.prototype.hasOwnProperty.call(form, 'parentId') ||
    Object.prototype.hasOwnProperty.call(form, 'barrierDriverId') ||
    Object.prototype.hasOwnProperty.call(form, 'primaryBarrierId')
  );

const criticalActivityParentId = (form) =>
  form?.parentId ?? form?.barrierDriverId ?? form?.primaryBarrierId ?? null;

const explicitCriticalActivityParentType = (form) => {
  if (form?.parentType === 'Driver') return 'Driver';
  if (form?.parentType === 'Barrier') return 'Barrier';
  return '';
};

let criticalActivityRecordTypesPromise = null;

const criticalActivityTypeFromRecordType = (recordType = {}) => {
  const key = `${fieldValue(recordType.DeveloperName) || ''} ${fieldValue(recordType.Name) || ''}`
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
  if (/\bopportunit(?:y|ies)\b/.test(key) || /\bdriver\b/.test(key)) return 'Driver';
  if (/\bbarrier\b/.test(key)) return 'Barrier';
  return '';
};

export const fetchCriticalActivityRecordTypeIds = () => {
  if (criticalActivityRecordTypesPromise) return criticalActivityRecordTypesPromise;
  criticalActivityRecordTypesPromise = runQuery({
    object: 'RecordType',
    fields: ['Id', 'DeveloperName', 'Name'],
    where: `SobjectType = '${CRITICAL_ACTIVITY_OBJECT}' AND IsActive = true`,
  }).then((rows) => {
    const ids = {};
    for (const row of rows || []) {
      const recordType = unwrap(row) || {};
      const type = criticalActivityTypeFromRecordType(recordType);
      if (type && recordType.Id) ids[type] = fieldValue(recordType.Id);
    }
    return ids;
  }).catch((error) => {
    criticalActivityRecordTypesPromise = null;
    throw error;
  });
  return criticalActivityRecordTypesPromise;
};

const resolveCriticalActivityRecordTypeId = (parentType) =>
  fetchCriticalActivityRecordTypeIds().then((ids) => {
    const recordTypeId = ids?.[parentType];
    if (recordTypeId) return recordTypeId;
    throw new Error(`The ${parentType === 'Driver' ? 'Opportunities' : 'Barrier'} Medical Tactic record type is unavailable.`);
  });

// Barrier is the established/default Medical Tactic record type for current
// users. Supplying its active org-level RecordTypeId can still fail when that
// ID is not assigned to the user's profile (`INVALID_CROSS_REFERENCE_KEY`).
// Let Salesforce apply the user's accessible default for Barrier writes.
// Opportunities must remain explicit because their restricted picklist values
// are assigned to a different Medical Tactic record type.
const criticalActivityRecordTypeIdForWrite = (parentType) =>
  parentType === 'Barrier'
    ? Promise.resolve(null)
    : resolveCriticalActivityRecordTypeId(parentType);

const isInaccessibleRecordTypeError = (error) => {
  let serialized = '';
  try {
    serialized = JSON.stringify(error);
  } catch {
    // Use the readable error surface below.
  }
  const text = `${stringifyError(error)} ${serialized}`;
  return (
    text.includes('INVALID_CROSS_REFERENCE_KEY') &&
    text.includes('RecordTypeId')
  );
};

// Active RecordType rows are org-level metadata and can include IDs that are
// not assigned to the current user's profile. If Salesforce rejects only that
// explicit ID, retry once without it and let Salesforce apply the user's
// accessible default. Restricted-picklist validation still runs normally, so
// this cannot silently save an Opportunity tactic under an incompatible type.
const writeCriticalActivityWithAccessibleRecordType = (writer, fields) =>
  writer(fields).catch((error) => {
    if (!fields.RecordTypeId || !isInaccessibleRecordTypeError(error)) throw error;
    const fieldsWithoutRecordType = { ...fields };
    delete fieldsWithoutRecordType.RecordTypeId;
    return writer(fieldsWithoutRecordType);
  });

export const criticalActivityParentLookupFieldFor = (parentType) =>
  CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD;

const criticalActivityParentFields = (form) => {
  if (!hasExplicitCriticalActivityParent(form)) return {};
  const parentId = criticalActivityParentId(form) || null;
  return {
    [CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD]: parentId,
  };
};

const validateCriticalActivityParentRecordType = async (form) => {
  if (!hasExplicitCriticalActivityParent(form)) return Promise.resolve(null);
  const parentId = criticalActivityParentId(form);
  if (!parentId) return Promise.resolve(null);
  await fetchBarrierDriverRecordTypeIds();
  const parentType = typeFromBarrierDriverRecordTypeId(form?.parentRecordTypeId);
  const requestedType = explicitCriticalActivityParentType(form);

  if (!parentType) {
    return Promise.reject(
      new Error('The linked record must use the Medical Barrier or Medical Opportunity record type.')
    );
  }
  if (requestedType && requestedType !== parentType) {
    return Promise.reject(
      new Error(`The linked record is a ${parentType === 'Driver' ? 'Medical Opportunity' : 'Medical Barrier'}, not a ${requestedType === 'Driver' ? 'Medical Opportunity' : 'Medical Barrier'}.`)
    );
  }
  return Promise.resolve(parentType);
};

export const updateCriticalActivity = async (activityId, form) => {
  if (!activityId) return Promise.reject(new Error('Missing medical tactic id.'));
  const legacyState = await readMedicalLegacyEditState(CRITICAL_ACTIVITY_OBJECT, activityId);
  if (legacyState === 'unknown') {
    throw new Error('Unable to verify historical-record edit access. Refresh or contact support.');
  }
  if (legacyState === 'legacy') {
    throw new Error('Medical Tactics linked to legacy Barriers are read-only.');
  }
  if (hasExplicitCriticalActivityParent(form) && !criticalActivityParentId(form)) {
    return Promise.reject(new Error('Linked Barrier/Opportunity is required.'));
  }
  return Promise.all([
    validateCriticalActivityTitle(form),
    validateCriticalActivityDueDate(form),
    validateCriticalActivityParentRecordType(form),
  ]).then(([title, dueDate, parentType]) => {
    const status = normalizedActivityStatus(form.status);
    return (parentType ? criticalActivityRecordTypeIdForWrite(parentType) : Promise.resolve(null)).then((recordTypeId) => {
      const fields = {
        [CRITICAL_ACTIVITY_TITLE_FIELD]: title,
        KPH_Detail__c: String(form.details || '').trim(),
        KPH_Indication__c: form.indication || null,
        KPH_Status__c: status,
        KPH_Accountable_POD_Members__c: form.accountable || null,
        KPH_To_Be_Completed_By__c: dueDate,
        ...criticalActivityParentFields(form),
        ...(recordTypeId ? { RecordTypeId: recordTypeId } : {}),
      };
      return retryWriteWithoutInaccessibleOptionalField(
        (writeFields) => writeCriticalActivityWithAccessibleRecordType(
          (nextFields) => updateRecord(CRITICAL_ACTIVITY_OBJECT, activityId, nextFields),
          writeFields
        ),
        fields
      );
    });
  });
};

const criticalActivityDeleteFields = (activity = null) => {
  const fields = { [ACTIVITY_SOFT_DELETE_FIELD]: true };
  const parentId = criticalActivityParentId(activity);
  if (!parentId) return fields;

  fields[CRITICAL_ACTIVITY_PARENT_LOOKUP_FIELD] = parentId;
  return fields;
};

export const deleteCriticalActivity = async (activityId, activity = null) => {
  if (!activityId) return Promise.reject(new Error('Missing medical tactic id.'));
  const legacyState = await readMedicalLegacyEditState(CRITICAL_ACTIVITY_OBJECT, activityId);
  if (legacyState === 'unknown') {
    throw new Error('Unable to verify historical-record edit access. Refresh or contact support.');
  }
  if (legacyState === 'legacy') {
    throw new Error('Medical Tactics linked to legacy Barriers are read-only.');
  }
  return softDeleteRecord(CRITICAL_ACTIVITY_OBJECT, activityId, criticalActivityDeleteFields(activity));
};

export const deactivateCriticalActivity = deleteCriticalActivity;

export const createCriticalActivity = (planId, form) => {
  if (!planId) return Promise.reject(new Error('Missing account plan id.'));
  if (!criticalActivityParentId(form)) {
    return Promise.reject(new Error('Linked Barrier/Opportunity is required.'));
  }
  if (!String(form?.indication || '').trim()) {
    return Promise.reject(new Error('Indication is required.'));
  }
  return Promise.all([
    validateCriticalActivityTitle(form),
    validateCriticalActivityDueDate(form),
    validateCriticalActivityParentRecordType(form),
  ]).then(([title, dueDate, parentType]) => criticalActivityRecordTypeIdForWrite(parentType).then((recordTypeId) => {
    const status = normalizedActivityStatus(form.status);
    const fields = {
      ...(recordTypeId ? { RecordTypeId: recordTypeId } : {}),
      KPH_Account_Plans__c: planId,
      [CRITICAL_ACTIVITY_TITLE_FIELD]: title,
      KPH_Detail__c: String(form.details || '').trim(),
      KPH_Indication__c: form.indication,
      KPH_Status__c: status,
      KPH_Accountable_POD_Members__c: form.accountable || null,
      KPH_To_Be_Completed_By__c: dueDate,
      [ACTIVITY_SOFT_DELETE_FIELD]: false,
      ...criticalActivityParentFields(form),
    };
    return retryWriteWithoutInaccessibleOptionalField(
      (writeFields) => writeCriticalActivityWithAccessibleRecordType(
        (nextFields) => createRecord(CRITICAL_ACTIVITY_OBJECT, nextFields),
        writeFields
      ),
      fields
    );
  }));
};

// Activities counted per barrier/driver = those whose status is open
// (`In Progress` or `Planned`) and that link back through either parent lookup.
export const buildOpenActivityCountByBarrier = (activities) => {
  const counts = {};
  for (const a of activities) {
    if (!a.barrierDriverId) continue;
    if (a.isDeactivated === true) continue;
    if (!OPEN_ACTIVITY_STATUSES.has(a.status)) continue;
    for (const key of salesforceIdLookupKeys(a.barrierDriverId)) {
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  return counts;
};

const SOFT_DELETE_ACTIVE_WHERE = '(KPH_Is_Deleted__c = false OR KPH_Is_Deleted__c = null)';

const PARTICIPATION_SORT_ORDER = ['core', 'lead', 'extended'];

export const participationSortRank = (participation) => {
  const key = String(participation || '').trim().toLowerCase();
  const index = PARTICIPATION_SORT_ORDER.indexOf(key);
  return index === -1 ? PARTICIPATION_SORT_ORDER.length : index;
};

export const sortTeamMembersByParticipation = (members = []) =>
  (members || [])
    .map((member, index) => ({ member, index }))
    .sort((left, right) => {
      const rankDelta =
        participationSortRank(left.member?.participation) -
        participationSortRank(right.member?.participation);
      if (rankDelta) return rankDelta;
      const nameDelta = (left.member?.name || '').localeCompare(right.member?.name || '', undefined, {
        sensitivity: 'base',
      });
      return nameDelta || left.index - right.index;
    })
    .map(({ member }) => member);

// =============================================================================
// Team Members (full page)  ─ Account_Team_Member_vod__c, linked by Account_Plan
// =============================================================================
// Same object as POD Users, but linked via Account_Plan_vod__c (NOT the
// ecosystem plan). Used by the Team Members detail page.

export const TEAM_MEMBER_OBJECT = 'Account_Team_Member_vod__c';

export const TEAM_MEMBER_BY_PLAN_FIELDS = [
  'Id',
  'Account_Plan_vod__c',
  'Team_Member_Name_vod__c',
  'KPH_Role__c',
  'Account_Team_Member_Active__c',
  'KPH_Participation__c',
  'Team_Member_vod__c',
  'KPH_Is_Deleted__c',
];

export const toTeamMember = (row) => {
  const r = unwrap(row);
  if (!r) return null;
  return {
    id: r.Id,
    userId: r.Team_Member_vod__c || null,
    name: r.Team_Member_Name_vod__c || null,
    role: r.KPH_Role__c || null,
    functionName: r.KPH_Role__c || null,
    participation: r.KPH_Participation__c || null,
    isPrimary: toBooleanFlag(r.Account_Team_Member_Active__c),
  };
};

export const fetchTeamMembersByPlan = (planId) => {
  const planWhere = buildIdMatchWhere('Account_Plan_vod__c', planId);
  if (!planWhere) return Promise.resolve([]);
  return runCrmQuery({
    object: TEAM_MEMBER_OBJECT,
    fields: TEAM_MEMBER_BY_PLAN_FIELDS,
    where: `${planWhere} AND ${SOFT_DELETE_ACTIVE_WHERE}`,
    sort: ['Team_Member_Name_vod__c ASC'],
  }).then((rows) => sortTeamMembersByParticipation(rows.map(toTeamMember).filter(Boolean)));
};

// =============================================================================
// Stakeholders  ─ KPH_Stakeholder_Map__c
// =============================================================================

const cleanedTextOrNull = (value) => {
  const text = String(value ?? '').trim();
  return text || null;
};

const normalizedActiveStatus = (value, fallback = true) => {
  if (value === true || value === false) return value;
  const key = String(value || '').trim().toLowerCase();
  if (key === 'active' || key === 'true' || key === 'yes') return true;
  if (key === 'inactive' || key === 'false' || key === 'no') return false;
  return fallback;
};

const teamMemberDisplayFields = (form) => ({
  KPH_Role__c: cleanedTextOrNull(form.role),
  Account_Team_Member_Active__c: normalizedActiveStatus(form.status, true),
});

const buildTeamMemberWriteFields = (form) => ({
  Team_Member_vod__c: cleanedTextOrNull(form.userId),
  Team_Member_Name_vod__c: cleanedTextOrNull(form.name),
  KPH_Participation__c: cleanedTextOrNull(form.participation),
});

export const updateTeamMember = (id, form) => {
  if (!id) return Promise.reject(new Error('Missing team member id.'));
  const fields = buildTeamMemberWriteFields(form || {});
  if (!fields.Team_Member_vod__c) {
    return Promise.reject(new Error('Team member user is required.'));
  }
  return updateRecord(TEAM_MEMBER_OBJECT, id, fields).then(() =>
    toTeamMember({ Id: id, ...teamMemberDisplayFields(form || {}), ...fields })
  );
};

export const deleteTeamMember = (id) => {
  if (!id) return Promise.reject(new Error('Missing team member id.'));
  return softDeleteRecord(TEAM_MEMBER_OBJECT, id);
};

export const createTeamMember = (planId, form) => {
  if (!planId) return Promise.reject(new Error('Missing account plan id.'));
  const fields = {
    Account_Plan_vod__c: planId,
    ...buildTeamMemberWriteFields(form || {}),
  };
  if (!fields.Team_Member_vod__c) {
    return Promise.reject(new Error('Team member user is required.'));
  }
  return createCrmRecord(TEAM_MEMBER_OBJECT, fields).then((result) => {
    const id = createdRecordIdFromWriteResult(result);
    if (!id) throw new Error('Unable to create team member record.');
    return toTeamMember({ Id: id, ...teamMemberDisplayFields(form || {}), ...fields });
  });
};

export const STAKEHOLDER_OBJECT = 'KPH_Stakeholder_Map__c';
export const STAKEHOLDER_PRIMARY_PARENT_NAME_FIELD = 'KPH_Primary_Parent_Name__c';

const stakeholderQueryAsSoql = ({ object, fields, where, sort, limit }) =>
  [
    `SELECT ${(fields || []).join(', ')}`,
    `FROM ${object}`,
    where ? `WHERE ${where}` : null,
    Array.isArray(sort) && sort.length ? `ORDER BY ${sort.join(', ')}` : null,
    limit ? `LIMIT ${limit}` : null,
  ]
    .filter(Boolean)
    .join(' ');

const logStakeholderCrm = (label, payload) => {
  if (!hasVeevaRuntime() || typeof console === 'undefined') return;
  const fullLabel = `[KPH Stakeholders]${label}`;
  console.log(fullLabel, payload);
  if (typeof window !== 'undefined') {
    if (!Array.isArray(window.__KPH_STAKEHOLDER_QUERY_LOGS__)) {
      window.__KPH_STAKEHOLDER_QUERY_LOGS__ = [];
    }
    window.__KPH_STAKEHOLDER_QUERY_LOGS__.push({
      timestamp: new Date().toISOString(),
      label: fullLabel,
      ...payload,
    });
  }
};

const resetStakeholderCrmLog = () => {
  if (hasVeevaRuntime() && typeof window !== 'undefined') {
    window.__KPH_STAKEHOLDER_QUERY_LOGS__ = [];
  }
};

export const STAKEHOLDER_FIELDS = [
  'Id',
  'KPH_Account_Plan__c',
  'KPH_Account__c',
  'KPH_Account_Name__c',
  'KPH_Title__c',
  'KPH_Other_Title__c',
  STAKEHOLDER_PRIMARY_PARENT_NAME_FIELD,
  'Stakeholder_EID__c',
  'KPH_Is_Deleted__c',
];

const STAKEHOLDER_ACTIVE_WHERE = '(KPH_Is_Deleted__c = false OR KPH_Is_Deleted__c = null)';

export const toStakeholder = (row, accountDetailsById = null) => {
  const r = unwrap(row);
  if (!r) return null;
  const accountId = r.KPH_Account__c || null;
  const accountDetails = stakeholderAccountDetailsFromLookup(accountDetailsById, accountId);
  const fullName = [r.KPH_First_Name__c, r.KPH_Last_Name__c]
    .filter(Boolean)
    .join(' ')
    .trim();
  return {
    id: r.Id,
    name: accountDetails?.name || r.KPH_Account_Name__c || fullName || r.Name || accountId,
    stakeholderId: r.Stakeholder_EID__c || null,
    profileRecordId: accountId,
    role: r.KPH_Title__c || null,
    otherRole: r.KPH_Other_Title__c || null,
    primaryParent: r[STAKEHOLDER_PRIMARY_PARENT_NAME_FIELD] || null,
  };
};

export const fetchStakeholders = (planId) => {
  resetStakeholderCrmLog();
  const planWhere = buildIdMatchWhere('KPH_Account_Plan__c', planId);
  if (!planWhere) return Promise.resolve([]);
  const where = `${planWhere} AND ${STAKEHOLDER_ACTIVE_WHERE}`;
  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  const stakeholderQuery = {
    object: STAKEHOLDER_OBJECT,
    fields: STAKEHOLDER_FIELDS,
    where,
    sort: ['Name ASC'],
  };
  logStakeholderCrm('[1/2] Stakeholder Map query', {
    soql: stakeholderQueryAsSoql(stakeholderQuery),
    params: stakeholderQuery,
    accountPlanId: planId,
  });
  return query(stakeholderQuery).then((rows) => {
    logStakeholderCrm('[1/2] Stakeholder Map response', {
      count: (rows || []).length,
      rows: rows || [],
    });
    return unwrapRows(rows);
  }).then((unwrappedRows) => {
    const accountIds = unwrappedRows.map((row) => row.KPH_Account__c).filter(Boolean);
    return fetchStakeholderAccountDetails(accountIds, query).then((accountDetailsById) => {
      const mappedRows = unwrappedRows
        .map((row) => toStakeholder(row, accountDetailsById))
        .filter(Boolean);
      logStakeholderCrm(' Final joined rows', {
        rows: mappedRows.map((row) => ({
          stakeholderMapId: row.id,
          stakeholderAccountId: row.profileRecordId,
          stakeholderName: row.name,
          primaryParentField: STAKEHOLDER_PRIMARY_PARENT_NAME_FIELD,
          primaryParentName: row.primaryParent,
        })),
      });

      /*
       * TEMPORARILY DISABLED: previous third Primary Parent Account query.
       * Keep this block for easy re-enabling if CRM data validation shows that
       * KPH_Primary_Parent_Name__c cannot be used directly later.
       *
       * const primaryParentIds = unwrappedRows
       *   .map((row) => stakeholderAccountDetailsFromLookup(
       *     accountDetailsById,
       *     row.KPH_Account__c
       *   )?.primaryParentId)
       *   .filter(Boolean);
       * return fetchAccountNameLookup(
       *   primaryParentIds,
       *   'stakeholderListPrimaryParents',
       *   query
       * ).then((primaryParentNameById) => unwrappedRows
       *   .map((row) => toStakeholder(row, accountDetailsById, primaryParentNameById))
       *   .filter(Boolean));
       */
      return mappedRows;
    });
  });
};

const splitStakeholderName = (name) => {
  const text = String(name || '').trim().replace(/\s+/g, ' ');
  if (!text) return { firstName: null, lastName: null };
  const parts = text.split(' ');
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
};

const stakeholderDisplayFields = (form) => {
  const { firstName, lastName } = splitStakeholderName(form.name);
  return {
    Name: cleanedTextOrNull(form.name),
    KPH_First_Name__c: firstName,
    KPH_Last_Name__c: lastName,
    Stakeholder_EID__c: cleanedTextOrNull(form.stakeholderId),
    KPH_Name_Of_Site2__c: cleanedTextOrNull(form.primaryParent),
  };
};

const buildStakeholderWriteFields = (form) => {
  const role = cleanedTextOrNull(form.role);
  const fields = {
    KPH_Title__c: role,
    KPH_Other_Title__c:
      String(role || '').trim().toLowerCase() === 'other'
        ? cleanedTextOrNull(form.otherRole)
        : null,
  };
  if (form.profileRecordId) fields.KPH_Account__c = form.profileRecordId;

  return fields;
};

const validateStakeholderOtherRole = (fields) => {
  if (
    String(fields.KPH_Title__c || '').trim().toLowerCase() === 'other' &&
    !fields.KPH_Other_Title__c
  ) {
    throw new Error('Other Role is required when Role is Other.');
  }
};

export const updateStakeholder = (id, form) => {
  if (!id) return Promise.reject(new Error('Missing stakeholder id.'));
  const fields = buildStakeholderWriteFields(form || {});
  try {
    validateStakeholderOtherRole(fields);
  } catch (error) {
    return Promise.reject(error);
  }
  if (!cleanedTextOrNull(form?.name) && !fields.KPH_Account__c) {
    return Promise.reject(new Error('Stakeholder name is required.'));
  }
  return updateRecord(STAKEHOLDER_OBJECT, id, fields, { crm: hasVeevaRuntime() }).then(() =>
    toStakeholder({ Id: id, ...stakeholderDisplayFields(form || {}), ...fields })
  );
};

export const deleteStakeholder = (id) => {
  if (!id) return Promise.reject(new Error('Missing stakeholder id.'));
  return softDeleteRecord(STAKEHOLDER_OBJECT, id);
};

export const createStakeholder = (planId, form) => {
  if (!planId) return Promise.reject(new Error('Missing account plan id.'));
  const fields = {
    KPH_Account_Plan__c: planId,
    ...buildStakeholderWriteFields(form || {}),
  };
  try {
    validateStakeholderOtherRole(fields);
  } catch (error) {
    return Promise.reject(error);
  }
  if (!fields.KPH_Account__c) {
    return Promise.reject(new Error('Stakeholder name is required.'));
  }
  const create = hasVeevaRuntime() ? createCrmRecord : createRecord;
  return create(STAKEHOLDER_OBJECT, fields).then((result) => {
    const id = createdRecordIdFromWriteResult(result);
    if (!id) throw new Error('Unable to create stakeholder record.');
    return toStakeholder({ Id: id, ...stakeholderDisplayFields(form || {}), ...fields });
  });
};

// =============================================================================
// Account Profile (full)  ─ KPH_Ecosystem_Plan__c
// =============================================================================
// The MM and DLBCL ATC Medical Profile fields live on the Ecosystem Plan.
// They are intentionally separate mappings even where their UI keys match.

export const ACCOUNT_PROFILE_OBJECT = 'KPH_Ecosystem_Plan__c';
export const REGIONAL_DYNAMICS_DLBCL_FIELD = 'KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c';
export const REGIONAL_DYNAMICS_MM_FIELD = 'KPH_Region_Dynamics_to_be_Aware_of_MM__c';

export const MM_MEDICAL_PROFILE_FIELD_API_NAMES = {
  atcProfileCategory: 'KPH_MM_ATC_Profile_Category__c',
  medicalEducation: 'KPH_MM_Medical_Education__c',
  atcProfile: 'KPH_MM_ATC_Profile__c',
  kiteClinicalTrial: 'KPH_MM_Kite_Clinical_Trial__c',
  competitorTrial: 'KPH_MM_Competitor_Trial__c',
  medicalCollaboration: 'KPH_MM_Medical_Collaboration__c',
  researchCapabilitiesTimelines: 'KPH_MM_Research_Capabilities__c',
  medicalEducationStatus: 'KPH_Medical_Education_Status__c',
};

export const DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES = {
  atcProfileCategory: 'KPH_DLBCL_ATC_Profile_Category__c',
  medicalEducation: 'KPH_DLBCL_Medical_Education__c',
  atcProfile: 'KPH_DLBCL_ATC_Profile__c',
  kiteClinicalTrial: 'KPH_DLBCL_Clinical_Trial__c',
  competitorTrial: 'KPH_DLBCL_Competitor_Trial__c',
  medicalCollaboration: 'KPH_DLBCL_Medical_Collaboration__c',
  researchCapabilitiesTimelines: 'KPH_DLBCL_MM_Research_Capabilities__c',
  medicalEducationStatus: 'KPH_DLBCL_Medical_Education_Status__c',
};

// Each Medical Education value has an independent status field on the
// Ecosystem Plan. These keys are the API values from both education
// multi-select picklists.
export const MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES = {
  'AE Management': 'KPH_ae_management_Status__c',
  'ATC Onboarding': 'KPH_atc_onboarding_Status2__c',
  Outpatient: 'KPH_outpatient_Status3__c',
};

export const DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES = {
  'AE Management': 'KPH_DLBCL_ae_management_Status__c',
  'ATC Onboarding': 'KPH_DLBCL_atc_onboarding2__c',
  Outpatient: 'KPH_DLBCL_outpatient3__c',
};

export const medicalEducationStatusFieldsFor = (profileType) =>
  (profileType === 'dlbcl'
    ? DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES
    : MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES);

export const MEDICAL_EDUCATION_STATUS_KEY_PREFIX = 'medicalEducationStatusFor:';

export const medicalEducationStatusKey = (educationValue) =>
  `${MEDICAL_EDUCATION_STATUS_KEY_PREFIX}${educationValue}`;

export const MEDICAL_PROFILE_FIELD_API_NAMES = Array.from(new Set([
  ...Object.values(MM_MEDICAL_PROFILE_FIELD_API_NAMES),
  ...Object.values(DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES),
  ...Object.values(MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES),
  ...Object.values(DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES),
]));

// Read-only Commercial-reference fields retained for the two Account Profile
// tabs approved for Medical SIT/UAT. These values are queried resiliently and
// are never exposed through a write path in the Medical UI.
export const MM_PROFILE_FIELD_API_NAMES = {
  factAccredited: 'KPH_FACT_Accredited__c',
  '340bAccount': 'KPH_340B_Account__c',
  anitoCelTrialSite: 'KPH_Anito_Cel_Trial_Site__c',
  projectedAnitoCelDemand: 'KPH_Projected_Anito_cel_Demand__c',
  secondLinePatientEstimate: 'KPH_2L_Patient_Estimate__c',
  currentCartUtilizationVolume: 'KPH_Current_CAR_T_Utilization_Volume__c',
  currentBispecificUtilization: 'KPH_Current_Bispecific_Utilization__c',
  fourthLinePatientEstimate: 'KPH_4L_Patient_Estimate__c',
  bispecificUse: 'KPH_Bispecific_Use__c',
  secondLineTreatmentPreference: 'KPH_2L_Treatment_Preference__c',
  fourthLineTreatmentPreference: 'KPH_4L_Treatment_Preference__c',
  perceptionOfAnitoCel: 'KPH_Perception_of_Anito_Cel__c',
  cartProgramStructure: 'KPH_CAR_T_Program_Structure__c',
  outpatientCartCapability: 'KPH_Outpatient_CAR_T_Capability__c',
  receptivityToAnitoCelOp: 'KPH_Receptivity_to_Anito_cel_OP__c',
  operationalCapacityAssessment: 'KPH_Operational_Capacity_Assessment__c',
  payerMix: 'KPH_Payer_Mix__c',
  ptCommittee: 'KPH_P_T_Committee__c',
  ptLead: 'KPH_P_T_Lead__c',
  ptTimingNextReview: 'KPH_P_T_Timing_Next_Review__c',
  ptStatus: 'KPH_P_T_Status__c',
  formularyStatus: 'KPH_Formulary_Status__c',
  accessBarriers: 'KPH_Access_Barriers__c',
  catchmentArea: 'KPH_Catchment_Area_sites_miles__c',
  topReferringSites: 'KPH_Top_Referring_Sites__c',
  internalExternalMix: 'KPH_Internal_External_Mix__c',
  cartTreatersAtAtc: 'KPH_CAR_T_Treaters_at_ATC__c',
  mmAnitoCelClinicalChampion: 'KPH_MM_Anito_cel_Clinical_Champion__c',
  adminChampionRole: 'KPH_Admin_Champion_Role__c',
  mmOpinionLeaders: 'KPH_MM_Opinion_Leaders__c',
};

// Exact enhancement/Aug-R2 mappings for the fields that already exist on the
// read-only DLBCL Comm Profile tab. Keep this list aligned with the current UI;
// it is a mapping boundary, not a source for adding new cards.
export const DLBCL_COMM_PROFILE_FIELD_API_NAMES = {
  atcCohort: 'KPH_ATC_Cohort__c',
  payerMix: 'KPH_Payer_Mix__c',
  payerType: 'KPH_Payer_Type__c',
  topPayersName: 'KPH_Top_3_Payers_Name__c',
  dlbclCapacityImpact: 'KPH_Is_capacity_having_an_impact_on_CART__c',
  dlbclOpBusinessPct: 'KPH_What_of_CART_business_is_done_OP__c',
  dlbclFinancialConstraint: 'KPH_Financial_and_or_reimbursement__c',
  dlbclPreferOpSetting: 'KPH_Does_ATC_prefer_CART_administration__c',
  dlbclOpSettingReasons: 'KPH_If_Yes_to_above_reasons__c',
  dlbclBispecificTiming: 'KPH_Bispecifics_for_DLBCL_being_used__c',
  dlbclBispecificImpact: 'KPH_Bispecific_use_in_DLBCL_impact_CART__c',
  dlbclOpUseDetails: 'KPH_If_ATC_is_using_OP_do_they__c',
  dlbclBreyanziCompetition: 'KPH_Is_there_direct_competition_from__c',
  dlbclBreyanziIndication: 'KPH_If_yes_in_what_indication__c',
};

export const COMMERCIAL_ACCOUNT_PROFILE_FIELDS = Array.from(new Set([
  'Id',
  'KPH_Account_Plan__c',
  ...Object.values(DLBCL_COMM_PROFILE_FIELD_API_NAMES),
  ...Object.values(MM_PROFILE_FIELD_API_NAMES),
]));

export const ACCOUNT_PROFILE_FIELDS = Array.from(new Set([
  ...COMMERCIAL_ACCOUNT_PROFILE_FIELDS,
  REGIONAL_DYNAMICS_DLBCL_FIELD,
  REGIONAL_DYNAMICS_MM_FIELD,
]));

// Some medical-only fields are not visible to every CRM profile (notably
// KPH-CTAM on iPad). Query the two fields needed to identify the record first,
// then load the remaining fields resiliently so one inaccessible optional
// field cannot prevent the whole Account Profile page from rendering.
export const ACCOUNT_PROFILE_BASE_FIELDS = ['Id', 'KPH_Account_Plan__c'];
export const ACCOUNT_PROFILE_OPTIONAL_FIELDS = ACCOUNT_PROFILE_FIELDS.filter(
  (field) => !ACCOUNT_PROFILE_BASE_FIELDS.includes(field)
);
export const COMMERCIAL_ACCOUNT_PROFILE_OPTIONAL_FIELDS =
  COMMERCIAL_ACCOUNT_PROFILE_FIELDS.filter(
    (field) => !ACCOUNT_PROFILE_BASE_FIELDS.includes(field)
  );

const firstFilledWithField = (record, fields) => {
  for (const field of fields) {
    const value = record[field];
    if (value !== null && value !== undefined && value !== '') {
      return { value, field };
    }
  }
  return { value: null, field: null };
};

// Pull the display name out of a relationship object the runtime might give
// us as either `Account_vod__r.Name` (a dotted string key) or `Account_vod__r`
// (a nested object with a `Name` property). Offline mode strips relationship
// fields entirely → the caller falls back to the ID.
const fieldValue = (value) =>
  value && typeof value === 'object' && 'value' in value ? value.value : value;

const relationshipName = (record, relationshipApi) => {
  const dotted = fieldValue(record[`${relationshipApi}.Name`]);
  if (dotted) return dotted;
  const nested = record[relationshipApi];
  const nestedName = nested && typeof nested === 'object' ? fieldValue(nested.Name) : null;
  if (nestedName) return nestedName;
  return null;
};

export const toAccountProfile = (row) => {
  const r = unwrap(row);
  if (!r) return null;
  const mmProfile = Object.fromEntries(
    Object.entries(MM_PROFILE_FIELD_API_NAMES).map(([key, field]) => [key, r[field]])
  );
  const medicalProfileEntries = (fieldApiNames, statusFieldApiNames) => Object.fromEntries([
    ...Object.entries(fieldApiNames).map(([key, field]) => [key, r[field]]),
    ...Object.entries(statusFieldApiNames).map(([educationValue, field]) => [
      medicalEducationStatusKey(educationValue),
      r[field],
    ]),
  ]);
  const mmMedicalProfile = medicalProfileEntries(
    MM_MEDICAL_PROFILE_FIELD_API_NAMES,
    MM_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES
  );
  const dlbclMedicalProfile = medicalProfileEntries(
    DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES,
    DLBCL_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES
  );
  const dlbclCommercialProfile = Object.fromEntries(
    Object.entries(DLBCL_COMM_PROFILE_FIELD_API_NAMES).map(([key, field]) => [key, r[field]])
  );
  const dlbclDynamics = firstFilledWithField(r, [
    REGIONAL_DYNAMICS_DLBCL_FIELD,
  ]);
  const mmDynamics = firstFilledWithField(r, [
    REGIONAL_DYNAMICS_MM_FIELD,
  ]);
  return {
    id: r.Id,
    accountPlanId: r.KPH_Account_Plan__c,
    ...dlbclCommercialProfile,
    mmProfile,
    mmMedicalProfile,
    dlbclMedicalProfile,
    regionDynamicsDlbcl: dlbclDynamics.value,
    regionDynamicsDlbclField: dlbclDynamics.field || REGIONAL_DYNAMICS_DLBCL_FIELD,
    regionDynamicsMm: mmDynamics.value,
    regionDynamicsMmField: mmDynamics.field || REGIONAL_DYNAMICS_MM_FIELD,
  };
};

const accountProfileQueryAsSoql = ({ object, fields, where, sort, limit }) => [
  `SELECT ${fields.join(', ')} FROM ${object}`,
  where ? `WHERE ${where}` : '',
  Array.isArray(sort) && sort.length ? `ORDER BY ${sort.join(', ')}` : '',
  limit ? `LIMIT ${limit}` : '',
].filter(Boolean).join(' ');

const recordCommercialProfileQueryDiagnostic = (phase, label, params, detail = {}) => {
  if (typeof window === 'undefined') return;
  if (!Array.isArray(window.__KPH_COMMERCIAL_PROFILE_QUERY_LOGS__)) {
    window.__KPH_COMMERCIAL_PROFILE_QUERY_LOGS__ = [];
  }
  const entry = {
    timestamp: new Date().toISOString(),
    phase,
    label,
    soql: accountProfileQueryAsSoql(params),
    params,
    ...detail,
  };
  window.__KPH_COMMERCIAL_PROFILE_QUERY_LOGS__.push(entry);
  console.info(`[KPH Commercial Profiles] ${phase}: ${label}`, entry);
};

const executeAccountProfileQuery = async (query, params, diagnosticLabel = null) => {
  if (diagnosticLabel) {
    recordCommercialProfileQueryDiagnostic('request', diagnosticLabel, params);
  }
  try {
    const rows = await query(params);
    if (diagnosticLabel) {
      recordCommercialProfileQueryDiagnostic('response', diagnosticLabel, params, {
        count: rows.length,
        rows,
      });
    }
    return rows;
  } catch (error) {
    if (diagnosticLabel) {
      recordCommercialProfileQueryDiagnostic('error', diagnosticLabel, params, {
        message: error?.message || String(error),
      });
    }
    throw error;
  }
};

const fetchAccessibleAccountProfileFields = async (
  where,
  fields,
  query = runQuery,
  diagnosticLabel = null
) => {
  if (!fields.length) return {};

  try {
    const rows = await executeAccountProfileQuery(query, {
      object: ACCOUNT_PROFILE_OBJECT,
      fields: ['Id', ...fields],
      where,
      sort: ['LastModifiedDate DESC'],
      limit: 1,
    }, diagnosticLabel ? `${diagnosticLabel} (${fields.length} fields)` : null);
    return unwrap(rows[0]) || {};
  } catch (error) {
    if (!isInaccessibleFieldQueryError(error)) throw error;
    if (fields.length === 1) return {};

    const midpoint = Math.ceil(fields.length / 2);
    const [left, right] = await Promise.all([
      fetchAccessibleAccountProfileFields(
        where,
        fields.slice(0, midpoint),
        query,
        diagnosticLabel
      ),
      fetchAccessibleAccountProfileFields(
        where,
        fields.slice(midpoint),
        query,
        diagnosticLabel
      ),
    ]);
    return { ...left, ...right };
  }
};

export const fetchAccountProfile = async (planId) => {
  const where = buildIdMatchWhere('KPH_Account_Plan__c', planId);
  if (!where) return null;

  const rows = await runQuery({
    object: ACCOUNT_PROFILE_OBJECT,
    fields: ACCOUNT_PROFILE_BASE_FIELDS,
    where,
    sort: ['LastModifiedDate DESC'],
    limit: 1,
  });
  const baseRecord = unwrap(rows[0]);
  if (!baseRecord) return null;

  const optionalRecord = await fetchAccessibleAccountProfileFields(
    where,
    ACCOUNT_PROFILE_OPTIONAL_FIELDS
  );
  return toAccountProfile({ ...baseRecord, ...optionalRecord });
};

// These two editable Medical tabs must never use the local/training adapter.
// In Veeva they read the latest matching Ecosystem Plan directly from CRM;
// outside Veeva they stay empty instead of substituting fixture data.
export const fetchMedicalAccountProfile = async (planId, { allowMockPreview = false } = {}) => {
  const useCrm = hasVeevaRuntime();
  if (!useCrm && !allowMockPreview) return null;
  const where = buildIdMatchWhere('KPH_Account_Plan__c', planId);
  if (!where) return null;

  const query = useCrm ? runCrmQuery : runQuery;
  const rows = await query({
    object: ACCOUNT_PROFILE_OBJECT,
    fields: ACCOUNT_PROFILE_BASE_FIELDS,
    where,
    sort: ['LastModifiedDate DESC'],
    limit: 1,
  });
  const baseRecord = unwrap(rows[0]);
  if (!baseRecord) return null;

  const medicalRecord = await fetchAccessibleAccountProfileFields(
    where,
    MEDICAL_PROFILE_FIELD_API_NAMES,
    query
  );
  return toAccountProfile({ ...baseRecord, ...medicalRecord });
};

// Referral & Dynamics resolves its Ecosystem Plan from live CRM while hosted
// by Veeva. The narrow field list isolates this tab from unrelated optional
// commercial-profile fields that some CRM profiles cannot access.
export const fetchReferralDynamicsAccountProfile = async (planId) => {
  // Ecosystem Plans have no KPH_Is_Deleted__c field; scope by plan only.
  const where = buildIdMatchWhere('KPH_Account_Plan__c', planId);
  if (!where) return null;

  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  const rows = await query({
    object: ACCOUNT_PROFILE_OBJECT,
    fields: [
      ...ACCOUNT_PROFILE_BASE_FIELDS,
      REGIONAL_DYNAMICS_DLBCL_FIELD,
      REGIONAL_DYNAMICS_MM_FIELD,
    ],
    where,
    sort: ['LastModifiedDate DESC'],
    limit: 1,
  });
  return toAccountProfile(rows[0]);
};

// The training bundle is mock-backed by default. These two read-only
// Commercial profile tabs are the deliberate exception: when hosted by Veeva,
// query their existing KPH_Ecosystem_Plan__c fields through the live CRM read
// bridge. Local development retains the mock fallback for previewing.
export const fetchCommercialAccountProfile = async (planId) => {
  // Ecosystem Plans have no KPH_Is_Deleted__c field; scope by plan only.
  const where = buildIdMatchWhere('KPH_Account_Plan__c', planId);
  if (!where) return null;

  const useCrm = hasVeevaRuntime();
  const query = useCrm ? runCrmQuery : runQuery;
  const diagnosticLabel = useCrm ? 'KPH_Ecosystem_Plan__c Commercial profile' : null;
  if (useCrm && typeof window !== 'undefined') {
    window.__KPH_COMMERCIAL_PROFILE_QUERY_LOGS__ = [];
  }

  const baseParams = {
    object: ACCOUNT_PROFILE_OBJECT,
    fields: ACCOUNT_PROFILE_BASE_FIELDS,
    where,
    sort: ['LastModifiedDate DESC'],
    limit: 1,
  };
  const rows = await executeAccountProfileQuery(query, baseParams, diagnosticLabel);
  const baseRecord = unwrap(rows[0]);
  if (!baseRecord) return null;

  const optionalRecord = await fetchAccessibleAccountProfileFields(
    where,
    COMMERCIAL_ACCOUNT_PROFILE_OPTIONAL_FIELDS,
    query,
    diagnosticLabel
  );
  return toAccountProfile({ ...baseRecord, ...optionalRecord });
};

export const updateMedicalAccountProfileField = (profileId, field, value) => {
  if (!hasVeevaRuntime()) {
    return Promise.reject(new Error('Medical profile updates require a live Veeva CRM session.'));
  }
  if (!MEDICAL_PROFILE_FIELD_API_NAMES.includes(field)) {
    return Promise.reject(new Error('Unsupported Medical profile field.'));
  }
  if (!profileId) {
    return Promise.reject(new Error(
      'No Ecosystem Plan record was found for this Account Plan. Refresh the page or contact your CRM administrator.'
    ));
  }
  return updateRecord(ACCOUNT_PROFILE_OBJECT, profileId, {
    [field]: value === '' ? null : value,
  }, { crm: true });
};

// =============================================================================
// Referral Accounts  ─ KPH_Ecosystem_Map_Dynamics__c
// =============================================================================
// Plan-scoped child of Account_Plan_vod__c. Each row represents one referral
// site mapped to this account plan — name, classification, # HCP targets,
// referral-priority flag, indication, type (ATC/Satellite), comments. The Site
// Name chooser searches Account and persists that Account's id in the
// KPH_Name_of_Site__c lookup. Account.Name is resolved in a second CRM query.

export const REFERRAL_ACCOUNT_OBJECT = 'KPH_Ecosystem_Map_Dynamics__c';
export const REFERRAL_ACCOUNT_PROFILE_FIELD = 'KPH_Account_Profile__c';

export const REFERRAL_ACCOUNT_FIELDS = [
  'Id',
  'Name',
  'Account_Plan_vod__c',
  REFERRAL_ACCOUNT_PROFILE_FIELD,
  'Indication__c',
  'KPH_HCO_Classification__c',
  'KPH_of_HCP_Targets_within_a_Site__c',
  'KPH_Referral_Count__c',
  'KPH_Referral_Priority__c',
  'KPH_X2L_DLBCL_Treated_Patients__c',
  'KPH_Comments__c',
  'KPH_Name_of_Site__c',
  'KPH_Is_Deleted__c',
];

const addAccountNameLookup = (lookup, id, name) => {
  if (!lookup || !id || !name) return;
  const rawId = String(id);
  lookup.set(rawId, name);
  const canonicalId = toCanonicalSalesforceId(rawId);
  if (canonicalId) {
    lookup.set(canonicalId, name);
    lookup.set(canonicalId.slice(0, 15), name);
  }
};

const accountNameFromLookup = (lookup, id) => {
  if (!lookup || !id) return null;
  const rawId = String(id);
  const canonicalId = toCanonicalSalesforceId(rawId);
  return (
    lookup.get(rawId) ||
    (canonicalId && (lookup.get(canonicalId) || lookup.get(canonicalId.slice(0, 15)))) ||
    null
  );
};

const unwrapRows = (rows) => (rows || []).map(unwrap).filter(Boolean);

const fetchAccountNameLookup = (
  accountIds,
  context = 'accountNameLookup',
  query = runQuery
) => {
  const ids = Array.from(new Set((accountIds || []).filter(Boolean)));
  const where = buildAnyIdMatchWhere('Id', ids);
  const logPrimaryParents = context === 'stakeholderListPrimaryParents';
  if (!where) {
    if (logPrimaryParents) {
      logStakeholderCrm('[3/3] Primary Parent Account query', {
        primaryParentIds: ids,
        skipped: true,
        reason: 'No Primary_Parent_vod__c IDs were returned by the stakeholder Account query.',
      });
      logStakeholderCrm('[3/3] Primary Parent Account response', { count: 0, rows: [] });
    }
    return Promise.resolve(new Map());
  }

  const params = {
    object: 'Account',
    fields: ['Id', 'Name'],
    where,
  };
  if (logPrimaryParents) {
    logStakeholderCrm('[3/3] Primary Parent Account query', {
      primaryParentIds: ids,
      soql: stakeholderQueryAsSoql(params),
      params,
    });
  }
  return query(params)
    .then((rows) => {
      if (logPrimaryParents) {
        logStakeholderCrm('[3/3] Primary Parent Account response', {
          count: (rows || []).length,
          rows: rows || [],
        });
      }
      const lookup = new Map();
      for (const row of rows || []) {
        const r = unwrap(row);
        if (!r) continue;
        addAccountNameLookup(lookup, r.Id, r.Name);
      }
      return lookup;
    })
    .catch((error) => {
      if (logPrimaryParents) {
        logStakeholderCrm('[3/3] Primary Parent Account response', {
          count: 0,
          rows: [],
          error: stringifyError(error),
        });
      }
      console.warn(`[${context}] account lookup failed`, error);
      return new Map();
    });
};

const addStakeholderAccountDetails = (lookup, row) => {
  if (!lookup || !row?.Id) return;
  const details = {
    name: row.Name || null,
  };
  const rawId = String(row.Id);
  lookup.set(rawId, details);
  const canonicalId = toCanonicalSalesforceId(rawId);
  if (canonicalId) {
    lookup.set(canonicalId, details);
    lookup.set(canonicalId.slice(0, 15), details);
  }
};

const stakeholderAccountDetailsFromLookup = (lookup, id) => {
  if (!lookup || !id) return null;
  const rawId = String(id);
  const canonicalId = toCanonicalSalesforceId(rawId);
  return (
    lookup.get(rawId) ||
    (canonicalId && (lookup.get(canonicalId) || lookup.get(canonicalId.slice(0, 15)))) ||
    null
  );
};

const fetchStakeholderAccountDetails = (accountIds, query = runQuery) => {
  const ids = Array.from(new Set((accountIds || []).filter(Boolean)));
  const idWhere = buildAnyIdMatchWhere('Id', ids);
  if (!idWhere) {
    logStakeholderCrm('[2/2] Stakeholder Account query', {
      accountIds: ids,
      skipped: true,
      reason: 'No KPH_Account__c IDs were returned by the Stakeholder Map query.',
    });
    logStakeholderCrm('[2/2] Stakeholder Account response', { count: 0, rows: [] });
    return Promise.resolve(new Map());
  }

  const params = {
    object: 'Account',
    fields: ['Id', 'Name'],
    where: idWhere,
  };
  logStakeholderCrm('[2/2] Stakeholder Account query', {
    accountIds: ids,
    soql: stakeholderQueryAsSoql(params),
    params,
  });
  return query(params)
    .then((rows) => {
      logStakeholderCrm('[2/2] Stakeholder Account response', {
        count: (rows || []).length,
        rows: rows || [],
      });
      const lookup = new Map();
      for (const row of rows || []) {
        const r = unwrap(row);
        if (!r) continue;
        addStakeholderAccountDetails(lookup, r);
      }
      return lookup;
    })
    .catch((error) => {
      logStakeholderCrm('[2/2] Stakeholder Account response', {
        count: 0,
        rows: [],
        error: stringifyError(error),
      });
      console.warn('[stakeholderAccounts] account lookup failed', error);
      return new Map();
    });
};

export const toReferralAccount = (row, siteNameById = null) => {
  const r = unwrap(row);
  if (!r) return null;
  const siteId = r.KPH_Name_of_Site__c || null;
  return {
    id: r.Id,
    name: accountNameFromLookup(siteNameById, siteId) || r.Name || siteId,
    accountPlanId: r.Account_Plan_vod__c,
    accountProfileId: r[REFERRAL_ACCOUNT_PROFILE_FIELD] || null,
    siteId,
    hcoClassification: r.KPH_HCO_Classification__c || null,
    hcpTargetCount: r.KPH_of_HCP_Targets_within_a_Site__c || 0,
    referralCount: r.KPH_Referral_Count__c || 0,
    referralPriority: toBooleanFlag(r.KPH_Referral_Priority__c),
    treatedPatients: r.KPH_X2L_DLBCL_Treated_Patients__c || 0,
    indication: r.Indication__c || null,
    comments: r.KPH_Comments__c || '',
  };
};

export const fetchReferralAccounts = (planId, accountProfileId) => {
  const planWhere = buildIdMatchWhere('Account_Plan_vod__c', planId);
  const profileWhere = buildIdMatchWhere(REFERRAL_ACCOUNT_PROFILE_FIELD, accountProfileId);
  if (!planWhere || !profileWhere) return Promise.resolve([]);
  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  return fetchReferralAccountRows(planWhere, profileWhere, query)
    .then((unwrappedRows) => {
      const siteIds = unwrappedRows.map((row) => row.KPH_Name_of_Site__c).filter(Boolean);
      return fetchAccountNameLookup(siteIds, 'referralSites', query).then((siteNameById) =>
        unwrappedRows.map((row) => toReferralAccount(row, siteNameById)).filter(Boolean)
      );
    });
};

const fetchReferralAccountRows = (planWhere, profileWhere, query = runQuery) =>
  query({
    object: REFERRAL_ACCOUNT_OBJECT,
    fields: REFERRAL_ACCOUNT_FIELDS,
    where: `${planWhere} AND ${profileWhere} AND ${SOFT_DELETE_ACTIVE_WHERE}`,
    sort: ['Name ASC'],
  }).then(unwrapRows);

const fetchHealthcareNetworkRows = (profileWhere, query = runQuery) =>
  query({
    object: HEALTHCARE_NETWORK_OBJECT,
    fields: HEALTHCARE_NETWORK_FIELDS,
    where: `${profileWhere} AND ${SOFT_DELETE_ACTIVE_WHERE}`,
    sort: ['Name ASC'],
  }).then(
    unwrapRows,
    (error) => {
      // The object is marked `optional: true` in the legacy entity spec —
      // if the org doesn't expose it, swallow the failure and return [].
      console.warn('[healthcareNetwork] fetch failed; treating as empty', error);
      return [];
    }
  );

export const fetchAccountProfileChildRecords = (planId, accountProfileId) => {
  const planWhere = buildIdMatchWhere('Account_Plan_vod__c', planId);
  const profileWhere = buildIdMatchWhere(REFERRAL_ACCOUNT_PROFILE_FIELD, accountProfileId);
  if (!planWhere || !profileWhere) {
    return Promise.resolve({
      referralAccounts: [],
      healthcareNetworks: [],
    });
  }

  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  return Promise.all([
    fetchReferralAccountRows(planWhere, profileWhere, query),
    fetchHealthcareNetworkRows(profileWhere, query),
  ])
    .then(([referralRows, healthcareRows]) => {
      const accountIds = [
        ...referralRows.map((row) => row.KPH_Name_of_Site__c),
        ...healthcareRows.map((row) => row.KPH_Account_Name__c),
      ].filter(Boolean);
      return fetchAccountNameLookup(accountIds, 'accountProfileChildren', query).then((accountNameById) => ({
        referralAccounts: referralRows.map((row) => toReferralAccount(row, accountNameById)).filter(Boolean),
        healthcareNetworks: healthcareRows.map((row) => toHealthcareNetwork(row, accountNameById)).filter(Boolean),
      }));
    });
};

const buildReferralAccountWriteFields = (form) => {
  const fields = {
    Indication__c: form.indication || null,
    KPH_Comments__c: form.comments || null,
    KPH_Name_of_Site__c: form.siteId || null,
  };
  if (Object.hasOwn(form, 'hcpTargetCount')) {
    fields.KPH_of_HCP_Targets_within_a_Site__c =
      form.hcpTargetCount === '' || form.hcpTargetCount === null || form.hcpTargetCount === undefined
        ? null
        : Number(form.hcpTargetCount);
  }
  if (Object.hasOwn(form, 'referralPriority')) {
    fields.KPH_Referral_Priority__c = toBooleanFlag(form.referralPriority);
  }
  return fields;
};

export const updateReferralAccount = (id, form) => {
  if (!id) return Promise.reject(new Error('Missing referral account id.'));
  if (!String(form?.siteId || '').trim()) {
    return Promise.reject(new Error('Select a Site Name from the Account list.'));
  }
  return updateRecord(REFERRAL_ACCOUNT_OBJECT, id, buildReferralAccountWriteFields(form), {
    crm: hasVeevaRuntime(),
  });
};

export const deleteReferralAccount = (id) => {
  if (!id) return Promise.reject(new Error('Missing referral account id.'));
  return softDeleteRecord(REFERRAL_ACCOUNT_OBJECT, id, {}, { crm: hasVeevaRuntime() });
};

export const createReferralAccount = (planId, accountProfileId, form) => {
  if (!planId) return Promise.reject(new Error('Missing account plan id.'));
  if (!accountProfileId) return Promise.reject(new Error('Missing account profile id.'));
  if (!String(form?.siteId || '').trim()) {
    return Promise.reject(new Error('Select a Site Name from the Account list.'));
  }
  const writer = hasVeevaRuntime() ? createCrmRecord : createRecord;
  return writer(REFERRAL_ACCOUNT_OBJECT, {
    Account_Plan_vod__c: planId,
    [REFERRAL_ACCOUNT_PROFILE_FIELD]: accountProfileId,
    ...buildReferralAccountWriteFields(form),
  });
};

// =============================================================================
// Healthcare Networks  ─ KPH_Other_Healthcare_Networks__c
// =============================================================================
// Optional child object. Links a healthcare network Account to a
// Kite-accountable owner and is scoped to the current Ecosystem Plan via
// KPH_Account_Profile__c.

export const HEALTHCARE_NETWORK_OBJECT = 'KPH_Other_Healthcare_Networks__c';
export const HEALTHCARE_NETWORK_ACCOUNT_PROFILE_FIELD = 'KPH_Account_Profile__c';

export const HEALTHCARE_NETWORK_FIELDS = [
  'Id',
  'Name',
  'KPH_Account_Name__c',
  HEALTHCARE_NETWORK_ACCOUNT_PROFILE_FIELD,
  'KPH_Kite_Accountable__c',
  'KPH_Is_Deleted__c',
];

export const toHealthcareNetwork = (row, accountNameById = null) => {
  const r = unwrap(row);
  if (!r) return null;
  const accountId = r.KPH_Account_Name__c || null;
  return {
    id: r.Id,
    accountId,
    accountProfileId: r[HEALTHCARE_NETWORK_ACCOUNT_PROFILE_FIELD] || null,
    accountName: accountNameFromLookup(accountNameById, accountId) || r.Name || accountId,
    kiteAccountable: r.KPH_Kite_Accountable__c || null,
  };
};

export const fetchHealthcareNetworks = (accountProfileId) => {
  const profileWhere = buildIdMatchWhere(HEALTHCARE_NETWORK_ACCOUNT_PROFILE_FIELD, accountProfileId);
  if (!profileWhere) return Promise.resolve([]);
  const query = hasVeevaRuntime() ? runCrmQuery : runQuery;
  return fetchHealthcareNetworkRows(profileWhere, query)
    .then((unwrappedRows) => {
      const accountIds = unwrappedRows.map((row) => row.KPH_Account_Name__c).filter(Boolean);
      return fetchAccountNameLookup(accountIds, 'healthcareNetwork', query).then((accountNameById) =>
        unwrappedRows.map((row) => toHealthcareNetwork(row, accountNameById)).filter(Boolean)
      );
    });
};
