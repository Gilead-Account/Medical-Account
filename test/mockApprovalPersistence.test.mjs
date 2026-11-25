import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyPersistedMockRecord,
  clearPersistedMockRecordFields,
  persistMockRecordUpdate,
} from '../src/lib/mockData/mockPersistence.js';

const memoryStorage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
};

test('local FD approval persists the current review date for an MSL reload', () => {
  const storage = memoryStorage();
  const object = 'Account_Plan_vod__c';
  const id = 'plan-001';
  const fixture = {
    Id: { value: id },
    KPH_Medical_Approval_Status__c: { value: 'Draft' },
    KPH_Medical_Submitter_Name__c: { value: 'MSL User' },
    KPH_Last_FD_Review_date__c: { value: '2026-04-15' },
  };

  persistMockRecordUpdate(object, id, {
    KPH_Medical_Approval_Status__c: 'Approved',
    KPH_Medical_Submitter_Name__c: '',
    KPH_Last_FD_Review_date__c: '2026-08-04',
    LastModifiedDate: '2026-08-04T14:30:00.000Z',
  }, storage);

  const reloadedRecord = applyPersistedMockRecord(object, fixture, storage);
  assert.equal(reloadedRecord.KPH_Medical_Approval_Status__c.value, 'Approved');
  assert.equal(reloadedRecord.KPH_Medical_Submitter_Name__c.value, '');
  assert.equal(reloadedRecord.KPH_Last_FD_Review_date__c.value, '2026-08-04');
  assert.equal(reloadedRecord.LastModifiedDate.value, '2026-08-04T14:30:00.000Z');
});

test('subsequent local account-plan updates retain the persisted review date', () => {
  const storage = memoryStorage();
  const object = 'Account_Plan_vod__c';
  const id = 'plan-001';

  persistMockRecordUpdate(object, id, {
    KPH_Last_FD_Review_date__c: '2026-08-04',
  }, storage);
  persistMockRecordUpdate(object, id, {
    KPH_Is_Submitted__c: true,
  }, storage);

  const reloadedRecord = applyPersistedMockRecord(object, { Id: { value: id } }, storage);
  assert.equal(reloadedRecord.KPH_Last_FD_Review_date__c.value, '2026-08-04');
  assert.equal(reloadedRecord.KPH_Is_Submitted__c.value, true);
});

test('FD demo reset clears approval fields without removing other mock edits', () => {
  const storage = memoryStorage();
  const object = 'Account_Plan_vod__c';
  const id = 'plan-001';

  persistMockRecordUpdate(object, id, {
    KPH_Medical_Approval_Status__c: 'Approved',
    KPH_Medical_Submitter_Name__c: '',
    KPH_Last_FD_Review_date__c: '2026-08-07',
    KPH_ATC_Strategic_Opportunities__c: 'Keep this training edit',
  }, storage);
  clearPersistedMockRecordFields(object, id, [
    'KPH_Medical_Approval_Status__c',
    'KPH_Medical_Submitter_Name__c',
    'KPH_Last_FD_Review_date__c',
  ], storage);

  const record = applyPersistedMockRecord(object, {
    Id: { value: id },
    KPH_Medical_Approval_Status__c: { value: 'Draft' },
  }, storage);
  assert.equal(record.KPH_Medical_Approval_Status__c.value, 'Draft');
  assert.equal(record.KPH_Last_FD_Review_date__c, undefined);
  assert.equal(
    record.KPH_ATC_Strategic_Opportunities__c.value,
    'Keep this training edit'
  );
});
