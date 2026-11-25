import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const approvalModulePath = new URL('../src/lib/dataservice/accountPlan/approval.js', import.meta.url);

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadApprovalModule = async ({
  managerId = '005-manager',
  managerEmail = 'manager@example.com',
  managerName = 'Manager Name',
  recordTypeRows = [],
  approvalHistoryRows = [],
  userRows = [],
  inaccessibleHistoryField = '',
  updateErrors = [],
} = {}) => {
  globalThis.__mpdApprovalCalls = [];
  globalThis.__mpdApprovalQueries = [];
  globalThis.__mpdApprovalManagerId = managerId;
  globalThis.__mpdApprovalManagerEmail = managerEmail;
  globalThis.__mpdApprovalManagerName = managerName;
  globalThis.__mpdApprovalRecordTypeRows = recordTypeRows;
  globalThis.__mpdApprovalHistoryRows = approvalHistoryRows;
  globalThis.__mpdApprovalUserRows = userRows;
  globalThis.__mpdApprovalInaccessibleHistoryField = inaccessibleHistoryField;
  globalThis.__mpdApprovalUpdateErrors = [...updateErrors];

  const queryStubUrl = dataModule(`
    export const buildIdMatchWhere = (field, id) => field + " = '" + id + "'";
    export const inClause = (values) => "('" + values.join("','") + "')";
    export const salesforceIdVariants = (id) => [id];
    export const toCanonicalSalesforceId = () => null;
    export const getCrmDataForCurrentObject = (object, field) =>
      Promise.resolve(object === 'User' && field === 'Id' ? '005-current' : null);
    export const runCrmQuery = (params) => {
      globalThis.__mpdApprovalQueries.push(params);
      if (params.fields.includes('ManagerId')) {
        return Promise.resolve([{ Id: '005-current', ManagerId: globalThis.__mpdApprovalManagerId }]);
      }
      if (params.fields.includes('Email')) {
        return Promise.resolve([{
          Id: globalThis.__mpdApprovalManagerId,
          Email: globalThis.__mpdApprovalManagerEmail,
          Name: globalThis.__mpdApprovalManagerName,
        }]);
      }
      return Promise.resolve([]);
    };
    export const runQuery = (params) => {
      globalThis.__mpdApprovalQueries.push(params);
      if (params.object === 'RecordType') return Promise.resolve(globalThis.__mpdApprovalRecordTypeRows);
      if (params.object === 'KPH_Account_Plan_Approval_History__c') {
        if (
          globalThis.__mpdApprovalInaccessibleHistoryField &&
          params.fields.includes(globalThis.__mpdApprovalInaccessibleHistoryField)
        ) {
          return Promise.reject(new Error(
            'getFieldLabel called with field that cannot be accessed: ' +
            globalThis.__mpdApprovalInaccessibleHistoryField
          ));
        }
        const recordType = globalThis.__mpdApprovalRecordTypeRows.find((candidate) =>
          params.where.includes(candidate.Id)
        );
        return Promise.resolve(globalThis.__mpdApprovalHistoryRows.filter((row) =>
          !recordType || row.RecordTypeId === recordType.Id
        ));
      }
      if (params.object === 'User') return Promise.resolve(globalThis.__mpdApprovalUserRows);
      return Promise.resolve([]);
    };
    export const unwrap = (row) => row;
    export const updateRecord = (object, id, fields, options) => {
      globalThis.__mpdApprovalCalls.push({ type: 'update', object, id, fields, options });
      const error = globalThis.__mpdApprovalUpdateErrors.shift();
      if (error) return Promise.reject(error);
      return Promise.resolve({ id });
    };
    export const createRecord = (object, fields) => {
      globalThis.__mpdApprovalCalls.push({ type: 'create', object, fields });
      return Promise.resolve({ id: 'step-001' });
    };
  `);
  const readOnlyStubUrl = dataModule(`
    export const APPROVED_STATUS = 'Approved';
    export const SUBMITTED_FOR_APPROVAL_STATUS = 'Submitted for Approval';
  `);

  const source = (await readFile(approvalModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/accountPlanReadOnly['"]/g, `from '${readOnlyStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return {
    mod,
    calls: globalThis.__mpdApprovalCalls,
    queries: globalThis.__mpdApprovalQueries,
  };
};

test('approval history filters to Medical record types and selects status by record type', async () => {
  const { mod, queries } = await loadApprovalModule({
    recordTypeRows: [
      { Id: 'rt-approved', DeveloperName: 'KPH_Medical_Approved' },
      { Id: 'rt-pending', DeveloperName: 'KPH_Medical_Pending' },
      { Id: 'rt-submitted', DeveloperName: 'KPH_Medical_Submitted' },
      { Id: 'rt-non-medical', DeveloperName: 'Approved' },
    ],
    approvalHistoryRows: [
      {
        Id: 'history-approved',
        CreatedDate: '2026-09-01T10:00:00Z',
        LastModifiedDate: '2026-09-01T15:30:00Z',
        RecordTypeId: 'rt-approved',
        KPH_Medical_Status__c: 'Approved',
        KPH_Medical_Submitter__c: '005000000000001',
        KPH_Medical_Approver__c: '005000000000002',
      },
      {
        Id: 'history-pending',
        CreatedDate: '2026-09-02T10:00:00Z',
        RecordTypeId: 'rt-pending',
        KPH_Medical_Status__c: 'Pending',
        KPH_Medical_Approver__c: '005000000000002',
      },
      {
        Id: 'history-submitted',
        CreatedDate: '2026-09-03T10:00:00Z',
        RecordTypeId: 'rt-submitted',
        KPH_Medical_Status__c: 'Submitted for Approval',
      },
    ],
    userRows: [
      { Id: '005000000000001', Name: 'Medical Submitter' },
      { Id: '005000000000002', Name: 'Actual Approver' },
    ],
  });

  const entries = await mod.fetchAccountPlanApprovalHistory('plan-001');

  assert.deepEqual(entries.map((entry) => entry.status), [
    'Submitted for Approval',
    'Pending',
    'Approved',
  ]);
  assert.equal(entries[2].medicalSubmitter, 'Medical Submitter');
  assert.equal(entries[2].actualApprover, 'Actual Approver');
  assert.equal(entries[2].approvalDate, '2026-09-01T15:30:00Z');
  assert.equal(entries[1].approvalDate, '');
  assert.equal(entries[1].actualApprover, '');
  assert.equal(queries[0].object, 'RecordType');
  assert.match(queries[0].where, /DeveloperName IN \('KPH_Medical_Approved','KPH_Medical_Pending','KPH_Medical_Submitted'\)/);
  const historyQueries = queries.filter((query) => query.object === mod.APPROVAL_HISTORY_OBJECT);
  assert.equal(historyQueries.length, 3);
  assert.ok(historyQueries.every((query) =>
    query.fields.includes('KPH_Medical_Status__c') &&
    query.fields.includes('LastModifiedDate') &&
    query.fields.includes('KPH_Medical_Approver__c') &&
    query.fields.includes('KPH_Medical_Submitter__c')
  ));
});

test('approval history merges submitted and approved states for the same request', async () => {
  const { mod } = await loadApprovalModule({
    recordTypeRows: [
      { Id: 'rt-approved', DeveloperName: 'KPH_Medical_Approved' },
      { Id: 'rt-submitted', DeveloperName: 'KPH_Medical_Submitted' },
    ],
    approvalHistoryRows: [
      {
        Id: 'history-submitted',
        CreatedDate: '2026-09-09T18:01:05Z',
        RecordTypeId: 'rt-submitted',
        KPH_Medical_Status__c: 'Submitted',
        KPH_Medical_Submitter__c: '005000000000001',
      },
      {
        Id: 'history-approved',
        CreatedDate: '2026-09-09T18:01:42Z',
        LastModifiedDate: '2026-09-10T13:45:00Z',
        RecordTypeId: 'rt-approved',
        KPH_Medical_Status__c: 'Approved',
        KPH_Medical_Approver__c: '005000000000002',
      },
    ],
    userRows: [
      { Id: '005000000000001', Name: 'Test MSL' },
      { Id: '005000000000002', Name: 'Chris Heath' },
    ],
  });

  const entries = await mod.fetchAccountPlanApprovalHistory('plan-001');

  assert.deepEqual(entries, [{
    id: 'history-submitted',
    createdDate: '2026-09-09T18:01:05Z',
    status: 'Approved',
    approvalDate: '2026-09-10T13:45:00Z',
    medicalSubmitter: 'Test MSL',
    actualApprover: 'Chris Heath',
  }]);
});

test('approval history keeps requests from different created minutes separate', async () => {
  const { mod } = await loadApprovalModule({
    recordTypeRows: [
      { Id: 'rt-approved', DeveloperName: 'KPH_Medical_Approved' },
      { Id: 'rt-submitted', DeveloperName: 'KPH_Medical_Submitted' },
    ],
    approvalHistoryRows: [
      {
        Id: 'history-submitted',
        CreatedDate: '2026-09-09T18:01:59Z',
        RecordTypeId: 'rt-submitted',
        KPH_Medical_Status__c: 'Submitted',
      },
      {
        Id: 'history-approved',
        CreatedDate: '2026-09-09T18:02:00Z',
        RecordTypeId: 'rt-approved',
        KPH_Medical_Status__c: 'Approved',
      },
    ],
  });

  const entries = await mod.fetchAccountPlanApprovalHistory('plan-001');

  assert.equal(entries.length, 2);
});

test('approval history falls back to CreatedDate when LastModifiedDate is inaccessible', async () => {
  const { mod, queries } = await loadApprovalModule({
    inaccessibleHistoryField: 'LastModifiedDate',
    recordTypeRows: [
      { Id: 'rt-approved', DeveloperName: 'KPH_Medical_Approved' },
    ],
    approvalHistoryRows: [
      {
        Id: 'history-approved',
        CreatedDate: '2026-09-11T09:30:00Z',
        RecordTypeId: 'rt-approved',
        KPH_Medical_Status__c: 'Approved',
      },
    ],
  });

  const entries = await mod.fetchAccountPlanApprovalHistory('plan-001');

  assert.equal(entries[0].approvalDate, '2026-09-11T09:30:00Z');
  const historyQueries = queries.filter((query) => query.object === mod.APPROVAL_HISTORY_OBJECT);
  assert.equal(historyQueries.length, 2);
  assert.ok(historyQueries[0].fields.includes('LastModifiedDate'));
  assert.ok(!historyQueries[1].fields.includes('LastModifiedDate'));
});

test('approval history still loads on iPad when an optional medical field is inaccessible', async () => {
  const { mod, queries } = await loadApprovalModule({
    inaccessibleHistoryField: 'KPH_Medical_Approver__c',
    recordTypeRows: [
      { Id: 'rt-approved', DeveloperName: 'KPH_Medical_Approved' },
      { Id: 'rt-pending', DeveloperName: 'KPH_Medical_Pending' },
      { Id: 'rt-submitted', DeveloperName: 'KPH_Medical_Submitted' },
    ],
    approvalHistoryRows: [
      { Id: 'history-approved', CreatedDate: '2026-09-01T10:00:00Z', RecordTypeId: 'rt-approved' },
      {
        Id: 'history-pending', CreatedDate: '2026-09-02T10:00:00Z', RecordTypeId: 'rt-pending',
        KPH_Medical_Status__c: 'Pending',
      },
      {
        Id: 'history-submitted', CreatedDate: '2026-09-03T10:00:00Z', RecordTypeId: 'rt-submitted',
        KPH_Medical_Status__c: 'Submitted for Approval',
      },
    ],
  });

  const entries = await mod.fetchAccountPlanApprovalHistory('plan-001');

  assert.deepEqual(entries.map((entry) => entry.id), [
    'history-submitted',
    'history-pending',
    'history-approved',
  ]);
  assert.deepEqual(entries.map((entry) => entry.status), [
    'Submitted for Approval',
    'Pending',
    '',
  ]);
  assert.equal(entries[2].approvalDate, '2026-09-01T10:00:00Z');
  const approvedQueries = queries.filter((query) =>
    query.object === mod.APPROVAL_HISTORY_OBJECT && query.where.includes('rt-approved')
  );
  assert.equal(approvedQueries.length, 2);
  assert.ok(approvedQueries[0].fields.includes('KPH_Medical_Approver__c'));
  assert.ok(!approvedQueries[1].fields.includes('KPH_Medical_Approver__c'));
});

test('submitMpdApproval resolves the manager Email and writes all Medical submission fields', async () => {
  const { mod, calls, queries } = await loadApprovalModule();

  await mod.submitMpdApproval({
    planId: 'plan-001',
    submittedDate: '2026-08-13',
    submitterName: 'Priya Kumar',
  });

  assert.deepEqual(queries, [
    {
      object: 'User',
      fields: ['Id', 'ManagerId'],
      where: "Id = '005-current'",
      limit: 1,
    },
    {
      object: 'User',
      fields: ['Id', 'Email', 'Name'],
      where: "Id = '005-manager'",
      limit: 1,
    },
  ]);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    type: 'update',
    object: mod.ACCOUNT_PLAN_OBJECT,
    id: 'plan-001',
    fields: {
      [mod.ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD]: 'Submitted for Approval',
      [mod.ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD]: 'Priya Kumar',
      [mod.ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD]: 'manager@example.com',
      [mod.ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD]: 'Manager Name',
      [mod.ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD]: '2026-08-13',
    },
    options: { crm: true },
  });
});

test('submission retries with required routing fields when a supplemental field is rejected', async () => {
  const { mod, calls } = await loadApprovalModule({
    updateErrors: [{
      body: {
        message: 'An error occurred while trying to update the record. Please try again.',
        output: {
          fieldErrors: {
            KPH_Medical_Approver_Name__c: [{ message: 'Field is not writeable.' }],
          },
        },
      },
    }],
  });

  await mod.submitMpdApproval({
    planId: 'plan-001',
    submittedDate: '2026-09-04',
    submitterName: 'Priya Kumar',
  });

  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].fields, {
    [mod.ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD]: 'Submitted for Approval',
    [mod.ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD]: 'Priya Kumar',
    [mod.ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD]: 'manager@example.com',
  });
});

