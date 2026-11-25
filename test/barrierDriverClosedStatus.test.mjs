import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const barriersDriversPagePath = new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url);
const overviewPagePath = new URL('../src/pages/Overview/index.jsx', import.meta.url);

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadSharedModule = async () => {
  globalThis.__barrierDriverMutationCalls = [];

  const queryStubUrl = dataModule(`
    export const runQuery = ({ object, where } = {}) => {
      if (object === 'RecordType') return Promise.resolve([
        { Id: 'org-barrier', DeveloperName: 'Barrier' },
        { Id: 'org-opportunity', DeveloperName: 'Opportunity' },
      ]);
      const id = String(where || '').match(/'([^']+)'/)?.[1] || 'bd-closed-001';
      return Promise.resolve([{
        Id: id,
        CreatedDate: '2026-09-25T00:00:00.000Z',
        RecordTypeId: 'org-barrier',
        KPH_Medical_Strategy__c: 'Expand Class Share',
      }]);
    };
    export const runCrmQuery = runQuery;
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const getCrmDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => (row && row.raw) || row;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = (object, fields) => {
      globalThis.__barrierDriverMutationCalls.push({ type: 'create', object, fields });
      return Promise.resolve({ id: 'new-bd-id' });
    };
    export const createCrmRecord = createRecord;
    export const updateRecord = (object, id, fields) => {
      globalThis.__barrierDriverMutationCalls.push({ type: 'update', object, id, fields });
      return Promise.resolve({ id });
    };
  `);
  const clientStubUrl = dataModule(`
    export const bindAccountPlanDataContext = () => {};
    export const hasVeevaRuntime = () => false;
    export const isMockRuntime = false;
    export const isOnline = () => false;
  `);
  const approvalReviewDateStubUrl = dataModule(`
    export const acceptedApprovalReviewDate = () => null;
  `);

  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalReviewDateStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, calls: globalThis.__barrierDriverMutationCalls };
};

test('toBarrierDriver treats CRM Complete status as UI Closed after reload', async () => {
  const { mod } = await loadSharedModule();

  const record = mod.toBarrierDriver({
    Id: 'bd-closed-001',
    KPH_Barrier_Title__c: 'Closed barrier',
    KPH_Indication__c: 'DLBCL',
    KPH_Medical_Tactical_Action_Status__c: 'Complete',
  });

  assert.equal(record.status, 'Closed');
});

test('Barrier and Opportunity status normalization uses the restricted Medical CRM values', async () => {
  const { mod } = await loadSharedModule();

  assert.equal(mod.normalizeBarrierDriverStatusForDisplay('Complete'), 'Closed');
  assert.equal(mod.normalizeBarrierDriverStatusForDisplay('Completed'), 'Closed');
  assert.equal(mod.isClosedBarrierDriverStatus('Complete'), true);
  assert.equal(mod.isClosedBarrierDriverStatus('Completed'), true);
  assert.equal(mod.normalizeBarrierDriverStatusForDisplay('At Risk'), 'At Risk');
  assert.equal(mod.normalizeBarrierDriverStatusForDisplay('Behind'), 'Behind');
  assert.equal(mod.normalizeBarrierDriverStatusForSave('Closed'), 'Complete');
  assert.equal(mod.normalizeBarrierDriverStatusForSave('Complete'), 'Complete');
  assert.equal(mod.normalizeBarrierDriverStatusForSave('In Progress'), 'In Progress');
  assert.equal(mod.normalizeBarrierDriverStatusForSave('At Risk'), 'At Risk');
  assert.equal(mod.normalizeBarrierDriverStatusForSave('Behind'), 'Behind');
  assert.equal(mod.normalizeBarrierDriverStatusForSave('Identified - Not Started'), null);
  assert.equal(mod.normalizeBarrierDriverStatusForSave('Near Outcome'), null);
  assert.deepEqual(mod.BARRIER_DRIVER_STATUS_ORDER, ['In Progress', 'At Risk', 'Behind', 'Closed']);
  assert.equal(
    mod.toBarrierDriver({
      Id: 'bd-completed-001',
      KPH_Barrier_Title__c: 'Completed barrier',
      KPH_Indication__c: 'DLBCL',
      KPH_Medical_Tactical_Action_Status__c: 'Complete',
    }).status,
    'Closed'
  );
});

test('updateBarrierDriver saves UI Closed status using CRM Complete picklist value', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.updateBarrierDriver('bd-closed-001', {
    type: 'Barrier',
    name: 'Closed barrier',
    status: 'Closed',
    indication: 'DLBCL',
    category: 'Clinical',
    businessImpact: 'Medium',
    strategy: 'Expand Class Share',
    comments: '',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].object, mod.BARRIER_DRIVER_OBJECT);
  assert.equal(calls[0].fields.KPH_Medical_Tactical_Action_Status__c, 'Complete');
});

test('Barrier create and edit payloads carry an indication-valid Opportunity title for offline sync', async () => {
  const { mod, calls } = await loadSharedModule();
  const form = {
    type: 'Barrier',
    name: 'Access barrier',
    status: 'In Progress',
    indication: 'DLBCL',
    strategy: 'Expand Class Share',
    comments: '',
    offlineOppositeTitleValue: 'Potential Kite Clinical Trial Site | MM, DLBCL',
  };

  await mod.createBarrierDriver('plan-001', form);
  await mod.updateBarrierDriver('bd-current-001', form);

  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.fields.KPH_Barrier_Title__c, 'Access barrier');
    assert.equal(
      call.fields.KPH_Opportunity_Title__c,
      'Potential Kite Clinical Trial Site | MM, DLBCL'
    );
  }
});

test('updateBarrierDriverStatus saves popup Closed selection as CRM Complete picklist value', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.updateBarrierDriverStatus('bd-closed-001', 'Closed');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].object, mod.BARRIER_DRIVER_OBJECT);
  assert.deepEqual(calls[0].fields, { KPH_Medical_Tactical_Action_Status__c: 'Complete' });
});

test('open critical activity counts ignore inactive activities', async () => {
  const { mod } = await loadSharedModule();

  assert.deepEqual(
    mod.buildOpenActivityCountByBarrier([
      { id: 'act-open', barrierDriverId: 'bd-001', status: 'Planned' },
      { id: 'act-inactive', barrierDriverId: 'bd-001', status: 'In Progress', isDeactivated: true },
      { id: 'act-complete', barrierDriverId: 'bd-001', status: 'Complete' },
      { id: 'act-driver', barrierDriverId: 'driver-001', status: 'In Progress' },
    ]),
    {
      'bd-001': 1,
      'driver-001': 1,
    }
  );
});

test('barrier and driver close saves are blocked while open critical activities exist', async () => {
  const barriersSource = await readFile(barriersDriversPagePath, 'utf8');
  const overviewSource = await readFile(overviewPagePath, 'utf8');

  for (const source of [barriersSource, overviewSource]) {
    assert.match(source, /closeBlockedByActivitiesMessage/);
    assert.match(source, /isClosedBarrierDriverStatus\(form\.status\)/);
    assert.match(source, /(openCountByBarrier|openActivityCountByBarrier)\[bdEditState\.record\.id\]/);
    assert.match(source, /openActivityCount > 0/);
    assert.match(source, /setBdError\(closeBlockedByActivitiesMessage/);
  }
});
