import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const stakeholdersModulePath = new URL('../src/lib/dataservice/accountPlan/stakeholders.js', import.meta.url);

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadSharedModule = async ({
  veevaRuntime = true,
  online = true,
  rejectOptionalAccountFields = false,
} = {}) => {
  globalThis.__stakeholderLookupQueries = [];
  globalThis.__stakeholderLookupCrmQueries = [];
  globalThis.__stakeholderLookupUpdates = [];
  globalThis.__stakeholderLookupCrmUpdates = [];
  globalThis.__stakeholderLookupCreates = [];
  globalThis.__stakeholderLookupCrmCreates = [];
  globalThis.__rejectStakeholderOptionalAccountFields = rejectOptionalAccountFields;
  globalThis.__stakeholderAccountRows = [
    {
      Id: '0038C00000MockHcp1',
      Name: 'ELENA MARTIN',
      EID_GILD__c: '118822',
      Account_Identifier_vod__c: 'ALT-118822',
      Territory_vod__c: 'Upstate NY',
      Account_Type__c: 'HCP',
    },
    {
      Id: '0038C00000OtherHcp',
      Name: 'Marcus Lin',
      EID_GILD__c: '118899',
      Account_Identifier_vod__c: 'ALT-118899',
      Territory_vod__c: 'Upstate NY',
      Account_Type__c: 'HCP',
    },
  ];

  const queryStubUrl = dataModule(`
    export const runQuery = (params) => {
      globalThis.__stakeholderLookupQueries.push(params);
      return Promise.resolve(globalThis.__stakeholderAccountRows);
    };
    export const runCrmQuery = (params) => {
      globalThis.__stakeholderLookupCrmQueries.push(params);
      if (
        globalThis.__rejectStakeholderOptionalAccountFields &&
        params.object === 'Account' &&
        params.fields.some((field) => !['Id', 'Name'].includes(field))
      ) {
        return Promise.reject(new Error('offline field unavailable'));
      }
      return Promise.resolve(globalThis.__stakeholderAccountRows);
    };
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const getCrmDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => row || null;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = (object, fields) => {
      globalThis.__stakeholderLookupCreates.push({ object, fields });
      return Promise.resolve({ data: { id: 'new-stakeholder-id' } });
    };
    export const createCrmRecord = (object, fields) => {
      globalThis.__stakeholderLookupCrmCreates.push({ object, fields });
      return Promise.resolve({ data: { id: 'new-stakeholder-id' } });
    };
    export const updateRecord = (object, id, fields, options = {}) => {
      const calls = options.crm
        ? globalThis.__stakeholderLookupCrmUpdates
        : globalThis.__stakeholderLookupUpdates;
      calls.push({ object, id, fields });
      return Promise.resolve({ data: { id } });
    };
  `);
  const clientStubUrl = dataModule(`
    export const bindAccountPlanDataContext = (id) => id;
    export const hasVeevaRuntime = () => ${veevaRuntime ? 'true' : 'false'};
    export const isMockRuntime = true;
    export const isOnline = () => ${online ? 'true' : 'false'};
  `);
  const approvalReviewDateStubUrl = dataModule('export const acceptedApprovalReviewDate = () => null;');

  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalReviewDateStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return {
    mod,
    queries: globalThis.__stakeholderLookupQueries,
    crmQueries: globalThis.__stakeholderLookupCrmQueries,
    updates: globalThis.__stakeholderLookupUpdates,
    crmUpdates: globalThis.__stakeholderLookupCrmUpdates,
    creates: globalThis.__stakeholderLookupCreates,
    crmCreates: globalThis.__stakeholderLookupCrmCreates,
  };
};

