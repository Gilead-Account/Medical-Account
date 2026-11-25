import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadSharedModule = async ({
  veevaRuntime = true,
  online = false,
  rejectOptionalAccountFields = false,
} = {}) => {
  globalThis.__referralQueries = [];
  globalThis.__rejectReferralOptionalAccountFields = rejectOptionalAccountFields;
  const queryStubUrl = dataModule(`
    const query = (params, channel) => {
      globalThis.__referralQueries.push({ ...params, channel });
      if (params.object === 'KPH_Ecosystem_Map_Dynamics__c') return Promise.resolve([{
        Id: 'referral-001', Name: 'ED-1580', CreatedById: '005-ctam', Account_Plan_vod__c: 'plan-001',
        KPH_Account_Profile__c: 'profile-001', KPH_Name_of_Site__c: '00141000009HiduAAC',
        KPH_of_HCP_Targets_within_a_Site__c: 4, KPH_Referral_Priority__c: true,
        Indication__c: 'DLBCL'
      }]);
      if (params.object === 'KPH_Other_Healthcare_Networks__c') return Promise.resolve([]);
      if (params.object === 'User') return Promise.resolve([{
        Id: '005-ctam', Profile_Name_vod__c: 'KPH-CTAM'
      }]);
      if (
        globalThis.__rejectReferralOptionalAccountFields &&
        params.object === 'Account' &&
        params.fields.some((field) => !['Id', 'Name'].includes(field))
      ) return Promise.reject(new Error('optional Account field unavailable'));
      if (params.object === 'Account') return Promise.resolve([
        { Id: '00141000009HiduAAC', Name: 'UCSF Medical Center' },
        { Id: '00141000009HiTtAAK', Name: 'Selected Site' }
      ]);
      return Promise.resolve([]);
    };
    export const runQuery = (params) => query(params, 'local');
    export const runCrmQuery = (params) => query(params, 'crm');
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const getCrmDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => row || null;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = () => Promise.resolve({});
    export const createCrmRecord = () => Promise.resolve({});
    export const updateRecord = () => Promise.resolve({});
  `);
  const clientStubUrl = dataModule(`
    export const bindAccountPlanDataContext = () => {};
    export const hasVeevaRuntime = () => ${veevaRuntime};
    export const isOnline = () => ${online};
    export const isMockRuntime = () => ${!veevaRuntime};
  `);
  const approvalStubUrl = dataModule('export const acceptedApprovalReviewDate = () => null;');
  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalStubUrl}'`);
  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, queries: globalThis.__referralQueries };
};

test('Referral rows resolve KPH_Name_of_Site__c Account id to Account.Name using live CRM', async () => {
  const { mod, queries } = await loadSharedModule();
  const rows = await mod.fetchReferralAccounts('plan-001', 'profile-001');

  assert.equal(rows[0].name, 'UCSF Medical Center');
  assert.equal(rows[0].siteId, '00141000009HiduAAC');
  assert.equal(rows[0].hcpTargetCount, 4);
  assert.equal(rows[0].referralPriority, true);
  const referralQuery = queries.find((query) => query.object === mod.REFERRAL_ACCOUNT_OBJECT);
  assert.equal(referralQuery.channel, 'crm');
  assert.ok(referralQuery.fields.includes('KPH_Name_of_Site__c'));
  assert.equal(referralQuery.fields.includes('Name_of_Site__c'), false);
  const accountQuery = queries.find((query) => query.object === 'Account');
  assert.equal(accountQuery.channel, 'crm');
  assert.match(accountQuery.where, /00141000009HiduAAC/);
});

test('Site Name options query live Account records with Aug-R2 site filters', async () => {
  const { mod, queries } = await loadSharedModule();
  const options = await mod.searchSiteAccounts('Selected');
  assert.equal(options.some((option) => option.id === '00141000009HiTtAAK' && option.name === 'Selected Site'), true);
  const query = queries.find((entry) => entry.object === 'Account');
  assert.equal(query.channel, 'crm');
  assert.match(query.where, /RecordTypeId = '01241000000cF0GAAU'/);
  assert.match(query.where, /RecordTypeId = '01241000000mw9YAAQ'/);
  assert.match(query.where, /IsPersonAccount = false/);
  assert.match(query.where, /Name LIKE/);
  assert.equal(query.limit, 25);
});

test('Site Name lookup uses only offline-safe Account fields on iPad', async () => {
  const { mod, queries } = await loadSharedModule({
    online: false,
    rejectOptionalAccountFields: true,
  });

  const options = await mod.searchSiteAccounts('Selected');

  const accountQueries = queries.filter((entry) => entry.object === 'Account');
  assert.equal(accountQueries.length, 1);
  assert.equal(accountQueries[0].channel, 'crm');
  assert.deepEqual(accountQueries[0].fields, ['Id', 'Name']);
  assert.equal(options.some((option) => option.id === '00141000009HiTtAAK' && option.name === 'Selected Site'), true);
});

test('Site Name lookup retries required Account fields when desktop optional fields are inaccessible', async () => {
  const { mod, queries } = await loadSharedModule({
    online: true,
    rejectOptionalAccountFields: true,
  });

  const options = await mod.searchSiteAccounts('Selected');

  const accountQueries = queries.filter((entry) => entry.object === 'Account');
  assert.equal(accountQueries.length, 2);
  assert.ok(accountQueries[0].fields.includes('EID_GILD__c'));
  assert.deepEqual(accountQueries[1].fields, ['Id', 'Name']);
  assert.equal(options.some((option) => option.id === '00141000009HiTtAAK' && option.name === 'Selected Site'), true);
});

test('combined Referral & Dynamics loader displays Account.Name for the saved lookup id', async () => {
  const { mod, queries } = await loadSharedModule();
  const result = await mod.fetchAccountProfileChildRecords('plan-001', 'profile-001');

  assert.equal(result.referralAccounts[0].siteId, '00141000009HiduAAC');
  assert.equal(result.referralAccounts[0].name, 'UCSF Medical Center');
  assert.equal(queries.filter((query) => query.object === 'Account').length, 1);
});
