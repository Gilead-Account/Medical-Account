import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const barriersDriversPagePath = new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url);
const criticalActivitiesPagePath = new URL('../src/pages/CriticalActivities/index.jsx', import.meta.url);
const overviewPagePath = new URL('../src/pages/Overview/index.jsx', import.meta.url);
const urgentActivitiesPath = new URL('../src/pages/Overview/UrgentActivities.jsx', import.meta.url);
const newActivityModalPath = new URL('../src/pages/CriticalActivities/CriticalActivityNewModal.jsx', import.meta.url);
const editActivityModalPath = new URL('../src/pages/CriticalActivities/CriticalActivityEditModal.jsx', import.meta.url);
const linkedOptionsPath = new URL('../src/pages/CriticalActivities/linkedBarrierDriverOptions.js', import.meta.url);
const editModalCssPath = new URL('../src/styles/edit-modal.css', import.meta.url);

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadLinkedOptionsModule = async () => {
  const source = await readFile(linkedOptionsPath, 'utf8');
  return import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
};

const loadSharedModule = async ({ online = false, inaccessibleRecordTypeId = '' } = {}) => {
  globalThis.__criticalActivityMutationCalls = [];
  globalThis.__criticalActivityInaccessibleRecordTypeId = inaccessibleRecordTypeId;

  const queryStubUrl = dataModule(`
    export const runQuery = (params = {}) => {
      if (params.object === 'RecordType' && params.where.includes('KPH_Medical_Barrier_Tactical_Actions__c')) return Promise.resolve([
        { Id: '012VI00000GKwWWYA1', DeveloperName: 'Barrier' },
        { Id: '012VI00000GKwWXYA1', DeveloperName: 'Opportunity' },
      ]);
      if (params.object === 'RecordType') {
        return Promise.resolve([
          { Id: '012MedicalTacticBarrier', DeveloperName: 'Barrier', Name: 'Barrier' },
          { Id: '012MedicalTacticOpportunity', DeveloperName: 'Opportunities', Name: 'Opportunities' },
        ]);
      }
      const id = params.where?.match(/(?:^|[ (])Id = '([^']+)'/)?.[1];
      if (params.object === 'KPH_Medical_Tactics__c' && id) {
        return Promise.resolve([{ Id: id, KPH_Barrier_or_Opportunity__c: 'a2BDriver001' }]);
      }
      if (params.object === 'KPH_Medical_Barrier_Tactical_Actions__c' && id) {
        return Promise.resolve([{
          Id: id,
          CreatedDate: '2026-09-01T00:00:00.000Z',
          RecordTypeId: '012VI00000GKwWXYA1',
          KPH_Medical_Strategy__c: null,
        }]);
      }
      return Promise.resolve([]);
    };
    export const runCrmQuery = runQuery;
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const getCrmDataForCurrentObject = getDataForCurrentObject;
    export const unwrap = (row) => (row && row.raw) || row;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => {
      if (!id) return null;
      return String(id).length === 15 ? String(id) + 'XYZ' : String(id);
    };
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = (object, fields) => {
      globalThis.__criticalActivityMutationCalls.push({ type: 'create', object, fields });
      if (fields.RecordTypeId === globalThis.__criticalActivityInaccessibleRecordTypeId) {
        return Promise.reject({
          errors: {
            body: {
              output: {
                fieldErrors: {
                  RecordTypeId: [{
                    errorCode: 'INVALID_CROSS_REFERENCE_KEY',
                    field: 'RecordTypeId',
                  }],
                },
              },
            },
          },
        });
      }
      return Promise.resolve({ id: 'new-critical-activity-id' });
    };
    export const createCrmRecord = createRecord;
    export const updateRecord = (object, id, fields) => {
      globalThis.__criticalActivityMutationCalls.push({ type: 'update', object, id, fields });
      return Promise.resolve({ id });
    };
  `);
  const clientStubUrl = dataModule(`
    export const bindAccountPlanDataContext = () => {};
    export const hasVeevaRuntime = () => false;
    export const isMockRuntime = false;
    export const isOnline = () => ${online ? 'true' : 'false'};
  `);
  const approvalDateStubUrl = dataModule(`
    export const acceptedApprovalReviewDate = () => null;
  `);
  const utilsStubUrl = dataModule(`
    export const normalizeCrmBoolean = (value) => value === true || value === 1 || value === '1';
  `);

  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalDateStubUrl}'`)
    .replace(/from ['"]@\/lib\/helper\/utils['"]/g, `from '${utilsStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  await mod.fetchBarrierDriverRecordTypeIds();
  return { mod, calls: globalThis.__criticalActivityMutationCalls };
};

test('medical tactic create uses the approved object, title, and Barrier/Opportunity lookup fields', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.createCriticalActivity('plan-001', {
    title: 'Schedule care team follow-up',
    details: 'Confirm next step',
    indication: 'DLBCL',
    status: 'Planned',
    dueDate: '2026-06-30',
    parentId: 'a2BBarrier001',
    parentType: 'Barrier',
    parentRecordTypeId: mod.BARRIER_DRIVER_RECORD_TYPE_IDS.Barrier,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'create');
  assert.equal(calls[0].object, mod.CRITICAL_ACTIVITY_OBJECT);
  assert.ok(!Object.hasOwn(calls[0].fields, 'RecordTypeId'));
  assert.equal(calls[0].fields.KPH_Account_Plans__c, 'plan-001');
  assert.equal(calls[0].fields.KPH_Indication__c, 'DLBCL');
  assert.equal(calls[0].object, 'KPH_Medical_Tactics__c');
  assert.equal(calls[0].fields.KPH_Medical_Tactics__c, 'Schedule care team follow-up');
  assert.equal(calls[0].fields.KPH_Barrier_or_Opportunity__c, 'a2BBarrier001');
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Completion_Date__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Comments__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Inactive__c'));
});

test('created record ids are read from Veeva string and wrapped write responses', async () => {
  const { mod } = await loadSharedModule();

  assert.equal(mod.createdRecordIdFromWriteResult('a2B000000000001'), 'a2B000000000001');
  assert.equal(
    mod.createdRecordIdFromWriteResult({ result: 'a2B000000000002', savedFields: {} }),
    'a2B000000000002'
  );
  assert.equal(
    mod.createdRecordIdFromWriteResult({ data: { id: { value: 'a2B000000000003' } } }),
    'a2B000000000003'
  );
  assert.equal(mod.createdRecordIdFromWriteResult({ result: {} }), null);
});

test('medical tactic create does not rewrite a parent whose RecordTypeId is already correct', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.createCriticalActivity('plan-001', {
    title: 'Schedule care team follow-up',
    details: 'Confirm next step',
    indication: 'DLBCL',
    status: 'Planned',
    dueDate: '2026-06-30',
    parentId: 'a2BBarrier001',
    parentType: 'Barrier',
    parentRecordTypeId: mod.BARRIER_DRIVER_RECORD_TYPE_IDS.Barrier,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'create');
  assert.equal(calls[0].object, mod.CRITICAL_ACTIVITY_OBJECT);
  assert.ok(!Object.hasOwn(calls[0].fields, 'RecordTypeId'));
  assert.equal(calls[0].fields.KPH_Barrier_or_Opportunity__c, 'a2BBarrier001');
});

test('critical activity parent lookup uses the shared field for both parent types', async () => {
  const { mod } = await loadSharedModule();

  assert.equal(mod.criticalActivityParentLookupFieldFor('Barrier'), 'KPH_Barrier_or_Opportunity__c');
  assert.equal(mod.criticalActivityParentLookupFieldFor('Driver'), 'KPH_Barrier_or_Opportunity__c');
});

test('Opportunity medical tactic retries without an inaccessible explicit record type', async () => {
  const { mod, calls } = await loadSharedModule({
    inaccessibleRecordTypeId: '012MedicalTacticOpportunity',
  });

  await mod.createCriticalActivity('plan-001', {
    title: 'Assess opportunities to present data/clinical updates to CAR T department',
    details: 'Confirm next step',
    indication: 'DLBCL',
    status: 'Planned',
    dueDate: '2026-06-30',
    parentId: 'a2BOpportunity01',
    parentType: 'Driver',
    parentRecordTypeId: mod.BARRIER_DRIVER_RECORD_TYPE_IDS.Driver,
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0].fields.RecordTypeId, '012MedicalTacticOpportunity');
  assert.ok(!Object.hasOwn(calls[1].fields, 'RecordTypeId'));
  assert.equal(calls[1].fields.KPH_Barrier_or_Opportunity__c, 'a2BOpportunity01');
  assert.equal(
    calls[1].fields.KPH_Medical_Tactics__c,
    'Assess opportunities to present data/clinical updates to CAR T department'
  );
});

test('critical activity create rejects missing linked barrier or driver', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.createCriticalActivity('plan-001', {
      title: 'Unlinked follow-up',
      details: 'Should not save',
      status: 'Planned',
      dueDate: '2026-06-30',
    }),
    /Linked Barrier\/Opportunity is required/
  );

  assert.equal(calls.length, 0);
});

