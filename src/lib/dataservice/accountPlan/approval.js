import {
  buildIdMatchWhere,
  getCrmDataForCurrentObject,
  inClause,
  runCrmQuery,
  runQuery,
  salesforceIdVariants,
  toCanonicalSalesforceId,
  unwrap,
  updateRecord,
} from '@/lib/dataservice/query';
import {
  APPROVED_STATUS,
  SUBMITTED_FOR_APPROVAL_STATUS,
} from '@/lib/accountPlanReadOnly';

export const ACCOUNT_PLAN_OBJECT = 'Account_Plan_vod__c';
export const ACCOUNT_PLAN_SUBMITTED_FIELD = 'KPH_Is_Submitted__c';
export const ACCOUNT_PLAN_SUBMITTED_DATE_FIELD = 'KPH_Medical_Submitted_Date__c';
export const ACCOUNT_PLAN_COMMENTS_FIELD = 'KPH_Comments__c';
export const ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD = 'KPH_Medical_Approval_Status__c';
export const ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD = 'KPH_Medical_Submitter_Name__c';
export const ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD = 'KPH_Medical_Approver_Email__c';
export const ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD = 'KPH_Medical_Submitted_Date__c';
export const ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD = 'KPH_Medical_Approver_Name__c';
export const ACCOUNT_PLAN_APPROVAL_STATUS_FIELD = ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD;
export const ACCOUNT_PLAN_FD_REVIEW_DATE_FIELD = 'KPH_Last_FD_Review_date__c';
export const APPROVAL_HISTORY_OBJECT = 'KPH_Account_Plan_Approval_History__c';
export const APPROVAL_HISTORY_ACCOUNT_PLAN_FIELD = 'KPH_Account_Plan__c';
export const APPROVAL_HISTORY_MEDICAL_STATUS_FIELD = 'KPH_Medical_Status__c';
export const APPROVAL_HISTORY_MEDICAL_APPROVER_FIELD = 'KPH_Medical_Approver__c';
export const APPROVAL_HISTORY_MEDICAL_SUBMITTER_FIELD = 'KPH_Medical_Submitter__c';
export const APPROVAL_HISTORY_MEDICAL_RECORD_TYPES = Object.freeze([
  'KPH_Medical_Approved',
  'KPH_Medical_Pending',
  'KPH_Medical_Submitted',
]);
const APPROVAL_HISTORY_COMMON_FIELDS = Object.freeze([
  'Id',
  'CreatedDate',
  'LastModifiedDate',
  APPROVAL_HISTORY_MEDICAL_STATUS_FIELD,
  APPROVAL_HISTORY_MEDICAL_APPROVER_FIELD,
  APPROVAL_HISTORY_MEDICAL_SUBMITTER_FIELD,
]);
const APPROVAL_HISTORY_REQUIRED_FIELDS = new Set(['Id', 'CreatedDate']);
export const APPROVAL_HISTORY_FIELDS = Object.freeze([
  ...APPROVAL_HISTORY_COMMON_FIELDS,
]);
export const ACCOUNT_PLAN_APPROVAL_REVIEW_FIELDS = Object.freeze([
  'Id',
  'Name',
  ACCOUNT_PLAN_APPROVAL_STATUS_FIELD,
  'KPH_Medical_Submitted_Date__c',
  'KPH_Approval_Due_Date__c',
  ACCOUNT_PLAN_FD_REVIEW_DATE_FIELD,
  'KPH_Last_Account_Insight_Update__c',
  'KPH_Last_Critical_Acitivity_Update__c',
  'KPH_LAST_BARRIER_TACTICAL_ACTION_UPDATE__c',
  'KPH_Last_Internal_POD_Meeting_Update__c',
]);

const nestedErrorMessages = (value, seen = new Set()) => {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (typeof value !== 'object' || seen.has(value)) return [];
  seen.add(value);

  const messages = [];
  for (const key of ['message', 'errorMessage', 'msg']) {
    if (typeof value[key] === 'string' && value[key].trim()) messages.push(value[key].trim());
  }
  for (const child of Object.values(value)) {
    messages.push(...nestedErrorMessages(child, seen));
  }
  return messages;
};

const readableError = (error) => {
  const messages = Array.from(new Set(nestedErrorMessages(error)));
  if (!messages.length) return 'unknown error';
  // The bridge's top-level RecordError text is generic. Prefer the deepest
  // Salesforce field/validation message while retaining useful context.
  const specificMessages = messages.filter((message) =>
    !/^An error occurred while trying to update the record\. Please try again\.?$/i.test(message)
  );
  return (specificMessages.length ? specificMessages : messages)
    .sort((left, right) => right.length - left.length)[0];
};

