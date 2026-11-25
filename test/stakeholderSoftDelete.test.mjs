import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const stakeholdersModulePath = new URL('../src/lib/dataservice/accountPlan/stakeholders.js', import.meta.url);
const stakeholdersPagePath = new URL('../src/pages/Stakeholders/index.jsx', import.meta.url);
const teamMembersModulePath = new URL('../src/lib/dataservice/accountPlan/teamMembers.js', import.meta.url);
const teamMembersPagePath = new URL('../src/pages/TeamMembers/index.jsx', import.meta.url);
const teamMemberModalPath = new URL('../src/pages/TeamMembers/TeamMemberEditModal.jsx', import.meta.url);
const overviewPagePath = new URL('../src/pages/Overview/index.jsx', import.meta.url);
const accountProfileModulePath = new URL('../src/lib/dataservice/accountPlan/accountProfile.js', import.meta.url);
const healthcareNetworkModalPath = new URL('../src/pages/AccountProfile/HealthcareNetworkEditModal.jsx', import.meta.url);
const accountInsightModalPath = new URL('../src/pages/AccountProfile/AccountInsightEditModal.jsx', import.meta.url);

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const desktopRecordNotFoundError = () => ({
  actions: [
    {
      state: 'ERROR',
      error: [
        {
          event: {
            descriptor: 'markup://aura:serverActionError',
            attributes: {
              values: {
                error: {
                  message: 'The requested resource does not exist',
                  data: {
                    message: 'The requested resource does not exist',
                    statusCode: 404,
                    errorCode: 'NOT_FOUND',
                  },
                },
              },
            },
          },
        },
      ],
    },
  ],
});

