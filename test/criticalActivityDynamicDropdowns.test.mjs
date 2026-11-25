import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const criticalActivitiesModulePath = new URL('../src/lib/dataservice/accountPlan/criticalActivities.js', import.meta.url);

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadCriticalActivitiesModule = async () => {
  globalThis.__criticalActivityPicklistCalls = [];
  globalThis.__criticalActivityParentPicklists = {};
  globalThis.__criticalActivityPicklistLabels = {
    KPH_Medical_Tactics__c: {
      KPH_Status__c: {
        Planned: 'Planned',
        'In Progress': 'In Progress',
        Complete: 'Complete',
      },
      KPH_Indication__c: {
        DLBCL: 'DLBCL',
        MM: 'MM',
      },
      KPH_Accountable_POD_Members__c: {
        'Commercial Lead': 'Commercial Lead',
        'Market Access Lead': 'Market Access Lead',
      },
      KPH_Medical_Tactics__c: {
        'Mapped tactic': 'Mapped tactic',
      },
    },
  };
  globalThis.__criticalActivityBarrierDriverRows = [
    {
      id: 'bd-open',
      type: 'Barrier',
      name: 'Open barrier',
      indication: 'DLBCL',
      status: 'Open',
      recordTypeId: 'barrier-record-type',
    },
    {
      id: 'bd-closed',
      type: 'Driver',
      name: 'Closed driver',
      indication: 'MM',
      status: 'Closed',
      recordTypeId: 'driver-record-type',
    },
  ];
  globalThis.__criticalActivityRows = [
    {
      id: 'act-001',
      status: 'Legacy Status',
      indication: 'aALL',
      ownerLabel: 'Existing Owner',
      isDeactivated: false,
    },
  ];

  const sharedStubUrl = dataModule(`
    export const BARRIER_DRIVER_OBJECT = 'KPH_Medical_Barrier_Tactical_Actions__c';
    export const BARRIER_DRIVER_STATUS_FIELD = 'KPH_Medical_Tactical_Action_Status__c';
    export const BARRIER_DRIVER_STATUS_ORDER = ['Open', 'In Progress', 'Closed'];
    export const CRITICAL_ACTIVITY_OBJECT = 'KPH_Medical_Tactics__c';
    export const applyMedicalLegacyParentPolicy = (activity, parent) => ({
      ...activity,
      legacyEditState: parent && parent.type === 'Barrier' && parent.legacyEditState === 'legacy'
        ? 'legacy'
        : 'current',
      ...(parent && parent.type === 'Barrier' && parent.legacyEditState === 'legacy'
        ? { status: 'Complete', canDeactivate: false, canDelete: false }
        : {}),
    });
    export const createSalesforceIdLookup = (records = []) => {
      const lookup = new Map();
      for (const record of records || []) {
        lookup.set(record.id, record);
        lookup.set(String(record.id || '').slice(0, 15), record);
      }
      return lookup;
    };
    export const createCriticalActivity = () => Promise.resolve({});
    export const fetchBarriersAndDrivers = () => Promise.resolve({
      rows: globalThis.__criticalActivityBarrierDriverRows,
      access: {},
    });
    export const fetchCriticalActivities = () => Promise.resolve(globalThis.__criticalActivityRows);
    export const fetchTeamMembersByPlan = () => Promise.resolve([
      { name: 'CRM POD Member' },
      { name: 'Existing Owner' },
    ]);
    export const requireCurrentAccountPlanId = () => Promise.resolve('plan-001');
    export const resolveShellContextForPlanId = () => Promise.resolve({
      planId: 'plan-001',
      plan: { id: 'plan-001' },
      account: { id: 'account-001' },
    });
    export const resolveShellContext = resolveShellContextForPlanId;
    export const getSalesforceIdLookupEntry = (lookup, id) =>
      lookup.get(id) || lookup.get(String(id || '').slice(0, 15)) || null;
    export const isVisibleBarrierDriverIndication = () => true;
    export const normalizeBarrierDriverStatusForDisplay = (value) => value === 'Close' ? 'Closed' : value;
    export const toBarrierDriver = (row) => row;
    export const deleteCriticalActivity = () => Promise.resolve({});
    export const updateBarrierDriverStatus = () => Promise.resolve({});
    export const updateCriticalActivity = () => Promise.resolve({});
  `);

  const queryStubUrl = dataModule(`
    export const getPicklistValueLabels = (object, field) => {
      globalThis.__criticalActivityPicklistCalls.push({ object, field });
      return Promise.resolve(
        (globalThis.__criticalActivityPicklistLabels[object] &&
          globalThis.__criticalActivityPicklistLabels[object][field]) ||
        {}
      );
    };
  `);
  const titlePicklistMappingsStubUrl = dataModule(`
    export const picklistInfoFromLabels = (labels = {}) => ({
      values: Object.keys(labels || {}),
      labels: labels || {},
    });
    export const buildMedicalTacticOptionsByParentTitle = (values = []) => ({
      'open barrier': values,
    });
  `);
  const dependentPicklistsStubUrl = dataModule(`
    export const fetchDependencyOptionsFromObjectMetadata = () => Promise.resolve(null);
  `);

  const source = (await readFile(criticalActivitiesModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/accountPlan\/shared['"]/g, `from '${sharedStubUrl}'`)
    .replace("from './titlePicklistMappings.js'", `from '${new URL('../src/lib/dataservice/accountPlan/titlePicklistMappings.js', import.meta.url).href}'`)
    .replace("from './barriersDrivers.js'", `from '${dataModule('export const fetchBarrierDriverPicklists = async () => globalThis.__criticalActivityParentPicklists;')}'`)
    .replace(/from ['"]@\/lib\/dataservice\/accountPlan\/titlePicklistMappings['"]/g, `from '${titlePicklistMappingsStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/accountPlan\/dependentPicklists['"]/g, `from '${dependentPicklistsStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, calls: globalThis.__criticalActivityPicklistCalls };
};

test('loadCriticalActivities uses CRM metadata for restricted dropdown options', async () => {
  const { mod, calls } = await loadCriticalActivitiesModule();

  const data = await mod.loadCriticalActivities();

  assert.deepEqual(calls, [
    { object: 'KPH_Medical_Tactics__c', field: 'KPH_Status__c' },
    { object: 'KPH_Medical_Tactics__c', field: 'KPH_Indication__c' },
    { object: 'KPH_Medical_Tactics__c', field: 'KPH_Accountable_POD_Members__c' },
    { object: 'KPH_Medical_Barrier_Tactical_Actions__c', field: 'KPH_Medical_Tactical_Action_Status__c' },
    { object: 'KPH_Medical_Tactics__c', field: 'KPH_Medical_Tactics__c' },
  ]);
  // Strictly CRM metadata — values that only live on existing records
  // ('Legacy Status', 'aALL', 'Existing Owner') are NOT unioned in.
  assert.deepEqual(data.picklists.activityStatuses, [
    'Planned',
    'In Progress',
    'Complete',
  ]);
  assert.deepEqual(data.picklists.activityIndications, ['DLBCL', 'MM']);
  assert.deepEqual(data.picklists.accountableMembers, ['Commercial Lead', 'Market Access Lead']);
  assert.deepEqual(data.picklists.medicalTacticTitles, ['Mapped tactic']);
  assert.deepEqual(data.picklists.medicalTacticOptionsByParentTitle, {
    'open barrier': ['Mapped tactic'],
  });
  assert.deepEqual(data.barrierDriverOptions.map(({ id, status }) => ({ id, status })), [
    { id: 'bd-open', status: 'Open' },
    { id: 'bd-closed', status: 'Closed' },
  ]);
});

test('loadCriticalActivities inherits indication from linked Barrier/Driver when activity indication is blank', async () => {
  const { mod } = await loadCriticalActivitiesModule();
  globalThis.__criticalActivityRows = [
    {
      id: 'act-blank-indication',
      status: 'Planned',
      indication: '',
      barrierDriverId: 'bd-open',
      parentType: 'Barrier',
      isDeactivated: false,
    },
  ];

  const data = await mod.loadCriticalActivities();

  assert.equal(data.activities[0].indication, 'DLBCL');
  assert.equal(data.activities[0].parentName, 'Open barrier');
  assert.equal(data.sections[0].rows[0].indication, 'DLBCL');
});

test('completed Medical Tactics are not limited to the last 90 days', async () => {
  const { mod } = await loadCriticalActivitiesModule();
  globalThis.__criticalActivityRows = [
    {
      id: 'act-old-completed',
      status: 'Complete',
      indication: 'DLBCL',
      barrierDriverId: 'bd-open',
      completedDate: '2020-01-01',
      lastModifiedDate: '2020-01-02',
      isDeactivated: false,
    },
  ];

  const data = await mod.loadCriticalActivities();

  assert.equal(data.sections[1].title, 'Completed Medical Tactics');
  assert.deepEqual(data.sections[1].rows.map((row) => row.id), ['act-old-completed']);
});


test('Medical Tactics loader resolves tactic and linked opportunity labels while retaining edit values', async () => {
  const { mod } = await loadCriticalActivitiesModule();
  const opportunityApi = 'Strong Community Network | MM, DLBCL';
  const tacticApi = 'Navigator activity (Opp) | MM, DLBCL';
  globalThis.__criticalActivityParentPicklists = {
    driverTitleLabels: { [opportunityApi]: 'Community partnerships' },
  };
  globalThis.__criticalActivityPicklistLabels.KPH_Medical_Tactics__c.KPH_Medical_Tactics__c = {
    [tacticApi]: 'Identify a patient navigator',
  };
  globalThis.__criticalActivityBarrierDriverRows = [{
    id: 'opp', type: 'Driver', name: opportunityApi, indication: 'DLBCL', status: 'Open',
  }];
  globalThis.__criticalActivityRows = [{
    id: 'tactic', name: tacticApi, barrierDriverId: 'opp', indication: 'DLBCL', status: 'Planned',
  }];
  const data = await mod.loadCriticalActivities();
  assert.equal(data.activities[0].name, 'Identify a patient navigator');
  assert.equal(data.activities[0].nameValue, tacticApi);
  assert.equal(data.activities[0].parentName, 'Community partnerships');
  assert.equal(data.barrierDriverOptions[0].name, 'Community partnerships');
  assert.deepEqual(data.picklists.medicalTacticTitles, [tacticApi]);
});