test('critical activity create rejects missing indication', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.createCriticalActivity('plan-001', {
      title: 'Schedule care team follow-up',
      details: 'Confirm next step',
      status: 'Planned',
      dueDate: '2026-06-30',
      parentId: 'a2BBarrier001',
      parentType: 'Barrier',
    }),
    /Indication is required/
  );

  assert.equal(calls.length, 0);
});

test('critical activity create rejects missing due date', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.createCriticalActivity('plan-001', {
      title: 'Schedule care team follow-up',
      details: 'Confirm next step',
      indication: 'DLBCL',
      status: 'Planned',
      parentId: 'a2BBarrier001',
      parentType: 'Barrier',
    }),
    /Due Date is required/
  );

  assert.equal(calls.length, 0);
});

test('critical activity create rejects titles over 255 characters', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.createCriticalActivity('plan-001', {
      title: 'x'.repeat(mod.CRITICAL_ACTIVITY_TITLE_MAX_LENGTH + 1),
      details: 'Should not save',
      indication: 'DLBCL',
      status: 'Planned',
      dueDate: '2026-06-30',
      parentId: 'a2BBarrier001',
      parentType: 'Barrier',
    }),
    /255 characters or fewer/
  );

  assert.equal(calls.length, 0);
});

test('critical activity create links Driver parent through the shared lookup', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.createCriticalActivity('plan-001', {
    title: 'Schedule care team follow-up',
    details: 'Confirm next step',
    indication: 'DLBCL',
    status: 'Planned',
    dueDate: '2026-06-30',
    parentId: 'a2BDriver001',
    parentType: 'Driver',
    parentRecordTypeId: mod.BARRIER_DRIVER_RECORD_TYPE_IDS.Driver,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'create');
  assert.equal(calls[0].object, mod.CRITICAL_ACTIVITY_OBJECT);
  assert.equal(calls[0].fields.RecordTypeId, '012MedicalTacticOpportunity');
  assert.equal(calls[0].fields.KPH_Barrier_or_Opportunity__c, 'a2BDriver001');
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Driver__c'));
});

