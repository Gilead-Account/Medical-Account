import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const beforeCutoff = '2026-09-24T23:59:59.000Z';
const afterFormerCutoff = '2027-01-15T00:00:00.000Z';
const barrierType = '012VI00000GKwWWYA1';
const opportunityType = '012VI00000GKwWXYA1';

const barrier = (extra = {}) => ({
  Id: 'barrier',
  CreatedDate: beforeCutoff,
  RecordTypeId: barrierType,
  KPH_Account_Plan__c: 'plan',
  KPH_Barrier_Title__c: 'Historical barrier',
  KPH_Indication__c: 'DLBCL',
  KPH_Medical_Strategy__c: null,
  KPH_Medical_Tactical_Action_Status__c: 'In Progress',
  KPH_Comments__c: 'Historical comment',
  ...extra,
});

const opportunity = (extra = {}) => ({
  ...barrier(),
  Id: 'opportunity',
  RecordTypeId: opportunityType,
  KPH_Barrier_Title__c: null,
  KPH_Opportunity_Title__c: 'Historical opportunity',
  ...extra,
});

const tactic = (extra = {}) => ({
  Id: 'tactic',
  CreatedDate: beforeCutoff,
  RecordTypeId: 'tactic-barrier-type',
  KPH_Account_Plans__c: 'plan',
  KPH_Barrier_or_Opportunity__c: 'barrier',
  KPH_Medical_Tactics__c: 'Historical tactic',
  KPH_Status__c: 'Planned',
  KPH_Detail__c: 'Historical detail',
  KPH_Indication__c: 'DLBCL',
  ...extra,
});

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
let sequence = 0;

const load = async (records = {}, recordTypes = [
  { Id: barrierType, DeveloperName: 'Barrier' },
  { Id: opportunityType, DeveloperName: 'Opportunity' },
]) => {
  const queryUrl = dataModule(`
    // isolated adapter ${sequence++}
    export const records = ${JSON.stringify(records)};
    export const queries = [], writes = [];
    export const recordTypes = ${JSON.stringify(recordTypes)};
    export const runQuery = async (params) => {
      queries.push(params);
      if (params.object === 'RecordType' && params.where.includes('KPH_Medical_Barrier_Tactical_Actions__c')) return recordTypes;
      if (params.object === 'RecordType') return [
        { Id: 'tactic-barrier-type', DeveloperName: 'Barrier' },
        { Id: 'tactic-opportunity-type', DeveloperName: 'Opportunities' },
      ];
      const id = params.where?.match(/(?:^|[ (])Id = '([^']+)'/)?.[1];
      if (id) return records[id] ? [records[id]] : [];
      return Object.values(records).filter((record) =>
        params.object === 'KPH_Medical_Tactics__c'
          ? Object.prototype.hasOwnProperty.call(record, 'KPH_Medical_Tactics__c')
          : Object.prototype.hasOwnProperty.call(record, 'KPH_Barrier_Title__c') ||
            Object.prototype.hasOwnProperty.call(record, 'KPH_Opportunity_Title__c')
      );
    };
    export const runCrmQuery = runQuery;
    export const getDataForCurrentObject = async () => null;
    export const getCrmDataForCurrentObject = getDataForCurrentObject;
    export const unwrap = (row) => row?.raw || row;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const updateRecord = async (object, id, fields) => {
      writes.push({ object, id, fields });
      if (records[id]) Object.assign(records[id], fields);
      return { id };
    };
    export const createRecord = async (object, fields) => {
      writes.push({ object, fields });
      return { id: 'new-id' };
    };
    export const createCrmRecord = createRecord;
  `);
  const clientUrl = dataModule(`
    export const bindAccountPlanDataContext = () => {};
    export const hasVeevaRuntime = () => false;
    export const isOnline = () => false;
    export const isMockRuntime = false;
  `);
  const source = (await readFile(new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url), 'utf8'))
    .replace("from '@/lib/dataservice/query'", `from '${queryUrl}'`)
    .replace("from '@/lib/dataservice/client'", `from '${clientUrl}'`);
  return { mod: await import(dataModule(source)), adapter: await import(queryUrl) };
};

test('legacy rule depends only on the Barrier plus blank-or-dash Strategy condition', async () => {
  const { mod } = await load();
  assert.equal(mod.medicalLegacyEditState(true), 'legacy');
  assert.equal(mod.medicalLegacyEditState(false), 'current');
  for (const value of [null, '', ' ', '-', '\u2013', '\u2014']) {
    assert.equal(mod.isMedicalLegacyStrategy(value), true);
  }
  assert.equal(mod.isMedicalLegacyStrategy('DLBCL Strategy'), false);
});

test('a blank-Strategy Barrier displays Closed and locked regardless of creation date', async () => {
  const fixtures = {
    barrier: barrier(),
    'stored-dash': barrier({ Id: 'stored-dash', KPH_Medical_Strategy__c: '-' }),
    'with-strategy': barrier({ Id: 'with-strategy', KPH_Medical_Strategy__c: 'Approved strategy' }),
    'after-former-cutoff': barrier({ Id: 'after-former-cutoff', CreatedDate: afterFormerCutoff }),
    opportunity: opportunity(),
  };
  const { mod } = await load(fixtures);
  const mapped = Object.fromEntries(Object.entries(fixtures).map(([id, row]) => [id, mod.toBarrierDriver(row)]));
  assert.equal(mapped.barrier.legacyEditState, 'legacy');
  assert.equal(mapped.barrier.status, 'Closed');
  assert.equal(mapped.barrier.canEditComments, false);
  assert.equal(mapped['stored-dash'].legacyEditState, 'legacy');
  assert.equal(mapped['with-strategy'].legacyEditState, 'current');
  assert.equal(mapped['after-former-cutoff'].legacyEditState, 'legacy');
  assert.equal(mapped.opportunity.legacyEditState, 'current');
  assert.equal(mapped.opportunity.status, 'In Progress');
});

