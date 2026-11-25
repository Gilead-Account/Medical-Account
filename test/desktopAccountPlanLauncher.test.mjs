import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const launcherModulePath = new URL('../src/lib/dataservice/accountPlan/accountPlanLauncher.js', import.meta.url);
const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const appPath = new URL('../src/App.jsx', import.meta.url);
const sidebarPath = new URL('../src/components/Sidebar.jsx', import.meta.url);
const sidebarStylePath = new URL('../src/components/Sidebar.css', import.meta.url);
const launcherComponentPath = new URL('../src/components/AccountPlanLauncher.jsx', import.meta.url);
const mainStylePath = new URL('../src/styles/main.css', import.meta.url);
const fixturesModulePath = new URL('../src/lib/mockData/fixtures.js', import.meta.url);

const loadLauncherModule = async ({
  failRelationshipQuery = false,
  deferSupportingQueries = false,
  invalidSecondAccount = false,
  omitSecondAccount = false,
  secondHospitalType = 'Authorized Treatment Center',
} = {}) => {
  globalThis.__accountPlanLauncherCalls = [];
  globalThis.__launcherSecondHospitalType = secondHospitalType;
  globalThis.__accountPlanLauncherFailRelationshipQuery = failRelationshipQuery;
  globalThis.__accountPlanLauncherDeferSupportingQueries = deferSupportingQueries;
  globalThis.__accountPlanLauncherInvalidSecondAccount = invalidSecondAccount;
  globalThis.__accountPlanLauncherOmitSecondAccount = omitSecondAccount;
  globalThis.__accountPlanLauncherSupportingResolvers = [];

  const queryStubUrl = dataModule(`
    export const runQuery = (params) => {
      globalThis.__accountPlanLauncherCalls.push(params);
      if (params.object === 'Account_Plan_vod__c') {
        if (params.allowDottedFields && globalThis.__accountPlanLauncherFailRelationshipQuery) {
          return Promise.reject(new Error('relationship query unsupported'));
        }
        const planRows = [
          {
            Id: 'a0C6T000012cTbNUAU',
            Name: 'UC SAN FRANCISCO - BENIOFF Account Plan',
            OwnerId: '00541000003OwnerA',
            Owner: { Name: 'Plan Owner', FirstName: 'Plan', LastName: 'Owner' },
            'Owner.Name': 'Plan Owner',
            'Owner.FirstName': 'Plan',
            'Owner.LastName': 'Owner',
            Account_vod__c: '0018C00000MAccountA',
            KPH_ATC_EID__c: '40282237',
            KPH_ATC_Certified_Date__c: '2022-06-24',
            KPH_Plan_status__c: 'Active',
            KPH_Territory__c: 'CT1005',
            KPH_Territory_Description__c: 'Upstate NY',
            KPH_Last_FD_Review_date__c: '2026-07-07',
            KPH_Medical_Submitted_Date__c: null,
          },
          {
            Id: 'a0C6T000012cOwnUAU',
            Name: 'Owner Only Account Plan',
            OwnerId: '00541000003ISO0AAO',
            Owner: { Name: 'Current User Owner', FirstName: 'Current', LastName: 'User Owner' },
            'Owner.Name': 'Current User Owner',
            'Owner.FirstName': 'Current',
            'Owner.LastName': 'User Owner',
            Account_vod__c: '0018C00000MAccountB',
            KPH_ATC_EID__c: '40282238',
            KPH_ATC_Certified_Date__c: '2023-01-15',
            KPH_Plan_status__c: 'Potential ATC',
            KPH_Territory__c: 'CT1006',
            KPH_Territory_Description__c: 'Downstate NY',
            KPH_Last_FD_Review_date__c: null,
            KPH_Medical_Submitted_Date__c: '2026-07-03',
          },
        ];
        const filteredRows = planRows.filter((row) => {
          if (params.where?.includes('Account_vod__r.Hospital_Type__c')) {
            return row.Id !== 'a0C6T000012cOwnUAU' || (
              !globalThis.__accountPlanLauncherInvalidSecondAccount &&
              globalThis.__launcherSecondHospitalType === 'Authorized Treatment Center'
            );
          }
          return !params.where || params.where.includes(row.Id);
        });
        return Promise.resolve(filteredRows.map((row) => Object.fromEntries(
          (params.fields || Object.keys(row))
            .filter((field) => Object.prototype.hasOwnProperty.call(row, field))
            .map((field) => [field, row[field]])
        )));
      }
      if (
        globalThis.__accountPlanLauncherDeferSupportingQueries &&
        ['User', 'Account', 'KPH_Ecosystem_Plan__c'].includes(params.object)
      ) {
        return new Promise((resolve) => {
          globalThis.__accountPlanLauncherSupportingResolvers.push(() => {
            globalThis.__accountPlanLauncherDeferSupportingQueries = false;
            resolve(runQuery(params));
          });
        });
      }
      if (params.object === 'Account') {
        return Promise.resolve([
          {
            Id: '0018C00000MAccountA',
            KPH_MM_ATC_Priority__c: 'P2',
            KPH_Market_Access_Prioritized_Account__c: 'No',
            Hospital_Type__c: 'Authorized Treatment Center',
            Customer_Master_Status_vod__c: 'Valid_vod',
          },
          {
            Id: '0018C00000MAccountB',
            KPH_MM_ATC_Priority__c: 'P1',
            KPH_Market_Access_Prioritized_Account__c: 'Yes',
            Hospital_Type__c: 'Authorized Treatment Center',
            Customer_Master_Status_vod__c: globalThis.__accountPlanLauncherInvalidSecondAccount
              ? 'Invalid_vod'
              : 'Valid_vod',
          },
        ].filter((row) =>
          !globalThis.__accountPlanLauncherOmitSecondAccount || row.Id !== '0018C00000MAccountB'
        ));
      }
      if (params.object === 'KPH_Ecosystem_Plan__c') {
        return Promise.resolve([
          {
            Id: 'profile-older',
            KPH_Account_Plan__c: 'a0C6T000012cTbNUAU',
            KPH_ATC_Cohort__c: 'Older Cohort',
            LastModifiedDate: '2026-06-01T12:00:00Z',
          },
          {
            Id: 'profile-newer',
            KPH_Account_Plan__c: 'a0C6T000012cTbNUAU',
            KPH_ATC_Cohort__c: 'DLBCL Cohort 2',
            LastModifiedDate: '2026-07-01T12:00:00Z',
          },
          {
            Id: 'profile-owner',
            KPH_Account_Plan__c: 'a0C6T000012cOwnUAU',
            KPH_ATC_Cohort__c: 'DLBCL Cohort 1',
            LastModifiedDate: '2026-07-02T12:00:00Z',
          },
        ]);
      }
      if (params.object === 'Account_Team_Member_vod__c') {
        return Promise.resolve([
          {
            Id: 'team-member-1',
            Account_Plan_vod__c: 'a0C6T000012cTbNUAU',
            Team_Member_vod__c: '00541000003ISO0AAO',
          },
        ]);
      }
      if (params.object === 'User') {
        return Promise.resolve([
          { Id: '00541000003OwnerA', Name: 'Plan Owner', FirstName: 'Plan', LastName: 'Owner' },
          { Id: '00541000003ISO0AAO', Name: 'Current User Owner', FirstName: 'Current', LastName: 'User Owner' },
          { Id: '005VI00000YlgEjYAJ', Name: 'Jordan Myint' },
        ]);
      }
      return Promise.resolve([]);
    };
    export const runCrmQuery = runQuery;
    export const getCrmDataForCurrentObject = (object, field) =>
      object === 'User' && field === 'Id'
        ? Promise.resolve('00541000003ISO0AAO')
        : Promise.resolve(null);
    export const getDataForCurrentObject = (object, field) =>
      object === 'User' && field === 'Id'
        ? Promise.resolve('00541000003ISO0AAO')
        : Promise.resolve(null);
    export const unwrap = (row) => row || null;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const inClause = (values) => '(' + (values || []).map((value) => "'" + value + "'").join(',') + ')';
  `);

  const source = (await readFile(launcherModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, calls: globalThis.__accountPlanLauncherCalls };
};

const loadSharedModule = async () => {
  globalThis.__desktopContextCalls = [];

  const queryStubUrl = dataModule(`
    export const runQuery = (params) => {
      globalThis.__desktopContextCalls.push(params);
      if (params.object === 'Account_Plan_vod__c') {
        const selected = String(params.where || '').includes('a0C6T000012cTbNUAU')
          ? 'a0C6T000012cTbNUAU'
          : 'a0CSu00004IpVE7MAN';
        return Promise.resolve([
          {
            Id: selected,
            Name: selected === 'a0C6T000012cTbNUAU'
              ? 'UC SAN FRANCISCO - BENIOFF Account Plan'
              : 'ACT Plan 009',
            OwnerId: '00541000003ISO0AAO',
            LastModifiedDate: '2026-06-12T12:00:00Z',
            Account_vod__c: '0018C00000MAccount',
          },
        ]);
      }
      if (params.object === 'Account') {
        return Promise.resolve([{ Id: '0018C00000MAccount', Name: 'Mock Account' }]);
      }
      return Promise.resolve([]);
    };
    export const runCrmQuery = runQuery;
    export const getCrmDataForCurrentObject = () => Promise.resolve(null);
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => row || null;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = () => Promise.resolve({ data: { id: 'new-record-id' } });
    export const createCrmRecord = createRecord;
    export const updateRecord = () => Promise.resolve({ data: { id: 'record-id' } });
  `);
  const clientStubUrl = dataModule(`
    export const isOnline = () => false;
    export const bindAccountPlanDataContext = (id) => id;
    export const isMockRuntime = false;
    export const hasVeevaRuntime = () => true;
  `);
  const approvalDateStubUrl = dataModule(`
    export const acceptedApprovalReviewDate = (_status, date) => date || null;
  `);

  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalDateStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, calls: globalThis.__desktopContextCalls };
};