const defaultStakeholderPicklistLabels = {
  KPH_Stakeholder_Map__c: {
    KPH_Title__c: {
      'Cell Therapy Director': 'Cell Therapy Director',
      'Pharmacy Director': 'Pharmacy Director',
    },
    KPH_DLBCL_Clinical_Influence__c: {
      Champion: 'Champion',
    },
    KPH_DLBCL_Financial_Influence__c: {
      Neutral: 'Neutral',
    },
    KPH_DLBCL_Operational_Influence__c: {
      Resistant: 'Resistant',
    },
    KPH_MM_Clinical_Influence__c: {
      'MM Champion': 'MM Champion',
    },
    KPH_MM_Financial_Influence__c: {
      'MM Neutral': 'MM Neutral',
    },
    KPH_MM_Operational_Influence__c: {
      'MM Resistant': 'MM Resistant',
    },
    KPH_Priority__c: {
      P1: 'P1',
    },
    MM_Priority__c: {
      P2: 'P2',
    },
  },
};

const defaultStakeholderRows = [
  {
    id: 'stk-001',
    name: 'Elena Martin',
    role: 'Legacy Role',
    dlbclClinicalInfluence: 'Legacy Influence',
    mmClinicalInfluence: 'Legacy MM Influence',
    dlbclPriority: 'Legacy Priority',
  },
];