const isSalesforceAutomationFailure = (error) => {
  const text = nestedErrorMessages(error).join(' ');
  return /CANNOT_EXECUTE_FLOW_TRIGGER|process failed|flow interview|unhandled fault.*flow/i.test(text);
};

const updateApprovalRecord = async (planId, requiredFields, supplementalFields) => {
  const recordId = toCanonicalSalesforceId(planId) || planId;
  try {
    await updateRecord(ACCOUNT_PLAN_OBJECT, recordId, {
      ...requiredFields,
      ...supplementalFields,
    }, { crm: true });
  } catch (fullPayloadError) {
    // Retrying cannot repair a server-side Flow fault and creates a second
    // failed Flow interview/error id for the same user action.
    if (isSalesforceAutomationFailure(fullPayloadError)) throw fullPayloadError;
    try {
      // Salesforce applies an update atomically. If a supplemental field is
      // unavailable to a Veeva profile, retrying the required routing fields
      // cannot leave a partial first update behind.
      await updateRecord(ACCOUNT_PLAN_OBJECT, recordId, requiredFields, { crm: true });
    } catch (requiredPayloadError) {
      const requiredMessage = readableError(requiredPayloadError);
      const fullMessage = readableError(fullPayloadError);
      const combined = requiredMessage === fullMessage
        ? requiredMessage
        : `${requiredMessage} (initial full update: ${fullMessage})`;
      const error = new Error(combined);
      error.cause = requiredPayloadError;
      throw error;
    }
  }
};

const idVariants = (value) => {
  const id = String(value || '').trim();
  if (!id) return [];
  const variants = salesforceIdVariants(id);
  return variants.length ? variants : [id];
};

const isSalesforceId = (value) => /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/.test(
  String(value || '').trim()
);

const fetchUserNames = async (rows) => {
  const ids = Array.from(new Set((rows || []).flatMap((row) => {
    const record = unwrap(row) || {};
    return [
      record[APPROVAL_HISTORY_MEDICAL_APPROVER_FIELD],
      record[APPROVAL_HISTORY_MEDICAL_SUBMITTER_FIELD],
    ].filter(isSalesforceId).flatMap(idVariants);
  })));
  if (!ids.length) return new Map();
  const users = await runQuery({
    object: 'User',
    fields: ['Id', 'Name'],
    where: `Id IN ${inClause(ids)}`,
    sort: ['Name ASC'],
  });
  const names = new Map();
  (users || []).forEach((row) => {
    const user = unwrap(row) || {};
    if (!user.Id || !user.Name) return;
    idVariants(user.Id).forEach((id) => names.set(id, user.Name));
  });
  return names;
};

const mappedValueForId = (valuesById, id) =>
  idVariants(id).map((candidate) => valuesById.get(candidate)).find(Boolean) || '';

const approvalHistoryPerson = (valuesById, value) =>
  mappedValueForId(valuesById, value) || String(value || '').trim();

const approvalHistoryRequestKey = (createdDate) => {
  const timestamp = new Date(createdDate).getTime();
  // Approval History displays timestamps to the minute. The Medical history
  // Flow can create one row per lifecycle state with timestamps in that same
  // minute, so treat those rows as one approval request in the UI.
  if (Number.isFinite(timestamp)) return String(Math.floor(timestamp / 60000));
  return `raw:${String(createdDate || '').trim()}`;
};

const approvalHistoryStatusRank = (status) => {
  const key = String(status || '').trim().toLowerCase();
  if (key.includes('approv')) return 3;
  if (key.includes('pending')) return 2;
  if (key.includes('submit')) return 1;
  return 0;
};

const mergeApprovalHistoryRequests = (entries) => {
  const requests = new Map();
  (entries || []).forEach((entry) => {
    const key = approvalHistoryRequestKey(entry.createdDate);
    const existing = requests.get(key);
    if (!existing) {
      requests.set(key, { ...entry });
      return;
    }

    const entryIsLaterState =
      approvalHistoryStatusRank(entry.status) > approvalHistoryStatusRank(existing.status);
    const entryIsSubmission = approvalHistoryStatusRank(entry.status) === 1;
    requests.set(key, {
      ...existing,
      // Keep the original submission row's identity/date while overlaying its
      // latest lifecycle state and the people recorded across both rows.
      id: entryIsSubmission ? entry.id : existing.id,
      createdDate: entryIsSubmission ? entry.createdDate : existing.createdDate,
      status: entryIsLaterState ? entry.status : existing.status,
      approvalDate: existing.approvalDate || entry.approvalDate,
      medicalSubmitter: existing.medicalSubmitter || entry.medicalSubmitter,
      actualApprover: existing.actualApprover || entry.actualApprover,
    });
  });
  return Array.from(requests.values()).map((request) => ({
    ...request,
    // Pending records can contain the assigned approver. That person is not
    // the Actual Approver until the request reaches Approved.
    actualApprover: approvalHistoryStatusRank(request.status) === 3
      ? request.actualApprover
      : '',
    approvalDate: request.approvalDate || '',
  }));
};