const loadHybridSharedModule = async ({ currentPlanId = null } = {}) => {
  globalThis.__hybridContextCalls = [];
  globalThis.__hybridCurrentPlanId = currentPlanId;
  const queryStubUrl = dataModule(`
    const recordCall = (source, params) => globalThis.__hybridContextCalls.push({ source, ...params });
    export const runQuery = (params) => {
      recordCall('mock', params);
      if (params.object === 'Account_Plan_vod__c') {
        return Promise.resolve([{
          Id: 'a0C6T000012cTbNUAU',
          KPH_ATC_Strategic_Opportunities__c: 'Mock Medical goal',
          KPH_ATC_Profile_Category__c: 'Academic ATC',
          KPH_Approval_Status__c: 'Draft',
          KPH_Is_Submitted__c: false,
        }]);
      }
      return Promise.resolve([]);
    };
    export const runCrmQuery = (params) => {
      recordCall('crm', params);
      if (params.object === 'Account_Plan_vod__c') {
        return Promise.resolve([{
          Id: 'a0C6T000012cTbNUAU',
          Name: 'Real Medical Account Plan',
          Account_vod__c: '0018C00000MAccount',
          KPH_Territory__c: 'REAL-TERRITORY',
          KPH_Territory_Description__c: 'Real Territory Description',
          LastModifiedDate: '2026-08-07T12:00:00Z',
        }]);
      }
      if (params.object === 'Account') {
        return Promise.resolve([{
          Id: '0018C00000MAccount',
          Name: 'Real Parent Account',
          EID_GILD__c: 'REAL-EID',
          Territory_vod__c: 'REAL-ACCOUNT-TERRITORY',
        }]);
      }
      return Promise.resolve([]);
    };
    export const getCrmDataForCurrentObject = (object, field) => {
      globalThis.__hybridContextCalls.push({ source: 'crm-context', object, field });
      return Promise.resolve(
        object === 'AccountPlan' && field === 'Id'
          ? globalThis.__hybridCurrentPlanId
          : null
      );
    };
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => row || null;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => id || null;
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = () => Promise.resolve({ data: { id: 'new-record-id' } });
    export const createCrmRecord = createRecord;
    export const updateRecord = () => Promise.resolve({ data: { id: 'record-id' } });
  `);
  const clientStubUrl = dataModule(`
    export const bindAccountPlanDataContext = (id) => id;
    export const isOnline = () => false;
    export const isMockRuntime = true;
    export const hasVeevaRuntime = () => true;
  `);
  const approvalDateStubUrl = dataModule(`
    export const acceptedApprovalReviewDate = (_status, date) => date || null;
  `);
  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalDateStubUrl}'`);
  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, calls: globalThis.__hybridContextCalls };
};

