import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadSharedModule = async () => {
  const queryStubUrl = dataModule(`
    export const runQuery = () => Promise.resolve([]);
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => (row && row.raw) || row;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = () => Promise.resolve({});
    export const updateRecord = () => Promise.resolve({});
  `);
  const clientStubUrl = dataModule('export const isOnline = () => false;');

  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`);

  return import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
};

test('account profile query maps regional dynamics to the exact CRM fields once', async () => {
  const mod = await loadSharedModule();

  assert.equal(
    mod.ACCOUNT_PROFILE_FIELDS.filter((field) => field === 'KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c').length,
    1
  );
  assert.equal(mod.ACCOUNT_PROFILE_FIELDS.includes('KPH_Region_Dynamics_To_Be_Aware_Of_DLBCL__c'), false);
  assert.equal(
    mod.ACCOUNT_PROFILE_FIELDS.filter((field) => field === 'KPH_Region_Dynamics_to_be_Aware_of_MM__c').length,
    1
  );
  assert.equal(mod.ACCOUNT_PROFILE_FIELDS.includes('KPH_Region_Dynamics_To_Be_Aware_Of_MM__c'), false);
});

test('toAccountProfile saves DLBCL regional edits back to the exact CRM field', async () => {
  const mod = await loadSharedModule();

  const profile = mod.toAccountProfile({
    Id: 'profile-001',
    KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c: 'Existing DLBCL notes',
  });

  assert.equal(profile.regionDynamicsDlbcl, 'Existing DLBCL notes');
  assert.equal(profile.regionDynamicsDlbclField, 'KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c');
});

test('toAccountProfile defaults blank DLBCL regional edits to the exact CRM field', async () => {
  const mod = await loadSharedModule();

  const profile = mod.toAccountProfile({
    Id: 'profile-001',
    KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c: '',
  });

  assert.equal(profile.regionDynamicsDlbcl, null);
  assert.equal(profile.regionDynamicsDlbclField, 'KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c');
});