test('medical tactic create rejects a parent type that conflicts with its RecordTypeId', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.createCriticalActivity('plan-001', {
      title: 'Schedule care team follow-up',
      details: 'Confirm next step',
      indication: 'DLBCL',
      status: 'Planned',
      dueDate: '2026-06-30',
      parentId: 'a2BDriver001',
      parentType: 'Barrier',
      parentRecordTypeId: mod.BARRIER_DRIVER_RECORD_TYPE_IDS.Driver,
    }),
    /Medical Opportunity, not a Medical Barrier/
  );

  assert.equal(calls.length, 0);
});

test('medical tactic create rejects a linked record outside the approved parent record types', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.createCriticalActivity('plan-001', {
      title: 'Schedule care team follow-up',
      details: 'Confirm next step',
      indication: 'DLBCL',
      status: 'Planned',
      dueDate: '2026-06-30',
      parentId: 'a2BOther001',
      parentType: 'Barrier',
      parentRecordTypeId: '012000000000000AAA',
    }),
    /must use the Medical Barrier or Medical Opportunity record type/
  );

  assert.equal(calls.length, 0);
});

test('critical activity mapper resolves wrapped shared parent lookup ids', async () => {
  const { mod } = await loadSharedModule();

  const activity = mod.toActivity({
    Id: 'act-driver-001',
    KPH_Medical_Tactics__c: 'Driver follow-up',
    KPH_Status__c: 'Planned',
    KPH_Barrier_or_Opportunity__c: {
      Id: { value: 'a2BDriver001' },
      Name: { value: 'Driver record' },
    },
  });

  assert.equal(activity.barrierDriverId, 'a2BDriver001');
  assert.equal(activity.parentType, null);
});