test('fetchCurrentUserAccountPlans lists Salesforce-visible Account Plans linked to valid ATCs', async () => {
  const { mod, calls } = await loadLauncherModule();

  const rows = await mod.fetchCurrentUserAccountPlans();

  assert.equal(calls[0].object, 'Account_Plan_vod__c');
  assert.equal(calls[0].where, "Account_vod__r.Hospital_Type__c = 'Authorized Treatment Center' AND Account_vod__r.Customer_Master_Status_vod__c = 'Valid_vod'");
  assert.equal(calls[0].limit, undefined);
  assert.deepEqual(calls[0].fields, ['Id', 'Name', 'Account_vod__c']);
  assert.equal(calls[0].allowDottedFields, undefined);
  const planOptionalQuery = calls.find((call, index) =>
    index > 0 && call.object === 'Account_Plan_vod__c' && call.fields.includes('KPH_Territory__c')
  );
  assert.ok(planOptionalQuery);
  assert.match(planOptionalQuery.where, /a0C6T000012cTbNUAU/);
  const accountQuery = calls.find((call) =>
    call.object === 'Account' && call.fields.includes('KPH_MM_ATC_Priority__c')
  );
  const profileQuery = calls.find((call) => call.object === 'KPH_Ecosystem_Plan__c');
  assert.deepEqual(accountQuery.fields, [
    'Id',
    'KPH_MM_ATC_Priority__c',
    'KPH_Market_Access_Prioritized_Account__c',
  ]);
  assert.match(accountQuery.where, /0018C00000MAccountA/);
  assert.match(accountQuery.where, /0018C00000MAccountB/);
  assert.doesNotMatch(accountQuery.where, /Hospital_Type__c/);
  assert.doesNotMatch(accountQuery.where, /Customer_Master_Status_vod__c/);
  const userQuery = calls.find((call) => call.object === 'User');
  assert.deepEqual(userQuery.fields, ['Id', 'Name', 'FirstName', 'LastName']);
  assert.match(userQuery.where, /00541000003OwnerA/);
  assert.ok(calls.filter((call) => call.object === 'Account_Plan_vod__c')
    .every((call) => call.fields.every((field) => !field.includes('.'))));
  assert.ok(calls.filter((call) => call.object === 'Account_Plan_vod__c')
    .some((call) => call.fields.includes('KPH_Last_FD_Review_date__c')));
  assert.deepEqual(profileQuery.fields, [
    'Id',
    'KPH_Account_Plan__c',
    'KPH_ATC_Cohort__c',
    'LastModifiedDate',
  ]);
  assert.match(profileQuery.where, /a0C6T000012cTbNUAU/);
  assert.match(profileQuery.where, /a0C6T000012cOwnUAU/);
  assert.equal(calls.some((call) => call.object === 'Account_Team_Member_vod__c'), false);
  assert.deepEqual(rows, [
    {
      id: 'a0C6T000012cOwnUAU',
      name: 'Owner Only Account Plan',
      eid: '40282238',
      ownerName: 'Current User Owner',
      ownerFirstName: 'Current',
      ownerLastName: 'User Owner',
      marketAccessPrioritizedAccount: 'Yes',
      mmAtcPriorityAccount: 'P1',
      atcCohortDlbcl: 'DLBCL Cohort 1',
      atcCertifiedDate: '2023-01-15',
      planStatus: 'Potential ATC',
      territory: 'CT1006',
      territoryDescription: 'Downstate NY',
      lastFieldDirectorReviewDate: null,
      submittedDate: '2026-07-03',
    },
    {
      id: 'a0C6T000012cTbNUAU',
      name: 'UC SAN FRANCISCO - BENIOFF Account Plan',
      eid: '40282237',
      ownerName: 'Plan Owner',
      ownerFirstName: 'Plan',
      ownerLastName: 'Owner',
      marketAccessPrioritizedAccount: 'No',
      mmAtcPriorityAccount: 'P2',
      atcCohortDlbcl: 'DLBCL Cohort 2',
      atcCertifiedDate: '2022-06-24',
      planStatus: 'Active',
      territory: 'CT1005',
      territoryDescription: 'Upstate NY',
      lastFieldDirectorReviewDate: '2026-07-07',
      submittedDate: null,
    },
  ]);
});

