import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadSharedModule = async ({ veevaRuntime = false } = {}) => {
  globalThis.__referralMutationCalls = [];
  const queryStubUrl = dataModule(`
    export const runQuery = () => Promise.resolve([]);
    export const runCrmQuery = () => Promise.resolve([]);
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const getCrmDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => (row && row.raw) || row;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = (object, fields) => {
      globalThis.__referralMutationCalls.push({ type: 'local-create', object, fields });
      return Promise.resolve({ id: 'new-referral-id' });
    };
    export const createCrmRecord = (object, fields) => {
      globalThis.__referralMutationCalls.push({ type: 'crm-create', object, fields });
      return Promise.resolve({ id: 'new-referral-id' });
    };
    export const updateRecord = (object, id, fields, options = {}) => {
      globalThis.__referralMutationCalls.push({ type: 'update', object, id, fields, options });
      return Promise.resolve({ id });
    };
  `);
  const clientStubUrl = dataModule(`
    export const bindAccountPlanDataContext = () => {};
    export const hasVeevaRuntime = () => ${veevaRuntime};
    export const isOnline = () => false;
    export const isMockRuntime = () => ${!veevaRuntime};
  `);
  const approvalStubUrl = dataModule('export const acceptedApprovalReviewDate = () => null;');
  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalStubUrl}'`);
  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, calls: globalThis.__referralMutationCalls };
};

test('updateReferralAccount maps Aug-R2 fields and uses the live CRM update bridge', async () => {
  const { mod, calls } = await loadSharedModule({ veevaRuntime: true });
  await mod.updateReferralAccount('referral-001', {
    name: 'UCSF Medical Center', siteId: '00141000009HiduAAC', hcoClassification: 'Community Oncology',
    hcpTargetCount: '4', referralPriority: true, indication: 'DLBCL',
    comments: 'Keep this comment',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'update');
  assert.deepEqual(calls[0].options, { crm: true });
  assert.equal(calls[0].fields.KPH_Name_of_Site__c, '00141000009HiduAAC');
  assert.equal(calls[0].fields.KPH_of_HCP_Targets_within_a_Site__c, 4);
  assert.equal(calls[0].fields.KPH_Referral_Priority__c, true);
  assert.equal(calls[0].fields.Indication__c, 'DLBCL');
  assert.equal(Object.hasOwn(calls[0].fields, 'KPH_HCO_Classification__c'), false);
  assert.equal(Object.hasOwn(calls[0].fields, 'Name_of_Site__c'), false);
});

test('createReferralAccount creates the scoped row in CRM, not the local adapter', async () => {
  const { mod, calls } = await loadSharedModule({ veevaRuntime: true });
  await mod.createReferralAccount('plan-001', 'profile-001', {
    name: 'New Referral Site', siteId: '00141000009HiTtAAK', hcpTargetCount: 2, referralPriority: false,
    indication: 'MM', comments: 'New site',
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, 'crm-create');
  assert.equal(calls[0].object, mod.REFERRAL_ACCOUNT_OBJECT);
  assert.equal(calls[0].fields.Account_Plan_vod__c, 'plan-001');
  assert.equal(calls[0].fields.KPH_Account_Profile__c, 'profile-001');
  assert.equal(calls[0].fields.KPH_Name_of_Site__c, '00141000009HiTtAAK');
  assert.equal(Object.hasOwn(calls[0].fields, 'Name_of_Site__c'), false);
});

test('referral writes omit removed modal fields when they are not supplied', async () => {
  const { mod, calls } = await loadSharedModule({ veevaRuntime: true });
  await mod.updateReferralAccount('referral-001', {
    siteId: '00141000009HiduAAC', indication: 'DLBCL', comments: '',
  });

  assert.equal(Object.hasOwn(calls[0].fields, 'KPH_of_HCP_Targets_within_a_Site__c'), false);
  assert.equal(Object.hasOwn(calls[0].fields, 'KPH_Referral_Priority__c'), false);
});
