import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyPersistedMockRecord,
  isPersistedMockRecordDeleted,
  persistedMockRecords,
  persistMockRecordCreation,
  persistMockRecordDeletion,
  persistMockRecordUpdate,
} from '../src/lib/mockData/mockPersistence.js';

const storage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
};

test('mock records survive reload-style reads and retain later edits', () => {
  const localStorage = storage();
  persistMockRecordCreation('KPH_Medical_Barrier_Tactical_Actions__c', 'bd-new', {
    KPH_Account_Plan__c: 'plan-1',
    KPH_Barrier_Title__c: 'Training barrier',
  }, localStorage);
  persistMockRecordUpdate('KPH_Medical_Barrier_Tactical_Actions__c', 'bd-new', {
    KPH_Status__c: 'In Progress',
  }, localStorage);

  const created = persistedMockRecords('KPH_Medical_Barrier_Tactical_Actions__c', localStorage);
  assert.equal(created.length, 1);
  assert.equal(created[0].KPH_Barrier_Title__c, 'Training barrier');

  const hydrated = applyPersistedMockRecord(
    'KPH_Medical_Barrier_Tactical_Actions__c',
    Object.fromEntries(Object.entries(created[0]).map(([key, value]) => [key, { value }])),
    localStorage
  );
  assert.equal(hydrated.KPH_Status__c.value, 'In Progress');
});

test('mock delete tombstones survive reload-style reads', () => {
  const localStorage = storage();
  persistMockRecordDeletion('KPH_Stakeholder_Map__c', 'stk-1', localStorage);

  assert.equal(
    isPersistedMockRecordDeleted('KPH_Stakeholder_Map__c', 'stk-1', localStorage),
    true
  );
  assert.equal(
    isPersistedMockRecordDeleted('KPH_Stakeholder_Map__c', 'stk-2', localStorage),
    false
  );
});