test('critical activity mapper caps activity title and detail fallback at 255 characters', async () => {
  const { mod } = await loadSharedModule();
  const longDetail = `Detail fallback ${'x'.repeat(300)}`;
  const longExistingTitle = `Existing title ${'y'.repeat(300)}`;

  const detailFallbackActivity = mod.toActivity({
    Id: 'act-detail-fallback',
    KPH_Medical_Tactics__c: '',
    KPH_Detail__c: longDetail,
    Name: 'CRM generated name',
  });
  const existingTitleActivity = mod.toActivity({
    Id: 'act-existing-title',
    KPH_Medical_Tactics__c: longExistingTitle,
    KPH_Detail__c: 'Detail text',
  });

  assert.equal(detailFallbackActivity.name, longDetail.slice(0, mod.CRITICAL_ACTIVITY_TITLE_MAX_LENGTH));
  assert.equal(existingTitleActivity.name, longExistingTitle.slice(0, mod.CRITICAL_ACTIVITY_TITLE_MAX_LENGTH));
});

test('critical activity mapper does not fall back to CRM Name for title', async () => {
  const { mod } = await loadSharedModule();

  const activity = mod.toActivity({
    Id: 'act-no-title',
    KPH_Medical_Tactics__c: '',
    KPH_Detail__c: '',
    Name: 'CRM generated name should not be shown',
  });

  assert.equal(activity.name, '');
});

test('critical activity update preserves parent when edit form has no parent field', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.updateCriticalActivity('act-001', {
    title: 'Updated title',
    details: 'Updated detail',
    status: 'In Progress',
    dueDate: '2026-06-30',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].object, mod.CRITICAL_ACTIVITY_OBJECT);
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Barrier_or_Opportunity__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Driver__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Completion_Date__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Comments__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Inactive__c'));
});

test('critical activity update ignores fields that are not part of the Medical Tactics schema', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.updateCriticalActivity('act-001', {
    title: 'Updated title',
    details: 'Updated detail',
    status: 'In Progress',
    dueDate: '2026-06-30',
    deactivate: true,
    comments: 'Not mapped',
    completedDate: '2026-06-29',
  });

  assert.equal(calls.length, 1);
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Inactive__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Comments__c'));
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Completion_Date__c'));
});

test('critical activity update rejects titles over 255 characters', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.updateCriticalActivity('act-001', {
      title: 'x'.repeat(mod.CRITICAL_ACTIVITY_TITLE_MAX_LENGTH + 1),
      details: 'Updated detail',
      status: 'In Progress',
      dueDate: '2026-06-30',
    }),
    /255 characters or fewer/
  );

  assert.equal(calls.length, 0);
});

test('critical activity update rejects missing due date', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.updateCriticalActivity('act-001', {
      title: 'Updated title',
      details: 'Updated detail',
      status: 'In Progress',
    }),
    /Due Date is required/
  );

  assert.equal(calls.length, 0);
});

test('critical activity update rejects explicit unlinked parent', async () => {
  const { mod, calls } = await loadSharedModule();

  await assert.rejects(
    () => mod.updateCriticalActivity('act-001', {
      title: 'Updated title',
      details: 'Updated detail',
      status: 'In Progress',
      dueDate: '2026-06-30',
      parentId: '',
    }),
    /Linked Barrier\/Opportunity is required/
  );

  assert.equal(calls.length, 0);
});

test('critical activity update relies on the accessible default child record type for a Barrier parent', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.updateCriticalActivity('act-001', {
    title: 'Updated title',
    details: 'Updated detail',
    status: 'In Progress',
    dueDate: '2026-06-30',
    parentId: 'a2BBarrier001',
    parentType: 'Barrier',
    parentRecordTypeId: mod.BARRIER_DRIVER_RECORD_TYPE_IDS.Barrier,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].object, mod.CRITICAL_ACTIVITY_OBJECT);
  assert.equal(calls[0].fields.KPH_Barrier_or_Opportunity__c, 'a2BBarrier001');
  assert.ok(!Object.hasOwn(calls[0].fields, 'RecordTypeId'));
});