test('fetchCurrentUserAccountPlans resolves owners by User without relationship fields', async () => {
  const { mod, calls } = await loadLauncherModule({ failRelationshipQuery: true });

  const originalWarn = console.warn;
  console.warn = () => {};
  let rows;
  try {
    rows = await mod.fetchCurrentUserAccountPlans();
  } finally {
    console.warn = originalWarn;
  }

  const planQueries = calls.filter((call) => call.object === 'Account_Plan_vod__c');
  const userQuery = calls.find((call) => call.object === 'User');
  assert.ok(planQueries.length >= 2);
  assert.deepEqual(planQueries[0].fields, ['Id', 'Name', 'Account_vod__c']);
  assert.equal(planQueries[0].where, "Account_vod__r.Hospital_Type__c = 'Authorized Treatment Center' AND Account_vod__r.Customer_Master_Status_vod__c = 'Valid_vod'");
  assert.ok(planQueries.every((query) => query.fields.every((field) => !field.includes('.'))));
  assert.ok(planQueries.some((query) => query.fields.includes('OwnerId')));
  assert.equal(calls.some((call) => call.object === 'Account_Team_Member_vod__c'), false);
  assert.ok(userQuery);
  assert.match(userQuery.where, /00541000003OwnerA/);
  assert.match(userQuery.where, /00541000003ISO0AAO/);
  const teamMemberPlan = rows.find((row) => row.id === 'a0C6T000012cTbNUAU');
  const ownerPlan = rows.find((row) => row.id === 'a0C6T000012cOwnUAU');
  assert.equal(teamMemberPlan?.ownerLastName, 'Owner');
  assert.equal(teamMemberPlan?.ownerFirstName, 'Plan');
  assert.equal(teamMemberPlan?.ownerName, 'Plan Owner');
  assert.equal(ownerPlan?.ownerLastName, 'User Owner');
});