const fetchMedicalApprovalHistoryRecordTypes = async () => {
  const rows = await runQuery({
    object: 'RecordType',
    fields: ['Id', 'DeveloperName'],
    where: `SobjectType = '${APPROVAL_HISTORY_OBJECT}' AND DeveloperName IN ${inClause(APPROVAL_HISTORY_MEDICAL_RECORD_TYPES)}`,
  });
  const medicalRecordTypes = [];
  (rows || []).forEach((row) => {
    const recordType = unwrap(row) || {};
    if (!recordType.Id || !APPROVAL_HISTORY_MEDICAL_RECORD_TYPES.includes(recordType.DeveloperName)) return;
    medicalRecordTypes.push({ id: recordType.Id, name: recordType.DeveloperName });
  });
  return medicalRecordTypes;
};

const inaccessibleApprovalHistoryField = (error, fields) => {
  const text = [
    error?.message,
    error?.errorMessage,
    error?.cause?.message,
    error?.cause?.errorMessage,
    typeof error === 'string' ? error : '',
  ].filter(Boolean).join(' ');
  if (!/cannot be accessed|getFieldLabel|INVALID_FIELD|No such column/i.test(text)) return null;
  return (fields || []).find((field) => text.includes(field)) || null;
};

const runApprovalHistoryQueryWithFieldFallback = (params) =>
  runQuery(params).catch((error) => {
    const inaccessibleField = inaccessibleApprovalHistoryField(error, params.fields);
    if (!inaccessibleField || APPROVAL_HISTORY_REQUIRED_FIELDS.has(inaccessibleField)) throw error;
    // Offline visibility can differ by profile and record type. Remove only
    // the rejected optional column and retain the rest of the history event.
    return runApprovalHistoryQueryWithFieldFallback({
      ...params,
      fields: params.fields.filter((field) => field !== inaccessibleField),
    });
  });

const fetchApprovalHistoryRowsForRecordType = async (planId, recordType) => {
  const params = {
    object: APPROVAL_HISTORY_OBJECT,
    fields: APPROVAL_HISTORY_COMMON_FIELDS,
    where: `${buildIdMatchWhere(APPROVAL_HISTORY_ACCOUNT_PLAN_FIELD, planId)} AND ${buildIdMatchWhere('RecordTypeId', recordType.id)}`,
    sort: ['CreatedDate DESC'],
  };
  const rows = await runApprovalHistoryQueryWithFieldFallback(params);
  return (rows || []).map((row) => ({ row, recordTypeName: recordType.name }));
};

const crmScalar = (value) => {
  let current = value;
  for (let depth = 0; depth < 8 && current && typeof current === 'object'; depth += 1) {
    if (!Object.prototype.hasOwnProperty.call(current, 'value')) break;
    current = current.value;
  }
  return current;
};

const requiredUserField = (record, field) => String(crmScalar(record?.[field]) || '').trim();

export const fetchCurrentUserManager = async () => {
  const currentUserId = String(
    crmScalar(await getCrmDataForCurrentObject('User', 'Id')) || ''
  ).trim();
  if (!currentUserId) throw new Error('Could not resolve the logged-in User ID.');

  const currentUserRows = await runCrmQuery({
    object: 'User',
    fields: ['Id', 'ManagerId'],
    where: buildIdMatchWhere('Id', currentUserId),
    limit: 1,
  });
  const managerId = requiredUserField(unwrap(currentUserRows[0]), 'ManagerId');
  if (!managerId) throw new Error('The logged-in User does not have a ManagerId.');

  const managerRows = await runCrmQuery({
    object: 'User',
    fields: ['Id', 'Email', 'Name'],
    where: buildIdMatchWhere('Id', managerId),
    limit: 1,
  });
  const managerRecord = unwrap(managerRows[0]);
  const managerEmail = requiredUserField(managerRecord, 'Email');
  if (!managerEmail) throw new Error('The manager User does not have an Email value.');
  const managerName = requiredUserField(managerRecord, 'Name');
  if (!managerName) throw new Error('The manager User does not have a Name value.');
  return { email: managerEmail, name: managerName };
};

