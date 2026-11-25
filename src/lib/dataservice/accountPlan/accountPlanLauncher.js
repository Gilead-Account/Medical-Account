import {
  inClause,
  runCrmQuery,
  unwrap,
} from '@/lib/dataservice/query';

const ACCOUNT_PLAN_OBJECT = 'Account_Plan_vod__c';
const USER_OBJECT = 'User';
const ACCOUNT_OBJECT = 'Account';
const ACCOUNT_PROFILE_OBJECT = 'KPH_Ecosystem_Plan__c';
const ACCOUNT_PLAN_LAUNCHER_WHERE =
  "Account_vod__r.Hospital_Type__c = 'Authorized Treatment Center' AND Account_vod__r.Customer_Master_Status_vod__c = 'Valid_vod'";
const ACCOUNT_MM_ATC_PRIORITY_FIELD = 'KPH_MM_ATC_Priority__c';
const ACCOUNT_MARKET_ACCESS_PRIORITIZED_FIELD = 'KPH_Market_Access_Prioritized_Account__c';
const ACCOUNT_PROFILE_ATC_COHORT_FIELD = 'KPH_ATC_Cohort__c';
const LAST_FD_REVIEW_DATE_FIELD = 'KPH_Last_FD_Review_date__c';

// Account Plan fields are queried directly. Owner details come from User via
// OwnerId, and Account priority fields come from Account via Account_vod__c.
// Account eligibility is enforced through relationship fields in the WHERE clause.
export const ACCOUNT_PLAN_LAUNCHER_FIELDS = [
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
];

const USER_FIELDS = ['Id', 'Name', 'FirstName', 'LastName'];
const ACCOUNT_PRIORITY_FIELDS = [
  'Id',
  ACCOUNT_MM_ATC_PRIORITY_FIELD,
  ACCOUNT_MARKET_ACCESS_PRIORITIZED_FIELD,
];
const ACCOUNT_PROFILE_COHORT_FIELDS = [
  'Id',
  'KPH_Account_Plan__c',
  ACCOUNT_PROFILE_ATC_COHORT_FIELD,
  'LastModifiedDate',
];

const uniqueValues = (values) =>
  Array.from(new Set((values || []).map((value) => String(value || '').trim()).filter(Boolean)));

const displayString = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};
const EMPTY_DISPLAY_VALUE = '-';

const mergeRowsById = (baseRows, supplementalRows) => {
  const supplementalById = new Map(
    (supplementalRows || [])
      .map(unwrap)
      .filter((row) => row?.Id)
      .map((row) => [String(row.Id), row])
  );
  const merged = (baseRows || []).map((row) => {
    const base = unwrap(row);
    if (!base?.Id) return base;
    return { ...base, ...(supplementalById.get(String(base.Id)) || {}) };
  });
  const baseIds = new Set(merged.map((row) => row?.Id && String(row.Id)).filter(Boolean));
  for (const row of supplementalById.values()) {
    if (!baseIds.has(String(row.Id))) merged.push(row);
  }
  return merged;
};

// A single inaccessible optional field makes Veeva reject the entire query.
// Split optional launcher fields until every field the profile can read is
// recovered; unavailable Medical APIs then display as "-" instead of hiding
// every otherwise-visible Account Plan.
const fetchAccessibleFieldsById = async (object, ids, fields) => {
  const recordIds = uniqueValues(ids);
  const optionalFields = uniqueValues(fields);
  if (!recordIds.length || !optionalFields.length) return [];
  try {
    return await runCrmQuery({
      object,
      fields: ['Id', ...optionalFields],
      where: `Id IN ${inClause(recordIds)}`,
      limit: Math.max(recordIds.length, 1),
      ...(optionalFields.some((field) => field.includes('.')) ? { allowDottedFields: true } : {}),
    });
  } catch (error) {
    if (optionalFields.length === 1) {
      console.warn(`[accountPlanLauncher] skipping inaccessible ${object}.${optionalFields[0]}`, error);
      return [];
    }
    const midpoint = Math.ceil(optionalFields.length / 2);
    const [left, right] = await Promise.all([
      fetchAccessibleFieldsById(object, recordIds, optionalFields.slice(0, midpoint)),
      fetchAccessibleFieldsById(object, recordIds, optionalFields.slice(midpoint)),
    ]);
    return mergeRowsById(left, right);
  }
};

const fetchUserNamesById = async (userIds) => {
  const ids = uniqueValues(userIds);
  if (!ids.length) return new Map();
  const rows = await runCrmQuery({
    object: USER_OBJECT,
    fields: USER_FIELDS,
    where: `Id IN ${inClause(ids)}`,
    limit: ids.length,
  });
  return new Map(rows.map(unwrap).filter((row) => row?.Id).map((row) => [
    String(row.Id),
    {
      name: displayString(row.Name),
      firstName: displayString(row.FirstName),
      lastName: displayString(row.LastName),
    },
  ]));
};

const fetchAccountPriorityById = async (accountIds) => {
  const ids = uniqueValues(accountIds);
  if (!ids.length) return new Map();
  try {
    const rows = await runCrmQuery({
      object: ACCOUNT_OBJECT,
      fields: ACCOUNT_PRIORITY_FIELDS,
      where: `Id IN ${inClause(ids)}`,
      limit: ids.length,
    });
    return new Map(rows.map(unwrap).filter((row) => row?.Id).map((row) => [
      String(row.Id),
      {
        mmAtcPriorityAccount: displayString(row[ACCOUNT_MM_ATC_PRIORITY_FIELD]),
        marketAccessPrioritizedAccount: displayString(row[ACCOUNT_MARKET_ACCESS_PRIORITIZED_FIELD]),
      },
    ]));
  } catch (error) {
    console.warn('[accountPlanLauncher] account priority query failed; continuing without priority fields.', error);
    return new Map();
  }
};