test('ATC Cohort DLBCL uses the CRM Ecosystem Plan query and joins by Account Plan ID', async () => {
  const launcherSource = await readFile(launcherModulePath, 'utf8');
  const cohortLoader = launcherSource.match(
    /const fetchAtcCohortByPlanId = async[\s\S]*?return cohortsByPlanId;\r?\n};/
  )?.[0] || '';

  assert.match(cohortLoader, /await runCrmQuery\(\{/);
  assert.match(cohortLoader, /object:\s*ACCOUNT_PROFILE_OBJECT/);
  assert.match(cohortLoader, /fields:\s*ACCOUNT_PROFILE_COHORT_FIELDS/);
  assert.match(cohortLoader, /where:\s*`KPH_Account_Plan__c IN \$\{inClause\(ids\)\}`/);
  assert.match(cohortLoader, /row\.KPH_Account_Plan__c/);
  assert.match(cohortLoader, /row\[ACCOUNT_PROFILE_ATC_COHORT_FIELD\]/);
  assert.doesNotMatch(cohortLoader, /await runQuery\(/);
  assert.match(launcherSource, /atcCohortDlbcl:\s*atcCohortByPlanId\.get\(String\(r\.Id\)\)/);
});

test('fetchCurrentUserAccountPlans retains eligible plans when priority lookup data is unavailable', async () => {
  const { mod } = await loadLauncherModule({
    omitSecondAccount: true,
  });

  const rows = await mod.fetchCurrentUserAccountPlans();

  assert.deepEqual(rows.map((row) => row.id), [
    'a0C6T000012cOwnUAU',
    'a0C6T000012cTbNUAU',
  ]);
});

test('fetchCurrentUserAccountPlans starts independent supporting queries concurrently', async () => {
  const { mod, calls } = await loadLauncherModule({
    deferSupportingQueries: true,
  });

  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const rowsPromise = mod.fetchCurrentUserAccountPlans();
    await new Promise((resolve) => setImmediate(resolve));

    const startedObjects = calls.map((call) => call.object);
    assert.ok(startedObjects.includes('User'));
    assert.ok(startedObjects.includes('Account'));
    assert.ok(startedObjects.includes('KPH_Ecosystem_Plan__c'));

    const resolvers = [...globalThis.__accountPlanLauncherSupportingResolvers];
    resolvers.forEach((resolve) => resolve());
    const rows = await rowsPromise;
    assert.equal(rows.length, 2);
  } finally {
    console.warn = originalWarn;
  }
});

test('selected desktop account plan override drives direct shell context fetches', async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {};
  const { mod, calls } = await loadSharedModule();

  try {
    mod.setCurrentAccountPlanIdOverride('a0C6T000012cTbNUAU');
    const first = await mod.resolveShellContext();
    const second = await mod.resolveShellContext();
    assert.equal(first.planId, 'a0C6T000012cTbNUAU');
    assert.equal(second.planId, 'a0C6T000012cTbNUAU');
    assert.ok(calls.some((call) =>
      call.object === 'Account_Plan_vod__c' && String(call.where).includes('a0C6T000012cTbNUAU')
    ));

    mod.setCurrentAccountPlanIdOverride('a0CSu00004IpVE7MAN');
    const switched = await mod.resolveShellContext();
    assert.equal(switched.planId, 'a0CSu00004IpVE7MAN');
    assert.ok(calls.some((call) =>
      call.object === 'Account_Plan_vod__c' && String(call.where).includes('a0CSu00004IpVE7MAN')
    ));
  } finally {
    globalThis.window = previousWindow;
  }
});