const loadSharedModule = async ({
  online = false,
  updateError = null,
  teamMemberRows = null,
  veevaRuntime = false,
  missingStakeholderAccountId = null,
  missingPrimaryParentAccountId = null,
} = {}) => {
  globalThis.__stakeholderSoftDeleteQueries = [];
  globalThis.__stakeholderSoftDeleteCrmQueries = [];
  globalThis.__stakeholderSoftDeleteUpdates = [];
  globalThis.__stakeholderSoftDeleteUpdateError = updateError;
  globalThis.__stakeholderSoftDeleteTeamMemberRows = teamMemberRows;
  globalThis.__stakeholderSoftDeleteMissingAccountId = missingStakeholderAccountId;
  globalThis.__stakeholderSoftDeleteMissingParentAccountId = missingPrimaryParentAccountId;

  const queryStubUrl = dataModule(`
    export const runQuery = (params) => {
      globalThis.__stakeholderSoftDeleteQueries.push(params);
      if (params.object === 'User') {
        return Promise.resolve([{
          Id: '0058C00000CtamUser',
          Name: 'CTAM User',
          Profile_Name_vod__c: 'KPH-CTAM',
        }]);
      }
      if (params.object === 'Account') {
        if (/MockHcp1|SiteOnly/.test(params.where || '')) {
          const stakeholderAccounts = [
            {
              Id: '0038C00000MockHcp1',
              Name: 'Elena Martin',
              Primary_Parent_vod__c: {
                value: '0018C00000Parent1',
                display: '0018C00000Parent1',
              },
              'Primary_Parent_vod__r.Name': {
                value: 'Northern Oncology Associates',
                display: 'Northern Oncology Associates',
              },
            },
            {
              Id: '0018C00000SiteOnly',
              Name: 'Site Account',
              Primary_Parent_vod__c: null,
              'Primary_Parent_vod__r.Name': null,
            },
          ];
          return Promise.resolve(
            stakeholderAccounts.filter(
              (row) => row.Id !== globalThis.__stakeholderSoftDeleteMissingAccountId
            )
          );
        }
        const primaryParentAccounts = [{
            Id: '0018C00000Parent1',
            Name: 'Northern Oncology Associates',
          }];
        return Promise.resolve(
          primaryParentAccounts.filter(
            (row) => row.Id !== globalThis.__stakeholderSoftDeleteMissingParentAccountId
          )
        );
      }
      if (params.object === 'Account_Team_Member_vod__c') {
        return Promise.resolve(globalThis.__stakeholderSoftDeleteTeamMemberRows || []);
      }
      return Promise.resolve([
        {
          Id: 'stk-visible',
          CreatedById: '0058C00000CtamUser',
          KPH_Account_Plan__c: 'plan-001',
          KPH_Account__c: '0038C00000MockHcp1',
          KPH_Account_Name__c: 'Elena Stakeholder Fallback',
          KPH_First_Name__c: 'Elena',
          KPH_Last_Name__c: 'Martin',
          KPH_Title__c: 'Cell Therapy Director',
          KPH_Other_Title__c: 'Clinical Research Coordinator',
          Stakeholder_EID__c: '118822',
          KPH_Primary_Parent_Name__c: 'Northern Oncology Associates',
          KPH_Name_Of_Site2__c: 'Legacy Site Value',
          KPH_Is_Deleted__c: false,
        },
        {
          Id: 'stk-non-person',
          CreatedById: '0058C00000CtamUser',
          KPH_Account_Plan__c: 'plan-001',
          KPH_Account__c: '0018C00000SiteOnly',
          KPH_Account_Name__c: 'Site Account from Stakeholder',
          KPH_First_Name__c: 'Site',
          KPH_Last_Name__c: 'Account',
          KPH_Is_Deleted__c: false,
        },
      ]);
    };
    export const runCrmQuery = (params) => {
      globalThis.__stakeholderSoftDeleteCrmQueries.push(params);
      return runQuery(params);
    };
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const getCrmDataForCurrentObject = () => Promise.resolve(null);
    export const unwrap = (row) => row || null;
    export const buildIdMatchWhere = (field, id) => id ? field + " = '" + id + "'" : '';
    export const toCanonicalSalesforceId = (id) => {
      if (!id) return null;
      return String(id).length === 15 ? String(id) + 'XYZ' : String(id);
    };
    export const salesforceIdVariants = (id) => id ? [id] : [];
    export const createRecord = () => Promise.resolve({ data: { id: 'new-stakeholder-id' } });
    export const createCrmRecord = createRecord;
    export const updateRecord = (object, id, fields) => {
      globalThis.__stakeholderSoftDeleteUpdates.push({ object, id, fields });
      if (globalThis.__stakeholderSoftDeleteUpdateError) {
        return Promise.reject(globalThis.__stakeholderSoftDeleteUpdateError);
      }
      return Promise.resolve({ data: { id } });
    };
  `);
  const clientStubUrl = dataModule(`
    export const bindAccountPlanDataContext = (id) => id;
    export const hasVeevaRuntime = () => ${veevaRuntime ? 'true' : 'false'};
    export const isMockRuntime = true;
    export const isOnline = () => ${online ? 'true' : 'false'};
  `);
  const approvalReviewDateStubUrl = dataModule(`
    export const acceptedApprovalReviewDate = () => null;
  `);

  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalReviewDateStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return {
    mod,
    queries: globalThis.__stakeholderSoftDeleteQueries,
    crmQueries: globalThis.__stakeholderSoftDeleteCrmQueries,
    updates: globalThis.__stakeholderSoftDeleteUpdates,
  };
};