test('submission exposes the nested Salesforce field error when required routing fields fail', async () => {
  const genericMessage = 'An error occurred while trying to update the record. Please try again.';
  const { mod } = await loadApprovalModule({
    updateErrors: [
      { body: { message: genericMessage } },
      {
        body: {
          message: genericMessage,
          output: {
            fieldErrors: {
              KPH_Medical_Approval_Status__c: [{
                message: 'bad value for restricted picklist field: Submitted for Approval',
              }],
            },
          },
        },
      },
    ],
  });

  await assert.rejects(
    mod.submitMpdApproval({
      planId: 'plan-001',
      submittedDate: '2026-09-04',
      submitterName: 'Priya Kumar',
    }),
    /bad value for restricted picklist field: Submitted for Approval/
  );
});

test('submission does not retry when Salesforce reports an approval-history Flow fault', async () => {
  const flowMessage = 'We can\'t save this record because the “Create Medical Approval History Records” process failed. An unhandled fault has occurred in this flow.';
  const { mod, calls } = await loadApprovalModule({
    updateErrors: [{
      body: {
        message: 'An error occurred while trying to update the record. Please try again.',
        output: {
          errors: [{ errorCode: 'CANNOT_EXECUTE_FLOW_TRIGGER', message: flowMessage }],
        },
      },
    }],
  });

  await assert.rejects(
    mod.submitMpdApproval({
      planId: 'plan-001',
      submittedDate: '2026-09-04',
      submitterName: 'Priya Kumar',
    }),
    /Create Medical Approval History Records/
  );
  assert.equal(calls.length, 1);
});

