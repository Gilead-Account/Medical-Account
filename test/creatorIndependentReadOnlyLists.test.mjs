import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const loadSharedModule = async () => {
  globalThis.__ctamFilterQueries = [];
  const queryStubUrl = dataModule(`
    const users = [
      { Id: '005-ctam', Profile_Name_vod__c: 'KPH-CTAM' },
      { Id: '005-manager', Profile_Name_vod__c: 'KPH-CTAM Manager' },
      { Id: '005-readonly', Profile_Name_vod__c: 'KPH-CTAM-ReadOnly' },
      { Id: '005-msl', Profile_Name_vod__c: 'KPH-MSL-Platform' },
      { Id: '005-admin', Profile_Name_vod__c: 'System Administrator' },
    ];
    const query = (params) => {
      globalThis.__ctamFilterQueries.push(params);
      if (params.object === 'User') return Promise.resolve(users);
      if (params.object === 'KPH_Ecosystem_Plan__c') return Promise.resolve([{ Id: 'profile-001', KPH_Account_Plan__c: 'plan-001' }]);
      if (params.object === 'KPH_Stakeholder_Map__c') return Promise.resolve([
        { Id: 'stake-ctam', CreatedById: '005-ctam', KPH_Account__c: '001-ctam' },
        { Id: 'stake-manager', CreatedById: '005-manager', KPH_Account__c: '001-manager' },
        { Id: 'stake-readonly', CreatedById: '005-readonly', KPH_Account__c: '001-readonly' },
        { Id: 'stake-msl', CreatedById: '005-msl', KPH_Account__c: '001-msl' },
        { Id: 'stake-unknown', KPH_Account__c: '001-unknown' },
      ]);
      if (params.object === 'KPH_Ecosystem_Map_Dynamics__c') return Promise.resolve([
        { Id: 'ref-ctam', CreatedById: '005-ctam', KPH_Name_of_Site__c: '001-ctam' },
        { Id: 'ref-manager', CreatedById: '005-manager', KPH_Name_of_Site__c: '001-manager' },
        { Id: 'ref-msl', CreatedById: '005-msl', KPH_Name_of_Site__c: '001-msl' },
      ]);
      if (params.object === 'KPH_Other_Healthcare_Networks__c') return Promise.resolve([
        { Id: 'network-readonly', CreatedById: '005-readonly', KPH_Account_Name__c: '001-readonly' },
        { Id: 'network-admin', CreatedById: '005-admin', KPH_Account_Name__c: '001-admin' },
      ]);
      if (params.object === 'Account') return Promise.resolve([
        { Id: '001-ctam', Name: 'CTAM Account' },
        { Id: '001-manager', Name: 'Manager Account' },
        { Id: '001-readonly', Name: 'Read Only Account' },
      ]);
      return Promise.resolve([]);
    };
    export const runQuery = query;
    export const runCrmQuery = query;
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
    export const hasVeevaRuntime = () => true;
    export const isOnline = () => true;
    export const isMockRuntime = () => false;
  `);
  const approvalStubUrl = dataModule('export const acceptedApprovalReviewDate = () => null;');
  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalStubUrl}'`);
  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, queries: globalThis.__ctamFilterQueries };
};

test('Stakeholders includes all creators without querying user profiles', async () => {
  const { mod, queries } = await loadSharedModule();

  const rows = await mod.fetchStakeholders('plan-001');

  assert.deepEqual(rows.map((row) => row.id), [
    'stake-ctam',
    'stake-manager',
    'stake-readonly',
    'stake-msl',
    'stake-unknown',
  ]);
  const stakeholderQuery = queries.find((query) => query.object === mod.STAKEHOLDER_OBJECT);
  assert.ok(!stakeholderQuery.fields.includes('CreatedById'));
  assert.equal(queries.filter((query) => query.object === 'User').length, 0);
});

test('Referral & Dynamics includes all creators without querying user profiles', async () => {
  const { mod, queries } = await loadSharedModule();

  const result = await mod.fetchAccountProfileChildRecords('plan-001', 'profile-001');

  assert.deepEqual(result.referralAccounts.map((row) => row.id), ['ref-ctam', 'ref-manager', 'ref-msl']);
  assert.deepEqual(result.healthcareNetworks.map((row) => row.id), ['network-readonly', 'network-admin']);
  assert.ok(!mod.REFERRAL_ACCOUNT_FIELDS.includes('CreatedById'));
  assert.ok(!mod.HEALTHCARE_NETWORK_FIELDS.includes('CreatedById'));
  assert.equal(queries.filter((query) => query.object === 'User').length, 0);
});

test('Individual referral and healthcare loaders include all creators', async () => {
  const { mod, queries } = await loadSharedModule();
  const referrals = await mod.fetchReferralAccounts('plan-001', 'profile-001');
  const networks = await mod.fetchHealthcareNetworks('profile-001');
  assert.deepEqual(referrals.map((row) => row.id), ['ref-ctam', 'ref-manager', 'ref-msl']);
  assert.deepEqual(networks.map((row) => row.id), ['network-readonly', 'network-admin']);
  assert.equal(queries.filter((query) => query.object === 'User').length, 0);
});

test('Profile queries use only supported plan filters while stakeholders exclude deleted records', async () => {
  const { mod, queries } = await loadSharedModule();
  await mod.fetchStakeholders('plan-001');
  await mod.fetchCommercialAccountProfile('plan-001');
  await mod.fetchReferralDynamicsAccountProfile('plan-001');
  const scopedQueries = queries.filter(({ object }) =>
    ['KPH_Stakeholder_Map__c', 'KPH_Ecosystem_Plan__c'].includes(object)
  );
  assert.ok(scopedQueries.length >= 4);
  for (const query of scopedQueries) {
    if (query.object === 'KPH_Ecosystem_Plan__c') {
      assert.equal(query.where, "KPH_Account_Plan__c = 'plan-001'");
      assert.ok(!query.fields.includes('KPH_Is_Deleted__c'));
    } else {
      assert.equal(query.where, "KPH_Account_Plan__c = 'plan-001' AND (KPH_Is_Deleted__c = false OR KPH_Is_Deleted__c = null)");
    }
  }
});

test('Read-only profile queries do not run without a current plan', async () => {
  const { mod, queries } = await loadSharedModule();
  assert.equal(await mod.fetchCommercialAccountProfile(null), null);
  assert.equal(await mod.fetchReferralDynamicsAccountProfile(null), null);
  assert.deepEqual(queries, []);
});
