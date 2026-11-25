import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const dataModule = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;

const sharedModulePath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);
const teamMembersModulePath = new URL('../src/lib/dataservice/accountPlan/teamMembers.js', import.meta.url);
const teamMembersPagePath = new URL('../src/pages/TeamMembers/index.jsx', import.meta.url);
const teamMemberModalPath = new URL('../src/pages/TeamMembers/TeamMemberEditModal.jsx', import.meta.url);
const teamMembersCssPath = new URL('../src/pages/TeamMembers/TeamMembers.css', import.meta.url);

const loadSharedModule = async () => {
  globalThis.__teamMemberLookupQueries = [];

  const queryStubUrl = dataModule(`
    export const runQuery = (params) => {
      globalThis.__teamMemberLookupQueries.push(params);
      return Promise.resolve([{ Id: '0058C00000UserAAA', Name: 'Albin Karimattam' }]);
    };
    export const runCrmQuery = runQuery;
    export const getDataForCurrentObject = () => Promise.resolve(null);
    export const getCrmDataForCurrentObject = () => Promise.resolve(null);
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
    export const hasVeevaRuntime = () => false;
    export const isMockRuntime = true;
    export const isOnline = () => false;
  `);
  const approvalReviewDateStubUrl = dataModule(`
    export const acceptedApprovalReviewDate = () => null;
  `);

  const source = (await readFile(sharedModulePath, 'utf8'))
    .replace(/from ['"]@\/lib\/dataservice\/query['"]/g, `from '${queryStubUrl}'`)
    .replace(/from ['"]@\/lib\/dataservice\/client['"]/g, `from '${clientStubUrl}'`)
    .replace(/from ['"]@\/lib\/approvalReviewDate['"]/g, `from '${approvalReviewDateStubUrl}'`);

  const mod = await import(`${dataModule(source)}#${Date.now()}-${Math.random()}`);
  return { mod, queries: globalThis.__teamMemberLookupQueries };
};

test('team member popup lookup queries User records', async () => {
  const { mod, queries } = await loadSharedModule();

  const rows = await mod.searchUsers('albin', 60);

  assert.equal(queries[0].object, 'User');
  assert.deepEqual(queries[0].fields, ['Id', 'Name']);
  assert.match(queries[0].where, /Name LIKE '%albin%'/);
  assert.deepEqual(rows, [{ id: '0058C00000UserAAA', name: 'Albin Karimattam' }]);
});

test('Team Member names navigate through the current Veeva runtime', async () => {
  const pageSource = await readFile(teamMembersPagePath, 'utf8');
  assert.match(pageSource, /await viewRecord\('User', member.userId\)/);
  assert.match(pageSource, /event.preventDefault\(\)/);
  assert.match(pageSource, /onClick=\{openUserRecord\}/);
  assert.match(pageSource, /role="alert"/);
  assert.doesNotMatch(pageSource, /https:\/\/.*(?:salesforce|force)\.com/);
});

test('existing Medical team members expose participation as the only editable field', async () => {
  const modalSource = await readFile(teamMemberModalPath, 'utf8');

  assert.match(modalSource, /TEAM_MEMBER_NAME_FIELD[\s\S]*?key: 'name'[\s\S]*?readOnly: true/);
  assert.match(modalSource, /\{isNew \? \([\s\S]*?<AccountLookupField[\s\S]*?\) : \([\s\S]*?field=\{TEAM_MEMBER_NAME_FIELD\}/);
  assert.match(modalSource, /\{ label: 'Role', key: 'role', readOnly: true/);
  assert.match(modalSource, /\{ label: 'Status', key: 'status', readOnly: true/);
  assert.match(modalSource, /\{ label: 'Participation', key: 'participation', readOnly: false/);
  assert.match(modalSource, /if \(isNew && searchUsers && !form\.userId\)/);
});

const navigation = await import(dataModule(await readFile(new URL('../src/lib/helper/userRecordNavigation.js', import.meta.url), 'utf8')));
test('hosted User links use the actual CRM org and reject untrusted origins or IDs', () => {
  const id = '0058C00000UserA';
  for (const origin of ['https://kitepharma--kitefull.sandbox.lightning.force.com', 'https://different.lightning.force.com', 'https://different.my.salesforce.com']) {
    assert.equal(navigation.hostedUserRecordUrl(id, origin + '/'), origin + '/lightning/r/User/' + id + '/view');
  }
  for (const referrer of ['', 'file:///index.html', 'https://evil.example', 'https://x.lightning.force.com.evil.example', 'http://x.lightning.force.com']) {
    assert.equal(navigation.hostedUserRecordUrl(id, referrer), null);
  }
  assert.equal(navigation.hostedUserRecordUrl('../other', 'https://x.lightning.force.com'), null);
});