test('approveAccountPlan writes Approved and clears Medical submission details', async () => {
  const { mod, calls } = await loadApprovalModule();

  await mod.approveAccountPlan({ planId: 'plan-001' });

  assert.deepEqual(calls[0], {
    type: 'update',
    object: mod.ACCOUNT_PLAN_OBJECT,
    id: 'plan-001',
    fields: {
      [mod.ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD]: 'Approved',
      [mod.ACCOUNT_PLAN_MEDICAL_SUBMITTER_NAME_FIELD]: '',
      [mod.ACCOUNT_PLAN_MEDICAL_APPROVER_EMAIL_FIELD]: '',
      [mod.ACCOUNT_PLAN_MEDICAL_APPROVER_NAME_FIELD]: '',
      [mod.ACCOUNT_PLAN_MEDICAL_SUBMITTED_DATE_FIELD]: null,
    },
    options: { crm: true },
  });
});

test('submitMpdApproval does not require a pending process instance', async () => {
  const { mod, calls, queries } = await loadApprovalModule();

  await mod.submitMpdApproval({
    planId: 'plan-001',
    submittedDate: '2026-08-13',
    submitterName: 'Priya Kumar',
  });

  assert.equal(queries.length, 2);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].object, mod.ACCOUNT_PLAN_OBJECT);
});

test('submission stops before the Account Plan write when ManagerId is missing', async () => {
  const { mod, calls } = await loadApprovalModule({ managerId: null });

  await assert.rejects(
    mod.submitMpdApproval({
      planId: 'plan-001',
      submittedDate: '2026-08-13',
      submitterName: 'Priya Kumar',
    }),
    /does not have a ManagerId/
  );
  assert.equal(calls.length, 0);
});

test('submission stops before the Account Plan write when manager Email is missing', async () => {
  const { mod, calls } = await loadApprovalModule({ managerEmail: '' });

  await assert.rejects(
    mod.submitMpdApproval({
      planId: 'plan-001',
      submittedDate: '2026-08-13',
      submitterName: 'Priya Kumar',
    }),
    /does not have an Email value/
  );
  assert.equal(calls.length, 0);
});

test('submission stops before the Account Plan write when manager Name is missing', async () => {
  const { mod, calls } = await loadApprovalModule({ managerName: '' });

  await assert.rejects(
    mod.submitMpdApproval({
      planId: 'plan-001',
      submittedDate: '2026-08-13',
      submitterName: 'Priya Kumar',
    }),
    /does not have a Name value/
  );
  assert.equal(calls.length, 0);
});