test('linked tactics inherit Completed and read-only only from a legacy Barrier', async () => {
  const { mod } = await load();
  const baseTactic = mod.toActivity(tactic());
  const legacyParent = mod.toBarrierDriver(barrier());
  const currentBarrier = mod.toBarrierDriver(barrier({ KPH_Medical_Strategy__c: 'Approved strategy' }));
  const opportunityParent = mod.toBarrierDriver(opportunity());

  const legacy = mod.applyMedicalLegacyParentPolicy(baseTactic, legacyParent);
  assert.equal(legacy.legacyEditState, 'legacy');
  assert.equal(legacy.status, 'Complete');
  assert.equal(legacy.canDelete, false);
  assert.equal(legacy.canDeactivate, false);

  for (const parent of [currentBarrier, opportunityParent]) {
    const current = mod.applyMedicalLegacyParentPolicy(baseTactic, parent);
    assert.equal(current.legacyEditState, 'current');
    assert.equal(current.status, 'Planned');
  }
});

test('all Barrier mutation paths reject a legacy Barrier without writing', async () => {
  const { mod, adapter } = await load({ barrier: barrier() });
  await assert.rejects(
    mod.updateBarrierDriver('barrier', { status: 'Closed', comments: 'changed' }),
    /read-only/
  );
  await assert.rejects(mod.updateBarrierDriverStatus('barrier', 'Closed'), /read-only/);
  assert.equal(adapter.writes.length, 0);
});

test('tactic update and delete reject when the linked Barrier is legacy', async () => {
  const { mod, adapter } = await load({ barrier: barrier(), tactic: tactic() });
  await assert.rejects(
    mod.updateCriticalActivity('tactic', { status: 'Completed', details: 'changed' }),
    /read-only/
  );
  await assert.rejects(mod.deleteCriticalActivity('tactic'), /read-only/);
  assert.equal(adapter.writes.length, 0);
});

test('Opportunities and their linked tactics retain current write behavior', async () => {
  const fixtures = {
    opportunity: opportunity(),
    tactic: tactic({ KPH_Barrier_or_Opportunity__c: 'opportunity' }),
  };
  const { mod, adapter } = await load(fixtures);
  await mod.updateBarrierDriverStatus('opportunity', 'Closed');
  await mod.deleteCriticalActivity('tactic');
  assert.equal(adapter.writes.length, 2);
  assert.equal(adapter.writes[0].fields.KPH_Medical_Tactical_Action_Status__c, 'Complete');
  assert.equal(adapter.writes[1].fields.KPH_Is_Deleted__c, true);
});

test('missing creation date does not affect the strategy-based Barrier lock', async () => {
  const { mod, adapter } = await load({ barrier: barrier({ CreatedDate: null }) });
  await assert.rejects(mod.updateBarrierDriver('barrier', { status: 'Closed' }), /read-only/);
  assert.equal(adapter.writes.length, 0);
});


test('different org record types drive creation, mapping and legacy write protection', async () => {
  const types = [
    { Id: '012NEWBARRIER001', DeveloperName: 'Medical_Barrier' },
    { Id: '012NEWOPPORT001', DeveloperName: 'Medical_Opportunity' },
  ];
  const { mod, adapter } = await load({ barrier: barrier({ RecordTypeId: types[0].Id }) }, types);
  await mod.createBarrierDriver('plan', { type: 'Barrier', name: 'B', strategy: 'S' });
  await mod.createBarrierDriver('plan', { type: 'Driver', name: 'O' });
  assert.equal(adapter.writes[0].fields.RecordTypeId, types[0].Id);
  assert.equal(adapter.writes[1].fields.RecordTypeId, types[1].Id);
  assert.equal(mod.toBarrierDriver({ RecordTypeId: types[1].Id }).type, 'Driver');
  await assert.rejects(mod.updateBarrierDriverStatus('barrier', 'In Progress'), /read-only/);
  assert.equal(adapter.writes.length, 2);
  assert.equal(adapter.queries.filter(q => q.object === 'RecordType').length, 1);
});

test('missing or ambiguous metadata prevents writes; a later retry can recover', async () => {
  const { mod, adapter } = await load({}, []);
  await assert.rejects(mod.createBarrierDriver('plan', { type: 'Barrier' }), /unavailable/);
  assert.equal(adapter.writes.length, 0);
  adapter.recordTypes.push({ Id: 'new-b', DeveloperName: 'Barrier' }, { Id: 'new-o', DeveloperName: 'Opportunity' });
  await mod.createBarrierDriver('plan', { type: 'Barrier' });
  assert.equal(adapter.writes[0].fields.RecordTypeId, 'new-b');
  const duplicate = await load({}, [
    { Id: 'b1', DeveloperName: 'Barrier' }, { Id: 'b2', DeveloperName: 'Medical_Barrier' },
    { Id: 'o1', DeveloperName: 'Opportunity' },
  ]);
  await assert.rejects(duplicate.mod.createBarrierDriver('plan', {}), /Multiple/);
  assert.equal(duplicate.adapter.writes.length, 0);
});