test('hybrid selected plan uses CRM shell fields and mock Medical fields', async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {};
  try {
    const { mod, calls } = await loadHybridSharedModule();
    mod.setCurrentAccountPlanIdOverride('a0C6T000012cTbNUAU');
    const context = await mod.resolveShellContext();
    const medicalRecord = await mod.fetchPlan('a0C6T000012cTbNUAU', [
      'Id',
      'Name',
      'KPH_ATC_Profile_Category__c',
    ]);

    assert.equal(context.plan.name, 'Real Medical Account Plan');
    assert.equal(context.plan.territoryDescription, 'Real Territory Description');
    assert.equal(context.account.name, 'Real Parent Account');
    assert.equal(context.account.eid, 'REAL-EID');
    assert.equal(medicalRecord.Name, 'Real Medical Account Plan');
    assert.equal(medicalRecord.KPH_ATC_Profile_Category__c, 'Academic ATC');
    assert.ok(calls.some((call) => call.source === 'crm' && call.object === 'Account_Plan_vod__c'));
    assert.ok(calls.some((call) => call.source === 'crm' && call.object === 'Account'));
    assert.ok(calls.some((call) => call.source === 'mock' && call.object === 'Account_Plan_vod__c'));
  } finally {
    globalThis.window = previousWindow;
  }
});

test('iPad Account Plan entry point resolves the Veeva AccountPlan context keyword first', async () => {
  const previousWindow = globalThis.window;
  globalThis.window = {};
  try {
    const { mod, calls } = await loadHybridSharedModule({
      currentPlanId: 'a0C6T000012cTbNUAU',
    });
    const context = await mod.resolveShellContext();

    assert.equal(context.planId, 'a0C6T000012cTbNUAU');
    assert.equal(context.plan.name, 'Real Medical Account Plan');
    assert.deepEqual(
      calls.find((call) => call.source === 'crm-context'),
      { source: 'crm-context', object: 'AccountPlan', field: 'Id' }
    );
  } finally {
    globalThis.window = previousWindow;
  }
});

test('App has a desktop account-plan launcher without a Medical Legacy Account Plan link', async () => {
  const appSource = await readFile(appPath, 'utf8');
  const sidebarSource = await readFile(sidebarPath, 'utf8');
  const sidebarCssSource = await readFile(sidebarStylePath, 'utf8');

  assert.match(appSource, /AccountPlanLauncher/);
  assert.match(appSource, /detectRuntimeViewMode/);
  assert.match(appSource, /setCurrentAccountPlanIdOverride/);
  assert.match(appSource, /isLocalPreview\s*\|\|\s*snapshot\.viewMode\s*!==\s*'desktop'/);
  assert.doesNotMatch(appSource, /legacyAccountPlanId/);
  assert.doesNotMatch(sidebarSource, /Legacy Account Plan/);
  assert.doesNotMatch(sidebarSource, /legacyAccountPlan/);
  assert.doesNotMatch(sidebarCssSource, /sidebar-legacy-account-plan/);
});

test('desktop account-plan launcher owns vertical scroll inside the hidden shell body', async () => {
  const cssSource = await readFile(mainStylePath, 'utf8');
  const launcherFrameRule = cssSource.match(/\.account-plan-launcher-frame\s*\{[^}]+\}/)?.[0] || '';

  assert.match(launcherFrameRule, /height:\s*calc\(100vh - 24px\)/);
  assert.match(launcherFrameRule, /overflow-y:\s*auto/);
  assert.match(launcherFrameRule, /overflow-x:\s*hidden/);
});

test('desktop account-plan launcher stretches dynamically across the available frame width', async () => {
  const cssSource = await readFile(mainStylePath, 'utf8');
  const launcherRule = cssSource.match(/\.account-plan-launcher\s*\{[^}]+\}/)?.[0] || '';
  const panelRule = cssSource.match(/\.account-plan-launcher-panel\s*\{[^}]+\}/)?.[0] || '';
  const tableRule = cssSource.match(/\.account-plan-launcher-table\s*\{[^}]+\}/)?.[0] || '';

  assert.match(launcherRule, /width:\s*100%/);
  assert.match(launcherRule, /max-width:\s*none/);
  assert.match(launcherRule, /margin:\s*0/);
  assert.doesNotMatch(launcherRule, /min\(1540px,\s*100%\)/);
  assert.match(panelRule, /width:\s*100%/);
  assert.match(tableRule, /width:\s*100%/);
});