export const fetchAccountPlanApprovalReview = async (planId) => {
  if (!planId) throw new Error('Missing account plan id.');
  try {
    const rows = await runQuery({
      object: ACCOUNT_PLAN_OBJECT,
      fields: ACCOUNT_PLAN_APPROVAL_REVIEW_FIELDS,
      where: buildIdMatchWhere('Id', planId),
      limit: 1,
    });
    const record = unwrap(rows[0]) || {};
    if (!record.Id) throw new Error('No approval review data was found for this Account Plan.');
    return {
      id: record.Id,
      name: record.Name || 'Account Plan',
      approvalStatus: record[ACCOUNT_PLAN_APPROVAL_STATUS_FIELD] || null,
      submittedDate: record.KPH_Medical_Submitted_Date__c || null,
      approvalDueDate: record.KPH_Approval_Due_Date__c || null,
      lastFdReviewDate: record[ACCOUNT_PLAN_FD_REVIEW_DATE_FIELD] || null,
      lastAccountInsightUpdate: record.KPH_Last_Account_Insight_Update__c || null,
      lastAdditionalCriticalActivityUpdate: record.KPH_Last_Critical_Acitivity_Update__c || null,
      lastBarrierTacticalActionUpdate: record.KPH_LAST_BARRIER_TACTICAL_ACTION_UPDATE__c || null,
      lastInternalPodMeetingUpdate: record.KPH_Last_Internal_POD_Meeting_Update__c || null,
    };
  } catch (error) {
    throw new Error(`Could not load approval review: ${readableError(error)}`);
  }
};

export const fetchAccountPlanApprovalHistory = async (planId) => {
  if (!planId) throw new Error('Missing account plan id.');
  try {
    const medicalRecordTypes = await fetchMedicalApprovalHistoryRecordTypes();
    if (!medicalRecordTypes.length) {
      throw new Error('No medical Approval History record types were found.');
    }
    const typedRows = (await Promise.all(
      medicalRecordTypes.map((recordType) => fetchApprovalHistoryRowsForRecordType(planId, recordType))
    )).flat().sort((left, right) => {
      const leftDate = String((unwrap(left.row) || {}).CreatedDate || '');
      const rightDate = String((unwrap(right.row) || {}).CreatedDate || '');
      return rightDate.localeCompare(leftDate);
    });
    const rows = typedRows.map(({ row }) => row);
    const names = await fetchUserNames(rows);
    const entries = typedRows.map(({ row, recordTypeName }, index) => {
      const record = unwrap(row) || {};
      const isApprovedHistoryRecord =
        recordTypeName === 'KPH_Medical_Approved' ||
        approvalHistoryStatusRank(record[APPROVAL_HISTORY_MEDICAL_STATUS_FIELD]) === 3;
      return {
        id: record.Id || `approval-history-${index}`,
        createdDate: record.CreatedDate || '',
        status: record[APPROVAL_HISTORY_MEDICAL_STATUS_FIELD] || '',
        // Approval History does not expose a historical copy of the Account
        // Plan's Last FD Review field. LastModifiedDate is the per-record
        // approval timestamp; CreatedDate covers newly-created Approved rows.
        approvalDate: isApprovedHistoryRecord
          ? (record.LastModifiedDate || record.CreatedDate || '')
          : '',
        medicalSubmitter: approvalHistoryPerson(
          names,
          record[APPROVAL_HISTORY_MEDICAL_SUBMITTER_FIELD]
        ),
        actualApprover: approvalHistoryPerson(
          names,
          record[APPROVAL_HISTORY_MEDICAL_APPROVER_FIELD]
        ),
      };
    });
    return mergeApprovalHistoryRequests(entries);
  } catch (error) {
    throw new Error(`Could not load approval history: ${readableError(error)}`);
  }
};

export const submitMpdApproval = async ({ planId, submittedDate, submitterName }) => {
  const normalizedSubmittedDate = String(submittedDate || '').trim();
  const normalizedSubmitterName = String(submitterName || '').trim();
  if (!planId) throw new Error('Missing account plan id.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedSubmittedDate)) {
    throw new Error('Submission date is required.');
  }
  if (!normalizedSubmitterName) throw new Error('Logged-in user name is required.');

  try {
    const approver = await fetchCurrentUserManager();
    await updateApprovalRecord(planId, {
      [ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD]: SUBMITTED_FOR_APPROVAL_STATUS,
      [ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD]: normalizedSubmitterName,
      [ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD]: approver.email,
    }, {
      [ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD]: approver.name,
      [ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD]: normalizedSubmittedDate,
    });
    return {
      planId,
      submittedDate: normalizedSubmittedDate,
      submitterName: normalizedSubmitterName,
      approverEmail: approver.email,
      approverName: approver.name,
    };
  } catch (error) {
    throw new Error(`Could not submit FD approval: ${readableError(error)}`);
  }
};

export const approveAccountPlan = async ({ planId }) => {
  if (!planId) throw new Error('Missing account plan id.');

  try {
    await updateApprovalRecord(planId, {
      [ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD]: APPROVED_STATUS,
      [ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD]: '',
      [ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD]: '',
    }, {
      [ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD]: '',
      [ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD]: null,
    });
  } catch (error) {
    throw new Error(`Could not approve account plan: ${readableError(error)}`);
  }

  return {
    planId,
    approvalStatus: APPROVED_STATUS,
  };
};