const fetchAtcCohortByPlanId = async (planIds) => {
  const ids = uniqueValues(planIds);
  if (!ids.length) return new Map();
  const rows = await runCrmQuery({
    object: ACCOUNT_PROFILE_OBJECT,
    fields: ACCOUNT_PROFILE_COHORT_FIELDS,
    where: `KPH_Account_Plan__c IN ${inClause(ids)}`,
    sort: ['LastModifiedDate DESC'],
    limit: ids.length * 5,
  });
  const cohortsByPlanId = new Map();
  rows
    .map(unwrap)
    .filter(Boolean)
    .sort((left, right) =>
      String(right.LastModifiedDate || '').localeCompare(String(left.LastModifiedDate || ''))
    )
    .forEach((row) => {
      const planId = displayString(row.KPH_Account_Plan__c);
      if (!planId || cohortsByPlanId.has(planId)) return;
      cohortsByPlanId.set(planId, displayString(row[ACCOUNT_PROFILE_ATC_COHORT_FIELD]));
    });
  return cohortsByPlanId;
};

const toAccountPlanLauncherRow = (
  row,
  userNamesById = new Map(),
  accountPriorityById = new Map(),
  atcCohortByPlanId = new Map()
) => {
  const r = unwrap(row);
  if (!r?.Id) return null;
  const ownerUser = userNamesById.get(String(r.OwnerId || '')) || {};
  const accountPriority = accountPriorityById.get(String(r.Account_vod__c || '')) || {};
  return {
    id: r.Id,
    name: displayString(r.Name) || 'Unnamed Account Plan',
    eid: displayString(r.KPH_ATC_EID__c) || EMPTY_DISPLAY_VALUE,
    ownerName: ownerUser.name || EMPTY_DISPLAY_VALUE,
    ownerFirstName: ownerUser.firstName || EMPTY_DISPLAY_VALUE,
    ownerLastName: ownerUser.lastName || EMPTY_DISPLAY_VALUE,
    marketAccessPrioritizedAccount: accountPriority.marketAccessPrioritizedAccount || EMPTY_DISPLAY_VALUE,
    mmAtcPriorityAccount: accountPriority.mmAtcPriorityAccount || EMPTY_DISPLAY_VALUE,
    atcCohortDlbcl: atcCohortByPlanId.get(String(r.Id)) || EMPTY_DISPLAY_VALUE,
    atcCertifiedDate: r.KPH_ATC_Certified_Date__c || null,
    planStatus: displayString(r.KPH_Plan_status__c) || EMPTY_DISPLAY_VALUE,
    territory: displayString(r.KPH_Territory__c) || EMPTY_DISPLAY_VALUE,
    territoryDescription: displayString(r.KPH_Territory_Description__c) || EMPTY_DISPLAY_VALUE,
    lastFieldDirectorReviewDate: r[LAST_FD_REVIEW_DATE_FIELD] || null,
    submittedDate: r.KPH_Medical_Submitted_Date__c || null,
  };
};

const sortLauncherRows = (rows) =>
  [...(rows || [])].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));

const ACCOUNT_PLAN_LAUNCHER_BASE_FIELDS = ['Id', 'Name', 'Account_vod__c'];
const ACCOUNT_PLAN_LAUNCHER_OPTIONAL_FIELDS = ACCOUNT_PLAN_LAUNCHER_FIELDS.filter(
  (field) => !ACCOUNT_PLAN_LAUNCHER_BASE_FIELDS.includes(field)
);

// Match the Commercial selector: only plans linked to valid Authorized
// Treatment Centers, within the records visible through Salesforce sharing.
const fetchLauncherAccountPlans = async () =>
  runCrmQuery({
    object: ACCOUNT_PLAN_OBJECT,
    fields: ACCOUNT_PLAN_LAUNCHER_BASE_FIELDS,
    where: ACCOUNT_PLAN_LAUNCHER_WHERE,
    sort: ['Name ASC'],
  }).then(async (baseRows) => {
    const ids = baseRows.map((row) => unwrap(row)?.Id).filter(Boolean);
    const optionalRows = await fetchAccessibleFieldsById(
      ACCOUNT_PLAN_OBJECT,
      ids,
      ACCOUNT_PLAN_LAUNCHER_OPTIONAL_FIELDS
    );
    return mergeRowsById(baseRows, optionalRows);
  });

export const fetchCurrentUserAccountPlans = async () => {
  const rows = await fetchLauncherAccountPlans();
  const [userNamesById, accountPriorityById, atcCohortByPlanId] = await Promise.all([
    fetchUserNamesById(rows.flatMap((row) => {
      const r = unwrap(row);
      return [r?.OwnerId];
    })),
    fetchAccountPriorityById(rows.flatMap((row) => {
      const r = unwrap(row);
      return [r?.Account_vod__c];
    })),
    fetchAtcCohortByPlanId(rows.flatMap((row) => {
      const r = unwrap(row);
      return [r?.Id];
    })),
  ]);

  return sortLauncherRows(
    rows
      .map((row) => toAccountPlanLauncherRow(row, userNamesById, accountPriorityById, atcCohortByPlanId))
      .filter(Boolean)
  );
};