test('critical activity update links Driver through the shared lookup', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.updateCriticalActivity('act-001', {
    title: 'Updated title',
    details: 'Updated detail',
    status: 'In Progress',
    dueDate: '2026-06-30',
    parentId: 'a2BDriver001',
    parentType: 'Driver',
    parentRecordTypeId: mod.BARRIER_DRIVER_RECORD_TYPE_IDS.Driver,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].object, mod.CRITICAL_ACTIVITY_OBJECT);
  assert.equal(calls[0].fields.KPH_Barrier_or_Opportunity__c, 'a2BDriver001');
  assert.equal(calls[0].fields.RecordTypeId, '012MedicalTacticOpportunity');
  assert.ok(!Object.hasOwn(calls[0].fields, 'KPH_Driver__c'));
});

test('critical activity delete carries existing Driver parent through required shared lookup', async () => {
  const { mod, calls } = await loadSharedModule();

  await mod.deleteCriticalActivity('act-001', {
    barrierDriverId: 'a2BDriver001',
    parentType: 'Driver',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].object, mod.CRITICAL_ACTIVITY_OBJECT);
  assert.equal(calls[0].fields[mod.ACTIVITY_SOFT_DELETE_FIELD], true);
  assert.equal(calls[0].fields.KPH_Barrier_or_Opportunity__c, 'a2BDriver001');
});