test('desktop account-plan launcher columns shrink instead of creating horizontal scroll', async () => {
  const cssSource = await readFile(mainStylePath, 'utf8');
  const tableRule = cssSource.match(/\.account-plan-launcher-table\s*\{[^}]+\}/)?.[0] || '';
  const rowRule = cssSource.match(/\.account-plan-launcher-row\s*\{[^}]+\}/)?.[0] || '';

  assert.match(tableRule, /overflow-x:\s*hidden/);
  assert.match(rowRule, /min-width:\s*0/);
  assert.doesNotMatch(rowRule, /min-width:\s*960px/);
  assert.match(
    rowRule,
    /grid-template-columns:[\s\S]*?minmax\(0,\s*1\.5fr\)[\s\S]*?minmax\(0,\s*0\.68fr\)[\s\S]*?minmax\(0,\s*1\.18fr\)[\s\S]*?68px/
  );
});

test('desktop account-plan launcher uses compact table toolbar instead of duplicate hero', async () => {
  const componentSource = await readFile(launcherComponentPath, 'utf8');
  const cssSource = await readFile(mainStylePath, 'utf8');

  assert.doesNotMatch(componentSource, /account-plan-launcher-hero/);
  assert.match(componentSource, /account-plan-launcher-panel-title/);
  assert.match(componentSource, /account-plan-launcher-search/);
  assert.match(componentSource, /key:\s*'territory'[\s\S]*?label:\s*'Territory'/);
  assert.match(componentSource, /key:\s*'submittedDate'[\s\S]*?label:\s*'Submitted Date'/);
  assert.match(componentSource, /data-label=\{column\.label\}/);
  assert.doesNotMatch(cssSource, /\.account-plan-launcher-hero/);
  assert.match(cssSource, /\.account-plan-launcher-count/);
  assert.match(cssSource, /\.account-plan-launcher-status\.is-active/);
  assert.match(cssSource, /\.account-plan-launcher-row:not\(\.is-head\):hover/);
});