const loadStakeholdersModule = async ({
  picklistLabels = defaultStakeholderPicklistLabels,
  stakeholderRows = defaultStakeholderRows,
} = {}) => {
  globalThis.__stakeholderPicklistCalls = [];
  globalThis.__stakeholderMockPicklistCalls = [];
  globalThis.__stakeholderPicklistLabels = picklistLabels;
  globalThis.__stakeholderRows = stakeholderRows;

  const sharedStubUrl = dataModule(`
    export const createStakeholder = () => Promise.resolve({});
    export const deleteStakeholder = () => Promise.resolve({});
    export const fetchStakeholders = () => Promise.resolve(globalThis.__stakeholderRows);
    export const requireCurrentAccountPlanId = () => Promise.resolve('plan-001');
    export const resolveShellContextForPlanId = () => Promise.resolve({
      planId: 'plan-001',
      plan: { id: 'plan-001' },
      account: { id: 'account-001' },
    });
    export const resolveShellContext = resolveShellContextForPlanId;
    export const searchSiteAccounts = () => Promise.resolve([]);
    export const searchStakeholderAccounts = () => Promise.resolve([]);
    export const updateStakeholder = () => Promise.resolve({});
  `);
  const queryStubUrl = dataModule(`
    export const getPicklistValueLabels = (object, field) => {
      globalThis.__stakeholderMockPicklistCalls.push({ object, field });
      return Promise.resolve(
        (globalThis.__stakeholderPicklistLabels[object] &&
          globalThis.__stakeholderPicklistLabels[object][field]) ||
        {}
      );
    };
    export const getCrmPicklistValueLabels = (object, field) => {
      globalThis.__stakeholderPicklistCalls.push({ object, field });
      return Promise.resolve(
        (globalThis.__stakeholderPicklistLabels[object] &&
          globalThis.__stakeholderPicklistLabels[object][field]) ||
        {}
      );
    };
  `);
  const clientStubUrl = dataModule('export const hasVeevaRuntime = () => true;');

  const source = (await readFile(stakeholdersModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/accountPlan\/shared['"]/g, `from '${sharedStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return {
    mod,
    calls: globalThis.__stakeholderPicklistCalls,
    mockCalls: globalThis.__stakeholderMockPicklistCalls,
  };
};

test('searchStakeholderAccounts queries CRM Account names with a maximum limit of 50', async () => {
  const { mod, queries, crmQueries } = await loadSharedModule();

  const rows = await mod.searchStakeholderAccounts('elena', 60);

  assert.equal(queries.length, 0);
  assert.equal(crmQueries[0].object, 'Account');
  assert.ok(crmQueries[0].fields.includes('Id'));
  assert.ok(crmQueries[0].fields.includes('Name'));
  assert.ok(crmQueries[0].fields.includes('EID_GILD__c'));
  assert.match(crmQueries[0].where, /Name LIKE '%elena%'/);
  assert.match(crmQueries[0].where, /Name LIKE '%ELENA%'/);
  assert.match(crmQueries[0].where, /^IsPersonAccount = true AND \(/);
  assert.equal(crmQueries[0].limit, 50);
  assert.deepEqual(rows, [
    {
      id: '0038C00000MockHcp1',
      name: 'ELENA MARTIN',
      accountIdentifier: 'ALT-118822',
      eid: '118822',
      territory: 'Upstate NY',
    },
  ]);
});

test('searchStakeholderAccounts uses only Person Accounts when the name search is blank', async () => {
  const { mod, crmQueries } = await loadSharedModule();

  await mod.searchStakeholderAccounts('', 60);

  assert.equal(crmQueries[0].object, 'Account');
  assert.equal(crmQueries[0].where, 'IsPersonAccount = true');
  assert.equal(crmQueries[0].limit, 50);
});

test('stakeholder search falls back to Id and Name when optional Account fields are unavailable online', async () => {
  const { mod, crmQueries } = await loadSharedModule({ rejectOptionalAccountFields: true });

  const rows = await mod.searchStakeholderAccounts('elena', 50);

  assert.equal(crmQueries.length, 3);
  assert.ok(crmQueries[0].fields.includes('Primary_Parent_vod__c'));
  assert.ok(crmQueries[1].fields.includes('EID_GILD__c'));
  assert.deepEqual(crmQueries[2].fields, ['Id', 'Name']);
  assert.deepEqual(rows.map(({ id, name }) => ({ id, name })), [
    { id: '0038C00000MockHcp1', name: 'ELENA MARTIN' },
  ]);
});

test('stakeholder search uses only offline-safe required Account fields on iPad', async () => {
  const { mod, crmQueries } = await loadSharedModule({ online: false });

  const rows = await mod.searchStakeholderAccounts('elena', 50);

  assert.equal(crmQueries.length, 1);
  assert.deepEqual(crmQueries[0].fields, ['Id', 'Name']);
  assert.deepEqual(rows.map(({ id, name }) => ({ id, name })), [
    { id: '0038C00000MockHcp1', name: 'ELENA MARTIN' },
  ]);
});

test('stakeholder update writes visible Name lookup and Role values directly to CRM', async () => {
  const { mod, updates, crmUpdates } = await loadSharedModule();

  await mod.updateStakeholder('stk-001', {
    name: 'Elena Martin',
    profileRecordId: '0038C00000MockHcp1',
    stakeholderId: '118822',
    primaryParent: 'Northern Oncology Associates',
    role: 'Cell Therapy Director',
  });

  assert.equal(updates.length, 0);
  assert.equal(crmUpdates[0].object, 'KPH_Stakeholder_Map__c');
  assert.equal(crmUpdates[0].id, 'stk-001');
  assert.equal(crmUpdates[0].fields.KPH_Account__c, '0038C00000MockHcp1');
  assert.equal(crmUpdates[0].fields.KPH_Title__c, 'Cell Therapy Director');
  assert.equal(crmUpdates[0].fields.KPH_Other_Title__c, null);
  assert.deepEqual(Object.keys(crmUpdates[0].fields).sort(), ['KPH_Account__c', 'KPH_Other_Title__c', 'KPH_Title__c']);
  assert.ok(!Object.prototype.hasOwnProperty.call(crmUpdates[0].fields, 'KPH_Name_Of_Site2__c'));
});

test('stakeholder update writes Other Role when Role is Other', async () => {
  const { mod, crmUpdates } = await loadSharedModule();

  const row = await mod.updateStakeholder('stk-001', {
    name: 'Elena Martin',
    profileRecordId: '0038C00000MockHcp1',
    role: 'Other',
    otherRole: 'Clinical Research Coordinator',
  });

  assert.equal(crmUpdates.length, 1);
  assert.equal(crmUpdates[0].fields.KPH_Title__c, 'Other');
  assert.equal(crmUpdates[0].fields.KPH_Other_Title__c, 'Clinical Research Coordinator');
  assert.equal(row.otherRole, 'Clinical Research Coordinator');
});

test('stakeholder save rejects Role Other when Other Role is blank before calling CRM', async () => {
  const { mod, crmUpdates, crmCreates } = await loadSharedModule();

  await assert.rejects(
    mod.updateStakeholder('stk-001', {
      name: 'Elena Martin',
      profileRecordId: '0038C00000MockHcp1',
      role: 'Other',
      otherRole: '   ',
    }),
    /Other Role is required when Role is Other\./
  );
  await assert.rejects(
    mod.createStakeholder('plan-001', {
      name: 'Elena Martin',
      profileRecordId: '0038C00000MockHcp1',
      role: 'Other',
    }),
    /Other Role is required when Role is Other\./
  );

  assert.equal(crmUpdates.length, 0);
  assert.equal(crmCreates.length, 0);
});

test('stakeholder create writes plan, Account lookup, and Role directly to CRM', async () => {
  const { mod, creates, crmCreates } = await loadSharedModule();

  await mod.createStakeholder('plan-001', {
    name: 'Elena Martin',
    profileRecordId: '0038C00000MockHcp1',
    stakeholderId: '118822',
    primaryParent: 'Northern Oncology Associates',
    role: 'Cell Therapy Director',
    dlbclPriority: 'P1',
    dlbclCurrentTarget: 'Yes',
    dlbclHcpClassification: 'Decision Maker',
    dlbclClinicalInfluence: 'High',
  });

  assert.equal(creates.length, 0);
  assert.equal(crmCreates[0].object, 'KPH_Stakeholder_Map__c');
  assert.equal(crmCreates[0].fields.KPH_Account_Plan__c, 'plan-001');
  assert.equal(crmCreates[0].fields.KPH_Account__c, '0038C00000MockHcp1');
  assert.equal(crmCreates[0].fields.KPH_Title__c, 'Cell Therapy Director');
  assert.equal(crmCreates[0].fields.KPH_Other_Title__c, null);
  assert.deepEqual(Object.keys(crmCreates[0].fields).sort(), [
    'KPH_Account_Plan__c',
    'KPH_Account__c',
    'KPH_Other_Title__c',
    'KPH_Title__c',
  ]);
  assert.ok(!Object.prototype.hasOwnProperty.call(crmCreates[0].fields, 'KPH_First_Name__c'));
  assert.ok(!Object.prototype.hasOwnProperty.call(crmCreates[0].fields, 'KPH_Last_Name__c'));
  assert.ok(!Object.prototype.hasOwnProperty.call(crmCreates[0].fields, 'Stakeholder_EID__c'));
  assert.ok(!Object.prototype.hasOwnProperty.call(crmCreates[0].fields, 'KPH_Name_Of_Site2__c'));
  assert.ok(!Object.prototype.hasOwnProperty.call(crmCreates[0].fields, 'KPH_Priority__c'));
  assert.ok(!Object.prototype.hasOwnProperty.call(crmCreates[0].fields, 'KPH_Current_Target__c'));
  assert.ok(!Object.prototype.hasOwnProperty.call(crmCreates[0].fields, 'KPH_HCP_Classification__c'));
});

test('loadStakeholders keeps global role options limited to direct CRM picklist metadata', async () => {
  const { mod, calls, mockCalls } = await loadStakeholdersModule();

  const data = await mod.loadStakeholders();

  assert.ok(calls.some((call) =>
    call.object === 'KPH_Stakeholder_Map__c' && call.field === 'KPH_Title__c'
  ));
  assert.equal(mockCalls.length, 0);
  assert.ok(!calls.some((call) => /Influence__c$/.test(call.field)));
  assert.deepEqual(data.picklists.roleOptions, [
    'Cell Therapy Director',
    'Pharmacy Director',
  ]);
  assert.equal(data.stakeholders[0].role, 'Legacy Role');
  assert.ok(!Object.prototype.hasOwnProperty.call(data.picklists, 'influenceOptions'));
});

test('loadStakeholders does not inject static modal picklist fallbacks when CRM metadata is empty', async () => {
  const { mod } = await loadStakeholdersModule({
    picklistLabels: { KPH_Stakeholder_Map__c: {} },
    stakeholderRows: [],
  });

  const data = await mod.loadStakeholders();

  assert.deepEqual(data.picklists.roleOptions, []);
  assert.ok(!Object.prototype.hasOwnProperty.call(data.picklists, 'influenceOptions'));
  assert.ok(!Object.prototype.hasOwnProperty.call(data.picklists, 'priorityOptions'));
});