test('fetchStakeholders reads stakeholder and related Account fields directly from CRM', async () => {
  const { mod, queries, crmQueries } = await loadSharedModule({ veevaRuntime: true });

  const rows = await mod.fetchStakeholders('plan-001');

  const stakeholderQuery = queries.find((query) => query.object === 'KPH_Stakeholder_Map__c');
  assert.ok(stakeholderQuery);
  assert.deepEqual(stakeholderQuery.fields, [
    'Id',
    'KPH_Account_Plan__c',
    'KPH_Account__c',
    'KPH_Account_Name__c',
    'KPH_Title__c',
    'KPH_Other_Title__c',
    'KPH_Primary_Parent_Name__c',
    'Stakeholder_EID__c',
    'KPH_Is_Deleted__c',
  ]);
  assert.equal(stakeholderQuery.allowDottedFields, undefined);
  assert.ok(stakeholderQuery.fields.every((field) => !field.includes('.')));
  assert.match(stakeholderQuery.where, /KPH_Account_Plan__c = 'plan-001'/);
  assert.doesNotMatch(stakeholderQuery.where, /KPH_Account__r\.IsPersonAccount/);
  assert.match(stakeholderQuery.where, /KPH_Is_Deleted__c\s*=\s*false/);
  assert.match(stakeholderQuery.where, /KPH_Is_Deleted__c\s*=\s*null/);

  const accountQueries = queries.filter((query) => query.object === 'Account');
  assert.equal(accountQueries.length, 1);
  const stakeholderAccountQuery = accountQueries.find((query) => /MockHcp1|SiteOnly/.test(query.where));
  assert.ok(stakeholderAccountQuery);
  assert.deepEqual(stakeholderAccountQuery.fields, ['Id', 'Name']);
  assert.match(stakeholderAccountQuery.where, /^(?:Id = '[^']+'(?: OR )?)+$/);
  assert.doesNotMatch(stakeholderAccountQuery.where, /IsPersonAccount/);
  assert.equal(stakeholderAccountQuery.sort, undefined);
  assert.equal(stakeholderAccountQuery.allowDottedFields, undefined);
  assert.deepEqual(rows.map((row) => row.id), ['stk-visible', 'stk-non-person']);
  assert.deepEqual(rows[0], {
    id: 'stk-visible',
    name: 'Elena Martin',
    stakeholderId: '118822',
    profileRecordId: '0038C00000MockHcp1',
    role: 'Cell Therapy Director',
    otherRole: 'Clinical Research Coordinator',
    primaryParent: 'Northern Oncology Associates',
  });
  assert.deepEqual(rows[1], {
    id: 'stk-non-person',
    name: 'Site Account',
    stakeholderId: null,
    profileRecordId: '0018C00000SiteOnly',
    role: null,
    otherRole: null,
    primaryParent: null,
  });
  assert.deepEqual(
    crmQueries.map((query) => query.object),
    ['KPH_Stakeholder_Map__c', 'Account']
  );
});

test('fetchStakeholders keeps local preview reads on the mock-backed query channel', async () => {
  const { mod, crmQueries } = await loadSharedModule();

  await mod.fetchStakeholders('plan-001');

  assert.deepEqual(crmQueries, []);
});

test('fetchStakeholders logs exact CRM queries, responses, ids, and final joins', async () => {
  const { mod } = await loadSharedModule({ veevaRuntime: true });
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => {
    if (String(args[0] || '').startsWith('[KPH Stakeholders]')) logs.push(args);
  };

  try {
    await mod.fetchStakeholders('plan-001');
  } finally {
    console.log = originalLog;
  }

  assert.deepEqual(
    logs.map(([label]) => label),
    [
      '[KPH Stakeholders][1/2] Stakeholder Map query',
      '[KPH Stakeholders][1/2] Stakeholder Map response',
      '[KPH Stakeholders][2/2] Stakeholder Account query',
      '[KPH Stakeholders][2/2] Stakeholder Account response',
      '[KPH Stakeholders] Final joined rows',
    ]
  );
  assert.equal(
    logs[0][1].soql,
    "SELECT Id, KPH_Account_Plan__c, KPH_Account__c, KPH_Account_Name__c, KPH_Title__c, KPH_Other_Title__c, KPH_Primary_Parent_Name__c, Stakeholder_EID__c, KPH_Is_Deleted__c FROM KPH_Stakeholder_Map__c WHERE KPH_Account_Plan__c = 'plan-001' AND (KPH_Is_Deleted__c = false OR KPH_Is_Deleted__c = null) ORDER BY Name ASC"
  );
  assert.deepEqual(logs[2][1].accountIds, [
    '0038C00000MockHcp1',
    '0018C00000SiteOnly',
  ]);
  assert.equal(
    logs[2][1].soql,
    "SELECT Id, Name FROM Account WHERE Id = '0038C00000MockHcp1' OR Id = '0018C00000SiteOnly'"
  );
  assert.deepEqual(logs[4][1].rows[0], {
    stakeholderMapId: 'stk-visible',
    stakeholderAccountId: '0038C00000MockHcp1',
    stakeholderName: 'Elena Martin',
    primaryParentField: 'KPH_Primary_Parent_Name__c',
    primaryParentName: 'Northern Oncology Associates',
  });
});

test('fetchStakeholders uses the direct Stakeholder Map primary parent name', async () => {
  const { mod } = await loadSharedModule({ veevaRuntime: true });

  const rows = await mod.fetchStakeholders('plan-001');

  assert.equal(rows[0].primaryParent, 'Northern Oncology Associates');
});

test('fetchStakeholders does not hide a stakeholder when its Account lookup is missing', async () => {
  const { mod } = await loadSharedModule({
    veevaRuntime: true,
    missingStakeholderAccountId: '0018C00000SiteOnly',
  });

  const rows = await mod.fetchStakeholders('plan-001');

  assert.deepEqual(rows.map((row) => row.id), ['stk-visible', 'stk-non-person']);
  assert.equal(rows[1].name, 'Site Account from Stakeholder');
  assert.equal(rows[1].profileRecordId, '0018C00000SiteOnly');
  assert.equal(rows[1].primaryParent, null);
});

test('deleteStakeholder soft deletes the stakeholder map record', async () => {
  const { mod, updates } = await loadSharedModule();

  await mod.deleteStakeholder('stk-001');

  assert.deepEqual(updates[0], {
    object: 'KPH_Stakeholder_Map__c',
    id: 'stk-001',
    fields: { KPH_Is_Deleted__c: true },
  });
});

test('fetchTeamMembersByPlan excludes soft-deleted Account_Team_Member_vod__c records', async () => {
  const { mod, queries } = await loadSharedModule();

  await mod.fetchTeamMembersByPlan('plan-001');

  const teamMemberQuery = queries.find((query) => query.object === 'Account_Team_Member_vod__c');
  assert.ok(teamMemberQuery);
  assert.deepEqual(teamMemberQuery.fields, [
    'Id',
    'Account_Plan_vod__c',
    'Team_Member_Name_vod__c',
    'KPH_Role__c',
    'Account_Team_Member_Active__c',
    'KPH_Participation__c',
    'Team_Member_vod__c',
    'KPH_Is_Deleted__c',
  ]);
  assert.match(teamMemberQuery.where, /Account_Plan_vod__c = 'plan-001'/);
  assert.match(teamMemberQuery.where, /KPH_Is_Deleted__c\s*=\s*false/);
  assert.match(teamMemberQuery.where, /KPH_Is_Deleted__c\s*=\s*null/);
  assert.deepEqual(teamMemberQuery.sort, ['Team_Member_Name_vod__c ASC']);
});

test('fetchTeamMembersByPlan maps only the configured CRM display fields', async () => {
  const { mod } = await loadSharedModule({
    teamMemberRows: [
      {
        Id: 'tm-mapped',
        Account_Plan_vod__c: 'plan-001',
        Team_Member_Name_vod__c: 'Mapped Name',
        Name: 'Wrong Fallback Name',
        KPH_Role__c: 'Mapped Role',
        Role_vod__c: 'Wrong Fallback Role',
        Account_Team_Member_Active__c: { value: true, display: 'Active' },
        KPH_Participation__c: 'Core',
      },
    ],
  });

  const rows = await mod.fetchTeamMembersByPlan('plan-001');

  assert.deepEqual(rows[0], {
    id: 'tm-mapped',
    userId: null,
    name: 'Mapped Name',
    role: 'Mapped Role',
    functionName: 'Mapped Role',
    participation: 'Core',
    isPrimary: true,
  });
});

test('fetchTeamMembersByPlan maps wrapped CRM active flag into team member status', async () => {
  const { mod } = await loadSharedModule({
    teamMemberRows: [
      {
        Id: 'tm-active',
        Name: 'Priya Kumar',
        Account_Team_Member_Active__c: { value: true, display: 'Active' },
      },
      {
        Id: 'tm-inactive',
        Name: 'James Chen',
        Account_Team_Member_Active__c: { value: false, display: 'Inactive' },
      },
    ],
  });

  const rows = await mod.fetchTeamMembersByPlan('plan-001');
  const activeById = Object.fromEntries(rows.map((row) => [row.id, row.isPrimary]));

  assert.equal(activeById['tm-active'], true);
  assert.equal(activeById['tm-inactive'], false);
});

test('deleteTeamMember soft deletes the team member record', async () => {
  const { mod, updates } = await loadSharedModule();

  await mod.deleteTeamMember('tm-001');

  assert.deepEqual(updates[0], {
    object: 'Account_Team_Member_vod__c',
    id: 'tm-001',
    fields: { KPH_Is_Deleted__c: true },
  });
});

test('fetchReferralAccounts excludes soft-deleted referral mapping records', async () => {
  const { mod, queries } = await loadSharedModule();

  await mod.fetchReferralAccounts('plan-001', 'profile-001');

  const referralQuery = queries.find((query) => query.object === 'KPH_Ecosystem_Map_Dynamics__c');
  assert.ok(referralQuery);
  assert.ok(referralQuery.fields.includes('KPH_Is_Deleted__c'));
  assert.match(referralQuery.where, /Account_Plan_vod__c = 'plan-001'/);
  assert.match(referralQuery.where, /KPH_Account_Profile__c = 'profile-001'/);
  assert.match(referralQuery.where, /KPH_Is_Deleted__c\s*=\s*false/);
  assert.match(referralQuery.where, /KPH_Is_Deleted__c\s*=\s*null/);
});

test('deleteReferralAccount soft deletes the referral mapping record', async () => {
  const { mod, updates } = await loadSharedModule();

  await mod.deleteReferralAccount('ref-001');

  assert.deepEqual(updates[0], {
    object: 'KPH_Ecosystem_Map_Dynamics__c',
    id: 'ref-001',
    fields: { KPH_Is_Deleted__c: true },
  });
});

test('fetchHealthcareNetworks excludes soft-deleted other healthcare network records', async () => {
  const { mod, queries } = await loadSharedModule();

  await mod.fetchHealthcareNetworks('profile-001');

  const healthcareNetworkQuery = queries.find((query) => query.object === 'KPH_Other_Healthcare_Networks__c');
  assert.ok(healthcareNetworkQuery);
  assert.ok(healthcareNetworkQuery.fields.includes('KPH_Is_Deleted__c'));
  assert.doesNotMatch(healthcareNetworkQuery.where, /KPH_Account_Name__c/);
  assert.match(healthcareNetworkQuery.where, /KPH_Account_Profile__c = 'profile-001'/);
  assert.match(healthcareNetworkQuery.where, /KPH_Is_Deleted__c\s*=\s*false/);
  assert.match(healthcareNetworkQuery.where, /KPH_Is_Deleted__c\s*=\s*null/);
});

test('deleteHealthcareNetwork soft deletes the other healthcare network record', async () => {
  const { mod, updates } = await loadSharedModule();

  await mod.deleteHealthcareNetwork('net-001');

  assert.deepEqual(updates[0], {
    object: 'KPH_Other_Healthcare_Networks__c',
    id: 'net-001',
    fields: { KPH_Is_Deleted__c: true },
  });
});

test('fetchAccountInsights excludes soft-deleted monthly executive summary records', async () => {
  const { mod, queries } = await loadSharedModule();

  await mod.fetchAccountInsights('plan-001', 'profile-001');

  const accountInsightQuery = queries.find((query) => query.object === 'KPH_Monthly_Executive_Summary__c');
  assert.ok(accountInsightQuery);
  assert.ok(accountInsightQuery.fields.includes('KPH_Is_Deleted__c'));
  assert.doesNotMatch(accountInsightQuery.where, /KPH_Account_Plan__c/);
  assert.match(accountInsightQuery.where, /KPH_Account_Profile__c = 'profile-001'/);
  assert.match(accountInsightQuery.where, /KPH_Is_Deleted__c\s*=\s*false/);
  assert.match(accountInsightQuery.where, /KPH_Is_Deleted__c\s*=\s*null/);
});

test('deleteAccountInsight soft deletes the monthly executive summary record', async () => {
  const { mod, updates } = await loadSharedModule();

  await mod.deleteAccountInsight('insight-001');

  assert.deepEqual(updates[0], {
    object: 'KPH_Monthly_Executive_Summary__c',
    id: 'insight-001',
    fields: { KPH_Is_Deleted__c: true },
  });
});

test('desktop soft deletes canonicalize 15-character record ids for online updateRecord', async () => {
  const { mod, updates } = await loadSharedModule({ online: true });

  await mod.deleteTeamMember('a4D8C00000ABCDE');
  await mod.deleteStakeholder('a5E8C00000ABCDE');
  await mod.deleteReferralAccount('a5k8C00000ABCDE');
  await mod.deleteHealthcareNetwork('a5n8C00000ABCDE');
  await mod.deleteAccountInsight('a5s8C00000ABCDE');

  assert.deepEqual(
    updates.map((update) => [update.object, update.id]),
    [
      ['Account_Team_Member_vod__c', 'a4D8C00000ABCDEXYZ'],
      ['KPH_Stakeholder_Map__c', 'a5E8C00000ABCDEXYZ'],
      ['KPH_Ecosystem_Map_Dynamics__c', 'a5k8C00000ABCDEXYZ'],
      ['KPH_Other_Healthcare_Networks__c', 'a5n8C00000ABCDEXYZ'],
      ['KPH_Monthly_Executive_Summary__c', 'a5s8C00000ABCDEXYZ'],
    ]
  );
  assert.ok(updates.every((update) => update.fields.KPH_Is_Deleted__c === true));
});

test('desktop soft delete treats Aura NOT_FOUND after update as successful delete', async () => {
  const { mod, updates } = await loadSharedModule({
    online: true,
    updateError: desktopRecordNotFoundError(),
  });

  const result = await mod.deleteStakeholder('a5E8C00000ABCDE');

  assert.deepEqual(updates[0], {
    object: 'KPH_Stakeholder_Map__c',
    id: 'a5E8C00000ABCDEXYZ',
    fields: { KPH_Is_Deleted__c: true },
  });
  assert.equal(result.success, true);
  assert.equal(result.desktopNotFoundAfterDelete, true);
  assert.deepEqual(result.data, { id: 'a5E8C00000ABCDEXYZ' });
});

test('iPad soft delete does not swallow Aura NOT_FOUND update errors', async () => {
  const error = desktopRecordNotFoundError();
  const { mod, updates } = await loadSharedModule({ updateError: error });

  await assert.rejects(() => mod.deleteStakeholder('a5E8C00000ABCDE'), (actual) => actual === error);

  assert.deepEqual(updates[0], {
    object: 'KPH_Stakeholder_Map__c',
    id: 'a5E8C00000ABCDE',
    fields: { KPH_Is_Deleted__c: true },
  });
});

test('desktop soft delete still surfaces non-NOT_FOUND update errors', async () => {
  const error = new Error('Validation failed');
  const { mod } = await loadSharedModule({ online: true, updateError: error });

  await assert.rejects(() => mod.deleteStakeholder('a5E8C00000ABCDE'), (actual) => actual === error);
});

test('Stakeholders page does not wire mutation modals or delete actions', async () => {
  const pageSource = await readFile(stakeholdersPagePath, 'utf8');
  const dataModuleSource = await readFile(stakeholdersModulePath, 'utf8');

  assert.match(dataModuleSource, /deleteStakeholder/);
  assert.doesNotMatch(pageSource, /StakeholderEditModal|deleteStakeholder|createStakeholder|updateStakeholder/);
  assert.doesNotMatch(pageSource, /onDelete=|onSave=|onOpenEdit=|onAdd=/);
});

test('Team Members page and Home modal wire delete through TeamMemberEditModal', async () => {
  const teamMembersModuleSource = await readFile(teamMembersModulePath, 'utf8');
  const teamMembersPageSource = await readFile(teamMembersPagePath, 'utf8');
  const teamMemberModalSource = await readFile(teamMemberModalPath, 'utf8');
  const overviewPageSource = await readFile(overviewPagePath, 'utf8');

  assert.match(teamMembersModuleSource, /deleteTeamMember/);
  assert.match(teamMembersPageSource, /deleteTeamMember/);
  assert.match(teamMembersPageSource, /const deleteMember = async \(member\) =>/);
  assert.match(teamMembersPageSource, /setRows\(\(current\) => current\.filter\(\(row\) => row\.id !== member\.id\)\)/);
  assert.match(teamMembersPageSource, /onDelete=\{deleteMember\}/);
  assert.match(overviewPageSource, /deleteTeamMember/);
  assert.match(overviewPageSource, /const handleDeleteMember = async \(member\) =>/);
  assert.match(overviewPageSource, /onDelete=\{handleDeleteMember\}/);
  assert.match(teamMemberModalSource, /Confirm delete for this team member record/);
  assert.match(teamMemberModalSource, /Confirm Delete/);
  assert.match(teamMemberModalSource, /Keep Record/);
});

test('Healthcare Network delete uses soft delete export and confirmation UI', async () => {
  const moduleSource = await readFile(accountProfileModulePath, 'utf8');
  const modalSource = await readFile(healthcareNetworkModalPath, 'utf8');

  assert.match(moduleSource, /deleteHealthcareNetwork as softDeleteHealthcareNetwork/);
  assert.match(moduleSource, /export const deleteHealthcareNetwork = softDeleteHealthcareNetwork/);
  assert.doesNotMatch(moduleSource, /deleteRecord\('KPH_Other_Healthcare_Networks__c'/);
  assert.match(modalSource, /const \[deleteConfirm, setDeleteConfirm\] = useState\(false\);/);
  assert.match(modalSource, /Confirm delete for this healthcare network record/);
  assert.match(modalSource, /Confirm Delete/);
  assert.match(modalSource, /Keep Record/);
  assert.match(
    modalSource,
    /!deleteConfirm && \(\s*<>\s*<button[\s\S]*?>\s*Cancel\s*<\/button>[\s\S]*<button type="submit"[\s\S]*>\s*\{isSaving \? 'Saving' : 'Save'\}\s*<\/button>\s*<\/>\s*\)/
  );
});

test('Account Insight delete confirmation also hides generic Cancel and Save actions', async () => {
  const modalSource = await readFile(accountInsightModalPath, 'utf8');

  assert.match(modalSource, /const \[deleteConfirm, setDeleteConfirm\] = useState\(false\);/);
  assert.match(modalSource, /deleteConfirm && \(/);
  assert.match(modalSource, /!deleteConfirm && \(/);
  assert.match(modalSource, /Confirm delete for this account insight record/);
  assert.match(modalSource, /Confirm Delete/);
  assert.match(modalSource, /Keep Record/);
  assert.match(
    modalSource,
    /!deleteConfirm && \(\s*<>\s*<button[\s\S]*?>\s*Cancel\s*<\/button>[\s\S]*<button type="submit"[\s\S]*>\s*\{isSaving \? 'Saving' : 'Save'\}\s*<\/button>\s*<\/>\s*\)/
  );
});