test('critical activity desktop delete canonicalizes 15-character record id for online updateRecord', async () => {
  const { mod, calls } = await loadSharedModule({ online: true });

  await mod.deleteCriticalActivity('a3C8C00000ABCDE', {
    barrierDriverId: 'a2BDriver001',
    parentType: 'Driver',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.equal(calls[0].id, 'a3C8C00000ABCDEXYZ');
  assert.equal(calls[0].fields[mod.ACTIVITY_SOFT_DELETE_FIELD], true);
  assert.equal(calls[0].fields.KPH_Barrier_or_Opportunity__c, 'a2BDriver001');
});

test('Barriers and Drivers activity modals carry parent link fields into save payloads', async () => {
  const pageSource = await readFile(barriersDriversPagePath, 'utf8');
  const criticalActivitiesPageSource = await readFile(criticalActivitiesPagePath, 'utf8');
  const overviewPageSource = await readFile(overviewPagePath, 'utf8');
  const urgentActivitiesSource = await readFile(urgentActivitiesPath, 'utf8');
  const newModalSource = await readFile(newActivityModalPath, 'utf8');
  const modalSource = await readFile(editActivityModalPath, 'utf8');

  assert.match(pageSource, /CriticalActivityNewModal/);
  assert.match(criticalActivitiesPageSource, /import CriticalActivityEditModal from '@\/pages\/CriticalActivities\/CriticalActivityEditModal'/);
  assert.match(pageSource, /import CriticalActivityEditModal from '@\/pages\/CriticalActivities\/CriticalActivityEditModal'/);
  assert.match(criticalActivitiesPageSource, /barrierDriverOptions=\{barrierDriverOptions\}/);
  assert.match(criticalActivitiesPageSource, /barrierDriverOptions=\{openBarrierDriverOptions\}/);
  assert.match(criticalActivitiesPageSource, /openBarrierDriverLookup\.has\(form\.parentId\)/);
  assert.match(criticalActivitiesPageSource, /onSave=\{\(form\) => handleSaveActivity\(editingActivity, form\)\}/);
  assert.match(pageSource, /setActivityCreateState\(\{ parentRecord: parentRecord \|\| null \}\)/);
  assert.match(pageSource, /openRecordById\.has\(form\.parentId\)/);
  assert.match(pageSource, /parentId: form\.parentId/);
  assert.match(pageSource, /parentType: form\.parentType/);
  assert.match(pageSource, /parentRecordTypeId: form\.parentRecordTypeId/);
  assert.match(
    pageSource,
    /recordValue\(result\?\.savedFields\?\.RecordTypeId\) \|\|[\s\S]*?BARRIER_DRIVER_RECORD_TYPE_IDS\[type\]/
  );
  assert.match(pageSource, /parentRecord=\{activityCreateState\.parentRecord\}/);
  assert.match(pageSource, /barrierDriverOptions=\{openBarrierDriverOptionsForActivity\}/);
  assert.match(pageSource, /onSave=\{handleCreateActivity\}/);
  assert.match(modalSource, /parentType: activity\?\.parentType \|\| parentRecord\?\.type \|\| ''/);
  assert.match(modalSource, /parentRecordTypeId: activity\?\.parentRecordTypeId \|\| parentRecord\?\.recordTypeId \|\| ''/);
  // Indication is inherited from the linked barrier/opportunity and shown read-only.
  assert.match(modalSource, /next\.indication = found \? \(found\.indication \|\| ''\)/);
  assert.match(modalSource, /Set by the linked barrier\/opportunity/);
  assert.match(modalSource, /Linked Barrier\/Opportunity is required/);
  assert.match(modalSource, /Indication is required/);
  assert.match(modalSource, /Due Date is required/);
  assert.match(modalSource, /name="criticalActivityDueDate"[\s\S]*?required/);
  assert.match(modalSource, /linkedBarrierDriverSelectOptions\(barrierDriverOptions,\s*form\.parentId\)/);
  assert.match(modalSource, /hidden=\{!!opt\.isCurrentClosedSelection\}/);
  assert.match(modalSource, /optionForId\(relatedOptions,\s*form\.parentId\)/);
  assert.match(modalSource, /value=\{form\.parentId\}[\s\S]*?disabled=\{isEdit \|\| !hasRelatedOptions\}/);
  assert.match(modalSource, /aria-disabled=\{isEdit \|\| !hasRelatedOptions\}/);
  assert.match(modalSource, /isOpenBarrierDriverOption/);
  assert.match(modalSource, /remainingFieldsDisabled/);
  assert.match(modalSource, /readOnly=\{remainingFieldsDisabled\}/);
  assert.match(modalSource, /disabled=\{remainingFieldsDisabled\}/);
  assert.match(modalSource, /disabled=\{isSaving \|\| remainingFieldsDisabled\}/);
  assert.match(newModalSource, /Linked Barrier\/Opportunity/);
  assert.match(newModalSource, /isOpenBarrierDriverOption/);
  assert.match(newModalSource, /Select an open linked Barrier\/Opportunity/);
  assert.match(newModalSource, /parentType: parentOption\?\.type \|\| ''/);
  assert.match(newModalSource, /parentRecordTypeId: parentOption\?\.recordTypeId \|\| ''/);
  // Indication is inherited from the selected barrier/opportunity and read-only.
  assert.match(newModalSource, /indication: parentOption\?\.indication \|\| ''/);
  assert.match(newModalSource, /next\.indication = found \? \(found\.indication \|\| ''\)/);
  assert.match(newModalSource, /Set by the linked barrier\/opportunity/);
  assert.match(newModalSource, /Medical Tactic, Linked Barrier\/Opportunity, Indication, and Due Date are required/);
  // Medical Tactic is now a controlled select in both create and edit flows,
  // so the old free-text maxLength assertion is no longer applicable. The
  // service-layer 255-character guard remains covered by the create/update
  // mapper tests above.
  assert.match(newModalSource, /mappedMedicalTacticOptions\.map/);
  assert.match(modalSource, /mappedMedicalTacticOptions\.map/);
  assert.doesNotMatch(modalSource, /label="Comments"/);
  assert.doesNotMatch(newModalSource, /label="Comments"/);
  assert.doesNotMatch(modalSource, /criticalActivityComments/);
  assert.doesNotMatch(modalSource, /name="criticalActivityDeactivate"/);
  assert.doesNotMatch(modalSource, />\s*Inactive\s*</);
  assert.match(modalSource, /Are you sure you want to delete this medical tactic\?/);
  assert.match(modalSource, />\s*Confirm Delete\s*</);
  assert.match(modalSource, /onDelete/);
  assert.match(criticalActivitiesPageSource, /criticalActivityClosedParentEditReason/);
  assert.match(criticalActivitiesPageSource, /editDisabledReason:\s*closedParentEditReason\(activity\)/);
  assert.match(criticalActivitiesPageSource, /disabled=\{isReadOnly \|\| !a\.id\}/);
  assert.doesNotMatch(criticalActivitiesPageSource, /disabled=\{isReadOnly \|\| !a\.id \|\| !!a\.editDisabledReason\}/);
  assert.match(pageSource, /criticalActivityClosedParentEditReason/);
  assert.match(pageSource, /editDisabledReason:\s*closedParentEditReason\(activity\)/);
  assert.doesNotMatch(pageSource, /disabled=\{isReadOnly \|\| !!activity\.editDisabledReason\}/);
  assert.match(overviewPageSource, /criticalActivityClosedParentEditReason/);
  assert.match(overviewPageSource, /editDisabledReason:\s*closedParentEditReason\(activity\)/);
  assert.match(overviewPageSource, /editDisabledReason=\{closedParentEditReason\(activityEditState\.activity\)\}/);
  assert.match(overviewPageSource, /barrierDriverOptions=\{allBarrierDriverRecords\}/);
  assert.match(overviewPageSource, /parentRecord=\{activityEditState\.parentRecord\}/);
  assert.doesNotMatch(urgentActivitiesSource, /disabled=\{!onEditActivity \|\| !!activity\.editDisabledReason\}/);
  assert.match(urgentActivitiesSource, /disabled=\{!onEditActivity \|\| activity\.legacyEditState === 'legacy'\}/);
});

test('locked critical activity fields are visibly grey', async () => {
  const modalSource = await readFile(editActivityModalPath, 'utf8');
  const cssSource = await readFile(editModalCssPath, 'utf8');

  assert.match(
    modalSource,
    /className=\{`stakeholder-edit-modal critical-activity-edit-modal bd-critical-activity-modal \$\{remainingFieldsDisabled \? 'is-fields-locked' : ''\} \$\{legacyMode \? 'is-legacy-record' : ''\}`\}/
  );
  assert.match(cssSource, /\.critical-activity-edit-modal\.is-fields-locked\s+input:read-only/);
  assert.match(cssSource, /\.critical-activity-edit-modal\.is-fields-locked\s+select:disabled/);
  assert.match(cssSource, /\.critical-activity-edit-modal\.is-fields-locked[\s\S]*?background:\s*#eef2f4;/);
  assert.match(cssSource, /\.critical-activity-edit-modal\.is-fields-locked[\s\S]*?color:\s*#6b7b86;/);
  assert.match(cssSource, /\.critical-activity-edit-modal\.is-fields-locked[\s\S]*?-webkit-text-fill-color:\s*#6b7b86;/);
});

test('critical activity edit clicks share the Critical Activities tab modal everywhere', async () => {
  const pageSource = await readFile(barriersDriversPagePath, 'utf8');
  const criticalActivitiesPageSource = await readFile(criticalActivitiesPagePath, 'utf8');
  const overviewPageSource = await readFile(overviewPagePath, 'utf8');
  const modalSource = await readFile(editActivityModalPath, 'utf8');

  assert.match(
    criticalActivitiesPageSource,
    /import CriticalActivityEditModal from '@\/pages\/CriticalActivities\/CriticalActivityEditModal'/
  );
  assert.doesNotMatch(
    criticalActivitiesPageSource,
    /import ActivityEditModal from '@\/pages\/BarriersDrivers\/ActivityEditModal'/
  );
  assert.match(pageSource, /import CriticalActivityEditModal from '@\/pages\/CriticalActivities\/CriticalActivityEditModal'/);
  assert.match(overviewPageSource, /import CriticalActivityEditModal from '@\/pages\/CriticalActivities\/CriticalActivityEditModal'/);
  assert.match(pageSource, /<CriticalActivityEditModal/);
  assert.match(criticalActivitiesPageSource, /<CriticalActivityEditModal/);
  assert.match(overviewPageSource, /<CriticalActivityEditModal/);
  assert.match(overviewPageSource, /barrierDriverOptions=\{allBarrierDriverRecords\}/);
  assert.match(overviewPageSource, /parentRecord=\{activityEditState\.parentRecord\}/);
  assert.match(modalSource, /Linked Barrier\/Opportunity/);
  assert.match(modalSource, /linkedBarrierDriverSelectOptions\(barrierDriverOptions,\s*form\.parentId\)/);
  assert.match(
    modalSource,
    /className=\{`stakeholder-edit-modal critical-activity-edit-modal bd-critical-activity-modal \$\{remainingFieldsDisabled \? 'is-fields-locked' : ''\} \$\{legacyMode \? 'is-legacy-record' : ''\}`\}/
  );
});

test('linked Barrier/Opportunity dropdown keeps a closed current parent only as the selected hidden value', async () => {
  const mod = await loadLinkedOptionsModule();
  const options = [
    { id: 'closed-current', type: 'Barrier', name: 'Closed current barrier', status: 'Closed' },
    { id: 'open-barrier', type: 'Barrier', name: 'Open barrier', status: 'In Progress' },
    { id: 'closed-other', type: 'Driver', name: 'Other closed driver', status: 'Close' },
    { id: 'open-driver', type: 'Driver', name: 'Open driver', status: 'Identified - Not Started' },
  ];

  assert.equal(mod.isOpenBarrierDriverOption(options[0]), false);
  assert.equal(mod.isOpenBarrierDriverOption(options[1]), true);

  assert.deepEqual(
    mod.linkedBarrierDriverSelectOptions(options, 'closed-current').map((option) => ({
      id: option.id,
      hidden: option.isCurrentClosedSelection === true,
    })),
    [
      { id: 'closed-current', hidden: true },
      { id: 'open-barrier', hidden: false },
      { id: 'open-driver', hidden: false },
    ]
  );

  assert.deepEqual(
    mod.linkedBarrierDriverSelectOptions(options, 'open-barrier').map((option) => option.id),
    ['open-barrier', 'open-driver']
  );

  assert.equal(
    mod.criticalActivityClosedParentEditReason({ barrierDriverId: 'closed-current', status: 'Planned' }, options[0]),
    'Reopen the linked Barrier/Opportunity before editing this medical tactic.'
  );
  assert.equal(
    mod.criticalActivityClosedParentEditReason({ barrierDriverId: 'closed-current', status: 'Complete' }, options[0]),
    'Reopen the linked Barrier/Opportunity before editing this medical tactic.'
  );
  assert.equal(
    mod.criticalActivityClosedParentEditReason({ barrierDriverId: 'closed-current', status: 'Completed' }, options[0]),
    'Reopen the linked Barrier/Opportunity before editing this medical tactic.'
  );
  assert.equal(
    mod.criticalActivityClosedParentEditReason({ barrierDriverId: 'open-barrier' }, options[1]),
    ''
  );
  assert.equal(
    mod.criticalActivityClosedParentEditReason({ barrierDriverId: '' }, null),
    ''
  );
  assert.equal(
    mod.criticalActivityClosedParentEditReason({ barrierDriverId: 'missing-parent' }, null),
    ''
  );
});

test('completed Barrier/Opportunity statuses behave as closed parents for medical tactic editing', async () => {
  const mod = await loadLinkedOptionsModule();
  const options = [
    { id: 'completed-current', type: 'Barrier', name: 'Completed current barrier', status: 'Completed' },
    { id: 'complete-other', type: 'Driver', name: 'Complete other driver', status: 'Complete' },
    { id: 'open-driver', type: 'Driver', name: 'Open driver', status: 'In Progress' },
  ];

  assert.equal(mod.isOpenBarrierDriverOption(options[0]), false);
  assert.equal(mod.isOpenBarrierDriverOption(options[1]), false);
  assert.equal(mod.isOpenBarrierDriverOption(options[2]), true);
  assert.deepEqual(
    mod.linkedBarrierDriverSelectOptions(options, 'completed-current').map((option) => ({
      id: option.id,
      hidden: option.isCurrentClosedSelection === true,
    })),
    [
      { id: 'completed-current', hidden: true },
      { id: 'open-driver', hidden: false },
    ]
  );
  assert.equal(
    mod.criticalActivityClosedParentEditReason(
      { barrierDriverId: 'completed-current', status: 'Planned' },
      options[0]
    ),
    'Reopen the linked Barrier/Opportunity before editing this medical tactic.'
  );
  assert.equal(
    mod.criticalActivityClosedParentEditReason(
      { barrierDriverId: 'completed-current', status: 'Complete' },
      options[0]
    ),
    'Reopen the linked Barrier/Opportunity before editing this medical tactic.'
  );
});