test('desktop account-plan launcher combines owner name and exposes all sortable list columns', async () => {
  const componentSource = await readFile(launcherComponentPath, 'utf8');
  const cssSource = await readFile(mainStylePath, 'utf8');
  const columnsBlock = componentSource.match(/const ACCOUNT_PLAN_LAUNCHER_COLUMNS = \[([\s\S]*?)\];/)?.[1] || '';

  assert.doesNotMatch(componentSource, /import TableSortButton/);
  assert.match(componentSource, /function LauncherSortButton/);
  assert.match(componentSource, /stableSortRows/);
  assert.match(componentSource, /nextTableSort/);
  assert.match(componentSource, /toDateSortValue/);
  assert.match(columnsBlock, /key:\s*'name'[\s\S]*?label:\s*'Account Plan Name'/);
  assert.match(columnsBlock, /key:\s*'ownerName'[\s\S]*?label:\s*'Owner Name'/);
  assert.doesNotMatch(columnsBlock, /Owner Last Name|Owner First Name/);
  assert.match(columnsBlock, /key:\s*'marketAccessPrioritizedAccount'[\s\S]*?label:\s*'Market Access Prioritized Account'/);
  assert.match(columnsBlock, /key:\s*'mmAtcPriorityAccount'[\s\S]*?label:\s*'MM ATC Priority Account'/);
  assert.match(columnsBlock, /key:\s*'atcCohortDlbcl'[\s\S]*?label:\s*'ATC Cohort DLBCL'/);
  assert.match(columnsBlock, /key:\s*'planStatus'/);
  assert.match(columnsBlock, /key:\s*'territory'/);
  assert.match(columnsBlock, /key:\s*'territoryDescription'/);
  assert.match(columnsBlock, /key:\s*'atcCertifiedDate'[\s\S]*?type:\s*'date'/);
  assert.match(columnsBlock, /key:\s*'lastFieldDirectorReviewDate'[\s\S]*?label:\s*'Last FD Review'[\s\S]*?type:\s*'date'/);
  assert.match(columnsBlock, /key:\s*'submittedDate'[\s\S]*?type:\s*'date'/);
  assert.match(componentSource, /formatDate\(plan\[column\.key\], '-'\)/);
  assert.match(componentSource, /return plan\[column\.key\] \|\| '-'/);
  assert.match(componentSource, /\{ACCOUNT_PLAN_LAUNCHER_COLUMNS\.map\(\(column\) =>/);
  assert.match(componentSource, /<LauncherSortButton column=\{column\} sort=\{sort\} onSort=\{handleSort\}/);
  assert.match(componentSource, /account-plan-launcher-sort-label/);
  assert.match(componentSource, /account-plan-launcher-sort-slot/);
  assert.match(componentSource, /data-label=\{column\.label\}/);
  assert.match(componentSource, /<small>\{plan\.eid \|\| '-'\}<\/small>/);
  assert.match(
    cssSource,
    /account-plan-launcher-row\s*\{[\s\S]*?grid-template-columns:[\s\S]*?minmax\(0,\s*1\.5fr\)[\s\S]*?minmax\(0,\s*0\.68fr\)[\s\S]*?minmax\(0,\s*1\.18fr\)[\s\S]*?68px/
  );
  assert.match(
    cssSource,
    /account-plan-launcher-row > span:last-child\s*\{[\s\S]*?padding-left:\s*6px[\s\S]*?padding-right:\s*6px[\s\S]*?text-align:\s*center/
  );
  assert.match(
    cssSource,
    /account-plan-launcher-open\s*\{[\s\S]*?height:\s*32px[\s\S]*?min-width:\s*52px[\s\S]*?font-size:\s*12px/
  );
  assert.match(
    cssSource,
    /account-plan-launcher-row > \.account-plan-launcher-plan-name\s*\{[\s\S]*?overflow:\s*visible[\s\S]*?text-overflow:\s*clip[\s\S]*?white-space:\s*normal/
  );
  assert.match(
    cssSource,
    /account-plan-launcher-plan-name strong\s*\{[\s\S]*?font-size:\s*12px[\s\S]*?line-height:\s*1\.18[\s\S]*?overflow-wrap:\s*anywhere[\s\S]*?text-overflow:\s*clip[\s\S]*?white-space:\s*normal/
  );
  assert.match(cssSource, /account-plan-launcher-sort-button/);
  assert.match(
    cssSource,
    /account-plan-launcher-sort-button\s*\{[\s\S]*?display:\s*grid[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*16px[\s\S]*?column-gap:\s*5px[\s\S]*?width:\s*100%[\s\S]*?overflow:\s*hidden/
  );
  assert.match(
    cssSource,
    /account-plan-launcher-sort-label\s*\{[\s\S]*?overflow:\s*hidden[\s\S]*?white-space:\s*normal[\s\S]*?hyphens:\s*none[\s\S]*?word-break:\s*normal/
  );
  assert.match(
    cssSource,
    /account-plan-launcher-sort-slot\s*\{[\s\S]*?width:\s*16px[\s\S]*?height:\s*14px/
  );
  assert.match(
    cssSource,
    /account-plan-launcher-row\.is-head > span\s*\{[\s\S]*?font-size:\s*9px/
  );
});

test('mock filter supports Account Plan launcher access OR clauses', async () => {
  const { filterByWhere } = await import(`${fixturesModulePath.href}?${Date.now()}`);
  const rows = [
    { Id: { value: 'plan-1' }, OwnerId: { value: 'user-a' }, KPH_Is_Deleted__c: { value: false } },
    { Id: { value: 'plan-2' }, OwnerId: { value: 'user-b' }, KPH_Is_Deleted__c: { value: false } },
    { Id: { value: 'plan-3' }, OwnerId: { value: 'user-c' }, KPH_Is_Deleted__c: { value: false } },
  ];

  assert.deepEqual(
    filterByWhere(rows, "Id IN ('plan-2')").map((row) => row.Id.value),
    ['plan-2']
  );
  assert.deepEqual(
    filterByWhere(rows, "Id IN {'plan-1'}").map((row) => row.Id.value),
    ['plan-1']
  );
  assert.deepEqual(
    filterByWhere(rows, "(Id IN ('plan-2') OR OwnerId = 'user-a')").map((row) => row.Id.value),
    ['plan-1', 'plan-2']
  );
});

test('launcher excludes plans with invalid or non-ATC accounts before enrichment', async () => {
  for (const options of [
    { invalidSecondAccount: true },
    { secondHospitalType: 'Hospital' },
    { secondHospitalType: null },
  ]) {
    const { mod, calls } = await loadLauncherModule(options);
    const rows = await mod.fetchCurrentUserAccountPlans();
    assert.deepEqual(rows.map((row) => row.id), ['a0C6T000012cTbNUAU']);
    const optionalQuery = calls.find((call) => call.object === 'Account_Plan_vod__c' && call.fields.includes('OwnerId'));
    assert.doesNotMatch(optionalQuery.where, /a0C6T000012cOwnUAU/);
  }
});
